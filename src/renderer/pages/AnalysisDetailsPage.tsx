import * as React from 'react';
import { useParams } from 'react-router-dom';
import { getAnalysisById } from '../utils/analysisApi';
import AnalysisDetails from '../components/AnalysisDetails';
import { normalizeInstructionAnalysis } from '../utils/normalizeAnalysis';
import { debugLog } from '../utils/debugLog';

const AnalysisDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [analysis, setAnalysis] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);
  const [highlight, setHighlight] = React.useState(false);

  React.useEffect(() => {
    if (!id) return;
    debugLog('navigate-analysis-details', { analysisId: id });
    setLoading(true);
    setError(null);
    getAnalysisById(Number(id))
      .then(a => {
        // Patch: Ensure analysis always has a unique id for rendering
        let normalized = normalizeInstructionAnalysis(a);
        if (!normalized.id) {
          normalized.id = a.id || a.analysis_json?.id || a.fileName || Date.now();
        }
        setAnalysis(normalized);
        setLastUpdated(new Date());
        setHighlight(true);
        setTimeout(() => setHighlight(false), 1200);
        debugLog('analysis-details-page-loaded', { analysisId: normalized.id, hasLLM: !!a?.llm_result });
        // Debug log hook: log when AnalysisDetailsPage loads an analysis with LLM results
        if (window.electron && typeof (window.electron as any).invoke === 'function') {
          (window.electron as any).invoke('debug-log-hook', {
            event: 'render-analysis-details-page',
            analysisId: normalized.id,
            hasLLM: !!a?.llm_result,
            timestamp: new Date().toISOString(),
          });
        }
      })
      .catch(e => {
        setError(e.message || 'Failed to load analysis');
        debugLog('analysis-details-page-error', { analysisId: id, error: e.message });
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Manual reload handler
  const handleReload = () => {
    debugLog('analysis-details-manual-reload', { analysisId: id });
    setLoading(true);
    setError(null);
    getAnalysisById(Number(id))
      .then(a => {
        // Patch: Ensure analysis always has a unique id for rendering
        let normalized = normalizeInstructionAnalysis(a);
        if (!normalized.id) {
          normalized.id = a.id || a.analysis_json?.id || a.fileName || Date.now();
        }
        setAnalysis(normalized);
        setLastUpdated(new Date());
        setHighlight(true);
        setTimeout(() => setHighlight(false), 1200);
        debugLog('analysis-details-page-reloaded', { analysisId: normalized.id });
      })
      .catch(e => {
        setError(e.message || 'Failed to reload analysis');
        debugLog('analysis-details-page-reload-error', { analysisId: id, error: e.message });
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className={`max-w-3xl mx-auto p-6 transition ${highlight ? 'ring-4 ring-blue-200' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-gray-400">
          {lastUpdated && <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>}
        </div>
        <button
          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
          onClick={handleReload}
        >
          Reload
        </button>
      </div>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {analysis && <AnalysisDetails analysis={analysis} />}
    </div>
  );
};

export default AnalysisDetailsPage;
