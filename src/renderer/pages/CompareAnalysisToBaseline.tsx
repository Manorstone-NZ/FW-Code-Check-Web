import * as React from 'react';
import { getAnalysisById, getBaselineById, useBaselines, llmCompareAnalysisToBaseline } from '../utils/analysisApi';
import ReactMarkdown from 'react-markdown';

const CompareAnalysisToBaseline = ({ analysisId }: { analysisId: number }) => {
  const { baselines } = useBaselines();
  const [selectedBaseline, setSelectedBaseline] = React.useState<number | null>(null);
  const [analysis, setAnalysis] = React.useState<any | null>(null);
  const [baseline, setBaseline] = React.useState<any | null>(null);
  const [diff, setDiff] = React.useState<string | null>(null);
  const [llmResult, setLlmResult] = React.useState<string | null>(null);
  const [llmLoading, setLlmLoading] = React.useState(false);
  const [llmError, setLlmError] = React.useState<string | null>(null);
  const [history, setHistory] = React.useState<any[]>([]);
  const [showHistory, setShowHistory] = React.useState(false);

  React.useEffect(() => {
    if (analysisId) {
      getAnalysisById(analysisId).then(setAnalysis);
    }
  }, [analysisId]);

  React.useEffect(() => {
    if (selectedBaseline) {
      getBaselineById(selectedBaseline).then(setBaseline);
    }
  }, [selectedBaseline]);

  React.useEffect(() => {
    if (analysis && baseline) {
      // Simple diff: show keys that differ
      const aStr = JSON.stringify(analysis, null, 2);
      const bStr = JSON.stringify(baseline, null, 2);
      setDiff(aStr === bStr ? 'No differences.' : 'Analysis and baseline differ.');
    } else {
      setDiff(null);
    }
  }, [analysis, baseline]);

  React.useEffect(() => {
    if (analysis && baseline) {
      // Fetch comparison history for this pair
      import('../utils/analysisApi').then(api => {
        api.listComparisonHistory(analysis.id, baseline.id).then(setHistory);
      });
    }
  }, [analysis, baseline]);

  // Helper to get file paths for LLM comparison (must be a real file path)
  const getFilePath = (obj: any) => {
    if (!obj) return '';
    // Prefer top-level filePath
    if (obj.filePath) return obj.filePath;
    // Check inside analysis_json/filePath (for analyses)
    if (obj.analysis_json && obj.analysis_json.filePath) return obj.analysis_json.filePath;
    // Fallback: top-level fileName if absolute
    if (obj.fileName && typeof obj.fileName === 'string' && obj.fileName.startsWith('/')) return obj.fileName;
    // Fallback: inside analysis_json.fileName if absolute
    if (obj.analysis_json && obj.analysis_json.fileName && obj.analysis_json.fileName.startsWith('/')) return obj.analysis_json.fileName;
    return '';
  };

  const handleLlmCompare = async () => {
    setLlmLoading(true);
    setLlmError(null);
    setLlmResult(null);
    try {
      let analysisPath = getFilePath(analysis);
      let baselinePath = getFilePath(baseline);
      let analysisArg: any = analysisPath;
      let baselineArg: any = baselinePath;
      // If file paths are missing, use file content (as JSON string)
      if (!analysisPath && analysis) {
        analysisArg = JSON.stringify(analysis);
      }
      if (!baselinePath && baseline) {
        baselineArg = JSON.stringify(baseline);
      }
      if (!analysisArg || !baselineArg) throw new Error('Cannot find the original file paths or content for LLM comparison. Please ensure you are comparing files that exist on disk or have content.');
      const result = await llmCompareAnalysisToBaseline(analysisArg, baselineArg);
      setLlmResult(result?.llm_comparison || 'No LLM result.');
    } catch (e: any) {
      setLlmError(e.message || 'LLM comparison failed.');
    } finally {
      setLlmLoading(false);
    }
  };

  // Helper to split Markdown into sections by ## headers
  const splitMarkdownSections = (md: string) => {
    if (!md) return [];
    const lines = md.split(/\r?\n/);
    const sections: string[] = [];
    let current: string[] = [];
    for (let line of lines) {
      if (line.startsWith('## ')) {
        if (current.length) sections.push(current.join('\n'));
        current = [line];
      } else {
        current.push(line);
      }
    }
    if (current.length) sections.push(current.join('\n'));
    return sections;
  };

  return (
    <div>
      <label className="block mb-2">Select Baseline to Compare:</label>
      <select
        className="mb-4 p-2 border rounded"
        value={selectedBaseline ?? ''}
        onChange={e => setSelectedBaseline(Number(e.target.value))}
      >
        <option value="">-- Select Baseline --</option>
        {baselines.map((b: any) => (
          <option key={b.id} value={b.id}>{b.fileName} ({b.date})</option>
        ))}
      </select>
      {diff && <div className="mb-2 font-mono text-sm">{diff}</div>}
      {analysis && baseline && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <h4 className="font-semibold mb-1">Analysis</h4>
              <pre className="bg-white p-2 rounded text-xs overflow-x-auto max-h-64">{JSON.stringify(analysis, null, 2)}</pre>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Baseline</h4>
              <pre className="bg-white p-2 rounded text-xs overflow-x-auto max-h-64">{JSON.stringify(baseline, null, 2)}</pre>
            </div>
          </div>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 disabled:opacity-50"
            onClick={handleLlmCompare}
            disabled={llmLoading}
          >
            {llmLoading ? 'Comparing with LLM...' : 'Get LLM-Powered Detailed Comparison'}
          </button>
          {llmError && <div className="text-red-600 mt-2">{llmError}</div>}
          {llmResult && (
            <div className="mt-4">
              <h2 className="text-2xl font-bold mb-4">LLM-Powered PLC File Comparison</h2>
              <h4 className="font-semibold mb-2">LLM Detailed Comparison</h4>
              <button className="mb-2 px-2 py-1 bg-gray-200 rounded" onClick={() => setShowHistory(h => !h)}>
                {showHistory ? 'Hide' : 'Show'} Comparison History
              </button>
              {showHistory && history.length > 0 && (
                <div className="mb-4 border rounded bg-gray-50 p-2 max-h-64 overflow-auto">
                  <div className="font-semibold mb-1">Past Comparisons</div>
                  {history.map(h => (
                    <div key={h.id} className="mb-2 p-2 border-b last:border-b-0 cursor-pointer hover:bg-blue-50" onClick={() => setLlmResult(h.llm_result)}>
                      <div className="text-xs text-gray-600">{new Date(h.timestamp).toLocaleString()}</div>
                      <div className="truncate text-xs">{h.llm_result.slice(0, 120)}...</div>
                    </div>
                  ))}
                </div>
              )}
              {splitMarkdownSections(llmResult).map((section, idx) => (
                <div key={idx} className="mb-8 p-4 bg-white border rounded shadow-sm">
                  <ReactMarkdown>{section}</ReactMarkdown>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CompareAnalysisToBaseline;
