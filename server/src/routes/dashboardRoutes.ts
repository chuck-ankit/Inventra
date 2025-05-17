import express from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { Transaction } from '../models/Transaction.js';
import { InventoryItem } from '../models/InventoryItem.js';

const router = express.Router();

// Get dashboard statistics
router.get('/stats', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Get total products for current user
    const totalProducts = await InventoryItem.countDocuments({ createdBy: req.user.userId });

    // Get low stock products for current user
    const lowStockProducts = await InventoryItem.countDocuments({
      createdBy: req.user.userId,
      $expr: { $lte: ['$quantity', '$reorderPoint'] }
    });

    // Calculate total inventory value for current user
    const inventoryItems = await InventoryItem.find({ createdBy: req.user.userId });
    const totalValue = inventoryItems.reduce((sum, item) => 
      sum + (item.quantity * item.unitPrice), 0);

    // Get total transactions for current user
    const totalTransactions = await Transaction.countDocuments({ createdBy: req.user.userId });

    // Get recent transactions for current user
    const recentTransactions = await Transaction.find({ createdBy: req.user.userId })
      .sort({ date: -1 })
      .limit(5)
      .populate('itemId', 'name category')
      .populate('createdBy', 'username');

    res.json({
      totalProducts,
      lowStockProducts,
      totalValue,
      totalTransactions,
      recentTransactions: recentTransactions.map(t => ({
        id: t._id,
        itemId: t.itemId,
        itemName: t.itemId.name,
        itemCategory: t.itemId.category,
        quantity: t.quantity,
        type: t.type,
        date: t.date,
        notes: t.notes
      }))
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
  }
});

// Get transaction history
router.get('/transactions', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const days = parseInt(req.query.days as string) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all transactions with item details for the current user's items
    const transactions = await Transaction.find({
      date: {
        $gte: startDate
      },
      createdBy: req.user.userId // Filter by user ID
    })
    .populate('itemId', 'name category')
    .populate('createdBy', 'username')
    .sort({ date: -1 });

    // Group transactions by date for volume chart
    const dateMap = new Map<string, { stockIn: number; stockOut: number }>();
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dateMap.set(dateStr, { stockIn: 0, stockOut: 0 });
    }

    // Calculate transaction volumes
    transactions.forEach(t => {
      const dateStr = t.date.toISOString().split('T')[0];
      const data = dateMap.get(dateStr);
      if (data) {
        if (t.type === 'stock-in') {
          data.stockIn += t.quantity;
        } else if (t.type === 'stock-out') {
          data.stockOut += t.quantity;
        }
      }
    });

    // Convert to arrays for chart
    const labels = Array.from(dateMap.keys());
    const stockIn = Array.from(dateMap.values()).map(v => v.stockIn);
    const stockOut = Array.from(dateMap.values()).map(v => v.stockOut);

    // Format transactions for history table
    const transactionHistory = transactions.map(t => ({
      id: t._id,
      itemId: t.itemId,
      itemName: t.itemId?.name || 'Deleted Item',
      itemCategory: t.itemId?.category || 'N/A',
      quantity: t.quantity,
      type: t.type,
      date: t.date,
      notes: t.notes
    }));

    res.json({
      labels,
      stockIn,
      stockOut,
      transactions: transactionHistory
    });
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    res.status(500).json({ message: 'Failed to fetch transaction history' });
  }
});

// Get category distribution
router.get('/categories', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Get category distribution for current user's items
    const categories = await InventoryItem.aggregate([
      { $match: { createdBy: req.user.userId } },
      { $group: {
        _id: '$category',
        totalQuantity: { $sum: '$quantity' }
      }},
      { $sort: { totalQuantity: -1 } }
    ]);

    const labels = categories.map(c => c._id);
    const data = categories.map(c => c.totalQuantity);

    res.json({
      labels,
      data
    });
  } catch (error) {
    console.error('Error fetching category distribution:', error);
    res.status(500).json({ message: 'Failed to fetch category distribution' });
  }
});

export default router; 