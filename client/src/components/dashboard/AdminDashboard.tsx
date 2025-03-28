import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Users, School, BookOpen, FileCheck, 
  UserPlus, Building2, FolderPlus, FileBarChart2
} from "lucide-react";
import StatCard from "./StatCard";
import AttainmentChart from "./AttainmentChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { 
  Department, User, Subject,
  ActivityLog
} from "@shared/schema";

export default function AdminDashboard() {
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedYear, setSelectedYear] = useState("2023-2024");

  // Fetch departments
  const { data: departments, isLoading: isDepartmentsLoading } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  // Fetch users
  const { data: users, isLoading: isUsersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Fetch subjects
  const { data: subjects, isLoading: isSubjectsLoading } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  // Fetch activity logs
  const { data: activityLogs, isLoading: isActivityLogsLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activity-logs"],
  });

  // Filter users by role
  const facultyCount = users?.filter(user => user.role === "faculty").length || 0;
  const hodCount = users?.filter(user => user.role === "hod").length || 0;
  const studentCount = users?.filter(user => user.role === "student").length || 0;

  // Sample program outcome data
  const poData = [
    { name: "PO1", value: 75 },
    { name: "PO2", value: 68 },
    { name: "PO3", value: 82 },
    { name: "PO4", value: 71 },
    { name: "PO5", value: 65 },
    { name: "PO6", value: 76 },
    { name: "PO7", value: 84 },
    { name: "PO8", value: 79 },
  ];

  // Department options
  const departmentOptions = [
    { label: "All Departments", value: "all" },
    ...(departments?.map(dept => ({ label: dept.name, value: dept.id.toString() })) || [])
  ];

  // Academic year options
  const yearOptions = [
    { label: "2023-2024", value: "2023-2024" },
    { label: "2022-2023", value: "2022-2023" },
    { label: "2021-2022", value: "2021-2022" },
  ];

  const isLoading = isDepartmentsLoading || isUsersLoading || isSubjectsLoading || isActivityLogsLoading;

  return (
    <div>
      {/* Stats Cards */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Users" 
            value={users?.length || 0} 
            icon={<Users className="h-5 w-5" />} 
            color="primary" 
          />
          <StatCard 
            title="Departments" 
            value={departments?.length || 0} 
            icon={<School className="h-5 w-5" />} 
            color="secondary" 
          />
          <StatCard 
            title="Subjects" 
            value={subjects?.length || 0} 
            icon={<BookOpen className="h-5 w-5" />} 
            color="accent" 
          />
          <StatCard 
            title="Course Plans" 
            value={0} 
            icon={<FileCheck className="h-5 w-5" />} 
            color="success" 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-800">Recent Activities</h2>
            <button className="text-primary hover:text-blue-700 focus:outline-none">
              <span className="material-icons">refresh</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activity
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isActivityLogsLoading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
                      </div>
                    </td>
                  </tr>
                ) : activityLogs && activityLogs.length > 0 ? (
                  activityLogs.slice(0, 5).map((log) => (
                    <tr key={log.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 rounded-full bg-gray-200">
                            <AvatarFallback className="text-gray-600 text-sm">
                              {log.userId.toString().charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">User ID: {log.userId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {log.action} {log.entityType} {log.entityId ? `#${log.entityId}` : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                      No activity logs found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 text-center">
            <button className="text-primary hover:text-blue-700 text-sm font-medium focus:outline-none">
              View All Activities
            </button>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-medium text-gray-800">Quick Actions</h2>
          </div>
          <div className="p-4 space-y-4">
            <Link href="/users">
              <a className="block p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition duration-150">
                <div className="flex items-center">
                  <div className="bg-primary bg-opacity-10 p-2 rounded-full">
                    <UserPlus className="h-5 w-5 text-primary" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-800">Add New User</h3>
                    <p className="text-xs text-gray-500">Create accounts for staff or students</p>
                  </div>
                </div>
              </a>
            </Link>
            
            <Link href="/departments">
              <a className="block p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition duration-150">
                <div className="flex items-center">
                  <div className="bg-orange-500 bg-opacity-10 p-2 rounded-full">
                    <Building2 className="h-5 w-5 text-orange-500" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-800">Create Department</h3>
                    <p className="text-xs text-gray-500">Add a new academic department</p>
                  </div>
                </div>
              </a>
            </Link>
            
            <Link href="/subjects">
              <a className="block p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition duration-150">
                <div className="flex items-center">
                  <div className="bg-purple-700 bg-opacity-10 p-2 rounded-full">
                    <FolderPlus className="h-5 w-5 text-purple-700" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-800">Add New Subject</h3>
                    <p className="text-xs text-gray-500">Create a new course subject</p>
                  </div>
                </div>
              </a>
            </Link>
            
            <Link href="/reports">
              <a className="block p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition duration-150">
                <div className="flex items-center">
                  <div className="bg-green-600 bg-opacity-10 p-2 rounded-full">
                    <FileBarChart2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-800">Generate Reports</h3>
                    <p className="text-xs text-gray-500">Create attainment reports</p>
                  </div>
                </div>
              </a>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Program Outcome Attainment Chart */}
      <AttainmentChart 
        data={poData}
        title="Program Outcome Attainment Overview"
        departmentOptions={departmentOptions}
        yearOptions={yearOptions}
        onDepartmentChange={setSelectedDepartment}
        onYearChange={setSelectedYear}
        selectedDepartment={selectedDepartment}
        selectedYear={selectedYear}
        loading={false}
      />
      
      {/* Departments & Subjects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Overview */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-800">Departments</h2>
            <Link href="/departments">
              <a className="text-primary hover:text-blue-700 focus:outline-none text-sm font-medium">
                View All
              </a>
            </Link>
          </div>
          <div className="p-4 space-y-4">
            {isDepartmentsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : departments && departments.length > 0 ? (
              departments.slice(0, 3).map(dept => (
                <div key={dept.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-800">{dept.name}</h3>
                      <p className="text-sm text-gray-500">HOD: {dept.hodId ? `ID: ${dept.hodId}` : 'Not Assigned'}</p>
                      <div className="mt-2 flex items-center text-sm">
                        <span className="material-icons text-gray-400 text-xs mr-1">people</span>
                        <span className="text-gray-600">{
                          users?.filter(user => user.departmentId === dept.id).length || 0
                        } Members</span>
                        <span className="mx-2 text-gray-300">|</span>
                        <span className="material-icons text-gray-400 text-xs mr-1">book</span>
                        <span className="text-gray-600">{
                          subjects?.filter(subject => subject.departmentId === dept.id).length || 0
                        } Subjects</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="text-sm text-gray-500">Attainment</div>
                      <div className="font-medium text-green-600">N/A</div>
                      <div className="w-16 h-4 bg-gray-200 rounded-full mt-1">
                        <div className="h-full bg-green-600 rounded-full" style={{ width: '0%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No departments found
              </div>
            )}
          </div>
        </div>
        
        {/* Recently Updated Subjects */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-800">Recently Updated Subjects</h2>
            <Link href="/subjects">
              <a className="text-primary hover:text-blue-700 focus:outline-none text-sm font-medium">
                View All
              </a>
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
                    Department
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isSubjectsLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
                      </div>
                    </td>
                  </tr>
                ) : subjects && subjects.length > 0 ? (
                  subjects.slice(0, 5).map((subject) => {
                    const departmentName = departments?.find(d => d.id === subject.departmentId)?.name || 'Unknown';
                    
                    return (
                      <tr key={subject.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {subject.code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {subject.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {departmentName}
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
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      No subjects found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
