import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth, roles } from "@/hooks/use-auth";
import { Department, User, Subject, insertDepartmentSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  Plus, Search, Building2, RefreshCw, Pencil, Trash2, Users, AlertTriangle
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { 
  Card, CardContent, CardHeader, CardTitle 
} from "@/components/ui/card";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

type DepartmentFormValues = z.infer<typeof insertDepartmentSchema>;

export default function DepartmentPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDepartmentDialogOpen, setIsAddDepartmentDialogOpen] = useState(false);
  const [isEditDepartmentDialogOpen, setIsEditDepartmentDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  
  // Fetch all departments
  const { data: departments, isLoading, refetch } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });
  
  // Fetch HOD users for selection
  const { data: hodUsers } = useQuery<User[]>({
    queryKey: [`/api/users/role/${roles.HOD}`],
  });

  // Fetch faculty count by department
  const { data: allUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Fetch all subjects
  const { data: allSubjects } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  // Count faculty and students for each department
  const getFacultyCount = (departmentId: number) => {
    return allUsers?.filter(user => 
      user.departmentId === departmentId && user.role === roles.FACULTY
    ).length || 0;
  };
  
  // Count subjects for each department
  const getSubjectsCount = (departmentId: number) => {
    return allSubjects?.filter(subject => 
      subject.departmentId === departmentId
    ).length || 0;
  };

  // Create department mutation
  const createDepartmentMutation = useMutation({
    mutationFn: async (data: DepartmentFormValues) => {
      const res = await apiRequest("POST", "/api/departments", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Department created successfully",
        description: "The department has been added to the system.",
      });
      // Invalidate departments and users queries to refresh the lists
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsAddDepartmentDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create department",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update department mutation
  const updateDepartmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: DepartmentFormValues }) => {
      const res = await apiRequest("PATCH", `/api/departments/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Department updated successfully",
        description: "The department has been updated in the system.",
      });
      // Invalidate departments and users queries to refresh the lists
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsEditDepartmentDialogOpen(false);
      setSelectedDepartment(null);
      editForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update department",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete department mutation
  const deleteDepartmentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/departments/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Department deleted successfully",
        description: "The department has been removed from the system.",
      });
      // Invalidate departments and users queries to refresh the lists
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsDeleteDialogOpen(false);
      setSelectedDepartment(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete department",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create department form
  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(insertDepartmentSchema),
    defaultValues: {
      name: "",
      hodId: null,
    },
  });

  // Edit department form
  const editForm = useForm<DepartmentFormValues>({
    resolver: zodResolver(insertDepartmentSchema),
    defaultValues: {
      name: "",
      hodId: null,
    },
  });

  // Handle opening edit dialog
  const handleEditDepartment = (department: Department) => {
    setSelectedDepartment(department);
    editForm.reset({
      name: department.name,
      hodId: department.hodId,
    });
    setIsEditDepartmentDialogOpen(true);
  };

  // Handle opening delete dialog
  const handleDeleteDepartment = (department: Department) => {
    setSelectedDepartment(department);
    setIsDeleteDialogOpen(true);
  };
  
  // Handle form submissions
  const onSubmit = (data: DepartmentFormValues) => {
    createDepartmentMutation.mutate(data);
  };

  const onEditSubmit = (data: DepartmentFormValues) => {
    if (selectedDepartment) {
      updateDepartmentMutation.mutate({ id: selectedDepartment.id, data });
    }
  };

  const onDeleteConfirm = () => {
    if (selectedDepartment) {
      deleteDepartmentMutation.mutate(selectedDepartment.id);
    }
  };

  // Filter departments based on search query
  const filteredDepartments = departments?.filter(department => {
    return searchQuery 
      ? department.name.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
  });

  return (
    <AppLayout title="Departments">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
          <p className="text-gray-500">Manage academic departments and their HODs</p>
        </div>
        
        <Button onClick={() => setIsAddDepartmentDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Department
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>All Departments</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search departments..."
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
                  <TableHead>Department Name</TableHead>
                  <TableHead>HOD</TableHead>
                  <TableHead>Faculty Count</TableHead>
                  <TableHead>Subjects</TableHead>
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
                ) : filteredDepartments && filteredDepartments.length > 0 ? (
                  filteredDepartments.map((department) => {
                    const hod = hodUsers?.find(h => h.id === department.hodId);
                    
                    return (
                      <TableRow key={department.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-500" />
                            <span>{department.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {hod ? (
                            <div className="flex items-center gap-2">
                              <span>{hod.name}</span>
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">HOD</Badge>
                            </div>
                          ) : (
                            <span className="text-gray-500">Not Assigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {getFacultyCount(department.id) > 0 ? (
                            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-none">
                              {getFacultyCount(department.id)}
                            </Badge>
                          ) : (
                            <span className="text-gray-500">No faculty</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {getSubjectsCount(department.id) > 0 ? (
                            <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 border-none">
                              {getSubjectsCount(department.id)}
                            </Badge>
                          ) : (
                            <span className="text-gray-500">No subjects</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEditDepartment(department)}
                              title="Edit Department"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              title="View Department Members"
                            >
                              <Users className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDeleteDepartment(department)}
                              title="Delete Department"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10">
                      <p className="text-gray-500">No departments found</p>
                      {searchQuery && (
                        <p className="text-gray-400 text-sm mt-1">
                          Try a different search term
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

      {/* Add Department Dialog */}
      <Dialog open={isAddDepartmentDialogOpen} onOpenChange={setIsAddDepartmentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Department</DialogTitle>
            <DialogDescription>
              Create a new academic department and optionally assign a HOD.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Computer Science" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="hodId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Head of Department</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === "none" ? null : parseInt(value))} 
                      value={field.value === null ? "none" : field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select HOD" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Not Assigned</SelectItem>
                        {hodUsers?.map((hodUser) => (
                          <SelectItem key={hodUser.id} value={hodUser.id.toString()}>
                            {hodUser.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                    {hodUsers?.length === 0 && (
                      <div className="text-sm text-amber-600 flex items-start gap-2 p-2 mt-2 bg-amber-50 rounded border border-amber-200">
                        <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">No HODs available</p>
                          <p className="mt-1">Create a user with HOD role first in the User Management page.</p>
                        </div>
                      </div>
                    )}
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDepartmentDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createDepartmentMutation.isPending}>
                  {createDepartmentMutation.isPending ? "Creating..." : "Create Department"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Department Dialog */}
      <Dialog open={isEditDepartmentDialogOpen} onOpenChange={setIsEditDepartmentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>
              Update department information.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Computer Science" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="hodId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Head of Department</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === "none" ? null : parseInt(value))} 
                      value={field.value === null ? "none" : field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select HOD" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Not Assigned</SelectItem>
                        {hodUsers?.map((hodUser) => (
                          <SelectItem key={hodUser.id} value={hodUser.id.toString()}>
                            {hodUser.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditDepartmentDialogOpen(false);
                    setSelectedDepartment(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateDepartmentMutation.isPending}>
                  {updateDepartmentMutation.isPending ? "Updating..." : "Update Department"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Department Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Department
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the department "{selectedDepartment?.name}"? 
              This action cannot be undone and may affect users assigned to this department.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedDepartment(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={onDeleteConfirm}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteDepartmentMutation.isPending ? "Deleting..." : "Delete Department"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}