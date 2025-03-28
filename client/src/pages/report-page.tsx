import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth, roles } from "@/hooks/use-auth";
import { Department, Subject, Attainment } from "@shared/schema";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Radar
} from "recharts";
import { 
  Download, FileSpreadsheet, FileText, Printer, BarChart3, PieChart as PieChartIcon,
  Activity, ListChecks, Calendar, FileDown
} from "lucide-react";

export default function ReportPage() {
  const { user } = useAuth();
  const [selectedDepartment, setSelectedDepartment] = useState<string>(user?.departmentId?.toString() || "");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("2023-2024");
  const [activeTab, setActiveTab] = useState("department");

  // Fetch departments
  const { data: departments, isLoading: isDepartmentsLoading } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  // Fetch subjects based on selected department
  const { data: subjects, isLoading: isSubjectsLoading } = useQuery<Subject[]>({
    queryKey: ["/api/subjects/department", selectedDepartment ? parseInt(selectedDepartment) : null],
    enabled: !!selectedDepartment,
  });

  // Example attainment data
  const courseAttainmentData = [
    { name: "CO1", direct: 75, indirect: 80, total: 76.5 },
    { name: "CO2", direct: 68, indirect: 72, total: 69.2 },
    { name: "CO3", direct: 82, indirect: 78, total: 80.8 },
    { name: "CO4", direct: 71, indirect: 76, total: 72.5 },
    { name: "CO5", direct: 65, indirect: 70, total: 66.5 },
  ];

  const programAttainmentData = [
    { name: "PO1", value: 78 },
    { name: "PO2", value: 65 },
    { name: "PO3", value: 80 },
    { name: "PO4", value: 72 },
    { name: "PO5", value: 70 },
    { name: "PO6", value: 75 },
    { name: "PO7", value: 82 },
    { name: "PO8", value: 76 },
  ];

  const yearlyTrendData = [
    { year: "2019-20", attainment: 62 },
    { year: "2020-21", attainment: 68 },
    { year: "2021-22", attainment: 72 },
    { year: "2022-23", attainment: 75 },
    { year: "2023-24", attainment: 78 },
  ];

  const assessmentContributionData = [
    { name: "Internal Tests", value: 35 },
    { name: "Preparatory Exams", value: 25 },
    { name: "Assignments", value: 15 },
    { name: "Lab Work", value: 15 },
    { name: "Quizzes", value: 10 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const radarData = [
    { attribute: "Problem Solving", department: 75, institution: 70 },
    { attribute: "Technical Skills", department: 82, institution: 78 },
    { attribute: "Communication", department: 68, institution: 65 },
    { attribute: "Teamwork", department: 80, institution: 75 },
    { attribute: "Ethics", department: 85, institution: 80 },
    { attribute: "Innovation", department: 70, institution: 72 },
  ];

  // Academic years for filtering
  const academicYears = [
    { label: "2023-2024", value: "2023-2024" },
    { label: "2022-2023", value: "2022-2023" },
    { label: "2021-2022", value: "2021-2022" },
    { label: "2020-2021", value: "2020-2021" },
    { label: "2019-2020", value: "2019-2020" },
  ];

  return (
    <AppLayout title="Reports">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500">Comprehensive reports on attainment and outcomes</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
          <Select
            value={selectedYear}
            onValueChange={setSelectedYear}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {academicYears.map((year) => (
                <SelectItem key={year.value} value={year.value}>
                  {year.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedDepartment}
            onValueChange={setSelectedDepartment}
          >
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Select department" />
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

          {selectedDepartment && (
            <Select
              value={selectedSubject}
              onValueChange={setSelectedSubject}
            >
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Subjects</SelectItem>
                {subjects?.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id.toString()}>
                    {subject.code}: {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          <Button variant="outline">
            <FileDown className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-3 w-full sm:w-[400px]">
          <TabsTrigger value="department">
            <BarChart3 className="h-4 w-4 mr-2" />
            Department
          </TabsTrigger>
          <TabsTrigger value="course">
            <Activity className="h-4 w-4 mr-2" />
            Course
          </TabsTrigger>
          <TabsTrigger value="trend">
            <ListChecks className="h-4 w-4 mr-2" />
            Trends
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="department" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Program Outcome Attainment</CardTitle>
                <CardDescription>
                  Overall program outcome attainment levels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={programAttainmentData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => [`${value}%`, 'Attainment']} />
                      <Legend />
                      <Bar dataKey="value" name="Attainment %" fill="#1976d2" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" size="sm">
                  <FileSpreadsheet className="h-4 w-4 mr-1" />
                  Excel
                </Button>
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-1" />
                  PDF
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Assessment Contributions</CardTitle>
                <CardDescription>
                  Breakdown of assessment components
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <Pie
                        data={assessmentContributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {assessmentContributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, 'Contribution']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" size="sm">
                  <FileSpreadsheet className="h-4 w-4 mr-1" />
                  Excel
                </Button>
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-1" />
                  PDF
                </Button>
              </CardFooter>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Departmental Performance Radar</CardTitle>
              <CardDescription>
                Comparison of department performance against institutional benchmarks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart outerRadius={150} width={500} height={300} data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="attribute" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name="Department"
                      dataKey="department"
                      stroke="#1976d2"
                      fill="#1976d2"
                      fillOpacity={0.6}
                    />
                    <Radar
                      name="Institution"
                      dataKey="institution"
                      stroke="#f57c00"
                      fill="#f57c00"
                      fillOpacity={0.6}
                    />
                    <Legend />
                    <Tooltip formatter={(value) => [`${value}%`]} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="course" className="space-y-6 mt-4">
          {selectedSubject ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Course Outcome Attainment</CardTitle>
                  <CardDescription>
                    Direct and indirect attainment for selected course
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={courseAttainmentData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip formatter={(value) => [`${value}%`, 'Attainment']} />
                        <Legend />
                        <Bar dataKey="direct" name="Direct Attainment" fill="#1976d2" />
                        <Bar dataKey="indirect" name="Indirect Attainment" fill="#f57c00" />
                        <Bar dataKey="total" name="Total Attainment" fill="#43a047" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button variant="outline" size="sm">
                    <FileSpreadsheet className="h-4 w-4 mr-1" />
                    Excel
                  </Button>
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-1" />
                    PDF
                  </Button>
                </CardFooter>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>CO-PO Mapping Heatmap</CardTitle>
                    <CardDescription>
                      Curriculum attainment matrix visualization
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-col items-center justify-center h-60">
                      <ListChecks className="h-12 w-12 text-gray-300 mb-4" />
                      <p className="text-center text-gray-500">
                        Course specific CO-PO mapping visualization will be displayed here.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Student Performance Distribution</CardTitle>
                    <CardDescription>
                      Student performance across course outcomes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-col items-center justify-center h-60">
                      <PieChartIcon className="h-12 w-12 text-gray-300 mb-4" />
                      <p className="text-center text-gray-500">
                        Performance distribution across different student groups will be displayed here.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Activity className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No Course Selected</h3>
                <p className="text-gray-500 mb-6 text-center max-w-md">
                  Please select a department and subject to view detailed course reports.
                </p>
                <div className="flex gap-4">
                  <Select
                    value={selectedDepartment}
                    onValueChange={setSelectedDepartment}
                  >
                    <SelectTrigger className="w-52">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments?.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedDepartment && (
                    <Select
                      value={selectedSubject}
                      onValueChange={setSelectedSubject}
                    >
                      <SelectTrigger className="w-52">
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects?.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id.toString()}>
                            {subject.code}: {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="trend" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Yearly Attainment Trends</CardTitle>
              <CardDescription>
                Program outcome attainment trends over academic years
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={yearlyTrendData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Attainment']} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="attainment" 
                      name="PO Attainment" 
                      stroke="#1976d2" 
                      strokeWidth={2}
                      activeDot={{ r: 8 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" size="sm">
                <FileSpreadsheet className="h-4 w-4 mr-1" />
                Excel
              </Button>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-1" />
                PDF
              </Button>
            </CardFooter>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Assessment Component Trends</CardTitle>
                <CardDescription>
                  Year-over-year comparison of assessment components
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-col items-center justify-center h-60">
                  <BarChart3 className="h-12 w-12 text-gray-300 mb-4" />
                  <p className="text-center text-gray-500">
                    Trends in different assessment components will be displayed here.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Placement & Higher Studies Trends</CardTitle>
                <CardDescription>
                  Graduate outcomes and their correlation with attainments
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-col items-center justify-center h-60">
                  <Calendar className="h-12 w-12 text-gray-300 mb-4" />
                  <p className="text-center text-gray-500">
                    Trends in placement and higher studies will be displayed here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Report Generation</CardTitle>
              <CardDescription>
                Generate comprehensive reports for accreditation and review
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Department Report</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">
                      Comprehensive department-level attainment report with all program outcomes
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full">
                      <Download className="h-4 w-4 mr-1" />
                      Generate
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Subject Report</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">
                      Detailed subject-specific attainment report with all course outcomes
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full">
                      <Download className="h-4 w-4 mr-1" />
                      Generate
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Accreditation Report</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">
                      Comprehensive report suitable for accreditation purposes
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full">
                      <Download className="h-4 w-4 mr-1" />
                      Generate
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
