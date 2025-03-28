import { 
  users, type User, type InsertUser,
  departments, type Department, type InsertDepartment,
  subjects, type Subject, type InsertSubject,
  subjectAssignments, type SubjectAssignment, type InsertSubjectAssignment,
  courseOutcomes, type CourseOutcome, type InsertCourseOutcome,
  programOutcomes, type ProgramOutcome, type InsertProgramOutcome,
  coPOMappings, type CoPOMapping, type InsertCoPOMapping,
  coursePlans, type CoursePlan, type InsertCoursePlan,
  directAssessments, type DirectAssessment, type InsertDirectAssessment,
  studentAssessmentMarks, type StudentAssessmentMarks, type InsertStudentAssessmentMarks,
  indirectAssessments, type IndirectAssessment, type InsertIndirectAssessment,
  studentResponses, type StudentResponse, type InsertStudentResponse,
  attainments, type Attainment, type InsertAttainment,
  activityLogs, type ActivityLog, type InsertActivityLog
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Define the SessionStore type to fix TypeScript errors
declare module "express-session" {
  interface SessionStore {
    all: (callback: (err: any, sessions?: session.SessionData[] | { [sid: string]: session.SessionData }) => void) => void;
    destroy: (sid: string, callback?: (err?: any) => void) => void;
    clear: (callback?: (err?: any) => void) => void;
    length?: (callback: (err: any, length?: number) => void) => void;
    get: (sid: string, callback: (err: any, session?: session.SessionData | null) => void) => void;
    set: (sid: string, session: session.SessionData, callback?: (err?: any) => void) => void;
    touch: (sid: string, session: session.SessionData, callback?: (err?: any) => void) => void;
  }
}

export interface IStorage {
  // User Management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  getUsersByDepartment(departmentId: number): Promise<User[]>;
  
  // Department Management
  getDepartment(id: number): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: number, department: Partial<InsertDepartment>): Promise<Department | undefined>;
  getAllDepartments(): Promise<Department[]>;
  
  // Subject Management
  getSubject(id: number): Promise<Subject | undefined>;
  getSubjectByCode(code: string): Promise<Subject | undefined>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  updateSubject(id: number, subject: Partial<InsertSubject>): Promise<Subject | undefined>;
  getAllSubjects(): Promise<Subject[]>;
  getSubjectsByDepartment(departmentId: number): Promise<Subject[]>;
  getSubjectsByFaculty(facultyId: number): Promise<Subject[]>;
  
  // Subject Assignment Management
  getSubjectAssignment(id: number): Promise<SubjectAssignment | undefined>;
  createSubjectAssignment(assignment: InsertSubjectAssignment): Promise<SubjectAssignment>;
  deleteSubjectAssignment(id: number): Promise<boolean>;
  getSubjectAssignmentsBySubject(subjectId: number): Promise<SubjectAssignment[]>;
  getSubjectAssignmentsByFaculty(facultyId: number): Promise<SubjectAssignment[]>;
  
  // Course Outcome Management
  getCourseOutcome(id: number): Promise<CourseOutcome | undefined>;
  createCourseOutcome(outcome: InsertCourseOutcome): Promise<CourseOutcome>;
  updateCourseOutcome(id: number, outcome: Partial<InsertCourseOutcome>): Promise<CourseOutcome | undefined>;
  getCourseOutcomesBySubject(subjectId: number): Promise<CourseOutcome[]>;
  
  // Program Outcome Management
  getProgramOutcome(id: number): Promise<ProgramOutcome | undefined>;
  createProgramOutcome(outcome: InsertProgramOutcome): Promise<ProgramOutcome>;
  updateProgramOutcome(id: number, outcome: Partial<InsertProgramOutcome>): Promise<ProgramOutcome | undefined>;
  getProgramOutcomesByDepartment(departmentId: number): Promise<ProgramOutcome[]>;
  
  // CO-PO Mapping Management
  getCoPOMapping(id: number): Promise<CoPOMapping | undefined>;
  createCoPOMapping(mapping: InsertCoPOMapping): Promise<CoPOMapping>;
  updateCoPOMapping(id: number, mapping: Partial<InsertCoPOMapping>): Promise<CoPOMapping | undefined>;
  getCoPOMappingsByCourseOutcome(courseOutcomeId: number): Promise<CoPOMapping[]>;
  getCoPOMappingsByProgramOutcome(programOutcomeId: number): Promise<CoPOMapping[]>;
  
  // Course Plan Management
  getCoursePlan(id: number): Promise<CoursePlan | undefined>;
  createCoursePlan(plan: InsertCoursePlan): Promise<CoursePlan>;
  updateCoursePlan(id: number, plan: Partial<InsertCoursePlan>): Promise<CoursePlan | undefined>;
  getCoursePlanBySubject(subjectId: number): Promise<CoursePlan | undefined>;
  getCoursePlansByFaculty(facultyId: number): Promise<CoursePlan[]>;
  
  // Direct Assessment Management
  getDirectAssessment(id: number): Promise<DirectAssessment | undefined>;
  createDirectAssessment(assessment: InsertDirectAssessment): Promise<DirectAssessment>;
  getDirectAssessmentsBySubject(subjectId: number): Promise<DirectAssessment[]>;
  
  // Student Assessment Marks Management
  getStudentAssessmentMark(id: number): Promise<StudentAssessmentMarks | undefined>;
  createStudentAssessmentMark(mark: InsertStudentAssessmentMarks): Promise<StudentAssessmentMarks>;
  updateStudentAssessmentMark(id: number, mark: Partial<InsertStudentAssessmentMarks>): Promise<StudentAssessmentMarks | undefined>;
  getStudentAssessmentMarksByAssessment(assessmentId: number): Promise<StudentAssessmentMarks[]>;
  getStudentAssessmentMarksByStudent(studentId: number): Promise<StudentAssessmentMarks[]>;
  
  // Indirect Assessment Management
  getIndirectAssessment(id: number): Promise<IndirectAssessment | undefined>;
  createIndirectAssessment(assessment: InsertIndirectAssessment): Promise<IndirectAssessment>;
  getIndirectAssessmentsByDepartment(departmentId: number): Promise<IndirectAssessment[]>;
  
  // Student Response Management
  getStudentResponse(id: number): Promise<StudentResponse | undefined>;
  createStudentResponse(response: InsertStudentResponse): Promise<StudentResponse>;
  getStudentResponsesByAssessment(assessmentId: number): Promise<StudentResponse[]>;
  getStudentResponsesByStudent(studentId: number): Promise<StudentResponse[]>;
  
  // Attainment Management
  getAttainment(id: number): Promise<Attainment | undefined>;
  createAttainment(attainment: InsertAttainment): Promise<Attainment>;
  getAttainmentsBySubject(subjectId: number): Promise<Attainment[]>;
  getAttainmentsByDepartment(departmentId: number): Promise<Attainment[]>;
  
  // Activity Logging
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getRecentActivityLogs(limit: number): Promise<ActivityLog[]>;
  
  // Session Store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private departments: Map<number, Department>;
  private subjects: Map<number, Subject>;
  private subjectAssignments: Map<number, SubjectAssignment>;
  private courseOutcomes: Map<number, CourseOutcome>;
  private programOutcomes: Map<number, ProgramOutcome>;
  private coPOMappings: Map<number, CoPOMapping>;
  private coursePlans: Map<number, CoursePlan>;
  private directAssessments: Map<number, DirectAssessment>;
  private studentAssessmentMarks: Map<number, StudentAssessmentMarks>;
  private indirectAssessments: Map<number, IndirectAssessment>;
  private studentResponses: Map<number, StudentResponse>;
  private attainments: Map<number, Attainment>;
  private activityLogs: Map<number, ActivityLog>;
  
  private userIdCounter: number;
  private departmentIdCounter: number;
  private subjectIdCounter: number;
  private subjectAssignmentIdCounter: number;
  private courseOutcomeIdCounter: number;
  private programOutcomeIdCounter: number;
  private coPOMappingIdCounter: number;
  private coursePlanIdCounter: number;
  private directAssessmentIdCounter: number;
  private studentAssessmentMarkIdCounter: number;
  private indirectAssessmentIdCounter: number;
  private studentResponseIdCounter: number;
  private attainmentIdCounter: number;
  private activityLogIdCounter: number;
  
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.departments = new Map();
    this.subjects = new Map();
    this.subjectAssignments = new Map();
    this.courseOutcomes = new Map();
    this.programOutcomes = new Map();
    this.coPOMappings = new Map();
    this.coursePlans = new Map();
    this.directAssessments = new Map();
    this.studentAssessmentMarks = new Map();
    this.indirectAssessments = new Map();
    this.studentResponses = new Map();
    this.attainments = new Map();
    this.activityLogs = new Map();
    
    this.userIdCounter = 1;
    this.departmentIdCounter = 1;
    this.subjectIdCounter = 1;
    this.subjectAssignmentIdCounter = 1;
    this.courseOutcomeIdCounter = 1;
    this.programOutcomeIdCounter = 1;
    this.coPOMappingIdCounter = 1;
    this.coursePlanIdCounter = 1;
    this.directAssessmentIdCounter = 1;
    this.studentAssessmentMarkIdCounter = 1;
    this.indirectAssessmentIdCounter = 1;
    this.studentResponseIdCounter = 1;
    this.attainmentIdCounter = 1;
    this.activityLogIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Initialize with admin user
    this.createUser({
      name: "Principal Admin",
      username: "admin",
      password: "admin123",
      role: "admin",
      departmentId: null
    });
  }

  // User Management
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updatedUser: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    const updatedUserData: User = { ...existingUser, ...updatedUser };
    this.users.set(id, updatedUserData);
    return updatedUserData;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.role === role);
  }

  async getUsersByDepartment(departmentId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      user => user.departmentId === departmentId
    );
  }

  // Department Management
  async getDepartment(id: number): Promise<Department | undefined> {
    return this.departments.get(id);
  }

  async createDepartment(insertDepartment: InsertDepartment): Promise<Department> {
    const id = this.departmentIdCounter++;
    const department: Department = { ...insertDepartment, id };
    this.departments.set(id, department);
    return department;
  }

  async updateDepartment(id: number, updatedDepartment: Partial<InsertDepartment>): Promise<Department | undefined> {
    const existingDepartment = this.departments.get(id);
    if (!existingDepartment) return undefined;
    
    const updatedDepartmentData: Department = { ...existingDepartment, ...updatedDepartment };
    this.departments.set(id, updatedDepartmentData);
    return updatedDepartmentData;
  }

  async getAllDepartments(): Promise<Department[]> {
    return Array.from(this.departments.values());
  }

  // Subject Management
  async getSubject(id: number): Promise<Subject | undefined> {
    return this.subjects.get(id);
  }

  async getSubjectByCode(code: string): Promise<Subject | undefined> {
    return Array.from(this.subjects.values()).find(
      (subject) => subject.code === code
    );
  }

  async createSubject(insertSubject: InsertSubject): Promise<Subject> {
    const id = this.subjectIdCounter++;
    const subject: Subject = { ...insertSubject, id };
    this.subjects.set(id, subject);
    return subject;
  }

  async updateSubject(id: number, updatedSubject: Partial<InsertSubject>): Promise<Subject | undefined> {
    const existingSubject = this.subjects.get(id);
    if (!existingSubject) return undefined;
    
    const updatedSubjectData: Subject = { ...existingSubject, ...updatedSubject };
    this.subjects.set(id, updatedSubjectData);
    return updatedSubjectData;
  }

  async getAllSubjects(): Promise<Subject[]> {
    return Array.from(this.subjects.values());
  }

  async getSubjectsByDepartment(departmentId: number): Promise<Subject[]> {
    return Array.from(this.subjects.values()).filter(
      subject => subject.departmentId === departmentId
    );
  }

  async getSubjectsByFaculty(facultyId: number): Promise<Subject[]> {
    const assignments = Array.from(this.subjectAssignments.values()).filter(
      assignment => assignment.facultyId === facultyId
    );
    
    return Promise.all(
      assignments.map(assignment => this.getSubject(assignment.subjectId))
    ).then(subjects => subjects.filter((subject): subject is Subject => subject !== undefined));
  }

  // Subject Assignment Management
  async getSubjectAssignment(id: number): Promise<SubjectAssignment | undefined> {
    return this.subjectAssignments.get(id);
  }

  async createSubjectAssignment(insertAssignment: InsertSubjectAssignment): Promise<SubjectAssignment> {
    const id = this.subjectAssignmentIdCounter++;
    const now = new Date();
    const assignment: SubjectAssignment = { 
      ...insertAssignment, 
      id, 
      assignedAt: now 
    };
    this.subjectAssignments.set(id, assignment);
    return assignment;
  }

  async deleteSubjectAssignment(id: number): Promise<boolean> {
    return this.subjectAssignments.delete(id);
  }

  async getSubjectAssignmentsBySubject(subjectId: number): Promise<SubjectAssignment[]> {
    return Array.from(this.subjectAssignments.values()).filter(
      assignment => assignment.subjectId === subjectId
    );
  }

  async getSubjectAssignmentsByFaculty(facultyId: number): Promise<SubjectAssignment[]> {
    return Array.from(this.subjectAssignments.values()).filter(
      assignment => assignment.facultyId === facultyId
    );
  }

  // Course Outcome Management
  async getCourseOutcome(id: number): Promise<CourseOutcome | undefined> {
    return this.courseOutcomes.get(id);
  }

  async createCourseOutcome(insertOutcome: InsertCourseOutcome): Promise<CourseOutcome> {
    const id = this.courseOutcomeIdCounter++;
    const outcome: CourseOutcome = { ...insertOutcome, id };
    this.courseOutcomes.set(id, outcome);
    return outcome;
  }

  async updateCourseOutcome(id: number, updatedOutcome: Partial<InsertCourseOutcome>): Promise<CourseOutcome | undefined> {
    const existingOutcome = this.courseOutcomes.get(id);
    if (!existingOutcome) return undefined;
    
    const updatedOutcomeData: CourseOutcome = { ...existingOutcome, ...updatedOutcome };
    this.courseOutcomes.set(id, updatedOutcomeData);
    return updatedOutcomeData;
  }

  async getCourseOutcomesBySubject(subjectId: number): Promise<CourseOutcome[]> {
    return Array.from(this.courseOutcomes.values()).filter(
      outcome => outcome.subjectId === subjectId
    );
  }

  // Program Outcome Management
  async getProgramOutcome(id: number): Promise<ProgramOutcome | undefined> {
    return this.programOutcomes.get(id);
  }

  async createProgramOutcome(insertOutcome: InsertProgramOutcome): Promise<ProgramOutcome> {
    const id = this.programOutcomeIdCounter++;
    const outcome: ProgramOutcome = { ...insertOutcome, id };
    this.programOutcomes.set(id, outcome);
    return outcome;
  }

  async updateProgramOutcome(id: number, updatedOutcome: Partial<InsertProgramOutcome>): Promise<ProgramOutcome | undefined> {
    const existingOutcome = this.programOutcomes.get(id);
    if (!existingOutcome) return undefined;
    
    const updatedOutcomeData: ProgramOutcome = { ...existingOutcome, ...updatedOutcome };
    this.programOutcomes.set(id, updatedOutcomeData);
    return updatedOutcomeData;
  }

  async getProgramOutcomesByDepartment(departmentId: number): Promise<ProgramOutcome[]> {
    return Array.from(this.programOutcomes.values()).filter(
      outcome => outcome.departmentId === departmentId
    );
  }

  // CO-PO Mapping Management
  async getCoPOMapping(id: number): Promise<CoPOMapping | undefined> {
    return this.coPOMappings.get(id);
  }

  async createCoPOMapping(insertMapping: InsertCoPOMapping): Promise<CoPOMapping> {
    const id = this.coPOMappingIdCounter++;
    const mapping: CoPOMapping = { ...insertMapping, id };
    this.coPOMappings.set(id, mapping);
    return mapping;
  }

  async updateCoPOMapping(id: number, updatedMapping: Partial<InsertCoPOMapping>): Promise<CoPOMapping | undefined> {
    const existingMapping = this.coPOMappings.get(id);
    if (!existingMapping) return undefined;
    
    const updatedMappingData: CoPOMapping = { ...existingMapping, ...updatedMapping };
    this.coPOMappings.set(id, updatedMappingData);
    return updatedMappingData;
  }

  async getCoPOMappingsByCourseOutcome(courseOutcomeId: number): Promise<CoPOMapping[]> {
    return Array.from(this.coPOMappings.values()).filter(
      mapping => mapping.courseOutcomeId === courseOutcomeId
    );
  }

  async getCoPOMappingsByProgramOutcome(programOutcomeId: number): Promise<CoPOMapping[]> {
    return Array.from(this.coPOMappings.values()).filter(
      mapping => mapping.programOutcomeId === programOutcomeId
    );
  }

  // Course Plan Management
  async getCoursePlan(id: number): Promise<CoursePlan | undefined> {
    return this.coursePlans.get(id);
  }

  async createCoursePlan(insertPlan: InsertCoursePlan): Promise<CoursePlan> {
    const id = this.coursePlanIdCounter++;
    const now = new Date();
    const plan: CoursePlan = { 
      ...insertPlan, 
      id,
      lastUpdated: now
    };
    this.coursePlans.set(id, plan);
    return plan;
  }

  async updateCoursePlan(id: number, updatedPlan: Partial<InsertCoursePlan>): Promise<CoursePlan | undefined> {
    const existingPlan = this.coursePlans.get(id);
    if (!existingPlan) return undefined;
    
    const now = new Date();
    const updatedPlanData: CoursePlan = { 
      ...existingPlan, 
      ...updatedPlan,
      lastUpdated: now
    };
    this.coursePlans.set(id, updatedPlanData);
    return updatedPlanData;
  }

  async getCoursePlanBySubject(subjectId: number): Promise<CoursePlan | undefined> {
    return Array.from(this.coursePlans.values()).find(
      plan => plan.subjectId === subjectId
    );
  }

  async getCoursePlansByFaculty(facultyId: number): Promise<CoursePlan[]> {
    return Array.from(this.coursePlans.values()).filter(
      plan => plan.facultyId === facultyId
    );
  }

  // Direct Assessment Management
  async getDirectAssessment(id: number): Promise<DirectAssessment | undefined> {
    return this.directAssessments.get(id);
  }

  async createDirectAssessment(insertAssessment: InsertDirectAssessment): Promise<DirectAssessment> {
    const id = this.directAssessmentIdCounter++;
    const now = new Date();
    const assessment: DirectAssessment = { 
      ...insertAssessment, 
      id, 
      createdAt: now 
    };
    this.directAssessments.set(id, assessment);
    return assessment;
  }

  async getDirectAssessmentsBySubject(subjectId: number): Promise<DirectAssessment[]> {
    return Array.from(this.directAssessments.values()).filter(
      assessment => assessment.subjectId === subjectId
    );
  }

  // Student Assessment Marks Management
  async getStudentAssessmentMark(id: number): Promise<StudentAssessmentMarks | undefined> {
    return this.studentAssessmentMarks.get(id);
  }

  async createStudentAssessmentMark(insertMark: InsertStudentAssessmentMarks): Promise<StudentAssessmentMarks> {
    const id = this.studentAssessmentMarkIdCounter++;
    const mark: StudentAssessmentMarks = { ...insertMark, id };
    this.studentAssessmentMarks.set(id, mark);
    return mark;
  }

  async updateStudentAssessmentMark(id: number, updatedMark: Partial<InsertStudentAssessmentMarks>): Promise<StudentAssessmentMarks | undefined> {
    const existingMark = this.studentAssessmentMarks.get(id);
    if (!existingMark) return undefined;
    
    const updatedMarkData: StudentAssessmentMarks = { ...existingMark, ...updatedMark };
    this.studentAssessmentMarks.set(id, updatedMarkData);
    return updatedMarkData;
  }

  async getStudentAssessmentMarksByAssessment(assessmentId: number): Promise<StudentAssessmentMarks[]> {
    return Array.from(this.studentAssessmentMarks.values()).filter(
      mark => mark.assessmentId === assessmentId
    );
  }

  async getStudentAssessmentMarksByStudent(studentId: number): Promise<StudentAssessmentMarks[]> {
    return Array.from(this.studentAssessmentMarks.values()).filter(
      mark => mark.studentId === studentId
    );
  }

  // Indirect Assessment Management
  async getIndirectAssessment(id: number): Promise<IndirectAssessment | undefined> {
    return this.indirectAssessments.get(id);
  }

  async createIndirectAssessment(insertAssessment: InsertIndirectAssessment): Promise<IndirectAssessment> {
    const id = this.indirectAssessmentIdCounter++;
    const now = new Date();
    const assessment: IndirectAssessment = { 
      ...insertAssessment, 
      id, 
      createdAt: now 
    };
    this.indirectAssessments.set(id, assessment);
    return assessment;
  }

  async getIndirectAssessmentsByDepartment(departmentId: number): Promise<IndirectAssessment[]> {
    return Array.from(this.indirectAssessments.values()).filter(
      assessment => assessment.departmentId === departmentId
    );
  }

  // Student Response Management
  async getStudentResponse(id: number): Promise<StudentResponse | undefined> {
    return this.studentResponses.get(id);
  }

  async createStudentResponse(insertResponse: InsertStudentResponse): Promise<StudentResponse> {
    const id = this.studentResponseIdCounter++;
    const now = new Date();
    const response: StudentResponse = { 
      ...insertResponse, 
      id, 
      submittedAt: now 
    };
    this.studentResponses.set(id, response);
    return response;
  }

  async getStudentResponsesByAssessment(assessmentId: number): Promise<StudentResponse[]> {
    return Array.from(this.studentResponses.values()).filter(
      response => response.assessmentId === assessmentId
    );
  }

  async getStudentResponsesByStudent(studentId: number): Promise<StudentResponse[]> {
    return Array.from(this.studentResponses.values()).filter(
      response => response.studentId === studentId
    );
  }

  // Attainment Management
  async getAttainment(id: number): Promise<Attainment | undefined> {
    return this.attainments.get(id);
  }

  async createAttainment(insertAttainment: InsertAttainment): Promise<Attainment> {
    const id = this.attainmentIdCounter++;
    const now = new Date();
    const attainment: Attainment = { 
      ...insertAttainment, 
      id, 
      calculatedAt: now 
    };
    this.attainments.set(id, attainment);
    return attainment;
  }

  async getAttainmentsBySubject(subjectId: number): Promise<Attainment[]> {
    return Array.from(this.attainments.values()).filter(
      attainment => attainment.subjectId === subjectId
    );
  }

  async getAttainmentsByDepartment(departmentId: number): Promise<Attainment[]> {
    return Array.from(this.attainments.values()).filter(
      attainment => attainment.departmentId === departmentId
    );
  }

  // Activity Logging
  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const id = this.activityLogIdCounter++;
    const now = new Date();
    const log: ActivityLog = { 
      ...insertLog, 
      id, 
      createdAt: now 
    };
    this.activityLogs.set(id, log);
    return log;
  }

  async getRecentActivityLogs(limit: number): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
