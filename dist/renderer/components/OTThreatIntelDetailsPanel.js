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
const ReactMarkdownShim_1 = __importDefault(require("./ReactMarkdownShim"));
// Simulate user role (replace with real auth in production)
const userRole = window.localStorage.getItem('userRole') || 'analyst'; // 'analyst' or 'viewer'
const OTThreatIntelDetailsPanel = ({ entry, onCurationUpdate }) => {
    const [editMode, setEditMode] = React.useState(false);
    const [tags, setTags] = React.useState((entry === null || entry === void 0 ? void 0 : entry.tags) || []);
    const [siteRelevance, setSiteRelevance] = React.useState((entry === null || entry === void 0 ? void 0 : entry.site_relevance) || '');
    const [responseNotes, setResponseNotes] = React.useState((entry === null || entry === void 0 ? void 0 : entry.response_notes) || '');
    React.useEffect(() => {
        setTags((entry === null || entry === void 0 ? void 0 : entry.tags) || []);
        setSiteRelevance((entry === null || entry === void 0 ? void 0 : entry.site_relevance) || '');
        setResponseNotes((entry === null || entry === void 0 ? void 0 : entry.response_notes) || '');
    }, [entry]);
    if (!entry)
        return (React.createElement("div", { className: "bg-white border rounded-xl shadow p-4 text-xs text-gray-400" }, "Select a threat entry to view details."));
    const handleSave = () => {
        if (onCurationUpdate) {
            onCurationUpdate(Object.assign(Object.assign({}, entry), { tags, site_relevance: siteRelevance, response_notes: responseNotes }));
        }
        setEditMode(false);
    };
    const handleExport = (format) => {
        const filename = `${entry.title.replace(/[^a-z0-9]/gi, '_')}_${entry.id}.${format}`;
        let content = '';
        if (format === 'json') {
            content = JSON.stringify(entry, null, 2);
        }
        else {
            content = `# ${entry.title}\n\n**Type:** ${entry.threat_type}\n**Severity:** ${entry.severity}\n**Vendors:** ${entry.affected_vendors.join(', ')}\n**Protocols:** ${entry.industrial_protocols.join(', ')}\n**Systems:** ${entry.system_targets.join(', ')}\n**Tags:** ${entry.tags.join(', ')}\n**Source:** ${entry.source}\n\n## Summary\n${entry.summary}\n\n## LLM/AI Details\n${entry.llm_response || ''}\n`;
        }
        const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };
    return (React.createElement("div", { className: "bg-white border rounded-xl shadow p-4 text-xs" },
        React.createElement("div", { className: "mb-2 text-base font-bold text-blue-900" }, entry.title),
        React.createElement("div", { className: "mb-2 text-xs text-gray-500" },
            entry.threat_type,
            " | ",
            entry.severity,
            " | ",
            new Date(entry.retrieved_at).toLocaleString()),
        React.createElement("div", { className: "mb-2" },
            React.createElement("span", { className: "font-semibold" }, "Vendors:"),
            " ",
            entry.affected_vendors.join(', ')),
        React.createElement("div", { className: "mb-2" },
            React.createElement("span", { className: "font-semibold" }, "Protocols:"),
            " ",
            entry.industrial_protocols.join(', ')),
        React.createElement("div", { className: "mb-2" },
            React.createElement("span", { className: "font-semibold" }, "Systems:"),
            " ",
            entry.system_targets.join(', ')),
        React.createElement("div", { className: "mb-2" },
            React.createElement("span", { className: "font-semibold" }, "Tags:"),
            " ",
            editMode ? (React.createElement("input", { className: "border px-1 py-0.5 rounded w-48", value: tags.join(', '), onChange: e => setTags(e.target.value.split(',').map(t => t.trim())) })) : tags.join(', ')),
        React.createElement("div", { className: "mb-2" },
            React.createElement("span", { className: "font-semibold" }, "Source:"),
            " ",
            entry.source),
        React.createElement("div", { className: "mb-2" },
            React.createElement("span", { className: "font-semibold" }, "Summary:"),
            " ",
            React.createElement(ReactMarkdownShim_1.default, null, entry.summary)),
        entry.llm_response && (React.createElement("div", { className: "mb-2" },
            React.createElement("span", { className: "font-semibold" }, "LLM/AI Details:"),
            React.createElement("div", { className: "prose prose-xs max-w-none bg-gray-50 border rounded p-2 mt-1" },
                React.createElement(ReactMarkdownShim_1.default, null, entry.llm_response)))),
        React.createElement("div", { className: "mb-2" },
            React.createElement("span", { className: "font-semibold" }, "Site Relevance:"),
            " ",
            editMode ? (React.createElement("input", { className: "border px-1 py-0.5 rounded w-48", value: siteRelevance, onChange: e => setSiteRelevance(e.target.value) })) : siteRelevance),
        React.createElement("div", { className: "mb-2" },
            React.createElement("span", { className: "font-semibold" }, "Response Notes:"),
            " ",
            editMode ? (React.createElement("textarea", { className: "border px-1 py-0.5 rounded w-full", rows: 2, value: responseNotes, onChange: e => setResponseNotes(e.target.value) })) : responseNotes),
        React.createElement("div", { className: "flex gap-2 mt-2" },
            React.createElement("button", { className: "border px-2 py-1 rounded text-xs bg-gray-100 hover:bg-gray-200", onClick: () => handleExport('json') }, "Export JSON"),
            React.createElement("button", { className: "border px-2 py-1 rounded text-xs bg-gray-100 hover:bg-gray-200", onClick: () => handleExport('md') }, "Export Markdown"),
            userRole === 'analyst' && !editMode && (React.createElement("button", { className: "border px-2 py-1 rounded text-xs bg-blue-100 hover:bg-blue-200", onClick: () => setEditMode(true) }, "Edit")),
            userRole === 'analyst' && editMode && (React.createElement("button", { className: "border px-2 py-1 rounded text-xs bg-green-100 hover:bg-green-200", onClick: handleSave }, "Save")),
            editMode && (React.createElement("button", { className: "border px-2 py-1 rounded text-xs bg-red-100 hover:bg-red-200", onClick: () => setEditMode(false) }, "Cancel"))),
        React.createElement("div", { className: "mt-2 text-gray-400 text-xxs" },
            "Created: ",
            new Date(entry.created_at).toLocaleString(),
            React.createElement("br", null),
            "Updated: ",
            new Date(entry.updated_at).toLocaleString())));
};
exports.default = OTThreatIntelDetailsPanel;
