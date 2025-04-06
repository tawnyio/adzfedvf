import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { createDiscordBot } from "./discordBot";
import { insertAccountSchema, insertAccountCategorySchema, insertUserSchema } from "@shared/schema";
import { setupSessionMiddleware, requireAuth, requireAdmin, login, logout, getCurrentUser, register } from "./auth";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

// Extend Express Session interface
declare module 'express-session' {
  interface SessionData {
    user?: {
      id: number;
      username: string;
      isAdmin: boolean;
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Initialize Discord bot if token is provided
  const discordToken = process.env.DISCORD_BOT_TOKEN;
  if (discordToken) {
    createDiscordBot(discordToken);
  } else {
    console.warn("DISCORD_BOT_TOKEN not provided. Discord bot will not be initialized.");
    await storage.createLog({
      type: "warning",
      action: "BOT_INIT_FAILED",
      message: "Discord bot token not provided. Bot not initialized.",
    });
  }
  
  // Setup session middleware
  app.use(setupSessionMiddleware());
  
  // ===== Authentication Routes =====
  app.post("/api/login", login);
  app.post("/api/register", register);
  app.post("/api/logout", logout);
  app.get("/api/user", getCurrentUser);
  
  // ===== Dashboard Routes =====
  app.get("/api/dashboard/stats", requireAuth, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });
  
  app.get("/api/dashboard/activity", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const activity = await storage.getServerActivity(limit);
      res.json(activity);
    } catch (error) {
      console.error("Error fetching server activity:", error);
      res.status(500).json({ message: "Failed to fetch server activity" });
    }
  });
  
  // ===== Account Routes =====
  const accountFilterSchema = z.object({
    search: z.string().optional(),
    category: z.string().optional(),
    status: z.string().optional(),
  });
  
  app.get("/api/accounts", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      // Parse and validate query parameters
      const filters = accountFilterSchema.parse(req.query);
      
      // Convert category name to id if provided
      let categoryId: number | undefined;
      if (filters.category) {
        const category = await storage.getCategoryByName(filters.category);
        categoryId = category?.id;
      }
      
      // Get accounts
      const accounts = await storage.getAccountsWithCategory({
        categoryId,
        status: filters.status,
        search: filters.search
      });
      
      res.json(accounts);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid filter parameters", errors: error.errors });
        return;
      }
      
      console.error("Error fetching accounts:", error);
      res.status(500).json({ message: "Failed to fetch accounts" });
    }
  });
  
  app.get("/api/accounts/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid account id" });
      }
      
      const account = await storage.getAccount(id);
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      const category = await storage.getCategory(account.categoryId);
      
      res.json({
        ...account,
        category
      });
    } catch (error) {
      console.error("Error fetching account:", error);
      res.status(500).json({ message: "Failed to fetch account" });
    }
  });
  
  app.post("/api/accounts", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      // Validate account data
      const accountData = insertAccountSchema.parse(req.body);
      
      // Create account
      const account = await storage.createAccount(accountData);
      
      res.status(201).json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: "Invalid account data",
          errors: fromZodError(error).toString()
        });
        return;
      }
      
      console.error("Error creating account:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });
  
  app.post("/api/accounts/bulk", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      // Validate bulk account data
      const bulkSchema = z.object({
        accounts: z.array(insertAccountSchema),
        categoryId: z.number()
      });
      
      const { accounts: accountsData, categoryId } = bulkSchema.parse(req.body);
      
      // Create accounts
      const accounts = await storage.createAccounts(accountsData);
      
      res.status(201).json(accounts);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: "Invalid bulk account data",
          errors: fromZodError(error).toString()
        });
        return;
      }
      
      console.error("Error creating bulk accounts:", error);
      res.status(500).json({ message: "Failed to create bulk accounts" });
    }
  });
  
  app.patch("/api/accounts/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid account id" });
      }
      
      // Validate account data
      const accountData = insertAccountSchema.partial().parse(req.body);
      
      // Update account
      const account = await storage.updateAccount(id, accountData);
      
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      res.json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: "Invalid account data",
          errors: fromZodError(error).toString()
        });
        return;
      }
      
      console.error("Error updating account:", error);
      res.status(500).json({ message: "Failed to update account" });
    }
  });
  
  app.delete("/api/accounts/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid account id" });
      }
      
      const success = await storage.deleteAccount(id);
      
      if (!success) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });
  
  // ===== Category Routes =====
  app.get("/api/categories", requireAuth, async (req: Request, res: Response) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });
  
  app.post("/api/categories", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      // Validate category data
      const categoryData = insertAccountCategorySchema.parse(req.body);
      
      // Create category
      const category = await storage.createCategory(categoryData);
      
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: "Invalid category data",
          errors: fromZodError(error).toString()
        });
        return;
      }
      
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });
  
  // ===== User Routes =====
  app.post("/api/users", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      // Validate user data
      const userData = insertUserSchema.parse(req.body);
      
      // Create user
      const user = await storage.createUser(userData);
      
      res.status(201).json({
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: "Invalid user data",
          errors: fromZodError(error).toString()
        });
        return;
      }
      
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });
  
  // ===== Log Routes =====
  app.get("/api/logs", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const logs = await storage.getLogs(limit);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching logs:", error);
      res.status(500).json({ message: "Failed to fetch logs" });
    }
  });
  
  // ===== Bot Command Routes =====
  app.get("/api/commands", requireAuth, async (req: Request, res: Response) => {
    // Return list of bot commands
    const allCommands = [
      {
        name: "help",
        description: "Affiche la liste des commandes disponibles",
        usage: "/help",
        permission: "user"
      },
      {
        name: "generate",
        description: "Génère un compte pour le service spécifié",
        usage: "/generate [service_name]",
        permission: "user"
      },
      {
        name: "stock",
        description: "Affiche les services disponibles et le nombre de comptes restants",
        usage: "/stock [service_name]",
        permission: "user"
      },
      {
        name: "status",
        description: "Vérifie le statut du bot et les statistiques générales",
        usage: "/status",
        permission: "user"
      },
      {
        name: "profile",
        description: "Affiche les informations de l'utilisateur et ses statistiques",
        usage: "/profile",
        permission: "user"
      },
      {
        name: "cooldown",
        description: "Informe l'utilisateur du temps d'attente avant nouvelle génération",
        usage: "/cooldown",
        permission: "user"
      },
      {
        name: "info",
        description: "Donne une description rapide du service et des instructions",
        usage: "/info [service_name]",
        permission: "user"
      },
      {
        name: "add",
        description: "Ajoute de nouveaux comptes au stock (Admin seulement)",
        usage: "/add [service_name] [email:password]",
        permission: "admin"
      },
      {
        name: "remove",
        description: "Supprime un compte du stock (Admin seulement)",
        usage: "/remove [service_name] [email]",
        permission: "admin"
      },
      {
        name: "blacklist",
        description: "Ajoute un utilisateur à la liste noire (Admin seulement)",
        usage: "/blacklist [user_id] [raison]",
        permission: "admin"
      },
      {
        name: "setcooldown",
        description: "Modifie le temps d'attente entre générations (Admin seulement)",
        usage: "/setcooldown [minutes]",
        permission: "admin"
      }
    ];
    
    // Filter commands based on user role
    const isAdmin = (req.session as any).user?.isAdmin === true;
    const commands = isAdmin
      ? allCommands 
      : allCommands.filter(cmd => cmd.permission === "user");
    
    res.json(commands);
  });
  
  return httpServer;
}
