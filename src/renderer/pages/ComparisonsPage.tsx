import * as React from 'react';
import { useAnalyses, useBaselines, listComparisonHistory } from '../utils/analysisApi';
import ReactMarkdown from 'react-markdown';

const ComparisonsPage = () => {
  const { analyses } = useAnalyses();
  const { baselines } = useBaselines();
  const [selectedAnalysis, setSelectedAnalysis] = React.useState<number | null>(null);
  const [selectedBaseline, setSelectedBaseline] = React.useState<number | null>(null);
  const [history, setHistory] = React.useState<any[]>([]);
  const [selectedComparison, setSelectedComparison] = React.useState<any | null>(null);

  React.useEffect(() => {
    if (selectedAnalysis && selectedBaseline) {
      listComparisonHistory(selectedAnalysis, selectedBaseline).then(setHistory);
    } else {
      setHistory([]);
    }
  }, [selectedAnalysis, selectedBaseline]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Comparison History</h2>
      <div className="flex gap-4 mb-6">
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
      </div>
      {history.length > 0 && (
        <div className="mb-6">
          <div className="font-semibold mb-2">Previous Comparisons</div>
          <div className="border rounded bg-gray-50 max-h-64 overflow-auto divide-y">
            {history.map(h => (
              <div key={h.id} className="p-3 cursor-pointer hover:bg-blue-50" onClick={() => setSelectedComparison(h)}>
                <div className="text-xs text-gray-600">{new Date(h.timestamp).toLocaleString()}</div>
                <div className="truncate text-xs">{h.llm_result.slice(0, 120)}...</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {selectedComparison && (
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-2">Comparison Result</h3>
          <div className="bg-white border rounded shadow p-4">
            <ReactMarkdown>{selectedComparison.llm_result}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComparisonsPage;
