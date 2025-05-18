import { ReportFilter } from '../types';

class ReportApiService {
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
      
      return response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async getTransactionReport(filter: ReportFilter = {}) {
    const queryParams = new URLSearchParams();
    
    if (filter.startDate) {
      queryParams.append('startDate', filter.startDate);
    }
    
    if (filter.endDate) {
      queryParams.append('endDate', filter.endDate);
    }
    
    if (filter.type) {
      queryParams.append('transactionType', filter.type);
    }
    
    return this.request(`/reports/transactions?${queryParams.toString()}`);
  }

  async getInventoryReport(filter: ReportFilter = {}) {
    const queryParams = new URLSearchParams();
    
    if (filter.startDate) {
      queryParams.append('startDate', filter.startDate);
    }
    
    if (filter.endDate) {
      queryParams.append('endDate', filter.endDate);
    }
    
    if (filter.category) {
      queryParams.append('category', filter.category);
    }
    
    return this.request(`/reports/inventory?${queryParams.toString()}`);
  }
}

export const reportApi = new ReportApiService(); 