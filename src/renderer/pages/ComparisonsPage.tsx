import * as React from 'react';
import { useAnalyses, useBaselines, llmCompareAnalysisToBaseline, getAnalysisById, getBaselineById } from '../utils/analysisApi';
import ComparisonProfessionalPanel, { professionalMarkdown } from './ComparisonProfessionalPanel';
import { LLMProviderContext } from '../App';
import LLMProviderModelPicker, { OPENAI_MODELS } from '../components/LLMProviderModelPicker';

// Enhanced severity detection function
// Supports both OpenAI and Ollama output formats
// Analyzes content using pattern matching and contextual scoring
const detectSeverity = (resultText: string): string => {
  if (!resultText) return 'N/A';
  
  const text = resultText.toLowerCase();
  
  // Define severity patterns with weights
  const severityPatterns = {
    critical: [
      /\bcritical\b/g,
      /\bsevere\b/g,
      /\bimmediate threat\b/g,
      /\bsystem compromise\b/g,
      /\bcatastrophic\b/g,
      /\bemergency\b/g,
      /\bexploit\b/g,
      /\battacker\b/g,
      /\bcompromise\b/g,
      /\bmalicious code\b/g,
      /\bbackdoor\b/g,
      /\btrojan\b/g,
      /\bexploited\b/g,
      /\bexploitation\b/g
    ],
    high: [
      /\bhigh\b/g,
      /\bsignificant\b/g,
      /\bmajor threat\b/g,
      /\bvulnerabilit(y|ies)\b/g,
      /\bdata tampering\b/g,
      /\bunauthorized access\b/g,
      /\bsecurity breach\b/g,
      /\bmalicious\b/g,
      /\bsecurity risk\b/g,
      /\bsignificant.*risk\b/g,
      /\bsignificant.*security\b/g,
      /\bpotential.*exploit\b/g,
      /\bsuppress.*alarm\b/g,
      /\bhide.*malicious\b/g,
      /\bsecurity.*concern\b/g,
      /\bsecurity.*issue\b/g,
      /\bpotential.*risk\b/g,
      /\bindustrial.*risk\b/g,
      /\bautomation.*risk\b/g,
      /\bmalicious purposes\b/g,
      /\bcould be exploited\b/g,
      /\bmay be exploited\b/g,
      /\bintroduce.*vulnerabilit\b/g,
      /\bsecurity.*vulnerabilit\b/g,
      /\bpotential.*vulnerabilit\b/g
    ],
    medium: [
      /\bmedium\b/g,
      /\bmoderate\b/g,
      /\bpotential threat\b/g,
      /\bsuspicious\b/g,
      /\bwarning\b/g,
      /\bconcern\b/g,
      /\breview\b/g,
      /\bmonitoring\b/g,
      /\bimpact.*system\b/g,
      /\bfunctionality.*risk\b/g,
      /\boperational.*concern\b/g
    ],
    low: [
      /\blow\b/g,
      /\bminor\b/g,
      /\blow risk\b/g,
      /\bno significant threat\b/g,
      /\bminimal impact\b/g,
      /\bno.*risk\b/g,
      /\bno.*concern\b/g
    ]
  };
  
  // Count matches for each severity level
  const severityCounts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  };
  
  Object.entries(severityPatterns).forEach(([level, patterns]) => {
    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        severityCounts[level as keyof typeof severityCounts] += matches.length;
      }
    });
  });
  
  // Enhanced context-based scoring for both OpenAI and Ollama outputs
  
  // OpenAI-specific patterns
  if (text.includes('security and risk analysis') || text.includes('key risks')) {
    severityCounts.high += 2; // Boost for structured risk analysis
  }
  
  // Ollama-specific patterns (common section headers and content patterns)
  if (text.includes('## security') || text.includes('security differences') || text.includes('security analysis')) {
    severityCounts.high += 1;
  }
  
  // Ollama markdown headers that indicate security analysis
  if (text.includes('## security and risk analysis') || text.includes('**potential risks:**') || text.includes('**security concerns:**')) {
    severityCounts.high += 2;
  }
  
  // Look for structural comparisons that indicate potential issues
  if ((text.includes('differences') || text.includes('comparison')) && 
      (text.includes('security') || text.includes('risk') || text.includes('functionality'))) {
    severityCounts.medium += 1;
  }
  
  // Multiple risk indicators suggest higher severity
  const riskCount = (text.match(/\brisk\b/g) || []).length;
  const securityCount = (text.match(/\bsecurity\b/g) || []).length;
  const threatCount = (text.match(/\bthreat\b/g) || []).length;
  const impactCount = (text.match(/\bimpact\b/g) || []).length;
  const vulnerabilityCount = (text.match(/\bvulnerabilit(y|ies)\b/g) || []).length;
  const maliciousCount = (text.match(/\bmalicious\b/g) || []).length;
  
  // Score based on frequency of security-related terms
  if (riskCount >= 3 && securityCount >= 2) {
    severityCounts.high += 2;
  } else if (riskCount >= 2 || securityCount >= 2) {
    severityCounts.medium += 1;
  }
  
  if (threatCount >= 2) {
    severityCounts.high += 1;
  }
  
  if (impactCount >= 3) {
    severityCounts.medium += 1;
  }
  
  // Boost for specific vulnerability-related content
  if (vulnerabilityCount >= 1) {
    severityCounts.high += 1;
  }
  
  if (maliciousCount >= 1) {
    severityCounts.high += 1;
  }
  
  // Common phrases that indicate severity
  if (text.includes('introduces') && text.includes('risk')) severityCounts.high += 1;
  if (text.includes('poses') && text.includes('risk')) severityCounts.high += 1;
  if (text.includes('could impact') || text.includes('may impact')) severityCounts.medium += 1;
  if (text.includes('exploited') || text.includes('exploitation')) severityCounts.critical += 1;
  
  // Recommendations section indicates actionable security concerns
  if (text.includes('recommendations') || text.includes('mitigate')) {
    severityCounts.high += 1;
  }
  
  // Default scoring if we have any security/risk content but no specific matches
  if ((securityCount > 0 || riskCount > 0 || threatCount > 0) && 
      Math.max(...Object.values(severityCounts)) === 0) {
    severityCounts.medium += 1;
  }
  
  // Determine final severity based on highest count
  const maxCount = Math.max(...Object.values(severityCounts));
  if (maxCount === 0) return 'N/A';
  
  if (severityCounts.critical === maxCount) return 'Critical';
  if (severityCounts.high === maxCount) return 'High';
  if (severityCounts.medium === maxCount) return 'Medium';
  if (severityCounts.low === maxCount) return 'Low';
  
  return 'N/A';
};

