import { create } from 'zustand';
import { DashboardStats, TransactionHistory } from '../types';
import { dashboardApi } from '../services/dashboardApi';

interface DashboardState {
  stats: DashboardStats | null;
  transactionHistory: TransactionHistory | null;
  categoryData: {
    labels: string[];
    data: number[];
  };
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchDashboardData: () => Promise<void>;
  clearError: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  transactionHistory: null,
  categoryData: {
    labels: [],
    data: []
  },
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchDashboardData: async () => {
    set({ loading: true, error: null });
    try {
      const [stats, transactionHistory, categoryData] = await Promise.all([
        dashboardApi.getDashboardStats(),
        dashboardApi.getTransactionHistory(),
        dashboardApi.getCategoryDistribution()
      ]);

      set({
        stats,
        transactionHistory,
        categoryData,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch dashboard data'
      });
    }
  }
})); 