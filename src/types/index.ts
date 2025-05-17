// User types
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    lowStock: boolean;
    stockOut: boolean;
  };
  dashboardLayout: 'default' | 'compact' | 'detailed';
  language: string;
}

export interface User {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: 'user' | 'admin';
  preferences: UserPreferences;
  lastLogin?: Date;
  createdAt: string;
  updatedAt: string;
  token?: string;
}

export interface PasswordUpdate {
  currentPassword: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// Inventory types
export interface InventoryItem {
  id: string;
  _id?: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  reorderPoint: number;
  description?: string;
  sku?: string;
  location?: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface Transaction {
  id: string;
  itemId: string;
  itemName?: string;
  itemCategory?: string;
  quantity: number;
  type: 'stock-in' | 'stock-out' | 'adjustment';
  date: string;
  notes?: string;
  createdBy?: string;
}

export interface LowStockAlert {
  id: string;
  itemId: string;
  date: string;
  resolved: boolean;
}

// Dashboard types
export interface DashboardStats {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  recentTransactions: number;
}

export interface TransactionHistory {
  labels: string[];
  stockIn: number[];
  stockOut: number[];
}

// Report types
export interface ReportFilter {
  startDate?: string;
  endDate?: string;
  category?: string;
  type?: 'stock-in' | 'stock-out' | 'adjustment';
}

// Utility types
export type SortDirection = 'asc' | 'desc';

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}