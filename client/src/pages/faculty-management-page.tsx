import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { User, Department, SubjectAssignment, Subject } from "@shared/schema";
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
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  UserPlus, Search, BookOpen, User as UserIcon
} from "lucide-react";
import { useLocation } from "wouter";

export default function FacultyManagementPage() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState<User | null>(null);
  const [isViewSubjectsDialogOpen, setIsViewSubjectsDialogOpen] = useState(false);

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

  // Handle add new faculty click
  const handleAddFacultyClick = () => {
    setLocation("/users/new?role=faculty&departmentId=" + user?.departmentId);
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
      </div>
    </AppLayout>
  );
}