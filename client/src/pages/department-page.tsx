import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth, roles } from "@/hooks/use-auth";
import { Department, User, insertDepartmentSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  Plus, Search, Building2, RefreshCw, Pencil, Trash2, Users
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

type CreateDepartmentFormValues = z.infer<typeof insertDepartmentSchema>;

export default function DepartmentPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDepartmentDialogOpen, setIsAddDepartmentDialogOpen] = useState(false);

  // Fetch all departments
  const { data: departments, isLoading, refetch } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  // Fetch HOD users for selection
  const { data: hodUsers } = useQuery<User[]>({
    queryKey: ["/api/users/role", roles.HOD],
  });

  // Create department mutation
  const createDepartmentMutation = useMutation({
    mutationFn: async (data: CreateDepartmentFormValues) => {
      const res = await apiRequest("POST", "/api/departments", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Department created successfully",
        description: "The department has been added to the system.",
      });
      // Invalidate departments query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
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

  // Create department form
  const form = useForm<CreateDepartmentFormValues>({
    resolver: zodResolver(insertDepartmentSchema),
    defaultValues: {
      name: "",
      hodId: null,
    },
  });

  const onSubmit = (data: CreateDepartmentFormValues) => {
    createDepartmentMutation.mutate(data);
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
                          {hod ? hod.name : 'Not Assigned'}
                        </TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Users className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4" />
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
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : null)} 
                      value={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select HOD" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Not Assigned</SelectItem>
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
    </AppLayout>
  );
}
