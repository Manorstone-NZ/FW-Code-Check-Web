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
const CompareAnalysisToBaseline_1 = __importDefault(require("../pages/CompareAnalysisToBaseline"));
const AnalysisDetails_1 = __importDefault(require("../components/AnalysisDetails"));
const HistoryPage = () => {
    const { analyses, loading, error, refresh } = (0, analysisApi_1.useAnalyses)();
    const [details, setDetails] = React.useState(null);
    const [compareId, setCompareId] = React.useState(null);
    const handleView = (id) => __awaiter(void 0, void 0, void 0, function* () {
        setDetails(null);
        const data = yield (0, analysisApi_1.getAnalysisById)(id);
        setDetails(data);
    });
    const handleDelete = (id) => __awaiter(void 0, void 0, void 0, function* () {
        if (!window.confirm('Are you sure you want to delete this analysis?'))
            return;
        // @ts-ignore
        yield window.electron.invoke('delete-analysis', id);
        refresh();
    });
    return (React.createElement("div", { className: "p-6" },
        React.createElement("h2", { className: "text-2xl font-bold mb-4" }, "Analysis History"),
        loading && React.createElement("p", null, "Loading..."),
        error && React.createElement("p", { className: "text-red-600" }, error),
        React.createElement("table", { className: "min-w-full bg-white rounded shadow mb-6" },
            React.createElement("thead", null,
                React.createElement("tr", { className: "text-left border-b" },
                    React.createElement("th", { className: "py-2 px-4" }, "ID"),
                    React.createElement("th", { className: "py-2 px-4" }, "File Name"),
                    React.createElement("th", { className: "py-2 px-4" }, "Date"),
                    React.createElement("th", { className: "py-2 px-4" }, "Status"),
                    React.createElement("th", { className: "py-2 px-4" }, "Actions"))),
            React.createElement("tbody", null, analyses.map((a) => (React.createElement("tr", { key: a.id, className: "border-b hover:bg-gray-50" },
                React.createElement("td", { className: "py-2 px-4" }, a.id),
                React.createElement("td", { className: "py-2 px-4" }, a.fileName),
                React.createElement("td", { className: "py-2 px-4" }, a.date),
                React.createElement("td", { className: "py-2 px-4" }, a.status),
                React.createElement("td", { className: "py-2 px-4 flex gap-2" },
                    React.createElement("button", { className: "px-3 py-1 text-xs font-semibold bg-blue-600 text-white rounded shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transition", onClick: () => handleView(a.id), "aria-label": `View analysis ${a.id}` }, "View"),
                    React.createElement("button", { className: "px-3 py-1 text-xs font-semibold bg-red-600 text-white rounded shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50 transition", onClick: () => handleDelete(a.id), "aria-label": `Delete analysis ${a.id}` }, "Delete"))))))),
        details && (React.createElement("div", { className: "bg-gray-100 p-4 rounded shadow" },
            React.createElement("h3", { className: "font-semibold mb-2" }, "Analysis Details"),
            React.createElement(AnalysisDetails_1.default, { analysis: details }))),
        compareId && (React.createElement("div", { className: "bg-gray-100 p-4 rounded shadow mt-4" },
            React.createElement("h3", { className: "font-semibold mb-2" }, "Compare Analysis to Baseline"),
            React.createElement(CompareAnalysisToBaseline_1.default, { analysisId: compareId })))));
};
exports.default = HistoryPage;
