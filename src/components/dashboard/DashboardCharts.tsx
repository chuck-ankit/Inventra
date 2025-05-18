import { useDashboardStore } from '../../stores/dashboardStore';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const DashboardCharts = () => {
  const { transactionHistory, loading } = useDashboardStore();

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!transactionHistory || !transactionHistory.labels || !transactionHistory.stockIn || !transactionHistory.stockOut) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center justify-center h-[400px]">
        <p className="text-gray-500">No transaction data available</p>
      </div>
    );
  }

  // Format dates for better readability
  const formattedLabels = transactionHistory.labels.map(date => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  console.log('Chart data:', {
    labels: formattedLabels,
    stockIn: transactionHistory.stockIn,
    stockOut: transactionHistory.stockOut
  });

  const chartData = {
    labels: formattedLabels,
    datasets: [
      {
        label: 'Stock In',
        data: transactionHistory.stockIn,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(34, 197, 94)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      },
      {
        label: 'Stock Out',
        data: transactionHistory.stockOut,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(239, 68, 68)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: 'normal' as const
          }
        }
      },
      title: {
        display: true,
        text: 'Transaction Volume',
        font: {
          size: 16,
          weight: 'bold' as const
        },
        padding: {
          top: 10,
          bottom: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1f2937',
        bodyColor: '#1f2937',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y} units`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Quantity',
          font: {
            size: 12,
            weight: 'normal' as const
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            size: 11
          }
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date',
          font: {
            size: 12,
            weight: 'normal' as const
          }
        },
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8,
          font: {
            size: 11
          }
        }
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="h-[400px]">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default DashboardCharts; 