import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth, roles } from "@/hooks/use-auth";
import { Department, Subject, User, insertSubjectSchema, insertSubjectAssignmentSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  Plus, Search, BookOpen, RefreshCw, Pencil, Trash2, FileText, UserPlus
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Card, CardContent, CardHeader, CardTitle 
} from "@/components/ui/card";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { 
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

type CreateSubjectFormValues = z.infer<typeof insertSubjectSchema>;
type AssignSubjectFormValues = z.infer<typeof insertSubjectAssignmentSchema>;

export default function SubjectPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [activeTab, setActiveTab] = useState("all");
  const [isAddSubjectDialogOpen, setIsAddSubjectDialogOpen] = useState(false);
  const [isAssignSubjectDialogOpen, setIsAssignSubjectDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  // Fetch all subjects
  const { data: subjects, isLoading, refetch } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  // Fetch departments for selection
  const { data: departments } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  // Fetch faculty users for assignment
  const { data: facultyUsers } = useQuery<User[]>({
    queryKey: ["/api/users/role", roles.FACULTY],
  });

  // Create subject mutation
  const createSubjectMutation = useMutation({
    mutationFn: async (data: CreateSubjectFormValues) => {
      const res = await apiRequest("POST", "/api/subjects", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Subject created successfully",
        description: "The subject has been added to the system.",
      });
      // Invalidate subjects query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      setIsAddSubjectDialogOpen(false);
      subjectForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create subject",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Assign subject mutation
  const assignSubjectMutation = useMutation({
    mutationFn: async (data: AssignSubjectFormValues) => {
      const res = await apiRequest("POST", "/api/subject-assignments", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Subject assigned successfully",
        description: "The subject has been assigned to the faculty member.",
      });
      setIsAssignSubjectDialogOpen(false);
      assignForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to assign subject",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create subject form
  const subjectForm = useForm<CreateSubjectFormValues>({
    resolver: zodResolver(insertSubjectSchema),
    defaultValues: {
      code: "",
      name: "",
      departmentId: 1,
      semester: 1,
      academicYear: "2023-2024",
      status: "pending",
    },
  });

  // Assign subject form
  const assignForm = useForm<AssignSubjectFormValues>({
    resolver: zodResolver(insertSubjectAssignmentSchema),
    defaultValues: {
      subjectId: 0,
      facultyId: 0,
      assignedBy: user?.id || 0,
    },
  });

  const onSubmitSubject = (data: CreateSubjectFormValues) => {
    createSubjectMutation.mutate(data);
  };

  const onSubmitAssignment = (data: AssignSubjectFormValues) => {
    assignSubjectMutation.mutate(data);
  };

  // Filter subjects based on search query, selected department, and status
  const filteredSubjects = subjects?.filter(subject => {
    const matchesSearch = searchQuery 
      ? subject.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        subject.code.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    
    const matchesDepartment = selectedDepartment 
      ? subject.departmentId === parseInt(selectedDepartment)
      : true;
    
    const matchesStatus = activeTab !== "all" 
      ? subject.status === activeTab
      : true;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const handleAssignClick = (subject: Subject) => {
    setSelectedSubject(subject);
    assignForm.setValue("subjectId", subject.id);
    setIsAssignSubjectDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'complete':
        return <Badge className="bg-green-100 text-green-800">Complete</Badge>;
      case 'in-progress':
        return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      default:
        return <Badge className="bg-red-100 text-red-800">Pending</Badge>;
    }
  };

  const canCreateSubject = user?.role === roles.ADMIN || user?.role === roles.HOD;
  const canAssignSubject = user?.role === roles.ADMIN || user?.role === roles.HOD;

  return (
    <AppLayout title="Subjects">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subjects</h1>
          <p className="text-gray-500">Manage academic subjects and assignments</p>
        </div>
        
        {canCreateSubject && (
          <Button onClick={() => setIsAddSubjectDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Subject
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle>All Subjects</CardTitle>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
              <Select 
                value={selectedDepartment} 
                onValueChange={setSelectedDepartment}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Departments</SelectItem>
                  {departments?.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search subjects..."
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
          
          <Tabs 
            defaultValue="all" 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="mt-4"
          >
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress</TabsTrigger>
              <TabsTrigger value="complete">Complete</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Academic Year</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      <div className="flex justify-center">
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredSubjects && filteredSubjects.length > 0 ? (
                  filteredSubjects.map((subject) => {
                    const department = departments?.find(d => d.id === subject.departmentId);
                    
                    return (
                      <TableRow key={subject.id}>
                        <TableCell>{subject.code}</TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-gray-500" />
                            <span>{subject.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{department?.name || 'Unknown'}</TableCell>
                        <TableCell>{subject.semester}</TableCell>
                        <TableCell>{subject.academicYear}</TableCell>
                        <TableCell>{getStatusBadge(subject.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {canAssignSubject && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                title="Assign to Faculty"
                                onClick={() => handleAssignClick(subject)}
                              >
                                <UserPlus className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon"
                              title="View Course Plan"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            {canCreateSubject && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  title="Edit Subject"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  title="Delete Subject"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      <p className="text-gray-500">No subjects found</p>
                      {(searchQuery || selectedDepartment || activeTab !== "all") && (
                        <p className="text-gray-400 text-sm mt-1">
                          Try different search criteria or clear filters
                        </p>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Subject Dialog */}
      <Dialog open={isAddSubjectDialogOpen} onOpenChange={setIsAddSubjectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Subject</DialogTitle>
            <DialogDescription>
              Create a new academic subject.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...subjectForm}>
            <form onSubmit={subjectForm.handleSubmit(onSubmitSubject)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={subjectForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject Code</FormLabel>
                      <FormControl>
                        <Input placeholder="CS101" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={subjectForm.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        value={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
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
              </div>
              
              <FormField
                control={subjectForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Introduction to Computer Science" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={subjectForm.control}
                  name="semester"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Semester</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        value={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select semester" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                            <SelectItem key={sem} value={sem.toString()}>
                              Semester {sem}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={subjectForm.control}
                  name="academicYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Academic Year</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="2023-2024">2023-2024</SelectItem>
                          <SelectItem value="2022-2023">2022-2023</SelectItem>
                          <SelectItem value="2021-2022">2021-2022</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={subjectForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="complete">Complete</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddSubjectDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createSubjectMutation.isPending}>
                  {createSubjectMutation.isPending ? "Creating..." : "Create Subject"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Assign Subject Dialog */}
      <Dialog open={isAssignSubjectDialogOpen} onOpenChange={setIsAssignSubjectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Subject to Faculty</DialogTitle>
            <DialogDescription>
              {selectedSubject ? (
                <>Assign <strong>{selectedSubject.name}</strong> to a faculty member.</>
              ) : (
                <>Assign this subject to a faculty member.</>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...assignForm}>
            <form onSubmit={assignForm.handleSubmit(onSubmitAssignment)} className="space-y-4">
              <FormField
                control={assignForm.control}
                name="facultyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Faculty Member</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      value={field.value ? field.value.toString() : ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select faculty member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {facultyUsers?.map((faculty) => (
                          <SelectItem key={faculty.id} value={faculty.id.toString()}>
                            {faculty.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAssignSubjectDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={assignSubjectMutation.isPending}>
                  {assignSubjectMutation.isPending ? "Assigning..." : "Assign Subject"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
