import * as React from 'react';
import { useBaselines, getBaselineById, deleteBaseline } from '../utils/analysisApi';
import AnalysisDetails from '../components/AnalysisDetails';
import { normalizeInstructionAnalysis } from '../utils/normalizeAnalysis';

const BaselinesPage = () => {
  const { baselines, loading, error, refresh } = useBaselines();
  const [selected, setSelected] = React.useState<any | null>(null);
  const [details, setDetails] = React.useState<any | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const handleView = async (id: number) => {
    setDetails(null);
    const data = await getBaselineById(id);
    setDetails(normalizeInstructionAnalysis(data));
  };

  const handleDelete = async (id: number) => {
    setDeleting(true);
    await deleteBaseline(id);
    setDeleting(false);
    setDetails(null);
    refresh();
  };

  // Helper to get highest severity for an analysis (copied from Dashboard)
  function getHighestSeverity(baseline: any): { label: string, color: string } {
    const levels = ['critical', 'high', 'medium', 'low'];
    const colors: Record<string, string> = {
      critical: 'bg-red-700 text-white',
      high: 'bg-yellow-500 text-black',
      medium: 'bg-green-500 text-white',
      low: 'bg-blue-500 text-white',
    };
    let found: string | null = null;
    if (Array.isArray(baseline.analysis_json?.instruction_analysis)) {
      for (const level of levels) {
        if (baseline.analysis_json.instruction_analysis.some((i: any) => (i.risk_level || '').toLowerCase() === level)) {
          found = level;
          break;
        }
      }
    }
    if (!found && Array.isArray(baseline.analysis_json?.vulnerabilities)) {
      for (const level of levels) {
        if (baseline.analysis_json.vulnerabilities.some((v: any) => (typeof v === 'string' ? v.toLowerCase().includes(level) : JSON.stringify(v).toLowerCase().includes(level)))) {
          found = level;
          break;
        }
      }
    }
    if (!found) return { label: 'None', color: 'bg-gray-400 text-white' };
    return { label: found.charAt(0).toUpperCase() + found.slice(1), color: colors[found] };
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Baselines</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {baselines.length > 0 && (
        <table className="min-w-full bg-white rounded shadow mb-6 text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 px-3">ID</th>
              <th className="py-2 px-3">File Name</th>
              <th className="py-2 px-3">Date</th>
              <th className="py-2 px-3">Severity</th>
              <th className="py-2 px-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {baselines.map((b: any) => {
              const severity = getHighestSeverity(b);
              return (
                <tr key={b.id} className={`border-b hover:bg-gray-50 transition ${details && details.id === b.id ? 'bg-green-50' : ''}`}>
                  <td className="py-2 px-3">{b.id}</td>
                  <td className="py-2 px-3">{b.fileName}</td>
                  <td className="py-2 px-3">{b.date}</td>
                  <td className="py-2 px-3">
                    <span
                      key={severity.label + '-' + b.id}
                      className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full border border-gray-300 ${severity.color} severity-badge`}
                      style={severity.label === 'High' ? { backgroundColor: '#facc15', color: '#000', borderColor: '#d1d5db' } : {}}
                    >
                      {severity.label}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex gap-2 items-center">
                      <button
                        className="px-2 py-1 text-xs font-semibold bg-green-600 text-white rounded shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50 transition"
                        onClick={() => handleView(b.id)}
                        aria-label={`View baseline ${b.id}`}
                      >
                        View
                      </button>
                      <button
                        className="px-2 py-1 text-xs font-semibold bg-red-600 text-white rounded shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50 transition"
                        onClick={() => handleDelete(b.id)}
                        aria-label={`Delete baseline ${b.id}`}
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
      )}
      {details && (
        <div className="bg-gray-100 p-4 rounded shadow mt-4">
          <h3 className="font-semibold mb-2">Baseline Details</h3>
          {/* Always pass the full baseline object as analysis_json for full LLM view */}
          <AnalysisDetails 
            analysis={normalizeInstructionAnalysis({
              fileName: details.fileName || details.originalName || details.name || 'Baseline',
              status: details.status || 'baseline',
              date: details.date || details.createdAt || '',
              analysis_json: details.analysis_json || details,
              // Also pass filePath if present, for LLM fallback logic
              filePath: details.filePath || ''
            })}
            provider={details.provider || details.llm_provider || details.analysis_json?.provider}
          />
        </div>
      )}
    </div>
  );
};

export default BaselinesPage;
