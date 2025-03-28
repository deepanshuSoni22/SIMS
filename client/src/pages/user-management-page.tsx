import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth, roles } from "@/hooks/use-auth";
import { User, Department, insertUserSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  Plus, Search, UserCog, UserPlus, Mail, Key, X, Pencil, UserX, Filter, RefreshCw, AlertTriangle
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

  // Fetch all users
  const { data: users, isLoading, refetch } = useQuery<User[]>({
    queryKey: ["/api/users"],
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
  
  // Watch role to conditionally show/hide department selection
  const selectedUserRole = form.watch("role");

  const onSubmit = (data: CreateUserFormValues) => {
    createUserMutation.mutate(data);
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
              <Button variant="outline" size="icon" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
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
                            <Button variant="ghost" size="icon">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Mail className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Key className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
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
                
                {/* Show note for HOD users */}
                {selectedUserRole === roles.HOD && (
                  <div className="text-sm text-amber-600 flex items-start gap-2 p-2 bg-amber-50 rounded border border-amber-200">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">HODs are created without a department</p>
                      <p className="mt-1">After creating the HOD, go to the Departments page to create a department and assign this HOD.</p>
                    </div>
                  </div>
                )}
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
    </AppLayout>
  );
}
