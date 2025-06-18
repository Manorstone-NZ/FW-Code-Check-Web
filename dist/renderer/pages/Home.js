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
const Home = () => {
    const [result, setResult] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const navigate = (0, react_router_dom_1.useNavigate)();
    const handleSampleAnalysis = () => __awaiter(void 0, void 0, void 0, function* () {
        setLoading(true);
        setResult(null);
        try {
            // @ts-ignore
            const analysis = yield window.electron.invoke('analyze-file', 'sample.l5x');
            setResult(analysis);
        }
        catch (e) {
            setResult({ error: e instanceof Error ? e.message : 'Analysis failed' });
        }
        setLoading(false);
    });
    return (React.createElement("div", { className: "flex flex-col items-center justify-center h-screen bg-gray-100" },
        React.createElement("h1", { className: "text-4xl font-bold mb-4" }, "Welcome to First Watch PLC Code Checker"),
        React.createElement("p", { className: "text-lg mb-8" }, "Analyze your Rockwell Automation PLC files for security risks."),
        React.createElement("div", { className: "flex space-x-4 mb-6" },
            React.createElement("button", { className: "px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600", onClick: handleSampleAnalysis, disabled: loading }, loading ? 'Analyzing...' : 'Run Sample Analysis'),
            React.createElement("button", { className: "px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600", onClick: () => navigate('/upload') }, "Upload File")),
        result && (React.createElement("pre", { className: "bg-white p-4 rounded shadow max-w-xl w-full overflow-x-auto text-sm text-left" }, JSON.stringify(result, null, 2)))));
};
exports.default = Home;
