import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardStore } from '../stores/dashboardStore';
import { 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  DollarSign, 
  ShoppingCart, 
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Calendar
} from 'lucide-react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement, 
  BarElement 
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { DashboardStats, TransactionHistory, Transaction } from '../types';
import DashboardCharts from '../components/dashboard/DashboardCharts';

// Register ChartJS components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  ArcElement, 
  Title, 
  Tooltip, 
  Legend
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { 
    stats, 
    transactionHistory, 
    categoryData, 
    loading, 
    error, 
    fetchDashboardData 
  } = useDashboardStore();

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Welcome to your inventory overview</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar size={16} />
            <span>Last updated: {new Date().toLocaleString()}</span>
          </div>
          <button
            onClick={() => navigate('/reports')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <BarChart3 size={16} className="mr-2" />
            View Full Reports
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-blue-600">Total Items</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">{stats?.totalProducts || 0}</p>
          <div className="flex items-center text-sm text-gray-500">
            <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
            <span>Updated daily</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-50 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <span className="text-sm font-medium text-green-600">Inventory Value</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">
            ₹{stats?.totalValue?.toLocaleString() || 0}
          </p>
          <div className="flex items-center text-sm text-gray-500">
            <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
            <span>Total value</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-amber-50 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <span className="text-sm font-medium text-amber-600">Low Stock Items</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">{stats?.lowStockProducts || 0}</p>
          <div className="flex items-center text-sm text-gray-500">
            <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
            <span>Needs attention</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-50 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-purple-600">Total Transactions</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">{stats?.totalTransactions || 0}</p>
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="h-4 w-4 text-gray-400 mr-1" />
            <span>All time</span>
          </div>
        </div>
      </div>

      {/* Main Content Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction Trends - Takes 2 columns */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Transaction Trends</h2>
              <p className="text-sm text-gray-500">Last 30 days of inventory activity</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Stock In
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Stock Out
              </span>
            </div>
          </div>
          <div className="h-[400px]">
            <DashboardCharts />
          </div>
        </div>
        
        {/* Recent Transactions - Takes 1 column */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
              <p className="text-sm text-gray-500">Latest inventory movements</p>
            </div>
            <button
              onClick={() => navigate('/inventory')}
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              View all
            </button>
          </div>
          <div className="space-y-4">
            {transactionHistory?.transactions.slice(0, 5).map((transaction: Transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-full ${
                    transaction.type === 'stock-in' 
                      ? 'bg-green-100 text-green-600'
                      : transaction.type === 'stock-out'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {transaction.type === 'stock-in' ? (
                      <ArrowUpRight className="h-5 w-5" />
                    ) : transaction.type === 'stock-out' ? (
                      <ArrowDownRight className="h-5 w-5" />
                    ) : (
                      <TrendingUp className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{transaction.itemName || 'Deleted Item'}</p>
                    <p className="text-sm text-gray-500">{transaction.itemCategory || 'N/A'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${
                    transaction.type === 'stock-in' 
                      ? 'text-green-600'
                      : transaction.type === 'stock-out'
                      ? 'text-red-600'
                      : 'text-blue-600'
                  }`}>
                    {transaction.type === 'stock-in' ? '+' : '-'}{transaction.quantity}
                  </p>
                  <p className="text-sm text-gray-500">
                    {transaction.date ? new Date(transaction.date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;