import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";

// Step 1: Request OTP
const requestFormSchema = z.object({
  username: z.string().min(1, "Username is required"),
});

// Step 2: Verify OTP
const verifyFormSchema = z.object({
  otp: z.string().min(1, "OTP is required"),
});

// Step 3: Reset Password
const resetPasswordFormSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RequestFormValues = z.infer<typeof requestFormSchema>;
type VerifyFormValues = z.infer<typeof verifyFormSchema>;
type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;

export default function ResetPasswordPage() {
  const [step, setStep] = useState<"request" | "verify" | "reset">("request");
  const [userId, setUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [_, navigate] = useLocation();

  // Step 1: Request OTP form
  const requestForm = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      username: "",
    },
  });

  // Step 2: Verify OTP form
  const verifyForm = useForm<VerifyFormValues>({
    resolver: zodResolver(verifyFormSchema),
    defaultValues: {
      otp: "",
    },
  });

  // Step 3: Reset Password form
  const resetPasswordForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handleRequestOTP = async (data: RequestFormValues) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/reset-password/request", {
        username: data.username,
      });
      
      const result = await response.json();
      
      if (result.success) {
        setUserId(result.userId);
        setStep("verify");
        toast({
          title: "OTP sent",
          description: "An OTP has been sent to your WhatsApp number",
        });
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to send OTP",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error requesting OTP:", error);
      toast({
        title: "Error",
        description: "An error occurred while requesting OTP",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (data: VerifyFormValues) => {
    if (!userId) {
      toast({
        title: "Error",
        description: "User ID not found. Please start over.",
        variant: "destructive",
      });
      setStep("request");
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/reset-password/verify", {
        userId,
        otp: data.otp,
      });
      
      const result = await response.json();
      
      if (result.success) {
        setStep("reset");
        toast({
          title: "OTP verified",
          description: "You can now reset your password",
        });
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to verify OTP",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      toast({
        title: "Error",
        description: "An error occurred while verifying OTP",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (data: ResetPasswordFormValues) => {
    if (!userId) {
      toast({
        title: "Error",
        description: "User ID not found. Please start over.",
        variant: "destructive",
      });
      setStep("request");
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/reset-password/complete", {
        userId,
        newPassword: data.newPassword,
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Your password has been reset. You can now login.",
        });
        navigate("/auth");
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to reset password",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      toast({
        title: "Error",
        description: "An error occurred while resetting password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center min-h-screen p-4 bg-slate-50">
      <div className="flex justify-center">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Reset Password</CardTitle>
              <CardDescription>
                {step === "request" && "Enter your username to receive an OTP via WhatsApp"}
                {step === "verify" && "Enter the OTP sent to your WhatsApp number"}
                {step === "reset" && "Create a new password for your account"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {step === "request" && (
                <Form {...requestForm}>
                  <form onSubmit={requestForm.handleSubmit(handleRequestOTP)} className="space-y-6">
                    <FormField
                      control={requestForm.control}
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
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending OTP...
                        </>
                      ) : (
                        "Request OTP"
                      )}
                    </Button>
                  </form>
                </Form>
              )}

              {step === "verify" && (
                <Form {...verifyForm}>
                  <form onSubmit={verifyForm.handleSubmit(handleVerifyOTP)} className="space-y-6">
                    <FormField
                      control={verifyForm.control}
                      name="otp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>OTP</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter OTP received on WhatsApp" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        "Verify OTP"
                      )}
                    </Button>
                  </form>
                </Form>
              )}

              {step === "reset" && (
                <Form {...resetPasswordForm}>
                  <form onSubmit={resetPasswordForm.handleSubmit(handleResetPassword)} className="space-y-6">
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
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Resetting Password...
                        </>
                      ) : (
                        "Reset Password"
                      )}
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button variant="link" onClick={() => navigate("/auth")}>
                Back to Login
              </Button>
              {step !== "request" && (
                <Button variant="link" onClick={() => setStep("request")}>
                  Start Over
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}