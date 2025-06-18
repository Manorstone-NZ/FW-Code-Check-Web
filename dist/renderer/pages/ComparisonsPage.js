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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const React = __importStar(require("react"));
const analysisApi_1 = require("../utils/analysisApi");
const ComparisonProfessionalPanel_1 = __importDefault(require("./ComparisonProfessionalPanel"));
const App_1 = require("../App");
const ComparisonsPage = () => {
    const { analyses } = (0, analysisApi_1.useAnalyses)();
    const { baselines } = (0, analysisApi_1.useBaselines)();
    const { provider: llmProvider } = React.useContext(App_1.LLMProviderContext);
    const [selectedAnalysis, setSelectedAnalysis] = React.useState(null);
    const [selectedBaseline, setSelectedBaseline] = React.useState(null);
    const [savedResults, setSavedResults] = React.useState([]);
    const [llmResult, setLlmResult] = React.useState(null);
    const [llmLoading, setLlmLoading] = React.useState(false);
    const [llmError, setLlmError] = React.useState(null);
    const [viewingSavedResult, setViewingSavedResult] = React.useState(null);
    const [viewedSavedResultId, setViewedSavedResultId] = React.useState(null);
    // Load saved results from DB on mount
    React.useEffect(() => {
        // @ts-ignore
        window.electron.invoke('get-saved-comparisons').then((results) => {
            // Map llm_result to result for compatibility if needed
            const mapped = (results || []).map(r => {
                if (r.llm_result && !r.result) {
                    return Object.assign(Object.assign({}, r), { result: r.llm_result });
                }
                return r;
            });
            setSavedResults(mapped);
        });
    }, []);
    const handleRunComparison = () => __awaiter(void 0, void 0, void 0, function* () {
        setLlmResult(null);
        setLlmError(null);
        setLlmLoading(true);
        try {
            if (!selectedAnalysis || !selectedBaseline)
                return;
            const analysis = yield (0, analysisApi_1.getAnalysisById)(Number(selectedAnalysis));
            const baseline = yield (0, analysisApi_1.getBaselineById)(Number(selectedBaseline));
            const getFilePath = (obj) => {
                if (!obj)
                    return '';
                if (obj.filePath)
                    return obj.filePath;
                if (obj.analysis_json && obj.analysis_json.filePath)
                    return obj.analysis_json.filePath;
                if (obj.fileName && typeof obj.fileName === 'string' && obj.fileName.startsWith('/'))
                    return obj.fileName;
                if (obj.analysis_json && obj.analysis_json.fileName && obj.analysis_json.fileName.startsWith('/'))
                    return obj.analysis_json.fileName;
                return '';
            };
            let analysisArg = getFilePath(analysis) || JSON.stringify(analysis);
            let baselineArg = getFilePath(baseline) || JSON.stringify(baseline);
            const result = yield (0, analysisApi_1.llmCompareAnalysisToBaseline)(analysisArg, baselineArg, llmProvider);
            setLlmResult((result === null || result === void 0 ? void 0 : result.llm_comparison) || 'No LLM result.');
        }
        catch (e) {
            setLlmError((e === null || e === void 0 ? void 0 : e.message) || 'LLM comparison failed.');
        }
        finally {
            setLlmLoading(false);
        }
    });
    // Save professional report to DB
    const handleSaveResult = () => __awaiter(void 0, void 0, void 0, function* () {
        if (selectedAnalysis && selectedBaseline && llmResult) {
            const analysis = analyses.find((a) => a.id === selectedAnalysis);
            const baseline = baselines.find((b) => b.id === selectedBaseline);
            const analysisFileName = (analysis === null || analysis === void 0 ? void 0 : analysis.fileName) || '';
            const baselineFileName = (baseline === null || baseline === void 0 ? void 0 : baseline.fileName) || '';
            if (!analysisFileName || !baselineFileName)
                return;
            // @ts-ignore
            yield window.electron.invoke('save-comparison-result', {
                timestamp: new Date().toISOString(),
                result: llmResult,
                analysisFileName,
                baselineFileName
            });
            // Reload list
            // @ts-ignore
            window.electron.invoke('get-saved-comparisons').then((results) => {
                setSavedResults(results || []);
            });
        }
    });
    return (React.createElement("div", { className: "p-6 max-w-5xl mx-auto" },
        React.createElement("div", { className: "mb-8" },
            React.createElement("div", { className: "bg-white rounded-xl shadow p-4 border" },
                React.createElement("div", { className: "font-bold text-lg mb-3" }, "Saved Results"),
                React.createElement("table", { className: "min-w-full text-sm" },
                    React.createElement("thead", null,
                        React.createElement("tr", { className: "border-b" },
                            React.createElement("th", { className: "text-left py-2 px-3 font-semibold text-gray-700" }, "Date"),
                            React.createElement("th", { className: "text-left py-2 px-3 font-semibold text-gray-700" }, "Files"),
                            React.createElement("th", { className: "text-left py-2 px-3 font-semibold text-gray-700" }, "Severity"),
                            React.createElement("th", { className: "text-left py-2 px-3 font-semibold text-gray-700" }, "Actions"))),
                    React.createElement("tbody", null, savedResults.length === 0 ? (React.createElement("tr", null,
                        React.createElement("td", { colSpan: 4, className: "py-4 text-center text-gray-400" }, "No saved results yet."))) : (savedResults.map((r) => {
                        let severity = 'N/A';
                        const resultText = r.result || '';
                        const high = /\bhigh\b/i.test(resultText);
                        const critical = /\bcritical\b/i.test(resultText);
                        const medium = /\bmedium\b/i.test(resultText);
                        const low = /\blow\b/i.test(resultText);
                        if (critical)
                            severity = 'Critical';
                        else if (high)
                            severity = 'High';
                        else if (medium)
                            severity = 'Medium';
                        else if (low)
                            severity = 'Low';
                        let files = (r.analysisFileName && r.baselineFileName)
                            ? `${r.analysisFileName} vs ${r.baselineFileName}`
                            : 'Analysis vs Baseline';
                        const badgeColor = severity === 'Critical' ? 'bg-red-700 text-white' :
                            severity === 'High' ? 'bg-yellow-500 text-black' :
                                severity === 'Medium' ? 'bg-green-500 text-white' :
                                    severity === 'Low' ? 'bg-blue-500 text-white' :
                                        'bg-gray-300 text-gray-700';
                        return (React.createElement("tr", { key: r.id, className: "border-b last:border-0 hover:bg-blue-50" },
                            React.createElement("td", { className: "py-2 px-3 align-middle" }, new Date(r.timestamp).toLocaleString()),
                            React.createElement("td", { className: "py-2 px-3 align-middle" }, files),
                            React.createElement("td", { className: "py-2 px-3 align-middle" },
                                React.createElement("span", { className: `inline-block px-2 py-0.5 text-xs font-semibold rounded-full border border-gray-300 ${badgeColor}` }, severity)),
                            React.createElement("td", { className: "py-2 px-3 align-middle" },
                                React.createElement("button", { className: "mr-2 px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 text-xs border border-blue-300", onClick: () => {
                                        setViewedSavedResultId(r.id);
                                        setLlmResult(null); // Clear LLM result when viewing saved
                                    } }, "View"),
                                React.createElement("button", { className: "px-2 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 text-xs border border-red-300", onClick: () => __awaiter(void 0, void 0, void 0, function* () {
                                        // @ts-ignore
                                        yield window.electron.invoke('delete-comparison-result', r.id);
                                        setSavedResults(prev => prev.filter(sr => sr.id !== r.id));
                                        if (viewedSavedResultId === r.id)
                                            setViewedSavedResultId(null);
                                    }) }, "Delete"))));
                    })))))),
        React.createElement("div", { className: "flex gap-4 mb-8" },
            React.createElement("div", null,
                React.createElement("label", { className: "block mb-1 font-semibold" }, "Select Analysis"),
                React.createElement("select", { className: "p-2 border rounded w-56", value: selectedAnalysis !== null && selectedAnalysis !== void 0 ? selectedAnalysis : '', onChange: e => setSelectedAnalysis(Number(e.target.value) || null) },
                    React.createElement("option", { value: "" }, "-- Select Analysis --"),
                    analyses.map((a) => (React.createElement("option", { key: a.id, value: a.id },
                        a.fileName,
                        " (",
                        a.date,
                        ")"))))),
            React.createElement("div", null,
                React.createElement("label", { className: "block mb-1 font-semibold" }, "Select Baseline"),
                React.createElement("select", { className: "p-2 border rounded w-56", value: selectedBaseline !== null && selectedBaseline !== void 0 ? selectedBaseline : '', onChange: e => setSelectedBaseline(Number(e.target.value) || null) },
                    React.createElement("option", { value: "" }, "-- Select Baseline --"),
                    baselines.map((b) => (React.createElement("option", { key: b.id, value: b.id },
                        b.fileName,
                        " (",
                        b.date,
                        ")"))))),
            React.createElement("div", { className: "flex items-end" },
                React.createElement("button", { className: "ml-4 px-4 py-2 bg-blue-700 text-white rounded shadow hover:bg-blue-800 text-sm disabled:opacity-50", onClick: handleRunComparison, disabled: !selectedAnalysis || !selectedBaseline || llmLoading }, llmLoading ? 'Comparing...' : 'Run LLM Comparison'))),
        React.createElement("div", { className: "mb-8" },
            React.createElement("div", { className: "flex items-center gap-2 mb-4" },
                React.createElement("h3", { className: "text-2xl font-bold text-blue-900" }, "PLC Code Comparison Report"),
                React.createElement("button", { className: "ml-4 px-3 py-1 bg-blue-600 text-white rounded shadow hover:bg-blue-700 disabled:opacity-50 text-sm", onClick: handleSaveResult, disabled: !llmResult }, "Save Result")),
            llmError && React.createElement("div", { className: "mb-4 text-red-700 bg-red-50 border border-red-200 rounded p-3 font-semibold" }, llmError),
            React.createElement("div", null, (() => {
                if (llmResult) {
                    return React.createElement(ComparisonProfessionalPanel_1.default, { markdown: llmResult });
                }
                if (viewedSavedResultId) {
                    const saved = savedResults.find(r => r.id === viewedSavedResultId);
                    if (saved)
                        return React.createElement(ComparisonProfessionalPanel_1.default, { markdown: saved.result });
                }
                return React.createElement("div", { className: "text-gray-400 italic" }, "Run a comparison to see results.");
            })()))));
};
exports.default = ComparisonsPage;
