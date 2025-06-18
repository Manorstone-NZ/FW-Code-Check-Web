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
const AnalysisDetails_1 = __importDefault(require("./AnalysisDetails"));
const react_router_dom_1 = require("react-router-dom");
const App_1 = require("../App");
const FileUploader = () => {
    const [fileName, setFileName] = React.useState(null);
    const [result, setResult] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [filePath, setFilePath] = React.useState(null);
    const { refresh: refreshAnalyses } = (0, analysisApi_1.useAnalyses)();
    const navigate = (0, react_router_dom_1.useNavigate)();
    const [saved, setSaved] = React.useState(false);
    const [showRaw, setShowRaw] = React.useState(false);
    const { provider: llmProvider } = React.useContext(App_1.LLMProviderContext);
    const analyzeFile = (file) => __awaiter(void 0, void 0, void 0, function* () {
        setLoading(true);
        setResult(null);
        setError(null);
        setFilePath(file.path);
        try {
            const analysis = yield (0, analysisApi_1.analyzeFile)(file.path, llmProvider);
            setResult(analysis);
            // Refresh analyses list after upload
            refreshAnalyses();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Analysis failed');
        }
        setLoading(false);
    });
    const handleFileChange = (event) => {
        var _a;
        const file = (_a = event.target.files) === null || _a === void 0 ? void 0 : _a[0];
        if (file) {
            setFileName(file.name);
            analyzeFile(file);
        }
    };
    const handleDragOver = (event) => {
        event.preventDefault();
    };
    const handleDrop = (event) => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file) {
            setFileName(file.name);
            analyzeFile(file);
        }
    };
    // Handler for uploading a JSON result file
    const handleJsonUpload = (event) => {
        var _a;
        const file = (_a = event.target.files) === null || _a === void 0 ? void 0 : _a[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                var _a;
                try {
                    const json = JSON.parse((_a = e.target) === null || _a === void 0 ? void 0 : _a.result);
                    setResult(json);
                    setFileName(file.name);
                    setFilePath(null);
                    setSaved(false);
                }
                catch (err) {
                    alert('Invalid JSON file.');
                }
            };
            reader.readAsText(file);
        }
    };
    // Define a shared button style for consistency
    const baseBtn = "px-6 py-3 min-w-[160px] rounded-lg font-semibold shadow transition-colors duration-200 flex items-center justify-center gap-2 text-base";
    const btnPrimary = `${baseBtn} bg-blue-600 text-white hover:bg-blue-700`;
    const btnSuccess = `${baseBtn} bg-green-600 text-white hover:bg-green-700`;
    const btnSecondary = `${baseBtn} bg-white border-2 border-green-600 text-green-600 hover:bg-green-50 hover:border-green-700`;
    const btnGray = `${baseBtn} bg-gray-600 text-white hover:bg-gray-700`;
    const btnDanger = `${baseBtn} bg-red-600 text-white hover:bg-red-700`;
    return (React.createElement("div", { className: "flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-md border border-gray-200 max-w-2xl mx-auto mt-8" },
        React.createElement("h2", { className: "mb-4 text-2xl font-bold text-[#0275D8]" }, "Upload PLC Files or Import Analysis"),
        React.createElement("div", { className: "flex flex-row gap-4 mb-6 w-full justify-center" },
            React.createElement("label", { className: btnPrimary + " cursor-pointer" },
                "Upload JSON Result",
                React.createElement("input", { type: "file", accept: "application/json,.json", onChange: handleJsonUpload, className: "hidden" })),
            React.createElement("input", { type: "file", accept: ".l5x,.txt", onChange: handleFileChange, className: "hidden", id: "plc-upload-input" }),
            React.createElement("label", { htmlFor: "plc-upload-input", className: btnSuccess + " cursor-pointer" }, "Upload PLC File")),
        fileName && React.createElement("p", { className: "mb-2 text-sm text-gray-700" },
            "Selected file: ",
            React.createElement("span", { className: "font-mono font-semibold" }, fileName)),
        loading && React.createElement("p", { className: "mb-2 text-blue-600" }, "Analyzing..."),
        error && React.createElement("p", { className: "mb-2 text-red-600" },
            "Error: ",
            error),
        result !== null && result !== undefined && (React.createElement(React.Fragment, null,
            React.createElement("div", { className: "bg-gray-50 rounded-xl shadow max-w-3xl w-full mt-6 p-2" },
                React.createElement(AnalysisDetails_1.default, { analysis: {
                        fileName: fileName,
                        filePath: filePath,
                        status: 'complete',
                        date: new Date().toISOString(),
                        analysis_json: result
                    } })),
            React.createElement("div", { className: "flex flex-row flex-wrap gap-4 mt-6 w-full justify-center" },
                React.createElement("button", { className: btnSuccess, disabled: saved, onClick: () => __awaiter(void 0, void 0, void 0, function* () {
                        if (fileName && result) {
                            try {
                                // @ts-ignore
                                yield window.electron.invoke('save-analysis', fileName, 'complete', result, filePath || '');
                                setSaved(true);
                                refreshAnalyses();
                                alert('Analysis saved to database!');
                            }
                            catch (e) {
                                alert('Failed to save analysis');
                            }
                        }
                    }) }, saved ? 'Saved to Database' : 'Save Analysis to Database'),
                React.createElement("button", { className: btnSuccess, onClick: () => __awaiter(void 0, void 0, void 0, function* () {
                        if (fileName && result) {
                            try {
                                // Save the full analysis result as analysis_json
                                yield (0, analysisApi_1.saveBaseline)(fileName, fileName, filePath || '', result);
                                alert('Saved as baseline!');
                            }
                            catch (e) {
                                alert('Failed to save as baseline');
                            }
                        }
                    }) }, "Save as Baseline"),
                React.createElement("button", { className: btnGray, style: { opacity: 1, visibility: 'visible', display: 'flex', backgroundColor: '#6B7280', color: '#fff', border: 'none' }, onClick: () => {
                        if (result && fileName) {
                            const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `${fileName.replace(/\.[^.]+$/, '') || 'analysis'}-llm-result.json`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            URL.revokeObjectURL(url);
                        }
                    } }, "Save to File"),
                React.createElement("button", { className: btnPrimary, onClick: () => setShowRaw(true) }, "Show Raw Output")),
            showRaw && (React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" },
                React.createElement("div", { className: "bg-white rounded-xl shadow-lg max-w-2xl w-full p-6 relative" },
                    React.createElement("button", { className: btnDanger + " absolute top-4 right-4 w-10 h-10 !p-0 flex items-center justify-center text-2xl", onClick: () => setShowRaw(false), "aria-label": "Close" }, "\u00D7"),
                    React.createElement("h2", { className: "text-lg font-bold mb-4" }, "Raw LLM Output"),
                    React.createElement("pre", { className: "bg-gray-100 p-4 rounded text-xs overflow-x-auto max-h-96" }, JSON.stringify(result, null, 2)),
                    React.createElement("button", { className: btnPrimary + " mt-4", onClick: () => {
                            navigator.clipboard.writeText(JSON.stringify(result, null, 2));
                            alert('Raw output copied to clipboard!');
                        } }, "Copy to Clipboard"))))))));
};
exports.default = FileUploader;
