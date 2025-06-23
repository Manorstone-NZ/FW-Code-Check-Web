import * as React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useLLMStatus } from '../utils/analysisApi';
import TrendChart from '../components/dashboard/TrendChart';
import AlertsPanel from '../components/dashboard/AlertsPanel';

// Import components that will be moved to Admin
import UserManagementPage from './UserManagementPage';
import LLMLogPage from './LLMLogPage';

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = React.useState('overview');
  const { status: llmStatus, error: llmError, providers: llmProviders, onlineProviders, refresh: refreshLLMStatus } = useLLMStatus(60000);
  const [systemAlerts, setSystemAlerts] = React.useState<any[]>([]);
  const [analysisStats, setAnalysisStats] = React.useState<any>(null);
  const [clearingData, setClearingData] = React.useState(false);

  // Redirect if not admin
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  React.useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      // System Alerts (simulated for now - in real implementation, these would come from monitoring systems)
      setSystemAlerts([
        { id: 1, type: 'warning', message: 'High memory usage detected', timestamp: new Date() },
        { id: 2, type: 'info', message: 'Database backup completed', timestamp: new Date(Date.now() - 3600000) },
        { id: 3, type: 'error', message: 'Failed to sync with external threat feed', timestamp: new Date(Date.now() - 7200000) }
      ]);

      // Load Analysis Trends
      const analyses = await window.electronAPI.getAnalyses();
      if (analyses?.length > 0) {
        const last30Days = analyses.filter((a: any) => 
          new Date(a.created_at || a.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        );
        
        // Group by date for trend analysis
        const trendData = analyses.map((a: any) => ({
          ...a,
          date: a.created_at || a.date
        }));
        
        setAnalysisStats({
          total: analyses.length,
          last30Days: last30Days.length,
          avgPerDay: (last30Days.length / 30).toFixed(1),
          rawData: trendData // Include raw data for trend chart
        });
      } else {
        setAnalysisStats({
          total: 0,
          last30Days: 0,
          avgPerDay: '0.0',
          rawData: []
        });
      }
    } catch (error) {
      console.error('Failed to load admin data:', error);
    }
  };

  const handleClearAnalysisData = async () => {
    if (!confirm('Are you sure you want to clear ALL analysis data and OT Threat Intel? This action cannot be undone.')) {
      return;
    }

    setClearingData(true);
    try {
      // Clear all data (analyses and OT threat intel)
      await window.electronAPI.clearAllData();
      
      alert('All analysis data and OT Threat Intel have been cleared successfully.');
      loadAdminData(); // Reload data to reflect changes
    } catch (error) {
      console.error('Failed to clear data:', error);
      alert('Failed to clear data. Please check the console for details.');
    } finally {
      setClearingData(false);
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* LLM Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">LLM Status</h3>
          <button
            onClick={refreshLLMStatus}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
        
        {/* Overall Status */}
        <div className="mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">Overall Status:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              llmStatus === 'online' ? 'bg-green-100 text-green-800' : 
              llmStatus === 'offline' ? 'bg-red-100 text-red-800' : 
              'bg-gray-100 text-gray-800'
            }`}>
              {llmStatus === 'online' ? 'Online' : llmStatus === 'offline' ? 'Offline' : 'Checking...'}
            </span>
          </div>
          {llmError && (
            <div className="mt-2 text-sm text-red-600">
              Error: {llmError}
            </div>
          )}
        </div>

        {/* Provider Details */}
        {llmProviders && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(llmProviders).map(([provider, status]: [string, any]) => (
              <div key={provider} className="bg-gray-50 p-4 rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Provider</div>
                    <div className="text-lg font-semibold capitalize">
                      {provider === 'openai' ? 'OpenAI' : provider === 'ollama' ? 'Ollama' : provider}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Status</div>
                    <div className={`text-lg font-semibold ${status.ok ? 'text-green-600' : 'text-red-600'}`}>
                      {status.ok ? 'Online' : 'Offline'}
                    </div>
                  </div>
                </div>
                {status.models && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-500">Available Models: {status.models.length}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Online Providers Summary */}
        {onlineProviders && onlineProviders.length > 0 && (
          <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
            <div className="text-sm text-green-800">
              <strong>Online Providers:</strong> {onlineProviders.join(', ')}
            </div>
          </div>
        )}
      </div>

      {/* System Alerts */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Alerts</h3>
        <AlertsPanel maxAlerts={10} />
      </div>

      {/* Analysis Trends */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Trends</h3>
        {analysisStats ? (
          <div className="space-y-6">
            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded">
                <div className="text-sm text-blue-600">Total Analyses</div>
                <div className="text-2xl font-bold text-blue-900">{analysisStats.total}</div>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <div className="text-sm text-green-600">Last 30 Days</div>
                <div className="text-2xl font-bold text-green-900">{analysisStats.last30Days}</div>
              </div>
              <div className="bg-purple-50 p-4 rounded">
                <div className="text-sm text-purple-600">Avg Per Day</div>
                <div className="text-2xl font-bold text-purple-900">{analysisStats.avgPerDay}</div>
              </div>
            </div>
            
            {/* Trend Chart */}
            <TrendChart 
              data={analysisStats.rawData || []}
              timeRange={'30d'}
              height={300}
            />
          </div>
        ) : (
          <div className="text-gray-500">Loading analysis trends...</div>
        )}
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h3>
        <div className="space-y-4">
          <div className="p-4 border border-red-200 rounded bg-red-50">
            <h4 className="font-semibold text-red-900 mb-2">Clear Analysis Data</h4>
            <p className="text-sm text-red-700 mb-3">
              This will permanently delete all PLC analysis data and OT Threat Intelligence from the database. 
              This action cannot be undone.
            </p>
            <button
              onClick={handleClearAnalysisData}
              disabled={clearingData}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {clearingData ? 'Clearing...' : 'Clear All Data'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">System Administration</h1>
        <p className="text-gray-600 mt-1">Manage system settings, users, and monitor application health</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6">
          <nav className="flex space-x-4">
            {[
              { id: 'overview', label: 'Overview', description: 'System status and alerts' },
              { id: 'users', label: 'User Management', description: 'Manage user accounts and permissions' },
              { id: 'llm-logs', label: 'LLM Logs', description: 'View AI interaction logs' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-md font-medium text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="flex flex-col items-center">
                  <span>{tab.label}</span>
                  <span className="text-xs opacity-75 mt-1">{tab.description}</span>
                </div>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow p-6">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'users' && <UserManagementPage />}
        {activeTab === 'llm-logs' && <LLMLogPage />}
      </div>
    </div>
  );
};

export default AdminPage;
