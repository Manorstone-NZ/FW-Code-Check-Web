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
const react_1 = __importStar(require("react"));
const LLMLogPage = () => {
    const [logs, setLogs] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    const [expanded, setExpanded] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        // @ts-ignore
        window.electron.invoke('get-llm-logs')
            .then((data) => {
            // Sort logs newest to oldest
            setLogs(Array.isArray(data) ? [...data].sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || '')) : []);
            setLoading(false);
        })
            .catch((e) => {
            setError(e.message || 'Failed to load logs');
            setLoading(false);
        });
    }, []);
    return (react_1.default.createElement("div", { className: "max-w-4xl mx-auto mt-8" },
        react_1.default.createElement("h1", { className: "text-2xl font-bold mb-6 text-[#0275D8]" }, "LLM Interaction Log"),
        loading && react_1.default.createElement("div", null, "Loading..."),
        error && react_1.default.createElement("div", { className: "text-red-600" }, error),
        logs.length === 0 && !loading && !error && react_1.default.createElement("div", null, "No LLM interactions logged yet."),
        react_1.default.createElement("table", { className: "w-full text-sm border-collapse" },
            react_1.default.createElement("thead", null,
                react_1.default.createElement("tr", { className: "bg-gray-100" },
                    react_1.default.createElement("th", { className: "p-2 text-left" }, "#"),
                    react_1.default.createElement("th", { className: "p-2 text-left" }, "Date/Time"),
                    react_1.default.createElement("th", { className: "p-2 text-left" }, "Status"),
                    react_1.default.createElement("th", { className: "p-2 text-left" }, "Summary"),
                    react_1.default.createElement("th", { className: "p-2" }))),
            react_1.default.createElement("tbody", null, logs.map((log, idx) => {
                const summary = (log.result && typeof log.result === 'string')
                    ? log.result.slice(0, 80).replace(/\n/g, ' ')
                    : (log.result && log.result.error ? log.result.error : '');
                return (react_1.default.createElement(react_1.default.Fragment, { key: idx },
                    react_1.default.createElement("tr", { className: "border-b hover:bg-gray-50" },
                        react_1.default.createElement("td", { className: "p-2" }, log.id || idx + 1),
                        react_1.default.createElement("td", { className: "p-2 whitespace-nowrap" }, log.timestamp ? new Date(log.timestamp).toLocaleString() : ''),
                        react_1.default.createElement("td", { className: "p-2 " + (log.success ? 'text-green-700' : 'text-red-700') }, log.success ? 'Success' : 'Fail'),
                        react_1.default.createElement("td", { className: "p-2 truncate max-w-xs" }, summary || react_1.default.createElement("span", { className: "italic text-gray-400" }, "(no summary)")),
                        react_1.default.createElement("td", { className: "p-2" },
                            react_1.default.createElement("button", { className: "ml-2 px-2 py-1 text-xs bg-[#0275D8] text-white rounded hover:bg-[#0256a3]", onClick: () => setExpanded(expanded === idx ? null : idx) }, expanded === idx ? 'Hide' : 'View'))),
                    expanded === idx && (react_1.default.createElement("tr", null,
                        react_1.default.createElement("td", { colSpan: 5, className: "bg-gray-50 p-4" },
                            react_1.default.createElement("div", { className: "mb-2 text-xs text-gray-500" }, log.timestamp ? new Date(log.timestamp).toLocaleString() : ''),
                            react_1.default.createElement("div", { className: "mb-2" },
                                react_1.default.createElement("span", { className: "font-semibold" }, "Prompt:"),
                                react_1.default.createElement("pre", { className: "bg-gray-100 p-2 rounded text-xs overflow-x-auto" }, log.prompt)),
                            react_1.default.createElement("div", { className: "mb-2" },
                                react_1.default.createElement("span", { className: "font-semibold" }, "Result:"),
                                react_1.default.createElement("pre", { className: "bg-gray-100 p-2 rounded text-xs overflow-x-auto" }, typeof log.result === 'string' ? log.result : JSON.stringify(log.result, null, 2))),
                            react_1.default.createElement("div", { className: "mb-2" },
                                react_1.default.createElement("span", { className: "font-semibold" }, "Status:"),
                                " ",
                                react_1.default.createElement("span", { className: log.success ? 'text-green-700' : 'text-red-700' }, log.success ? 'Success' : 'Fail')))))));
            })))));
};
exports.default = LLMLogPage;
