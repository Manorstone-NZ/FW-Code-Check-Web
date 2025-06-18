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
const react_markdown_1 = __importDefault(require("react-markdown"));
const CompareAnalysisToBaseline = ({ analysisId }) => {
    const { baselines } = (0, analysisApi_1.useBaselines)();
    const [selectedBaseline, setSelectedBaseline] = React.useState(null);
    const [analysis, setAnalysis] = React.useState(null);
    const [baseline, setBaseline] = React.useState(null);
    const [diff, setDiff] = React.useState(null);
    const [llmResult, setLlmResult] = React.useState(null);
    const [llmLoading, setLlmLoading] = React.useState(false);
    const [llmError, setLlmError] = React.useState(null);
    const [history, setHistory] = React.useState([]);
    const [showHistory, setShowHistory] = React.useState(false);
    React.useEffect(() => {
        if (analysisId) {
            (0, analysisApi_1.getAnalysisById)(analysisId).then(setAnalysis);
        }
    }, [analysisId]);
    React.useEffect(() => {
        if (selectedBaseline) {
            (0, analysisApi_1.getBaselineById)(selectedBaseline).then(setBaseline);
        }
    }, [selectedBaseline]);
    React.useEffect(() => {
        if (analysis && baseline) {
            // Simple diff: show keys that differ
            const aStr = JSON.stringify(analysis, null, 2);
            const bStr = JSON.stringify(baseline, null, 2);
            setDiff(aStr === bStr ? 'No differences.' : 'Analysis and baseline differ.');
        }
        else {
            setDiff(null);
        }
    }, [analysis, baseline]);
    React.useEffect(() => {
        if (analysis && baseline) {
            // Fetch comparison history for this pair
            Promise.resolve().then(() => __importStar(require('../utils/analysisApi'))).then(api => {
                api.listComparisonHistory(analysis.id, baseline.id).then(setHistory);
            });
        }
    }, [analysis, baseline]);
    // Helper to get file paths for LLM comparison (must be a real file path)
    const getFilePath = (obj) => {
        if (!obj)
            return '';
        // Prefer top-level filePath
        if (obj.filePath)
            return obj.filePath;
        // Check inside analysis_json/filePath (for analyses)
        if (obj.analysis_json && obj.analysis_json.filePath)
            return obj.analysis_json.filePath;
        // Fallback: top-level fileName if absolute
        if (obj.fileName && typeof obj.fileName === 'string' && obj.fileName.startsWith('/'))
            return obj.fileName;
        // Fallback: inside analysis_json.fileName if absolute
        if (obj.analysis_json && obj.analysis_json.fileName && obj.analysis_json.fileName.startsWith('/'))
            return obj.analysis_json.fileName;
        return '';
    };
    const handleLlmCompare = () => __awaiter(void 0, void 0, void 0, function* () {
        setLlmLoading(true);
        setLlmError(null);
        setLlmResult(null);
        try {
            let analysisPath = getFilePath(analysis);
            let baselinePath = getFilePath(baseline);
            let analysisArg = analysisPath;
            let baselineArg = baselinePath;
            // If file paths are missing, use file content (as JSON string)
            if (!analysisPath && analysis) {
                analysisArg = JSON.stringify(analysis);
            }
            if (!baselinePath && baseline) {
                baselineArg = JSON.stringify(baseline);
            }
            if (!analysisArg || !baselineArg)
                throw new Error('Cannot find the original file paths or content for LLM comparison. Please ensure you are comparing files that exist on disk or have content.');
            const result = yield (0, analysisApi_1.llmCompareAnalysisToBaseline)(analysisArg, baselineArg);
            setLlmResult((result === null || result === void 0 ? void 0 : result.llm_comparison) || 'No LLM result.');
        }
        catch (e) {
            setLlmError(e.message || 'LLM comparison failed.');
        }
        finally {
            setLlmLoading(false);
        }
    });
    // Helper to split Markdown into sections by ## headers
    const splitMarkdownSections = (md) => {
        if (!md)
            return [];
        const lines = md.split(/\r?\n/);
        const sections = [];
        let current = [];
        for (let line of lines) {
            if (line.startsWith('## ')) {
                if (current.length)
                    sections.push(current.join('\n'));
                current = [line];
            }
            else {
                current.push(line);
            }
        }
        if (current.length)
            sections.push(current.join('\n'));
        return sections;
    };
    // Helper to get highest severity for an analysis or baseline (copied from AnalysisPage)
    function getHighestSeverity(obj) {
        var _a, _b;
        const levels = ['critical', 'high', 'medium', 'low'];
        const colors = {
            critical: 'bg-red-700 text-white',
            high: 'bg-yellow-500 text-black',
            medium: 'bg-green-500 text-white',
            low: 'bg-blue-500 text-white',
        };
        let found = null;
        if (Array.isArray((_a = obj.analysis_json) === null || _a === void 0 ? void 0 : _a.instruction_analysis)) {
            for (const level of levels) {
                if (obj.analysis_json.instruction_analysis.some((i) => (i.risk_level || '').toLowerCase() === level)) {
                    found = level;
                    break;
                }
            }
        }
        if (!found && Array.isArray((_b = obj.analysis_json) === null || _b === void 0 ? void 0 : _b.vulnerabilities)) {
            for (const level of levels) {
                if (obj.analysis_json.vulnerabilities.some((v) => (typeof v === 'string' ? v.toLowerCase().includes(level) : JSON.stringify(v).toLowerCase().includes(level)))) {
                    found = level;
                    break;
                }
            }
        }
        if (!found)
            return { label: 'None', color: 'bg-gray-400 text-white' };
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
        if (!llmResult)
            return;
        const blob = new Blob([llmResult], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'llm_comparison.md';
        a.click();
        URL.revokeObjectURL(url);
    };
    // Helper to copy LLM result
    const handleCopy = () => __awaiter(void 0, void 0, void 0, function* () {
        if (!llmResult)
            return;
        yield navigator.clipboard.writeText(llmResult);
    });
    return (React.createElement("div", null,
        React.createElement("label", { className: "block mb-2" }, "Select Baseline to Compare:"),
        React.createElement("select", { className: "mb-4 p-2 border rounded", value: selectedBaseline !== null && selectedBaseline !== void 0 ? selectedBaseline : '', onChange: e => setSelectedBaseline(Number(e.target.value)) },
            React.createElement("option", { value: "" }, "-- Select Baseline --"),
            baselines.map((b) => (React.createElement("option", { key: b.id, value: b.id },
                b.fileName,
                " (",
                b.date,
                ")")))),
        !analysis && React.createElement("div", { className: "mb-4 text-yellow-700 bg-yellow-100 p-2 rounded" }, "No analysis selected. Please select an analysis to compare."),
        !selectedBaseline && React.createElement("div", { className: "mb-4 text-blue-700 bg-blue-100 p-2 rounded" }, "Please select a baseline to compare against."),
        diff && React.createElement("div", { className: "mb-2 font-mono text-sm" }, diff),
        analysis && baseline && (React.createElement(React.Fragment, null,
            React.createElement("div", { className: "grid grid-cols-2 gap-4 mb-2" },
                React.createElement("div", { className: "flex items-center gap-2 bg-gray-50 rounded p-2 border" },
                    React.createElement("span", { className: "font-semibold" }, "Analysis:"),
                    React.createElement("span", null, analysis.fileName),
                    React.createElement("span", { className: "text-xs text-gray-500" }, analysis.date),
                    React.createElement("span", { className: `inline-block px-2 py-0.5 text-xs font-semibold rounded-full border border-gray-300 ${getHighestSeverity(analysis).color}` }, getHighestSeverity(analysis).label)),
                React.createElement("div", { className: "flex items-center gap-2 bg-gray-50 rounded p-2 border" },
                    React.createElement("span", { className: "font-semibold" }, "Baseline:"),
                    React.createElement("span", null, baseline.fileName),
                    React.createElement("span", { className: "text-xs text-gray-500" }, baseline.date),
                    React.createElement("span", { className: `inline-block px-2 py-0.5 text-xs font-semibold rounded-full border border-gray-300 ${getHighestSeverity(baseline).color}` }, getHighestSeverity(baseline).label))),
            React.createElement("div", { className: "grid grid-cols-2 gap-4 mb-4" },
                React.createElement("div", null,
                    React.createElement("h4", { className: "font-semibold mb-1" }, "Analysis (Raw JSON)"),
                    React.createElement("pre", { className: "bg-white p-2 rounded text-xs overflow-x-auto max-h-64" }, JSON.stringify(analysis, null, 2))),
                React.createElement("div", null,
                    React.createElement("h4", { className: "font-semibold mb-1" }, "Baseline (Raw JSON)"),
                    React.createElement("pre", { className: "bg-white p-2 rounded text-xs overflow-x-auto max-h-64" }, JSON.stringify(baseline, null, 2)))))),
        React.createElement("div", { className: "flex gap-2 mb-4" },
            React.createElement("button", { className: "px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 disabled:opacity-50", onClick: handleLlmCompare, disabled: !canCompare }, llmLoading ? 'Comparing with LLM...' : 'Get LLM-Powered Detailed Comparison'),
            React.createElement("button", { className: "px-4 py-2 bg-gray-200 text-gray-800 rounded shadow hover:bg-gray-300 disabled:opacity-50", onClick: handleClear, disabled: llmLoading && !selectedBaseline && !analysis }, "Clear"),
            React.createElement("button", { className: "px-4 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700 disabled:opacity-50", onClick: handleDownload, disabled: !llmResult }, "Download Result"),
            React.createElement("button", { className: "px-4 py-2 bg-yellow-500 text-black rounded shadow hover:bg-yellow-600 disabled:opacity-50", onClick: handleCopy, disabled: !llmResult }, "Copy to Clipboard")),
        llmError && React.createElement("div", { className: "text-red-600 mt-2" }, llmError),
        llmResult && (React.createElement("div", { className: "mt-4" },
            React.createElement("h2", { className: "text-2xl font-bold mb-4" }, "LLM-Powered PLC File Comparison"),
            React.createElement("h4", { className: "font-semibold mb-2" }, "LLM Detailed Comparison"),
            React.createElement("button", { className: "mb-2 px-2 py-1 bg-gray-200 rounded", onClick: () => setShowHistory(h => !h) },
                showHistory ? 'Hide' : 'Show',
                " Comparison History"),
            showHistory && history.length > 0 && (React.createElement("div", { className: "mb-4 border rounded bg-gray-50 p-2 max-h-64 overflow-auto" },
                React.createElement("div", { className: "font-semibold mb-1" }, "Past Comparisons"),
                history.map(h => (React.createElement("div", { key: h.id, className: "mb-2 p-2 border-b last:border-b-0 cursor-pointer hover:bg-blue-50", onClick: () => setLlmResult(h.llm_result) },
                    React.createElement("div", { className: "text-xs text-gray-600" }, new Date(h.timestamp).toLocaleString()),
                    React.createElement("div", { className: "truncate text-xs" },
                        h.llm_result.slice(0, 120),
                        "...")))))),
            splitMarkdownSections(llmResult).map((section, idx) => (React.createElement("div", { key: idx, className: "mb-8 p-4 bg-white border rounded shadow-sm" },
                React.createElement(react_markdown_1.default, null, section))))))));
};
exports.default = CompareAnalysisToBaseline;
