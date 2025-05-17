import { create } from 'zustand';
import { Transaction, ReportFilter } from '../types';
import { reportApi } from '../services/reportApi';

interface ReportState {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchTransactions: (filter?: ReportFilter) => Promise<void>;
  generateInventoryReport: (filter?: ReportFilter) => Promise<any>;
  generateTransactionReport: (filter?: ReportFilter) => Promise<any>;
  exportToCsv: (data: any[], filename: string) => void;
}

export const useReportStore = create<ReportState>((set, get) => ({
  transactions: [],
  loading: false,
  error: null,

  fetchTransactions: async (filter = {}) => {
    set({ loading: true, error: null });
    try {
      const transactions = await reportApi.getTransactionReport(filter) as Transaction[];
      set({ transactions, loading: false });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      set({ loading: false, error: error instanceof Error ? error.message : 'Failed to fetch transactions' });
    }
  },

  generateInventoryReport: async (filter = {}) => {
    set({ loading: true, error: null });
    try {
      const report = await reportApi.getInventoryReport(filter);
      set({ loading: false });
      return report;
    } catch (error) {
      console.error('Error generating inventory report:', error);
      set({ loading: false, error: error instanceof Error ? error.message : 'Failed to generate inventory report' });
      return [];
    }
  },

  generateTransactionReport: async (filter = {}) => {
    set({ loading: true, error: null });
    try {
      const report = await reportApi.getTransactionReport(filter);
      set({ loading: false });
      return report;
    } catch (error) {
      console.error('Error generating transaction report:', error);
      set({ loading: false, error: error instanceof Error ? error.message : 'Failed to generate transaction report' });
      return [];
    }
  },

  exportToCsv: (data, filename) => {
    if (!data || !data.length) {
      console.error('No data to export');
      return;
    }
    
    // Get headers from the first item
    const headers = Object.keys(data[0]);
    
    // Convert data to CSV format
    const csvContent = [
      headers.join(','), // Header row
      ...data.map(row => 
        headers.map(header => {
          let value = row[header];
          
          // Format dates
          if (value instanceof Date) {
            value = value.toLocaleString();
          }
          
          // Handle commas and quotes in the content
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          
          return value;
        }).join(',')
      )
    ].join('\n');
    
    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}));