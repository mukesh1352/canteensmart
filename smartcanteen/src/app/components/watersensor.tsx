"use client";
import { useState, useEffect, useRef } from 'react';
import anime from 'animejs/lib/anime.es.js';
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, BarController, BarElement, ArcElement, DoughnutController } from 'chart.js';

// Register Chart.js components
Chart.register(
  LineController, LineElement, PointElement, 
  LinearScale, CategoryScale, 
  BarController, BarElement,
  DoughnutController, ArcElement
);

const SensorData = () => {
  interface SensorDataType {
    field1: string;
    created_at: string;
  }

  // Define a type for the fetched sensor data
  interface FetchDataResponse {
    feeds: Array<{
      field1: string;
      created_at: string;
    }>;
  }

  const [sensorData, setSensorData] = useState<SensorDataType | null>(null);
  const [history, setHistory] = useState<{ value: number, time: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [graphType, setGraphType] = useState<'line' | 'bar' | 'gauge'>('line');
  const valueRef = useRef<HTMLDivElement>(null);
  const lineChartRef = useRef<HTMLCanvasElement>(null);
  const barChartRef = useRef<HTMLCanvasElement>(null);
  const gaugeRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    const channelID = '2896085';
    const apiKey = '0FALZCHXD350JZLE';
    const field = 1;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `https://api.thingspeak.com/channels/${channelID}/fields/${field}.json?api_key=${apiKey}&results=20`
        );
        const data: FetchDataResponse = await response.json();
        
        if (data?.feeds?.length > 0) {
          const newHistory = data.feeds
            .map((feed) => ({
              value: parseFloat(feed.field1),
              time: new Date(feed.created_at).toLocaleTimeString()
            }))
            .filter((item) => !isNaN(item.value))
            .reverse();

          const latestData = data.feeds[data.feeds.length - 1];

          setSensorData(latestData);
          setHistory(newHistory);
          
          if (valueRef.current) {
            anime({
              targets: valueRef.current,
              scale: [1.2, 1],
              duration: 800,
              easing: 'easeOutElastic'
            });
          }

          updateCharts(newHistory);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const updateCharts = (data: { value: number, time: string }[]) => {
      const values = data.map(item => item.value);
      const labels = data.map(item => item.time);
      const currentValue = values[values.length - 1] || 0;
      const maxValue = Math.max(...values, currentValue * 1.5);

      // Destroy previous chart instance
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      // Line or Bar Chart
      if (graphType === 'line' || graphType === 'bar') {
        const ctx = graphType === 'line' 
          ? lineChartRef.current?.getContext('2d')
          : barChartRef.current?.getContext('2d');

        if (ctx) {
          chartInstance.current = new Chart(ctx, {
            type: graphType,
            data: {
              labels: labels,
              datasets: [{
                label: 'Sensor Values',
                data: values,
                backgroundColor: graphType === 'bar' 
                  ? 'rgba(54, 162, 235, 0.5)' 
                  : 'rgba(54, 162, 235, 0.1)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2,
                tension: 0.1,
                fill: graphType === 'line'
              }]
            },
            options: {
              responsive: true,
              plugins: {
                tooltip: {
                  mode: 'index',
                  intersect: false
                },
                legend: {
                  display: false
                }
              },
              scales: {
                y: {
                  beginAtZero: false
                }
              },
              animation: {
                duration: 1000
              }
            }
          });
        }
      }

      // Gauge Chart (using Doughnut chart)
      if (graphType === 'gauge' && gaugeRef.current) {
        const ctx = gaugeRef.current.getContext('2d');
        if (ctx) {
          chartInstance.current = new Chart(ctx, {
            type: 'doughnut',
            data: {
              labels: ['Used', 'Remaining'],
              datasets: [{
                data: [currentValue, maxValue - currentValue],
                backgroundColor: [
                  getGaugeColor(currentValue/maxValue),
                  '#e5e7eb'
                ],
                borderWidth: 0
              }]
            },
            options: {
              circumference: 180,
              rotation: 270,
              cutout: '80%',
              plugins: {
                legend: {
                  display: false
                },
                tooltip: {
                  enabled: false
                }
              },
              animation: {
                animateScale: true,
                animateRotate: true
              }
            }
          });

          // Add center text
          const centerText = `${currentValue.toFixed(2)}`;
          const centerText2 = `Max: ${maxValue.toFixed(2)}`;
          
          const text1 = document.createElement('div');
          text1.className = 'absolute top-1/2 left-0 right-0 text-center -translate-y-6';
          text1.style.fontSize = '2rem';
          text1.style.fontWeight = 'bold';
          text1.textContent = centerText;
          
          const text2 = document.createElement('div');
          text2.className = 'absolute top-1/2 left-0 right-0 text-center translate-y-4';
          text2.style.fontSize = '0.8rem';
          text2.textContent = centerText2;
          
          // Clear previous text
          const container = gaugeRef.current.parentElement;
          if (container) {
            const oldTexts = container.querySelectorAll('.gauge-text');
            oldTexts.forEach(el => el.remove());
            
            text1.classList.add('gauge-text');
            text2.classList.add('gauge-text');
            container.appendChild(text1);
            container.appendChild(text2);
          }
        }
      }
    };

    const getGaugeColor = (percentage: number) => {
      if (percentage > 0.8) return '#ef4444'; // red
      if (percentage > 0.6) return '#f59e0b'; // amber
      if (percentage > 0.4) return '#3b82f6'; // blue
      return '#10b981'; // emerald
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);

    return () => {
      clearInterval(interval);
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [graphType]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Water Sensor Monitoring</h1>
        </div>

        {/* Graph Type Selector */}
        <div className="flex justify-center mb-6">
          <div className="tabs tabs-boxed bg-base-100">
            <button 
              className={`tab ${graphType === 'line' ? 'tab-active' : ''}`}
              onClick={() => setGraphType('line')}
            >
              Line Chart
            </button> 
            <button 
              className={`tab ${graphType === 'bar' ? 'tab-active' : ''}`}
              onClick={() => setGraphType('bar')}
            >
              Bar Chart
            </button> 
            <button 
              className={`tab ${graphType === 'gauge' ? 'tab-active' : ''}`}
              onClick={() => setGraphType('gauge')}
            >
              Gauge
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Value Card */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-secondary">Current Sensor Value</h2>
              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <span className="loading loading-spinner loading-lg text-primary"></span>
                </div>
              ) : sensorData ? (
                <>
                  <div 
                    ref={valueRef}
                    className="text-6xl font-bold text-center my-6 text-primary"
                  >
                    {parseFloat(sensorData.field1).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500 text-center">
                    Last updated: {new Date(sensorData.created_at).toLocaleString()}
                  </div>
                </>
              ) : (
                <div className="alert alert-warning">
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>No data available</span>
                </div>
              )}
            </div>
          </div>

          {/* Graph Visualization Card */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-secondary">
                {graphType === 'line' && 'Trend Line'}
                {graphType === 'bar' && 'Historical Bars'}
                {graphType === 'gauge' && 'Current Value Gauge'}
              </h2>
              <div className="h-64 w-full relative">
                {graphType === 'line' && <canvas ref={lineChartRef} />}
                {graphType === 'bar' && <canvas ref={barChartRef} />}
                {graphType === 'gauge' && <canvas ref={gaugeRef} />}
              </div>
            </div>
          </div>
        </div>

        {/* Stats and Additional Info */}
        {history.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="stats bg-primary text-primary-content">
              <div className="stat">
                <div className="stat-title">Current Value</div>
                <div className="stat-value">
                  {sensorData ? parseFloat(sensorData.field1).toFixed(2) : '--'}
                </div>
                <div className="stat-desc">Latest reading</div>
              </div>
            </div>
            
            <div className="stats bg-secondary text-secondary-content">
              <div className="stat">
                <div className="stat-title">Average</div>
                <div className="stat-value">
                  {(history.reduce((sum, item) => sum + item.value, 0) / history.length).toFixed(2)}
                </div>
                <div className="stat-desc">Last {history.length} readings</div>
              </div>
            </div>
            
            <div className="stats bg-accent text-accent-content">
              <div className="stat">
                <div className="stat-title">Range</div>
                <div className="stat-value">
                  {(Math.max(...history.map(h => h.value)) - Math.min(...history.map(h => h.value))).toFixed(2)}
                </div>
                <div className="stat-desc">Max - Min</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SensorData;
