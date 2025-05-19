import { DashboardStats, TransactionHistory } from '../types';

class DashboardApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const url = `${baseUrl}${endpoint}`;
    
    const token = localStorage.getItem('token');
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    };
    
    try {
      const response = await fetch(url, { ...defaultOptions, ...options });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/api/dashboard/stats');
  }

  async getTransactionHistory(days: number = 7): Promise<TransactionHistory> {
    return this.request<TransactionHistory>(`/api/dashboard/transactions?days=${days}`);
  }

  async getCategoryDistribution(): Promise<{ labels: string[], data: number[] }> {
    return this.request<{ labels: string[], data: number[] }>('/api/dashboard/categories');
  }
}

export const dashboardApi = new DashboardApiService(); 