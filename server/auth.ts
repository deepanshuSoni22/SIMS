import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, roles } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

// Export the hash function for reuse in routes
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "copo-management-system-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Handle authentication and role-based permissions
      if (req.isAuthenticated()) {
        const currentUserRole = req.user.role;
        const newUserRole = req.body.role;

        // Principal (Admin) can register HOD
        if (currentUserRole === roles.ADMIN) {
          // Admin can create any role
          console.log("Admin creating new user with role:", newUserRole);
        } 
        // HOD can register Faculty and Student
        else if (currentUserRole === roles.HOD) {
          // HOD can only create faculty or student
          if (![roles.FACULTY, roles.STUDENT].includes(newUserRole)) {
            return res.status(403).json({
              message: "HODs can only register faculty members and students"
            });
          }
          
          // Ensure departmentId matches HOD's department
          if (!req.body.departmentId) {
            return res.status(400).json({
              message: "Department ID is required when registering users"
            });
          }

          // Here we would verify the HOD belongs to the department
          // This requires additional database query to verify, which we'll implement later
          console.log("HOD creating new user with role:", newUserRole);
        } 
        // Faculty can't register users
        else {
          return res.status(403).json({
            message: "You don't have permission to register new users"
          });
        }
      } else {
        // For initial setup, allow the first user to register as admin
        const usersCount = await storage.getUsersCount();
        if (usersCount > 0) {
          return res.status(403).json({
            message: "Registration is restricted. Please contact an administrator."
          });
        }
        console.log("First user registering as admin");
        req.body.role = roles.ADMIN; // Force first user to be admin
      }

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(req.body.password);
      
      // Clean up whatsappNumber (convert empty string to null)
      const sanitizedWhatsappNumber = 
        req.body.whatsappNumber === "" ? null : req.body.whatsappNumber;
      
      // Create sanitized user object
      const userToCreate = {
        ...req.body,
        whatsappNumber: sanitizedWhatsappNumber,
        password: hashedPassword,
      };

      const user = await storage.createUser(userToCreate);
      
      // Log activity if an authenticated user is creating another user
      if (req.isAuthenticated()) {
        await storage.createActivityLog({
          userId: req.user.id,
          action: "created",
          entityType: "user",
          entityId: user.id,
          details: `Created user ${user.name} with role ${user.role}`
        });
        
        // Return the created user without logging them in
        const { password, ...userWithoutPassword } = user;
        return res.status(201).json(userWithoutPassword);
      }

      // If it's a self-registration (first admin), log them in
      req.login(user, (err) => {
        if (err) return next(err);
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Registration error:", error);
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log("Login attempt:", req.body.username);
    
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error("Login error:", err);
        return next(err);
      }
      
      if (!user) {
        console.log("Login failed:", info?.message || "Invalid credentials");
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      
      console.log("User authenticated:", user.id, user.username);
      
      req.login(user, (err) => {
        if (err) {
          console.error("Session error:", err);
          return next(err);
        }
        
        console.log("Login successful, session established");
        const { password, ...userWithoutPassword } = user;
        return res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    console.log("User check - isAuthenticated:", req.isAuthenticated());
    
    if (!req.isAuthenticated()) {
      console.log("No authenticated user found");
      return res.sendStatus(401);
    }
    
    console.log("Found authenticated user:", req.user.id, req.user.username);
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
  
  // Update current user profile
  app.patch("/api/user/profile", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to update your profile" });
      }
      
      const userId = req.user.id;
      const updates = req.body;
      
      // Only allow updating name, whatsappNumber, and possibly password
      const allowedUpdates: Record<string, any> = {};
      if (updates.name) allowedUpdates.name = updates.name;
      
      // Handle whatsappNumber specifically - it can be null, empty string, or a value
      if (updates.whatsappNumber !== undefined) {
        console.log("WhatsApp number update:", JSON.stringify(updates.whatsappNumber));
        // Convert empty string to null for the database
        allowedUpdates.whatsappNumber = updates.whatsappNumber === "" ? null : updates.whatsappNumber;
      }
      
      // Handle password update separately to hash it
      if (updates.password) {
        // Validate current password if provided
        if (updates.currentPassword) {
          const valid = await comparePasswords(updates.currentPassword, req.user.password);
          if (!valid) {
            return res.status(400).json({ message: "Current password is incorrect" });
          }
        }
        
        // Hash the new password
        allowedUpdates.password = await hashPassword(updates.password);
      }
      
      if (Object.keys(allowedUpdates).length === 0) {
        return res.status(400).json({ message: "No valid fields to update" });
      }
      
      // Update the user
      const updatedUser = await storage.updateUser(userId, allowedUpdates);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Log the activity
      await storage.createActivityLog({
        userId,
        action: "updated",
        entityType: "profile",
        details: "Updated personal profile information",
        entityId: userId
      });
      
      // Return updated user without password
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating profile:", error);
      next(error);
    }
  });
}
