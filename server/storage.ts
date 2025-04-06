import { 
  User, InsertUser, 
  Account, InsertAccount,
  AccountCategory, InsertAccountCategory, 
  BotSettings, InsertBotSettings,
  Log, InsertLog,
  users, accounts, accountCategories, botSettings, logs
} from "@shared/schema";
import { DashboardStats, AccountWithCategory, ServerActivityItem } from "@shared/types";
import { db } from "./db";
import { eq, and, sql, desc, gte, isNotNull } from "drizzle-orm";

// Modify the interface with CRUD methods needed
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Account methods
  getAccount(id: number): Promise<Account | undefined>;
  getAccounts(filters?: { categoryId?: number, status?: string, search?: string }): Promise<Account[]>;
  getAccountsWithCategory(filters?: { categoryId?: number, status?: string, search?: string }): Promise<AccountWithCategory[]>;
  createAccount(account: InsertAccount): Promise<Account>;
  createAccounts(accounts: InsertAccount[]): Promise<Account[]>;
  updateAccount(id: number, account: Partial<InsertAccount>): Promise<Account | undefined>;
  deleteAccount(id: number): Promise<boolean>;
  
  // Account Category methods
  getCategory(id: number): Promise<AccountCategory | undefined>;
  getCategoryByName(name: string): Promise<AccountCategory | undefined>;
  getCategories(): Promise<AccountCategory[]>;
  createCategory(category: InsertAccountCategory): Promise<AccountCategory>;
  
  // Bot Settings methods
  getBotSettings(guildId: string): Promise<BotSettings | undefined>;
  createBotSettings(settings: InsertBotSettings): Promise<BotSettings>;
  updateBotSettings(guildId: string, settings: Partial<InsertBotSettings>): Promise<BotSettings | undefined>;
  
  // Log methods
  getLogs(limit?: number): Promise<Log[]>;
  createLog(log: InsertLog): Promise<Log>;
  
  // Dashboard stats
  getDashboardStats(): Promise<DashboardStats>;
  getServerActivity(limit?: number): Promise<ServerActivityItem[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private accounts: Map<number, Account>;
  private categories: Map<number, AccountCategory>;
  private botSettings: Map<string, BotSettings>;
  private logs: Log[];
  
  private userId: number;
  private accountId: number;
  private categoryId: number;
  private logId: number;
  
  constructor() {
    this.users = new Map();
    this.accounts = new Map();
    this.categories = new Map();
    this.botSettings = new Map();
    this.logs = [];
    
    this.userId = 1;
    this.accountId = 1;
    this.categoryId = 1;
    this.logId = 1;
    
    // Initialize with some default data
    this.initializeDefaultData();
  }
  
  private initializeDefaultData() {
    // Create default admin user
    this.createUser({
      username: "admin",
      password: "admin123",
      isAdmin: true
    });
    
    // Create default categories
    const streamingCategory = this.createCategory({
      name: "Streaming",
      description: "Streaming services like Netflix, Disney+, etc."
    });
    
    const vpnCategory = this.createCategory({
      name: "VPN",
      description: "VPN services like NordVPN, ExpressVPN, etc."
    });
    
    const gamingCategory = this.createCategory({
      name: "Gaming",
      description: "Gaming services like Steam, Epic Games, etc."
    });
    
    // Create some sample accounts
    this.createAccount({
      email: "netflix@example.com",
      password: "password123",
      categoryId: streamingCategory.id,
      status: "available",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    });
    
    this.createAccount({
      email: "nordvpn@example.com",
      password: "password123",
      categoryId: vpnCategory.id,
      status: "available",
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days from now
    });
    
    this.createAccount({
      email: "steam@example.com",
      password: "password123",
      categoryId: gamingCategory.id,
      status: "available",
      expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000) // 45 days from now
    });
    
    // Create some logs
    this.createLog({
      type: "info",
      action: "SYSTEM_START",
      message: "System initialized with default data",
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }
  
  // Account methods
  async getAccount(id: number): Promise<Account | undefined> {
    return this.accounts.get(id);
  }
  
  async getAccounts(filters?: { categoryId?: number, status?: string, search?: string }): Promise<Account[]> {
    let accounts = Array.from(this.accounts.values());
    
    if (filters) {
      if (filters.categoryId !== undefined) {
        accounts = accounts.filter(account => account.categoryId === filters.categoryId);
      }
      
      if (filters.status) {
        accounts = accounts.filter(account => account.status === filters.status);
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        accounts = accounts.filter(account => 
          account.email.toLowerCase().includes(searchLower)
        );
      }
    }
    
    return accounts;
  }
  
  async getAccountsWithCategory(filters?: { categoryId?: number, status?: string, search?: string }): Promise<AccountWithCategory[]> {
    const accounts = await this.getAccounts(filters);
    return Promise.all(accounts.map(async (account) => {
      const category = await this.getCategory(account.categoryId);
      return {
        ...account,
        category: category!
      };
    }));
  }
  
  async createAccount(insertAccount: InsertAccount): Promise<Account> {
    const id = this.accountId++;
    const now = new Date();
    const account: Account = {
      ...insertAccount,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.accounts.set(id, account);
    
    // Log account creation
    await this.createLog({
      type: "info",
      action: "ACCOUNT_CREATED",
      message: `Account created: ${account.email} (${account.id})`,
    });
    
    return account;
  }
  
  async createAccounts(insertAccounts: InsertAccount[]): Promise<Account[]> {
    const createdAccounts: Account[] = [];
    
    for (const insertAccount of insertAccounts) {
      const account = await this.createAccount(insertAccount);
      createdAccounts.push(account);
    }
    
    return createdAccounts;
  }
  
  async updateAccount(id: number, updateData: Partial<InsertAccount>): Promise<Account | undefined> {
    const account = this.accounts.get(id);
    if (!account) return undefined;
    
    const updatedAccount: Account = {
      ...account,
      ...updateData,
      id, // ensure id doesn't change
      updatedAt: new Date()
    };
    
    this.accounts.set(id, updatedAccount);
    
    // Log account update
    await this.createLog({
      type: "info",
      action: "ACCOUNT_UPDATED",
      message: `Account updated: ${updatedAccount.email} (${updatedAccount.id})`,
    });
    
    return updatedAccount;
  }
  
  async deleteAccount(id: number): Promise<boolean> {
    const account = this.accounts.get(id);
    if (!account) return false;
    
    const deleted = this.accounts.delete(id);
    
    if (deleted) {
      // Log account deletion
      await this.createLog({
        type: "info",
        action: "ACCOUNT_DELETED",
        message: `Account deleted: ${account.email} (${account.id})`,
      });
    }
    
    return deleted;
  }
  
  // Category methods
  async getCategory(id: number): Promise<AccountCategory | undefined> {
    return this.categories.get(id);
  }
  
  async getCategoryByName(name: string): Promise<AccountCategory | undefined> {
    return Array.from(this.categories.values()).find(
      (category) => category.name.toLowerCase() === name.toLowerCase()
    );
  }
  
  async getCategories(): Promise<AccountCategory[]> {
    return Array.from(this.categories.values());
  }
  
  async createCategory(insertCategory: InsertAccountCategory): Promise<AccountCategory> {
    const id = this.categoryId++;
    const now = new Date();
    const category: AccountCategory = {
      ...insertCategory,
      id,
      createdAt: now
    };
    this.categories.set(id, category);
    return category;
  }
  
  // Bot Settings methods
  async getBotSettings(guildId: string): Promise<BotSettings | undefined> {
    return this.botSettings.get(guildId);
  }
  
  async createBotSettings(insertSettings: InsertBotSettings): Promise<BotSettings> {
    const now = new Date();
    const settings: BotSettings = {
      ...insertSettings,
      id: 1, // Only one settings per guild
      createdAt: now,
      updatedAt: now
    };
    this.botSettings.set(insertSettings.guildId, settings);
    return settings;
  }
  
  async updateBotSettings(guildId: string, updateData: Partial<InsertBotSettings>): Promise<BotSettings | undefined> {
    const settings = this.botSettings.get(guildId);
    if (!settings) return undefined;
    
    const updatedSettings: BotSettings = {
      ...settings,
      ...updateData,
      guildId, // ensure guildId doesn't change
      updatedAt: new Date()
    };
    
    this.botSettings.set(guildId, updatedSettings);
    return updatedSettings;
  }
  
  // Log methods
  async getLogs(limit?: number): Promise<Log[]> {
    const sortedLogs = [...this.logs].sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
    
    if (limit && limit > 0) {
      return sortedLogs.slice(0, limit);
    }
    
    return sortedLogs;
  }
  
  async createLog(insertLog: InsertLog): Promise<Log> {
    const id = this.logId++;
    const now = new Date();
    const log: Log = {
      ...insertLog,
      id,
      createdAt: now
    };
    this.logs.push(log);
    return log;
  }
  
  // Dashboard stats
  async getDashboardStats(): Promise<DashboardStats> {
    const allAccounts = Array.from(this.accounts.values());
    const availableAccounts = allAccounts.filter(account => account.status === 'available');
    
    // Calculate accounts generated today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const generatedToday = allAccounts.filter(account => 
      account.generatedAt && account.generatedAt >= today
    ).length;
    
    // Get last generation time
    const generatedAccounts = allAccounts.filter(account => account.generatedAt);
    const lastGeneration = generatedAccounts.length > 0 
      ? new Date(Math.max(...generatedAccounts.map(a => a.generatedAt!.getTime())))
      : undefined;
    
    // Calculate category counts
    const categoryCounts: { [key: string]: number } = {};
    for (const account of allAccounts) {
      const category = this.categories.get(account.categoryId);
      if (category) {
        categoryCounts[category.name] = (categoryCounts[category.name] || 0) + 1;
      }
    }
    
    return {
      totalAccounts: allAccounts.length,
      availableAccounts: availableAccounts.length,
      generatedToday,
      categoryCounts,
      botStatus: 'online', // Default to online for now
      connectedServers: this.botSettings.size,
      lastGeneration
    };
  }
  
  async getServerActivity(limit: number = 10): Promise<ServerActivityItem[]> {
    const logs = await this.getLogs(limit);
    
    return logs.map(log => {
      let type: 'success' | 'error' | 'warning' | 'info' = 'info';
      
      if (log.type === 'error') type = 'error';
      else if (log.type === 'warning') type = 'warning';
      else if (log.type === 'success') type = 'success';
      
      return {
        id: log.id,
        type,
        title: log.action,
        message: log.message,
        timestamp: log.createdAt
      };
    });
  }
}

export class DatabaseStorage implements IStorage {
  // User methods
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
  
  // Account methods
  async getAccount(id: number): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
    return account || undefined;
  }
  
  async getAccounts(filters?: { categoryId?: number, status?: string, search?: string }): Promise<Account[]> {
    let query = db.select().from(accounts);
    
    if (filters) {
      if (filters.categoryId !== undefined) {
        query = query.where(eq(accounts.categoryId, filters.categoryId));
      }
      
      if (filters.status && filters.status !== 'all') {
        query = query.where(eq(accounts.status, filters.status));
      }
      
      if (filters.search) {
        query = query.where(
          sql`lower(${accounts.email}) like ${`%${filters.search.toLowerCase()}%`}`
        );
      }
    }
    
    return query;
  }
  
  async getAccountsWithCategory(filters?: { categoryId?: number, status?: string, search?: string }): Promise<AccountWithCategory[]> {
    let query = db
      .select({
        ...accounts,
        category: accountCategories
      })
      .from(accounts)
      .leftJoin(accountCategories, eq(accounts.categoryId, accountCategories.id));
    
    if (filters) {
      if (filters.categoryId !== undefined) {
        query = query.where(eq(accounts.categoryId, filters.categoryId));
      }
      
      if (filters.status && filters.status !== 'all') {
        query = query.where(eq(accounts.status, filters.status));
      }
      
      if (filters.search) {
        query = query.where(
          sql`lower(${accounts.email}) like ${`%${filters.search.toLowerCase()}%`}`
        );
      }
    }
    
    return query;
  }
  
  async createAccount(insertAccount: InsertAccount): Promise<Account> {
    const [account] = await db.insert(accounts).values(insertAccount).returning();
    
    // Log account creation
    await this.createLog({
      type: "info",
      action: "ACCOUNT_CREATED",
      message: `Account created: ${account.email} (${account.id})`,
    });
    
    return account;
  }
  
  async createAccounts(insertAccounts: InsertAccount[]): Promise<Account[]> {
    const createdAccounts = await db.insert(accounts).values(insertAccounts).returning();
    
    // Log bulk account creation
    await this.createLog({
      type: "info",
      action: "ACCOUNTS_BULK_CREATED",
      message: `${createdAccounts.length} accounts created in bulk`,
    });
    
    return createdAccounts;
  }
  
  async updateAccount(id: number, updateData: Partial<InsertAccount>): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
    if (!account) return undefined;
    
    const [updatedAccount] = await db
      .update(accounts)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(accounts.id, id))
      .returning();
    
    // Log account update
    await this.createLog({
      type: "info",
      action: "ACCOUNT_UPDATED",
      message: `Account updated: ${updatedAccount.email} (${updatedAccount.id})`,
    });
    
    return updatedAccount;
  }
  
  async deleteAccount(id: number): Promise<boolean> {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
    if (!account) return false;
    
    await db.delete(accounts).where(eq(accounts.id, id));
    
    // Log account deletion
    await this.createLog({
      type: "info",
      action: "ACCOUNT_DELETED",
      message: `Account deleted: ${account.email} (${account.id})`,
    });
    
    return true;
  }
  
  // Category methods
  async getCategory(id: number): Promise<AccountCategory | undefined> {
    const [category] = await db.select().from(accountCategories).where(eq(accountCategories.id, id));
    return category || undefined;
  }
  
  async getCategoryByName(name: string): Promise<AccountCategory | undefined> {
    const [category] = await db
      .select()
      .from(accountCategories)
      .where(sql`lower(${accountCategories.name}) = ${name.toLowerCase()}`);
    
    return category || undefined;
  }
  
  async getCategories(): Promise<AccountCategory[]> {
    return db.select().from(accountCategories);
  }
  
  async createCategory(insertCategory: InsertAccountCategory): Promise<AccountCategory> {
    const [category] = await db.insert(accountCategories).values(insertCategory).returning();
    return category;
  }
  
  // Bot Settings methods
  async getBotSettings(guildId: string): Promise<BotSettings | undefined> {
    const [settings] = await db
      .select()
      .from(botSettings)
      .where(eq(botSettings.guildId, guildId));
    
    return settings || undefined;
  }
  
  async createBotSettings(insertSettings: InsertBotSettings): Promise<BotSettings> {
    const [settings] = await db.insert(botSettings).values(insertSettings).returning();
    return settings;
  }
  
  async updateBotSettings(guildId: string, updateData: Partial<InsertBotSettings>): Promise<BotSettings | undefined> {
    const [settings] = await db
      .select()
      .from(botSettings)
      .where(eq(botSettings.guildId, guildId));
    
    if (!settings) return undefined;
    
    const [updatedSettings] = await db
      .update(botSettings)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(botSettings.guildId, guildId))
      .returning();
    
    return updatedSettings;
  }
  
  // Log methods
  async getLogs(limit?: number): Promise<Log[]> {
    let query = db
      .select()
      .from(logs)
      .orderBy(desc(logs.createdAt));
    
    if (limit && limit > 0) {
      query = query.limit(limit);
    }
    
    return query;
  }
  
  async createLog(insertLog: InsertLog): Promise<Log> {
    const [log] = await db.insert(logs).values(insertLog).returning();
    return log;
  }
  
  // Dashboard stats
  async getDashboardStats(): Promise<DashboardStats> {
    // Get total accounts
    const [{ count: totalAccounts }] = await db
      .select({ count: sql`count(*)` })
      .from(accounts);
    
    // Get available accounts
    const [{ count: availableAccounts }] = await db
      .select({ count: sql`count(*)` })
      .from(accounts)
      .where(eq(accounts.status, 'available'));
    
    // Get accounts generated today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [{ count: generatedToday }] = await db
      .select({ count: sql`count(*)` })
      .from(accounts)
      .where(
        and(
          isNotNull(accounts.generatedAt),
          gte(accounts.generatedAt, today)
        )
      );
    
    // Get last generation
    const [lastGeneratedAccount] = await db
      .select()
      .from(accounts)
      .where(isNotNull(accounts.generatedAt))
      .orderBy(desc(accounts.generatedAt))
      .limit(1);
    
    const lastGeneration = lastGeneratedAccount?.generatedAt;
    
    // Get category counts
    const categoryCountsResult = await db
      .select({
        name: accountCategories.name,
        count: sql`count(*)`,
      })
      .from(accounts)
      .leftJoin(accountCategories, eq(accounts.categoryId, accountCategories.id))
      .groupBy(accountCategories.name);
    
    const categoryCounts: { [key: string]: number } = {};
    categoryCountsResult.forEach(({ name, count }) => {
      if (name) categoryCounts[name] = Number(count);
    });
    
    // Get connected servers count
    const [{ count: connectedServers }] = await db
      .select({ count: sql`count(*)` })
      .from(botSettings);
    
    return {
      totalAccounts: Number(totalAccounts),
      availableAccounts: Number(availableAccounts),
      generatedToday: Number(generatedToday),
      categoryCounts,
      botStatus: 'online', // Default to online for now
      connectedServers: Number(connectedServers),
      lastGeneration
    };
  }
  
  async getServerActivity(limit: number = 10): Promise<ServerActivityItem[]> {
    const activityLogs = await db
      .select()
      .from(logs)
      .orderBy(desc(logs.createdAt))
      .limit(limit);
    
    return activityLogs.map(log => {
      let type: 'success' | 'error' | 'warning' | 'info' = 'info';
      
      if (log.type === 'error') type = 'error';
      else if (log.type === 'warning') type = 'warning';
      else if (log.type === 'success') type = 'success';
      
      return {
        id: log.id,
        type,
        title: log.action,
        message: log.message,
        timestamp: log.createdAt
      };
    });
  }
}

// Initialize with MemStorage for development, will switch to DatabaseStorage
// export const storage = new MemStorage();

// Use database storage
export const storage = new DatabaseStorage();
