import { useState, useEffect } from "react";
import { useAuth, roles, registerUserSchema } from "@/hooks/use-auth";
import { useLogo } from "@/hooks/use-logo";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { School, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerUserSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const { loginMutation, registerMutation, user } = useAuth();
  const { logoUrl } = useLogo();
  const [location, navigate] = useLocation();
  
  // Check if there are any users in the system
  const { 
    data: systemData, 
    isLoading: isSystemLoading 
  } = useQuery<{ hasUsers: boolean }>({
    queryKey: ["/api/system/has-users"],
    staleTime: 60000, // 1 minute
  });
  
  const hasUsers = systemData?.hasUsers || false;
  
  // Set default tab to register if no users exist (first-time setup)
  useEffect(() => {
    if (!isSystemLoading && !hasUsers) {
      setActiveTab("register");
    }
  }, [isSystemLoading, hasUsers]);

  // We'll handle the redirect in an effect to avoid hook execution order issues
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const handleLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        // Navigate to dashboard on successful login
        navigate('/dashboard');
      }
    });
  };

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerUserSchema),
    defaultValues: {
      name: "",
      username: "",
      password: "",
      confirmPassword: "",
      role: roles.STUDENT,
      departmentId: null,
      securityQuestion: "",
      securityAnswer: "",
    },
  });

  const handleRegisterSubmit = (data: RegisterFormValues) => {
    // For the first user, force admin role
    if (!hasUsers) {
      data.role = roles.ADMIN;
    }
    
    registerMutation.mutate(data, {
      onSuccess: () => {
        // Navigate to dashboard on successful registration
        navigate('/dashboard');
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Auth form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-2">
              <img src={logoUrl} alt="College Logo" className="h-24 w-auto" />
            </div>
            <CardTitle className="text-2xl text-center font-bold">
              <div className="text-purple-700">SOUNDARYA</div>
              <div className="text-amber-700 text-lg">INSTITUTE OF MANAGEMENT AND SCIENCE</div>
              <div className="text-primary mt-2">COPO Management System</div>
            </CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className={`grid w-full ${hasUsers ? 'hidden' : 'grid-cols-2'} mb-4`}>
                <TabsTrigger value="login">Login</TabsTrigger>
                {(!hasUsers || isSystemLoading) && (
                  <TabsTrigger value="register">Register</TabsTrigger>
                )}
              </TabsList>
              
              {hasUsers && activeTab === "register" && (
                <Alert className="mb-4 bg-amber-50 border-amber-200">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-800">Registration Restricted</AlertTitle>
                  <AlertDescription className="text-amber-700">
                    Only administrators can create new accounts. Please contact your institution administrator for access.
                  </AlertDescription>
                </Alert>
              )}

              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
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
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between items-center">
                            <FormLabel>Password</FormLabel>
                            <Button 
                              variant="link" 
                              className="p-0 h-auto text-xs" 
                              onClick={(e) => {
                                e.preventDefault();
                                navigate('/reset-password');
                              }}
                            >
                              Forgot Password?
                            </Button>
                          </div>
                          <FormControl>
                            <Input type="password" placeholder="Enter your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Logging in..." : "Login"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(handleRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="johndoe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Create a password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Confirm your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="securityQuestion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Security Question</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter a security question for password recovery" {...field} />
                          </FormControl>
                          <FormDescription>
                            This will be used if you need to reset your password
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="securityAnswer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Security Answer</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter the answer to your security question" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* If no users exist, force admin role, otherwise show selection */}
                    {!hasUsers ? (
                      <div className="mb-4 bg-blue-50 p-3 rounded-md border border-blue-200">
                        <h4 className="text-blue-800 font-medium mb-1">Administrator Account</h4>
                        <p className="text-blue-700 text-sm">The first user is automatically registered as an administrator.</p>
                      </div>
                    ) : (
                      <FormField
                        control={registerForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select your role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={roles.STUDENT}>Student</SelectItem>
                                <SelectItem value={roles.FACULTY}>Faculty</SelectItem>
                                <SelectItem value={roles.HOD}>Head of Department</SelectItem>
                                <SelectItem value={roles.ADMIN}>Administrator</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Select your role in the institution
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Registering..." : "Register"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col">
            {(!hasUsers || isSystemLoading) && activeTab === "login" && (
              <p className="text-center text-sm text-gray-500 mt-2">
                <span>Don't have an account? <Button variant="link" onClick={() => setActiveTab("register")} className="p-0 h-auto">Register</Button></span>
              </p>
            )}
            {(!hasUsers || isSystemLoading) && activeTab === "register" && (
              <p className="text-center text-sm text-gray-500 mt-2">
                <span>Already have an account? <Button variant="link" onClick={() => setActiveTab("login")} className="p-0 h-auto">Login</Button></span>
              </p>
            )}
            {!isSystemLoading && !hasUsers && activeTab === "register" && (
              <p className="text-center text-amber-600 mt-4 text-sm">
                <span className="font-medium">First-time setup:</span> Creating the first user will make them an administrator.
              </p>
            )}
          </CardFooter>
        </Card>
      </div>

      {/* Right side - Hero */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-purple-700 via-purple-600 to-amber-700 hidden md:flex flex-col justify-center items-center p-8 text-white">
        <div className="max-w-md text-center">
          <img src={logoUrl} alt="College Logo" className="h-32 w-auto mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-2">
            SOUNDARYA
          </h1>
          <h2 className="text-2xl font-semibold mb-4">
            INSTITUTE OF MANAGEMENT AND SCIENCE
          </h2>
          <h3 className="text-2xl font-bold mb-4 bg-white/10 p-3 rounded-lg">
            COPO Management System
          </h3>
          <p className="text-xl mb-6">
            Efficiently track course outcomes, program outcomes, and attainments
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
              <h3 className="font-semibold mb-2">For Faculty</h3>
              <p className="text-sm">Create course plans and track student progress with ease</p>
            </div>
            <div className="p-4 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
              <h3 className="font-semibold mb-2">For HODs</h3>
              <p className="text-sm">Assign subjects and monitor department performance</p>
            </div>
            <div className="p-4 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
              <h3 className="font-semibold mb-2">For Students</h3>
              <p className="text-sm">View course progress and assessment results</p>
            </div>
            <div className="p-4 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
              <h3 className="font-semibold mb-2">For Administrators</h3>
              <p className="text-sm">Comprehensive oversight of institution-wide outcomes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
