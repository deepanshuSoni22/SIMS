import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCollegeTitle } from "@/hooks/use-college-title";
import AppLayout from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, Upload, Type, Save } from "lucide-react";

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [logoUrl, setLogoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  
  // College title state
  const [titleForm, setTitleForm] = useState({
    collegeTitle: "",
    instituteName: "",
    systemName: ""
  });
  
  // General settings state
  const [generalForm, setGeneralForm] = useState({
    academicYear: '2024-2025',
    directAttainmentWeight: 80,
    indirectAttainmentWeight: 20,
    attainmentThreshold: 60
  });
  
  // Use college title hook
  const { 
    collegeTitle, 
    instituteName, 
    systemName, 
    updateTitle, 
    isUpdating,
    isLoading: isTitleLoading
  } = useCollegeTitle();

  // Fetch logo URL
  const { data: logoData, isLoading: isLogoLoading } = useQuery({
    queryKey: ['/api/settings/logo'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/settings/logo');
      return await res.json();
    }
  });
  
  // Fetch all system settings
  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    queryKey: ['/api/settings'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/settings');
      return await res.json();
    }
  });
  
  // Fetch general settings
  const { data: generalSettings, isLoading: isGeneralSettingsLoading } = useQuery({
    queryKey: ['/api/settings/general'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/settings/general');
      return await res.json();
    }
  });
  
  // Set the logo URL when data is loaded
  React.useEffect(() => {
    if (logoData?.logoUrl) {
      setLogoUrl(logoData.logoUrl);
    }
  }, [logoData]);
  
  // Set the college title form data when college title data is loaded
  React.useEffect(() => {
    if (collegeTitle && instituteName && systemName) {
      setTitleForm({
        collegeTitle,
        instituteName,
        systemName
      });
    }
  }, [collegeTitle, instituteName, systemName]);
  
  // Set the general settings form data when loaded from API
  React.useEffect(() => {
    if (generalSettings) {
      setGeneralForm({
        academicYear: generalSettings.academicYear || '2024-2025',
        directAttainmentWeight: generalSettings.directAttainmentWeight || 80,
        indirectAttainmentWeight: generalSettings.indirectAttainmentWeight || 20,
        attainmentThreshold: generalSettings.attainmentThreshold || 60
      });
    }
  }, [generalSettings]);

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
  
  // Update general settings mutation
  const updateGeneralSettingsMutation = useMutation({
    mutationFn: async (formData: typeof generalForm) => {
      const res = await apiRequest('POST', '/api/settings/general', formData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/general'] });
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "General settings updated successfully",
        description: "The system settings have been updated.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update general settings",
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
  
  const handleGeneralInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let parsedValue: string | number = value;
    
    // Convert to number for numeric fields
    if (name !== 'academicYear') {
      parsedValue = parseInt(value) || 0;
    }
    
    setGeneralForm(prev => ({
      ...prev,
      [name]: parsedValue
    }));
  };
  
  const handleUpdateGeneralSettings = () => {
    const { academicYear, directAttainmentWeight, indirectAttainmentWeight, attainmentThreshold } = generalForm;
    
    if (!academicYear) {
      toast({
        title: "Academic year is required",
        description: "Please enter the current academic year.",
        variant: "destructive",
      });
      return;
    }
    
    // Make sure the weights add up to 100%
    if (directAttainmentWeight + indirectAttainmentWeight !== 100) {
      toast({
        title: "Weights must sum to 100%",
        description: "The direct and indirect assessment weights must add up to 100%.",
        variant: "destructive",
      });
      return;
    }
    
    updateGeneralSettingsMutation.mutate(generalForm);
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
  
  const handleTitleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTitleForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleUpdateTitle = () => {
    const { collegeTitle: title, instituteName, systemName } = titleForm;
    
    if (!title || !instituteName || !systemName) {
      toast({
        title: "All fields are required",
        description: "Please fill in all the title fields.",
        variant: "destructive",
      });
      return;
    }
    
    updateTitle(titleForm);
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
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Academic Year Settings</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure the current academic year and related settings.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="academicYear">Current Academic Year</Label>
                      <Input
                        id="academicYear"
                        name="academicYear"
                        value={generalForm.academicYear}
                        onChange={handleGeneralInputChange}
                        placeholder="e.g., 2024-2025"
                      />
                      <p className="text-xs text-muted-foreground">
                        The current academic year will be used as the default for new courses and attainment calculations.
                      </p>
                    </div>
                  </div>
                </div>
                
                <Separator className="my-6" />
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">COPO Attainment Settings</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure how course outcomes and program outcomes are calculated.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="directAttainmentWeight">Direct Attainment Weight (%)</Label>
                      <Input
                        id="directAttainmentWeight"
                        name="directAttainmentWeight"
                        type="number"
                        value={generalForm.directAttainmentWeight}
                        onChange={handleGeneralInputChange}
                        min="0"
                        max="100"
                      />
                      <p className="text-xs text-muted-foreground">
                        Weight given to direct assessment methods (exams, assignments).
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="indirectAttainmentWeight">Indirect Attainment Weight (%)</Label>
                      <Input
                        id="indirectAttainmentWeight"
                        name="indirectAttainmentWeight"
                        type="number"
                        value={generalForm.indirectAttainmentWeight}
                        onChange={handleGeneralInputChange}
                        min="0"
                        max="100"
                      />
                      <p className="text-xs text-muted-foreground">
                        Weight given to indirect assessment methods (surveys, feedback).
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="attainmentThreshold">Attainment Threshold (%)</Label>
                    <Input
                      id="attainmentThreshold"
                      name="attainmentThreshold"
                      type="number"
                      value={generalForm.attainmentThreshold}
                      onChange={handleGeneralInputChange}
                      min="0"
                      max="100"
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum percentage required to consider an outcome as attained.
                    </p>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button 
                    onClick={handleUpdateGeneralSettings}
                    disabled={updateGeneralSettingsMutation.isPending}
                  >
                    {updateGeneralSettingsMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save General Settings
                      </>
                    )}
                  </Button>
                </div>
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
                
                <Separator className="my-6" />
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">College Title Settings</h3>
                    <p className="text-sm text-muted-foreground">
                      Customize how your institution's name appears throughout the application.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="collegeTitle">College Title</Label>
                      <Input
                        id="collegeTitle"
                        name="collegeTitle"
                        value={titleForm.collegeTitle}
                        onChange={handleTitleInputChange}
                        placeholder="e.g., Soundarya Institute"
                      />
                      <p className="text-xs text-muted-foreground">
                        The main title of your college that appears in the header and login page.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="instituteName">Institute Name</Label>
                      <Input
                        id="instituteName"
                        name="instituteName"
                        value={titleForm.instituteName}
                        onChange={handleTitleInputChange}
                        placeholder="e.g., of Management and Science"
                      />
                      <p className="text-xs text-muted-foreground">
                        The secondary part of your institution's name.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="systemName">System Name</Label>
                      <Input
                        id="systemName"
                        name="systemName"
                        value={titleForm.systemName}
                        onChange={handleTitleInputChange}
                        placeholder="e.g., COPO Management System"
                      />
                      <p className="text-xs text-muted-foreground">
                        The name of this system or application.
                      </p>
                    </div>
                    
                    <div className="pt-2">
                      <Button 
                        onClick={handleUpdateTitle}
                        disabled={isUpdating}
                      >
                        {isUpdating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Type className="mr-2 h-4 w-4" />
                            Update Title
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-4 border rounded-md">
                    <Label className="block mb-2">Title Preview</Label>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="text-center font-semibold">
                        {titleForm.collegeTitle} {titleForm.instituteName}
                      </p>
                      <p className="text-center text-sm text-muted-foreground">
                        {titleForm.systemName}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}