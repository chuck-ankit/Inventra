import Dexie, { Table } from 'dexie';
import { v4 as uuidv4 } from 'uuid';
import { User, InventoryItem, Transaction, LowStockAlert } from '../types';

class StockManagerDatabase extends Dexie {
  users!: Table<User>;
  inventory!: Table<InventoryItem>;
  transactions!: Table<Transaction>;
  lowStockAlerts!: Table<LowStockAlert>;

  constructor() {
    super('StockManagerDB');
    
    // Define all versions
    this.version(1).stores({
      users: 'id, email, username',
      inventory: 'id, name, category, *tags',
      transactions: 'id, itemId, date, type',
      lowStockAlerts: 'id, itemId, date, resolved'
    });

    // Add version 20 with the same schema
    this.version(20).stores({
      users: 'id, email, username',
      inventory: 'id, name, category, *tags',
      transactions: 'id, itemId, date, type',
      lowStockAlerts: 'id, itemId, date, resolved'
    }).upgrade(tx => {
      // No schema changes, just version bump
      return Promise.resolve();
    });
  }

  // Initialize with demo data if needed
  async initializeWithDemoData() {
    try {
      const usersCount = await this.users.count();
      
      if (usersCount === 0) {
        // Add demo user
        const demoUserId = uuidv4();
        await this.users.add({
          id: demoUserId,
          username: 'demo',
          email: 'demo@example.com',
          role: 'admin',
          preferences: {
            theme: 'light',
            notifications: {
              email: true,
              lowStock: true,
              stockOut: true
            },
            dashboardLayout: 'default',
            language: 'en'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        // Add demo inventory items
        const inventoryItems: InventoryItem[] = [
          {
            id: uuidv4(),
            name: 'Product A',
            description: 'Description for Product A',
            category: 'Electronics',
            quantity: 50,
            unitPrice: 99.99,
            reorderPoint: 10,
            status: 'in_stock',
            createdBy: demoUserId,
            updatedBy: demoUserId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: uuidv4(),
            name: 'Product B',
            description: 'Description for Product B',
            category: 'Clothing',
            quantity: 30,
            unitPrice: 29.99,
            reorderPoint: 5,
            status: 'in_stock',
            createdBy: demoUserId,
            updatedBy: demoUserId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: uuidv4(),
            name: 'Product C',
            description: 'Description for Product C',
            category: 'Food',
            quantity: 8,
            unitPrice: 5.99,
            reorderPoint: 10,
            status: 'low_stock',
            createdBy: demoUserId,
            updatedBy: demoUserId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];

        await this.inventory.bulkAdd(inventoryItems);

        // Add demo transactions
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const twoDaysAgo = new Date(now);
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        const transactions: Transaction[] = [
          {
            id: uuidv4(),
            itemId: inventoryItems[0].id,
            itemName: inventoryItems[0].name,
            itemCategory: inventoryItems[0].category,
            quantity: 10,
            type: 'stock-in',
            date: twoDaysAgo.toISOString(),
            notes: 'Initial stock',
            createdBy: demoUserId
          },
          {
            id: uuidv4(),
            itemId: inventoryItems[0].id,
            itemName: inventoryItems[0].name,
            itemCategory: inventoryItems[0].category,
            quantity: 5,
            type: 'stock-out',
            date: yesterday.toISOString(),
            notes: 'Customer order #12345',
            createdBy: demoUserId
          },
          {
            id: uuidv4(),
            itemId: inventoryItems[1].id,
            itemName: inventoryItems[1].name,
            itemCategory: inventoryItems[1].category,
            quantity: 15,
            type: 'stock-in',
            date: yesterday.toISOString(),
            notes: 'New shipment',
            createdBy: demoUserId
          }
        ];

        await this.transactions.bulkAdd(transactions);

        // Add low stock alert for Product C
        await this.lowStockAlerts.add({
          id: uuidv4(),
          itemId: inventoryItems[2].id,
          date: new Date().toISOString(),
          resolved: false
        });
      }
    } catch (error) {
      console.error('Error initializing demo data:', error);
      // Don't throw the error, just log it
    }
  }
}

// Create a single instance of the database
const db = new StockManagerDatabase();

// Initialize the database
export async function initializeDatabase() {
  try {
    // Initialize with demo data if database is empty
    await db.initializeWithDemoData();

    // Set up broadcast channel for real-time updates
    setupBroadcastChannel();
  } catch (error) {
    console.error('Error initializing database:', error);
    // Don't throw the error, just log it
  }
}

// Set up broadcast channel for real-time updates across tabs
function setupBroadcastChannel() {
  if ('BroadcastChannel' in window) {
    const channel = new BroadcastChannel('stock_manager_updates');
    
    // Listen for changes from other tabs
    channel.onmessage = (event) => {
      if (event.data && event.data.type) {
        // Dispatch events based on the update type
        window.dispatchEvent(new CustomEvent(event.data.type, { 
          detail: event.data.detail 
        }));
      }
    };

    // Expose the channel for sending messages
    (window as any).stockManagerChannel = channel;
  }
}

// Helper to broadcast changes
export function broadcastChange(type: string, detail: any) {
  if ('stockManagerChannel' in window) {
    (window as any).stockManagerChannel.postMessage({ type, detail });
  }
  
  // Also dispatch locally
  window.dispatchEvent(new CustomEvent(type, { detail }));
}

export default db;