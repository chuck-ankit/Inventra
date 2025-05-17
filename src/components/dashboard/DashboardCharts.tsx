import { useState, useEffect } from 'react';
import { useReportStore } from '../../stores/reportStore';
import { useInventoryStore } from '../../stores/inventoryStore';
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
  const { fetchTransactions, transactions, loading } = useReportStore();
  const { items } = useInventoryStore();
  const [transactionData, setTransactionData] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      await fetchTransactions();
    };
    loadData();
  }, [fetchTransactions]);

  useEffect(() => {
    if (transactions.length > 0) {
      // Process transaction data for the line chart
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      const stockInData = new Array(30).fill(0);
      const stockOutData = new Array(30).fill(0);

      transactions.forEach(transaction => {
        const date = new Date(transaction.date).toISOString().split('T')[0];
        const index = last30Days.indexOf(date);
        if (index !== -1) {
          if (transaction.type === 'stock-in') {
            stockInData[index] += transaction.quantity;
          } else if (transaction.type === 'stock-out') {
            stockOutData[index] += transaction.quantity;
          }
        }
      });

      setTransactionData({
        labels: last30Days.map(date => {
          const d = new Date(date);
          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }),
        datasets: [
          {
            label: 'Stock In',
            data: stockInData,
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: 'rgb(34, 197, 94)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
          },
          {
            label: 'Stock Out',
            data: stockOutData,
            borderColor: 'rgb(239, 68, 68)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: 'rgb(239, 68, 68)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
          },
        ],
      });
    }
  }, [transactions]);

  if (loading || !transactionData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Line 
      data={transactionData}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: false,
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
              label: function(context) {
                return `${context.dataset.label}: ${context.parsed.y} units`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 8,
              font: {
                size: 11
              }
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
            },
            ticks: {
              font: {
                size: 11
              }
            }
          }
        }
      }}
    />
  );
};

export default DashboardCharts; 