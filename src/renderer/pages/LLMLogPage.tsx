import React, { useEffect, useState } from 'react';

const LLMLogPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const loadLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      // @ts-ignore
      const data = await window.electronAPI?.getLLMLogs();
      // Sort logs newest to oldest
      setLogs(Array.isArray(data) ? [...data].sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || '')) : []);
    } catch (e: any) {
      setError(e.message || 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  // Handler to clear the LLM log
  const handleClearLog = async () => {
    if (!confirm('Are you sure you want to clear all LLM logs? This action cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      // @ts-ignore
      await window.electronAPI?.clearLLMLog();
      // Refresh logs after clearing
      await loadLogs();
    } catch (e: any) {
      setError(e?.message || 'Failed to clear log');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">LLM Interaction Logs</h2>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadLogs}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button
            onClick={handleClearLog}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Clear LLM Log
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {logs.length === 0 && !loading && !error && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-8 text-center">
          <div className="text-gray-500">No LLM interactions logged yet.</div>
        </div>
      )}

      {logs.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date/Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Summary</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log, idx) => {
                const summary = (log.result && typeof log.result === 'string')
                  ? log.result.slice(0, 80).replace(/\n/g, ' ') + (log.result.length > 80 ? '...' : '')
                  : (log.result && log.result.error ? log.result.error : 'No summary available');
                
                return (
                  <React.Fragment key={idx}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.id || idx + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {log.provider || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          log.success 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {log.success ? 'Success' : 'Failed'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate">{summary}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <button
                          onClick={() => setExpanded(expanded === idx ? null : idx)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          {expanded === idx ? 'Hide' : 'View Details'}
                        </button>
                      </td>
                    </tr>
                    {expanded === idx && (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 bg-gray-50">
                          <div className="space-y-4">
                            <div className="text-xs text-gray-500">
                              <strong>Timestamp:</strong> {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-900">Prompt:</span>
                              <pre className="mt-1 bg-gray-100 p-3 rounded text-xs overflow-x-auto max-h-32 overflow-y-auto">
                                {log.prompt || 'No prompt available'}
                              </pre>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-900">Result:</span>
                              <pre className="mt-1 bg-gray-100 p-3 rounded text-xs overflow-x-auto max-h-32 overflow-y-auto">
                                {typeof log.result === 'string' ? log.result : JSON.stringify(log.result, null, 2)}
                              </pre>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div>
                                <span className="text-sm font-medium text-gray-900">Provider:</span>
                                <span className="ml-2 text-sm text-gray-600">{log.provider || 'Unknown'}</span>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-gray-900">Model:</span>
                                <span className="ml-2 text-sm text-gray-600">{log.model || 'Unknown'}</span>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-gray-900">Status:</span>
                                <span className={`ml-2 text-sm ${log.success ? 'text-green-600' : 'text-red-600'}`}>
                                  {log.success ? 'Success' : 'Failed'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LLMLogPage;
