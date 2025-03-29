import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { User, Department, SubjectAssignment, Subject, insertUserSchema, roles } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import AppLayout from "@/components/layout/AppLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  UserPlus, Search, BookOpen, User as UserIcon
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

// Extended registration schema for faculty creation
const createFacultySchema = insertUserSchema.extend({
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type CreateFacultyFormValues = z.infer<typeof createFacultySchema>;

export default function FacultyManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState<User | null>(null);
  const [isViewSubjectsDialogOpen, setIsViewSubjectsDialogOpen] = useState(false);
  const [isAddFacultyDialogOpen, setIsAddFacultyDialogOpen] = useState(false);

  // Redirect if not an HOD
  if (user && user.role !== "hod") {
    setTimeout(() => setLocation("/dashboard"), 0);
    return null;
  }

  // Fetch department
  const { data: department } = useQuery<Department>({
    queryKey: [`/api/departments/${user?.departmentId}`],
    enabled: !!user?.departmentId,
  });

  // Fetch all users
  const { data: allUsers, isLoading: isUsersLoading } = useQuery<User[]>({
    queryKey: [`/api/users`],
    enabled: !!user,
  });

  // Fetch all subjects
  const { data: allSubjects, isLoading: isSubjectsLoading } = useQuery<Subject[]>({
    queryKey: [`/api/subjects`],
    enabled: !!user,
  });

  // Fetch subject assignments
  const { data: subjectAssignments } = useQuery<SubjectAssignment[]>({
    queryKey: [`/api/subject-assignments`],
    enabled: !!user,
  });

  // Filter faculty by role and ensure they belong to the user's department
  const facultyMembers = allUsers?.filter(u => 
    u.role === "faculty" && u.departmentId === user?.departmentId
  ) || [];

  // Filter subjects by department
  const departmentSubjects = allSubjects?.filter(s => 
    s.departmentId === user?.departmentId
  ) || [];

  // Filtered faculty based on search
  const filteredFaculty = facultyMembers.filter(faculty => 
    faculty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faculty.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Count subjects assigned to each faculty
  const getFacultySubjectsCount = (facultyId: number) => {
    return subjectAssignments?.filter(assignment => assignment.facultyId === facultyId).length || 0;
  };

  // Get subjects assigned to a faculty
  const getFacultySubjects = (facultyId: number) => {
    const assignmentIds = subjectAssignments
      ?.filter(assignment => assignment.facultyId === facultyId)
      .map(assignment => assignment.subjectId) || [];
    
    return departmentSubjects.filter(subject => assignmentIds.includes(subject.id));
  };

  // Handle view subjects click
  const handleViewSubjectsClick = (faculty: User) => {
    setSelectedFaculty(faculty);
    setIsViewSubjectsDialogOpen(true);
  };

  // Create faculty form
  const form = useForm<CreateFacultyFormValues>({
    resolver: zodResolver(createFacultySchema),
    defaultValues: {
      name: "",
      username: "",
      password: "",
      confirmPassword: "",
      role: roles.FACULTY,
      departmentId: user?.departmentId || null,
    },
  });

  // Create user mutation
  const createFacultyMutation = useMutation({
    mutationFn: async (userData: CreateFacultyFormValues) => {
      const { confirmPassword, ...userDataWithoutConfirm } = userData;
      const res = await apiRequest("POST", "/api/register", userDataWithoutConfirm);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Faculty created successfully",
        description: "The faculty member has been added to your department.",
      });
      // Invalidate users query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsAddFacultyDialogOpen(false);
      form.reset({
        name: "",
        username: "",
        password: "",
        confirmPassword: "",
        role: roles.FACULTY,
        departmentId: user?.departmentId || null,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create faculty",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateFacultyFormValues) => {
    createFacultyMutation.mutate(data);
  };

  // Handle add new faculty click
  const handleAddFacultyClick = () => {
    setIsAddFacultyDialogOpen(true);
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Faculty Management</h1>
            <p className="text-muted-foreground">
              Manage faculty members in the {department?.name || "your"} department
            </p>
          </div>
          <Button onClick={handleAddFacultyClick}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add New Faculty
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Faculty Members</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search faculty..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <CardDescription>
              View and manage faculty members in your department
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Department ID</TableHead>
                    <TableHead>Assigned Subjects</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isUsersLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10">
                        <div className="flex justify-center">
                          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredFaculty.length > 0 ? (
                    filteredFaculty.map((faculty) => (
                      <TableRow key={faculty.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-2">
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {faculty.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{faculty.name}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{faculty.username}</TableCell>
                        <TableCell>{faculty.departmentId || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">
                            {getFacultySubjectsCount(faculty.id)} subjects
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewSubjectsClick(faculty)}
                          >
                            <BookOpen className="h-4 w-4 mr-2" /> View Subjects
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setLocation(`/users/${faculty.id}`)}
                          >
                            <UserIcon className="h-4 w-4 mr-2" /> Profile
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                        {searchTerm 
                          ? "No faculty members found matching your search"
                          : "No faculty members found in your department"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* View Subjects Dialog */}
        <Dialog open={isViewSubjectsDialogOpen} onOpenChange={setIsViewSubjectsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Assigned Subjects</DialogTitle>
              <DialogDescription>
                {selectedFaculty ? (
                  <>Subjects assigned to <strong>{selectedFaculty.name}</strong></>
                ) : (
                  <>Assigned subjects</>
                )}
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-4">
              {selectedFaculty && (
                <div className="space-y-4">
                  {getFacultySubjectsCount(selectedFaculty.id) > 0 ? (
                    <div className="space-y-2">
                      {getFacultySubjects(selectedFaculty.id).map(subject => (
                        <div key={subject.id} className="flex items-center gap-3 p-3 rounded-md border">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{subject.name}</p>
                            <p className="text-sm text-gray-500">{subject.code} | {subject.semester}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500">No subjects assigned to this faculty member</p>
                    </div>
                  )}
                  
                  <div className="flex justify-end gap-2 mt-6">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsViewSubjectsDialogOpen(false)}
                    >
                      Close
                    </Button>
                    <Button 
                      onClick={() => {
                        setIsViewSubjectsDialogOpen(false);
                        setLocation(`/subjects?action=assign&facultyId=${selectedFaculty.id}&departmentId=${user?.departmentId}`);
                      }}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Assign Subject
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Faculty Dialog */}
        <Dialog open={isAddFacultyDialogOpen} onOpenChange={setIsAddFacultyDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Faculty</DialogTitle>
              <DialogDescription>
                Create a new faculty member for the {department?.name || "your"} department.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
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
                      <FormDescription>
                        Username will be used for login.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="******" {...field} />
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
                        <Input type="password" placeholder="******" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem className="hidden">
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem className="hidden">
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <DialogFooter className="mt-6">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddFacultyDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createFacultyMutation.isPending}
                  >
                    {createFacultyMutation.isPending ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                        Creating...
                      </>
                    ) : (
                      <>Add Faculty</>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}