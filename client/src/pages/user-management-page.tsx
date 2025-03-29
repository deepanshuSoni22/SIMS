import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth, roles } from "@/hooks/use-auth";
import { User, Department, insertUserSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  Plus, Search, UserCog, UserPlus, Mail, Key, X, Pencil, UserX, Filter, RefreshCw, 
  AlertTriangle, Info, CheckCircle, ArrowUpRight
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose
} from "@/components/ui/dialog";
import { 
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Extended registration schema for admin user creation
const createUserSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;

export default function UserManagementPage() {
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [isDeleteUserDialogOpen, setIsDeleteUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Fetch all users
  const { data: users, isLoading, refetch } = useQuery<User[]>({
    queryKey: ["/api/users"],
    refetchOnWindowFocus: false,
    staleTime: 10000, // 10 seconds
  });

  // Fetch departments for department selection
  const { data: departments } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: CreateUserFormValues) => {
      const { confirmPassword, ...userDataWithoutConfirm } = userData;
      const res = await apiRequest("POST", "/api/register", userDataWithoutConfirm);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "User created successfully",
        description: "The user has been added to the system.",
      });
      // Invalidate users query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsAddUserDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<CreateUserFormValues> }) => {
      const { confirmPassword, password, ...updateData } = data;
      const res = await apiRequest("PATCH", `/api/users/${id}`, updateData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "User updated successfully",
        description: "The user information has been updated.",
      });
      // Invalidate users query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsEditUserDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, password }: { id: number, password: string }) => {
      const res = await apiRequest("POST", `/api/users/${id}/reset-password`, { password });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password reset successfully",
        description: "The user's password has been reset.",
      });
      setIsResetPasswordDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reset password",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("DELETE", `/api/users/${userId}`);
      return res.ok;
    },
    onSuccess: () => {
      toast({
        title: "User deleted successfully",
        description: "The user has been removed from the system.",
      });
      // Invalidate users query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsDeleteUserDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create user form
  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      username: "",
      password: "",
      confirmPassword: "",
      role: roles.STUDENT,
      departmentId: null,
    },
  });
  
  // Create edit user form schema (without required password)
  const editUserSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    username: z.string().min(2, "Username must be at least 2 characters"),
    role: z.string(),
    departmentId: z.number().nullable(),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
  }).refine(data => {
    // If password is provided, confirmPassword must match
    if (data.password && data.password !== data.confirmPassword) {
      return false;
    }
    return true;
  }, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
  
  // Edit user form
  const editUserForm = useForm<CreateUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: "",
      username: "",
      role: roles.STUDENT,
      departmentId: null,
      password: "",
      confirmPassword: "",
    },
  });
  
  // Reset password form
  const resetPasswordForm = useForm<{ password: string, confirmPassword: string }>({
    resolver: zodResolver(
      z.object({
        password: z.string().min(6, "Password must be at least 6 characters"),
        confirmPassword: z.string(),
      }).refine(data => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
      })
    ),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });
  
  // Watch role to conditionally show/hide department selection
  const selectedUserRole = form.watch("role");

  const onSubmit = (data: CreateUserFormValues) => {
    createUserMutation.mutate(data);
  };

  const onEditSubmit = (data: Partial<CreateUserFormValues>) => {
    if (!selectedUser) return;
    updateUserMutation.mutate({ id: selectedUser.id, data });
  };

  const onResetPasswordSubmit = (data: { password: string, confirmPassword: string }) => {
    if (!selectedUser) return;
    resetPasswordMutation.mutate({ id: selectedUser.id, password: data.password });
  };

  const onDeleteUser = () => {
    if (!selectedUser) return;
    deleteUserMutation.mutate(selectedUser.id);
  };

  // Filter users based on selected role and search query
  const filteredUsers = users?.filter(user => {
    const matchesRole = selectedRole ? user.role === selectedRole : true;
    const matchesSearch = searchQuery 
      ? user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesRole && matchesSearch;
  });

  // Get role counts
  const roleCounts = {
    all: users?.length || 0,
    admin: users?.filter(user => user.role === roles.ADMIN).length || 0,
    hod: users?.filter(user => user.role === roles.HOD).length || 0,
    faculty: users?.filter(user => user.role === roles.FACULTY).length || 0,
    student: users?.filter(user => user.role === roles.STUDENT).length || 0,
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case roles.ADMIN:
        return "bg-red-100 text-red-800";
      case roles.HOD:
        return "bg-blue-100 text-blue-800";
      case roles.FACULTY:
        return "bg-green-100 text-green-800";
      case roles.STUDENT:
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <AppLayout title="User Management">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500">Manage users, roles, and permissions</p>
        </div>
        
        <Button onClick={() => setIsAddUserDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add New User
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card 
          className={`cursor-pointer ${selectedRole === null ? 'bg-primary/10 border-primary' : ''}`}
          onClick={() => setSelectedRole(null)}
        >
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium">All Users</p>
              <p className="text-2xl font-bold">{roleCounts.all}</p>
            </div>
            <UserCog className="h-8 w-8 text-gray-400" />
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer ${selectedRole === roles.ADMIN ? 'bg-primary/10 border-primary' : ''}`}
          onClick={() => setSelectedRole(roles.ADMIN)}
        >
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium">Admins</p>
              <p className="text-2xl font-bold">{roleCounts.admin}</p>
            </div>
            <UserCog className="h-8 w-8 text-red-500" />
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer ${selectedRole === roles.HOD ? 'bg-primary/10 border-primary' : ''}`}
          onClick={() => setSelectedRole(roles.HOD)}
        >
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium">HODs</p>
              <p className="text-2xl font-bold">{roleCounts.hod}</p>
            </div>
            <UserCog className="h-8 w-8 text-blue-500" />
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer ${selectedRole === roles.FACULTY ? 'bg-primary/10 border-primary' : ''}`}
          onClick={() => setSelectedRole(roles.FACULTY)}
        >
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium">Faculty</p>
              <p className="text-2xl font-bold">{roleCounts.faculty}</p>
            </div>
            <UserCog className="h-8 w-8 text-green-500" />
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer ${selectedRole === roles.STUDENT ? 'bg-primary/10 border-primary' : ''}`}
          onClick={() => setSelectedRole(roles.STUDENT)}
        >
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium">Students</p>
              <p className="text-2xl font-bold">{roleCounts.student}</p>
            </div>
            <UserCog className="h-8 w-8 text-purple-500" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>Users</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search users..."
                  className="pl-8 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={async () => {
                  // Force refetch both users and departments queries with a loading state
                  const refreshStart = () => {
                    // Show toast for refresh operation
                    toast({
                      title: "Refreshing data...",
                      description: "Fetching the latest user and department data."
                    });
                  };
                  
                  const refreshComplete = () => {
                    // Show completion toast
                    toast({
                      title: "Data refreshed",
                      description: "User and department data is now up to date."
                    });
                  };
                  
                  refreshStart();
                  try {
                    // Set loading state
                    await Promise.all([
                      queryClient.invalidateQueries({ queryKey: ["/api/users"] }),
                      queryClient.invalidateQueries({ queryKey: ["/api/departments"] }),
                      refetch()
                    ]);
                    refreshComplete();
                  } catch (error) {
                    toast({
                      title: "Refresh failed",
                      description: "There was an error fetching the latest data.",
                      variant: "destructive"
                    });
                  }
                }}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10">
                      <div className="flex justify-center">
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers && filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => {
                    const department = departments?.find(d => d.id === user.departmentId);
                    
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>
                          <Badge className={getRoleBadgeColor(user.role)}>
                            {user.role.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {department ? department.name : 'None'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                setSelectedUser(user);
                                // Set up edit user form
                                editUserForm.reset({
                                  name: user.name,
                                  username: user.username,
                                  role: user.role,
                                  departmentId: user.departmentId,
                                  password: "",
                                  confirmPassword: "",
                                });
                                setIsEditUserDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                // Contact user functionality (could be implemented later)
                                toast({
                                  title: "Contact User",
                                  description: `Feature to contact ${user.name} coming soon.`,
                                });
                              }}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                setSelectedUser(user);
                                setIsResetPasswordDialogOpen(true);
                              }}
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                setSelectedUser(user);
                                setIsDeleteUserDialogOpen(true);
                              }}
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10">
                      <p className="text-gray-500">No users found</p>
                      {searchQuery && (
                        <p className="text-gray-400 text-sm mt-1">
                          Try a different search term or clear filters
                        </p>
                      )}
                      {selectedRole && (
                        <Button 
                          variant="link" 
                          className="mt-2"
                          onClick={() => setSelectedRole(null)}
                        >
                          Clear role filter
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account with role-based permissions.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
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
                control={form.control}
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
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Reset departmentId to null when selecting Admin or HOD
                          if (value === roles.ADMIN || value === roles.HOD) {
                            form.setValue("departmentId", null);
                          }
                        }} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={roles.ADMIN}>Administrator</SelectItem>
                          <SelectItem value={roles.HOD}>Head of Department</SelectItem>
                          <SelectItem value={roles.FACULTY}>Faculty</SelectItem>
                          <SelectItem value={roles.STUDENT}>Student</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Only show department selection for faculty and students */}
                {(selectedUserRole === roles.FACULTY || selectedUserRole === roles.STUDENT) && (
                  <FormField
                    control={form.control}
                    name="departmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value === "none" ? null : parseInt(value))} 
                          value={field.value === null ? "none" : field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {departments?.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id.toString()}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                        {departments?.length === 0 && (
                          <p className="text-sm text-yellow-500 mt-1">
                            No departments found. Create departments first.
                          </p>
                        )}
                      </FormItem>
                    )}
                  />
                )}
                
                {/* Previously had a warning for HOD users - now removed */}
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending ? "Creating..." : "Create User"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit User Dialog */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editUserForm}>
            <form onSubmit={editUserForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editUserForm.control}
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
                control={editUserForm.control}
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
                control={editUserForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Reset departmentId to null when selecting Admin or HOD
                        if (value === roles.ADMIN || value === roles.HOD) {
                          editUserForm.setValue("departmentId", null);
                        }
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={roles.ADMIN}>Administrator</SelectItem>
                        <SelectItem value={roles.HOD}>Head of Department</SelectItem>
                        <SelectItem value={roles.FACULTY}>Faculty</SelectItem>
                        <SelectItem value={roles.STUDENT}>Student</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Only show department selection for faculty and students */}
              {(editUserForm.watch("role") === roles.FACULTY || editUserForm.watch("role") === roles.STUDENT) && (
                <FormField
                  control={editUserForm.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value === "none" ? null : parseInt(value))} 
                        value={field.value === null ? "none" : field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {departments?.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id.toString()}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {/* Previously had a warning for HOD users - now removed */}
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditUserDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateUserMutation.isPending}>
                  {updateUserMutation.isPending ? "Updating..." : "Update User"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {selectedUser?.name}.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...resetPasswordForm}>
            <form onSubmit={resetPasswordForm.handleSubmit(onResetPasswordSubmit)} className="space-y-4">
              <FormField
                control={resetPasswordForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
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
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={resetPasswordMutation.isPending}>
                  {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete User Dialog */}
      <Dialog open={isDeleteUserDialogOpen} onOpenChange={setIsDeleteUserDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedUser?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-2 mt-2">
            <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm">
              <p className="font-medium">Warning: This is a permanent action</p>
              <p className="mt-1">Deleting this user will remove all their associated data from the system.</p>
            </div>
            
            <div className="flex items-center mt-4">
              <p className="font-medium">User:</p>
              <div className="flex items-center ml-2 gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {selectedUser?.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{selectedUser?.name}</span>
                <Badge className={getRoleBadgeColor(selectedUser?.role || '')}>
                  {selectedUser?.role?.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteUserDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={onDeleteUser}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
