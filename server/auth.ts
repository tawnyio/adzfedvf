import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import session from "express-session";
import MemoryStore from "memorystore";
import { z } from "zod";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

// Create a memory store for sessions
const MemoryStoreFactory = MemoryStore(session);

// Helper for password hashing
const scryptAsync = promisify(scrypt);

// Hash a password
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Compare passwords
export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  // If the stored password doesn't contain a salt (legacy passwords), do direct comparison
  if (!stored.includes('.')) {
    return supplied === stored;
  }
  
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Authentication validation schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Registration validation schema
export const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Setup session middleware
export const setupSessionMiddleware = () => {
  return session({
    secret: process.env.SESSION_SECRET || "discord-account-generator-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    store: new MemoryStoreFactory({
      checkPeriod: 86400000 // prune expired entries every 24h
    })
  });
};

// Authentication middleware
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

// Admin middleware
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.user || !req.session.user.isAdmin) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};

// Login handler
export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = loginSchema.parse(req.body);
    
    const user = await storage.getUserByUsername(username);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password"
      });
    }
    
    // Compare password with hashed or plain password in DB
    const isValidPassword = await comparePasswords(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password"
      });
    }
    
    // Store user in session
    req.session.user = {
      id: user.id,
      username: user.username,
      isAdmin: user.isAdmin
    };
    
    // Log successful login
    await storage.createLog({
      type: "success",
      action: "USER_LOGIN",
      message: `User ${user.username} logged in`,
      userId: user.id
    });
    
    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors[0].message
      });
    }
    
    return res.status(500).json({
      success: false,
      message: "An error occurred during login"
    });
  }
};

// Logout handler
export const logout = async (req: Request, res: Response) => {
  if (req.session.user) {
    const { username, id } = req.session.user;
    
    // Destroy the session
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to logout"
        });
      }
      
      // Log successful logout
      storage.createLog({
        type: "info",
        action: "USER_LOGOUT",
        message: `User ${username} logged out`,
        userId: id
      });
      
      res.clearCookie("connect.sid");
      
      return res.status(200).json({
        success: true,
        message: "Logged out successfully"
      });
    });
  } else {
    return res.status(200).json({
      success: true,
      message: "No active session"
    });
  }
};

// Register handler
export const register = async (req: Request, res: Response) => {
  try {
    const userData = registerSchema.parse(req.body);
    
    // Check if username exists
    const existingUser = await storage.getUserByUsername(userData.username);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Ce nom d'utilisateur est déjà pris"
      });
    }
    
    // Hash password
    const hashedPassword = await hashPassword(userData.password);
    
    // Create user (non-admin by default)
    const newUser = await storage.createUser({
      username: userData.username,
      password: hashedPassword,
      isAdmin: false // Normal users by default
    });
    
    // Store user in session
    req.session.user = {
      id: newUser.id,
      username: newUser.username,
      isAdmin: newUser.isAdmin
    };
    
    // Log user creation
    await storage.createLog({
      type: "success",
      action: "USER_REGISTERED",
      message: `New user registered: ${newUser.username}`,
      userId: newUser.id
    });
    
    return res.status(201).json({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        isAdmin: newUser.isAdmin
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors[0].message
      });
    }
    
    console.error("Registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Une erreur est survenue lors de l'inscription"
    });
  }
};

// Get current user
export const getCurrentUser = async (req: Request, res: Response) => {
  if (req.session.user) {
    return res.status(200).json({
      success: true,
      user: req.session.user
    });
  }
  
  return res.status(200).json({
    success: false,
    user: null
  });
};
