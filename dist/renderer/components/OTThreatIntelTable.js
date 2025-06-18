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
Object.defineProperty(exports, "__esModule", { value: true });
const React = __importStar(require("react"));
const severityColor = (sev) => {
    const s = (sev || '').trim().toLowerCase();
    if (s === 'critical')
        return 'bg-red-800 text-white border-red-900 font-extrabold shadow-lg animate-pulse';
    if (s === 'high')
        return 'bg-red-700 text-white border-red-700';
    if (s === 'medium')
        return 'bg-yellow-500 text-black border-yellow-500';
    if (s === 'low')
        return 'bg-green-500 text-white border-green-500';
    return 'bg-gray-300 text-gray-700 border-gray-300';
};
const formatSeverityLabel = (sev) => {
    if (!sev)
        return '';
    const s = sev.trim().toLowerCase();
    return s.charAt(0).toUpperCase() + s.slice(1);
};
const OTThreatIntelTable = ({ entries, onSelect }) => {
    return (React.createElement("div", { className: "bg-white rounded-xl shadow border overflow-x-auto" },
        React.createElement("table", { className: "min-w-full text-xs" },
            React.createElement("thead", null,
                React.createElement("tr", { className: "border-b" },
                    React.createElement("th", { className: "text-left py-2 px-3 font-semibold text-gray-700" }, "Date"),
                    React.createElement("th", { className: "text-left py-2 px-3 font-semibold text-gray-700" }, "Title"),
                    React.createElement("th", { className: "text-left py-2 px-3 font-semibold text-gray-700" }, "Type"),
                    React.createElement("th", { className: "text-left py-2 px-3 font-semibold text-gray-700" }, "Vendors"),
                    React.createElement("th", { className: "text-left py-2 px-3 font-semibold text-gray-700" }, "Severity"),
                    React.createElement("th", { className: "text-left py-2 px-3 font-semibold text-gray-700" }, "Source"))),
            React.createElement("tbody", null, entries.length === 0 ? (React.createElement("tr", null,
                React.createElement("td", { colSpan: 6, className: "py-4 text-center text-gray-400" }, "No threat intel entries found."))) : entries.map(e => (React.createElement("tr", { key: e.id, className: "border-b hover:bg-blue-50 cursor-pointer", onClick: () => onSelect(e) },
                React.createElement("td", { className: "py-2 px-3 align-middle" }, new Date(e.retrieved_at).toLocaleDateString()),
                React.createElement("td", { className: "py-2 px-3 align-middle font-semibold text-blue-900" }, e.title),
                React.createElement("td", { className: "py-2 px-3 align-middle" }, e.threat_type),
                React.createElement("td", { className: "py-2 px-3 align-middle" }, e.affected_vendors.join(', ')),
                React.createElement("td", { className: "py-2 px-3 align-middle" },
                    React.createElement("span", { className: `inline-block px-2 py-0.5 text-xs font-extrabold rounded-full border ${severityColor(e.severity)}`, style: e.severity && e.severity.trim().toLowerCase() === 'critical' ? { backgroundColor: '#b1001c', color: '#fff', borderColor: '#b1001c', fontWeight: 900, boxShadow: '0 0 8px 2px #b1001c' } : {} }, formatSeverityLabel(e.severity))),
                React.createElement("td", { className: "py-2 px-3 align-middle" }, e.source))))))));
};
exports.default = OTThreatIntelTable;
