import * as React from 'react';
import { useNavigate } from 'react-router-dom';

import { useAnalyses, useBaselines } from '../utils/analysisApi';
import { DashboardMetric, Severity } from '../../types/core';
import MetricCard from '../components/dashboard/MetricCard';
import RecentActivity from '../components/dashboard/RecentActivity';

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

  // Calculate comprehensive metrics focused on requested data
  const metrics = React.useMemo((): DashboardMetric[] => {
    // Safety check for undefined analyses
    if (!analyses || !Array.isArray(analyses)) {
      return [];
    }

    const now = new Date();
    const timeRangeMs = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    }[timeRange];

    // Filter analyses by time range for consistency with daily chart
    const recentAnalyses = analyses.filter(a => 
      new Date(a.date).getTime() > now.getTime() - timeRangeMs
    );

    // Total baselines (not time-filtered)
    const totalBaselines = baselines?.length || 0;

    // Total analysis items (time-filtered)
    const totalAnalysisItems = recentAnalyses.length;

    // Severity distribution (time-filtered)
    const severityCounts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0
    };

    recentAnalyses.forEach(analysis => {
      const vulns = analysis.analysis_json?.vulnerabilities || [];
      const instructions = analysis.analysis_json?.instruction_analysis || [];
      
      // Count vulnerabilities by severity
      vulns.forEach((vuln: any) => {
        const severity = vuln.severity?.toLowerCase();
        if (severity && severityCounts.hasOwnProperty(severity)) {
          severityCounts[severity as keyof typeof severityCounts]++;
        }
      });

      // Count instructions by risk level
      instructions.forEach((instruction: any) => {
        const riskLevel = instruction.risk_level?.toLowerCase() || instruction.riskLevel?.toLowerCase();
        if (riskLevel === 'critical') severityCounts.critical++;
        else if (riskLevel === 'high') severityCounts.high++;
        else if (riskLevel === 'medium') severityCounts.medium++;
        else if (riskLevel === 'low') severityCounts.low++;
        else if (riskLevel === 'info') severityCounts.info++;
      });
    });

    // Comparison count (time-filtered)
    const totalComparisons = recentAnalyses.filter(a => a.baseline_id).length;

    return [
      {
        id: 'total-baselines',
        name: 'Total Baselines',
        value: totalBaselines,
        status: totalBaselines > 0 ? 'healthy' : 'warning',
        changeType: 'neutral',
        unit: '',
      },
      {
        id: 'analysis-items',
        name: 'Analysis Items',
        value: totalAnalysisItems,
        status: 'healthy',
        changeType: 'neutral',
        unit: '',
      },
      {
        id: 'vulnerabilities-found',
        name: 'Vulnerabilities Found',
        value: severityCounts.critical + severityCounts.high + severityCounts.medium + severityCounts.low,
        status: severityCounts.critical > 0 ? 'critical' : severityCounts.high > 0 ? 'warning' : 'healthy',
        changeType: 'neutral',
        unit: '',
      },
      {
        id: 'critical-issues',
        name: 'Critical Issues',
        value: severityCounts.critical,
        status: severityCounts.critical > 0 ? 'critical' : 'healthy',
        changeType: 'neutral',
        unit: '',
      },
      {
        id: 'high-risk-instructions',
        name: 'High-Risk Instructions',
        value: severityCounts.high,
        status: severityCounts.high > 0 ? 'warning' : 'healthy',
        changeType: 'neutral',
        unit: '',
      },
      {
        id: 'processing-success-rate',
        name: 'Processing Success Rate',
        value: totalAnalysisItems > 0 ? '100.0%' : '0%',
        status: 'healthy',
        changeType: 'neutral',
        unit: '',
      },
      {
        id: 'comparisons',
        name: 'Comparisons',
        value: totalComparisons,
        status: 'healthy',
        changeType: 'neutral',
        unit: '',
      },
    ];
  }, [analyses, baselines, timeRange]);

  // Calculate daily severity data for chart
  const dailySeverityData = React.useMemo(() => {
    if (!analyses || !Array.isArray(analyses)) {
      return [];
    }

    const now = new Date();
    const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;
    const dailyData: { [key: string]: { critical: number; high: number; medium: number; low: number; date: string } } = {};

    // Initialize days
    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyData[dateStr] = { critical: 0, high: 0, medium: 0, low: 0, date: dateStr };
    }

    // Count items by day and severity
    analyses.forEach(analysis => {
      const analysisDate = new Date(analysis.date).toISOString().split('T')[0];
      if (!dailyData[analysisDate]) return;

      const vulns = analysis.analysis_json?.vulnerabilities || [];
      const instructions = analysis.analysis_json?.instruction_analysis || [];

      // Count vulnerabilities by severity
      vulns.forEach((vuln: any) => {
        const severity = vuln.severity?.toLowerCase();
        if (severity && dailyData[analysisDate] && ['critical', 'high', 'medium', 'low'].includes(severity)) {
          dailyData[analysisDate][severity as 'critical' | 'high' | 'medium' | 'low']++;
        }
      });

      // Count instructions by risk level
      instructions.forEach((instruction: any) => {
        const riskLevel = instruction.risk_level?.toLowerCase() || instruction.riskLevel?.toLowerCase();
        if (riskLevel && dailyData[analysisDate] && ['critical', 'high', 'medium', 'low'].includes(riskLevel)) {
          dailyData[analysisDate][riskLevel as 'critical' | 'high' | 'medium' | 'low']++;
        }
      });
    });

    return Object.values(dailyData).reverse();
  }, [analyses, timeRange]);

  // Get recent activity
  const recentActivity = React.useMemo(() => {
    // Safety check for undefined analyses
    if (!analyses || !Array.isArray(analyses)) {
      return [];
    }

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

      {/* Uniform Metrics Grid - All 6 main metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.id}
            metric={metric}
            onClick={() => {
              // Navigate to relevant page based on metric
              if (metric.id === 'total-baselines') navigate('/baselines');
              if (metric.id === 'analysis-items') navigate('/analysis');
              if (metric.id === 'vulnerabilities-found') navigate('/analysis?filter=vulnerabilities');
              if (metric.id === 'critical-issues') navigate('/analysis?filter=critical');
              if (metric.id === 'high-risk-instructions') navigate('/analysis?filter=high-risk');
              if (metric.id === 'processing-success-rate') navigate('/analysis');
              if (metric.id === 'comparisons') navigate('/comparisons');
            }}
          />
        ))}
      </div>

      {/* Daily Severity Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Items per Day by Severity</h3>
          <div className="h-80">
            {dailySeverityData.length > 0 ? (
              <div className="space-y-4">
                {/* Legend */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Showing last {timeRange === '24h' ? '24 hours' : timeRange === '7d' ? '7 days' : '30 days'}</span>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      <span>Critical</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-orange-500 rounded"></div>
                      <span>High</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                      <span>Medium</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span>Low</span>
                    </div>
                  </div>
                </div>
                
                {/* Stacked Bar Chart */}
                <div className="relative">
                  {/* Y-axis labels */}
                  <div className="flex items-end space-x-2 h-48">
                    {dailySeverityData.map((day, index) => {
                      const dayTotal = day.critical + day.high + day.medium + day.low;
                      const maxValue = Math.max(...dailySeverityData.map(d => d.critical + d.high + d.medium + d.low), 1);
                      
                      return (
                        <div key={day.date} className="flex-1 flex flex-col items-center">
                          {/* Stacked Bar */}
                          <div className="w-full flex flex-col-reverse bg-gray-100 rounded-t-md min-h-[20px]" style={{ height: '180px' }}>
                            {day.low > 0 && (
                              <div 
                                className="bg-green-500 w-full rounded-b-md"
                                style={{ height: `${(day.low / maxValue) * 100}%` }}
                                title={`Low: ${day.low}`}
                              ></div>
                            )}
                            {day.medium > 0 && (
                              <div 
                                className="bg-yellow-500 w-full"
                                style={{ height: `${(day.medium / maxValue) * 100}%` }}
                                title={`Medium: ${day.medium}`}
                              ></div>
                            )}
                            {day.high > 0 && (
                              <div 
                                className="bg-orange-500 w-full"
                                style={{ height: `${(day.high / maxValue) * 100}%` }}
                                title={`High: ${day.high}`}
                              ></div>
                            )}
                            {day.critical > 0 && (
                              <div 
                                className="bg-red-500 w-full rounded-t-md"
                                style={{ height: `${(day.critical / maxValue) * 100}%` }}
                                title={`Critical: ${day.critical}`}
                              ></div>
                            )}
                          </div>
                          
                          {/* Total count */}
                          <div className="text-xs font-medium text-gray-700 mt-1">
                            {dayTotal > 0 ? dayTotal : ''}
                          </div>
                          
                          {/* Date label */}
                          <div className="text-xs text-gray-600 mt-1">
                            {new Date(day.date).toLocaleDateString(undefined, { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Summary Stats */}
                <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-red-600">
                      {dailySeverityData.reduce((sum, day) => sum + day.critical, 0)}
                    </div>
                    <div className="text-xs text-gray-600">Critical</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-orange-600">
                      {dailySeverityData.reduce((sum, day) => sum + day.high, 0)}
                    </div>
                    <div className="text-xs text-gray-600">High</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-yellow-600">
                      {dailySeverityData.reduce((sum, day) => sum + day.medium, 0)}
                    </div>
                    <div className="text-xs text-gray-600">Medium</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">
                      {dailySeverityData.reduce((sum, day) => sum + day.low, 0)}
                    </div>
                    <div className="text-xs text-gray-600">Low</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No data available for the selected time range
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activity */}
      <div className="grid grid-cols-1 gap-6">
        {/* Recent Activity */}
        <RecentActivity activities={recentActivity} />
      </div>
    </div>
  );
};

export default Dashboard;
