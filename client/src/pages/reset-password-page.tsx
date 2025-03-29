import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation, useRoute, Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeftIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCollegeTitle } from "@/hooks/use-college-title";
import { useAuth } from "@/hooks/use-auth";

// Schema for the request password reset form
const requestResetSchema = z.object({
  username: z.string().min(1, "Username is required"),
});

// Schema for the reset password form
const resetPasswordSchema = z.object({
  username: z.string().min(1, "Username is required"),
  securityAnswer: z.string().min(1, "Security answer is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password is required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RequestResetFormValues = z.infer<typeof requestResetSchema>;
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [, navigate] = useLocation();
  const [match] = useRoute("/auth");
  const { toast } = useToast();
  const { user } = useAuth();
  const { collegeTitle, instituteName, systemName } = useCollegeTitle();
  const [securityQuestion, setSecurityQuestion] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [step, setStep] = useState<"request" | "reset">("request");

  // If user is logged in, redirect to home
  React.useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Request reset form
  const requestResetForm = useForm<RequestResetFormValues>({
    resolver: zodResolver(requestResetSchema),
    defaultValues: {
      username: "",
    },
  });

  // Reset password form
  const resetPasswordForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      username: "",
      securityAnswer: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Request password reset mutation
  const requestResetMutation = useMutation({
    mutationFn: async (data: RequestResetFormValues) => {
      const response = await apiRequest("POST", "/api/request-password-reset", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to request password reset");
      }
      return await response.json();
    },
    onSuccess: (data) => {
      setSecurityQuestion(data.securityQuestion);
      setCurrentUsername(data.username);
      
      // Pre-fill the username in the reset form
      resetPasswordForm.setValue("username", data.username);
      
      // Move to the reset step
      setStep("reset");
    },
    onError: (error: Error) => {
      toast({
        title: "Request Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordFormValues) => {
      const resetData = {
        username: data.username,
        securityAnswer: data.securityAnswer,
        newPassword: data.newPassword,
      };
      
      const response = await apiRequest("POST", "/api/reset-password", resetData);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to reset password");
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password Reset Successful",
        description: "Your password has been reset. Please log in with your new password.",
      });
      navigate("/auth");
    },
    onError: (error: Error) => {
      toast({
        title: "Reset Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle request reset form submission
  const handleRequestReset = (data: RequestResetFormValues) => {
    requestResetMutation.mutate(data);
  };

  // Handle reset password form submission
  const handleResetPassword = (data: ResetPasswordFormValues) => {
    resetPasswordMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-4xl flex flex-col md:flex-row">
        {/* Left Column - Form */}
        <div className="w-full md:w-1/2 p-6">
          <Link href="/auth" className="inline-flex items-center mb-4 text-sm font-medium text-primary">
            <ArrowLeftIcon className="mr-2 h-4 w-4" /> Back to Login
          </Link>
          
          <Card>
            <CardHeader>
              <CardTitle>Reset Password</CardTitle>
              <CardDescription>
                {step === "request" 
                  ? "Enter your username to receive your security question." 
                  : "Answer your security question to reset your password."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {step === "request" ? (
                <Form {...requestResetForm}>
                  <form onSubmit={requestResetForm.handleSubmit(handleRequestReset)} className="space-y-4">
                    <FormField
                      control={requestResetForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={requestResetMutation.isPending}
                    >
                      {requestResetMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Continue
                    </Button>
                  </form>
                </Form>
              ) : (
                <Form {...resetPasswordForm}>
                  <form onSubmit={resetPasswordForm.handleSubmit(handleResetPassword)} className="space-y-4">
                    {securityQuestion && (
                      <Alert className="mb-4">
                        <AlertDescription>
                          Security Question: <strong>{securityQuestion}</strong>
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <FormField
                      control={resetPasswordForm.control}
                      name="securityAnswer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Security Answer</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your answer" {...field} />
                          </FormControl>
                          <FormDescription>
                            Answer is case-sensitive
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={resetPasswordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter new password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={resetPasswordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Confirm new password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={resetPasswordMutation.isPending}
                    >
                      {resetPasswordMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Reset Password
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Hero */}
        <div className="w-full md:w-1/2 p-6 flex items-center bg-primary/5 rounded-lg">
          <div className="text-center md:text-left">
            <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70 mb-4">
              {collegeTitle}
            </h1>
            <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-2">
              {instituteName}
            </h2>
            <p className="text-xl text-muted-foreground mb-8">{systemName}</p>
            
            <div className="space-y-4">
              <div className="text-muted-foreground">
                <h3 className="font-medium text-foreground mb-1">Password Recovery</h3>
                <p>Reset your account password by answering your security question. If you cannot remember your security answer, please contact your administrator.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}