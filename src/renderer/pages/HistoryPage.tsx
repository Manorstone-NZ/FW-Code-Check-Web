import * as React from 'react';
import { useAnalyses, getAnalysisById } from '../utils/analysisApi';
import CompareAnalysisToBaseline from '../pages/CompareAnalysisToBaseline';
import AnalysisDetails from '../components/AnalysisDetails';
import { normalizeInstructionAnalysis } from '../utils/normalizeAnalysis';

const HistoryPage = () => {
  const { analyses, loading, error, refresh } = useAnalyses();
  const [details, setDetails] = React.useState<any | null>(null);
  const [compareId, setCompareId] = React.useState<number | null>(null);

  const handleView = async (id: number) => {
    setDetails(null);
    const data = await getAnalysisById(id);
    setDetails(normalizeInstructionAnalysis(data));
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this analysis?')) return;
    // @ts-ignore
    await window.electron.invoke('delete-analysis', id);
    refresh();
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
    // 1. Check instruction_analysis JSON
    if (Array.isArray(analysis.analysis_json?.instruction_analysis)) {
      for (const level of levels) {
        if (analysis.analysis_json.instruction_analysis.some((i: any) => (i.risk_level || '').toLowerCase() === level)) {
          found = level;
          break;
        }
      }
    }
    // 2. Check vulnerabilities JSON
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
    // 4. Fallback: none
    if (!found) return { label: 'None', color: 'bg-gray-400 text-white' };
    return { label: found.charAt(0).toUpperCase() + found.slice(1), color: colors[found] };
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-md border border-gray-200 max-w-2xl mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">Analysis History</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      <table className="min-w-full bg-white rounded shadow mb-6 text-sm">
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
          {analyses.map((a: any) => {
            const severity = getHighestSeverity(a);
            return (
              <tr key={a.id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-4">{a.id}</td>
                <td className="py-2 px-4">{a.fileName}</td>
                <td className="py-2 px-4">{a.date}</td>
                <td className="py-2 px-4">
                  <span
                    key={severity.label + '-' + a.id}
                    className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full border border-gray-300 ${severity.color} severity-badge`}
                    style={severity.label === 'High' ? { backgroundColor: '#facc15', color: '#000', borderColor: '#d1d5db' } : {}}
                  >
                    {severity.label}
                  </span>
                </td>
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
            );
          })}
        </tbody>
      </table>
      {details && (
        <div className="bg-gray-50 rounded-xl shadow max-w-3xl w-full mt-6 p-2 mx-auto">
          <AnalysisDetails 
            analysis={normalizeInstructionAnalysis(details)} 
            provider={details.provider || details.llm_provider || details.analysis_json?.provider}
          />
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

export default HistoryPage;
