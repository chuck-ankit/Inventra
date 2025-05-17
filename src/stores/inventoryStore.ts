import { create } from 'zustand';
import { InventoryItem, Transaction, PaginationState } from '../types';
import { inventoryApi } from '../services/inventoryApi';
import { useNotificationStore } from './notificationStore';

interface InventoryState {
  items: InventoryItem[];
  loading: boolean;
  error: string | null;
  pagination: PaginationState;
  
  // Actions
  fetchItems: (page?: number, pageSize?: number) => Promise<void>;
  addItem: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'createdBy' | 'updatedBy'>) => Promise<string>;
  updateItem: (id: string, item: Partial<InventoryItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  stockIn: (id: string, quantity: number) => Promise<boolean>;
  stockOut: (id: string, quantity: number) => Promise<boolean>;
  searchItems: (query: string) => Promise<InventoryItem[]>;
  clearError: () => void;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0
  },

  fetchItems: async (page = 1, pageSize = 10) => {
    set({ loading: true, error: null });
    try {
      const response = await inventoryApi.getItems(page, pageSize);
      set({
        items: response.items,
        pagination: {
          page: response.page,
          pageSize: response.pageSize,
          total: response.total,
        },
        loading: false,
      });
    } catch (error) {
      set({ error: 'Failed to fetch inventory items', loading: false });
    }
  },

  addItem: async (item) => {
    set({ loading: true, error: null });
    try {
      const response = await inventoryApi.addItem(item);
      await get().fetchItems(get().pagination.page, get().pagination.pageSize);
      set({ loading: false });
      return response.id;
    } catch (error) {
      set({ error: 'Failed to add item', loading: false });
      throw error;
    }
  },

  updateItem: async (id, item) => {
    set({ loading: true, error: null });
    try {
      await inventoryApi.updateItem(id, item);
      await get().fetchItems(get().pagination.page, get().pagination.pageSize);
      set({ loading: false });
    } catch (error) {
      set({ error: 'Failed to update item', loading: false });
    }
  },

  deleteItem: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await inventoryApi.deleteItem(id);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete item');
      }
      await get().fetchItems(get().pagination.page, get().pagination.pageSize);
      set({ loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete item';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  stockIn: async (id, quantity) => {
    set({ loading: true, error: null });
    try {
      await inventoryApi.stockIn(id, quantity);
      await get().fetchItems(get().pagination.page, get().pagination.pageSize);
      set({ loading: false });
      return true;
    } catch (error) {
      set({ error: 'Failed to update stock', loading: false });
      return false;
    }
  },

  stockOut: async (id, quantity) => {
    set({ loading: true, error: null });
    try {
      const response = await inventoryApi.stockOut(id, quantity);
      await get().fetchItems(get().pagination.page, get().pagination.pageSize);
      set({ loading: false });

      // Check for low stock after stock out
      const item = get().items.find(i => i.id === id);
      if (item && item.quantity <= item.minStock) {
        useNotificationStore.getState().addNotification({
          type: 'warning',
          message: `Low stock alert: ${item.name} is running low (${item.quantity} remaining)`,
        });
      }

      return true;
    } catch (error) {
      set({ error: 'Failed to update stock', loading: false });
      return false;
    }
  },

  searchItems: async (query) => {
    set({ loading: true, error: null });
    try {
      const results = await inventoryApi.searchItems(query);
      set({ loading: false });
      return results;
    } catch (error) {
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to search items' 
      });
      return [];
    }
  },

  clearError: () => set({ error: null })
}));