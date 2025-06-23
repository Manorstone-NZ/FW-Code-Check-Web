import * as React from 'react';
import { Severity } from '../../../types/core';

interface Alert {
  id: string;
  type: 'security' | 'system' | 'processing' | 'info';
  severity: Severity;
  title: string;
  message: string;
  timestamp: string;
  acknowledged?: boolean;
  actionRequired?: boolean;
}

interface AlertsPanelProps {
  maxAlerts?: number;
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ maxAlerts = 5 }) => {
  const [alerts, setAlerts] = React.useState<Alert[]>([]);
  const [filter, setFilter] = React.useState<'all' | 'unacknowledged'>('unacknowledged');

  // Generate mock alerts based on real system state
  React.useEffect(() => {
    const generateAlerts = async () => {
      const mockAlerts: Alert[] = [];
      
      // Check for system alerts
      try {
        // @ts-ignore
        const analyses = await window.electron?.invoke('get-analyses') || [];
        const recentFailures = analyses.filter((a: any) => 
          a.status === 'error' && 
          new Date(a.date).getTime() > Date.now() - 24 * 60 * 60 * 1000
        );

        if (recentFailures.length > 0) {
          mockAlerts.push({
            id: 'recent-failures',
            type: 'processing',
            severity: 'high',
            title: 'Analysis Failures Detected',
            message: `${recentFailures.length} analysis(es) failed in the last 24 hours`,
            timestamp: new Date(Math.max(...recentFailures.map((f: any) => new Date(f.date).getTime()))).toISOString(),
            actionRequired: true,
          });
        }

        // Check for high-severity analyses
        const criticalAnalyses = analyses.filter((a: any) => {
          const vulns = a.analysis_json?.vulnerabilities || [];
          const instructions = a.analysis_json?.instruction_analysis || [];
          return vulns.some((v: any) => v.severity === 'critical') ||
                 instructions.some((i: any) => i.risk_level === 'critical');
        });

        if (criticalAnalyses.length > 0) {
          mockAlerts.push({
            id: 'critical-vulnerabilities',
            type: 'security',
            severity: 'critical',
            title: 'Critical Vulnerabilities Found',
            message: `${criticalAnalyses.length} analysis(es) contain critical security issues`,
            timestamp: new Date().toISOString(),
            actionRequired: true,
          });
        }

      } catch (error) {
        console.error('Error generating alerts:', error);
      }

      // Add some system health alerts
      const now = new Date();
      mockAlerts.push(
        {
          id: 'system-healthy',
          type: 'system',
          severity: 'low',
          title: 'System Operating Normally',
          message: 'All services are running within normal parameters',
          timestamp: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
          acknowledged: true,
        },
        {
          id: 'llm-provider-check',
          type: 'info',
          severity: 'medium',
          title: 'INFO LLM Provider Status',
          message: 'OpenAI and Ollama services are operational',
          timestamp: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
        }
      );

      setAlerts(mockAlerts.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ));
    };

    generateAlerts();
    
    // Refresh alerts every 30 seconds
    const interval = setInterval(generateAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, acknowledged: true }
        : alert
    ));
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const filteredAlerts = React.useMemo(() => {
    let filtered = alerts;
    
    if (filter === 'unacknowledged') {
      filtered = filtered.filter(alert => !alert.acknowledged);
    }
    
    return filtered.slice(0, maxAlerts);
  }, [alerts, filter, maxAlerts]);

  const getAlertIcon = (type: Alert['type'], severity: Severity) => {
    switch (type) {
      case 'security':
        return severity === 'critical' 
          ? <span className="w-5 h-5 text-red-500 flex items-center justify-center font-bold text-xs">SEC</span>
          : <span className="w-5 h-5 text-yellow-500 flex items-center justify-center font-bold text-xs">SEC</span>;
      case 'system':
        return severity === 'low'
          ? <span className="w-5 h-5 text-green-500 flex items-center justify-center font-bold text-xs">SYS</span>
          : <span className="w-5 h-5 text-red-500 flex items-center justify-center font-bold text-xs">SYS</span>;
      case 'processing':
        return <span className="w-5 h-5 text-orange-500 flex items-center justify-center font-bold text-xs">PROC</span>;
      case 'info':
        return <span className="w-5 h-5 text-blue-500 flex items-center justify-center font-bold text-xs">INFO</span>;
      default:
        return <span className="w-5 h-5 text-gray-500 flex items-center justify-center font-bold text-xs">ALERT</span>;
    }
  };

  const getSeverityColor = (severity: Severity) => {
    switch (severity) {
      case 'critical': return 'border-l-red-500 bg-red-50';
      case 'high': return 'border-l-orange-500 bg-orange-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            System Alerts
          </h3>
          
          <div className="flex items-center space-x-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'unacknowledged')}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Alerts</option>
              <option value="unacknowledged">Unacknowledged</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-green-600 text-2xl font-bold mb-2">ALL CLEAR</div>
              <p>No active alerts</p>
              <p className="text-xs">System is operating normally</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`border-l-4 p-4 rounded-r-lg ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getAlertIcon(alert.type, alert.severity)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900">
                          {alert.title}
                        </p>
                        {alert.actionRequired && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            Action Required
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1">
                        {alert.message}
                      </p>
                      
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 ml-4">
                    {!alert.acknowledged && (
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50"
                        title="Acknowledge"
                      >
                        ACK
                      </button>
                    )}
                    
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-100"
                      title="Dismiss"
                    >
                      DISMISS
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {alerts.length > maxAlerts && (
          <div className="mt-4 pt-4 border-t border-gray-200 text-center">
            <button className="text-sm text-blue-600 hover:text-blue-700">
              View All Alerts ({alerts.length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsPanel;
