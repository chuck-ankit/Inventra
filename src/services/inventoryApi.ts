import { InventoryItem, Transaction } from '../types';

class InventoryApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const url = `${baseUrl}${endpoint}`;
    
    const token = localStorage.getItem('token');
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
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
      throw error;
    }
  }

  async getItems(page = 1, pageSize = 10, category?: string): Promise<{ items: InventoryItem[]; total: number; page: number; pageSize: number }> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...(category && { category })
    });
    return this.request<{ items: InventoryItem[]; total: number; page: number; pageSize: number }>(`/inventory?${queryParams}`);
  }

  async addItem(item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'createdBy' | 'updatedBy'>): Promise<InventoryItem> {
    return this.request<InventoryItem>('/inventory', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  async updateItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> {
    const response = await this.request<InventoryItem>(`/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response;
  }

  async deleteItem(id: string): Promise<{ success: boolean; message?: string }> {
    const response = await this.request<{ success: boolean; message?: string }>(`/inventory/${id}`, {
      method: 'DELETE',
    });
    return response;
  }

  async stockIn(itemId: string, quantity: number, notes?: string): Promise<Transaction> {
    if (!itemId) {
      throw new Error('Item ID is required for stock in');
    }
    return this.request<Transaction>('/inventory/stock-in', {
      method: 'POST',
      body: JSON.stringify({ itemId, quantity, notes }),
    });
  }

  async stockOut(itemId: string, quantity: number, notes?: string): Promise<Transaction> {
    if (!itemId) {
      throw new Error('Item ID is required for stock out');
    }
    return this.request<Transaction>('/inventory/stock-out', {
      method: 'POST',
      body: JSON.stringify({ itemId, quantity, notes }),
    });
  }

  async searchItems(query: string): Promise<InventoryItem[]> {
    return this.request<InventoryItem[]>(`/inventory/search?q=${encodeURIComponent(query)}`);
  }
}

export const inventoryApi = new InventoryApiService(); 