const ComparisonsPage = () => {
  const { analyses } = useAnalyses();
  const { baselines } = useBaselines();
  const { provider: llmProvider, setProvider: setLlmProvider } = React.useContext(LLMProviderContext);
  const [selectedAnalysis, setSelectedAnalysis] = React.useState<number | null>(null);
  const [selectedBaseline, setSelectedBaseline] = React.useState<number | null>(null);
  const [selectedModel, setSelectedModel] = React.useState<string>('gpt-4o');
  const [savedResults, setSavedResults] = React.useState<{
    id: number,
    timestamp: string,
    result: string,
    analysisFileName?: string,
    baselineFileName?: string,
    provider?: string,
    model?: string
  }[]>([]);
  const [llmResult, setLlmResult] = React.useState<string | null>(null);
  const [llmLoading, setLlmLoading] = React.useState(false);
  const [llmError, setLlmError] = React.useState<string | null>(null);
  const [viewingSavedResult, setViewingSavedResult] = React.useState<string | null>(null);
  const [viewedSavedResultId, setViewedSavedResultId] = React.useState<number | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  // Handle provider and model changes
  const handleProviderChange = (provider: string) => {
    setLlmProvider(provider as 'openai' | 'ollama');
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
  };

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
      if (!selectedAnalysis || !selectedBaseline) {
        console.log('handleRunComparison: missing selection', { selectedAnalysis, selectedBaseline });
        return;
      }
      
      console.log('handleRunComparison: fetching analysis and baseline data...');
      const analysis = await getAnalysisById(Number(selectedAnalysis));
      const baseline = await getBaselineById(Number(selectedBaseline));
      
      console.log('handleRunComparison: got data', {
        analysis: analysis ? { id: analysis.id, fileName: analysis.fileName } : null,
        baseline: baseline ? { id: baseline.id, fileName: baseline.fileName } : null
      });
      
      const getFilePath = (obj: any) => {
        if (!obj) return '';
        
        // Try direct filePath property first
        if (obj.filePath && typeof obj.filePath === 'string' && obj.filePath.startsWith('/')) {
          return obj.filePath;
        }
        
        // Try analysis_json.filePath
        if (obj.analysis_json && obj.analysis_json.filePath && typeof obj.analysis_json.filePath === 'string' && obj.analysis_json.filePath.startsWith('/')) {
          return obj.analysis_json.filePath;
        }
        
        // Try fileName as filePath if it looks like a path
        if (obj.fileName && typeof obj.fileName === 'string' && obj.fileName.startsWith('/')) {
          return obj.fileName;
        }
        
        // Try analysis_json.fileName as filePath
        if (obj.analysis_json && obj.analysis_json.fileName && typeof obj.analysis_json.fileName === 'string' && obj.analysis_json.fileName.startsWith('/')) {
          return obj.analysis_json.fileName;
        }
        
        return '';
      };
      
      let analysisArg = getFilePath(analysis);
      let baselineArg = getFilePath(baseline);
      
      // If we don't have file paths, we need to create temporary files with the content
      if (!analysisArg || !baselineArg) {
        console.log('handleRunComparison: no valid file paths found, will use JSON content', {
          analysisHasPath: !!analysisArg,
          baselineHasPath: !!baselineArg
        });
        
        // For now, let's try with a smaller subset of the data
        const getAnalysisContent = (obj: any) => {
          if (!obj) return '{}';
          
          // Try to extract the core content without the full JSON
          const content = {
            fileName: obj.fileName || 'unknown',
            analysis_json: obj.analysis_json || {},
            // Include only essential fields to avoid huge payloads
          };
          
          return JSON.stringify(content);
        };
        
        analysisArg = analysisArg || getAnalysisContent(analysis);
        baselineArg = baselineArg || getAnalysisContent(baseline);
      }
      
      console.log('handleRunComparison: calling LLM comparison', {
        analysisArg: typeof analysisArg === 'string' ? analysisArg.substring(0, 100) + '...' : analysisArg,
        baselineArg: typeof baselineArg === 'string' ? baselineArg.substring(0, 100) + '...' : baselineArg,
        provider: llmProvider
      });
      
      const result = await llmCompareAnalysisToBaseline(analysisArg, baselineArg, llmProvider);
      
      console.log('handleRunComparison: got result', {
        result: result ? { hasComparison: !!result.llm_comparison, keys: Object.keys(result) } : null
      });
      
      setLlmResult(result?.llm_comparison || 'No LLM result.');
    } catch (e: any) {
      console.error('handleRunComparison: error', e);
      setLlmError(e?.message || 'LLM comparison failed.');
    } finally {
      setLlmLoading(false);
    }
  };

  // Save professional report to DB
  const handleSaveResult = async () => {
    if (selectedAnalysis && selectedBaseline && llmResult && !isSaving) {
      setIsSaving(true);
      try {
        const analysis = analyses.find((a: any) => a.id === selectedAnalysis);
        const baseline = baselines.find((b: any) => b.id === selectedBaseline);
        const analysisFileName = analysis?.fileName || '';
        const baselineFileName = baseline?.fileName || '';
        
        if (!analysisFileName || !baselineFileName) {
          return;
        }
        
        // @ts-ignore
        await window.electron.invoke('save-comparison-result', {
          timestamp: new Date().toISOString(),
          result: llmResult,
          analysisFileName,
          baselineFileName,
          provider: llmProvider,
          model: selectedModel
        });
        
        // Reload list
        // @ts-ignore
        const results = await window.electron.invoke('get-saved-comparisons');
        setSavedResults(results || []);
      } catch (error) {
        console.error('Error saving comparison result:', error);
      } finally {
        setIsSaving(false);
      }
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
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Provider</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Model</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Severity</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {savedResults.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-gray-400">No saved results yet.</td>
                </tr>
              ) : (
                (savedResults || []).map((r) => {
                  const severity = detectSeverity(r.result || '');
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
                        <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded border border-gray-300 bg-gray-100 text-gray-700">
                          {r.provider || 'N/A'}
                        </span>
                      </td>
                      <td className="py-2 px-3 align-middle">
                        <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded border border-gray-300 bg-gray-100 text-gray-700">
                          {r.model || 'N/A'}
                        </span>
                      </td>
                      <td className="py-2 px-3 align-middle">
                        <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full border border-gray-300 ${badgeColor}`}>{severity}</span>
                      </td>
                      <td className="py-2 px-3 align-middle">
                        <div className="flex gap-2 items-center">
                          <button
                            className="px-2 py-1 text-xs font-semibold bg-blue-600 text-white rounded shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transition"
                            onClick={() => {
                              setViewedSavedResultId(r.id);
                              setLlmResult(null); // Clear LLM result when viewing saved
                            }}
                          >
                            View
                          </button>
                          <button
                            className="px-2 py-1 text-xs font-semibold bg-red-600 text-white rounded shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50 transition"
                            onClick={async () => {
                              // @ts-ignore
                              await window.electron.invoke('delete-comparison-result', r.id);
                              setSavedResults(prev => prev.filter(sr => sr.id !== r.id));
                              if (viewedSavedResultId === r.id) setViewedSavedResultId(null);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Selection controls for analysis, baseline, and LLM settings */}
      <div className="bg-white rounded-xl shadow p-6 border mb-8">
        <h3 className="text-lg font-semibold mb-4">Run New Comparison</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block mb-2 text-sm font-semibold">Select Analysis</label>
            <select 
              className="w-full p-2 border rounded text-sm" 
              value={selectedAnalysis ?? ''} 
              onChange={e => setSelectedAnalysis(Number(e.target.value) || null)}
            >
              <option value="">-- Select Analysis --</option>
              {(analyses || []).map((a: any) => (
                <option key={a.id} value={a.id}>{a.fileName} ({a.date})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-2 text-sm font-semibold">Select Baseline</label>
            <select 
              className="w-full p-2 border rounded text-sm" 
              value={selectedBaseline ?? ''} 
              onChange={e => setSelectedBaseline(Number(e.target.value) || null)}
            >
              <option value="">-- Select Baseline --</option>
              {(baselines || []).map((b: any) => (
                <option key={b.id} value={b.id}>{b.fileName} ({b.date})</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-1 lg:col-span-1">
            <LLMProviderModelPicker
              selectedProvider={llmProvider}
              selectedModel={selectedModel}
              onProviderChange={handleProviderChange}
              onModelChange={handleModelChange}
              layout="vertical"
              size="sm"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            className="px-2 py-1 text-xs font-semibold bg-green-600 text-white rounded shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50 transition disabled:opacity-50"
            onClick={handleRunComparison}
            disabled={!selectedAnalysis || !selectedBaseline || llmLoading}
          >
            {llmLoading ? 'Comparing...' : 'Run Comparison'}
          </button>
          {llmLoading && (
            <div className="text-sm text-gray-600">
              Analyzing with {llmProvider} ({selectedModel})...
            </div>
          )}
        </div>
      </div>
      
      {/* Professional PLC Code Comparison Report */}
      <div className="bg-white rounded-xl shadow p-6 border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-blue-900">PLC Code Comparison Report</h3>
          <button
            className="px-2 py-1 text-xs font-semibold bg-blue-600 text-white rounded shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transition disabled:opacity-50"
            onClick={handleSaveResult}
            disabled={!llmResult || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Result'}
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
