import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth, roles } from "@/hooks/use-auth";
import { Subject, CoursePlan, CourseOutcome, insertCoursePlanSchema, insertCourseOutcomeSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  Plus, Search, RefreshCw, Pencil, Trash2, Eye, Save, Check, FileText
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
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Extended schema for course plan content
const coursePlanContentSchema = z.object({
  overview: z.string().min(1, "Course overview is required"),
  objectives: z.array(z.string()),
  modules: z.array(z.object({
    title: z.string(),
    topics: z.array(z.string()),
    duration: z.number(),
  })),
  assessmentMethods: z.array(z.object({
    type: z.string(),
    weightage: z.number(),
    description: z.string(),
  })),
  references: z.array(z.string()),
});

type CoursePlanContentType = z.infer<typeof coursePlanContentSchema>;

// Form type for course plan
type CreateCoursePlanFormValues = {
  subjectId: number;
  status: string;
  content: CoursePlanContentType;
};

// Form type for course outcome
type CreateCourseOutcomeFormValues = z.infer<typeof insertCourseOutcomeSchema>;

export default function CoursePlanPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isAddCoursePlanDialogOpen, setIsAddCoursePlanDialogOpen] = useState(false);
  const [isAddCourseOutcomeDialogOpen, setIsAddCourseOutcomeDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [viewingCoursePlan, setViewingCoursePlan] = useState<CoursePlan | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Fetch subjects assigned to the faculty or all subjects for admin/HOD
  const { data: subjects, isLoading: isSubjectsLoading } = useQuery<Subject[]>({
    queryKey: user?.role === roles.FACULTY 
      ? ["/api/subjects/faculty", user.id] 
      : ["/api/subjects"],
  });

  // Fetch course plans
  const { data: coursePlans, isLoading: isCoursePlansLoading, refetch } = useQuery<CoursePlan[]>({
    queryKey: user?.role === roles.FACULTY 
      ? ["/api/course-plans/faculty", user.id] 
      : ["/api/course-plans"],
  });

  // Create course plan mutation
  const createCoursePlanMutation = useMutation({
    mutationFn: async (data: CreateCoursePlanFormValues) => {
      const payload = {
        ...data,
        facultyId: user?.id,
      };
      const res = await apiRequest("POST", "/api/course-plans", payload);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Course plan created successfully",
        description: "The course plan has been added to the system.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/course-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/course-plans/faculty", user?.id] });
      setIsAddCoursePlanDialogOpen(false);
      coursePlanForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create course plan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create course outcome mutation
  const createCourseOutcomeMutation = useMutation({
    mutationFn: async (data: CreateCourseOutcomeFormValues) => {
      const res = await apiRequest("POST", "/api/course-outcomes", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Course outcome created successfully",
        description: "The course outcome has been added to the system.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/course-outcomes"] });
      setIsAddCourseOutcomeDialogOpen(false);
      courseOutcomeForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create course outcome",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Default course plan content template
  const defaultCoursePlanContent: CoursePlanContentType = {
    overview: "",
    objectives: ["", ""],
    modules: [
      { title: "Module 1", topics: [""], duration: 8 },
      { title: "Module 2", topics: [""], duration: 8 },
    ],
    assessmentMethods: [
      { type: "Internal Test", weightage: 30, description: "Written exam" },
      { type: "Assignments", weightage: 20, description: "Practical work" },
      { type: "Final Exam", weightage: 50, description: "Comprehensive exam" },
    ],
    references: ["", ""],
  };

  // Course plan form
  const coursePlanForm = useForm<CreateCoursePlanFormValues>({
    defaultValues: {
      subjectId: 0,
      status: "draft",
      content: defaultCoursePlanContent,
    },
  });

  // Course outcome form
  const courseOutcomeForm = useForm<CreateCourseOutcomeFormValues>({
    resolver: zodResolver(insertCourseOutcomeSchema),
    defaultValues: {
      subjectId: 0,
      outcomeNumber: 1,
      description: "",
    },
  });

  const onSubmitCoursePlan = (data: CreateCoursePlanFormValues) => {
    createCoursePlanMutation.mutate(data);
  };

  const onSubmitCourseOutcome = (data: CreateCourseOutcomeFormValues) => {
    createCourseOutcomeMutation.mutate(data);
  };

  // Filter course plans based on search query and status
  const filteredCoursePlans = coursePlans?.filter(plan => {
    const subject = subjects?.find(s => s.id === plan.subjectId);
    const matchesSearch = searchQuery 
      ? subject?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        subject?.code?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    
    const matchesStatus = activeTab !== "all" 
      ? plan.status === activeTab
      : true;
    
    return matchesSearch && matchesStatus;
  });

  const handleAddCoursePlan = (subject: Subject) => {
    setSelectedSubject(subject);
    coursePlanForm.setValue("subjectId", subject.id);
    setIsAddCoursePlanDialogOpen(true);
  };

  const handleAddCourseOutcome = (subject: Subject) => {
    setSelectedSubject(subject);
    courseOutcomeForm.setValue("subjectId", subject.id);
    setIsAddCourseOutcomeDialogOpen(true);
  };

  const handleViewCoursePlan = (plan: CoursePlan) => {
    setViewingCoursePlan(plan);
    setIsViewDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'complete':
        return <Badge className="bg-green-100 text-green-800">Complete</Badge>;
      case 'in-progress':
        return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      case 'draft':
        return <Badge className="bg-blue-100 text-blue-800">Draft</Badge>;
      default:
        return <Badge className="bg-red-100 text-red-800">Pending</Badge>;
    }
  };

  // Add and remove form array fields
  const addObjectiveField = () => {
    const objectives = coursePlanForm.getValues("content.objectives");
    coursePlanForm.setValue("content.objectives", [...objectives, ""]);
  };

  const removeObjectiveField = (index: number) => {
    const objectives = coursePlanForm.getValues("content.objectives");
    if (objectives.length > 1) {
      objectives.splice(index, 1);
      coursePlanForm.setValue("content.objectives", objectives);
    }
  };

  const addModuleField = () => {
    const modules = coursePlanForm.getValues("content.modules");
    coursePlanForm.setValue("content.modules", [...modules, { title: `Module ${modules.length + 1}`, topics: [""], duration: 8 }]);
  };

  const removeModuleField = (index: number) => {
    const modules = coursePlanForm.getValues("content.modules");
    if (modules.length > 1) {
      modules.splice(index, 1);
      coursePlanForm.setValue("content.modules", modules);
    }
  };

  const addTopicField = (moduleIndex: number) => {
    const modules = coursePlanForm.getValues("content.modules");
    modules[moduleIndex].topics.push("");
    coursePlanForm.setValue("content.modules", modules);
  };

  const removeTopicField = (moduleIndex: number, topicIndex: number) => {
    const modules = coursePlanForm.getValues("content.modules");
    if (modules[moduleIndex].topics.length > 1) {
      modules[moduleIndex].topics.splice(topicIndex, 1);
      coursePlanForm.setValue("content.modules", modules);
    }
  };

  const addAssessmentField = () => {
    const assessments = coursePlanForm.getValues("content.assessmentMethods");
    coursePlanForm.setValue("content.assessmentMethods", [...assessments, { type: "", weightage: 0, description: "" }]);
  };

  const removeAssessmentField = (index: number) => {
    const assessments = coursePlanForm.getValues("content.assessmentMethods");
    if (assessments.length > 1) {
      assessments.splice(index, 1);
      coursePlanForm.setValue("content.assessmentMethods", assessments);
    }
  };

  const addReferenceField = () => {
    const references = coursePlanForm.getValues("content.references");
    coursePlanForm.setValue("content.references", [...references, ""]);
  };

  const removeReferenceField = (index: number) => {
    const references = coursePlanForm.getValues("content.references");
    if (references.length > 1) {
      references.splice(index, 1);
      coursePlanForm.setValue("content.references", references);
    }
  };

  const canCreateCoursePlan = user?.role === roles.FACULTY;

  return (
    <AppLayout title="Course Plans">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Plans</h1>
          <p className="text-gray-500">Manage course plans and learning outcomes</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle>Course Plans</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search course plans..."
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
              <TabsTrigger value="draft">Draft</TabsTrigger>
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
                  <TableHead>Subject</TableHead>
                  {user?.role !== roles.FACULTY && <TableHead>Faculty</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isCoursePlansLoading || isSubjectsLoading ? (
                  <TableRow>
                    <TableCell colSpan={user?.role !== roles.FACULTY ? 5 : 4} className="text-center py-10">
                      <div className="flex justify-center">
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredCoursePlans && filteredCoursePlans.length > 0 ? (
                  filteredCoursePlans.map((plan) => {
                    const subject = subjects?.find(s => s.id === plan.subjectId);
                    
                    return (
                      <TableRow key={plan.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <span>{subject?.name || `Subject #${plan.subjectId}`}</span>
                          </div>
                        </TableCell>
                        {user?.role !== roles.FACULTY && (
                          <TableCell>Faculty ID: {plan.facultyId}</TableCell>
                        )}
                        <TableCell>{getStatusBadge(plan.status)}</TableCell>
                        <TableCell>{new Date(plan.lastUpdated).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="View Course Plan"
                              onClick={() => handleViewCoursePlan(plan)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canCreateCoursePlan && plan.facultyId === user?.id && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  title="Edit Course Plan"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  title="Delete Course Plan"
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
                    <TableCell colSpan={user?.role !== roles.FACULTY ? 5 : 4} className="text-center py-10">
                      <p className="text-gray-500">No course plans found</p>
                      {searchQuery || activeTab !== "all" ? (
                        <p className="text-gray-400 text-sm mt-1">
                          Try different search criteria or clear filters
                        </p>
                      ) : canCreateCoursePlan && subjects && subjects.length > 0 ? (
                        <div className="mt-4">
                          <p className="text-gray-600 mb-2">Select a subject to create a course plan:</p>
                          <div className="flex flex-wrap gap-2 justify-center max-w-xl mx-auto">
                            {subjects.map((subject) => (
                              <Button 
                                key={subject.id} 
                                variant="outline"
                                onClick={() => handleAddCoursePlan(subject)}
                              >
                                {subject.code}: {subject.name}
                              </Button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm mt-1">
                          {user?.role === roles.FACULTY ? "You have no subjects assigned." : "No subjects available."}
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

      {/* Subjects with no course plans */}
      {canCreateCoursePlan && subjects && subjects.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Subjects Requiring Course Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject Code</TableHead>
                    <TableHead>Subject Name</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Academic Year</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isSubjectsLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10">
                        <div className="flex justify-center">
                          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : subjects && subjects.length > 0 ? (
                    subjects
                      .filter(subject => 
                        !coursePlans?.find(plan => plan.subjectId === subject.id)
                      )
                      .map((subject) => (
                        <TableRow key={subject.id}>
                          <TableCell>{subject.code}</TableCell>
                          <TableCell className="font-medium">{subject.name}</TableCell>
                          <TableCell>{subject.semester}</TableCell>
                          <TableCell>{subject.academicYear}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleAddCoursePlan(subject)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Create Plan
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleAddCourseOutcome(subject)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Outcome
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10">
                        <p className="text-gray-500">All subjects have course plans</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Course Plan Creation Dialog */}
      <Dialog open={isAddCoursePlanDialogOpen} onOpenChange={setIsAddCoursePlanDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Course Plan</DialogTitle>
            <DialogDescription>
              {selectedSubject ? (
                <>Create a course plan for <strong>{selectedSubject.name}</strong></>
              ) : (
                <>Create a new course plan</>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...coursePlanForm}>
            <form onSubmit={coursePlanForm.handleSubmit(onSubmitCoursePlan)} className="space-y-6">
              <FormField
                control={coursePlanForm.control}
                name="content.overview"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Overview</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Provide a brief overview of the course" 
                        className="min-h-24"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <h3 className="text-lg font-medium mb-2">Course Objectives</h3>
                {coursePlanForm.getValues("content.objectives").map((_, index) => (
                  <div key={index} className="flex items-start mb-2 gap-2">
                    <FormField
                      control={coursePlanForm.control}
                      name={`content.objectives.${index}`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input 
                              placeholder={`Objective ${index + 1}`} 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon"
                      onClick={() => removeObjectiveField(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={addObjectiveField}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Objective
                </Button>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Course Modules</h3>
                <Accordion type="multiple" className="w-full">
                  {coursePlanForm.getValues("content.modules").map((_, moduleIndex) => (
                    <AccordionItem key={moduleIndex} value={`module-${moduleIndex}`}>
                      <div className="flex items-center">
                        <AccordionTrigger className="flex-1">
                          Module {moduleIndex + 1}: {coursePlanForm.getValues(`content.modules.${moduleIndex}.title`)}
                        </AccordionTrigger>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="icon"
                          className="mr-4"
                          onClick={() => removeModuleField(moduleIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <AccordionContent>
                        <div className="space-y-4 p-2">
                          <FormField
                            control={coursePlanForm.control}
                            name={`content.modules.${moduleIndex}.title`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Module Title</FormLabel>
                                <FormControl>
                                  <Input placeholder="Module Title" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={coursePlanForm.control}
                            name={`content.modules.${moduleIndex}.duration`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Duration (hours)</FormLabel>
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
                          
                          <div>
                            <FormLabel>Topics</FormLabel>
                            {coursePlanForm.getValues(`content.modules.${moduleIndex}.topics`).map((_, topicIndex) => (
                              <div key={topicIndex} className="flex items-center mb-2 gap-2">
                                <FormField
                                  control={coursePlanForm.control}
                                  name={`content.modules.${moduleIndex}.topics.${topicIndex}`}
                                  render={({ field }) => (
                                    <FormItem className="flex-1">
                                      <FormControl>
                                        <Input placeholder={`Topic ${topicIndex + 1}`} {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="icon"
                                  onClick={() => removeTopicField(moduleIndex, topicIndex)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              onClick={() => addTopicField(moduleIndex)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Topic
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  className="mt-2"
                  onClick={addModuleField}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Module
                </Button>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Assessment Methods</h3>
                <div className="space-y-4">
                  {coursePlanForm.getValues("content.assessmentMethods").map((_, index) => (
                    <div key={index} className="flex items-start gap-4 border p-3 rounded-md">
                      <div className="grid grid-cols-2 gap-3 flex-1">
                        <FormField
                          control={coursePlanForm.control}
                          name={`content.assessmentMethods.${index}.type`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Assessment Type</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Exam, Assignment" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={coursePlanForm.control}
                          name={`content.assessmentMethods.${index}.weightage`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Weightage (%)</FormLabel>
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
                        
                        <FormField
                          control={coursePlanForm.control}
                          name={`content.assessmentMethods.${index}.description`}
                          render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Assessment description" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon"
                        className="mt-8"
                        onClick={() => removeAssessmentField(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={addAssessmentField}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Assessment Method
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">References</h3>
                {coursePlanForm.getValues("content.references").map((_, index) => (
                  <div key={index} className="flex items-start mb-2 gap-2">
                    <FormField
                      control={coursePlanForm.control}
                      name={`content.references.${index}`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input 
                              placeholder={`Reference ${index + 1}`} 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon"
                      onClick={() => removeReferenceField(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={addReferenceField}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Reference
                </Button>
              </div>

              <FormField
                control={coursePlanForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="complete">Complete</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Set as 'Complete' when the plan is ready for review
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddCoursePlanDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createCoursePlanMutation.isPending}>
                  {createCoursePlanMutation.isPending ? (
                    <>
                      <span className="animate-spin mr-2">⟳</span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Course Plan
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Course Outcome Creation Dialog */}
      <Dialog open={isAddCourseOutcomeDialogOpen} onOpenChange={setIsAddCourseOutcomeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Course Outcome</DialogTitle>
            <DialogDescription>
              {selectedSubject ? (
                <>Define a learning outcome for <strong>{selectedSubject.name}</strong></>
              ) : (
                <>Define a new course learning outcome</>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...courseOutcomeForm}>
            <form onSubmit={courseOutcomeForm.handleSubmit(onSubmitCourseOutcome)} className="space-y-4">
              <FormField
                control={courseOutcomeForm.control}
                name="outcomeNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Outcome Number</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Number identifier for this course outcome (e.g., 1 for CO1)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={courseOutcomeForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Outcome Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="e.g., Students will be able to analyze and design algorithms" 
                        className="min-h-24"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Describe what students should know or be able to do after completing this course
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddCourseOutcomeDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createCourseOutcomeMutation.isPending}>
                  {createCourseOutcomeMutation.isPending ? (
                    <>
                      <span className="animate-spin mr-2">⟳</span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Save Outcome
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Course Plan Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Course Plan Details</DialogTitle>
            <DialogDescription>
              {selectedSubject ? selectedSubject.name : "Course Plan"}
            </DialogDescription>
          </DialogHeader>
          
          {viewingCoursePlan && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Course Overview</h3>
                <p className="text-gray-700 whitespace-pre-line">{viewingCoursePlan.content.overview}</p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Course Objectives</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {viewingCoursePlan.content.objectives.map((objective, index) => (
                    <li key={index} className="text-gray-700">{objective}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Course Modules</h3>
                <div className="space-y-4">
                  {viewingCoursePlan.content.modules.map((module, index) => (
                    <div key={index} className="border rounded-md p-4">
                      <h4 className="font-medium flex justify-between">
                        <span>{module.title}</span>
                        <span className="text-gray-500">{module.duration} hours</span>
                      </h4>
                      <ul className="list-disc pl-5 mt-2">
                        {module.topics.map((topic, topicIndex) => (
                          <li key={topicIndex} className="text-gray-700">{topic}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Assessment Methods</h3>
                <div className="space-y-2">
                  {viewingCoursePlan.content.assessmentMethods.map((assessment, index) => (
                    <div key={index} className="border rounded-md p-4">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-medium">{assessment.type}</h4>
                        <Badge>{assessment.weightage}%</Badge>
                      </div>
                      <p className="text-gray-600 text-sm">{assessment.description}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">References</h3>
                <ul className="list-decimal pl-5 space-y-1">
                  {viewingCoursePlan.content.references.map((reference, index) => (
                    <li key={index} className="text-gray-700">{reference}</li>
                  ))}
                </ul>
              </div>
              
              <div className="flex justify-between items-center border-t pt-4">
                <div>
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="font-medium">{new Date(viewingCoursePlan.lastUpdated).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-500">Status:</p>
                  {getStatusBadge(viewingCoursePlan.status)}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
