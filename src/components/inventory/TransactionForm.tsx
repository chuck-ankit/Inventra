import { useState, useEffect } from 'react';
import { useInventoryStore } from '../../stores/inventoryStore';
import { X } from 'lucide-react';
import { InventoryItem } from '../../types';
import { useNotificationStore } from '../../stores/notificationStore';

interface TransactionFormProps {
  onClose: () => void;
  type: 'stock-in' | 'stock-out';
  itemId?: string;
  item?: InventoryItem;
  onSuccess?: () => void;
}

const TransactionForm = ({ onClose, type, itemId, item, onSuccess }: TransactionFormProps) => {
  const { items, fetchItems, stockIn, stockOut } = useInventoryStore();
  const [selectedItemId, setSelectedItemId] = useState<string>((itemId || item?.id || item?._id || '') as string);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(item || null);
  const [success, setSuccess] = useState<string>('');

  // Fetch items and set initial selected item
  useEffect(() => {
    const initializeForm = async () => {
      await fetchItems();
      if (itemId || item?.id || item?._id) {
        const foundItem = items.find(i => 
          i.id === (itemId || item?.id || item?._id) || 
          i._id === (itemId || item?.id || item?._id)
        );
        if (foundItem) {
          setSelectedItem(foundItem);
          setSelectedItemId(foundItem.id || foundItem._id);
        }
      }
    };
    initializeForm();
  }, [fetchItems, itemId, item]);

  // Update selected item when selectedItemId changes
  useEffect(() => {
    if (selectedItemId) {
      const item = items.find(i => i.id === selectedItemId || i._id === selectedItemId);
      setSelectedItem(item || null);
    } else {
      setSelectedItem(null);
    }
  }, [selectedItemId, items]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedItemId) {
      setError('Please select an item');
      return;
    }

    if (quantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    setLoading(true);
    try {
      let success = false;
      if (type === 'stock-in') {
        success = await stockIn(selectedItemId, quantity, notes);
      } else {
        const response = await stockOut(selectedItemId, quantity, notes);
        success = response;
      }

      if (success) {
        setSuccess('Transaction completed successfully');
        setQuantity(0);
        setNotes('');
        setSelectedItemId('');
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      console.error('Transaction error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {type === 'stock-in' ? 'Stock In' : 'Stock Out'}
        </h2>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-800"
          type="button"
        >
          <X size={20} />
        </button>
      </div>
      
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {!item && (
          <div>
            <label htmlFor="itemId" className="block text-sm font-medium text-gray-700">
              Item <span className="text-red-500">*</span>
            </label>
            <select
              id="itemId"
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
              disabled={!!item}
            >
              <option value="">Select an item</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.quantity} in stock)
                </option>
              ))}
            </select>
          </div>
        )}
        
        {selectedItem && (
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Current Stock</p>
                <p className="text-lg font-medium text-gray-900">{selectedItem.quantity}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Reorder Point</p>
                <p className="text-lg font-medium text-gray-900">{selectedItem.reorderPoint}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Unit Price</p>
                <p className="text-lg font-medium text-gray-900">₹{selectedItem.unitPrice.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}
        
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
            Quantity <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="quantity"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            required
          />
        </div>
        
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Notes
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder={`Optional notes for this ${type} transaction`}
          />
        </div>
        
        <div className="pt-4 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`
              px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50
              ${type === 'stock-in' 
                ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                : 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'}
            `}
          >
            {loading 
              ? 'Processing...' 
              : (type === 'stock-in' ? 'Confirm Stock In' : 'Confirm Stock Out')
            }
          </button>
        </div>
      </form>
    </div>
  );
};

export default TransactionForm;