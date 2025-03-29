import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  BookOpen, FileText, Award, BarChart2
} from "lucide-react";
import StatCard from "./StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import {
  DirectAssessment,
  StudentAssessmentMarks,
  Subject
} from "@shared/schema";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";

export default function StudentDashboard() {
  const { user } = useAuth();

  // Fetch enrolled subjects
  const { data: subjects, isLoading: isSubjectsLoading } = useQuery<Subject[]>({
    queryKey: ["/api/subjects/student", user?.id],
    enabled: !!user?.id,
  });

  // Fetch student assessment marks
  const { data: assessmentMarks, isLoading: isMarksLoading } = useQuery<StudentAssessmentMarks[]>({
    queryKey: ["/api/student-assessment-marks/student", user?.id],
    enabled: !!user?.id,
  });

  // Sample attainment data
  const courseOutcomeData = [
    { name: "CO1", value: 78 },
    { name: "CO2", value: 65 },
    { name: "CO3", value: 80 },
    { name: "CO4", value: 72 },
    { name: "CO5", value: 70 },
  ];

  // Stats
  const totalSubjects = subjects?.length || 0;
  const completedAssessments = assessmentMarks?.length || 0;
  const pendingAssessments = 10; // This would need to be calculated from all required assessments

  // Sample radar chart data for CO attainment
  const radarData = [
    { subject: "Subject 1", value: 85 },
    { subject: "Subject 2", value: 72 },
    { subject: "Subject 3", value: 90 },
    { subject: "Subject 4", value: 68 },
    { subject: "Subject 5", value: 78 },
  ];

  return (
    <div>
      {/* Stats Cards */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Enrolled Subjects" 
            value={totalSubjects} 
            icon={<BookOpen className="h-5 w-5" />} 
            color="primary" 
          />
          <StatCard 
            title="Assessments Completed" 
            value={completedAssessments} 
            icon={<FileText className="h-5 w-5" />} 
            color="secondary" 
          />
          <StatCard 
            title="Pending Assessments" 
            value={pendingAssessments} 
            icon={<Award className="h-5 w-5" />} 
            color="accent" 
          />
          <StatCard 
            title="Average Score" 
            value="75%" 
            icon={<BarChart2 className="h-5 w-5" />} 
            color="success" 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Course Outcome Attainment */}
        <Card>
          <CardHeader>
            <CardTitle>Course Outcome Attainment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={courseOutcomeData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="name" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar name="Student" dataKey="value" stroke="#1976d2" fill="#1976d2" fillOpacity={0.6} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Subject Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Subject Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {isSubjectsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : subjects && subjects.length > 0 ? (
                subjects.slice(0, 5).map((subject, index) => (
                  <div key={subject.id}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{subject.name}</span>
                      <span className="text-sm font-medium">{Math.floor(Math.random() * 30) + 70}%</span>
                    </div>
                    <Progress value={Math.floor(Math.random() * 30) + 70} className="h-2" />
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No subjects enrolled
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Assessments */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-800">Recent Assessments</h2>
          <Link to="/attainments" className="text-primary hover:text-blue-700 focus:outline-none text-sm font-medium">
            View All
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
                  Assessment Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isMarksLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  </td>
                </tr>
              ) : assessmentMarks && assessmentMarks.length > 0 ? (
                assessmentMarks.slice(0, 5).map((mark, index) => (
                  <tr key={mark.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Subject {mark.assessmentId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {["Internal", "Preparatory", "Assignment"][index % 3]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {mark.marksObtained} / 100
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date().toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    No assessment records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enrolled Subjects */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-800">Enrolled Subjects</h2>
          <Link to="/subjects" className="text-primary hover:text-blue-700 focus:outline-none text-sm font-medium">
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
                  Semester
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Academic Year
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {subject.academicYear}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    No subjects enrolled
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
