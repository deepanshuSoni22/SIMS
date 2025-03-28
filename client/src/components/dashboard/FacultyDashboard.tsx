import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  BookOpen, FileText, ClipboardCheck, BarChart2, PenSquare
} from "lucide-react";
import StatCard from "./StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { 
  Subject, CoursePlan, Department
} from "@shared/schema";

export default function FacultyDashboard() {
  const { user } = useAuth();

  // Fetch assigned subjects
  const { data: subjects, isLoading: isSubjectsLoading } = useQuery<Subject[]>({
    queryKey: ["/api/subjects/faculty", user?.id],
    enabled: !!user?.id,
  });

  // Fetch course plans created by the faculty
  const { data: coursePlans, isLoading: isCoursePlansLoading } = useQuery<CoursePlan[]>({
    queryKey: ["/api/course-plans/faculty", user?.id],
    enabled: !!user?.id,
  });

  // Fetch department
  const { data: department } = useQuery<Department>({
    queryKey: ["/api/departments", user?.departmentId],
    enabled: !!user?.departmentId,
  });

  // Stats
  const totalSubjects = subjects?.length || 0;
  const completedCoursePlans = coursePlans?.filter(plan => plan.status === "complete").length || 0;
  const pendingCoursePlans = totalSubjects - completedCoursePlans;
  
  const completionPercentage = totalSubjects > 0 
    ? Math.round((completedCoursePlans / totalSubjects) * 100) 
    : 0;

  return (
    <div>
      {/* Stats Cards */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Assigned Subjects" 
            value={totalSubjects} 
            icon={<BookOpen className="h-5 w-5" />} 
            color="primary" 
          />
          <StatCard 
            title="Course Plans" 
            value={completedCoursePlans} 
            icon={<FileText className="h-5 w-5" />} 
            color="secondary" 
          />
          <StatCard 
            title="Pending Plans" 
            value={pendingCoursePlans} 
            icon={<ClipboardCheck className="h-5 w-5" />} 
            color="accent" 
          />
          <StatCard 
            title="Completion" 
            value={`${completionPercentage}%`} 
            icon={<BarChart2 className="h-5 w-5" />} 
            color="success" 
          />
        </div>
      </div>

      {/* Course Completion Progress */}
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Course Plan Completion Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm font-medium">{completionPercentage}%</span>
                </div>
                <Progress value={completionPercentage} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assigned Subjects */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-800">Assigned Subjects</h2>
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
                    Semester
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
                  subjects.map((subject) => (
                    <tr key={subject.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {subject.code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {subject.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {subject.semester}
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
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      No subjects assigned
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Recent Course Plans */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-800">Course Plans</h2>
            <Link href="/course-plans">
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
                    Subject
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isCoursePlansLoading || isSubjectsLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
                      </div>
                    </td>
                  </tr>
                ) : coursePlans && coursePlans.length > 0 ? (
                  coursePlans.map((plan) => {
                    const subject = subjects?.find(s => s.id === plan.subjectId);
                    
                    return (
                      <tr key={plan.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {subject?.name || `Subject #${plan.subjectId}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            className={
                              plan.status === 'complete' ? 'bg-green-100 text-green-800' : 
                              plan.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-red-100 text-red-800'
                            }
                          >
                            {plan.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(plan.lastUpdated).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <Link href={`/course-plans/${plan.id}`}>
                            <a className="text-primary hover:text-blue-700">
                              <PenSquare className="h-4 w-4 inline" />
                            </a>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      No course plans created
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
          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/course-plans/new">
              <a className="block p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition duration-150">
                <div className="flex items-center">
                  <div className="bg-primary bg-opacity-10 p-2 rounded-full">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-800">Create Course Plan</h3>
                    <p className="text-xs text-gray-500">Prepare a new course plan</p>
                  </div>
                </div>
              </a>
            </Link>
            
            <Link href="/attainments">
              <a className="block p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition duration-150">
                <div className="flex items-center">
                  <div className="bg-orange-500 bg-opacity-10 p-2 rounded-full">
                    <ClipboardCheck className="h-5 w-5 text-orange-500" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-800">Manage Assessments</h3>
                    <p className="text-xs text-gray-500">Update direct assessments</p>
                  </div>
                </div>
              </a>
            </Link>
            
            <Link href="/reports">
              <a className="block p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition duration-150">
                <div className="flex items-center">
                  <div className="bg-green-600 bg-opacity-10 p-2 rounded-full">
                    <BarChart2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-800">View Attainments</h3>
                    <p className="text-xs text-gray-500">Check attainment reports</p>
                  </div>
                </div>
              </a>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
