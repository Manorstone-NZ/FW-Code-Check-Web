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
// Accepts array of objects and extracts unique values for a given key (array or string field)
const getUnique = (arr, key) => {
    const values = arr.flatMap(e => Array.isArray(e[key]) ? e[key] : [e[key]]);
    return Array.from(new Set(values)).filter(Boolean);
};
const OTThreatIntelFilterPanel = ({ filters, setFilters, entries }) => {
    const vendors = getUnique(entries, 'affected_vendors');
    const protocols = getUnique(entries, 'industrial_protocols');
    const severities = ['High', 'Medium', 'Low'];
    const systems = getUnique(entries, 'system_targets');
    return (React.createElement("div", { className: "flex gap-4 mb-2" },
        React.createElement("div", null,
            React.createElement("label", { className: "block text-xs font-semibold mb-1" }, "Vendor"),
            React.createElement("select", { className: "p-1 border rounded text-xs", value: filters.vendor || '', onChange: e => setFilters((f) => (Object.assign(Object.assign({}, f), { vendor: e.target.value || undefined }))) },
                React.createElement("option", { value: "" }, "All"),
                vendors.map((v) => React.createElement("option", { key: v, value: v }, v)))),
        React.createElement("div", null,
            React.createElement("label", { className: "block text-xs font-semibold mb-1" }, "Protocol"),
            React.createElement("select", { className: "p-1 border rounded text-xs", value: filters.protocol || '', onChange: e => setFilters((f) => (Object.assign(Object.assign({}, f), { protocol: e.target.value || undefined }))) },
                React.createElement("option", { value: "" }, "All"),
                protocols.map((p) => React.createElement("option", { key: p, value: p }, p)))),
        React.createElement("div", null,
            React.createElement("label", { className: "block text-xs font-semibold mb-1" }, "Severity"),
            React.createElement("select", { className: "p-1 border rounded text-xs", value: filters.severity || '', onChange: e => setFilters((f) => (Object.assign(Object.assign({}, f), { severity: e.target.value || undefined }))) },
                React.createElement("option", { value: "" }, "All"),
                severities.map(s => React.createElement("option", { key: s, value: s }, s)))),
        React.createElement("div", null,
            React.createElement("label", { className: "block text-xs font-semibold mb-1" }, "System"),
            React.createElement("select", { className: "p-1 border rounded text-xs", value: filters.system || '', onChange: e => setFilters((f) => (Object.assign(Object.assign({}, f), { system: e.target.value || undefined }))) },
                React.createElement("option", { value: "" }, "All"),
                systems.map((s) => React.createElement("option", { key: s, value: s }, s))))));
};
exports.default = OTThreatIntelFilterPanel;
