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
Object.defineProperty(exports, "__esModule", { value: true });
const React = __importStar(require("react"));
const react_router_dom_1 = require("react-router-dom");
const analysisApi_1 = require("../utils/analysisApi");
const App_1 = require("../App");
const navItems = [
    { label: 'Dashboard', path: '/' },
    { label: 'Upload', path: '/upload' },
    { label: 'Baselines', path: '/baselines' },
    { label: 'Analysis', path: '/analysis' },
    { label: 'Comparisons', path: '/comparisons' },
    { label: 'OT Threat Intel', path: '/ot-threat-intel' },
    { label: 'LLM Log', path: '/llm-log' }, // LLM Log now last
];
const Sidebar = () => {
    const location = (0, react_router_dom_1.useLocation)();
    const { status: llmStatus, error: llmError } = (0, analysisApi_1.useLLMStatus)(60000); // 60s poll
    const { provider: llmProvider } = React.useContext(App_1.LLMProviderContext);
    const [clearingDb, setClearingDb] = React.useState(false);
    function handleClearDb() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!window.confirm('Are you sure you want to clear and reinitialize the database? This will delete all analyses and baselines.'))
                return;
            setClearingDb(true);
            try {
                // @ts-ignore
                yield window.electron.invoke('reset-db');
                window.location.reload();
            }
            catch (e) {
                alert('Failed to clear database: ' + (e instanceof Error ? e.message : e));
            }
            setClearingDb(false);
        });
    }
    return (React.createElement("aside", { className: "h-full w-64 bg-[#232B3A] text-white flex flex-col py-8 px-4 shadow-lg font-sans" },
        React.createElement("div", { className: "mb-10 flex flex-col items-center select-none" },
            React.createElement("img", { src: "/firstwatch-logo.svg", alt: "First Watch Logo", className: "h-12 mb-4", style: { maxWidth: '180px' } })),
        React.createElement("nav", { className: "flex-1" }, navItems.map(item => (React.createElement(react_router_dom_1.NavLink, { key: item.path, to: item.path, className: ({ isActive }) => `flex items-center px-6 py-3 mb-3 rounded-lg text-lg font-medium transition-colors duration-150 hover:bg-[#31405A] hover:text-[#0275D8] ${isActive ? 'bg-white text-[#232B3A] shadow font-bold' : ''}` },
            React.createElement("span", null, item.label))))),
        React.createElement("div", { className: "mt-2 flex flex-col items-center" },
            React.createElement("span", { className: `text-xs font-semibold px-2 py-1 rounded ${llmStatus === 'online' ? 'bg-green-600 text-white' : llmStatus === 'offline' ? 'bg-red-600 text-white' : 'bg-gray-500 text-white'}`, title: llmError ? `LLM error: ${llmError}` : llmStatus === 'online' ? 'LLM is online' : 'LLM status unknown' },
                "LLM: ",
                llmStatus === 'online' ? 'Online' : llmStatus === 'offline' ? 'Offline' : 'Checking...',
                " (",
                llmProvider === 'openai' ? 'OpenAI' : llmProvider === 'ollama' ? 'Ollama' : llmProvider,
                ")"),
            llmError && React.createElement("span", { className: "text-xs text-red-300 mt-1" }, llmError)),
        React.createElement("div", { className: "mt-auto text-xs text-gray-400 text-center pt-8 select-none" },
            React.createElement("button", { className: `w-full mb-4 px-4 py-2 rounded bg-red-700 hover:bg-red-800 text-white font-semibold shadow transition ${clearingDb ? 'opacity-50 cursor-not-allowed' : ''}`, disabled: clearingDb, onClick: handleClearDb }, clearingDb ? 'Clearing Database...' : 'Clear Database'),
            "\u00A9 ",
            new Date().getFullYear(),
            " First Watch PLC Code Checker")));
};
exports.default = Sidebar;
