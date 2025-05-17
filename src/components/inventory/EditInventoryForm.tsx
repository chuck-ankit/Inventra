import { useState } from 'react';
import { useInventoryStore } from '../../stores/inventoryStore';
import { X } from 'lucide-react';
import { InventoryItem } from '../../types';

interface EditInventoryFormProps {
  onClose: () => void;
  item: InventoryItem;
  onSuccess?: () => void;
}

const EditInventoryForm = ({ onClose, item, onSuccess }: EditInventoryFormProps) => {
  const { updateItem } = useInventoryStore();
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description || '');
  const [category, setCategory] = useState(item.category);
  const [unitPrice, setUnitPrice] = useState(item.unitPrice);
  const [reorderPoint, setReorderPoint] = useState(item.reorderPoint);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    
    if (!category.trim()) {
      setError('Category is required');
      return;
    }
    
    if (unitPrice < 0) {
      setError('Unit price cannot be negative');
      return;
    }
    
    if (reorderPoint < 0) {
      setError('Reorder point cannot be negative');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const itemData = {
        name: name.trim(),
        description: description.trim(),
        category: category.trim(),
        unitPrice,
        reorderPoint
      };
      
      const itemId = item.id || item._id;
      if (!itemId) {
        throw new Error('Item ID is missing');
      }
      
      await updateItem(itemId, itemData);
      onClose();
      onSuccess?.();
    } catch (err) {
      console.error('Error updating item:', err);
      setError(err instanceof Error ? err.message : 'Failed to update item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Edit Item
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
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            required
          />
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Category <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            required
          />
        </div>
        
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
            Current Quantity
          </label>
          <input
            type="number"
            id="quantity"
            value={item.quantity}
            disabled
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="unitPrice" className="block text-sm font-medium text-gray-700">
            Unit Price
          </label>
          <input
            type="number"
            id="unitPrice"
            min="0"
            step="0.01"
            value={unitPrice}
            onChange={(e) => setUnitPrice(Number(e.target.value))}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="reorderPoint" className="block text-sm font-medium text-gray-700">
            Reorder Point
          </label>
          <input
            type="number"
            id="reorderPoint"
            min="0"
            value={reorderPoint}
            onChange={(e) => setReorderPoint(Number(e.target.value))}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Update Item'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditInventoryForm; 