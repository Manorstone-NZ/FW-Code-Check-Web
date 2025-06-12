import * as React from 'react';
import { useAnalyses, useBaselines, deleteAnalysis } from '../utils/analysisApi';
import AnalysisDetails from '../components/AnalysisDetails';

const Dashboard = () => {
  const { analyses, loading: loadingAnalyses, error: errorAnalyses, refresh: refreshAnalyses } = useAnalyses();
  const { baselines, loading: loadingBaselines, error: errorBaselines, refresh: refreshBaselines } = useBaselines();
  const [viewAnalysis, setViewAnalysis] = React.useState<any | null>(null);
  const [deletingId, setDeletingId] = React.useState<number | null>(null);

  // Compute metrics
  const totalAnalyses = analyses.length;
  const totalBaselines = baselines.length;
  // Vulnerabilities: sum of all vulnerabilities arrays in all analyses
  const totalVulnerabilities = analyses.reduce((sum, a) => {
    const v = a.analysis_json?.vulnerabilities;
    return sum + (Array.isArray(v) ? v.length : 0);
  }, 0);
  // Alarms: sum of all instruction_analysis items with risk_level High or Critical
  const totalAlarms = analyses.reduce((sum, a) => {
    const ia = a.analysis_json?.instruction_analysis;
    if (!Array.isArray(ia)) return sum;
    return sum + ia.filter((item: any) => {
      const rl = (item.risk_level || '').toLowerCase();
      return rl === 'high' || rl === 'critical';
    }).length;
  }, 0);

  // Helper to get highest severity for an analysis
  function getHighestSeverity(analysis: any): { label: string, color: string } {
    const levels = ['critical', 'high', 'medium', 'low'];
    const colors: Record<string, string> = {
      critical: '#D9534F',
      high: '#FFC107',
      medium: '#28A745',
      low: '#0275D8',
    };
    let found: string | null = null;
    // Check instruction_analysis
    if (Array.isArray(analysis.analysis_json?.instruction_analysis)) {
      for (const level of levels) {
        if (analysis.analysis_json.instruction_analysis.some((i: any) => (i.risk_level || '').toLowerCase() === level)) {
          found = level;
          break;
        }
      }
    }
    // Fallback: check vulnerabilities array for keywords
    if (!found && Array.isArray(analysis.analysis_json?.vulnerabilities)) {
      for (const level of levels) {
        if (analysis.analysis_json.vulnerabilities.some((v: any) => (typeof v === 'string' ? v.toLowerCase().includes(level) : JSON.stringify(v).toLowerCase().includes(level)))) {
          found = level;
          break;
        }
      }
    }
    if (!found) return { label: 'None', color: '#232B3A' };
    return { label: found.charAt(0).toUpperCase() + found.slice(1), color: colors[found] };
  }

  // Sort analyses by date descending, show latest 5
  const recentAnalyses = [...analyses].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 5);

  return (
    <div className="flex flex-col gap-8 font-sans">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-8 flex flex-col items-center border border-gray-100">
          <div className="text-4xl font-extrabold text-[#0275D8]">{loadingAnalyses ? '...' : totalAnalyses}</div>
          <div className="text-gray-500 mt-2 text-base font-medium">Total Analyses</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-8 flex flex-col items-center border border-gray-100">
          <div className="text-4xl font-extrabold text-[#28A745]">{loadingBaselines ? '...' : totalBaselines}</div>
          <div className="text-gray-500 mt-2 text-base font-medium">Baselines</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-8 flex flex-col items-center border border-gray-100">
          <div className="text-4xl font-extrabold text-[#D9534F]">{loadingAnalyses ? '...' : totalVulnerabilities}</div>
          <div className="text-gray-500 mt-2 text-base font-medium">Vulnerabilities</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-8 flex flex-col items-center border border-gray-100">
          <div className="text-4xl font-extrabold text-[#FFC107]">{loadingAnalyses ? '...' : totalAlarms}</div>
          <div className="text-gray-500 mt-2 text-base font-medium">Alarms</div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-md p-8 mt-4 border border-gray-100">
        <div className="font-semibold mb-4 text-lg text-[#232B3A]">Most Recent Analyses</div>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600 border-b">
              <th className="py-2">Date</th>
              <th className="py-2">File</th>
              <th className="py-2">Status</th>
              <th className="py-2">Severity</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loadingAnalyses ? (
              <tr><td colSpan={5} className="py-4 text-center text-gray-400">Loading...</td></tr>
            ) : recentAnalyses.length === 0 ? (
              <tr><td colSpan={5} className="py-4 text-center text-gray-400">No analyses found.</td></tr>
            ) : recentAnalyses.map((a, idx) => {
              const sev = getHighestSeverity(a);
              return (
                <tr key={a.id || idx} className="border-b hover:bg-gray-50">
                  <td className="py-2">{a.date || ''}</td>
                  <td className="py-2">{a.fileName || ''}</td>
                  <td className="py-2">{a.status || ''}</td>
                  <td className="py-2 font-bold" style={{ color: sev.color }}>{sev.label}</td>
                  <td className="py-2 space-x-2">
                    <button
                      className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      onClick={() => setViewAnalysis(a)}
                    >View</button>
                    <button
                      className={`px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 ${deletingId === a.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={deletingId === a.id}
                      onClick={async () => {
                        setDeletingId(a.id);
                        await deleteAnalysis(a.id);
                        setDeletingId(null);
                        refreshAnalyses();
                      }}
                    >{deletingId === a.id ? 'Deleting...' : 'Delete'}</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Modal for analysis details */}
      {viewAnalysis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg max-w-3xl w-full p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl font-bold"
              onClick={() => setViewAnalysis(null)}
              aria-label="Close"
            >×</button>
            <AnalysisDetails analysis={viewAnalysis} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
