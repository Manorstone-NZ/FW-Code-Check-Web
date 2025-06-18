"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMProviderContext = void 0;
const react_1 = __importDefault(require("react"));
const react_router_dom_1 = require("react-router-dom");
const FileUploader_1 = __importDefault(require("./components/FileUploader"));
const Sidebar_1 = __importDefault(require("./components/Sidebar"));
const Dashboard_1 = __importDefault(require("./pages/Dashboard"));
const BaselinesPage_1 = __importDefault(require("./pages/BaselinesPage"));
const HistoryPage_1 = __importDefault(require("./pages/HistoryPage"));
const LLMLogPage_1 = __importDefault(require("./pages/LLMLogPage"));
const ComparisonsPage_1 = __importDefault(require("./pages/ComparisonsPage"));
const AnalysisPage_1 = __importDefault(require("./pages/AnalysisPage"));
const OTThreatIntelDashboard_1 = __importDefault(require("./pages/OTThreatIntelDashboard"));
exports.LLMProviderContext = react_1.default.createContext({ provider: 'openai', setProvider: () => { } });
const App = () => {
    const [llmProvider, setLlmProvider] = react_1.default.useState(() => {
        return localStorage.getItem('llmProvider') || 'openai';
    });
    react_1.default.useEffect(() => {
        localStorage.setItem('llmProvider', llmProvider);
    }, [llmProvider]);
    return (react_1.default.createElement(exports.LLMProviderContext.Provider, { value: { provider: llmProvider, setProvider: setLlmProvider } },
        react_1.default.createElement(react_router_dom_1.BrowserRouter, null,
            react_1.default.createElement("div", { className: "flex h-screen bg-[#F4F6FA] font-sans" },
                react_1.default.createElement(Sidebar_1.default, null),
                react_1.default.createElement("div", { className: "flex flex-col flex-1 min-w-0" },
                    react_1.default.createElement("header", { className: "bg-white text-[#232B3A] p-6 shadow-sm border-b border-gray-100 flex items-center justify-between" },
                        react_1.default.createElement("h1", { className: "text-2xl font-extrabold tracking-tight" }, "First Watch PLC Code Checker"),
                        react_1.default.createElement("div", { className: "flex items-center gap-4" },
                            react_1.default.createElement("label", { className: "text-sm font-semibold mr-2" }, "LLM Provider:"),
                            react_1.default.createElement("select", { className: "border rounded px-2 py-1 text-sm", value: llmProvider, onChange: e => setLlmProvider(e.target.value), style: { minWidth: 100 } },
                                react_1.default.createElement("option", { value: "openai" }, "OpenAI"),
                                react_1.default.createElement("option", { value: "ollama" }, "Ollama")))),
                    react_1.default.createElement("main", { className: "flex-1 p-10 overflow-auto" },
                        react_1.default.createElement(react_router_dom_1.Routes, null,
                            react_1.default.createElement(react_router_dom_1.Route, { path: "/", element: react_1.default.createElement(Dashboard_1.default, null) }),
                            react_1.default.createElement(react_router_dom_1.Route, { path: "/upload", element: react_1.default.createElement(FileUploader_1.default, null) }),
                            react_1.default.createElement(react_router_dom_1.Route, { path: "/baselines", element: react_1.default.createElement(BaselinesPage_1.default, null) }),
                            react_1.default.createElement(react_router_dom_1.Route, { path: "/history", element: react_1.default.createElement(HistoryPage_1.default, null) }),
                            react_1.default.createElement(react_router_dom_1.Route, { path: "/llm-log", element: react_1.default.createElement(LLMLogPage_1.default, null) }),
                            react_1.default.createElement(react_router_dom_1.Route, { path: "/comparisons", element: react_1.default.createElement(ComparisonsPage_1.default, null) }),
                            react_1.default.createElement(react_router_dom_1.Route, { path: "/analysis", element: react_1.default.createElement(AnalysisPage_1.default, null) }),
                            react_1.default.createElement(react_router_dom_1.Route, { path: "/ot-threat-intel", element: react_1.default.createElement(OTThreatIntelDashboard_1.default, null) }))))))));
};
exports.default = App;
