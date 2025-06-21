import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowTrendingUpIcon, 
  ShieldCheckIcon, 
  ExclamationTriangleIcon,
  ChartBarIcon,
  ClockIcon,
  CpuChipIcon,
  DocumentCheckIcon,
  BugAntIcon
} from '@heroicons/react/24/outline';
import { useAnalyses, useBaselines } from '../utils/analysisApi';
import { DashboardMetric, Severity } from '../../types/core';
import MetricCard from '../components/dashboard/MetricCard';
import TrendChart from '../components/dashboard/TrendChart';
import SecurityOverview from '../components/dashboard/SecurityOverview';
import RecentActivity from '../components/dashboard/RecentActivity';
import SystemHealth from '../components/dashboard/SystemHealth';
import QuickActions from '../components/dashboard/QuickActions';
import AlertsPanel from '../components/dashboard/AlertsPanel';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { analyses, loading: loadingAnalyses, error: errorAnalyses } = useAnalyses();
  const { baselines, loading: loadingBaselines, error: errorBaselines } = useBaselines();
  
  const [timeRange, setTimeRange] = React.useState<'24h' | '7d' | '30d'>('7d');
  const [refreshInterval, setRefreshInterval] = React.useState<number>(30000); // 30 seconds
  const [lastRefresh, setLastRefresh] = React.useState<Date>(new Date());

  // Auto-refresh data
  React.useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(new Date());
      // Trigger data refresh here if needed
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  // Calculate comprehensive metrics
  const metrics = React.useMemo((): DashboardMetric[] => {
    const now = new Date();
    const timeRangeMs = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    }[timeRange];

    const recentAnalyses = analyses.filter(a => 
      new Date(a.date).getTime() > now.getTime() - timeRangeMs
    );

    // Total analyses metric
    const totalAnalyses = analyses.length;
    const previousPeriodAnalyses = analyses.filter(a =>
      new Date(a.date).getTime() < now.getTime() - timeRangeMs &&
      new Date(a.date).getTime() > now.getTime() - (timeRangeMs * 2)
    ).length;

    // Vulnerabilities - handle both old and new formats
    const totalVulnerabilities = analyses.reduce((sum, a) => {
      const vulns = a.analysis_json?.vulnerabilities || [];
      return sum + vulns.length;
    }, 0);

    const criticalVulns = analyses.reduce((sum, a) => {
      const vulns = a.analysis_json?.vulnerabilities || [];
      return sum + vulns.filter((v: any) => v.severity === 'critical').length;
    }, 0);

    // High-risk instructions - handle both old and new formats
    const highRiskInstructions = analyses.reduce((sum, a) => {
      const instructions = a.analysis_json?.instruction_analysis || [];
      return sum + instructions.filter((i: any) => 
        i.risk_level === 'high' || i.risk_level === 'critical' || 
        i.riskLevel === 'high' || i.riskLevel === 'critical'
      ).length;
    }, 0);

    // Processing success rate
    const completedAnalyses = analyses.filter(a => a.status === 'completed' || a.status === 'complete').length;
    const successRate = totalAnalyses > 0 ? (completedAnalyses / totalAnalyses) * 100 : 0;

    // Average processing time (mock data for now)
    const avgProcessingTime = 45; // seconds

    return [
      {
        id: 'total-analyses',
        name: 'Total Analyses',
        value: totalAnalyses,
        previousValue: previousPeriodAnalyses,
        change: totalAnalyses - previousPeriodAnalyses,
        changeType: totalAnalyses >= previousPeriodAnalyses ? 'increase' : 'decrease',
        status: 'healthy',
        unit: '',
      },
      {
        id: 'vulnerabilities',
        name: 'Vulnerabilities Found',
        value: totalVulnerabilities,
        status: criticalVulns > 0 ? 'critical' : totalVulnerabilities > 10 ? 'warning' : 'healthy',
        changeType: 'neutral',
        unit: '',
      },
      {
        id: 'critical-vulns',
        name: 'Critical Vulnerabilities',
        value: criticalVulns,
        status: criticalVulns > 0 ? 'critical' : 'healthy',
        changeType: 'neutral',
        unit: '',
      },
      {
        id: 'high-risk-instructions',
        name: 'High-Risk Instructions',
        value: highRiskInstructions,
        status: highRiskInstructions > 5 ? 'warning' : 'healthy',
        changeType: 'neutral',
        unit: '',
      },
      {
        id: 'success-rate',
        name: 'Processing Success Rate',
        value: `${successRate.toFixed(1)}%`,
        status: successRate >= 95 ? 'healthy' : successRate >= 85 ? 'warning' : 'critical',
        changeType: 'neutral',
        unit: '',
      },
      {
        id: 'avg-processing-time',
        name: 'Avg Processing Time',
        value: avgProcessingTime,
        status: avgProcessingTime <= 60 ? 'healthy' : avgProcessingTime <= 120 ? 'warning' : 'critical',
        changeType: 'neutral',
        unit: 's',
      },
      {
        id: 'baselines',
        name: 'Active Baselines',
        value: baselines.length,
        status: 'healthy',
        changeType: 'neutral',
        unit: '',
      },
    ];
  }, [analyses, baselines, timeRange]);

  // Get recent activity
  const recentActivity = React.useMemo(() => {
    return [...analyses]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)
      .map(analysis => ({
        id: analysis.id,
        type: 'analysis' as const,
        title: `Analysis completed: ${analysis.fileName}`,
        description: `Processed with ${analysis.provider} ${analysis.model}`,
        timestamp: analysis.date,
        severity: getAnalysisSeverity(analysis),
        status: analysis.status,
      }));
  }, [analyses]);

  // Helper function to determine analysis severity
  function getAnalysisSeverity(analysis: any): Severity {
    const vulns = analysis.analysis_json?.vulnerabilities || [];
    const instructions = analysis.analysis_json?.instruction_analysis || [];
    
    if (vulns.some((v: any) => v.severity === 'critical') || 
        instructions.some((i: any) => i.risk_level === 'critical' || i.riskLevel === 'critical')) {
      return 'critical';
    }
    if (vulns.some((v: any) => v.severity === 'high') || 
        instructions.some((i: any) => i.risk_level === 'high' || i.riskLevel === 'high')) {
      return 'high';
    }
    if (vulns.some((v: any) => v.severity === 'medium') || 
        instructions.some((i: any) => i.risk_level === 'medium' || i.riskLevel === 'medium')) {
      return 'medium';
    }
    return 'low';
  }

  // Get severity distribution for security overview
  const severityDistribution = React.useMemo(() => {
    const distribution = { critical: 0, high: 0, medium: 0, low: 0 };
    
    analyses.forEach(analysis => {
      const severity = getAnalysisSeverity(analysis);
      distribution[severity]++;
    });

    return distribution;
  }, [analyses]);

  if (loadingAnalyses || loadingBaselines) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Security Dashboard</h1>
          <p className="text-gray-600">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '24h' | '7d' | '30d')}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          
          <button
            onClick={() => setLastRefresh(new Date())}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* System Health Banner */}
      <SystemHealth />

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.slice(0, 4).map((metric) => (
          <MetricCard
            key={metric.id}
            metric={metric}
            onClick={() => {
              // Navigate to relevant page based on metric
              if (metric.id === 'total-analyses') navigate('/analysis');
              if (metric.id === 'vulnerabilities') navigate('/analysis?filter=vulnerabilities');
              if (metric.id === 'baselines') navigate('/baselines');
            }}
          />
        ))}
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {metrics.slice(4).map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Security Overview */}
        <div className="lg:col-span-2">
          <SecurityOverview 
            distribution={severityDistribution}
            timeRange={timeRange}
          />
        </div>

        {/* Quick Actions */}
        <div>
          <QuickActions />
        </div>
      </div>

      {/* Activity and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <RecentActivity activities={recentActivity} />
        
        {/* Alerts Panel */}
        <AlertsPanel />
      </div>

      {/* Trend Analysis */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Analysis Trends
          </h3>
          <TrendChart 
            data={analyses}
            timeRange={timeRange}
            height={300}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
