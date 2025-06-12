import * as React from 'react';
import { useAnalyses, useBaselines, deleteAnalysis } from '../utils/analysisApi';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { analyses, loading: loadingAnalyses, error: errorAnalyses, refresh: refreshAnalyses } = useAnalyses();
  const { baselines, loading: loadingBaselines, error: errorBaselines, refresh: refreshBaselines } = useBaselines();
  const [deletingId, setDeletingId] = React.useState<number | null>(null);
  const navigate = useNavigate();

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
        {/* Total Analyses */}
        <div
          className="bg-blue-200 rounded-xl shadow-md p-4 flex flex-col items-center border border-blue-300 hover:shadow-lg cursor-pointer transition group min-h-[110px] min-w-[120px]"
          style={{ maxWidth: 180 }}
          onClick={() => navigate('/analysis')}
          title="View all analyses"
        >
          <div className="text-3xl font-bold text-blue-800 mb-1 tracking-tight drop-shadow">{loadingAnalyses ? '...' : totalAnalyses}</div>
          <div className="text-blue-900 mt-1 text-base font-semibold uppercase tracking-wide">Total Analyses</div>
        </div>
        {/* Baselines */}
        <div
          className="bg-green-200 rounded-xl shadow-md p-4 flex flex-col items-center border border-green-300 hover:shadow-lg cursor-pointer transition group min-h-[110px] min-w-[120px]"
          style={{ maxWidth: 180 }}
          onClick={() => navigate('/baselines')}
          title="View all baselines"
        >
          <div className="text-3xl font-bold text-green-800 mb-1 tracking-tight drop-shadow">{loadingBaselines ? '...' : totalBaselines}</div>
          <div className="text-green-900 mt-1 text-base font-semibold uppercase tracking-wide">Baselines</div>
        </div>
        {/* Vulnerabilities */}
        <div
          className="bg-red-200 rounded-xl shadow-md p-4 flex flex-col items-center border border-red-300 hover:shadow-lg cursor-pointer transition group min-h-[110px] min-w-[120px]"
          style={{ maxWidth: 180 }}
          onClick={() => navigate('/analysis?vuln=1')}
          title="View all detected vulnerabilities"
        >
          <div className="text-3xl font-bold text-red-800 mb-1 tracking-tight drop-shadow">{loadingAnalyses ? '...' : totalVulnerabilities}</div>
          <div className="text-red-900 mt-1 text-base font-semibold uppercase tracking-wide">Vulnerabilities</div>
        </div>
        {/* Alarms */}
        <div
          className="bg-yellow-200 rounded-xl shadow-md p-4 flex flex-col items-center border border-yellow-300 hover:shadow-lg cursor-pointer transition group min-h-[110px] min-w-[120px]"
          style={{ maxWidth: 180 }}
          onClick={() => navigate('/analysis?alarms=1')}
          title="View all detected alarms"
        >
          <div className="text-3xl font-bold text-yellow-800 mb-1 tracking-tight drop-shadow">{loadingAnalyses ? '...' : totalAlarms}</div>
          <div className="text-yellow-900 mt-1 text-base font-semibold uppercase tracking-wide">Alarms</div>
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
                  <td className="py-2">
                    <button
                      className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      onClick={() => navigate(`/analysis/${a.id}`)}
                    >View</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
