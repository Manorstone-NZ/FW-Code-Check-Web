import * as React from 'react';
import { useAnalyses, useBaselines, llmCompareAnalysisToBaseline, getAnalysisById, getBaselineById } from '../utils/analysisApi';
import ComparisonProfessionalPanel, { professionalMarkdown } from './ComparisonProfessionalPanel';
import { LLMProviderContext } from '../App';

const ComparisonsPage = () => {
  const { analyses } = useAnalyses();
  const { baselines } = useBaselines();
  const { provider: llmProvider } = React.useContext(LLMProviderContext);
  const [selectedAnalysis, setSelectedAnalysis] = React.useState<number | null>(null);
  const [selectedBaseline, setSelectedBaseline] = React.useState<number | null>(null);
  const [savedResults, setSavedResults] = React.useState<{
    id: number,
    timestamp: string,
    result: string,
    analysisFileName?: string,
    baselineFileName?: string
  }[]>([]);
  const [llmResult, setLlmResult] = React.useState<string | null>(null);
  const [llmLoading, setLlmLoading] = React.useState(false);
  const [llmError, setLlmError] = React.useState<string | null>(null);
  const [viewingSavedResult, setViewingSavedResult] = React.useState<string | null>(null);
  const [viewedSavedResultId, setViewedSavedResultId] = React.useState<number | null>(null);

  // Load saved results from DB on mount
  React.useEffect(() => {
    // @ts-ignore
    window.electron.invoke('get-saved-comparisons').then((results: any[]) => {
      // Defensive: ensure results is always an array
      const safeResults = Array.isArray(results) ? results : [];
      // Map llm_result to result for compatibility if needed
      const mapped = safeResults.map(r => {
        if (r.llm_result && !r.result) {
          return { ...r, result: r.llm_result };
        }
        return r;
      });
      setSavedResults(mapped);
    });
  }, []);

  const handleRunComparison = async () => {
    setLlmResult(null);
    setLlmError(null);
    setLlmLoading(true);
    try {
      if (!selectedAnalysis || !selectedBaseline) return;
      const analysis = await getAnalysisById(Number(selectedAnalysis));
      const baseline = await getBaselineById(Number(selectedBaseline));
      const getFilePath = (obj: any) => {
        if (!obj) return '';
        if (obj.filePath) return obj.filePath;
        if (obj.analysis_json && obj.analysis_json.filePath) return obj.analysis_json.filePath;
        if (obj.fileName && typeof obj.fileName === 'string' && obj.fileName.startsWith('/')) return obj.fileName;
        if (obj.analysis_json && obj.analysis_json.fileName && obj.analysis_json.fileName.startsWith('/')) return obj.analysis_json.fileName;
        return '';
      };
      let analysisArg = getFilePath(analysis) || JSON.stringify(analysis);
      let baselineArg = getFilePath(baseline) || JSON.stringify(baseline);
      const result = await llmCompareAnalysisToBaseline(analysisArg, baselineArg, llmProvider);
      setLlmResult(result?.llm_comparison || 'No LLM result.');
    } catch (e: any) {
      setLlmError(e?.message || 'LLM comparison failed.');
    } finally {
      setLlmLoading(false);
    }
  };

  // Save professional report to DB
  const handleSaveResult = async () => {
    if (selectedAnalysis && selectedBaseline && llmResult) {
      const analysis = analyses.find((a: any) => a.id === selectedAnalysis);
      const baseline = baselines.find((b: any) => b.id === selectedBaseline);
      const analysisFileName = analysis?.fileName || '';
      const baselineFileName = baseline?.fileName || '';
      if (!analysisFileName || !baselineFileName) return;
      // @ts-ignore
      await window.electron.invoke('save-comparison-result', {
        timestamp: new Date().toISOString(),
        result: llmResult,
        analysisFileName,
        baselineFileName
      });
      // Reload list
      // @ts-ignore
      window.electron.invoke('get-saved-comparisons').then((results: any[]) => {
        setSavedResults(results || []);
      });
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Saved Results panel always visible and at the top */}
      <div className="mb-8">
        <div className="bg-white rounded-xl shadow p-4 border">
          <div className="font-bold text-lg mb-3">Saved Results</div>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Date</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Files</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Severity</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {savedResults.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-gray-400">No saved results yet.</td>
                </tr>
              ) : (
                savedResults.map((r) => {
                  let severity = 'N/A';
                  const resultText = r.result || '';
                  const high = /\bhigh\b/i.test(resultText);
                  const critical = /\bcritical\b/i.test(resultText);
                  const medium = /\bmedium\b/i.test(resultText);
                  const low = /\blow\b/i.test(resultText);
                  if (critical) severity = 'Critical';
                  else if (high) severity = 'High';
                  else if (medium) severity = 'Medium';
                  else if (low) severity = 'Low';
                  let files = (r.analysisFileName && r.baselineFileName)
                    ? `${r.analysisFileName} vs ${r.baselineFileName}`
                    : 'Analysis vs Baseline';
                  const badgeColor = severity === 'Critical' ? 'bg-red-700 text-white' :
                    severity === 'High' ? 'bg-yellow-500 text-black' :
                    severity === 'Medium' ? 'bg-green-500 text-white' :
                    severity === 'Low' ? 'bg-blue-500 text-white' :
                    'bg-gray-300 text-gray-700';
                  return (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-blue-50">
                      <td className="py-2 px-3 align-middle">{new Date(r.timestamp).toLocaleString()}</td>
                      <td className="py-2 px-3 align-middle">{files}</td>
                      <td className="py-2 px-3 align-middle">
                        <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full border border-gray-300 ${badgeColor}`}>{severity}</span>
                      </td>
                      <td className="py-2 px-3 align-middle">
                        <button
                          className="mr-2 px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 text-xs border border-blue-300"
                          onClick={() => {
                            setViewedSavedResultId(r.id);
                            setLlmResult(null); // Clear LLM result when viewing saved
                          }}
                        >
                          View
                        </button>
                        <button
                          className="px-2 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 text-xs border border-red-300"
                          onClick={async () => {
                            // @ts-ignore
                            await window.electron.invoke('delete-comparison-result', r.id);
                            setSavedResults(prev => prev.filter(sr => sr.id !== r.id));
                            if (viewedSavedResultId === r.id) setViewedSavedResultId(null);
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Selection controls for analysis and baseline */}
      <div className="flex gap-4 mb-8">
        <div>
          <label className="block mb-1 font-semibold">Select Analysis</label>
          <select className="p-2 border rounded w-56" value={selectedAnalysis ?? ''} onChange={e => setSelectedAnalysis(Number(e.target.value) || null)}>
            <option value="">-- Select Analysis --</option>
            {analyses.map((a: any) => (
              <option key={a.id} value={a.id}>{a.fileName} ({a.date})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1 font-semibold">Select Baseline</label>
          <select className="p-2 border rounded w-56" value={selectedBaseline ?? ''} onChange={e => setSelectedBaseline(Number(e.target.value) || null)}>
            <option value="">-- Select Baseline --</option>
            {baselines.map((b: any) => (
              <option key={b.id} value={b.id}>{b.fileName} ({b.date})</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            className="ml-4 px-4 py-2 bg-blue-700 text-white rounded shadow hover:bg-blue-800 text-sm disabled:opacity-50"
            onClick={handleRunComparison}
            disabled={!selectedAnalysis || !selectedBaseline || llmLoading}
          >
            {llmLoading ? 'Comparing...' : 'Run LLM Comparison'}
          </button>
        </div>
      </div>
      {/* Professional PLC Code Comparison Report always visible */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-2xl font-bold text-blue-900">PLC Code Comparison Report</h3>
          <button
            className="ml-4 px-3 py-1 bg-blue-600 text-white rounded shadow hover:bg-blue-700 disabled:opacity-50 text-sm"
            onClick={handleSaveResult}
            disabled={!llmResult}
          >
            Save Result
          </button>
        </div>
        {llmError && <div className="mb-4 text-red-700 bg-red-50 border border-red-200 rounded p-3 font-semibold">{llmError}</div>}
        <div>
          {(() => {
            if (llmResult) {
              return <ComparisonProfessionalPanel markdown={llmResult} />;
            }
            if (viewedSavedResultId) {
              const saved = savedResults.find(r => r.id === viewedSavedResultId);
              if (saved) return <ComparisonProfessionalPanel markdown={saved.result} />;
            }
            return <div className="text-gray-400 italic">Run a comparison to see results.</div>;
          })()}
        </div>
      </div>
    </div>
  );
};

export default ComparisonsPage;
