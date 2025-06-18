"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncOTThreatIntel = exports.analyzeFile = exports.listComparisonHistory = exports.llmCompareAnalysisToBaseline = exports.useLLMStatus = exports.deleteAnalysis = exports.deleteBaseline = exports.saveBaseline = exports.getBaselineById = exports.useBaselines = exports.getAnalysisById = exports.useAnalyses = void 0;
/// <reference types="react" />
const react_1 = require("react");
function useAnalyses() {
    const [analyses, setAnalyses] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const fetchAnalyses = (0, react_1.useCallback)(() => __awaiter(this, void 0, void 0, function* () {
        setLoading(true);
        setError(null);
        try {
            // @ts-ignore
            const data = yield window.electron.invoke('list-analyses');
            setAnalyses(data);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load analyses');
        }
        setLoading(false);
    }), []);
    (0, react_1.useEffect)(() => {
        fetchAnalyses();
    }, [fetchAnalyses]);
    return { analyses, loading, error, refresh: fetchAnalyses };
}
exports.useAnalyses = useAnalyses;
function getAnalysisById(id) {
    return __awaiter(this, void 0, void 0, function* () {
        // @ts-ignore
        return yield window.electron.invoke('get-analysis', id);
    });
}
exports.getAnalysisById = getAnalysisById;
function useBaselines() {
    const [baselines, setBaselines] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const fetchBaselines = (0, react_1.useCallback)(() => __awaiter(this, void 0, void 0, function* () {
        setLoading(true);
        setError(null);
        try {
            // @ts-ignore
            const data = yield window.electron.invoke('list-baselines');
            setBaselines(data);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load baselines');
        }
        setLoading(false);
    }), []);
    (0, react_1.useEffect)(() => {
        fetchBaselines();
    }, [fetchBaselines]);
    return { baselines, loading, error, refresh: fetchBaselines };
}
exports.useBaselines = useBaselines;
function getBaselineById(id) {
    return __awaiter(this, void 0, void 0, function* () {
        // @ts-ignore
        return yield window.electron.invoke('get-baseline', id);
    });
}
exports.getBaselineById = getBaselineById;
function saveBaseline(fileName, originalName, filePath, analysis_json) {
    return __awaiter(this, void 0, void 0, function* () {
        // @ts-ignore
        return yield window.electron.invoke('save-baseline', fileName, originalName, filePath, analysis_json);
    });
}
exports.saveBaseline = saveBaseline;
function deleteBaseline(id) {
    return __awaiter(this, void 0, void 0, function* () {
        // @ts-ignore
        return yield window.electron.invoke('delete-baseline', id);
    });
}
exports.deleteBaseline = deleteBaseline;
function deleteAnalysis(id) {
    return __awaiter(this, void 0, void 0, function* () {
        // @ts-ignore
        return yield window.electron.invoke('delete-analysis', id);
    });
}
exports.deleteAnalysis = deleteAnalysis;
function useLLMStatus(pollInterval = 60000) {
    const [status, setStatus] = (0, react_1.useState)('checking');
    const [error, setError] = (0, react_1.useState)(null);
    const checkStatus = (0, react_1.useCallback)(() => __awaiter(this, void 0, void 0, function* () {
        setStatus('checking');
        setError(null);
        try {
            // @ts-ignore
            const result = yield window.electron.invoke('check-llm-status');
            if (result && result.ok) {
                setStatus('online');
            }
            else {
                setStatus('offline');
                setError((result === null || result === void 0 ? void 0 : result.error) || 'Unknown error');
            }
        }
        catch (e) {
            setStatus('offline');
            setError(e instanceof Error ? e.message : 'Failed to check LLM status');
        }
    }), []);
    (0, react_1.useEffect)(() => {
        checkStatus();
        if (pollInterval > 0) {
            const interval = setInterval(checkStatus, pollInterval);
            return () => clearInterval(interval);
        }
    }, [checkStatus, pollInterval]);
    return { status, error, refresh: checkStatus };
}
exports.useLLMStatus = useLLMStatus;
function llmCompareAnalysisToBaseline(analysisPathOrContent, baselinePathOrContent, provider) {
    return __awaiter(this, void 0, void 0, function* () {
        // @ts-ignore
        return yield window.electron.invoke('llm-compare-analysis-baseline', analysisPathOrContent, baselinePathOrContent, provider);
    });
}
exports.llmCompareAnalysisToBaseline = llmCompareAnalysisToBaseline;
function listComparisonHistory(analysisId, baselineId) {
    return __awaiter(this, void 0, void 0, function* () {
        // @ts-ignore
        return yield window.electron.invoke('list-comparison-history', analysisId, baselineId);
    });
}
exports.listComparisonHistory = listComparisonHistory;
function analyzeFile(filePath, provider) {
    return __awaiter(this, void 0, void 0, function* () {
        // @ts-ignore
        return yield window.electron.invoke('analyze-file', filePath, provider);
    });
}
exports.analyzeFile = analyzeFile;
function syncOTThreatIntel(provider) {
    return __awaiter(this, void 0, void 0, function* () {
        // @ts-ignore
        return yield window.electron.invoke('sync-ot-threat-intel', provider);
    });
}
exports.syncOTThreatIntel = syncOTThreatIntel;
