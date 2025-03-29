import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Loader2, Upload } from "lucide-react";

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [logoUrl, setLogoUrl] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch logo URL
  const { data: logoData, isLoading: isLogoLoading } = useQuery({
    queryKey: ['/api/settings/logo'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/settings/logo');
      return await res.json();
    }
  });
  
  // Set the logo URL when data is loaded
  React.useEffect(() => {
    if (logoData?.logoUrl) {
      setLogoUrl(logoData.logoUrl);
    }
  }, [logoData]);

  // Fetch all system settings
  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    queryKey: ['/api/settings'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/settings');
      return await res.json();
    }
  });

  // Update logo URL mutation
  const updateLogoMutation = useMutation({
    mutationFn: async (url: string) => {
      const res = await apiRequest('POST', '/api/settings/logo', { url });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/logo'] });
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "Logo updated successfully",
        description: "The college logo has been updated.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update logo",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleUpdateLogo = async () => {
    if (!logoUrl) {
      toast({
        title: "Logo URL is required",
        description: "Please enter a valid URL for the logo.",
        variant: "destructive",
      });
      return;
    }

    updateLogoMutation.mutate(logoUrl);
  };

  const handleImageUrlValidation = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoUrl(e.target.value);
  };

  const isValidImageUrl = (url: string) => {
    // Check if it's a valid URL first
    try {
      new URL(url);
      // If we don't want to restrict by extension, we can just return true
      // and let the testImageUrl function do the verification by content-type
      return true;
    } catch (e) {
      return false;
    }
  };

  const testImageUrl = async (url: string) => {
    setLoading(true);
    
    // Try a simple approach first - create an Image object and see if it loads
    try {
      // Return a promise that resolves when the image loads or rejects on error
      return await new Promise((resolve) => {
        const img = new Image();
        
        img.onload = () => {
          setLoading(false);
          resolve(true);
        };
        
        img.onerror = () => {
          setLoading(false);
          toast({
            title: "Invalid image URL",
            description: "We couldn't load this image. Please check the URL and try again.",
            variant: "destructive",
          });
          resolve(false);
        };
        
        // Set the source to trigger loading
        img.src = url;
        
        // Set a timeout in case the image takes too long to load
        setTimeout(() => {
          if (img.complete) return;
          img.src = "";
          setLoading(false);
          toast({
            title: "Image load timeout",
            description: "The image is taking too long to load. Please check the URL and try again.",
            variant: "destructive",
          });
          resolve(false);
        }, 10000); // 10 second timeout
      });
    } catch (error) {
      setLoading(false);
      toast({
        title: "Error checking image URL",
        description: "Could not validate the image URL. Please try a different URL.",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleVerifyAndUpdate = async () => {
    if (!logoUrl) {
      toast({
        title: "Logo URL is required",
        description: "Please enter a valid URL for the logo.",
        variant: "destructive",
      });
      return;
    }

    if (!isValidImageUrl(logoUrl)) {
      toast({
        title: "Invalid URL format",
        description: "Please enter a valid URL (e.g., https://example.com/logo.png)",
        variant: "destructive",
      });
      return;
    }

    const isValid = await testImageUrl(logoUrl);
    if (isValid) {
      handleUpdateLogo();
    }
  };

  return (
    <AppLayout title="System Settings">
      <div className="max-w-6xl mx-auto">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full md:w-[400px] grid-cols-2">
            <TabsTrigger value="general">General Settings</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Manage general system settings for the COPO Management System.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  System-wide settings will appear here in future versions.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="branding" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Branding Settings</CardTitle>
                <CardDescription>
                  Customize the branding of the COPO Management System.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="logoUrl">College Logo URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="logoUrl"
                      value={logoUrl}
                      onChange={handleImageUrlValidation}
                      placeholder="https://example.com/logo.png"
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleVerifyAndUpdate} 
                      disabled={loading || updateLogoMutation.isPending}
                    >
                      {(loading || updateLogoMutation.isPending) ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Update Logo
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter the URL of your college logo. Recommended size: 200x200 pixels. The URL should point to an image hosted online. 
                    We'll verify if it's a valid image before saving.
                  </p>
                </div>

                {(logoData?.logoUrl || logoUrl) && (
                  <div className="mt-4 p-4 border rounded-md">
                    <Label className="block mb-2">Current Logo Preview</Label>
                    <div className="bg-gray-50 p-4 rounded-md flex justify-center">
                      <img 
                        src={logoUrl || logoData?.logoUrl} 
                        alt="College Logo" 
                        className="max-h-32 max-w-full"
                        onError={(e) => {
                          e.currentTarget.src = "https://placehold.co/200x200?text=Logo+Not+Found";
                        }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}