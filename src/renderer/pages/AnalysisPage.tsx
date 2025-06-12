import * as React from 'react';
import { useAnalyses, getAnalysisById } from '../utils/analysisApi';
import CompareAnalysisToBaseline from '../pages/CompareAnalysisToBaseline';
import AnalysisDetails from '../components/AnalysisDetails';
import { useLocation } from 'react-router-dom';
import { normalizeInstructionAnalysis } from '../utils/normalizeAnalysis';
import { debugLog } from '../utils/debugLog';

const AnalysisPage = () => {
  const { analyses, loading, error, refresh } = useAnalyses();
  const [details, setDetails] = React.useState<any | null>(null);
  const [compareId, setCompareId] = React.useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);
  const [highlightRow, setHighlightRow] = React.useState<number | null>(null);
  const location = useLocation();

  React.useEffect(() => {
    debugLog('navigate-analysis');
    setLastUpdated(new Date());
  }, []);

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

  const handleView = async (id: number) => {
    setDetails(null);
    debugLog('analysis-list-view-details', { analysisId: id });
    const data = await getAnalysisById(id);
    setDetails(normalizeInstructionAnalysis(data));
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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-gray-400">
          {lastUpdated && <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>}
        </div>
        <button
          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
          onClick={handleRefresh}
        >
          Refresh
        </button>
      </div>
      <h2 className="text-2xl font-bold mb-4">Analysis</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      <table className="min-w-full bg-white rounded shadow mb-6">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2 px-4">ID</th>
            <th className="py-2 px-4">File Name</th>
            <th className="py-2 px-4">Date</th>
            <th className="py-2 px-4">Status</th>
            <th className="py-2 px-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredAnalyses.map((a: any) => (
            <tr key={a.id} className={`border-b hover:bg-gray-50 transition ${highlightRow === a.id ? 'ring-2 ring-blue-200' : ''}`}>
              <td className="py-2 px-4">{a.id}</td>
              <td className="py-2 px-4">{a.fileName}</td>
              <td className="py-2 px-4">{a.date}</td>
              <td className="py-2 px-4">{a.status}</td>
              <td className="py-2 px-4 flex gap-2">
                <button
                  className="px-3 py-1 text-xs font-semibold bg-blue-600 text-white rounded shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transition"
                  onClick={() => handleView(a.id)}
                  aria-label={`View analysis ${a.id}`}
                >
                  View
                </button>
                <button
                  className="px-3 py-1 text-xs font-semibold bg-red-600 text-white rounded shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50 transition"
                  onClick={() => handleDelete(a.id)}
                  aria-label={`Delete analysis ${a.id}`}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {details && (
        <div className="bg-gray-100 p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Analysis Details</h3>
          <AnalysisDetails analysis={details} />
        </div>
      )}
      {compareId && (
        <div className="bg-gray-100 p-4 rounded shadow mt-4">
          <h3 className="font-semibold mb-2">Compare Analysis to Baseline</h3>
          <CompareAnalysisToBaseline analysisId={compareId} />
        </div>
      )}
    </div>
  );
};

export default AnalysisPage;
