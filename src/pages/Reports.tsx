import { useState, useEffect, useRef, useCallback } from 'react';
import { useReportStore } from '../stores/reportStore';
import { 
  FileText, 
  Filter, 
  Calendar, 
  Download, 
  TrendingUp, 
  ShoppingCart 
} from 'lucide-react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { ReportFilter, Transaction } from '../types';
import debounce from 'lodash/debounce';

// Register ChartJS components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend,
  ArcElement
);

const Reports = () => {
  const { 
    transactions, 
    loading, 
    error, 
    fetchTransactions, 
    generateInventoryReport,
    generateTransactionReport,
    exportToCsv 
  } = useReportStore();
  
  const [activeTab, setActiveTab] = useState('transactions');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [transactionType, setTransactionType] = useState('');
  const [reportData, setReportData] = useState<any[]>([]);
  const [chartData, setChartData] = useState<{
    barData?: any;
    pieData?: any;
    valueData?: any;
    movementData?: any;
    labels?: string[];
    datasets?: any[];
    lowStockData?: any;
    recentChangesData?: any;
  } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filter, setFilter] = useState<ReportFilter>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshInterval = useRef<NodeJS.Timeout>();

  // Set initial date range
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    const startDateStr = start.toISOString().split('T')[0];
    const endDateStr = end.toISOString().split('T')[0];
    
    setStartDate(startDateStr);
    setEndDate(endDateStr);
    
    // Set initial filter with date range
    setFilter({
      startDate: startDateStr,
      endDate: endDateStr
    });
  }, []); // Empty dependency array means this runs once on mount

  // Debounced apply filters function
  const debouncedApplyFilters = useCallback(
    debounce(async (newFilter: ReportFilter) => {
      setIsRefreshing(true);
      try {
        if (activeTab === 'transactions') {
          await fetchTransactions(newFilter);
          const report = await generateTransactionReport(newFilter);
          setReportData(report);
          prepareTransactionChartData(report);
        } else if (activeTab === 'inventory') {
          const report = await generateInventoryReport(newFilter);
          setReportData(report);
          prepareInventoryChartData(report);
        }
      } finally {
        setIsRefreshing(false);
      }
    }, 500),
    [activeTab, fetchTransactions, generateTransactionReport, generateInventoryReport]
  );

  // Effect to apply filters when they change
  useEffect(() => {
    debouncedApplyFilters(filter);
  }, [filter, debouncedApplyFilters]);

  // Effect to handle tab changes
  useEffect(() => {
    // Clear existing interval
    if (refreshInterval.current) {
      clearInterval(refreshInterval.current);
    }

    // Set up new interval if on inventory tab
    if (activeTab === 'inventory') {
      refreshInterval.current = setInterval(() => {
        debouncedApplyFilters(filter);
      }, 30000); // Refresh every 30 seconds
    }

    // Apply filters for the new tab
    debouncedApplyFilters(filter);

    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
      debouncedApplyFilters.cancel();
    };
  }, [activeTab, filter, debouncedApplyFilters]);

  // Prepare transaction chart data
  const prepareTransactionChartData = (data: any[]) => {
    if (!data.length) {
      setChartData(null);
      return;
    }
    
    // Group by date
    const groupedByDate = data.reduce((acc, transaction) => {
      const date = new Date(transaction.date).toLocaleDateString();
      
      if (!acc[date]) {
        acc[date] = { date, stockIn: 0, stockOut: 0 };
      }
      
      if (transaction.type === 'stock-in') {
        acc[date].stockIn += transaction.quantity;
      } else if (transaction.type === 'stock-out') {
        acc[date].stockOut += transaction.quantity;
      }
      
      return acc;
    }, {});
    
    // Convert to array and sort by date
    const sortedData = Object.values(groupedByDate).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    setChartData({
      labels: sortedData.map((item: any) => item.date),
      datasets: [
        {
          label: 'Stock In',
          data: sortedData.map((item: any) => item.stockIn),
          backgroundColor: 'rgba(16, 185, 129, 0.5)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 1
        },
        {
          label: 'Stock Out',
          data: sortedData.map((item: any) => item.stockOut),
          backgroundColor: 'rgba(239, 68, 68, 0.5)',
          borderColor: 'rgb(239, 68, 68)',
          borderWidth: 1
        }
      ]
    });
  };

  // Prepare inventory chart data
  const prepareInventoryChartData = (data: any[]) => {
    if (!data.length) {
      setChartData(null);
      return;
    }
    
    // Process data in a single pass for better performance
    const processedData = data.reduce((acc: any, item) => {
      const category = item.category || 'Uncategorized';
      
      // Update category distribution
      if (!acc.categories[category]) {
        acc.categories[category] = {
          quantity: 0,
          value: 0,
          stockIn: 0,
          stockOut: 0,
          lowStockItems: 0  // Add counter for low stock items
        };
      }
      
      // Calculate total value for the item
      const itemValue = (item.quantity || 0) * (item.unitPrice || 0);
      
      acc.categories[category].quantity += item.quantity || 0;
      acc.categories[category].value += itemValue;
      acc.categories[category].stockIn += item.stockIn || 0;
      acc.categories[category].stockOut += item.stockOut || 0;
      
      // Count items below reorder point
      if ((item.quantity || 0) <= (item.reorderPoint || 0)) {
        acc.categories[category].lowStockItems += 1;
      }
      
      // Update top items
      acc.topItems.push({
        name: item.name,
        quantity: item.quantity || 0,
        reorderPoint: item.reorderPoint || 0,
        value: itemValue
      });
      
      return acc;
    }, {
      categories: {},
      topItems: []
    });
    
    // Sort and limit top items
    const sortedTopItems = processedData.topItems
      .sort((a: { quantity: number }, b: { quantity: number }) => b.quantity - a.quantity)
      .slice(0, 10);
    
    // Prepare category data
    const categoryLabels = Object.keys(processedData.categories);
    const categoryData = categoryLabels.map((cat: string) => processedData.categories[cat].quantity);
    const valueData = categoryLabels.map((cat: string) => processedData.categories[cat].value);
    const movementData = categoryLabels.map((cat: string) => ({
      stockIn: processedData.categories[cat].stockIn,
      stockOut: processedData.categories[cat].stockOut
    }));

    // Generate colors efficiently
    const generateColors = (count: number) => {
      const colors = [];
      const step = 360 / count;
      for (let i = 0; i < count; i++) {
        const hue = i * step;
        colors.push(`hsla(${hue}, 70%, 60%, 0.7)`);
      }
      return colors;
    };

    const categoryColors = generateColors(categoryLabels.length);
    
    setChartData({
      barData: {
        labels: sortedTopItems.map((item: { name: string }) => item.name),
        datasets: [
          {
            label: 'Current Quantity',
            data: sortedTopItems.map((item: { quantity: number }) => item.quantity),
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 1
          },
          {
            label: 'Reorder Point',
            data: sortedTopItems.map((item: { reorderPoint: number }) => item.reorderPoint),
            backgroundColor: 'rgba(245, 158, 11, 0.5)',
            borderColor: 'rgb(245, 158, 11)',
            borderWidth: 1
          }
        ]
      },
      pieData: {
        labels: categoryLabels,
        datasets: [{
          data: categoryData,
          backgroundColor: categoryColors,
          borderColor: categoryColors.map(color => color.replace('0.7', '1')),
          borderWidth: 1
        }]
      },
      valueData: {
        labels: categoryLabels,
        datasets: [{
          label: 'Total Value (₹)',
          data: valueData,
          backgroundColor: 'rgba(16, 185, 129, 0.5)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 2,
          tension: 0.4,
          fill: false
        }]
      },
      movementData: {
        labels: categoryLabels,
        datasets: [
          {
            label: 'Stock In',
            data: movementData.map(item => item.stockIn),
            backgroundColor: 'rgba(16, 185, 129, 0.5)',
            borderColor: 'rgb(16, 185, 129)',
            borderWidth: 1
          },
          {
            label: 'Stock Out',
            data: movementData.map(item => item.stockOut),
            backgroundColor: 'rgba(239, 68, 68, 0.5)',
            borderColor: 'rgb(239, 68, 68)',
            borderWidth: 1
          }
        ]
      },
      lowStockData: {
        labels: categoryLabels,
        datasets: [{
          label: 'Items Below Reorder Point',
          data: categoryLabels.map(cat => processedData.categories[cat].lowStockItems),
          backgroundColor: categoryLabels.map(cat => 
            processedData.categories[cat].lowStockItems > 0 
              ? 'rgba(239, 68, 68, 0.7)' 
              : 'rgba(16, 185, 129, 0.7)'
          ),
          borderColor: categoryLabels.map(cat => 
            processedData.categories[cat].lowStockItems > 0 
              ? 'rgb(239, 68, 68)' 
              : 'rgb(16, 185, 129)'
          ),
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      recentChangesData: {
        labels: categoryLabels,
        datasets: [{
          label: 'Recent Stock Changes',
          data: categoryLabels.map(cat => processedData.categories[cat].quantity - processedData.categories[cat].stockIn - processedData.categories[cat].stockOut),
          backgroundColor: 'rgba(16, 185, 129, 0.5)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 1
        }]
      }
    });
  };

  // Export report to CSV
  const handleExport = () => {
    if (!reportData.length) return;
    
    exportToCsv(
      reportData, 
      `${activeTab}-report-${new Date().toISOString().split('T')[0]}`
    );
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'transactionType') {
      setTransactionType(value);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'startDate') {
      setStartDate(value);
    } else if (name === 'endDate') {
      setEndDate(value);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Reports & Analytics</h1>
        {reportData.length > 0 && (
          <button 
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Download size={16} className="mr-2" />
            Export CSV
          </button>
        )}
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'transactions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            Transaction History
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'inventory'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            Inventory Analysis
          </button>
        </nav>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar size={16} className="text-gray-400" />
              </div>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={startDate}
                onChange={handleDateChange}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar size={16} className="text-gray-400" />
              </div>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={endDate}
                onChange={handleDateChange}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
          
          {activeTab === 'transactions' && (
            <div>
              <label htmlFor="transactionType" className="block text-sm font-medium text-gray-700 mb-1">
                Transaction Type
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter size={16} className="text-gray-400" />
                </div>
                <select
                  id="transactionType"
                  name="transactionType"
                  value={transactionType}
                  onChange={handleFilterChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">All Types</option>
                  <option value="stock-in">Stock In</option>
                  <option value="stock-out">Stock Out</option>
                </select>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              const newFilter: ReportFilter = {};
              
              if (startDate) {
                newFilter.startDate = startDate;
              }
              
              if (endDate) {
                newFilter.endDate = endDate;
              }
              
              if (transactionType) {
                newFilter.type = transactionType as 'stock-in' | 'stock-out';
              }
              
              setFilter(newFilter);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Apply Filters
          </button>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}
      
      {/* Chart */}
      {!loading && chartData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activeTab === 'inventory' ? (
            <>
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900">
                    Top Items by Quantity
                  </h2>
                  {isRefreshing && (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                  )}
                </div>
                <div className="h-80">
                  {chartData.barData && (
                    <Bar 
                      data={chartData.barData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true
                          }
                        }
                      }}
                    />
                  )}
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900">
                    Inventory by Category
                  </h2>
                  {isRefreshing && (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                  )}
                </div>
                <div className="h-80">
                  {chartData.pieData && (
                    <Pie 
                      data={chartData.pieData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'right' as const,
                          }
                        }
                      }}
                    />
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900">
                    Low Stock Alert
                  </h2>
                  {isRefreshing && (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                  )}
                </div>
                <div className="h-80">
                  {chartData.lowStockData && (
                    <Bar 
                      data={chartData.lowStockData}
                      options={{
                        indexAxis: 'y' as const,
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          x: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: 'Number of Items'
                            }
                          }
                        },
                        plugins: {
                          tooltip: {
                            callbacks: {
                              label: function(context) {
                                const value = context.parsed.x;
                                return `${value} item${value !== 1 ? 's' : ''} below reorder point`;
                              }
                            }
                          },
                          legend: {
                            display: false
                          }
                        }
                      }}
                    />
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900">
                    Recent Stock Changes
                  </h2>
                  {isRefreshing && (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                  )}
                </div>
                <div className="h-80">
                  {chartData.recentChangesData && (
                    <Line 
                      data={chartData.recentChangesData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true
                          }
                        }
                      }}
                    />
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Transaction Volume
              </h2>
              <div className="h-80">
                {chartData.labels && chartData.datasets && (
                  <Bar 
                    data={{
                      labels: chartData.labels,
                      datasets: chartData.datasets
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true
                        }
                      }
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Data Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : reportData.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
            <FileText size={24} />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No data available</h3>
          <p className="text-gray-500">
            Try adjusting your filters to see more results
          </p>
        </div>
      ) : (
        activeTab === 'transactions' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.map((transaction: any) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.date ? new Date(transaction.date).toLocaleString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {transaction.itemName || 'Deleted Item'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {transaction.itemCategory || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`
                          px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${transaction.type === 'stock-in' 
                            ? 'bg-green-100 text-green-800' 
                            : transaction.type === 'stock-out'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                          }
                        `}>
                          {transaction.type === 'stock-in' ? 'Stock In' : transaction.type === 'stock-out' ? 'Stock Out' : 'Adjustment'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {typeof transaction.quantity === 'number' ? transaction.quantity : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {typeof transaction.totalValue === 'number' ? `₹${transaction.totalValue.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.notes ? (
                          <span className="inline-block max-w-xs truncate" title={transaction.notes}>
                            {transaction.notes}
                          </span>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default Reports;