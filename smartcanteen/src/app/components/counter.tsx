"use client";
import React, { useState, useEffect } from 'react';
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

const AIO_USERNAME = process.env.NEXT_PUBLIC_AIO_USERNAME || 'your_username';
const AIO_KEY = process.env.NEXT_PUBLIC_AIO_KEY || 'your_aio_key';
const FEED_NAME = 'counter';

const CounterMonitor = () => {
  const [counter, setCounter] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState<{value: number, timestamp: string}[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    // Function to fetch the latest counter value
    const fetchData = async () => {
      try {
        const response = await fetch(`https://io.adafruit.com/api/v2/${AIO_USERNAME}/feeds/${FEED_NAME}/data/last`, {
          headers: {
            'X-AIO-Key': AIO_KEY,
          },
        });

        const data = await response.json();

        if (data && data.value) {
          const newValue = Number(data.value);
          setCounter(newValue);
          
          // Update history
          setHistory(prev => {
            const newHistory = [...prev, {
              value: newValue,
              timestamp: new Date().toLocaleTimeString()
            }];
            // Keep only the last 20 readings
            return newHistory.slice(-20);
          });
          
          setLastUpdated(new Date().toLocaleTimeString());
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data from Adafruit IO:', error);
        setIsLoading(false);
      }
    };

    // Fetch data on mount
    fetchData();

    // Set an interval to fetch data every 5 seconds
    const intervalId = setInterval(() => {
      fetchData();
    }, 5000);

    // Cleanup interval on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // Prepare chart data
  const chartData = {
    labels: history.map(item => item.timestamp),
    datasets: [
      {
        label: 'Counter Value',
        data: history.map(item => item.value),
        borderColor: 'rgba(99, 102, 241, 1)',
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 2
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#E5E7EB'
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#9CA3AF'
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#9CA3AF'
        }
      }
    },
    maintainAspectRatio: false
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-indigo-400 mb-2">Counter Monitoring Dashboard</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Current Value Card */}
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg lg:col-span-1">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-indigo-300">Current Value</h2>
                <span className="px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-300">
                  Live
                </span>
              </div>
              <div className="text-center my-6">
                <div className="text-5xl md:text-6xl font-bold text-indigo-400">{counter}</div>
                <p className="text-gray-400 mt-2">Counts</p>
              </div>
              <div className="text-sm text-gray-400 text-center">
                Last updated: {lastUpdated}
              </div>
            </div>

            {/* History Graph */}
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg lg:col-span-2">
              <h2 className="text-xl font-semibold text-indigo-300 mb-4">Counter History</h2>
              <div className="h-64">
                <Line data={chartData} options={chartOptions} />
              </div>
              <div className="mt-4 text-sm text-gray-400">
                Showing last {history.length} readings
              </div>
            </div>

            {/* Stats Cards */}
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-indigo-300 mb-4">Statistics</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400">Min Value</p>
                  <p className="text-2xl font-bold">
                    {history.length > 0 ? Math.min(...history.map(h => h.value)) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Max Value</p>
                  <p className="text-2xl font-bold">
                    {history.length > 0 ? Math.max(...history.map(h => h.value)) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Change (Last 5)</p>
                  <p className="text-2xl font-bold">
                    {history.length > 1 ? 
                      (history[history.length - 1].value - history[Math.max(0, history.length - 6)].value) : 
                      '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Readings */}
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg lg:col-span-1">
              <h2 className="text-xl font-semibold text-indigo-300 mb-4">Recent Readings</h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {history.length > 0 ? (
                  [...history].reverse().map((item, index) => (
                    <div key={index} className="flex justify-between py-2 border-b border-gray-700">
                      <span className="text-gray-400">{item.timestamp}</span>
                      <span className="font-medium">{item.value}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400">No data available</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CounterMonitor;