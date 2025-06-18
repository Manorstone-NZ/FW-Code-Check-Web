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
const SectionCard = ({ title, children }) => (React.createElement("div", { className: "mb-6 bg-white rounded-xl shadow-sm border border-gray-100" },
    React.createElement("h2", { className: "text-lg font-semibold text-gray-800 p-4 border-b border-gray-100" }, title),
    children));
const AnalysisDetails = ({ analysis }) => {
    const { analysis_json } = analysis;
    const { llm_results, instruction_analysis } = analysis_json;
    // Parse llm_results into sections if it's a string
    const llmSections = typeof llm_results === 'string' && llm_results
        ? llm_results.split('\n\n').reduce((acc, section) => {
            const [title, ...content] = section.split('\n');
            if (title && content.length) {
                acc[title.replace(/^\d+\.\s*/, '').trim()] = content.join('\n');
            }
            return acc;
        }, {})
        : null;
    // Define the order of sections, replacing INSTRUCTION-LEVEL ANALYSIS with instruction_analysis table
    const sectionOrder = llmSections
        ? Object.keys(llmSections).filter((title) => title !== 'INSTRUCTION-LEVEL ANALYSIS').concat(['Instruction-level Security Analysis'])
        : ['Instruction-level Security Analysis'];
    return (React.createElement("div", { className: "p-6 max-w-4xl mx-auto" },
        typeof llm_results === 'object' && llm_results.error ? (React.createElement(SectionCard, { title: "LLM Failed" },
            React.createElement("p", { className: "p-4 text-red-600" }, llm_results.error))) : llm_results === '' ? (React.createElement(SectionCard, { title: "No LLM response" },
            React.createElement("p", { className: "p-4 text-gray-600" }, "No LLM response available."))) : (React.createElement(SectionCard, { title: "LLM Success" },
            React.createElement("p", { className: "p-4 text-green-600" }, "Analysis completed successfully."))),
        sectionOrder.map((sectionTitle) => llmSections && llmSections[sectionTitle] && (React.createElement(SectionCard, { key: sectionTitle, title: sectionTitle },
            React.createElement("div", { className: "overflow-x-auto overflow-y-auto w-full bg-white rounded-b-xl border-t border-gray-100", style: {
                    maxHeight: '340px',
                    minHeight: '120px',
                    padding: '1.5rem',
                    boxSizing: 'border-box',
                } }, (() => {
                const content = llmSections[sectionTitle];
                let parsed = null;
                try {
                    parsed = JSON.parse(content);
                }
                catch (e) {
                    const match = content.match(/```json\s*([\s\S]+?)```/i) ||
                        content.match(/\[\s*{[\s\S]+}\s*\]/);
                    if (match) {
                        try {
                            parsed = JSON.parse(match[1] || match[0]);
                        }
                        catch (e2) { }
                    }
                }
                if (parsed) {
                    return (React.createElement("pre", { className: "whitespace-pre-wrap text-xs text-gray-800 m-0" }, JSON.stringify(parsed, null, 2)));
                }
                return (React.createElement("pre", { className: "whitespace-pre-wrap text-xs text-gray-800 m-0" }, content));
            })())))),
        React.createElement(SectionCard, { title: "Instruction-level Security Analysis" }, instruction_analysis && instruction_analysis.length > 0 ? (React.createElement("div", { className: "overflow-x-auto" },
            React.createElement("table", { className: "w-full text-left text-sm text-gray-800" },
                React.createElement("thead", null,
                    React.createElement("tr", { className: "bg-gray-50" },
                        React.createElement("th", { className: "p-3" }, "Instruction"),
                        React.createElement("th", { className: "p-3" }, "Insight"),
                        React.createElement("th", { className: "p-3" }, "Risk Level"))),
                React.createElement("tbody", null, instruction_analysis.map((item, index) => (React.createElement("tr", { key: index, className: "border-t border-gray-100" },
                    React.createElement("td", { className: "p-3" }, item.instruction),
                    React.createElement("td", { className: "p-3" }, item.insight),
                    React.createElement("td", { className: "p-3" }, item.risk_level)))))))) : (React.createElement("p", { className: "p-4 text-gray-600" }, "No instruction-level analysis available.")))));
};
exports.default = AnalysisDetails;
