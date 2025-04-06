import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  isAdmin: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Account categories
export const accountCategories = pgTable("account_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAccountCategorySchema = createInsertSchema(accountCategories).pick({
  name: true,
  description: true,
});

export type InsertAccountCategory = z.infer<typeof insertAccountCategorySchema>;
export type AccountCategory = typeof accountCategories.$inferSelect;

// Account schemas for tracking service accounts
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  password: text("password").notNull(),
  categoryId: integer("category_id").notNull(),
  status: text("status").notNull().default("available"), // available, generated, expired
  expiresAt: timestamp("expires_at"),
  generatedBy: text("generated_by"),
  generatedAt: timestamp("generated_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAccountSchema = createInsertSchema(accounts).pick({
  email: true,
  password: true,
  categoryId: true,
  status: true,
  expiresAt: true,
  generatedBy: true,
  generatedAt: true,
}).extend({
  expiresAt: z.date().nullable(),
  generatedBy: z.string().nullable(),
  generatedAt: z.date().nullable(),
});

export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Account = typeof accounts.$inferSelect;

// Discord server settings
export const botSettings = pgTable("bot_settings", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull().unique(),
  prefix: text("prefix").default("!").notNull(),
  allowedRoles: text("allowed_roles").array(),
  adminRoles: text("admin_roles").array(),
  cooldown: integer("cooldown").default(3600).notNull(), // cooldown in seconds
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBotSettingsSchema = createInsertSchema(botSettings).pick({
  guildId: true,
  prefix: true,
  allowedRoles: true,
  adminRoles: true,
  cooldown: true,
});

export type InsertBotSettings = z.infer<typeof insertBotSettingsSchema>;
export type BotSettings = typeof botSettings.$inferSelect;

// Server logs
export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // info, warning, error, success
  action: text("action").notNull(),
  message: text("message").notNull(),
  metadata: text("metadata"),
  userId: integer("user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLogSchema = createInsertSchema(logs).pick({
  type: true,
  action: true,
  message: true,
  metadata: true,
  userId: true,
});

export type InsertLog = z.infer<typeof insertLogSchema>;
export type Log = typeof logs.$inferSelect;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  logs: many(logs),
}));

export const accountCategoriesRelations = relations(accountCategories, ({ many }) => ({
  accounts: many(accounts),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  category: one(accountCategories, {
    fields: [accounts.categoryId],
    references: [accountCategories.id],
  }),
}));

export const logsRelations = relations(logs, ({ one }) => ({
  user: one(users, {
    fields: [logs.userId],
    references: [users.id],
  }),
}));
