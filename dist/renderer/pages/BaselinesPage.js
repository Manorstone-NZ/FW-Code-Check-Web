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
const AnalysisDetails_1 = __importDefault(require("../components/AnalysisDetails"));
const BaselinesPage = () => {
    const { baselines, loading, error, refresh } = (0, analysisApi_1.useBaselines)();
    const [selected, setSelected] = React.useState(null);
    const [details, setDetails] = React.useState(null);
    const [deleting, setDeleting] = React.useState(false);
    const handleView = (id) => __awaiter(void 0, void 0, void 0, function* () {
        setDetails(null);
        const data = yield (0, analysisApi_1.getBaselineById)(id);
        setDetails(data);
    });
    const handleDelete = (id) => __awaiter(void 0, void 0, void 0, function* () {
        setDeleting(true);
        yield (0, analysisApi_1.deleteBaseline)(id);
        setDeleting(false);
        setDetails(null);
        refresh();
    });
    // Helper to get highest severity for an analysis (copied from Dashboard)
    function getHighestSeverity(baseline) {
        var _a, _b;
        const levels = ['critical', 'high', 'medium', 'low'];
        const colors = {
            critical: 'bg-red-700 text-white',
            high: 'bg-yellow-500 text-black',
            medium: 'bg-green-500 text-white',
            low: 'bg-blue-500 text-white',
        };
        let found = null;
        if (Array.isArray((_a = baseline.analysis_json) === null || _a === void 0 ? void 0 : _a.instruction_analysis)) {
            for (const level of levels) {
                if (baseline.analysis_json.instruction_analysis.some((i) => (i.risk_level || '').toLowerCase() === level)) {
                    found = level;
                    break;
                }
            }
        }
        if (!found && Array.isArray((_b = baseline.analysis_json) === null || _b === void 0 ? void 0 : _b.vulnerabilities)) {
            for (const level of levels) {
                if (baseline.analysis_json.vulnerabilities.some((v) => (typeof v === 'string' ? v.toLowerCase().includes(level) : JSON.stringify(v).toLowerCase().includes(level)))) {
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
        React.createElement("h2", { className: "text-2xl font-bold mb-4" }, "Baselines"),
        loading && React.createElement("p", null, "Loading..."),
        error && React.createElement("p", { className: "text-red-600" }, error),
        baselines.length > 0 && (React.createElement("table", { className: "min-w-full bg-white rounded shadow mb-6 text-sm" },
            React.createElement("thead", null,
                React.createElement("tr", { className: "text-left border-b" },
                    React.createElement("th", { className: "py-2 px-3" }, "ID"),
                    React.createElement("th", { className: "py-2 px-3" }, "File Name"),
                    React.createElement("th", { className: "py-2 px-3" }, "Date"),
                    React.createElement("th", { className: "py-2 px-3" }, "Severity"),
                    React.createElement("th", { className: "py-2 px-3" }, "Actions"))),
            React.createElement("tbody", null, baselines.map((b) => {
                const severity = getHighestSeverity(b);
                return (React.createElement("tr", { key: b.id, className: `border-b hover:bg-gray-50 transition ${details && details.id === b.id ? 'bg-green-50' : ''}` },
                    React.createElement("td", { className: "py-2 px-3" }, b.id),
                    React.createElement("td", { className: "py-2 px-3" }, b.fileName),
                    React.createElement("td", { className: "py-2 px-3" }, b.date),
                    React.createElement("td", { className: "py-2 px-3" },
                        React.createElement("span", { key: severity.label + '-' + b.id, className: `inline-block px-2 py-0.5 text-xs font-semibold rounded-full border border-gray-300 ${severity.color} severity-badge`, style: severity.label === 'High' ? { backgroundColor: '#facc15', color: '#000', borderColor: '#d1d5db' } : {} }, severity.label)),
                    React.createElement("td", { className: "py-2 px-3" },
                        React.createElement("div", { className: "flex gap-2 items-center" },
                            React.createElement("button", { className: "px-2 py-1 text-xs font-semibold bg-green-600 text-white rounded shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50 transition", onClick: () => handleView(b.id), "aria-label": `View baseline ${b.id}` }, "View"),
                            React.createElement("button", { className: "px-2 py-1 text-xs font-semibold bg-red-600 text-white rounded shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50 transition", onClick: () => handleDelete(b.id), "aria-label": `Delete baseline ${b.id}` }, "Delete")))));
            })))),
        details && (React.createElement("div", { className: "bg-gray-100 p-4 rounded shadow mt-4" },
            React.createElement("h3", { className: "font-semibold mb-2" }, "Baseline Details"),
            React.createElement(AnalysisDetails_1.default, { analysis: {
                    fileName: details.fileName || details.originalName || details.name || 'Baseline',
                    status: details.status || 'baseline',
                    date: details.date || details.createdAt || '',
                    analysis_json: details.analysis_json || details,
                    // Also pass filePath if present, for LLM fallback logic
                    filePath: details.filePath || ''
                } })))));
};
exports.default = BaselinesPage;
