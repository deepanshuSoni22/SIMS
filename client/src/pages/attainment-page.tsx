import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth, roles } from "@/hooks/use-auth";
import { 
  Department, Subject, CourseOutcome, DirectAssessment, 
  ProgramOutcome, CoPOMapping,
  insertDirectAssessmentSchema, 
  insertStudentAssessmentMarksSchema,
  insertCoPOMappingSchema
} from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  Plus, Search, RefreshCw, Award, BarChart2, Pencil, FileCheck, FilePlus2, 
  MapPin, BookOpen, BarChart, List, ListChecks
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { 
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid,
  Legend 
} from "recharts";

type DirectAssessmentFormValues = z.infer<typeof insertDirectAssessmentSchema>;
type StudentAssessmentMarksFormValues = z.infer<typeof insertStudentAssessmentMarksSchema>;
type CoPOMappingFormValues = z.infer<typeof insertCoPOMappingSchema>;

export default function AttainmentPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("direct");
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [isCreateAssessmentDialogOpen, setIsCreateAssessmentDialogOpen] = useState(false);
  const [isAddMarksDialogOpen, setIsAddMarksDialogOpen] = useState(false);
  const [isMappingDialogOpen, setIsMappingDialogOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<DirectAssessment | null>(null);

  // Fetch subjects
  const { data: subjects, isLoading: isSubjectsLoading } = useQuery<Subject[]>({
    queryKey: user?.role === roles.FACULTY 
      ? ["/api/subjects/faculty", user.id] 
      : ["/api/subjects"],
  });

  // Fetch departments
  const { data: departments } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  // Fetch direct assessments if a subject is selected
  const { data: directAssessments, isLoading: isAssessmentsLoading } = useQuery<DirectAssessment[]>({
    queryKey: ["/api/direct-assessments/subject", selectedSubjectId],
    enabled: !!selectedSubjectId,
  });

  // Fetch course outcomes if a subject is selected
  const { data: courseOutcomes, isLoading: isCourseOutcomesLoading } = useQuery<CourseOutcome[]>({
    queryKey: ["/api/course-outcomes/subject", selectedSubjectId],
    enabled: !!selectedSubjectId,
  });

  // Fetch program outcomes if there's a department
  const { data: programOutcomes, isLoading: isProgramOutcomesLoading } = useQuery<ProgramOutcome[]>({
    queryKey: ["/api/program-outcomes/department", user?.departmentId],
    enabled: !!user?.departmentId,
  });

  // Create direct assessment mutation
  const createAssessmentMutation = useMutation({
    mutationFn: async (data: DirectAssessmentFormValues) => {
      const res = await apiRequest("POST", "/api/direct-assessments", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Assessment created successfully",
        description: "The assessment has been added to the system.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/direct-assessments/subject", selectedSubjectId] });
      setIsCreateAssessmentDialogOpen(false);
      assessmentForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create assessment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add student assessment marks mutation
  const addMarksMutation = useMutation({
    mutationFn: async (data: StudentAssessmentMarksFormValues) => {
      const res = await apiRequest("POST", "/api/student-assessment-marks", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Marks added successfully",
        description: "The student assessment marks have been recorded.",
      });
      setIsAddMarksDialogOpen(false);
      marksForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add marks",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create CO-PO mapping mutation
  const createMappingMutation = useMutation({
    mutationFn: async (data: CoPOMappingFormValues) => {
      const res = await apiRequest("POST", "/api/co-po-mappings", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Mapping created successfully",
        description: "The CO-PO mapping has been added to the system.",
      });
      setIsMappingDialogOpen(false);
      mappingForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create mapping",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Assessment form
  const assessmentForm = useForm<DirectAssessmentFormValues>({
    resolver: zodResolver(insertDirectAssessmentSchema),
    defaultValues: {
      subjectId: selectedSubjectId || 0,
      assessmentType: "internal",
      maxMarks: 100,
    },
  });

  // Marks form
  const marksForm = useForm<StudentAssessmentMarksFormValues>({
    resolver: zodResolver(insertStudentAssessmentMarksSchema),
    defaultValues: {
      assessmentId: 0,
      studentId: 0,
      courseOutcomeId: 0,
      marksObtained: 0,
    },
  });

  // Mapping form
  const mappingForm = useForm<CoPOMappingFormValues>({
    resolver: zodResolver(insertCoPOMappingSchema),
    defaultValues: {
      courseOutcomeId: 0,
      programOutcomeId: 0,
      correlationLevel: 1,
    },
  });

  const onSubmitAssessment = (data: DirectAssessmentFormValues) => {
    createAssessmentMutation.mutate(data);
  };

  const onSubmitMarks = (data: StudentAssessmentMarksFormValues) => {
    addMarksMutation.mutate(data);
  };

  const onSubmitMapping = (data: CoPOMappingFormValues) => {
    createMappingMutation.mutate(data);
  };

  const handleSubjectChange = (subjectId: string) => {
    const id = parseInt(subjectId);
    setSelectedSubjectId(id);
    if (assessmentForm.getValues("subjectId") !== id) {
      assessmentForm.setValue("subjectId", id);
    }
  };

  const handleCreateAssessment = () => {
    if (!selectedSubjectId) {
      toast({
        title: "No subject selected",
        description: "Please select a subject first.",
        variant: "destructive",
      });
      return;
    }
    setIsCreateAssessmentDialogOpen(true);
  };

  const handleAddMarks = (assessment: DirectAssessment) => {
    setSelectedAssessment(assessment);
    marksForm.setValue("assessmentId", assessment.id);
    setIsAddMarksDialogOpen(true);
  };

  const handleCreateMapping = () => {
    if (!selectedSubjectId) {
      toast({
        title: "No subject selected",
        description: "Please select a subject first.",
        variant: "destructive",
      });
      return;
    }
    setIsMappingDialogOpen(true);
  };

  // Sample CO attainment data for charts
  const courseOutcomeData = courseOutcomes?.map((co) => ({
    name: `CO ${co.outcomeNumber}`,
    attainment: Math.floor(Math.random() * 30) + 60, // Random attainment percentage for demo
  })) || [];

  // Sample PO attainment data for charts
  const programOutcomeData = programOutcomes?.map((po) => ({
    name: `PO ${po.outcomeNumber}`,
    attainment: Math.floor(Math.random() * 20) + 70, // Random attainment percentage for demo
  })) || [];

  // Sample CO-PO mapping data
  const mappingData = [
    { co: "CO1", po1: 3, po2: 2, po3: 1, po4: 0, po5: 2 },
    { co: "CO2", po1: 2, po2: 3, po3: 2, po4: 1, po5: 0 },
    { co: "CO3", po1: 1, po2: 2, po3: 3, po4: 2, po5: 1 },
    { co: "CO4", po1: 0, po2: 1, po3: 2, po4: 3, po5: 2 },
    { co: "CO5", po1: 2, po2: 0, po3: 1, po4: 2, po5: 3 },
  ];

  const canEditAssessments = user?.role === roles.FACULTY || user?.role === roles.HOD || user?.role === roles.ADMIN;

  return (
    <AppLayout title="Attainments">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attainment Management</h1>
          <p className="text-gray-500">Manage direct and indirect attainments and CO-PO mappings</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select
            value={selectedSubjectId?.toString() || ""}
            onValueChange={handleSubjectChange}
          >
            <SelectTrigger className="w-60">
              <SelectValue placeholder="Select a subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects?.map((subject) => (
                <SelectItem key={subject.id} value={subject.id.toString()}>
                  {subject.code}: {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {canEditAssessments && (
            <Button onClick={handleCreateAssessment} disabled={!selectedSubjectId}>
              <Plus className="h-4 w-4 mr-2" />
              Add Assessment
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-3 w-full sm:w-[400px]">
          <TabsTrigger value="direct">
            <FileCheck className="h-4 w-4 mr-2" />
            Direct Attainment
          </TabsTrigger>
          <TabsTrigger value="indirect">
            <BarChart2 className="h-4 w-4 mr-2" />
            Indirect Attainment
          </TabsTrigger>
          <TabsTrigger value="mapping">
            <MapPin className="h-4 w-4 mr-2" />
            CO-PO Mapping
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="direct" className="space-y-6 mt-4">
          {selectedSubjectId ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Direct Assessments</CardTitle>
                  <CardDescription>
                    Internal tests, preparatory exams, and course work
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Max Marks</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isAssessmentsLoading ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-10">
                              <div className="flex justify-center">
                                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : directAssessments && directAssessments.length > 0 ? (
                          directAssessments.map((assessment) => (
                            <TableRow key={assessment.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Award className="h-4 w-4 text-gray-500" />
                                  <span className="capitalize">{assessment.assessmentType}</span>
                                </div>
                              </TableCell>
                              <TableCell>{assessment.maxMarks}</TableCell>
                              <TableCell>{new Date(assessment.createdAt).toLocaleDateString()}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  {canEditAssessments && (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleAddMarks(assessment)}
                                    >
                                      <FilePlus2 className="h-4 w-4 mr-1" />
                                      Add Marks
                                    </Button>
                                  )}
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-10">
                              <p className="text-gray-500">No assessments found for this subject</p>
                              {canEditAssessments && (
                                <Button 
                                  variant="outline"
                                  className="mt-2"
                                  onClick={handleCreateAssessment}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Create Assessment
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Course Outcome Attainment</CardTitle>
                  <CardDescription>
                    Direct attainment levels for course outcomes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isAssessmentsLoading || isCourseOutcomesLoading ? (
                    <div className="flex justify-center py-10">
                      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  ) : courseOutcomes && courseOutcomes.length > 0 ? (
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart
                          data={courseOutcomeData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip formatter={(value) => [`${value}%`, 'Attainment']} />
                          <Legend />
                          <Bar dataKey="attainment" name="Attainment %" fill="#1976d2" />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-gray-500">No course outcomes defined for this subject</p>
                      {canEditAssessments && (
                        <Button 
                          variant="outline"
                          className="mt-2"
                          onClick={() => {
                            toast({
                              title: "Info",
                              description: "Add course outcomes from the Course Plan page first.",
                            });
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Course Outcomes
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <BookOpen className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No Subject Selected</h3>
                <p className="text-gray-500 mb-4">Please select a subject to view its direct attainment data.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="indirect" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Indirect Assessment</CardTitle>
              <CardDescription>
                Course exit surveys, program exit surveys, and alumni feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10">
                <BarChart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">Indirect Assessment Data</h3>
                <p className="text-gray-500 mb-4">
                  This section displays indirect assessment data collected through various surveys and feedback mechanisms.
                </p>
                {user?.role === roles.ADMIN || user?.role === roles.HOD ? (
                  <Button>
                    <Plus className="h-4 w-4 mr-1" />
                    Create Indirect Assessment
                  </Button>
                ) : (
                  <p className="text-sm text-gray-400">
                    Please contact the administrator or HOD to manage indirect assessments.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Program Outcome Attainment (Indirect)</CardTitle>
              <CardDescription>
                Program outcome attainment based on indirect assessments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isProgramOutcomesLoading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : programOutcomes && programOutcomes.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={programOutcomeData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => [`${value}%`, 'Attainment']} />
                      <Legend />
                      <Bar dataKey="attainment" name="Attainment %" fill="#f57c00" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-500">No program outcomes available for this department</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="mapping" className="space-y-6 mt-4">
          {selectedSubjectId ? (
            <>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Curriculum Attainment Matrix</h2>
                {canEditAssessments && (
                  <Button onClick={handleCreateMapping}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add CO-PO Mapping
                  </Button>
                )}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>CO-PO Mapping Matrix</CardTitle>
                  <CardDescription>
                    Mapping between Course Outcomes and Program Outcomes
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  {isCourseOutcomesLoading || isProgramOutcomesLoading ? (
                    <div className="flex justify-center py-10">
                      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  ) : courseOutcomes && courseOutcomes.length > 0 && programOutcomes && programOutcomes.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>CO/PO</TableHead>
                          {programOutcomes.slice(0, 8).map((po) => (
                            <TableHead key={po.id} className="text-center">
                              PO{po.outcomeNumber}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mappingData.map((row, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{row.co}</TableCell>
                            <TableCell className="text-center">
                              {row.po1 > 0 ? (
                                <Badge variant={row.po1 === 3 ? "default" : row.po1 === 2 ? "secondary" : "outline"}>
                                  {row.po1}
                                </Badge>
                              ) : "-"}
                            </TableCell>
                            <TableCell className="text-center">
                              {row.po2 > 0 ? (
                                <Badge variant={row.po2 === 3 ? "default" : row.po2 === 2 ? "secondary" : "outline"}>
                                  {row.po2}
                                </Badge>
                              ) : "-"}
                            </TableCell>
                            <TableCell className="text-center">
                              {row.po3 > 0 ? (
                                <Badge variant={row.po3 === 3 ? "default" : row.po3 === 2 ? "secondary" : "outline"}>
                                  {row.po3}
                                </Badge>
                              ) : "-"}
                            </TableCell>
                            <TableCell className="text-center">
                              {row.po4 > 0 ? (
                                <Badge variant={row.po4 === 3 ? "default" : row.po4 === 2 ? "secondary" : "outline"}>
                                  {row.po4}
                                </Badge>
                              ) : "-"}
                            </TableCell>
                            <TableCell className="text-center">
                              {row.po5 > 0 ? (
                                <Badge variant={row.po5 === 3 ? "default" : row.po5 === 2 ? "secondary" : "outline"}>
                                  {row.po5}
                                </Badge>
                              ) : "-"}
                            </TableCell>
                            <TableCell className="text-center">-</TableCell>
                            <TableCell className="text-center">-</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-gray-500">No course outcomes or program outcomes available</p>
                      <p className="text-sm text-gray-400 mt-1">Define course outcomes and program outcomes first</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Course Outcomes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isCourseOutcomesLoading ? (
                      <div className="flex justify-center py-10">
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                      </div>
                    ) : courseOutcomes && courseOutcomes.length > 0 ? (
                      <ul className="space-y-2">
                        {courseOutcomes.map((co) => (
                          <li key={co.id} className="p-3 border rounded-md">
                            <div className="flex gap-2 items-start">
                              <Badge className="mt-0.5">CO{co.outcomeNumber}</Badge>
                              <div>
                                <p className="text-sm text-gray-700">{co.description}</p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No course outcomes defined</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Program Outcomes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isProgramOutcomesLoading ? (
                      <div className="flex justify-center py-10">
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                      </div>
                    ) : programOutcomes && programOutcomes.length > 0 ? (
                      <ul className="space-y-2">
                        {programOutcomes.slice(0, 5).map((po) => (
                          <li key={po.id} className="p-3 border rounded-md">
                            <div className="flex gap-2 items-start">
                              <Badge variant="secondary" className="mt-0.5">PO{po.outcomeNumber}</Badge>
                              <div>
                                <p className="text-sm text-gray-700">{po.description}</p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No program outcomes defined</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <MapPin className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No Subject Selected</h3>
                <p className="text-gray-500 mb-4">Please select a subject to view its CO-PO mapping data.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Direct Assessment Dialog */}
      <Dialog open={isCreateAssessmentDialogOpen} onOpenChange={setIsCreateAssessmentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Direct Assessment</DialogTitle>
            <DialogDescription>
              Add a new assessment for measuring course outcomes
            </DialogDescription>
          </DialogHeader>
          
          <Form {...assessmentForm}>
            <form onSubmit={assessmentForm.handleSubmit(onSubmitAssessment)} className="space-y-4">
              <FormField
                control={assessmentForm.control}
                name="assessmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assessment Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select assessment type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="internal">Internal Test</SelectItem>
                        <SelectItem value="preparatory">Preparatory Exam</SelectItem>
                        <SelectItem value="assignment">Assignment</SelectItem>
                        <SelectItem value="quiz">Quiz</SelectItem>
                        <SelectItem value="lab">Lab Work</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The type of assessment being conducted
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={assessmentForm.control}
                name="maxMarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Marks</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateAssessmentDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createAssessmentMutation.isPending}>
                  {createAssessmentMutation.isPending ? "Creating..." : "Create Assessment"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Student Marks Dialog */}
      <Dialog open={isAddMarksDialogOpen} onOpenChange={setIsAddMarksDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Student Marks</DialogTitle>
            <DialogDescription>
              {selectedAssessment && (
                <>Record marks for {selectedAssessment.assessmentType} assessment</>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...marksForm}>
            <form onSubmit={marksForm.handleSubmit(onSubmitMarks)} className="space-y-4">
              <FormField
                control={marksForm.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student ID</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Student ID" 
                        {...field} 
                        onChange={e => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the student's ID number
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={marksForm.control}
                name="courseOutcomeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Outcome</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      value={field.value ? field.value.toString() : ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select course outcome" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {courseOutcomes?.map((co) => (
                          <SelectItem key={co.id} value={co.id.toString()}>
                            CO{co.outcomeNumber}: {co.description.substring(0, 40)}...
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={marksForm.control}
                name="marksObtained"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marks Obtained</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Out of {selectedAssessment?.maxMarks || 100} marks
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddMarksDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addMarksMutation.isPending}>
                  {addMarksMutation.isPending ? "Saving..." : "Save Marks"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* CO-PO Mapping Dialog */}
      <Dialog open={isMappingDialogOpen} onOpenChange={setIsMappingDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create CO-PO Mapping</DialogTitle>
            <DialogDescription>
              Map course outcomes to program outcomes
            </DialogDescription>
          </DialogHeader>
          
          <Form {...mappingForm}>
            <form onSubmit={mappingForm.handleSubmit(onSubmitMapping)} className="space-y-4">
              <FormField
                control={mappingForm.control}
                name="courseOutcomeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Outcome</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      value={field.value ? field.value.toString() : ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select course outcome" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {courseOutcomes?.map((co) => (
                          <SelectItem key={co.id} value={co.id.toString()}>
                            CO{co.outcomeNumber}: {co.description.substring(0, 40)}...
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={mappingForm.control}
                name="programOutcomeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Program Outcome</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      value={field.value ? field.value.toString() : ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select program outcome" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {programOutcomes?.map((po) => (
                          <SelectItem key={po.id} value={po.id.toString()}>
                            PO{po.outcomeNumber}: {po.description.substring(0, 40)}...
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={mappingForm.control}
                name="correlationLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correlation Level</FormLabel>
                    <FormDescription>
                      Indicate the strength of the relationship between the CO and PO
                    </FormDescription>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value.toString()}
                        className="flex space-x-1"
                      >
                        <FormItem className="flex items-center space-x-1 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="1" />
                          </FormControl>
                          <FormLabel className="font-normal">Low (1)</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-1 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="2" />
                          </FormControl>
                          <FormLabel className="font-normal">Medium (2)</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-1 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="3" />
                          </FormControl>
                          <FormLabel className="font-normal">High (3)</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsMappingDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMappingMutation.isPending}>
                  {createMappingMutation.isPending ? "Creating..." : "Create Mapping"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
