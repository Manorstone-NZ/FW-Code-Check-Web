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
const analysisApi_1 = require("../utils/analysisApi");
const react_router_dom_1 = require("react-router-dom");
const OTThreatIntelDashboard_1 = __importDefault(require("./OTThreatIntelDashboard"));
const Dashboard = () => {
    const { analyses, loading: loadingAnalyses, error: errorAnalyses, refresh: refreshAnalyses } = (0, analysisApi_1.useAnalyses)();
    const { baselines, loading: loadingBaselines, error: errorBaselines, refresh: refreshBaselines } = (0, analysisApi_1.useBaselines)();
    const [deletingId, setDeletingId] = React.useState(null);
    const navigate = (0, react_router_dom_1.useNavigate)();
    // Compute metrics
    const totalAnalyses = analyses.length;
    const totalBaselines = baselines.length;
    // Vulnerabilities: sum of all vulnerabilities arrays in all analyses
    const totalVulnerabilities = analyses.reduce((sum, a) => {
        var _a;
        const v = (_a = a.analysis_json) === null || _a === void 0 ? void 0 : _a.vulnerabilities;
        return sum + (Array.isArray(v) ? v.length : 0);
    }, 0);
    // Alarms: sum of all instruction_analysis items with risk_level High or Critical
    const totalAlarms = analyses.reduce((sum, a) => {
        var _a;
        const ia = (_a = a.analysis_json) === null || _a === void 0 ? void 0 : _a.instruction_analysis;
        if (!Array.isArray(ia))
            return sum;
        return sum + ia.filter((item) => {
            const rl = (item.risk_level || '').toLowerCase();
            return rl === 'high' || rl === 'critical';
        }).length;
    }, 0);
    // Helper to get highest severity for an analysis
    function getHighestSeverity(analysis) {
        var _a, _b;
        const levels = ['critical', 'high', 'medium', 'low'];
        const colors = {
            critical: '#D9534F',
            high: '#FFC107',
            medium: '#28A745',
            low: '#0275D8',
        };
        let found = null;
        // Check instruction_analysis
        if (Array.isArray((_a = analysis.analysis_json) === null || _a === void 0 ? void 0 : _a.instruction_analysis)) {
            for (const level of levels) {
                if (analysis.analysis_json.instruction_analysis.some((i) => (i.risk_level || '').toLowerCase() === level)) {
                    found = level;
                    break;
                }
            }
        }
        // Fallback: check vulnerabilities array for keywords
        if (!found && Array.isArray((_b = analysis.analysis_json) === null || _b === void 0 ? void 0 : _b.vulnerabilities)) {
            for (const level of levels) {
                if (analysis.analysis_json.vulnerabilities.some((v) => (typeof v === 'string' ? v.toLowerCase().includes(level) : JSON.stringify(v).toLowerCase().includes(level)))) {
                    found = level;
                    break;
                }
            }
        }
        if (!found)
            return { label: 'None', color: '#232B3A' };
        return { label: found.charAt(0).toUpperCase() + found.slice(1), color: colors[found] };
    }
    // Sort analyses by date descending, show latest 5
    const recentAnalyses = [...analyses].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 5);
    return (React.createElement("div", { className: "flex flex-col gap-8 font-sans" },
        React.createElement("div", { className: "bg-white rounded-xl shadow-md p-8 mt-4 border border-gray-100" },
            React.createElement("div", { className: "font-semibold mb-4 text-lg text-[#232B3A]" }, "OT Threat Intelligence (Last 4 Months)"),
            React.createElement("div", { className: "mb-4" },
                React.createElement(OTThreatIntelDashboard_1.default, null))),
        React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6 mt-4" },
            React.createElement("div", { className: "bg-blue-200 rounded-xl shadow-md p-4 flex flex-col items-center border border-blue-300 hover:shadow-lg cursor-pointer transition group min-h-[110px] min-w-[120px]", style: { maxWidth: 180 }, onClick: () => navigate('/analysis'), title: "View all analyses" },
                React.createElement("div", { className: "text-3xl font-bold text-blue-800 mb-1 tracking-tight drop-shadow" }, loadingAnalyses ? '...' : totalAnalyses),
                React.createElement("div", { className: "text-blue-900 mt-1 text-base font-semibold uppercase tracking-wide" }, "Total Analyses")),
            React.createElement("div", { className: "bg-green-200 rounded-xl shadow-md p-4 flex flex-col items-center border border-green-300 hover:shadow-lg cursor-pointer transition group min-h-[110px] min-w-[120px]", style: { maxWidth: 180 }, onClick: () => navigate('/baselines'), title: "View all baselines" },
                React.createElement("div", { className: "text-3xl font-bold text-green-800 mb-1 tracking-tight drop-shadow" }, loadingBaselines ? '...' : totalBaselines),
                React.createElement("div", { className: "text-green-900 mt-1 text-base font-semibold uppercase tracking-wide" }, "Baselines")),
            React.createElement("div", { className: "bg-red-200 rounded-xl shadow-md p-4 flex flex-col items-center border border-red-300 hover:shadow-lg cursor-pointer transition group min-h-[110px] min-w-[120px]", style: { maxWidth: 180 }, onClick: () => navigate('/analysis?vuln=1'), title: "View all detected vulnerabilities" },
                React.createElement("div", { className: "text-3xl font-bold text-red-800 mb-1 tracking-tight drop-shadow" }, loadingAnalyses ? '...' : totalVulnerabilities),
                React.createElement("div", { className: "text-red-900 mt-1 text-base font-semibold uppercase tracking-wide" }, "Vulnerabilities")),
            React.createElement("div", { className: "bg-yellow-200 rounded-xl shadow-md p-4 flex flex-col items-center border border-yellow-300 hover:shadow-lg cursor-pointer transition group min-h-[110px] min-w-[120px]", style: { maxWidth: 180 }, onClick: () => navigate('/analysis?alarms=1'), title: "View all detected alarms" },
                React.createElement("div", { className: "text-3xl font-bold text-yellow-800 mb-1 tracking-tight drop-shadow" }, loadingAnalyses ? '...' : totalAlarms),
                React.createElement("div", { className: "text-yellow-900 mt-1 text-base font-semibold uppercase tracking-wide" }, "Alarms"))),
        React.createElement("div", { className: "bg-white rounded-xl shadow-md p-8 mt-4 border border-gray-100" },
            React.createElement("div", { className: "font-semibold mb-4 text-lg text-[#232B3A]" }, "Most Recent Analyses"),
            React.createElement("table", { className: "min-w-full text-sm" },
                React.createElement("thead", null,
                    React.createElement("tr", { className: "text-left text-gray-600 border-b" },
                        React.createElement("th", { className: "py-2" }, "Date"),
                        React.createElement("th", { className: "py-2" }, "File"),
                        React.createElement("th", { className: "py-2" }, "Status"),
                        React.createElement("th", { className: "py-2" }, "Severity"),
                        React.createElement("th", { className: "py-2" }, "Actions"))),
                React.createElement("tbody", null, loadingAnalyses ? (React.createElement("tr", null,
                    React.createElement("td", { colSpan: 5, className: "py-4 text-center text-gray-400" }, "Loading..."))) : recentAnalyses.length === 0 ? (React.createElement("tr", null,
                    React.createElement("td", { colSpan: 5, className: "py-4 text-center text-gray-400" }, "No analyses found."))) : recentAnalyses.map((a, idx) => {
                    const sev = getHighestSeverity(a);
                    return (React.createElement("tr", { key: a.id || idx, className: "border-b hover:bg-gray-50" },
                        React.createElement("td", { className: "py-2" }, a.date || ''),
                        React.createElement("td", { className: "py-2" }, a.fileName || ''),
                        React.createElement("td", { className: "py-2" }, a.status || ''),
                        React.createElement("td", { className: "py-2 font-bold", style: { color: sev.color } }, sev.label),
                        React.createElement("td", { className: "py-2" },
                            React.createElement("button", { className: "px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700", onClick: () => navigate(`/analysis/${a.id}`) }, "View"))));
                }))))));
};
exports.default = Dashboard;
