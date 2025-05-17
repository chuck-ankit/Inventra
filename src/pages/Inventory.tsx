import { useState, useEffect } from 'react';
import { useInventoryStore } from '../stores/inventoryStore';
import InventoryForm from '../components/inventory/InventoryForm';
import EditInventoryForm from '../components/inventory/EditInventoryForm';
import TransactionForm from '../components/inventory/TransactionForm';
import { 
  Plus, 
  Search, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Edit, 
  Trash2, 
  Filter, 
  AlertTriangle,
  Package,
  DollarSign,
  TrendingUp,
  X
} from 'lucide-react';
import { InventoryItem } from '../types';

const Inventory = () => {
  const { items, loading, error, fetchItems, deleteItem } = useInventoryStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showStockInForm, setShowStockInForm] = useState(false);
  const [showStockOutForm, setShowStockOutForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Get unique categories from items
  useEffect(() => {
    const uniqueCategories = [...new Set(items.map(item => item.category))];
    setCategories(uniqueCategories);
  }, [items]);

  // Fetch items on component mount
  useEffect(() => {
    fetchItems();
    
    // Listen for real-time updates
    const handleInventoryUpdate = () => {
      fetchItems();
    };
    
    window.addEventListener('inventory-updated', handleInventoryUpdate);
    
    return () => {
      window.removeEventListener('inventory-updated', handleInventoryUpdate);
    };
  }, [fetchItems]);

  // Filter items based on search term and category
  useEffect(() => {
    let filtered = [...items];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        item => 
          item.name.toLowerCase().includes(term) || 
          item.description?.toLowerCase().includes(term) ||
          item.category.toLowerCase().includes(term)
      );
    }
    
    if (categoryFilter) {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }
    
    setFilteredItems(filtered);
  }, [items, searchTerm, categoryFilter]);

  // Handle delete item
  const handleDeleteClick = (id: string) => {
    console.log('Delete clicked with item:', id);
    if (!id) {
      console.error('Delete clicked with no ID');
      return;
    }
    setConfirmDelete(id);
    setDeleteError('');
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) {
      console.error('No item selected for deletion');
      return;
    }
    
    try {
      console.log('Attempting to delete item with ID:', confirmDelete);
      await deleteItem(confirmDelete);
      setConfirmDelete(null);
      // Refresh the items list
      await fetchItems();
    } catch (err) {
      console.error('Error deleting item:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while deleting the item';
      
      // Show a more user-friendly message for specific error cases
      if (errorMessage.includes('associated transactions')) {
        setDeleteError('This item cannot be deleted because it has associated transactions. Please archive the item instead.');
      } else {
        setDeleteError(errorMessage);
      }
    }
  };

  // Handle stock in/out
  const handleStockIn = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowStockInForm(true);
  };

  const handleStockOut = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowStockOutForm(true);
  };

  // Handle edit
  const handleEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowEditForm(true);
  };

  // Handle successful operations
  const handleOperationSuccess = () => {
    fetchItems();
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md ${
                viewMode === 'grid' 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Package size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md ${
                viewMode === 'list' 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <TrendingUp size={20} />
            </button>
          </div>
          
          <button 
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <Plus size={16} className="mr-2" />
            Add New Item
          </button>
        </div>
      </div>
      
      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          
          <div className="relative max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter size={18} className="text-gray-400" />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {(searchTerm || categoryFilter) && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <X size={16} className="mr-2" />
              Clear Filters
            </button>
          )}
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      {/* Inventory Display */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
            <Search size={24} />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No items found</h3>
          <p className="text-gray-500">
            {items.length === 0 
              ? "Your inventory is empty. Let's add some items!" 
              : "Try adjusting your search or filter criteria."
            }
          </p>
          {items.length === 0 && (
            <button 
              onClick={() => setShowAddForm(true)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus size={16} className="mr-2" />
              Add First Item
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <div key={item._id || item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.name}</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {item.category}
                    </span>
                  </div>
                  {item.quantity <= item.reorderPoint && (
                    <div className="p-2 bg-amber-50 rounded-lg">
                      <AlertTriangle size={20} className="text-amber-600" />
                    </div>
                  )}
                </div>
                
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{item.description}</p>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Quantity</span>
                    <span className={`text-sm font-medium ${
                      item.quantity <= item.reorderPoint ? 'text-amber-600' : 'text-gray-900'
                    }`}>
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Unit Price</span>
                    <span className="text-sm font-medium text-gray-900">
                      ₹{item.unitPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Total Value</span>
                    <span className="text-sm font-medium text-gray-900">
                      ₹{(item.quantity * item.unitPrice).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                      title="Edit Item"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleStockIn(item)}
                      className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                      title="Stock In"
                    >
                      <ArrowUpCircle size={18} />
                    </button>
                    <button
                      onClick={() => handleStockOut(item)}
                      className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors duration-200"
                      title="Stock Out"
                    >
                      <ArrowDownCircle size={18} />
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      console.log('Delete button clicked for item:', item);
                      handleDeleteClick(item._id || item.id || '');
                    }}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    title="Delete Item"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Value
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.name}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {item.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {item.quantity <= item.reorderPoint && (
                          <AlertTriangle size={16} className="text-amber-500 mr-1" />
                        )}
                        <span className={`text-sm font-medium ${
                          item.quantity <= item.reorderPoint ? 'text-amber-600' : 'text-gray-900'
                        }`}>
                          {item.quantity}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₹{item.unitPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{(item.quantity * item.unitPrice).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                          title="Edit Item"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleStockIn(item)}
                          className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                          title="Stock In"
                        >
                          <ArrowUpCircle size={18} />
                        </button>
                        <button
                          onClick={() => handleStockOut(item)}
                          className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors duration-200"
                          title="Stock Out"
                        >
                          <ArrowDownCircle size={18} />
                        </button>
                        <button
                          onClick={() => {
                            console.log('Delete button clicked for item:', item);
                            handleDeleteClick(item._id || item.id || '');
                          }}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                          title="Delete Item"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Confirm Delete</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete this item? This action cannot be undone.
            </p>
            {deleteError && (
              <div className="mb-4 p-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {deleteError}
              </div>
            )}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Forms */}
      {showAddForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl">
            <InventoryForm
              onClose={() => setShowAddForm(false)}
              onSuccess={handleOperationSuccess}
            />
          </div>
        </div>
      )}

      {showEditForm && selectedItem && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl">
            <EditInventoryForm
              item={selectedItem}
              onClose={() => {
                setShowEditForm(false);
                setSelectedItem(null);
              }}
              onSuccess={handleOperationSuccess}
            />
          </div>
        </div>
      )}

      {showStockInForm && selectedItem && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md">
            <TransactionForm
              type="stock-in"
              item={selectedItem}
              onClose={() => {
                setShowStockInForm(false);
                setSelectedItem(null);
              }}
              onSuccess={handleOperationSuccess}
            />
          </div>
        </div>
      )}

      {showStockOutForm && selectedItem && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md">
            <TransactionForm
              type="stock-out"
              item={selectedItem}
              onClose={() => {
                setShowStockOutForm(false);
                setSelectedItem(null);
              }}
              onSuccess={handleOperationSuccess}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;