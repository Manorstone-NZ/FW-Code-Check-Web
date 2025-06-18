"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const React = __importStar(require("react"));
const react_router_dom_1 = require("react-router-dom");
const analysisApi_1 = require("../utils/analysisApi");
const AnalysisDetails_1 = __importDefault(require("../components/AnalysisDetails"));
const normalizeAnalysis_1 = require("../utils/normalizeAnalysis");
const debugLog_1 = require("../utils/debugLog");
const AnalysisDetailsPage = () => {
    const { id } = (0, react_router_dom_1.useParams)();
    const [analysis, setAnalysis] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [lastUpdated, setLastUpdated] = React.useState(null);
    const [highlight, setHighlight] = React.useState(false);
    React.useEffect(() => {
        if (!id)
            return;
        (0, debugLog_1.debugLog)('navigate-analysis-details', { analysisId: id });
        setLoading(true);
        setError(null);
        (0, analysisApi_1.getAnalysisById)(Number(id))
            .then(a => {
            var _a;
            // Patch: Ensure analysis always has a unique id for rendering
            let normalized = (0, normalizeAnalysis_1.normalizeInstructionAnalysis)(a);
            if (!normalized.id) {
                normalized.id = a.id || ((_a = a.analysis_json) === null || _a === void 0 ? void 0 : _a.id) || a.fileName || Date.now();
            }
            setAnalysis(normalized);
            setLastUpdated(new Date());
            setHighlight(true);
            setTimeout(() => setHighlight(false), 1200);
            (0, debugLog_1.debugLog)('analysis-details-page-loaded', { analysisId: normalized.id, hasLLM: !!(a === null || a === void 0 ? void 0 : a.llm_result) });
            // Debug log hook: log when AnalysisDetailsPage loads an analysis with LLM results
            if (window.electron && typeof window.electron.invoke === 'function') {
                window.electron.invoke('debug-log-hook', {
                    event: 'render-analysis-details-page',
                    analysisId: normalized.id,
                    hasLLM: !!(a === null || a === void 0 ? void 0 : a.llm_result),
                    timestamp: new Date().toISOString(),
                });
            }
        })
            .catch(e => {
            setError(e.message || 'Failed to load analysis');
            (0, debugLog_1.debugLog)('analysis-details-page-error', { analysisId: id, error: e.message });
        })
            .finally(() => setLoading(false));
    }, [id]);
    // Manual reload handler
    const handleReload = () => {
        (0, debugLog_1.debugLog)('analysis-details-manual-reload', { analysisId: id });
        setLoading(true);
        setError(null);
        (0, analysisApi_1.getAnalysisById)(Number(id))
            .then(a => {
            var _a;
            // Patch: Ensure analysis always has a unique id for rendering
            let normalized = (0, normalizeAnalysis_1.normalizeInstructionAnalysis)(a);
            if (!normalized.id) {
                normalized.id = a.id || ((_a = a.analysis_json) === null || _a === void 0 ? void 0 : _a.id) || a.fileName || Date.now();
            }
            setAnalysis(normalized);
            setLastUpdated(new Date());
            setHighlight(true);
            setTimeout(() => setHighlight(false), 1200);
            (0, debugLog_1.debugLog)('analysis-details-page-reloaded', { analysisId: normalized.id });
        })
            .catch(e => {
            setError(e.message || 'Failed to reload analysis');
            (0, debugLog_1.debugLog)('analysis-details-page-reload-error', { analysisId: id, error: e.message });
        })
            .finally(() => setLoading(false));
    };
    return (React.createElement("div", { className: `max-w-3xl mx-auto p-6 transition ${highlight ? 'ring-4 ring-blue-200' : ''}` },
        React.createElement("div", { className: "flex items-center justify-between mb-2" },
            React.createElement("div", { className: "text-xs text-gray-400" }, lastUpdated && React.createElement("span", null,
                "Last updated: ",
                lastUpdated.toLocaleTimeString())),
            React.createElement("button", { className: "px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition", onClick: handleReload }, "Reload")),
        loading && React.createElement("p", null, "Loading..."),
        error && React.createElement("p", { className: "text-red-600" }, error),
        analysis && React.createElement(AnalysisDetails_1.default, { analysis: analysis })));
};
exports.default = AnalysisDetailsPage;
