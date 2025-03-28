import { pgTable, text, serial, integer, boolean, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Role based access control
export const roles = {
  ADMIN: "admin",
  HOD: "hod",
  FACULTY: "faculty",
  STUDENT: "student",
} as const;

// User Schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: Object.values(roles) }).notNull(),
  departmentId: integer("department_id"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  username: true,
  password: true,
  role: true,
  departmentId: true,
});

// Department Schema
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  hodId: integer("hod_id"),
});

export const insertDepartmentSchema = createInsertSchema(departments).pick({
  name: true,
  hodId: true,
});

// Subject Schema
export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  departmentId: integer("department_id").notNull(),
  semester: integer("semester").notNull(),
  academicYear: text("academic_year").notNull(),
  status: text("status").notNull().default("pending"),
});

export const insertSubjectSchema = createInsertSchema(subjects).pick({
  code: true,
  name: true,
  departmentId: true,
  semester: true,
  academicYear: true,
  status: true,
});

// Subject Assignment Schema
export const subjectAssignments = pgTable("subject_assignments", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id").notNull(),
  facultyId: integer("faculty_id").notNull(),
  assignedBy: integer("assigned_by").notNull(),
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
});

export const insertSubjectAssignmentSchema = createInsertSchema(subjectAssignments).pick({
  subjectId: true,
  facultyId: true,
  assignedBy: true,
});

// Course Outcome Schema
export const courseOutcomes = pgTable("course_outcomes", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id").notNull(),
  outcomeNumber: integer("outcome_number").notNull(),
  description: text("description").notNull(),
});

export const insertCourseOutcomeSchema = createInsertSchema(courseOutcomes).pick({
  subjectId: true,
  outcomeNumber: true,
  description: true,
});

// Program Outcome Schema
export const programOutcomes = pgTable("program_outcomes", {
  id: serial("id").primaryKey(),
  departmentId: integer("department_id").notNull(),
  outcomeNumber: integer("outcome_number").notNull(),
  description: text("description").notNull(),
});

export const insertProgramOutcomeSchema = createInsertSchema(programOutcomes).pick({
  departmentId: true,
  outcomeNumber: true,
  description: true,
});

// CO-PO Mapping (Curriculum Attainment Matrix)
export const coPOMappings = pgTable("co_po_mappings", {
  id: serial("id").primaryKey(),
  courseOutcomeId: integer("course_outcome_id").notNull(),
  programOutcomeId: integer("program_outcome_id").notNull(),
  correlationLevel: integer("correlation_level").notNull(), // 1=Low, 2=Medium, 3=High
});

export const insertCoPOMappingSchema = createInsertSchema(coPOMappings).pick({
  courseOutcomeId: true,
  programOutcomeId: true,
  correlationLevel: true,
});

// Course Plan Schema
export const coursePlans = pgTable("course_plans", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id").notNull(),
  facultyId: integer("faculty_id").notNull(),
  content: json("content").notNull(), // Structured course plan content
  status: text("status").notNull().default("draft"),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

export const insertCoursePlanSchema = createInsertSchema(coursePlans).pick({
  subjectId: true,
  facultyId: true,
  content: true,
  status: true,
});

// Direct Assessment Schema (Internal/Preparatory Tests)
export const directAssessments = pgTable("direct_assessments", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id").notNull(),
  assessmentType: text("assessment_type").notNull(), // internal, preparatory
  maxMarks: integer("max_marks").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDirectAssessmentSchema = createInsertSchema(directAssessments).pick({
  subjectId: true,
  assessmentType: true,
  maxMarks: true,
});

// Student Assessment Marks Schema
export const studentAssessmentMarks = pgTable("student_assessment_marks", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull(),
  studentId: integer("student_id").notNull(),
  courseOutcomeId: integer("course_outcome_id").notNull(),
  marksObtained: integer("marks_obtained").notNull(),
});

export const insertStudentAssessmentMarksSchema = createInsertSchema(studentAssessmentMarks).pick({
  assessmentId: true,
  studentId: true,
  courseOutcomeId: true,
  marksObtained: true,
});

// Indirect Assessment Schema (Feedback surveys)
export const indirectAssessments = pgTable("indirect_assessments", {
  id: serial("id").primaryKey(),
  departmentId: integer("department_id").notNull(),
  assessmentType: text("assessment_type").notNull(), // course_exit, program_exit, alumni, etc.
  academicYear: text("academic_year").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertIndirectAssessmentSchema = createInsertSchema(indirectAssessments).pick({
  departmentId: true,
  assessmentType: true,
  academicYear: true,
});

// Student Response Schema (for indirect assessments)
export const studentResponses = pgTable("student_responses", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull(),
  studentId: integer("student_id").notNull(),
  responses: json("responses").notNull(), // JSON structure with survey responses
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
});

export const insertStudentResponseSchema = createInsertSchema(studentResponses).pick({
  assessmentId: true,
  studentId: true,
  responses: true,
});

// Attainment Calculation Schema
export const attainments = pgTable("attainments", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id"),
  departmentId: integer("department_id"),
  academicYear: text("academic_year").notNull(),
  attainmentType: text("attainment_type").notNull(), // co, po
  attainmentData: json("attainment_data").notNull(), // JSON structure with attainment details
  calculatedAt: timestamp("calculated_at").notNull().defaultNow(),
});

export const insertAttainmentSchema = createInsertSchema(attainments).pick({
  subjectId: true,
  departmentId: true,
  academicYear: true,
  attainmentType: true,
  attainmentData: true,
});

// Activity Log Schema
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id"),
  details: text("details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).pick({
  userId: true,
  action: true,
  entityType: true,
  entityId: true,
  details: true,
});

// Types for all schemas
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Department = typeof departments.$inferSelect;

export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type Subject = typeof subjects.$inferSelect;

export type InsertSubjectAssignment = z.infer<typeof insertSubjectAssignmentSchema>;
export type SubjectAssignment = typeof subjectAssignments.$inferSelect;

export type InsertCourseOutcome = z.infer<typeof insertCourseOutcomeSchema>;
export type CourseOutcome = typeof courseOutcomes.$inferSelect;

export type InsertProgramOutcome = z.infer<typeof insertProgramOutcomeSchema>;
export type ProgramOutcome = typeof programOutcomes.$inferSelect;

export type InsertCoPOMapping = z.infer<typeof insertCoPOMappingSchema>;
export type CoPOMapping = typeof coPOMappings.$inferSelect;

export type InsertCoursePlan = z.infer<typeof insertCoursePlanSchema>;
export type CoursePlan = typeof coursePlans.$inferSelect;

export type InsertDirectAssessment = z.infer<typeof insertDirectAssessmentSchema>;
export type DirectAssessment = typeof directAssessments.$inferSelect;

export type InsertStudentAssessmentMarks = z.infer<typeof insertStudentAssessmentMarksSchema>;
export type StudentAssessmentMarks = typeof studentAssessmentMarks.$inferSelect;

export type InsertIndirectAssessment = z.infer<typeof insertIndirectAssessmentSchema>;
export type IndirectAssessment = typeof indirectAssessments.$inferSelect;

export type InsertStudentResponse = z.infer<typeof insertStudentResponseSchema>;
export type StudentResponse = typeof studentResponses.$inferSelect;

export type InsertAttainment = z.infer<typeof insertAttainmentSchema>;
export type Attainment = typeof attainments.$inferSelect;

export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
