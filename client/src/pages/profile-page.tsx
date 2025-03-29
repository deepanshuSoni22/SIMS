import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Save, User, Lock, Shield, School, Building2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Define the schema for profile information updates
const profileSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
});

// Define the schema for password changes
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmNewPassword: z.string().min(6, "Confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords don't match",
    path: ["confirmNewPassword"],
  });

// Types based on the schemas
type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

// Helper function to get the appropriate icon for a role
function getRoleIcon(role: string) {
  switch (role) {
    case "ADMIN":
      return <Shield className="h-4 w-4" />;
    case "HOD":
      return <School className="h-4 w-4" />;
    case "FACULTY":
      return <User className="h-4 w-4" />;
    case "STUDENT":
      return <User className="h-4 w-4" />;
    default:
      return null;
  }
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("profile");
  
  // Fetch departments to display department name
  const { data: departments = [] } = useQuery<any[]>({
    queryKey: ["/api/departments"],
    enabled: !!user?.departmentId,
  });

  // Profile update form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
    },
  });

  // Password change form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  // Mutation for updating profile
  const profileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest("PATCH", "/api/user/profile", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for changing password
  const passwordMutation = useMutation({
    mutationFn: async (data: PasswordFormValues) => {
      const res = await apiRequest("PATCH", "/api/user/profile", {
        currentPassword: data.currentPassword,
        password: data.newPassword,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password Changed",
        description: "Your password has been changed successfully.",
      });
      passwordForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Password Change Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleProfileSubmit = (data: ProfileFormValues) => {
    profileMutation.mutate(data);
  };

  const handlePasswordSubmit = (data: PasswordFormValues) => {
    passwordMutation.mutate(data);
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AppLayout title="My Profile">
      <div className="container max-w-5xl">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left card: User info */}
          <Card className="md:w-1/3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Username</span>
                <span className="font-medium">{user.username}</span>
              </div>
              
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Name</span>
                <span className="font-medium">{user.name}</span>
              </div>
              
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Role</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {user.role.toLowerCase()}
                  </Badge>
                  <span className="text-sm font-medium text-primary">{getRoleIcon(user.role)}</span>
                </div>
              </div>

              {user.departmentId && (
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">Department</span>
                  <div className="flex items-center gap-2">
                    <Badge>
                      {departments.find((d: any) => d.id === user.departmentId)?.name || `Department ${user.departmentId}`}
                    </Badge>
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                </div>
              )}
              
              <Separator className="my-4" />
              
              <div className="rounded-md bg-muted p-4">
                <div className="flex items-center gap-2 font-medium mb-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span>Account Security</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  You can update your profile information and change your password in the tabs on the right.
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Right card: Tabs for editing */}
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Edit Your Profile</CardTitle>
              <CardDescription>
                Update your personal information or change your password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="password">Password</TabsTrigger>
                </TabsList>
                
                <TabsContent value="profile">
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4">
                      <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormDescription>
                              This is your display name throughout the system
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full mt-4" 
                        disabled={profileMutation.isPending}
                      >
                        {profileMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
                
                <TabsContent value="password">
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter your current password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter your new password" {...field} />
                            </FormControl>
                            <FormDescription>
                              Password must be at least 6 characters
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="confirmNewPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Confirm your new password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Alert className="mt-4">
                        <AlertTitle>Important</AlertTitle>
                        <AlertDescription>
                          After changing your password, you may need to log in again.
                        </AlertDescription>
                      </Alert>
                      
                      <Button 
                        type="submit" 
                        className="w-full mt-4" 
                        disabled={passwordMutation.isPending}
                      >
                        {passwordMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Changing Password...
                          </>
                        ) : (
                          <>
                            <Lock className="mr-2 h-4 w-4" />
                            Change Password
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
            {/* Footer content removed as requested */}
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}