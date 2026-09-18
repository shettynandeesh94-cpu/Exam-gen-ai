import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import { Line, Bar, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Filler,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { BarChart3, TrendingUp, Award, Calendar, AlertTriangle } from 'lucide-react';
import analyticsService from '../services/analyticsService';

// Register Chart.js modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Filler,
  Title,
  Tooltip,
  Legend
);

const Analytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLightMode, setIsLightMode] = useState(document.documentElement.classList.contains('light'));

  useEffect(() => {
    const handleThemeChange = () => {
      setIsLightMode(document.documentElement.classList.contains('light'));
    };
    window.addEventListener('themechange', handleThemeChange);
    return () => window.removeEventListener('themechange', handleThemeChange);
  }, []);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const data = await analyticsService.getAnalytics();
        setAnalyticsData(data);
      } catch (err) {
        console.error("Failed to load analytics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading || !analyticsData) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const { stats, charts } = analyticsData;

  // Chart Global Options / Color Defaults
  const gridColor = isLightMode ? 'rgba(15, 23, 42, 0.06)' : 'rgba(255, 255, 255, 0.03)';
  const tickColor = isLightMode ? '#64748b' : '#9ca3af';
  const tooltipBg = isLightMode ? '#ffffff' : '#11121b';
  const tooltipText = isLightMode ? '#0f172a' : '#ffffff';
  const tooltipBorder = isLightMode ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.08)';

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipText,
        bodyColor: tickColor,
        borderColor: tooltipBorder,
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
      }
    },
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: { color: tickColor, font: { size: 10 } }
      },
      y: {
        grid: { color: gridColor },
        ticks: { color: tickColor, font: { size: 10 } },
        min: 0,
        max: 100
      }
    }
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipText,
        bodyColor: tickColor,
        borderColor: tooltipBorder,
        borderWidth: 1,
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: tickColor, font: { size: 10 } }
      },
      y: {
        grid: { color: gridColor },
        ticks: { color: tickColor, font: { size: 10 } },
        min: 0,
        max: 100
      }
    }
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipText,
        bodyColor: tickColor,
        borderColor: tooltipBorder,
        borderWidth: 1,
      }
    },
    scales: {
      r: {
        angleLines: { color: isLightMode ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.05)' },
        grid: { color: isLightMode ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.05)' },
        pointLabels: { color: tickColor, font: { size: 10, weight: 'semibold' } },
        ticks: { display: false },
        min: 0,
        max: 100
      }
    }
  };

  // 1. Progress Over Time configuration
  const progressLabels = charts.progressOverTime.map(item => item.date);
  const progressScores = charts.progressOverTime.map(item => item.score);
  const progressData = {
    labels: progressLabels,
    datasets: [
      {
        label: 'Attempt Score',
        data: progressScores,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.08)',
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#06b6d4',
        pointBorderColor: '#fff',
        pointBorderWidth: 1.5,
        pointHoverRadius: 6,
      }
    ]
  };

  // 2. Subject Performance configuration
  const subjectLabels = Object.keys(charts.subjectPerformance);
  const subjectScores = Object.values(charts.subjectPerformance);
  const subjectData = {
    labels: subjectLabels,
    datasets: [
      {
        data: subjectScores,
        backgroundColor: 'rgba(168, 85, 247, 0.85)',
        borderColor: '#a855f7',
        borderWidth: 1,
        borderRadius: 8,
        hoverBackgroundColor: 'rgba(6, 182, 212, 0.85)',
      }
    ]
  };

  // 3. Topic Performance configuration
  const topicLabels = Object.keys(charts.topicPerformance);
  const topicScores = Object.values(charts.topicPerformance);
  const topicData = {
    labels: topicLabels,
    datasets: [
      {
        label: 'Efficiency Level',
        data: topicScores,
        backgroundColor: 'rgba(6, 182, 212, 0.15)',
        borderColor: '#06b6d4',
        borderWidth: 2,
        pointBackgroundColor: '#6366f1',
      }
    ]
  };

  return (
    <div className="space-y-8 animate-fadeIn text-brand-textPrimary">
      <PageHeader 
        title="Performance Analytics" 
        subtitle="Review grading telemetry, average score patterns, and topic weaknesses." 
      >
        <button
          onClick={() => navigate('/dashboard')}
          className="py-2 px-4 rounded-xl border border-brand-border/40 text-xs font-semibold text-brand-textSecondary hover:text-brand-textPrimary hover:bg-brand-border/20 transition-all cursor-pointer animate-fadeIn"
        >
          Return to Dashboard
        </button>
      </PageHeader>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-panel rounded-2xl p-5 border border-brand-border/40 flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-brand-primary/10 text-brand-primary border border-brand-primary/20 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-brand-textSecondary uppercase font-bold tracking-wider">Tests Attempted</span>
            <p className="text-xl font-extrabold text-brand-textPrimary mt-0.5">{stats.testsAttempted}</p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-brand-border/40 flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-brand-accent/10 text-brand-accent border border-brand-accent/20 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-brand-textSecondary uppercase font-bold tracking-wider">Average Efficiency</span>
            <p className="text-xl font-extrabold text-brand-textPrimary mt-0.5">{stats.averageScore}%</p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-brand-border/40 flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-brand-warning/10 text-brand-warning border border-brand-warning/20 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-brand-textSecondary uppercase font-bold tracking-wider">Top Weak Topic</span>
            <p className="text-sm font-extrabold text-brand-textPrimary mt-0.5 truncate max-w-[180px]">
              {stats.weakTopics?.[0] || 'None'}
            </p>
          </div>
        </div>
      </div>

      {/* Split Charts (Progress & Subject) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Progress over time */}
        <div className="glass-panel rounded-2xl p-6 border border-brand-border/40 space-y-4">
          <div className="flex items-center space-x-2 border-b border-brand-border/10 pb-3">
            <TrendingUp className="w-4 h-4 text-brand-primary" />
            <h3 className="text-xs font-bold text-brand-textSecondary uppercase tracking-wider">Progress Over Time</h3>
          </div>
          <div className="h-64 relative">
            {progressLabels.length === 0 ? (
              <div className="flex items-center justify-center h-full text-brand-textSecondary text-xs">No attempt history available.</div>
            ) : (
              <Line data={progressData} options={lineOptions} />
            )}
          </div>
        </div>

        {/* Subject performance */}
        <div className="glass-panel rounded-2xl p-6 border border-brand-border/40 space-y-4">
          <div className="flex items-center space-x-2 border-b border-brand-border/10 pb-3">
            <BarChart3 className="w-4 h-4 text-brand-secondary" />
            <h3 className="text-xs font-bold text-brand-textSecondary uppercase tracking-wider">Subject Performance</h3>
          </div>
          <div className="h-64 relative">
            {subjectLabels.length === 0 ? (
              <div className="flex items-center justify-center h-full text-brand-textSecondary text-xs">No subjects graded yet.</div>
            ) : (
              <Bar data={subjectData} options={barOptions} />
            )}
          </div>
        </div>
      </div>

      {/* Radar Chart (Topic performance breakdown) */}
      <div className="glass-panel rounded-2xl p-6 border border-brand-border/40 space-y-4 max-w-2xl mx-auto">
        <div className="flex items-center space-x-2 border-b border-brand-border/10 pb-3">
          <BarChart3 className="w-4 h-4 text-brand-accent" />
          <h3 className="text-xs font-bold text-brand-textSecondary uppercase tracking-wider">Topic-wise Efficiency</h3>
        </div>
        <div className="h-72 relative">
          <Radar data={topicData} options={radarOptions} />
        </div>
      </div>
    </div>
  );
};

export default Analytics;
