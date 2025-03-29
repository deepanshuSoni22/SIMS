import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Users, BookOpen, FileCheck, FileBarChart2
} from "lucide-react";
import StatCard from "./StatCard";
import AttainmentChart from "./AttainmentChart";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { 
  User, Subject, Department, SubjectAssignment
} from "@shared/schema";

export default function HodDashboard() {
  const { user } = useAuth();
  const [selectedYear, setSelectedYear] = useState("2023-2024");

  // Fetch department
  const { data: department } = useQuery<Department>({
    queryKey: [`/api/departments/${user?.departmentId}`],
    enabled: !!user?.departmentId,
  });

  // Fetch all users
  const { data: allUsers, isLoading: isFacultyLoading } = useQuery<User[]>({
    queryKey: [`/api/users`],
    enabled: !!user,
  });

  // Fetch all subjects
  const { data: allSubjects, isLoading: isSubjectsLoading } = useQuery<Subject[]>({
    queryKey: [`/api/subjects`],
    enabled: !!user,
  });

  // Subjects filtered by department
  const subjects = allSubjects?.filter(s => s.departmentId === user?.departmentId);

  // Fetch subject assignments
  const { data: subjectAssignments } = useQuery<SubjectAssignment[]>({
    queryKey: [`/api/subject-assignments`],
    enabled: !!user,
  });

  // Sample program outcome data for the department
  const poData = [
    { name: "PO1", value: 78 },
    { name: "PO2", value: 65 },
    { name: "PO3", value: 80 },
    { name: "PO4", value: 72 },
    { name: "PO5", value: 70 },
    { name: "PO6", value: 75 },
    { name: "PO7", value: 82 },
    { name: "PO8", value: 76 },
  ];

  // Department options - just the HOD's department
  const departmentOptions = [
    { label: department?.name || "My Department", value: user?.departmentId?.toString() || "0" }
  ];

  // Academic year options
  const yearOptions = [
    { label: "2023-2024", value: "2023-2024" },
    { label: "2022-2023", value: "2022-2023" },
    { label: "2021-2022", value: "2021-2022" },
  ];

  // Use subjects filtered by department
  const effectiveSubjects = subjects || [];
  
  // Filter faculty by role and ensure they belong to the user's department
  const effectiveFaculty = allUsers?.filter(f => 
    f.role === "faculty" && f.departmentId === user?.departmentId
  ) || [];
  
  const completedSubjectsCount = effectiveSubjects.filter(s => s.status === "complete").length || 0;
  const pendingSubjectsCount = effectiveSubjects.filter(s => s.status === "pending").length || 0;
  
  // Count subjects assigned to each faculty
  const facultySubjectsCount = effectiveFaculty.map(faculty => {
    const assignedSubjects = subjectAssignments?.filter(assignment => assignment.facultyId === faculty.id) || [];
    return {
      facultyId: faculty.id,
      count: assignedSubjects.length
    };
  });

  return (
    <div>
      {/* Stats Cards */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Faculty Members" 
            value={effectiveFaculty.length || 0} 
            icon={<Users className="h-5 w-5" />} 
            color="primary" 
          />
          <StatCard 
            title="Total Subjects" 
            value={effectiveSubjects.length || 0} 
            icon={<BookOpen className="h-5 w-5" />} 
            color="secondary" 
          />
          <StatCard 
            title="Completed Subjects" 
            value={completedSubjectsCount} 
            icon={<FileCheck className="h-5 w-5" />} 
            color="success" 
          />
          <StatCard 
            title="Pending Subjects" 
            value={pendingSubjectsCount} 
            icon={<BookOpen className="h-5 w-5" />} 
            color="accent" 
          />
        </div>
      </div>

      {/* Program Outcome Attainment Chart */}
      <AttainmentChart 
        data={poData}
        title="Program Outcome Attainment Overview"
        departmentOptions={departmentOptions}
        yearOptions={yearOptions}
        onDepartmentChange={() => {}}  // No-op since HODs can only see their department
        onYearChange={setSelectedYear}
        selectedDepartment={user?.departmentId?.toString() || "0"}
        selectedYear={selectedYear}
        loading={false}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Faculty Members */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-800">Faculty Members</h2>
            <Link to={`/users?role=faculty&departmentId=${user?.departmentId}`} className="text-primary hover:text-blue-700 focus:outline-none text-sm font-medium">
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subjects
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isFacultyLoading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
                      </div>
                    </td>
                  </tr>
                ) : effectiveFaculty.length > 0 ? (
                  effectiveFaculty.map((faculty) => (
                    <tr key={faculty.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 rounded-full bg-gray-200">
                            <AvatarFallback>
                              {faculty.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{faculty.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {faculty.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {facultySubjectsCount.find(f => f.facultyId === faculty.id)?.count || 0}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                      No faculty members found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Subjects */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-800">Department Subjects</h2>
            <Link to={`/subjects?departmentId=${user?.departmentId}`} className="text-primary hover:text-blue-700 focus:outline-none text-sm font-medium">
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject Code
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isSubjectsLoading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
                      </div>
                    </td>
                  </tr>
                ) : effectiveSubjects.length > 0 ? (
                  effectiveSubjects.slice(0, 5).map((subject) => (
                    <tr key={subject.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {subject.code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {subject.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          className={
                            subject.status === 'complete' ? 'bg-green-100 text-green-800' : 
                            subject.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'
                          }
                        >
                          {subject.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                      No subjects found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-medium text-gray-800">Quick Actions</h2>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to={subjects && subjects.length > 0 
                  ? `/subjects?action=assign&subjectId=${subjects[0].id}&departmentId=${user?.departmentId}` 
                  : `/subjects?departmentId=${user?.departmentId}`} 
              className="block p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition duration-150">
              <div className="flex items-center">
                <div className="bg-primary bg-opacity-10 p-2 rounded-full">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-800">Assign Subjects</h3>
                  <p className="text-xs text-gray-500">Assign subjects to faculty members in your department</p>
                </div>
              </div>
            </Link>
            
            <Link to="/reports" className="block p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition duration-150">
              <div className="flex items-center">
                <div className="bg-green-600 bg-opacity-10 p-2 rounded-full">
                  <FileBarChart2 className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-800">View Reports</h3>
                  <p className="text-xs text-gray-500">Check attainment reports</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
