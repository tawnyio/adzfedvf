import { type Account, type AccountCategory, type Log } from "./schema";

export type AccountWithCategory = Account & {
  category: AccountCategory;
};

export interface DashboardStats {
  totalAccounts: number;
  availableAccounts: number;
  generatedToday: number;
  categoryCounts: { [key: string]: number };
  botStatus: 'online' | 'offline' | 'idle';
  connectedServers: number;
  lastGeneration?: Date;
}

export interface ServerActivityItem {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
}

export interface BotCommand {
  name: string;
  description: string;
  usage: string;
  permission: 'user' | 'admin';
}

export interface AccountFilters {
  search: string;
  category: string;
  status: string;
}

export interface AuthResponse {
  success: boolean;
  user?: {
    id: number;
    username: string;
    isAdmin: boolean;
  };
  message?: string;
}
