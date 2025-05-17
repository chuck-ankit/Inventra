import express from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { Transaction } from '../models/Transaction.js';
import { InventoryItem } from '../models/InventoryItem.js';

const router = express.Router();

interface InventoryReportItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  reorderPoint: number;
  stockIn: number;
  stockOut: number;
  turnover: number;
  value: number;
  updatedAt: Date;
}

// Generate transaction report
router.get('/transactions', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { startDate, endDate, transactionType } = req.query;
    
    const query: any = {
      createdBy: req.user.userId
    };
    
    if (startDate) {
      query.date = { $gte: new Date(startDate as string) };
    }
    
    if (endDate) {
      query.date = { ...query.date, $lte: new Date(endDate as string) };
    }
    
    if (transactionType) {
      query.type = transactionType;
    }
    
    const transactions = await Transaction.find(query)
      .populate('itemId', 'name category')
      .populate('createdBy', 'username')
      .sort({ date: -1 });
    
    // Transform the data for the report
    const reportData = transactions.map(transaction => ({
      id: transaction._id,
      date: transaction.date,
      itemName: transaction.itemId?.name || 'Deleted Item',
      itemCategory: transaction.itemId?.category || 'N/A',
      type: transaction.type,
      quantity: transaction.quantity,
      totalValue: transaction.quantity * (transaction.itemId?.unitPrice || 0),
      notes: transaction.notes,
      createdBy: transaction.createdBy?.username || 'Unknown'
    }));
    
    res.json(reportData);
  } catch (error: any) {
    console.error('Error generating transaction report:', error);
    res.status(500).json({ message: error.message });
  }
});

// Generate inventory report
router.get('/inventory', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { startDate, endDate, category } = req.query;
    
    const query: any = {
      createdBy: req.user.userId
    };
    
    if (category) {
      query.category = category;
    }
    
    const items = await InventoryItem.find(query);
    
    // Get transaction data for each item
    const reportData: InventoryReportItem[] = await Promise.all(items.map(async (item) => {
      const transactionQuery: any = { itemId: item._id };
      
      if (startDate) {
        transactionQuery.date = { $gte: new Date(startDate as string) };
      }
      
      if (endDate) {
        transactionQuery.date = { ...transactionQuery.date, $lte: new Date(endDate as string) };
      }
      
      const [stockIn, stockOut] = await Promise.all([
        Transaction.aggregate([
          { $match: { ...transactionQuery, type: 'stock-in' } },
          { $group: { _id: null, total: { $sum: '$quantity' } } }
        ]),
        Transaction.aggregate([
          { $match: { ...transactionQuery, type: 'stock-out' } },
          { $group: { _id: null, total: { $sum: '$quantity' } } }
        ])
      ]);
      
      const totalStockIn = stockIn[0]?.total || 0;
      const totalStockOut = stockOut[0]?.total || 0;
      
      return {
        id: item._id.toString(),
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        reorderPoint: item.reorderPoint,
        stockIn: totalStockIn,
        stockOut: totalStockOut,
        turnover: totalStockOut / (item.quantity || 1),
        value: item.quantity * item.unitPrice,
        updatedAt: item.updatedAt
      };
    }));
    
    res.json(reportData);
  } catch (error: any) {
    console.error('Error generating inventory report:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router; 