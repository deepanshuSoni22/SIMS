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
  activityLogs, type ActivityLog, type InsertActivityLog,
  notifications, type Notification, type InsertNotification,
  systemSettings, type SystemSetting, type InsertSystemSetting
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq, and, sql, desc } from "drizzle-orm";
import { Pool } from '@neondatabase/serverless';

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

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
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  getUsersCount(): Promise<number>;
  getUsersByRole(role: string): Promise<User[]>;
  getUsersByDepartment(departmentId: number): Promise<User[]>;
  
  // Department Management
  getDepartment(id: number): Promise<Department | undefined>;
  getDepartmentByHodId(hodId: number): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: number, department: Partial<InsertDepartment>): Promise<Department | undefined>;
  deleteDepartment(id: number): Promise<boolean>;
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
  getAllSubjectAssignments(): Promise<SubjectAssignment[]>;
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
  
  // Notification Management
  getNotification(id: number): Promise<Notification | undefined>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  updateNotificationReadStatus(id: number, isRead: boolean): Promise<Notification | undefined>;
  getUserNotifications(userId: number): Promise<Notification[]>;
  getUnreadUserNotifications(userId: number): Promise<Notification[]>;
  getUnreadNotificationsCount(userId: number): Promise<number>;
  markAllNotificationsAsRead(userId: number): Promise<boolean>;
  
  // System Settings Management
  getSystemSetting(key: string): Promise<SystemSetting | undefined>;
  getAllSystemSettings(): Promise<SystemSetting[]>;
  createSystemSetting(setting: InsertSystemSetting): Promise<SystemSetting>;
  updateSystemSetting(id: number, setting: Partial<InsertSystemSetting>): Promise<SystemSetting | undefined>;
  getLogoUrl(): Promise<string | undefined>;
  updateLogoUrl(url: string, userId: number): Promise<SystemSetting | undefined>;
  getCollegeTitle(): Promise<{ collegeTitle: string; instituteName: string; systemName: string }>;
  updateCollegeTitle(collegeTitle: string, instituteName: string, systemName: string, userId: number): Promise<boolean>;

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
  private notifications: Map<number, Notification>;
  private systemSettings: Map<number, SystemSetting>;
  
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
  private notificationIdCounter: number;
  private systemSettingIdCounter: number;
  
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
    this.notifications = new Map();
    this.systemSettings = new Map();
    
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
    this.notificationIdCounter = 1;
    this.systemSettingIdCounter = 1;
    
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
  
  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUsersCount(): Promise<number> {
    return this.users.size;
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
  
  async getDepartmentByHodId(hodId: number): Promise<Department | undefined> {
    return Array.from(this.departments.values()).find(
      (department) => department.hodId === hodId
    );
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

  async deleteDepartment(id: number): Promise<boolean> {
    return this.departments.delete(id);
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

  async getAllSubjectAssignments(): Promise<SubjectAssignment[]> {
    return Array.from(this.subjectAssignments.values());
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

  // Notification Management
  async getNotification(id: number): Promise<Notification | undefined> {
    return this.notifications.get(id);
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.notificationIdCounter++;
    const now = new Date();
    const notification: Notification = {
      ...insertNotification,
      id,
      isRead: false,
      createdAt: now,
      // Ensure these are not undefined for the type system
      entityId: insertNotification.entityId ?? null,
      entityType: insertNotification.entityType ?? null
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async updateNotificationReadStatus(id: number, isRead: boolean): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;

    const updatedNotification: Notification = {
      ...notification,
      isRead
    };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }

  async getUserNotifications(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getUnreadUserNotifications(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId && !notification.isRead)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getUnreadNotificationsCount(userId: number): Promise<number> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId && !notification.isRead)
      .length;
  }

  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    let updated = false;
    Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId && !notification.isRead)
      .forEach(notification => {
        this.notifications.set(notification.id, { ...notification, isRead: true });
        updated = true;
      });
    return updated;
  }
  
  // System Settings Management
  async getSystemSetting(key: string): Promise<SystemSetting | undefined> {
    return Array.from(this.systemSettings.values()).find(
      setting => setting.key === key
    );
  }
  
  async getAllSystemSettings(): Promise<SystemSetting[]> {
    return Array.from(this.systemSettings.values());
  }
  
  async createSystemSetting(insertSetting: InsertSystemSetting): Promise<SystemSetting> {
    const id = this.systemSettingIdCounter++;
    const now = new Date();
    const setting: SystemSetting = {
      ...insertSetting,
      id,
      lastUpdated: now
    };
    this.systemSettings.set(id, setting);
    return setting;
  }
  
  async updateSystemSetting(id: number, updatedSetting: Partial<InsertSystemSetting>): Promise<SystemSetting | undefined> {
    const setting = this.systemSettings.get(id);
    if (!setting) return undefined;
    
    const now = new Date();
    const updatedSettingData: SystemSetting = {
      ...setting,
      ...updatedSetting,
      lastUpdated: now
    };
    this.systemSettings.set(id, updatedSettingData);
    return updatedSettingData;
  }
  
  async getLogoUrl(): Promise<string | undefined> {
    const logoSetting = await this.getSystemSetting('logo_url');
    return logoSetting?.value as string | undefined;
  }
  
  async updateLogoUrl(url: string, userId: number): Promise<SystemSetting | undefined> {
    let logoSetting = await this.getSystemSetting('logo_url');
    
    if (logoSetting) {
      return this.updateSystemSetting(logoSetting.id, { value: url });
    } else {
      return this.createSystemSetting({
        key: 'logo_url',
        value: url,
        description: 'College logo URL',
        updatedBy: userId
      });
    }
  }

  async getCollegeTitle(): Promise<{ collegeTitle: string; instituteName: string; systemName: string }> {
    const collegeTitleSetting = await this.getSystemSetting('college_title');
    const instituteNameSetting = await this.getSystemSetting('institute_name');
    const systemNameSetting = await this.getSystemSetting('system_name');
    
    return {
      collegeTitle: collegeTitleSetting?.value || 'SOUNDARYA',
      instituteName: instituteNameSetting?.value || 'INSTITUTE OF MANAGEMENT AND SCIENCE',
      systemName: systemNameSetting?.value || 'COPO Management System'
    };
  }

  async updateCollegeTitle(collegeTitle: string, instituteName: string, systemName: string, userId: number): Promise<boolean> {
    try {
      // Update or create college title setting
      const collegeTitleSetting = await this.getSystemSetting('college_title');
      if (collegeTitleSetting) {
        await this.updateSystemSetting(collegeTitleSetting.id, { value: collegeTitle });
      } else {
        await this.createSystemSetting({
          key: 'college_title',
          value: collegeTitle,
          description: 'College title',
          updatedBy: userId
        });
      }
      
      // Update or create institute name setting
      const instituteNameSetting = await this.getSystemSetting('institute_name');
      if (instituteNameSetting) {
        await this.updateSystemSetting(instituteNameSetting.id, { value: instituteName });
      } else {
        await this.createSystemSetting({
          key: 'institute_name',
          value: instituteName,
          description: 'Institute name',
          updatedBy: userId
        });
      }
      
      // Update or create system name setting
      const systemNameSetting = await this.getSystemSetting('system_name');
      if (systemNameSetting) {
        await this.updateSystemSetting(systemNameSetting.id, { value: systemName });
      } else {
        await this.createSystemSetting({
          key: 'system_name',
          value: systemName,
          description: 'System name',
          updatedBy: userId
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error updating college title:', error);
      return false;
    }
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;
  
  constructor() {
    // Create a pool for the session store
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    this.sessionStore = new PostgresSessionStore({
      pool, 
      createTableIfMissing: true
    });
  }

  // User Management
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updatedUser: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set(updatedUser)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUsersCount(): Promise<number> {
    // Use a different approach to count users
    const allUsers = await db.select().from(users);
    return allUsers.length;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    try {
      return await db.select().from(users).where(eq(users.role, role));
    } catch (error) {
      console.error(`Error in getUsersByRole(${role}):`, error);
      return []; // Return empty array instead of throwing error
    }
  }

  async getUsersByDepartment(departmentId: number): Promise<User[]> {
    try {
      return await db.select().from(users).where(eq(users.departmentId, departmentId));
    } catch (error) {
      console.error(`Error in getUsersByDepartment(${departmentId}):`, error);
      return []; // Return empty array instead of throwing error
    }
  }
  
  async deleteUser(id: number): Promise<boolean> {
    try {
      const result = await db.delete(users).where(eq(users.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }

  // Department Management
  async getDepartment(id: number): Promise<Department | undefined> {
    const [department] = await db.select().from(departments).where(eq(departments.id, id));
    return department || undefined;
  }
  
  async getDepartmentByHodId(hodId: number): Promise<Department | undefined> {
    const [department] = await db.select().from(departments).where(eq(departments.hodId, hodId));
    return department || undefined;
  }

  async createDepartment(insertDepartment: InsertDepartment): Promise<Department> {
    const [department] = await db.insert(departments).values(insertDepartment).returning();
    return department;
  }

  async updateDepartment(id: number, updatedDepartment: Partial<InsertDepartment>): Promise<Department | undefined> {
    const [department] = await db.update(departments)
      .set(updatedDepartment)
      .where(eq(departments.id, id))
      .returning();
    return department || undefined;
  }

  async deleteDepartment(id: number): Promise<boolean> {
    const result = await db.delete(departments)
      .where(eq(departments.id, id))
      .returning();
    return result.length > 0;
  }
  
  async getAllDepartments(): Promise<Department[]> {
    return await db.select().from(departments);
  }

  // Subject Management
  async getSubject(id: number): Promise<Subject | undefined> {
    const [subject] = await db.select().from(subjects).where(eq(subjects.id, id));
    return subject || undefined;
  }

  async getSubjectByCode(code: string): Promise<Subject | undefined> {
    const [subject] = await db.select().from(subjects).where(eq(subjects.code, code));
    return subject || undefined;
  }

  async createSubject(insertSubject: InsertSubject): Promise<Subject> {
    const [subject] = await db.insert(subjects).values(insertSubject).returning();
    return subject;
  }

  async updateSubject(id: number, updatedSubject: Partial<InsertSubject>): Promise<Subject | undefined> {
    const [subject] = await db.update(subjects)
      .set(updatedSubject)
      .where(eq(subjects.id, id))
      .returning();
    return subject || undefined;
  }

  async getAllSubjects(): Promise<Subject[]> {
    return await db.select().from(subjects);
  }

  async getSubjectsByDepartment(departmentId: number): Promise<Subject[]> {
    return await db.select().from(subjects).where(eq(subjects.departmentId, departmentId));
  }

  async getSubjectsByFaculty(facultyId: number): Promise<Subject[]> {
    const assignments = await db.select()
      .from(subjectAssignments)
      .where(eq(subjectAssignments.facultyId, facultyId));
    
    if (assignments.length === 0) return [];
    
    // Get all subjects and filter them manually
    const allSubjects = await db.select().from(subjects);
    const subjectIds = new Set(assignments.map(a => a.subjectId));
    
    return allSubjects.filter(subject => subjectIds.has(subject.id));
  }

  // Subject Assignment Management
  async getSubjectAssignment(id: number): Promise<SubjectAssignment | undefined> {
    const [assignment] = await db.select()
      .from(subjectAssignments)
      .where(eq(subjectAssignments.id, id));
    return assignment || undefined;
  }

  async createSubjectAssignment(insertAssignment: InsertSubjectAssignment): Promise<SubjectAssignment> {
    const [assignment] = await db.insert(subjectAssignments)
      .values(insertAssignment)
      .returning();
    return assignment;
  }

  async deleteSubjectAssignment(id: number): Promise<boolean> {
    const result = await db.delete(subjectAssignments)
      .where(eq(subjectAssignments.id, id))
      .returning();
    return result.length > 0;
  }

  async getAllSubjectAssignments(): Promise<SubjectAssignment[]> {
    return await db.select().from(subjectAssignments);
  }

  async getSubjectAssignmentsBySubject(subjectId: number): Promise<SubjectAssignment[]> {
    return await db.select()
      .from(subjectAssignments)
      .where(eq(subjectAssignments.subjectId, subjectId));
  }

  async getSubjectAssignmentsByFaculty(facultyId: number): Promise<SubjectAssignment[]> {
    return await db.select()
      .from(subjectAssignments)
      .where(eq(subjectAssignments.facultyId, facultyId));
  }

  // Course Outcome Management
  async getCourseOutcome(id: number): Promise<CourseOutcome | undefined> {
    const [outcome] = await db.select()
      .from(courseOutcomes)
      .where(eq(courseOutcomes.id, id));
    return outcome || undefined;
  }

  async createCourseOutcome(insertOutcome: InsertCourseOutcome): Promise<CourseOutcome> {
    const [outcome] = await db.insert(courseOutcomes)
      .values(insertOutcome)
      .returning();
    return outcome;
  }

  async updateCourseOutcome(id: number, updatedOutcome: Partial<InsertCourseOutcome>): Promise<CourseOutcome | undefined> {
    const [outcome] = await db.update(courseOutcomes)
      .set(updatedOutcome)
      .where(eq(courseOutcomes.id, id))
      .returning();
    return outcome || undefined;
  }

  async getCourseOutcomesBySubject(subjectId: number): Promise<CourseOutcome[]> {
    return await db.select()
      .from(courseOutcomes)
      .where(eq(courseOutcomes.subjectId, subjectId));
  }

  // Program Outcome Management
  async getProgramOutcome(id: number): Promise<ProgramOutcome | undefined> {
    const [outcome] = await db.select()
      .from(programOutcomes)
      .where(eq(programOutcomes.id, id));
    return outcome || undefined;
  }

  async createProgramOutcome(insertOutcome: InsertProgramOutcome): Promise<ProgramOutcome> {
    const [outcome] = await db.insert(programOutcomes)
      .values(insertOutcome)
      .returning();
    return outcome;
  }

  async updateProgramOutcome(id: number, updatedOutcome: Partial<InsertProgramOutcome>): Promise<ProgramOutcome | undefined> {
    const [outcome] = await db.update(programOutcomes)
      .set(updatedOutcome)
      .where(eq(programOutcomes.id, id))
      .returning();
    return outcome || undefined;
  }

  async getProgramOutcomesByDepartment(departmentId: number): Promise<ProgramOutcome[]> {
    return await db.select()
      .from(programOutcomes)
      .where(eq(programOutcomes.departmentId, departmentId));
  }

  // CO-PO Mapping Management
  async getCoPOMapping(id: number): Promise<CoPOMapping | undefined> {
    const [mapping] = await db.select()
      .from(coPOMappings)
      .where(eq(coPOMappings.id, id));
    return mapping || undefined;
  }

  async createCoPOMapping(insertMapping: InsertCoPOMapping): Promise<CoPOMapping> {
    const [mapping] = await db.insert(coPOMappings)
      .values(insertMapping)
      .returning();
    return mapping;
  }

  async updateCoPOMapping(id: number, updatedMapping: Partial<InsertCoPOMapping>): Promise<CoPOMapping | undefined> {
    const [mapping] = await db.update(coPOMappings)
      .set(updatedMapping)
      .where(eq(coPOMappings.id, id))
      .returning();
    return mapping || undefined;
  }

  async getCoPOMappingsByCourseOutcome(courseOutcomeId: number): Promise<CoPOMapping[]> {
    return await db.select()
      .from(coPOMappings)
      .where(eq(coPOMappings.courseOutcomeId, courseOutcomeId));
  }

  async getCoPOMappingsByProgramOutcome(programOutcomeId: number): Promise<CoPOMapping[]> {
    return await db.select()
      .from(coPOMappings)
      .where(eq(coPOMappings.programOutcomeId, programOutcomeId));
  }

  // Course Plan Management
  async getCoursePlan(id: number): Promise<CoursePlan | undefined> {
    const [plan] = await db.select()
      .from(coursePlans)
      .where(eq(coursePlans.id, id));
    return plan || undefined;
  }

  async createCoursePlan(insertPlan: InsertCoursePlan): Promise<CoursePlan> {
    const [plan] = await db.insert(coursePlans)
      .values(insertPlan)
      .returning();
    return plan;
  }

  async updateCoursePlan(id: number, updatedPlan: Partial<InsertCoursePlan>): Promise<CoursePlan | undefined> {
    const [plan] = await db.update(coursePlans)
      .set(updatedPlan)
      .where(eq(coursePlans.id, id))
      .returning();
    return plan || undefined;
  }

  async getCoursePlanBySubject(subjectId: number): Promise<CoursePlan | undefined> {
    const [plan] = await db.select()
      .from(coursePlans)
      .where(eq(coursePlans.subjectId, subjectId));
    return plan || undefined;
  }

  async getCoursePlansByFaculty(facultyId: number): Promise<CoursePlan[]> {
    return await db.select()
      .from(coursePlans)
      .where(eq(coursePlans.facultyId, facultyId));
  }

  // Direct Assessment Management
  async getDirectAssessment(id: number): Promise<DirectAssessment | undefined> {
    const [assessment] = await db.select()
      .from(directAssessments)
      .where(eq(directAssessments.id, id));
    return assessment || undefined;
  }

  async createDirectAssessment(insertAssessment: InsertDirectAssessment): Promise<DirectAssessment> {
    const [assessment] = await db.insert(directAssessments)
      .values(insertAssessment)
      .returning();
    return assessment;
  }

  async getDirectAssessmentsBySubject(subjectId: number): Promise<DirectAssessment[]> {
    return await db.select()
      .from(directAssessments)
      .where(eq(directAssessments.subjectId, subjectId));
  }

  // Student Assessment Marks Management
  async getStudentAssessmentMark(id: number): Promise<StudentAssessmentMarks | undefined> {
    const [mark] = await db.select()
      .from(studentAssessmentMarks)
      .where(eq(studentAssessmentMarks.id, id));
    return mark || undefined;
  }

  async createStudentAssessmentMark(insertMark: InsertStudentAssessmentMarks): Promise<StudentAssessmentMarks> {
    const [mark] = await db.insert(studentAssessmentMarks)
      .values(insertMark)
      .returning();
    return mark;
  }

  async updateStudentAssessmentMark(id: number, updatedMark: Partial<InsertStudentAssessmentMarks>): Promise<StudentAssessmentMarks | undefined> {
    const [mark] = await db.update(studentAssessmentMarks)
      .set(updatedMark)
      .where(eq(studentAssessmentMarks.id, id))
      .returning();
    return mark || undefined;
  }

  async getStudentAssessmentMarksByAssessment(assessmentId: number): Promise<StudentAssessmentMarks[]> {
    return await db.select()
      .from(studentAssessmentMarks)
      .where(eq(studentAssessmentMarks.assessmentId, assessmentId));
  }

  async getStudentAssessmentMarksByStudent(studentId: number): Promise<StudentAssessmentMarks[]> {
    return await db.select()
      .from(studentAssessmentMarks)
      .where(eq(studentAssessmentMarks.studentId, studentId));
  }

  // Indirect Assessment Management
  async getIndirectAssessment(id: number): Promise<IndirectAssessment | undefined> {
    const [assessment] = await db.select()
      .from(indirectAssessments)
      .where(eq(indirectAssessments.id, id));
    return assessment || undefined;
  }

  async createIndirectAssessment(insertAssessment: InsertIndirectAssessment): Promise<IndirectAssessment> {
    const [assessment] = await db.insert(indirectAssessments)
      .values(insertAssessment)
      .returning();
    return assessment;
  }

  async getIndirectAssessmentsByDepartment(departmentId: number): Promise<IndirectAssessment[]> {
    return await db.select()
      .from(indirectAssessments)
      .where(eq(indirectAssessments.departmentId, departmentId));
  }

  // Student Response Management
  async getStudentResponse(id: number): Promise<StudentResponse | undefined> {
    const [response] = await db.select()
      .from(studentResponses)
      .where(eq(studentResponses.id, id));
    return response || undefined;
  }

  async createStudentResponse(insertResponse: InsertStudentResponse): Promise<StudentResponse> {
    const [response] = await db.insert(studentResponses)
      .values(insertResponse)
      .returning();
    return response;
  }

  async getStudentResponsesByAssessment(assessmentId: number): Promise<StudentResponse[]> {
    return await db.select()
      .from(studentResponses)
      .where(eq(studentResponses.assessmentId, assessmentId));
  }

  async getStudentResponsesByStudent(studentId: number): Promise<StudentResponse[]> {
    return await db.select()
      .from(studentResponses)
      .where(eq(studentResponses.studentId, studentId));
  }

  // Attainment Management
  async getAttainment(id: number): Promise<Attainment | undefined> {
    const [attainment] = await db.select()
      .from(attainments)
      .where(eq(attainments.id, id));
    return attainment || undefined;
  }

  async createAttainment(insertAttainment: InsertAttainment): Promise<Attainment> {
    const [attainment] = await db.insert(attainments)
      .values(insertAttainment)
      .returning();
    return attainment;
  }

  async getAttainmentsBySubject(subjectId: number): Promise<Attainment[]> {
    return await db.select()
      .from(attainments)
      .where(eq(attainments.subjectId, subjectId));
  }

  async getAttainmentsByDepartment(departmentId: number): Promise<Attainment[]> {
    return await db.select()
      .from(attainments)
      .where(eq(attainments.departmentId, departmentId));
  }

  // Activity Logging
  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const [log] = await db.insert(activityLogs)
      .values(insertLog)
      .returning();
    return log;
  }

  async getRecentActivityLogs(limit: number): Promise<ActivityLog[]> {
    return await db.select()
      .from(activityLogs)
      .orderBy(activityLogs.createdAt)
      .limit(limit);
  }

  // Notification Management
  async getNotification(id: number): Promise<Notification | undefined> {
    const [notification] = await db.select()
      .from(notifications)
      .where(eq(notifications.id, id));
    return notification || undefined;
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications)
      .values({
        ...insertNotification,
        isRead: false,
        createdAt: new Date(),
        // Ensure these are not undefined for the type system
        entityId: insertNotification.entityId ?? null,
        entityType: insertNotification.entityType ?? null
      })
      .returning();
    return notification;
  }

  async updateNotificationReadStatus(id: number, isRead: boolean): Promise<Notification | undefined> {
    const [notification] = await db.update(notifications)
      .set({ isRead })
      .where(eq(notifications.id, id))
      .returning();
    return notification || undefined;
  }

  async getUserNotifications(userId: number): Promise<Notification[]> {
    return await db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async getUnreadUserNotifications(userId: number): Promise<Notification[]> {
    return await db.select()
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ))
      .orderBy(desc(notifications.createdAt));
  }

  async getUnreadNotificationsCount(userId: number): Promise<number> {
    const notificationsList = await db.select()
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
    return notificationsList.length;
  }

  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    const result = await db.update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
    return (result.rowCount ?? 0) > 0;
  }
  
  // System Settings Management
  async getSystemSetting(key: string): Promise<SystemSetting | undefined> {
    const [setting] = await db.select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key));
    return setting || undefined;
  }
  
  async getAllSystemSettings(): Promise<SystemSetting[]> {
    return await db.select().from(systemSettings);
  }
  
  async createSystemSetting(insertSetting: InsertSystemSetting): Promise<SystemSetting> {
    const [setting] = await db.insert(systemSettings)
      .values(insertSetting)
      .returning();
    return setting;
  }
  
  async updateSystemSetting(id: number, updatedSetting: Partial<InsertSystemSetting>): Promise<SystemSetting | undefined> {
    const [setting] = await db.update(systemSettings)
      .set(updatedSetting)
      .where(eq(systemSettings.id, id))
      .returning();
    return setting || undefined;
  }
  
  async getLogoUrl(): Promise<string | undefined> {
    const logoSetting = await this.getSystemSetting('logo_url');
    return logoSetting?.value as string | undefined;
  }
  
  async updateLogoUrl(url: string, userId: number): Promise<SystemSetting | undefined> {
    let logoSetting = await this.getSystemSetting('logo_url');
    
    if (logoSetting) {
      return this.updateSystemSetting(logoSetting.id, { value: url });
    } else {
      return this.createSystemSetting({
        key: 'logo_url',
        value: url,
        description: 'College logo URL',
        updatedBy: userId
      });
    }
  }
  
  async getCollegeTitle(): Promise<{ collegeTitle: string; instituteName: string; systemName: string }> {
    const collegeTitleSetting = await this.getSystemSetting('college_title');
    const instituteNameSetting = await this.getSystemSetting('institute_name');
    const systemNameSetting = await this.getSystemSetting('system_name');
    
    return {
      collegeTitle: collegeTitleSetting?.value || 'SOUNDARYA',
      instituteName: instituteNameSetting?.value || 'INSTITUTE OF MANAGEMENT AND SCIENCE',
      systemName: systemNameSetting?.value || 'COPO Management System'
    };
  }

  async updateCollegeTitle(collegeTitle: string, instituteName: string, systemName: string, userId: number): Promise<boolean> {
    try {
      // Update or create college title setting
      const collegeTitleSetting = await this.getSystemSetting('college_title');
      if (collegeTitleSetting) {
        await this.updateSystemSetting(collegeTitleSetting.id, { value: collegeTitle });
      } else {
        await this.createSystemSetting({
          key: 'college_title',
          value: collegeTitle,
          description: 'College title',
          updatedBy: userId
        });
      }
      
      // Update or create institute name setting
      const instituteNameSetting = await this.getSystemSetting('institute_name');
      if (instituteNameSetting) {
        await this.updateSystemSetting(instituteNameSetting.id, { value: instituteName });
      } else {
        await this.createSystemSetting({
          key: 'institute_name',
          value: instituteName,
          description: 'Institute name',
          updatedBy: userId
        });
      }
      
      // Update or create system name setting
      const systemNameSetting = await this.getSystemSetting('system_name');
      if (systemNameSetting) {
        await this.updateSystemSetting(systemNameSetting.id, { value: systemName });
      } else {
        await this.createSystemSetting({
          key: 'system_name',
          value: systemName,
          description: 'System name',
          updatedBy: userId
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error updating college title:', error);
      return false;
    }
  }
}

// Export an instance of the DatabaseStorage
export const storage = new DatabaseStorage();
