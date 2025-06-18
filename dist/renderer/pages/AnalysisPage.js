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
const CompareAnalysisToBaseline_1 = __importDefault(require("../pages/CompareAnalysisToBaseline"));
const AnalysisDetails_1 = __importDefault(require("../components/AnalysisDetails"));
const react_router_dom_1 = require("react-router-dom");
const normalizeAnalysis_1 = require("../utils/normalizeAnalysis");
const debugLog_1 = require("../utils/debugLog");
const AnalysisPage = () => {
    const { analyses, loading, error, refresh } = (0, analysisApi_1.useAnalyses)();
    const [details, setDetails] = React.useState(null);
    const [compareId, setCompareId] = React.useState(null);
    const [lastUpdated, setLastUpdated] = React.useState(null);
    const [highlightRow, setHighlightRow] = React.useState(null);
    const location = (0, react_router_dom_1.useLocation)();
    // Filtering logic based on query params
    const params = new URLSearchParams(location.search);
    const showVuln = params.get('vuln') === '1';
    const showAlarms = params.get('alarms') === '1';
    let filteredAnalyses = analyses;
    if (showVuln) {
        filteredAnalyses = analyses.filter(a => {
            var _a;
            // Accept vulnerabilities if array exists and has any non-falsy value (string, object, number, etc.)
            const vulns = (_a = a.analysis_json) === null || _a === void 0 ? void 0 : _a.vulnerabilities;
            return Array.isArray(vulns) && vulns.some((v) => {
                if (typeof v === 'string')
                    return v.trim().length > 0;
                if (typeof v === 'object' && v !== null)
                    return Object.keys(v).length > 0;
                if (typeof v === 'number')
                    return true;
                return !!v;
            });
        });
    }
    else if (showAlarms) {
        filteredAnalyses = analyses.filter(a => {
            var _a;
            // Accept alarms if any instruction_analysis entry has 'alarm' in any field, or if any field is an object containing 'alarm'
            const instr = (_a = a.analysis_json) === null || _a === void 0 ? void 0 : _a.instruction_analysis;
            return Array.isArray(instr) && instr.some((i) => {
                const allFields = Object.values(i).map(val => (typeof val === 'string' ? val.toLowerCase() : JSON.stringify(val).toLowerCase()));
                return allFields.some(val => val && val.includes('alarm'));
            });
        });
    }
    React.useEffect(() => {
        (0, debugLog_1.debugLog)('navigate-analysis', {
            analysesCount: analyses.length,
            filteredAnalysesCount: filteredAnalyses.length,
            loading,
            error
        });
        setLastUpdated(new Date());
    }, [analyses, filteredAnalyses, loading, error]);
    // Auto-select the most recent (or first) analysis by default
    React.useEffect(() => {
        if (!details && filteredAnalyses.length > 0) {
            // Sort by date descending, fallback to id descending if no date
            const sorted = [...filteredAnalyses].sort((a, b) => {
                if (a.date && b.date)
                    return b.date.localeCompare(a.date);
                return (b.id || 0) - (a.id || 0);
            });
            const first = sorted[0];
            if (first) {
                // Use handleView to normalize and set details
                handleView(first.id);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filteredAnalyses]);
    const handleView = (id) => __awaiter(void 0, void 0, void 0, function* () {
        setDetails(null);
        (0, debugLog_1.debugLog)('analysis-list-view-details', { analysisId: id });
        const data = yield (0, analysisApi_1.getAnalysisById)(id);
        setDetails((0, normalizeAnalysis_1.normalizeInstructionAnalysis)(data));
        setHighlightRow(id);
        setTimeout(() => setHighlightRow(null), 1200);
        setLastUpdated(new Date());
    });
    const handleDelete = (id) => __awaiter(void 0, void 0, void 0, function* () {
        if (!window.confirm('Are you sure you want to delete this analysis?'))
            return;
        (0, debugLog_1.debugLog)('analysis-list-delete', { analysisId: id });
        // @ts-ignore
        yield window.electron.invoke('delete-analysis', id);
        refresh();
        setLastUpdated(new Date());
    });
    const handleRefresh = () => {
        (0, debugLog_1.debugLog)('analysis-list-manual-refresh');
        refresh();
        setLastUpdated(new Date());
    };
    // Helper to get highest severity for an analysis (copied from Dashboard)
    function getHighestSeverity(analysis) {
        var _a, _b;
        const levels = ['critical', 'high', 'medium', 'low'];
        const colors = {
            critical: 'bg-red-700 text-white',
            high: 'bg-yellow-500 text-black',
            medium: 'bg-green-500 text-white',
            low: 'bg-blue-500 text-white',
        };
        let found = null;
        if (Array.isArray((_a = analysis.analysis_json) === null || _a === void 0 ? void 0 : _a.instruction_analysis)) {
            for (const level of levels) {
                if (analysis.analysis_json.instruction_analysis.some((i) => (i.risk_level || '').toLowerCase() === level)) {
                    found = level;
                    break;
                }
            }
        }
        if (!found && Array.isArray((_b = analysis.analysis_json) === null || _b === void 0 ? void 0 : _b.vulnerabilities)) {
            for (const level of levels) {
                if (analysis.analysis_json.vulnerabilities.some((v) => (typeof v === 'string' ? v.toLowerCase().includes(level) : JSON.stringify(v).toLowerCase().includes(level)))) {
                    found = level;
                    break;
                }
            }
        }
        if (!found)
            return { label: 'None', color: 'bg-gray-400 text-white' };
        return { label: found.charAt(0).toUpperCase() + found.slice(1), color: colors[found] };
    }
    return (React.createElement("div", { className: "p-6" },
        React.createElement("div", { className: "mb-2 p-2 bg-yellow-50 border border-yellow-200 text-xs text-yellow-800 rounded" },
            React.createElement("div", null,
                React.createElement("b", null, "Debug:"),
                " analyses=",
                analyses.length,
                ", filtered=",
                filteredAnalyses.length,
                ", loading=",
                String(loading),
                ", error=",
                String(error))),
        React.createElement("div", { className: "flex items-center justify-between mb-2" },
            React.createElement("div", { className: "text-xs text-gray-400" }, lastUpdated && React.createElement("span", null,
                "Last updated: ",
                lastUpdated.toLocaleTimeString())),
            React.createElement("button", { className: "px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition", onClick: handleRefresh }, "Refresh")),
        React.createElement("h2", { className: "text-2xl font-bold mb-4" }, "Analysis"),
        loading && React.createElement("p", null, "Loading..."),
        error && React.createElement("p", { className: "text-red-600" }, error),
        (!loading && filteredAnalyses.length === 0) && (React.createElement("div", { className: "p-8 text-center text-gray-500 text-lg" }, "No analyses found in the database.")),
        filteredAnalyses.length > 0 && (React.createElement("table", { className: "min-w-full bg-white rounded shadow mb-6 text-sm" },
            React.createElement("thead", null,
                React.createElement("tr", { className: "text-left border-b" },
                    React.createElement("th", { className: "py-2 px-3" }, "ID"),
                    React.createElement("th", { className: "py-2 px-3" }, "File Name"),
                    React.createElement("th", { className: "py-2 px-3" }, "Type"),
                    React.createElement("th", { className: "py-2 px-3" }, "Date"),
                    React.createElement("th", { className: "py-2 px-3" }, "Severity"),
                    React.createElement("th", { className: "py-2 px-3" }, "Actions"))),
            React.createElement("tbody", null, filteredAnalyses.map((a) => {
                const isBaseline = a.status && typeof a.status === 'string' && a.status.toLowerCase().includes('baseline');
                const severity = getHighestSeverity(a);
                return (React.createElement("tr", { key: a.id, className: `border-b hover:bg-gray-50 transition ${highlightRow === a.id ? 'ring-2 ring-blue-200' : ''} ${details && details.id === a.id ? 'outline outline-2 outline-blue-400 z-10' : ''}` },
                    React.createElement("td", { className: "py-2 px-3" }, a.id),
                    React.createElement("td", { className: "py-2 px-3" }, a.fileName),
                    React.createElement("td", { className: "py-2 px-3" },
                        React.createElement("span", { className: `inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${isBaseline ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}` }, isBaseline ? 'Baseline' : 'Analysis')),
                    React.createElement("td", { className: "py-2 px-3" }, a.date),
                    React.createElement("td", { className: "py-2 px-3" },
                        React.createElement("span", { key: severity.label + '-' + a.id, className: `inline-block px-2 py-0.5 text-xs font-semibold rounded-full border border-gray-300 ${severity.color} severity-badge`, style: severity.label === 'High' ? { backgroundColor: '#facc15', color: '#000', borderColor: '#d1d5db' } : {} }, severity.label)),
                    React.createElement("td", { className: "py-2 px-3" },
                        React.createElement("div", { className: "flex gap-2 items-center" },
                            React.createElement("button", { className: "px-2 py-1 text-xs font-semibold bg-blue-600 text-white rounded shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transition", onClick: () => handleView(a.id), "aria-label": `View analysis ${a.id}` }, "View"),
                            React.createElement("button", { className: "px-2 py-1 text-xs font-semibold bg-red-600 text-white rounded shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50 transition", onClick: () => handleDelete(a.id), "aria-label": `Delete analysis ${a.id}` }, "Delete")))));
            })))),
        details && (React.createElement("div", { className: "bg-gray-100 p-4 rounded shadow" },
            React.createElement("h3", { className: "font-semibold mb-2" }, "Analysis Details"),
            React.createElement(AnalysisDetails_1.default, { analysis: details }))),
        compareId && (React.createElement("div", { className: "bg-gray-100 p-4 rounded shadow mt-4" },
            React.createElement("h3", { className: "font-semibold mb-2" }, "Compare Analysis to Baseline"),
            React.createElement(CompareAnalysisToBaseline_1.default, { analysisId: compareId })))));
};
exports.default = AnalysisPage;
