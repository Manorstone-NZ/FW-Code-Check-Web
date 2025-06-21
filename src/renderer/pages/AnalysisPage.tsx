import * as React from 'react';
import { useAnalyses, getAnalysisById } from '../utils/analysisApi';
import AnalysisDetails from '../components/AnalysisDetails';
import { useLocation } from 'react-router-dom';
import { normalizeInstructionAnalysis } from '../utils/normalizeAnalysis';
import { debugLog } from '../utils/debugLog';

const AnalysisPage = () => {
  const { analyses, loading, error, refresh } = useAnalyses();
  const [details, setDetails] = React.useState<any | null>(null);
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);
  const [highlightRow, setHighlightRow] = React.useState<number | null>(null);
  const location = useLocation();

  // Filtering logic based on query params
  const params = new URLSearchParams(location.search);
  const showVuln = params.get('vuln') === '1';
  const showAlarms = params.get('alarms') === '1';
  let filteredAnalyses = analyses;
  if (showVuln) {
    filteredAnalyses = analyses.filter(a => {
      // Accept vulnerabilities if array exists and has any non-falsy value (string, object, number, etc.)
      const vulns = a.analysis_json?.vulnerabilities;
      return Array.isArray(vulns) && vulns.some((v: any) => {
        if (typeof v === 'string') return v.trim().length > 0;
        if (typeof v === 'object' && v !== null) return Object.keys(v).length > 0;
        if (typeof v === 'number') return true;
        return !!v;
      });
    });
  } else if (showAlarms) {
    filteredAnalyses = analyses.filter(a => {
      // Accept alarms if any instruction_analysis entry has 'alarm' in any field, or if any field is an object containing 'alarm'
      const instr = a.analysis_json?.instruction_analysis;
      return Array.isArray(instr) && instr.some((i: any) => {
        const allFields = Object.values(i).map(val => (typeof val === 'string' ? val.toLowerCase() : JSON.stringify(val).toLowerCase()));
        return allFields.some(val => val && val.includes('alarm'));
      });
    });
  }

  React.useEffect(() => {
    debugLog('navigate-analysis', {
      analysesCount: analyses.length,
      filteredAnalysesCount: filteredAnalyses.length,
      loading,
      error
    });
    setLastUpdated(new Date());
  }, [analyses, filteredAnalyses, loading, error]);

  // Auto-select the most recent (or first) analysis by default
  React.useEffect(() => {
    if (!details && filteredAnalyses.length > 0) {
      // Sort by date descending, fallback to id descending if no date
      const sorted = [...filteredAnalyses].sort((a, b) => {
        if (a.date && b.date) return b.date.localeCompare(a.date);
        return (b.id || 0) - (a.id || 0);
      });
      const first = sorted[0];
      if (first) {
        // Use handleView to normalize and set details
        handleView(first.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredAnalyses]);

  const handleView = async (id: number) => {
    setDetails(null);
    debugLog('analysis-list-view-details', { analysisId: id });
    const data = await getAnalysisById(id);
    
    console.log('AnalysisPage handleView: raw data from getAnalysisById', {
      id,
      data: data ? {
        hasAnalysisJson: !!data.analysis_json,
        analysisJsonType: typeof data.analysis_json,
        topLevelKeys: Object.keys(data),
        provider: data.provider,
        model: data.model,
        fileName: data.fileName
      } : null
    });
    
    const normalizedData = normalizeInstructionAnalysis(data);
    
    console.log('AnalysisPage handleView: normalized data', {
      id,
      normalizedData: normalizedData ? {
        hasAnalysisJson: !!normalizedData.analysis_json,
        topLevelKeys: Object.keys(normalizedData),
        provider: normalizedData.provider,
        model: normalizedData.model,
        fileName: normalizedData.fileName
      } : null
    });
    
    setDetails(normalizedData);
    setHighlightRow(id);
    setTimeout(() => setHighlightRow(null), 1200);
    setLastUpdated(new Date());
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this analysis?')) return;
    debugLog('analysis-list-delete', { analysisId: id });
    // @ts-ignore
    await window.electron.invoke('delete-analysis', id);
    refresh();
    setLastUpdated(new Date());
  };

  const handleRefresh = () => {
    debugLog('analysis-list-manual-refresh');
    refresh();
    setLastUpdated(new Date());
  };

  // Helper to extract highest severity from both JSON and LLM section text (including Ollama-style)
  function getHighestSeverity(analysis: any): { label: string, color: string } {
    const levels = ['critical', 'high', 'medium', 'low'];
    const colors: Record<string, string> = {
      critical: 'bg-red-700 text-white',
      high: 'bg-yellow-500 text-black',
      medium: 'bg-green-500 text-white',
      low: 'bg-blue-500 text-white',
    };
    let found: string | null = null;
    if (Array.isArray(analysis.analysis_json?.instruction_analysis)) {
      for (const level of levels) {
        if (analysis.analysis_json.instruction_analysis.some((i: any) => (i.risk_level || '').toLowerCase() === level)) {
          found = level;
          break;
        }
      }
    }
    if (!found && Array.isArray(analysis.analysis_json?.vulnerabilities)) {
      for (const level of levels) {
        if (analysis.analysis_json.vulnerabilities.some((v: any) => (typeof v === 'string' ? v.toLowerCase().includes(level) : JSON.stringify(v).toLowerCase().includes(level)))) {
          found = level;
          break;
        }
      }
    }
    // 3. Check LLM section text for risk levels (OpenAI, Ollama, markdown, etc.)
    const llmText = analysis.llm_results || analysis.analysis_json?.llm_results || '';
    if (!found && typeof llmText === 'string') {
      // Find all risk level mentions (e.g., 'Risk Level: Medium', 'risk_level": "Medium"')
      const matches = Array.from(llmText.matchAll(/risk[_ ]?level[":\- ]+([a-z]+)/gi));
      const foundLevels = matches.map(m => m[1].toLowerCase());
      for (const level of levels) {
        if (foundLevels.includes(level)) {
          found = level;
          break;
        }
      }
    }
    if (!found) return { label: 'None', color: 'bg-gray-400 text-white' };
    return { label: found.charAt(0).toUpperCase() + found.slice(1), color: colors[found] };
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 py-12">
      <div className="bg-white rounded-xl shadow-md border border-gray-200 max-w-5xl w-full p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Analysis</h2>
          <div className="flex items-center gap-4">
            {lastUpdated && (
              <span className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              onClick={handleRefresh}
            >
              Refresh
            </button>
          </div>
        </div>
        
        {/* Show stats */}
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredAnalyses.length} of {analyses.length} analyses
        </div>
        
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {(!loading && filteredAnalyses.length === 0) && (
          <div className="p-8 text-center text-gray-500 text-lg">No analyses found in the database.</div>
        )}
        
        {filteredAnalyses.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded shadow mb-6 text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 px-3">ID</th>
                  <th className="py-2 px-3">File Name</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Severity</th>
                  <th className="py-2 px-3">Provider</th>
                  <th className="py-2 px-3">Model</th>
                  <th className="py-2 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAnalyses.map((a: any) => {
                  const isBaseline = a.status && typeof a.status === 'string' && a.status.toLowerCase().includes('baseline');
                  const severity = getHighestSeverity(a);
                  const provider = a.provider || a.llm_provider || a.analysis_json?.provider || '';
                  const model = a.model || a.llm_model || a.analysis_json?.model || '';
                  return (
                    <tr key={a.id} className={`border-b hover:bg-gray-50 transition ${
                      highlightRow === a.id ? 'ring-2 ring-blue-200' : ''
                    } ${
                      details && details.id === a.id ? 'bg-blue-50' : ''
                    }`}>
                      <td className="py-2 px-3">{a.id}</td>
                      <td className="py-2 px-3">{a.fileName}</td>
                      <td className="py-2 px-3">
                        <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${
                          isBaseline ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
                        }`}>
                          {isBaseline ? 'Baseline' : 'Analysis'}
                        </span>
                      </td>
                      <td className="py-2 px-3">{a.date}</td>
                      <td className="py-2 px-3">
                        <span
                          key={severity.label + '-' + a.id}
                          className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full border border-gray-300 ${severity.color} severity-badge`}
                          style={severity.label === 'High' ? { backgroundColor: '#facc15', color: '#000', borderColor: '#d1d5db' } : {}}
                        >
                          {severity.label}
                        </span>
                      </td>
                      <td className="py-2 px-3">{provider}</td>
                      <td className="py-2 px-3">{model}</td>
                      <td className="py-2 px-3">
                        <div className="flex gap-2 items-center">
                          <button
                            className="px-2 py-1 text-xs font-semibold bg-blue-600 text-white rounded shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transition"
                            onClick={() => handleView(a.id)}
                            aria-label={`View analysis ${a.id}`}
                          >
                            View
                          </button>
                          <button
                            className="px-2 py-1 text-xs font-semibold bg-red-600 text-white rounded shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50 transition"
                            onClick={() => handleDelete(a.id)}
                            aria-label={`Delete analysis ${a.id}`}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Details panel - same as BaselinesPage */}
        {details && (
          <div className="bg-gray-50 rounded-xl shadow max-w-4xl w-full mt-8 p-4 mx-auto">
            <AnalysisDetails 
              analysis={details} 
              provider={details.provider || details.llm_provider || details.analysis_json?.provider} 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisPage;
