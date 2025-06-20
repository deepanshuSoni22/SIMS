import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import { 
  insertUserSchema,
  insertDepartmentSchema,
  insertSubjectSchema,
  insertSubjectAssignmentSchema,
  insertCourseOutcomeSchema,
  insertProgramOutcomeSchema,
  insertCoPOMappingSchema,
  insertCoursePlanSchema,
  insertDirectAssessmentSchema,
  insertStudentAssessmentMarksSchema,
  insertIndirectAssessmentSchema,
  insertStudentResponseSchema,
  insertAttainmentSchema,
  insertNotificationSchema,
  insertSystemSettingSchema,
  roles,
  otpStatus
} from "@shared/schema";
import { generateOtp, sendOtpWhatsApp, verifyOtp } from "./whatsapp-service";
import { z } from "zod";

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

// Middleware for role-based access control
const checkRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
    }
    
    next();
  };
};

// Middleware for logging activities
const logActivity = (action: string, entityType: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    
    res.json = function(body) {
      if (req.isAuthenticated() && res.statusCode >= 200 && res.statusCode < 300) {
        const entityId = body.id;
        const details = `${action} ${entityType} ${entityId ? `with ID ${entityId}` : ''}`;
        
        storage.createActivityLog({
          userId: req.user.id,
          action,
          entityType,
          entityId: entityId || undefined,
          details
        }).catch(console.error);
      }
      
      return originalJson.call(this, body);
    };
    
    next();
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  
  // Check if any users exist - used for first-time setup
  app.get("/api/system/has-users", async (req, res) => {
    const count = await storage.getUsersCount();
    res.json({ hasUsers: count > 0 });
  });
  
  // User Management Routes
  app.get(
    "/api/users", 
    checkRole([roles.ADMIN, roles.HOD]), 
    async (req, res) => {
      const users = await storage.getAllUsers();
      const sanitizedUsers = users.map(({ password, ...rest }) => rest);
      res.json(sanitizedUsers);
    }
  );
  
  // Add endpoint for teaching users (Faculty + HOD)
  app.get(
    "/api/users/teaching", 
    isAuthenticated, // Use the isAuthenticated middleware
    async (req, res) => {
      try {
        // Get both faculty and HOD users for subject assignments
        const facultyUsers = await storage.getUsersByRole(roles.FACULTY) || [];
        const hodUsers = await storage.getUsersByRole(roles.HOD) || [];
        
        // Explicitly cast users to avoid issues with password property
        const sanitizedFacultyUsers = facultyUsers.map(user => ({
          id: user.id,
          name: user.name,
          username: user.username,
          role: user.role,
          departmentId: user.departmentId
        }));

        const sanitizedHodUsers = hodUsers.map(user => ({
          id: user.id,
          name: user.name,
          username: user.username,
          role: user.role,
          departmentId: user.departmentId
        }));
        
        // Combine the sanitized users
        const teachingUsers = [...sanitizedFacultyUsers, ...sanitizedHodUsers];
        
        res.json(teachingUsers);
      } catch (error) {
        console.error("Error fetching teaching users:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );
  
  app.get(
    "/api/users/role/:role", 
    checkRole([roles.ADMIN, roles.HOD]), 
    async (req, res) => {
      try {
        const { role } = req.params;
        
        // Validate that role is a valid role
        if (!Object.values(roles).includes(role as any)) {
          return res.status(400).json({ message: "Invalid role" });
        }
        
        const users = await storage.getUsersByRole(role);
        const sanitizedUsers = users.map(({ password, ...rest }) => rest);
        res.json(sanitizedUsers);
      } catch (error) {
        console.error("Error fetching users by role:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );
  
  app.get(
    "/api/users/department/:departmentId", 
    checkRole([roles.ADMIN, roles.HOD]), 
    async (req, res) => {
      const departmentId = parseInt(req.params.departmentId);
      const users = await storage.getUsersByDepartment(departmentId);
      const sanitizedUsers = users.map(({ password, ...rest }) => rest);
      res.json(sanitizedUsers);
    }
  );
  
  app.get(
    "/api/users/:id", 
    checkRole([roles.ADMIN, roles.HOD]), 
    async (req, res) => {
      const userId = parseInt(req.params.id);
      
      // Validate userId is a valid number
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID format" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    }
  );
  
  app.patch(
    "/api/users/:id", 
    checkRole([roles.ADMIN, roles.HOD]), 
    logActivity("updated", "user"),
    async (req, res) => {
      const userId = parseInt(req.params.id);
      const updateData = req.body;
      
      // Handle password updates separately to hash them
      if (updateData.password) {
        // This route would need to call the password hashing function from auth.ts
        return res.status(400).json({ message: "Password updates not supported through this endpoint" });
      }
      
      // Handle whatsappNumber specifically - it can be null, empty string, or a value
      if (updateData.whatsappNumber !== undefined) {
        console.log("Admin/HOD updating whatsappNumber:", JSON.stringify(updateData.whatsappNumber));
        // Convert empty string to null for the database
        updateData.whatsappNumber = updateData.whatsappNumber === "" ? null : updateData.whatsappNumber;
      }
      
      const updatedUser = await storage.updateUser(userId, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    }
  );
  
  // Reset password route
  app.post(
    "/api/users/:id/reset-password",
    checkRole([roles.ADMIN, roles.HOD]), // Admins and HODs can reset passwords
    logActivity("reset-password", "user"),
    async (req, res) => {
      try {
        const userId = parseInt(req.params.id);
        const { password } = req.body;
        
        // Validate userId is a valid number
        if (isNaN(userId)) {
          return res.status(400).json({ message: "Invalid user ID format" });
        }
        
        // Validate password
        if (!password || typeof password !== 'string' || password.length < 6) {
          return res.status(400).json({ message: "Password must be at least 6 characters" });
        }
        
        // Check if user exists
        const existingUser = await storage.getUser(userId);
        
        if (!existingUser) {
          return res.status(404).json({ message: "User not found" });
        }
        
        // Hash the new password
        const hashedPassword = await hashPassword(password);
        
        // Update user password
        const updatedUser = await storage.updateUser(userId, { password: hashedPassword });
        
        if (!updatedUser) {
          return res.status(500).json({ message: "Failed to update password" });
        }
        
        res.status(200).json({ message: "Password reset successfully" });
      } catch (error) {
        console.error("Password reset error:", error);
        res.status(500).json({ message: "An error occurred while resetting the password" });
      }
    }
  );
  
  // Delete user route
  app.delete(
    "/api/users/:id",
    checkRole([roles.ADMIN, roles.HOD]), // Admins and HODs can delete users
    logActivity("deleted", "user"),
    async (req, res) => {
      try {
        const userId = parseInt(req.params.id);
        
        // Validate userId is a valid number
        if (isNaN(userId)) {
          return res.status(400).json({ message: "Invalid user ID format" });
        }
        
        // Check if user exists
        const existingUser = await storage.getUser(userId);
        
        if (!existingUser) {
          return res.status(404).json({ message: "User not found" });
        }
        
        // Prevent deleting own account
        if (req.user && req.user.id === userId) {
          return res.status(400).json({ message: "You cannot delete your own account" });
        }
        
        // Check if user is a HOD with a department
        if (existingUser.role === roles.HOD) {
          const department = await storage.getDepartmentByHodId(userId);
          if (department) {
            return res.status(400).json({ 
              message: "This HOD is associated with a department. Please reassign or delete the department first."
            });
          }
        }
        
        // Delete the user
        const success = await storage.deleteUser(userId);
        
        if (!success) {
          return res.status(500).json({ message: "Failed to delete user" });
        }
        
        res.status(200).json({ message: "User deleted successfully" });
      } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: "Server error while deleting user" });
      }
    }
  );
  
  // Department Management Routes
  app.get(
    "/api/departments", 
    async (req, res) => {
      const departments = await storage.getAllDepartments();
      res.json(departments);
    }
  );
  
  app.get(
    "/api/departments/:id", 
    async (req, res) => {
      const departmentId = parseInt(req.params.id);
      
      // Validate departmentId is a valid number
      if (isNaN(departmentId)) {
        return res.status(400).json({ message: "Invalid department ID format" });
      }
      
      const department = await storage.getDepartment(departmentId);
      
      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }
      
      res.json(department);
    }
  );
  
  app.post(
    "/api/departments", 
    checkRole([roles.ADMIN]), 
    logActivity("created", "department"),
    async (req, res) => {
      try {
        const departmentData = insertDepartmentSchema.parse(req.body);
        const department = await storage.createDepartment(departmentData);
        
        // If HOD ID is being set when creating the department
        if (departmentData.hodId !== undefined && departmentData.hodId !== null) {
          // Check if the user is already assigned as a HOD to another department
          const hodUser = await storage.getUser(departmentData.hodId);
          
          if (hodUser) {
            // If the user is already assigned to another department as HOD
            if (hodUser.departmentId !== null) {
              // Get the department the HOD is assigned to
              const previousDepartment = await storage.getDepartmentByHodId(departmentData.hodId);
              
              if (previousDepartment) {
                console.log(`User ${hodUser.name} is already HOD of department ${previousDepartment.name}. Removing hodId from that department.`);
                // Update the previous department to remove the HOD reference
                await storage.updateDepartment(previousDepartment.id, { hodId: null });
              }
            }
            
            console.log(`Setting departmentId=${department.id} for user ${hodUser.name}`);
            // Update the HOD's departmentId to match the new department
            await storage.updateUser(departmentData.hodId, { 
              departmentId: department.id 
            });
          }
        }
        
        res.status(201).json(department);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid department data", errors: error.errors });
        }
        throw error;
      }
    }
  );
  
  app.patch(
    "/api/departments/:id", 
    checkRole([roles.ADMIN]), 
    logActivity("updated", "department"),
    async (req, res) => {
      const departmentId = parseInt(req.params.id);
      
      // Validate departmentId is a valid number
      if (isNaN(departmentId)) {
        return res.status(400).json({ message: "Invalid department ID format" });
      }
      
      try {
        const updatedDepartment = await storage.updateDepartment(departmentId, req.body);
        
        if (!updatedDepartment) {
          return res.status(404).json({ message: "Department not found" });
        }
        
        // If HOD ID is being updated, update HODs' departmentId
        if (req.body.hodId !== undefined) {
          // Get the original department to check for previous HOD
          const originalDepartment = await storage.getDepartment(departmentId);
          
          // If there was a previous HOD, remove their departmentId
          if (originalDepartment && originalDepartment.hodId && originalDepartment.hodId !== req.body.hodId) {
            const previousHod = await storage.getUser(originalDepartment.hodId);
            if (previousHod) {
              console.log(`Removing departmentId from previous HOD: ${previousHod.name}`);
              await storage.updateUser(originalDepartment.hodId, { departmentId: null });
            }
          }
          
          // Check if new hodId is null, if so skip the update for the new HOD
          if (req.body.hodId !== null) {
            // Get the current user to ensure they exist
            const hodUser = await storage.getUser(req.body.hodId);
            
            if (hodUser) {
              console.log(`Updating new HOD: ${hodUser.name} to department ${departmentId}`);
              // Update the HOD's departmentId to match the current department
              await storage.updateUser(req.body.hodId, { 
                departmentId: departmentId 
              });
            }
          }
        }
        
        res.json(updatedDepartment);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid department data", errors: error.errors });
        }
        throw error;
      }
    }
  );
  
  app.delete(
    "/api/departments/:id", 
    checkRole([roles.ADMIN]), 
    logActivity("deleted", "department"),
    async (req, res) => {
      const departmentId = parseInt(req.params.id);
      
      // Validate departmentId is a valid number
      if (isNaN(departmentId)) {
        return res.status(400).json({ message: "Invalid department ID format" });
      }
      
      try {
        const existingDepartment = await storage.getDepartment(departmentId);
        
        if (!existingDepartment) {
          return res.status(404).json({ message: "Department not found" });
        }
        
        // If department has a HOD, remove departmentId from the HOD's record
        if (existingDepartment.hodId) {
          const hodUser = await storage.getUser(existingDepartment.hodId);
          if (hodUser) {
            console.log(`Removing departmentId from HOD ${hodUser.name} before deleting department`);
            await storage.updateUser(existingDepartment.hodId, { departmentId: null });
          }
        }
        
        const success = await storage.deleteDepartment(departmentId);
        
        if (!success) {
          return res.status(500).json({ message: "Failed to delete department" });
        }
        
        res.status(200).json({ message: "Department deleted successfully" });
      } catch (error) {
        console.error("Error deleting department:", error);
        res.status(500).json({ message: "Server error while deleting department" });
      }
    }
  );
  
  // Subject Management Routes
  app.get(
    "/api/subjects", 
    async (req, res) => {
      const subjects = await storage.getAllSubjects();
      res.json(subjects);
    }
  );
  
  app.get(
    "/api/subjects/department/:departmentId", 
    async (req, res) => {
      const departmentId = parseInt(req.params.departmentId);
      
      // Validate departmentId is a valid number
      if (isNaN(departmentId)) {
        return res.status(400).json({ message: "Invalid department ID format" });
      }
      
      const subjects = await storage.getSubjectsByDepartment(departmentId);
      res.json(subjects);
    }
  );
  
  app.get(
    "/api/subjects/faculty/:facultyId", 
    async (req, res) => {
      const facultyId = parseInt(req.params.facultyId);
      const subjects = await storage.getSubjectsByFaculty(facultyId);
      res.json(subjects);
    }
  );
  
  app.get(
    "/api/subjects/:id", 
    async (req, res) => {
      const subjectId = parseInt(req.params.id);
      const subject = await storage.getSubject(subjectId);
      
      if (!subject) {
        return res.status(404).json({ message: "Subject not found" });
      }
      
      res.json(subject);
    }
  );
  
  app.post(
    "/api/subjects", 
    checkRole([roles.HOD]), 
    logActivity("created", "subject"),
    async (req, res) => {
      try {
        const subjectData = insertSubjectSchema.parse(req.body);
        const subject = await storage.createSubject(subjectData);
        res.status(201).json(subject);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid subject data", errors: error.errors });
        }
        throw error;
      }
    }
  );
  
  app.patch(
    "/api/subjects/:id", 
    checkRole([roles.HOD]), 
    logActivity("updated", "subject"),
    async (req, res) => {
      const subjectId = parseInt(req.params.id);
      
      try {
        const updatedSubject = await storage.updateSubject(subjectId, req.body);
        
        if (!updatedSubject) {
          return res.status(404).json({ message: "Subject not found" });
        }
        
        res.json(updatedSubject);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid subject data", errors: error.errors });
        }
        throw error;
      }
    }
  );
  // Subject Assignment Routes
  app.get(
    "/api/subject-assignments", 
    isAuthenticated, // Use the isAuthenticated middleware
    async (req, res) => {
      const assignments = await storage.getAllSubjectAssignments();
      res.json(assignments);
    }
  );

  app.get(
    "/api/subject-assignments/subject/:subjectId", 
    checkRole([roles.HOD]), 
    async (req, res) => {
      const subjectId = parseInt(req.params.subjectId);
      const assignments = await storage.getSubjectAssignmentsBySubject(subjectId);
      res.json(assignments);
    }
  );
  
  app.get(
    "/api/subject-assignments/faculty/:facultyId", 
    isAuthenticated, // Add authentication middleware
    async (req, res) => {
      const facultyId = parseInt(req.params.facultyId);
      const assignments = await storage.getSubjectAssignmentsByFaculty(facultyId);
      res.json(assignments);
    }
  );
  
  app.post(
    "/api/subject-assignments", 
    checkRole([roles.HOD]), 
    logActivity("created", "subject assignment"),
    async (req, res) => {
      try {
        // Check if user is authenticated
        if (!req.user || !req.user.id) {
          return res.status(401).json({ message: "User not authenticated" });
        }
        
        const assignmentData = insertSubjectAssignmentSchema.parse({
          ...req.body,
          assignedBy: req.user.id
        });
        
        const assignment = await storage.createSubjectAssignment(assignmentData);
        res.status(201).json(assignment);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid assignment data", errors: error.errors });
        }
        throw error;
      }
    }
  );
  
  app.delete(
    "/api/subject-assignments/:id", 
    checkRole([roles.HOD]), 
    logActivity("deleted", "subject assignment"),
    async (req, res) => {
      const assignmentId = parseInt(req.params.id);
      const success = await storage.deleteSubjectAssignment(assignmentId);
      
      if (!success) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      res.status(204).send();
    }
  );
  
  // Course Outcome Routes
  app.get(
    "/api/course-outcomes/subject/:subjectId", 
    async (req, res) => {
      const subjectId = parseInt(req.params.subjectId);
      const outcomes = await storage.getCourseOutcomesBySubject(subjectId);
      res.json(outcomes);
    }
  );
  
  app.post(
    "/api/course-outcomes", 
    checkRole([roles.FACULTY]), 
    logActivity("created", "course outcome"),
    async (req, res) => {
      try {
        const outcomeData = insertCourseOutcomeSchema.parse(req.body);
        const outcome = await storage.createCourseOutcome(outcomeData);
        res.status(201).json(outcome);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid course outcome data", errors: error.errors });
        }
        throw error;
      }
    }
  );
  
  app.patch(
    "/api/course-outcomes/:id", 
    checkRole([roles.FACULTY]), 
    logActivity("updated", "course outcome"),
    async (req, res) => {
      const outcomeId = parseInt(req.params.id);
      
      try {
        const updatedOutcome = await storage.updateCourseOutcome(outcomeId, req.body);
        
        if (!updatedOutcome) {
          return res.status(404).json({ message: "Course outcome not found" });
        }
        
        res.json(updatedOutcome);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid course outcome data", errors: error.errors });
        }
        throw error;
      }
    }
  );
  
  // Program Outcome Routes
  app.get(
    "/api/program-outcomes/department/:departmentId", 
    async (req, res) => {
      const departmentId = parseInt(req.params.departmentId);
      
      // Validate departmentId is a valid number
      if (isNaN(departmentId)) {
        return res.status(400).json({ message: "Invalid department ID format" });
      }
      
      const outcomes = await storage.getProgramOutcomesByDepartment(departmentId);
      res.json(outcomes);
    }
  );
  
  app.post(
    "/api/program-outcomes", 
    checkRole([roles.ADMIN, roles.HOD]), 
    logActivity("created", "program outcome"),
    async (req, res) => {
      try {
        const outcomeData = insertProgramOutcomeSchema.parse(req.body);
        const outcome = await storage.createProgramOutcome(outcomeData);
        res.status(201).json(outcome);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid program outcome data", errors: error.errors });
        }
        throw error;
      }
    }
  );
  
  app.patch(
    "/api/program-outcomes/:id", 
    checkRole([roles.ADMIN, roles.HOD]), 
    logActivity("updated", "program outcome"),
    async (req, res) => {
      const outcomeId = parseInt(req.params.id);
      
      try {
        const updatedOutcome = await storage.updateProgramOutcome(outcomeId, req.body);
        
        if (!updatedOutcome) {
          return res.status(404).json({ message: "Program outcome not found" });
        }
        
        res.json(updatedOutcome);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid program outcome data", errors: error.errors });
        }
        throw error;
      }
    }
  );
  
  // CO-PO Mapping (Curriculum Attainment Matrix) Routes
  app.get(
    "/api/co-po-mappings/course-outcome/:courseOutcomeId", 
    async (req, res) => {
      const courseOutcomeId = parseInt(req.params.courseOutcomeId);
      const mappings = await storage.getCoPOMappingsByCourseOutcome(courseOutcomeId);
      res.json(mappings);
    }
  );
  
  app.get(
    "/api/co-po-mappings/program-outcome/:programOutcomeId", 
    async (req, res) => {
      const programOutcomeId = parseInt(req.params.programOutcomeId);
      const mappings = await storage.getCoPOMappingsByProgramOutcome(programOutcomeId);
      res.json(mappings);
    }
  );
  
  app.post(
    "/api/co-po-mappings", 
    checkRole([roles.FACULTY]), 
    logActivity("created", "CO-PO mapping"),
    async (req, res) => {
      try {
        const mappingData = insertCoPOMappingSchema.parse(req.body);
        const mapping = await storage.createCoPOMapping(mappingData);
        res.status(201).json(mapping);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid CO-PO mapping data", errors: error.errors });
        }
        throw error;
      }
    }
  );
  
  app.patch(
    "/api/co-po-mappings/:id", 
    checkRole([roles.FACULTY]), 
    logActivity("updated", "CO-PO mapping"),
    async (req, res) => {
      const mappingId = parseInt(req.params.id);
      
      try {
        const updatedMapping = await storage.updateCoPOMapping(mappingId, req.body);
        
        if (!updatedMapping) {
          return res.status(404).json({ message: "CO-PO mapping not found" });
        }
        
        res.json(updatedMapping);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid CO-PO mapping data", errors: error.errors });
        }
        throw error;
      }
    }
  );
  
  // Course Plan Routes
  app.get(
    "/api/course-plans/subject/:subjectId", 
    async (req, res) => {
      const subjectId = parseInt(req.params.subjectId);
      const plan = await storage.getCoursePlanBySubject(subjectId);
      
      if (!plan) {
        return res.status(404).json({ message: "Course plan not found" });
      }
      
      res.json(plan);
    }
  );
  
  app.get(
    "/api/course-plans/faculty/:facultyId", 
    async (req, res) => {
      const facultyId = parseInt(req.params.facultyId);
      const plans = await storage.getCoursePlansByFaculty(facultyId);
      res.json(plans);
    }
  );
  
  app.post(
    "/api/course-plans", 
    checkRole([roles.FACULTY]), 
    logActivity("created", "course plan"),
    async (req, res) => {
      try {
        // Check if user is authenticated
        if (!req.user || !req.user.id) {
          return res.status(401).json({ message: "User not authenticated" });
        }
        
        const planData = insertCoursePlanSchema.parse({
          ...req.body,
          facultyId: req.user.id
        });
        
        const plan = await storage.createCoursePlan(planData);
        res.status(201).json(plan);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid course plan data", errors: error.errors });
        }
        throw error;
      }
    }
  );
  
  app.patch(
    "/api/course-plans/:id", 
    checkRole([roles.FACULTY]), 
    logActivity("updated", "course plan"),
    async (req, res) => {
      const planId = parseInt(req.params.id);
      
      try {
        // Check if user is authenticated
        if (!req.user || !req.user.id) {
          return res.status(401).json({ message: "User not authenticated" });
        }
        
        const existingPlan = await storage.getCoursePlan(planId);
        
        if (!existingPlan) {
          return res.status(404).json({ message: "Course plan not found" });
        }
        
        if (existingPlan.facultyId !== req.user.id) {
          return res.status(403).json({ message: "You can only update your own course plans" });
        }
        
        const updatedPlan = await storage.updateCoursePlan(planId, req.body);
        res.json(updatedPlan);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid course plan data", errors: error.errors });
        }
        throw error;
      }
    }
  );
  
  // Direct Assessment Routes
  app.get(
    "/api/direct-assessments/subject/:subjectId", 
    async (req, res) => {
      const subjectId = parseInt(req.params.subjectId);
      const assessments = await storage.getDirectAssessmentsBySubject(subjectId);
      res.json(assessments);
    }
  );
  
  app.post(
    "/api/direct-assessments", 
    checkRole([roles.FACULTY]), 
    logActivity("created", "direct assessment"),
    async (req, res) => {
      try {
        const assessmentData = insertDirectAssessmentSchema.parse(req.body);
        const assessment = await storage.createDirectAssessment(assessmentData);
        res.status(201).json(assessment);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid direct assessment data", errors: error.errors });
        }
        throw error;
      }
    }
  );
  
  // Student Assessment Marks Routes
  app.get(
    "/api/student-assessment-marks/assessment/:assessmentId", 
    checkRole([roles.FACULTY, roles.HOD, roles.ADMIN]), 
    async (req, res) => {
      const assessmentId = parseInt(req.params.assessmentId);
      const marks = await storage.getStudentAssessmentMarksByAssessment(assessmentId);
      res.json(marks);
    }
  );
  
  app.get(
    "/api/student-assessment-marks/student/:studentId", 
    async (req, res) => {
      const studentId = parseInt(req.params.studentId);
      
      // Check if user is authenticated
      if (req.user) {
        // Students can only view their own marks
        if (req.user.role === roles.STUDENT && req.user.id !== studentId) {
          return res.status(403).json({ message: "You can only view your own marks" });
        }
      }
      
      const marks = await storage.getStudentAssessmentMarksByStudent(studentId);
      res.json(marks);
    }
  );
  
  app.post(
    "/api/student-assessment-marks", 
    checkRole([roles.FACULTY]), 
    logActivity("created", "student assessment mark"),
    async (req, res) => {
      try {
        const markData = insertStudentAssessmentMarksSchema.parse(req.body);
        const mark = await storage.createStudentAssessmentMark(markData);
        res.status(201).json(mark);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid student assessment mark data", errors: error.errors });
        }
        throw error;
      }
    }
  );
  
  app.patch(
    "/api/student-assessment-marks/:id", 
    checkRole([roles.FACULTY]), 
    logActivity("updated", "student assessment mark"),
    async (req, res) => {
      const markId = parseInt(req.params.id);
      
      try {
        const updatedMark = await storage.updateStudentAssessmentMark(markId, req.body);
        
        if (!updatedMark) {
          return res.status(404).json({ message: "Student assessment mark not found" });
        }
        
        res.json(updatedMark);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid student assessment mark data", errors: error.errors });
        }
        throw error;
      }
    }
  );
  
  // Indirect Assessment Routes
  app.get(
    "/api/indirect-assessments/department/:departmentId", 
    checkRole([roles.ADMIN, roles.HOD, roles.FACULTY]), 
    async (req, res) => {
      const departmentId = parseInt(req.params.departmentId);
      
      // Validate departmentId is a valid number
      if (isNaN(departmentId)) {
        return res.status(400).json({ message: "Invalid department ID format" });
      }
      
      const assessments = await storage.getIndirectAssessmentsByDepartment(departmentId);
      res.json(assessments);
    }
  );
  
  app.post(
    "/api/indirect-assessments", 
    checkRole([roles.ADMIN, roles.HOD]), 
    logActivity("created", "indirect assessment"),
    async (req, res) => {
      try {
        const assessmentData = insertIndirectAssessmentSchema.parse(req.body);
        const assessment = await storage.createIndirectAssessment(assessmentData);
        res.status(201).json(assessment);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid indirect assessment data", errors: error.errors });
        }
        throw error;
      }
    }
  );
  
  // Student Response Routes
  app.get(
    "/api/student-responses/assessment/:assessmentId", 
    checkRole([roles.ADMIN, roles.HOD]), 
    async (req, res) => {
      const assessmentId = parseInt(req.params.assessmentId);
      const responses = await storage.getStudentResponsesByAssessment(assessmentId);
      res.json(responses);
    }
  );
  
  app.get(
    "/api/student-responses/student/:studentId", 
    async (req, res) => {
      const studentId = parseInt(req.params.studentId);
      
      // Check if user is authenticated
      if (req.user) {
        // Students can only view their own responses
        if (req.user.role === roles.STUDENT && req.user.id !== studentId) {
          return res.status(403).json({ message: "You can only view your own responses" });
        }
      }
      
      const responses = await storage.getStudentResponsesByStudent(studentId);
      res.json(responses);
    }
  );
  
  app.post(
    "/api/student-responses", 
    checkRole([roles.STUDENT]), 
    logActivity("created", "student response"),
    async (req, res) => {
      try {
        // Check if user is authenticated
        if (!req.user || !req.user.id) {
          return res.status(401).json({ message: "User not authenticated" });
        }
        
        const responseData = insertStudentResponseSchema.parse({
          ...req.body,
          studentId: req.user.id
        });
        
        const response = await storage.createStudentResponse(responseData);
        res.status(201).json(response);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid student response data", errors: error.errors });
        }
        throw error;
      }
    }
  );
  
  // Attainment Routes
  app.get(
    "/api/attainments/subject/:subjectId", 
    async (req, res) => {
      const subjectId = parseInt(req.params.subjectId);
      const attainments = await storage.getAttainmentsBySubject(subjectId);
      res.json(attainments);
    }
  );
  
  app.get(
    "/api/attainments/department/:departmentId", 
    async (req, res) => {
      const departmentId = parseInt(req.params.departmentId);
      
      // Validate departmentId is a valid number
      if (isNaN(departmentId)) {
        return res.status(400).json({ message: "Invalid department ID format" });
      }
      
      const attainments = await storage.getAttainmentsByDepartment(departmentId);
      res.json(attainments);
    }
  );
  
  app.post(
    "/api/attainments", 
    checkRole([roles.FACULTY, roles.HOD]), 
    logActivity("created", "attainment"),
    async (req, res) => {
      try {
        const attainmentData = insertAttainmentSchema.parse(req.body);
        const attainment = await storage.createAttainment(attainmentData);
        res.status(201).json(attainment);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid attainment data", errors: error.errors });
        }
        throw error;
      }
    }
  );
  
  // Activity Log Routes
  app.get(
    "/api/activity-logs", 
    checkRole([roles.ADMIN]), 
    async (req, res) => {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      
      // Validate limit is a valid number
      if (req.query.limit && isNaN(limit)) {
        return res.status(400).json({ message: "Invalid limit parameter format" });
      }
      
      const logs = await storage.getRecentActivityLogs(limit);
      res.json(logs);
    }
  );

  // Notification Routes
  app.get(
    "/api/notifications",
    async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const notifications = await storage.getUserNotifications(req.user.id);
      res.json(notifications);
    }
  );
  
  app.get(
    "/api/notifications/unread",
    async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const notifications = await storage.getUnreadUserNotifications(req.user.id);
      res.json(notifications);
    }
  );
  
  app.get(
    "/api/notifications/unread/count",
    async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const count = await storage.getUnreadNotificationsCount(req.user.id);
      res.json({ count });
    }
  );
  
  app.post(
    "/api/notifications/read/:id",
    async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const notificationId = parseInt(req.params.id);
      
      if (isNaN(notificationId)) {
        return res.status(400).json({ message: "Invalid notification ID" });
      }
      
      const notification = await storage.getNotification(notificationId);
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      // Ensure users can only mark their own notifications as read
      if (notification.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden: Not your notification" });
      }
      
      const updatedNotification = await storage.updateNotificationReadStatus(notificationId, true);
      res.json(updatedNotification);
    }
  );
  
  app.post(
    "/api/notifications/read-all",
    async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const success = await storage.markAllNotificationsAsRead(req.user.id);
      res.json({ success });
    }
  );
  
  app.post(
    "/api/notifications",
    checkRole([roles.ADMIN, roles.HOD]),
    logActivity("created", "notification"),
    async (req, res) => {
      try {
        const notificationData = insertNotificationSchema.parse(req.body);
        const notification = await storage.createNotification(notificationData);
        res.status(201).json(notification);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid notification data", errors: error.errors });
        }
        throw error;
      }
    }
  );
  
  // System Settings Routes
  app.get(
    "/api/settings",
    async (req, res) => {
      const settings = await storage.getAllSystemSettings();
      res.json(settings);
    }
  );
  
  app.get(
    "/api/settings/logo",
    async (req, res) => {
      const logoUrl = await storage.getLogoUrl();
      res.json({ logoUrl: logoUrl || null });
    }
  );
  
  app.post(
    "/api/settings/logo",
    checkRole([roles.ADMIN]),
    logActivity("updated", "system-setting"),
    async (req, res) => {
      try {
        const { url } = req.body;
        
        if (!url || typeof url !== 'string') {
          return res.status(400).json({ message: "URL is required" });
        }
        
        if (!req.user) {
          return res.status(401).json({ message: "Unauthorized" });
        }
        const setting = await storage.updateLogoUrl(url, req.user.id);
        res.status(200).json(setting);
      } catch (error) {
        console.error("Error updating logo URL:", error);
        res.status(500).json({ message: "Failed to update logo URL" });
      }
    }
  );
  
  app.post(
    "/api/settings",
    checkRole([roles.ADMIN]),
    logActivity("created", "system-setting"),
    async (req, res) => {
      try {
        const settingData = insertSystemSettingSchema.parse(req.body);
        const setting = await storage.createSystemSetting(settingData);
        res.status(201).json(setting);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid setting data", errors: error.errors });
        }
        console.error("Error creating system setting:", error);
        res.status(500).json({ message: "Failed to create system setting" });
      }
    }
  );
  
  app.patch(
    "/api/settings/:id",
    checkRole([roles.ADMIN]),
    logActivity("updated", "system-setting"),
    async (req, res) => {
      const settingId = parseInt(req.params.id);
      
      if (isNaN(settingId)) {
        return res.status(400).json({ message: "Invalid setting ID format" });
      }
      
      try {
        const updatedSetting = await storage.updateSystemSetting(settingId, req.body);
        
        if (!updatedSetting) {
          return res.status(404).json({ message: "Setting not found" });
        }
        
        res.json(updatedSetting);
      } catch (error) {
        console.error("Error updating system setting:", error);
        res.status(500).json({ message: "Failed to update system setting" });
      }
    }
  );
  
  app.get(
    "/api/settings/college-title",
    async (req, res) => {
      try {
        const collegeTitleData = await storage.getCollegeTitle();
        res.json(collegeTitleData);
      } catch (error) {
        console.error("Error getting college title:", error);
        res.status(500).json({ message: "Failed to get college title" });
      }
    }
  );
  
  app.post(
    "/api/settings/college-title",
    checkRole([roles.ADMIN]),
    logActivity("updated", "system-setting"),
    async (req, res) => {
      try {
        const { collegeTitle, instituteName, systemName } = req.body;
        
        if (
          !collegeTitle || typeof collegeTitle !== 'string' ||
          !instituteName || typeof instituteName !== 'string' ||
          !systemName || typeof systemName !== 'string'
        ) {
          return res.status(400).json({ 
            message: "College title, institute name, and system name are required and must be strings" 
          });
        }
        
        if (!req.user) {
          return res.status(401).json({ message: "Unauthorized" });
        }
        
        const success = await storage.updateCollegeTitle(
          collegeTitle, 
          instituteName,
          systemName,
          req.user.id
        );
        
        if (success) {
          res.status(200).json({ 
            success: true,
            message: "College title updated successfully",
            data: { collegeTitle, instituteName, systemName }
          });
        } else {
          res.status(500).json({ 
            success: false,
            message: "Failed to update college title" 
          });
        }
      } catch (error) {
        console.error("Error updating college title:", error);
        res.status(500).json({ message: "Failed to update college title" });
      }
    }
  );
  
  // General Settings Routes
  app.get(
    "/api/settings/general",
    async (req, res) => {
      try {
        // Get academic year setting
        const academicYearSetting = await storage.getSystemSetting('academic_year');
        const academicYear = academicYearSetting ? academicYearSetting.value : '2024-2025';
        
        // Get direct attainment weight setting
        const directWeightSetting = await storage.getSystemSetting('direct_attainment_weight');
        const directAttainmentWeight = directWeightSetting ? parseInt(directWeightSetting.value) : 80;
        
        // Get indirect attainment weight setting
        const indirectWeightSetting = await storage.getSystemSetting('indirect_attainment_weight');
        const indirectAttainmentWeight = indirectWeightSetting ? parseInt(indirectWeightSetting.value) : 20;
        
        // Get attainment threshold setting
        const thresholdSetting = await storage.getSystemSetting('attainment_threshold');
        const attainmentThreshold = thresholdSetting ? parseInt(thresholdSetting.value) : 60;
        
        // Get attainment type setting (SEP or NEP)
        const attainmentTypeSetting = await storage.getSystemSetting('attainment_type');
        const attainmentType = attainmentTypeSetting ? attainmentTypeSetting.value : 'SEP';
        
        res.status(200).json({
          academicYear,
          directAttainmentWeight,
          indirectAttainmentWeight,
          attainmentThreshold,
          attainmentType
        });
      } catch (error) {
        console.error("Error getting general settings:", error);
        res.status(500).json({ message: "Failed to get general settings" });
      }
    }
  );
  
  // Update General Settings Route
  app.post(
    "/api/settings/general",
    checkRole([roles.ADMIN]),
    logActivity("updated", "system-setting"),
    async (req, res) => {
      try {
        const { academicYear, directAttainmentWeight, indirectAttainmentWeight, attainmentThreshold, attainmentType } = req.body;
        
        if (!academicYear || typeof academicYear !== 'string') {
          return res.status(400).json({ message: "Academic year is required and must be a string" });
        }
        
        if (
          directAttainmentWeight === undefined || typeof directAttainmentWeight !== 'number' ||
          indirectAttainmentWeight === undefined || typeof indirectAttainmentWeight !== 'number' ||
          attainmentThreshold === undefined || typeof attainmentThreshold !== 'number'
        ) {
          return res.status(400).json({ 
            message: "Direct attainment weight, indirect attainment weight, and attainment threshold are required and must be numbers" 
          });
        }
        
        if (!attainmentType || typeof attainmentType !== 'string' || (attainmentType !== 'SEP' && attainmentType !== 'NEP')) {
          return res.status(400).json({ 
            message: "Attainment type is required and must be either 'SEP' or 'NEP'" 
          });
        }
        
        if (!req.user) {
          return res.status(401).json({ message: "Unauthorized" });
        }
        
        // Update academic year setting
        let academicYearSetting = await storage.getSystemSetting('academic_year');
        if (academicYearSetting) {
          await storage.updateSystemSetting(academicYearSetting.id, { value: academicYear });
        } else {
          await storage.createSystemSetting({
            key: 'academic_year',
            value: academicYear,
            description: 'Current academic year',
            updatedBy: req.user.id
          });
        }
        
        // Update direct attainment weight setting
        let directWeightSetting = await storage.getSystemSetting('direct_attainment_weight');
        if (directWeightSetting) {
          await storage.updateSystemSetting(directWeightSetting.id, { value: directAttainmentWeight.toString() });
        } else {
          await storage.createSystemSetting({
            key: 'direct_attainment_weight',
            value: directAttainmentWeight.toString(),
            description: 'Weight for direct assessment methods (in percentage)',
            updatedBy: req.user.id
          });
        }
        
        // Update indirect attainment weight setting
        let indirectWeightSetting = await storage.getSystemSetting('indirect_attainment_weight');
        if (indirectWeightSetting) {
          await storage.updateSystemSetting(indirectWeightSetting.id, { value: indirectAttainmentWeight.toString() });
        } else {
          await storage.createSystemSetting({
            key: 'indirect_attainment_weight',
            value: indirectAttainmentWeight.toString(),
            description: 'Weight for indirect assessment methods (in percentage)',
            updatedBy: req.user.id
          });
        }
        
        // Update attainment threshold setting
        let thresholdSetting = await storage.getSystemSetting('attainment_threshold');
        if (thresholdSetting) {
          await storage.updateSystemSetting(thresholdSetting.id, { value: attainmentThreshold.toString() });
        } else {
          await storage.createSystemSetting({
            key: 'attainment_threshold',
            value: attainmentThreshold.toString(),
            description: 'Minimum percentage required to consider an outcome as attained',
            updatedBy: req.user.id
          });
        }
        
        // Update attainment type setting (SEP or NEP)
        let attainmentTypeSetting = await storage.getSystemSetting('attainment_type');
        if (attainmentTypeSetting) {
          await storage.updateSystemSetting(attainmentTypeSetting.id, { value: attainmentType });
        } else {
          await storage.createSystemSetting({
            key: 'attainment_type',
            value: attainmentType,
            description: 'Type of attainment calculation method (SEP or NEP)',
            updatedBy: req.user.id
          });
        }
        
        res.status(200).json({
          success: true,
          message: "General settings updated successfully",
          data: {
            academicYear,
            directAttainmentWeight,
            indirectAttainmentWeight,
            attainmentThreshold,
            attainmentType
          }
        });
      } catch (error) {
        console.error("Error updating general settings:", error);
        res.status(500).json({ message: "Failed to update general settings" });
      }
    }
  );

  // Password Reset Routes
  app.post("/api/request-password-reset", async (req, res) => {
    try {
      const { username } = req.body;
      
      if (!username) {
        return res.status(400).json({ message: "Username is required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if the user has a security question set
      if (!user.securityQuestion) {
        return res.status(400).json({
          message: "This account doesn't have a security question set. Please contact an administrator."
        });
      }
      
      // Return the security question (but not the answer)
      return res.status(200).json({
        username: user.username,
        securityQuestion: user.securityQuestion
      });
    } catch (error) {
      console.error("Error in request-password-reset:", error);
      return res.status(500).json({ message: "Server error while processing request" });
    }
  });
  
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { username, securityAnswer, newPassword } = req.body;
      
      if (!username || !securityAnswer || !newPassword) {
        return res.status(400).json({ message: "Username, security answer, and new password are required" });
      }
      
      // Validate password
      if (typeof newPassword !== 'string' || newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Verify security answer
      if (!user.securityAnswer || user.securityAnswer !== securityAnswer) {
        return res.status(403).json({ message: "Incorrect security answer" });
      }
      
      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update the user's password
      const updatedUser = await storage.updateUser(user.id, { password: hashedPassword });
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update password" });
      }
      
      // Log the activity
      await storage.createActivityLog({
        userId: user.id,
        action: "reset-password",
        entityType: "user",
        entityId: user.id,
        details: "Password reset via security question"
      });
      
      return res.status(200).json({ message: "Password reset successful" });
    } catch (error) {
      console.error("Error in reset-password:", error);
      return res.status(500).json({ message: "Server error while resetting password" });
    }
  });

  // Password Reset Routes
  app.post(
    "/api/reset-password/request",
    async (req, res) => {
      try {
        const { username } = req.body;
        
        // Validate request
        if (!username) {
          return res.status(400).json({ 
            success: false, 
            message: "Username is required" 
          });
        }
        
        // Find user by username
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          return res.status(404).json({ 
            success: false, 
            message: "User not found" 
          });
        }
        
        // Check if user has WhatsApp number
        if (!user.whatsappNumber) {
          return res.status(400).json({ 
            success: false, 
            message: "User does not have a WhatsApp number registered. Please contact administrator." 
          });
        }
        
        // Generate OTP
        const otp = generateOtp(user.id);
        
        // Create expiration time (15 minutes from now)
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);
        
        // Save OTP in database
        await storage.createPasswordResetOTP(user.id, otp, expiresAt);
        
        // Send OTP via WhatsApp
        const success = await sendOtpWhatsApp(user.whatsappNumber, otp);
        
        if (!success) {
          return res.status(500).json({ 
            success: false, 
            message: "Failed to send OTP. Please try again later." 
          });
        }
        
        // Create activity log
        await storage.createActivityLog({
          userId: user.id,
          action: "requested",
          entityType: "password-reset",
          details: "Password reset requested"
        });
        
        res.status(200).json({ 
          success: true, 
          message: "OTP sent to your WhatsApp number", 
          userId: user.id 
        });
      } catch (error) {
        console.error("Password reset request error:", error);
        res.status(500).json({ 
          success: false, 
          message: "An error occurred while processing your request" 
        });
      }
    }
  );
  
  app.post(
    "/api/reset-password/verify",
    async (req, res) => {
      try {
        const { userId, otp } = req.body;
        
        // Validate request
        if (!userId || !otp) {
          return res.status(400).json({ 
            success: false, 
            message: "User ID and OTP are required" 
          });
        }
        
        // Find user
        const user = await storage.getUser(userId);
        
        if (!user) {
          return res.status(404).json({ 
            success: false, 
            message: "User not found" 
          });
        }
        
        // Get latest OTP for user
        const latestOTP = await storage.getLatestPasswordResetOTP(userId);
        
        if (!latestOTP) {
          return res.status(400).json({ 
            success: false, 
            message: "No OTP request found. Please request a new OTP." 
          });
        }
        
        // Check if OTP is expired
        if (new Date() > latestOTP.expiresAt) {
          // Update OTP status to expired
          await storage.updatePasswordResetOTPStatus(latestOTP.id, otpStatus.EXPIRED);
          
          return res.status(400).json({ 
            success: false, 
            message: "OTP has expired. Please request a new one." 
          });
        }
        
        // Check if OTP is already used
        if (latestOTP.status === otpStatus.VERIFIED) {
          return res.status(400).json({ 
            success: false, 
            message: "OTP has already been used. Please request a new one." 
          });
        }
        
        // Verify OTP
        if (latestOTP.otp !== otp) {
          return res.status(400).json({ 
            success: false, 
            message: "Invalid OTP. Please try again." 
          });
        }
        
        // Mark OTP as verified
        await storage.updatePasswordResetOTPStatus(latestOTP.id, otpStatus.VERIFIED);
        
        // Create activity log
        await storage.createActivityLog({
          userId: user.id,
          action: "verified",
          entityType: "password-reset",
          details: "OTP verified for password reset"
        });
        
        res.status(200).json({ 
          success: true, 
          message: "OTP verified successfully", 
          userId: user.id 
        });
      } catch (error) {
        console.error("OTP verification error:", error);
        res.status(500).json({ 
          success: false, 
          message: "An error occurred while verifying OTP" 
        });
      }
    }
  );
  
  app.post(
    "/api/reset-password/complete",
    async (req, res) => {
      try {
        const { userId, newPassword } = req.body;
        
        // Validate request
        if (!userId || !newPassword) {
          return res.status(400).json({ 
            success: false, 
            message: "User ID and new password are required" 
          });
        }
        
        // Password validation
        if (typeof newPassword !== "string" || newPassword.length < 6) {
          return res.status(400).json({ 
            success: false, 
            message: "Password must be at least 6 characters long" 
          });
        }
        
        // Find user
        const user = await storage.getUser(userId);
        
        if (!user) {
          return res.status(404).json({ 
            success: false, 
            message: "User not found" 
          });
        }
        
        // Get latest OTP for user to ensure verification was done
        const latestOTP = await storage.getLatestPasswordResetOTP(userId);
        
        if (!latestOTP || latestOTP.status !== otpStatus.VERIFIED) {
          return res.status(400).json({ 
            success: false, 
            message: "Please verify your OTP before setting a new password" 
          });
        }
        
        // Hash new password
        const hashedPassword = await hashPassword(newPassword);
        
        // Update user password
        const updatedUser = await storage.updateUser(userId, { 
          password: hashedPassword 
        });
        
        if (!updatedUser) {
          return res.status(500).json({ 
            success: false, 
            message: "Failed to update password" 
          });
        }
        
        // Create activity log
        await storage.createActivityLog({
          userId: user.id,
          action: "reset",
          entityType: "password",
          details: "Password reset completed"
        });
        
        res.status(200).json({ 
          success: true, 
          message: "Password reset successfully" 
        });
      } catch (error) {
        console.error("Password reset completion error:", error);
        res.status(500).json({ 
          success: false, 
          message: "An error occurred while resetting password" 
        });
      }
    }
  );

  const httpServer = createServer(app);
  return httpServer;
}
