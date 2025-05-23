import express, { Response } from 'express';
import { InventoryItem } from '../models/InventoryItem.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { Transaction } from '../models/Transaction.js';
import { Alert } from '../models/Alert.js';
import mongoose from 'mongoose';

const router = express.Router();

// Get inventory items with pagination
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const category = req.query.category as string;

    const query: any = { createdBy: req.user.userId };
    if (category) {
      query.category = category;
    }

    const [items, total] = await Promise.all([
      InventoryItem.find(query)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize),
      InventoryItem.countDocuments(query)
    ]);

    res.json({ items, total });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create inventory item
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const session = await InventoryItem.startSession();
  session.startTransaction();

  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const inventory = new InventoryItem({
      ...req.body,
      createdBy: req.user.userId
    });
    await inventory.save({ session });

    // Create initial stock-in transaction
    const transaction = new Transaction({
      itemId: inventory._id,
      type: 'stock-in',
      quantity: req.body.quantity || 0,
      notes: 'Initial stock',
      createdBy: req.user.userId,
      totalValue: (req.body.quantity || 0) * (req.body.unitPrice || 0)
    });
    await transaction.save({ session });

    await session.commitTransaction();
    res.status(201).json(inventory);
  } catch (error: any) {
    await session.abortTransaction();
    res.status(400).json({ message: error.message });
  } finally {
    session.endSession();
  }
});

// Search inventory items
router.get('/search', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { q } = req.query;
    if (!q) {
      return res.json([]);
    }

    const searchQuery = {
      createdBy: req.user.userId,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } }
      ]
    };

    const items = await InventoryItem.find(searchQuery).limit(10);
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get inventory item by ID
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const inventory = await InventoryItem.findOne({
      _id: req.params.id,
      createdBy: req.user.userId
    });

    if (!inventory) {
      return res.status(404).json({ message: 'Inventory item not found or you do not have permission to view it' });
    }

    res.json(inventory);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Update inventory item
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const updates = req.body;
    const allowedUpdates = [
      'name',
      'description',
      'category',
      'unitPrice',
      'reorderPoint'
    ];
    
    const isValidOperation = Object.keys(updates).every(update => 
      allowedUpdates.includes(update)
    );
    
    if (!isValidOperation) {
      return res.status(400).json({ message: 'Invalid updates' });
    }

    const inventory = await InventoryItem.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.userId },
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!inventory) {
      return res.status(404).json({ message: 'Inventory item not found or you do not have permission to modify it' });
    }

    res.json(inventory);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Delete inventory item
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const session = await InventoryItem.startSession();
  session.startTransaction();

  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const itemId = new mongoose.Types.ObjectId(req.params.id);

    // Check if item exists and belongs to user
    const item = await InventoryItem.findOne({ _id: itemId, createdBy: req.user.userId }).session(session);

    if (!item) {
      throw new Error('Inventory item not found or you do not have permission to delete it');
    }

    // Create stock-out transaction for remaining quantity
    if (item.quantity > 0) {
      const transaction = new Transaction({
        itemId: item._id,
        type: 'stock-out',
        quantity: item.quantity,
        notes: 'Item deleted - Remaining stock removed',
        createdBy: req.user.userId,
        totalValue: item.quantity * item.unitPrice
      });
      await transaction.save({ session });
    }

    // Delete any associated alerts
    const alerts = await Alert.find({ itemId }).session(session);
    await Promise.all(alerts.map((alert: any) => alert.deleteOne({ session })));

    await InventoryItem.deleteOne({ _id: itemId }).session(session);

    await session.commitTransaction();
    res.json({ success: true, message: 'Inventory item deleted successfully' });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
});

// Stock in endpoint
router.post('/stock-in', authMiddleware, async (req: AuthRequest, res: Response) => {
  const session = await InventoryItem.startSession();
  session.startTransaction();

  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { itemId, quantity, notes } = req.body;

    if (!quantity || quantity <= 0) {
      throw new Error('Invalid quantity');
    }

    const item = await InventoryItem.findOne({ _id: itemId, createdBy: req.user.userId }).session(session);
    if (!item) {
      throw new Error('Item not found or you do not have permission to modify it');
    }

    // Update item quantity
    item.quantity += quantity;
    await item.save({ session });

    // Create transaction record
    const transaction = new Transaction({
      itemId,
      quantity,
      type: 'stock-in',
      notes,
      createdBy: req.user.userId
    });
    await transaction.save({ session });

    // Check if we need to remove any low stock alerts
    if (item.quantity > item.reorderPoint) {
      await Alert.deleteMany({ itemId, type: 'low-stock' }).session(session);
    }

    await session.commitTransaction();
    res.json({ success: true, item, transaction });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
});

// Stock out endpoint
router.post('/stock-out', authMiddleware, async (req: AuthRequest, res: Response) => {
  const session = await InventoryItem.startSession();
  session.startTransaction();

  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { itemId, quantity, notes } = req.body;

    if (!quantity || quantity <= 0) {
      throw new Error('Invalid quantity');
    }

    const item = await InventoryItem.findOne({ _id: itemId, createdBy: req.user.userId }).session(session);
    if (!item) {
      throw new Error('Item not found or you do not have permission to modify it');
    }

    // Allow stock-out even if quantity is insufficient, but show a warning
    if (item.quantity < quantity) {
      // Create a warning notification
      const warningNotification = new Alert({
        itemId,
        type: 'notification',
        message: `Warning: Stock-out of ${quantity} units requested for ${item.name}, but only ${item.quantity} units available.`,
        createdBy: req.user.userId,
        priority: 'high'
      });
      await warningNotification.save({ session });

      // Update item quantity to 0 since we're allowing the stock-out
      item.quantity = 0;
    } else {
      // Update item quantity normally
      item.quantity -= quantity;
    }
    await item.save({ session });

    // Create transaction record
    const transaction = new Transaction({
      itemId,
      quantity,
      type: 'stock-out',
      notes,
      createdBy: req.user.userId,
      totalValue: quantity * item.unitPrice
    });
    await transaction.save({ session });

    // Create alerts if quantity is at or below reorder point
    if (item.quantity <= item.reorderPoint) {
      // Create low stock alert
      const alert = new Alert({
        itemId,
        type: 'low_stock',
        message: `Low stock alert: ${item.name} is below reorder point (${item.quantity} remaining)`,
        createdBy: req.user.userId
      });
      await alert.save({ session });

      // Create notification for immediate attention
      const notification = new Alert({
        itemId,
        type: 'out_of_stock',
        message: `Warning: ${item.name} stock is low (${item.quantity} remaining). Consider restocking soon.`,
        createdBy: req.user.userId
      });
      await notification.save({ session });
    }

    await session.commitTransaction();
    res.json({ success: true, item, transaction });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
});

export default router; 