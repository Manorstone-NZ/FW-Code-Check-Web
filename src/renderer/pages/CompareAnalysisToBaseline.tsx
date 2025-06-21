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

  // Helper to check if LLM compare can run
  const canCompare = !!(analysis && baseline && !llmLoading);

  // Helper to clear comparison state
  const handleClear = () => {
    setSelectedBaseline(null);
    setBaseline(null);
    setDiff(null);
    setLlmResult(null);
    setLlmError(null);
    setShowHistory(false);
  };

  // Helper to download LLM result
  const handleDownload = () => {
    if (!llmResult) return;
    const blob = new Blob([llmResult], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'llm_comparison.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Helper to copy LLM result
  const handleCopy = async () => {
    if (!llmResult) return;
    await navigator.clipboard.writeText(llmResult);
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
      {!analysis && <div className="mb-4 text-yellow-700 bg-yellow-100 p-2 rounded">No analysis selected. Please select an analysis to compare.</div>}
      {!selectedBaseline && <div className="mb-4 text-blue-700 bg-blue-100 p-2 rounded">Please select a baseline to compare against.</div>}
      {diff && <div className="mb-2 font-mono text-sm">{diff}</div>}
      {analysis && baseline && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-2">
            <div className="flex items-center gap-2 bg-gray-50 rounded p-2 border">
              <span className="font-semibold">Analysis:</span>
              <span>{analysis.fileName}</span>
              <span className="text-xs text-gray-500">{analysis.date}</span>
              <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full border border-gray-300 ${getHighestSeverity(analysis).color}`}>{getHighestSeverity(analysis).label}</span>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 rounded p-2 border">
              <span className="font-semibold">Baseline:</span>
              <span>{baseline.fileName}</span>
              <span className="text-xs text-gray-500">{baseline.date}</span>
              <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full border border-gray-300 ${getHighestSeverity(baseline).color}`}>{getHighestSeverity(baseline).label}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <h4 className="font-semibold mb-1">Analysis (Raw JSON)</h4>
              <pre className="bg-white p-2 rounded text-xs overflow-x-auto max-h-64">{JSON.stringify(analysis, null, 2)}</pre>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Baseline (Raw JSON)</h4>
              <pre className="bg-white p-2 rounded text-xs overflow-x-auto max-h-64">{JSON.stringify(baseline, null, 2)}</pre>
            </div>
          </div>
        </>
      )}
      <div className="flex gap-2 mb-4">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 disabled:opacity-50"
          onClick={handleLlmCompare}
          disabled={!canCompare}
        >
          {llmLoading ? 'Comparing with LLM...' : 'Get LLM-Powered Detailed Comparison'}
        </button>
        <button
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded shadow hover:bg-gray-300 disabled:opacity-50"
          onClick={handleClear}
          disabled={llmLoading && !selectedBaseline && !analysis}
        >
          Clear
        </button>
        <button
          className="px-4 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700 disabled:opacity-50"
          onClick={handleDownload}
          disabled={!llmResult}
        >
          Download Result
        </button>
        <button
          className="px-4 py-2 bg-yellow-500 text-black rounded shadow hover:bg-yellow-600 disabled:opacity-50"
          onClick={handleCopy}
          disabled={!llmResult}
        >
          Copy to Clipboard
        </button>
      </div>
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
    </div>
  );
};

export default CompareAnalysisToBaseline;
