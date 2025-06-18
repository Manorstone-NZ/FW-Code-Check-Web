"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const RiskBadge = ({ level }) => {
    const normalized = level.trim().toLowerCase();
    let color = '';
    if (normalized === 'critical')
        color = 'text-red-700 font-bold';
    else if (normalized === 'high')
        color = 'text-orange-600 font-bold';
    else if (normalized === 'medium')
        color = 'text-yellow-700 font-bold';
    else if (normalized === 'low')
        color = 'text-green-700 font-bold';
    else
        color = 'text-gray-800';
    return react_1.default.createElement("span", { className: color }, level);
};
const InstructionAnalysisTable = ({ data }) => (react_1.default.createElement("div", { className: "rounded-b-xl bg-white border-t border-gray-100 relative", style: { maxHeight: '340px', minHeight: '120px', padding: '0 1.5rem 1.5rem 1.5rem', boxSizing: 'border-box', overflow: 'auto' } },
    react_1.default.createElement("table", { className: "table-auto w-full bg-white text-sm border" },
        react_1.default.createElement("thead", null,
            react_1.default.createElement("tr", { className: "bg-gray-100" },
                react_1.default.createElement("th", { className: "p-3 text-left font-semibold" }, "Instruction"),
                react_1.default.createElement("th", { className: "p-3 text-left font-semibold" }, "Insight"),
                react_1.default.createElement("th", { className: "p-3 text-left font-semibold" }, "Risk Level"))),
        react_1.default.createElement("tbody", null, data.map((item, idx) => (react_1.default.createElement("tr", { key: idx, className: "border-b last:border-b-0" },
            react_1.default.createElement("td", { className: "p-3 font-mono align-top break-all max-w-xs" }, item.instruction),
            react_1.default.createElement("td", { className: "p-3 align-top break-words max-w-md" }, item.insight),
            react_1.default.createElement("td", { className: "p-3 font-semibold align-top" },
                react_1.default.createElement(RiskBadge, { level: item.risk_level })))))))));
exports.default = InstructionAnalysisTable;
