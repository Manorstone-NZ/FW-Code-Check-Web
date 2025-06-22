import * as React from 'react';
import { useBaselines, getBaselineById, deleteBaseline } from '../utils/analysisApi';
import { normalizeInstructionAnalysis } from '../utils/normalizeAnalysis';
import AnalysisDetails from '../components/AnalysisDetails';

// Temporary dummy component for debugging
const DummyAnalysisDetails = (props: any) => {
  console.log('DummyAnalysisDetails mounted with:', props);
  return (
    <div style={{background: 'limegreen', color: 'white', padding: 16, fontWeight: 'bold', fontSize: 20}}>
      Dummy AnalysisDetails Rendered
    </div>
  );
};

const BaselinesPage = () => {
  const { baselines, loading, error, refresh } = useBaselines();
  const [selected, setSelected] = React.useState<any | null>(null);
  const [details, setDetails] = React.useState<any | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const handleView = async (id: number) => {
    setDetails(null);
    console.log('View button clicked for baseline id:', id); // Add log to confirm button click
    const data = await getBaselineById(id);
    console.log('Baseline data:', data); // Log the raw data for debugging
    const normalizedData = normalizeInstructionAnalysis(data);
    console.log('Normalized baseline data:', normalizedData); // Log the normalized data
    setDetails(normalizedData);
  };

  const handleDelete = async (id: number) => {
    setDeleting(true);
    await deleteBaseline(id);
    setDeleting(false);
    setDetails(null);
    refresh();
  };

  // Helper to extract highest severity from both JSON and LLM section text (including Ollama-style)
  function getHighestSeverity(obj: any): { label: string, color: string } {
    const levels = ['critical', 'high', 'medium', 'low'];
    const colors: Record<string, string> = {
      critical: 'bg-red-700 text-white',
      high: 'bg-yellow-500 text-black',
      medium: 'bg-green-500 text-white',
      low: 'bg-blue-500 text-white',
    };
    let found: string | null = null;
    if (Array.isArray(obj.analysis_json?.instruction_analysis)) {
      for (const level of levels) {
        if (obj.analysis_json.instruction_analysis.some((i: any) => (i.risk_level || '').toLowerCase() === level)) {
          found = level;
          break;
        }
      }
    }
    if (!found && Array.isArray(obj.analysis_json?.vulnerabilities)) {
      for (const level of levels) {
        if (obj.analysis_json.vulnerabilities.some((v: any) => (typeof v === 'string' ? v.toLowerCase().includes(level) : JSON.stringify(v).toLowerCase().includes(level)))) {
          found = level;
          break;
        }
      }
    }
    // 3. Check LLM section text for risk levels (OpenAI, Ollama, markdown, etc.)
    const llmText = obj.llm_results || obj.analysis_json?.llm_results || '';
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
        <h2 className="text-2xl font-bold mb-6 text-center">Baselines</h2>
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {baselines && baselines.length > 0 && (
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
                {baselines.map((b: any) => {
                  const severity = getHighestSeverity(b);
                  const provider = b.provider || b.llm_provider || b.analysis_json?.provider || '';
                  const model = b.model || b.llm_model || b.analysis_json?.model || '';
                  return (
                    <tr key={b.id} className={`border-b hover:bg-gray-50 transition ${details && details.id === b.id ? 'bg-green-50' : ''}`}>
                      <td className="py-2 px-3">{b.id}</td>
                      <td className="py-2 px-3">{b.fileName}</td>
                      <td className="py-2 px-3">Baseline</td>
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
                      <td className="py-2 px-3">{provider}</td>
                      <td className="py-2 px-3">{model}</td>
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
          </div>
        )}
        {details && (
          <div className="bg-gray-50 rounded-xl shadow max-w-4xl w-full mt-8 p-4 mx-auto">
            {(() => { console.log('Rendering details panel with:', details); return null; })()}
            <AnalysisDetails 
              analysis={details}
              provider={details.provider || details.llm_provider || details.analysis_json?.provider}
              model={details.model || details.llm_model || details.analysis_json?.model}
            />
            <div style={{background: 'yellow', color: 'black', padding: 8, marginTop: 8}}>If you see this but not the green banner, AnalysisDetails is crashing.</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BaselinesPage;
