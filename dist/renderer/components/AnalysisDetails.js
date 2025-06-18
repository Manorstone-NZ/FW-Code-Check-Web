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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const React = __importStar(require("react"));
const InstructionAnalysisTable_1 = __importDefault(require("./InstructionAnalysisTable"));
const react_markdown_1 = __importDefault(require("react-markdown"));
// Helper to parse LLM response into sections (returns all text, not just summary)
function parseLLMSectionsRaw(llmText) {
    if (typeof llmText !== 'string')
        return llmText;
    // Split by section headers, but keep all text
    return llmText.split(/\n(?=[A-Z ]+:)/g).map((section, i) => section.trim()).filter(Boolean);
}
// Helper to parse LLM response into structured sections and subfields
function parseLLMStructured(llmText) {
    if (typeof llmText !== 'string' || !llmText.trim())
        return null;
    // Split by main section headers
    const sectionRegex = /^(SUMMARY|CODE QUALITY|RECOMMENDATIONS|CYBER SECURITY FINDING[S]?)(:)?$/gim;
    const lines = llmText.split(/\r?\n/);
    let currentSection = null;
    let currentSubfield = null;
    const result = {};
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line)
            continue;
        // Section header
        const sectionMatch = line.match(/^(SUMMARY|CODE QUALITY|RECOMMENDATIONS|CYBER SECURITY FINDING[S]?)(:)?$/i);
        if (sectionMatch) {
            currentSection = sectionMatch[1].toUpperCase();
            result[currentSection] = { _text: '' };
            currentSubfield = null;
            continue;
        }
        // Subfield header (indented or at start of line, e.g. 'Clarity', 'Maintainability', etc.)
        if (currentSection === 'CODE QUALITY' && /^(Clarity|Maintainability|Best Practices)(:)?$/i.test(line)) {
            currentSubfield = line.replace(/:$/, '');
            result[currentSection][currentSubfield] = '';
            continue;
        }
        if (currentSection === 'RECOMMENDATIONS' && /^(Documentation|Variable Naming|Structure|Consistency)(:)?$/i.test(line)) {
            currentSubfield = line.replace(/:$/, '');
            result[currentSection][currentSubfield] = '';
            continue;
        }
        if (currentSection === 'CYBER SECURITY FINDING' && /^(Lack of Security Measures|Potential Vulnerabilities|Mitigations)(:)?$/i.test(line)) {
            currentSubfield = line.replace(/:$/, '');
            result[currentSection][currentSubfield] = '';
            continue;
        }
        // Add line to current subfield or section
        if (currentSection) {
            if (currentSubfield) {
                result[currentSection][currentSubfield] += (result[currentSection][currentSubfield] ? '\n' : '') + line;
            }
            else {
                result[currentSection]._text += (result[currentSection]._text ? '\n' : '') + line;
            }
        }
    }
    return result;
}
// Helper to parse new LLM structured response
function parseNewLLMSections(llmText) {
    if (typeof llmText !== 'string' || !llmText.trim())
        return null;
    // Use regex to split sections by numbered headers
    const sectionRegex = /^\s*(\d+)\.\s+([A-Z \-]+)\s*$/gm;
    const result = {};
    let match;
    let lastSection = null;
    let lastIndex = 0;
    while ((match = sectionRegex.exec(llmText)) !== null) {
        if (lastSection) {
            result[lastSection] = llmText.slice(lastIndex, match.index).trim();
        }
        lastSection = match[2].trim();
        lastIndex = sectionRegex.lastIndex;
    }
    if (lastSection) {
        result[lastSection] = llmText.slice(lastIndex).trim();
    }
    return result;
}
// Helper: Parse Ollama-style sections (robust, flexible, all markdown headers)
function parseOllamaSections(llmText) {
    if (typeof llmText !== 'string' || !llmText.trim())
        return null;
    // Match all markdown headers (##, ###, ####, etc.) at the start of a line
    const sectionRegex = /^(#{2,6})[ \t]*([^\n#]+)[ \t]*$/gm;
    const result = [];
    let match;
    let lastIndex = 0;
    let lastTitle = null;
    while ((match = sectionRegex.exec(llmText)) !== null) {
        if (lastTitle !== null) {
            result.push({
                title: lastTitle,
                content: llmText.slice(lastIndex, match.index).trim()
            });
        }
        lastTitle = match[2].trim();
        lastIndex = sectionRegex.lastIndex;
    }
    if (lastTitle !== null) {
        result.push({
            title: lastTitle,
            content: llmText.slice(lastIndex).trim()
        });
    }
    return result;
}
const SectionCard = ({ title, children, highlight, noPadding }) => (React.createElement("div", { className: `bg-white rounded-xl shadow-md ${noPadding ? '' : 'p-6'} border ${highlight ? 'border-[#D9534F]' : 'border-gray-100'} mb-6` },
    React.createElement("div", { className: `font-bold text-xl mb-3 flex items-center gap-2 ${highlight ? 'text-[#D9534F]' : 'text-[#232B3A]'}` },
        React.createElement("span", null, title)),
    React.createElement("div", { className: `text-gray-700 whitespace-pre-line text-base ${noPadding ? 'p-0' : ''}` }, children)));
// Helper: Render '- **Label**: Value' and also handle markdown-style headers (e.g., '- **Header**:') with carriage returns between groups
function renderLabelValueList(content) {
    const lines = content.split(/\n|---/).map(l => l.trim());
    const items = [];
    let lastWasHeader = false;
    for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(/^[-*] +\*\*(.+?)\*\*: ?(.*)$/);
        if (match) {
            if (lastWasHeader)
                items.push('break'); // Insert break before new header
            items.push({ label: match[1], value: match[2] });
            lastWasHeader = true;
        }
        else if (lines[i] === '' && items.length > 0 && !lastWasHeader) {
            items.push('break');
            lastWasHeader = false;
        }
        else if (lines[i]) {
            // Continuation of previous value
            const last = items[items.length - 1];
            if (last && last !== 'break' && last.value !== undefined) {
                last.value += (last.value ? '\n' : '') + lines[i];
            }
            lastWasHeader = false;
        }
    }
    if (items.length === 0)
        return null;
    return (React.createElement("dl", { className: "grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 mb-2" }, items.map((item, i) => item === 'break' ? (React.createElement("div", { key: i, className: "col-span-2 h-4" })) : (React.createElement(React.Fragment, { key: i },
        React.createElement("dt", { className: "font-semibold text-gray-700 mt-2 first:mt-0" }, item.label),
        React.createElement("dd", { className: "text-gray-900 whitespace-pre-line" }, item.value))))));
}
// Helper: Render markdown lists in NEXT STEPS with extra spacing between groups
function renderNextSteps(content) {
    // Add a blank line before lines ending with ':' (section headers)
    const formatted = content.replace(/(^|\n)([^\n]+:)/g, '\n\n$2');
    // Use a more professional checkmark icon (SVG)
    return (React.createElement(react_markdown_1.default, { components: {
            li: (_a) => {
                var { children } = _a, props = __rest(_a, ["children"]);
                return (React.createElement("li", { className: "mb-1 flex items-center" },
                    React.createElement("span", { className: "inline-block mr-2 align-middle", style: { width: 18, height: 18 } },
                        React.createElement("svg", { viewBox: "0 0 20 20", fill: "none", xmlns: "http://www.w3.org/2000/svg", width: 18, height: 18 },
                            React.createElement("circle", { cx: "10", cy: "10", r: "10", fill: "#0275D8" }),
                            React.createElement("path", { d: "M6 10.5L9 13.5L14 7.5", stroke: "#fff", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }))),
                    React.createElement("span", null, children)));
            },
        } }, formatted));
}
// Helper: Render Implications and Recommendations as a table if markdown table is present
function renderImplicationsTable(content) {
    // Try to extract markdown table
    const tableMatch = content.match(/\|\s*Risk\s*\|.*?\|([\s\S]+?)\n\s*\|/i);
    if (!tableMatch)
        return null;
    // Parse all table rows
    const rows = content.split('\n').filter(l => l.trim().startsWith('|'));
    if (rows.length < 3)
        return null; // header + separator + at least one row
    const headers = rows[0].split('|').map(h => h.trim()).filter(Boolean);
    const dataRows = rows.slice(2).map(row => row.split('|').map(cell => cell.trim()).filter(Boolean));
    return (React.createElement("div", { className: "overflow-x-auto" },
        React.createElement("table", { className: "table-auto w-full bg-white text-sm border rounded shadow" },
            React.createElement("thead", null,
                React.createElement("tr", { className: "bg-gray-100" }, headers.map((h, i) => React.createElement("th", { key: i, className: "p-3 text-left font-semibold" }, h)))),
            React.createElement("tbody", null, dataRows.map((cells, i) => (React.createElement("tr", { key: i, className: "border-b last:border-b-0" }, cells.map((cell, j) => React.createElement("td", { key: j, className: "p-3 align-top" }, cell)))))))));
}
const getLLMStatus = (llm) => {
    if (!llm)
        return { status: 'No LLM response', ok: false, error: null };
    if (typeof llm === 'object' && llm.error)
        return { status: 'LLM Failed', ok: false, error: llm.error };
    if (typeof llm === 'string' && llm.trim().length > 0)
        return { status: 'LLM Success', ok: true, error: null };
    return { status: 'No LLM response', ok: false, error: null };
};
// Extract instruction_analysis from analysis or llm_results
const extractInstructionAnalysis = (analysis, llm) => {
    var _a;
    // 1. Try top-level field (already normalized by normalizeInstructionAnalysis)
    let instr = (_a = analysis.analysis_json) === null || _a === void 0 ? void 0 : _a.instruction_analysis;
    if (Array.isArray(instr) && instr.length > 0)
        return instr;
    // 2. Try to extract from llm_results as JSON code block or array
    if (typeof llm === 'string' && llm.includes('instruction_analysis')) {
        // Try to find a JSON array in a code block
        const jsonBlock = (() => {
            const codeBlock = llm.match(/```json\s*([\s\S]+?)```/i);
            if (codeBlock && codeBlock[1])
                return codeBlock[1];
            // Fallback: look for instruction_analysis: [ ... ]
            const arrMatch = llm.match(/instruction_analysis\s*[:=]\s*(\[[\s\S]*?\])/);
            if (arrMatch && arrMatch[1])
                return arrMatch[1];
            return null;
        })();
        if (jsonBlock) {
            try {
                const arr = JSON.parse(jsonBlock);
                if (Array.isArray(arr))
                    return arr;
            }
            catch (_b) {
                // Try eval as fallback
                try {
                    // eslint-disable-next-line no-eval
                    const arr = eval(jsonBlock);
                    if (Array.isArray(arr))
                        return arr;
                }
                catch (_c) { }
            }
        }
    }
    return [];
};
// Extract LLM result from various possible structures in analysis
const extractLLMResult = (analysis) => {
    var _a, _b;
    // Try all possible locations for llm_results
    let llm = ((_a = analysis === null || analysis === void 0 ? void 0 : analysis.analysis_json) === null || _a === void 0 ? void 0 : _a.llm_results)
        || (analysis === null || analysis === void 0 ? void 0 : analysis.llm_results)
        || (analysis === null || analysis === void 0 ? void 0 : analysis.llm_result)
        || ((_b = analysis === null || analysis === void 0 ? void 0 : analysis.analysis_json) === null || _b === void 0 ? void 0 : _b.llm_result);
    // If still not found, try to find a string value in analysis_json that looks like an LLM result
    if (!llm && (analysis === null || analysis === void 0 ? void 0 : analysis.analysis_json) && typeof analysis.analysis_json === 'object') {
        for (const key of Object.keys(analysis.analysis_json)) {
            const val = analysis.analysis_json[key];
            if (typeof val === 'string' &&
                (val.includes('EXECUTIVE SUMMARY') || val.includes('CODE STRUCTURE & QUALITY REVIEW') || val.includes('CYBER SECURITY KEY FINDINGS'))) {
                llm = val;
                break;
            }
        }
    }
    // Fallback: check top-level keys for LLM result
    if (!llm && typeof analysis === 'object') {
        for (const key of Object.keys(analysis)) {
            const val = analysis[key];
            if (typeof val === 'string' &&
                (val.includes('EXECUTIVE SUMMARY') || val.includes('CODE STRUCTURE & QUALITY REVIEW') || val.includes('CYBER SECURITY KEY FINDINGS'))) {
                llm = val;
                break;
            }
        }
    }
    // Patch: If llm_results is empty, try to parse filePath as JSON and extract llm_results from there
    if ((!llm || llm === "") && typeof analysis.filePath === "string") {
        try {
            const parsed = JSON.parse(analysis.filePath);
            if (parsed && typeof parsed.llm_results === "string" && parsed.llm_results.length > 0) {
                llm = parsed.llm_results;
            }
        }
        catch (e) {
            // Ignore parse errors
        }
    }
    return typeof llm === 'string' ? llm : null;
};
const AnalysisDetails = ({ analysis }) => {
    var _a;
    if (!analysis)
        return null;
    const { fileName, status, date, analysis_json, provider } = analysis;
    // Add badge for Analysis or Baseline
    let typeLabel = 'Analysis';
    let typeColor = 'bg-blue-600';
    if (status && typeof status === 'string' && status.toLowerCase().includes('baseline')) {
        typeLabel = 'Baseline';
        typeColor = 'bg-green-600';
    }
    // Use robust LLM extraction
    const llm = extractLLMResult(analysis);
    const llmStatus = getLLMStatus(llm);
    // Detect provider (from analysis or context)
    const detectedProvider = provider || analysis.llm_provider || (analysis_json === null || analysis_json === void 0 ? void 0 : analysis_json.provider) || 'openai';
    // Try all parsing strategies
    const llmSectionsOpenAI = parseNewLLMSections(typeof llm === 'string' ? llm : '');
    const llmSectionsOllama = parseOllamaSections(typeof llm === 'string' ? llm : '');
    // Prefer OpenAI if it matches, else Ollama, else fallback
    const hasOpenAISections = llmSectionsOpenAI && Object.keys(llmSectionsOpenAI).length > 0 && llmSectionsOpenAI['EXECUTIVE SUMMARY'];
    const hasOllamaSections = Array.isArray(llmSectionsOllama) && llmSectionsOllama.length > 0;
    const llmSections = hasOpenAISections ? llmSectionsOpenAI : hasOllamaSections ? llmSectionsOllama : null;
    const llmSectionsRaw = parseLLMSectionsRaw(typeof llm === 'string' ? llm : '');
    const llmStructured = parseLLMStructured(typeof llm === 'string' ? llm : '');
    const vulnerabilities = (analysis_json === null || analysis_json === void 0 ? void 0 : analysis_json.vulnerabilities) || [];
    const recommendations = (analysis_json === null || analysis_json === void 0 ? void 0 : analysis_json.recommendations) || [];
    const report = ((_a = analysis_json === null || analysis_json === void 0 ? void 0 : analysis_json.report) === null || _a === void 0 ? void 0 : _a.category) || {};
    // --- UI CLEANUP & PROFESSIONAL RENDERING ---
    // Remove debug sections, focus on professional report layout
    // Extract key LLM sections for prominent display
    const execSummary = (llmSections === null || llmSections === void 0 ? void 0 : llmSections['EXECUTIVE SUMMARY']) || '';
    const cyberFindings = (llmSections === null || llmSections === void 0 ? void 0 : llmSections['CYBER SECURITY KEY FINDINGS']) || '';
    const structureObs = (llmSections === null || llmSections === void 0 ? void 0 : llmSections['GENERAL STRUCTURE OBSERVATIONS']) || '';
    const codeQuality = (llmSections === null || llmSections === void 0 ? void 0 : llmSections['CODE STRUCTURE & QUALITY REVIEW']) || '';
    const implications = (llmSections === null || llmSections === void 0 ? void 0 : llmSections['IMPLICATIONS AND RECOMMENDATIONS']) || '';
    const nextSteps = (llmSections === null || llmSections === void 0 ? void 0 : llmSections['NEXT STEPS']) || '';
    // Highlight if any critical/high vulnerabilities
    const vulnList = Array.isArray(report.vulnerabilities) ? report.vulnerabilities : [];
    const hasCritical = vulnList.some((v) => typeof v === 'string' ? v.toLowerCase().includes('critical') : JSON.stringify(v).toLowerCase().includes('critical'));
    const hasHigh = vulnList.some((v) => typeof v === 'string' ? v.toLowerCase().includes('high') : JSON.stringify(v).toLowerCase().includes('high'));
    // Robustly extract instruction_analysis from all possible sources
    const instructionAnalysis = extractInstructionAnalysis(analysis, typeof llm === 'string' ? llm : '');
    // --- HIDE RAW INSTRUCTION-LEVEL ANALYSIS JSON BLOCKS IN LLM OUTPUT ---
    // If llm_results contains a code block with INSTRUCTION-LEVEL ANALYSIS or a JSON array, remove it from the markdown rendering
    let cleanedLlmSections = Object.assign({}, llmSections);
    if (cleanedLlmSections && typeof cleanedLlmSections === 'object') {
        Object.keys(cleanedLlmSections).forEach((key) => {
            if (key.toUpperCase().includes('INSTRUCTION-LEVEL ANALYSIS')) {
                delete cleanedLlmSections[key];
            }
            else if (typeof cleanedLlmSections[key] === 'string') {
                // Remove any code block containing a JSON array
                cleanedLlmSections[key] = cleanedLlmSections[key].replace(/```json[\s\S]*?```/g, '').replace(/\n{3,}/g, '\n\n');
            }
        });
    }
    // Render Ollama sections if detected
    if (hasOllamaSections) {
        // Display all sections in order, with original titles
        return (React.createElement("div", { className: "p-6 max-w-4xl mx-auto" },
            React.createElement("div", { className: "flex items-center mb-4" },
                React.createElement("span", { className: `inline-block px-3 py-1 text-xs font-semibold text-white rounded-full mr-3 ${typeColor}` }, typeLabel),
                React.createElement("span", { className: "text-gray-700 font-bold text-lg truncate" }, fileName),
                date && React.createElement("span", { className: "ml-4 text-xs text-gray-400" }, date),
                React.createElement("span", { className: "ml-4 text-xs text-blue-500" },
                    "Provider: ",
                    detectedProvider)),
            Array.isArray(llmSections)
                ? llmSections.map(({ title, content }, i) => content ? (React.createElement(SectionCard, { key: i, title: title },
                    React.createElement(react_markdown_1.default, null, content))) : null)
                : null));
    }
    return (React.createElement("div", { className: "p-6 max-w-4xl mx-auto" },
        React.createElement("div", { className: "flex items-center mb-4" },
            React.createElement("span", { className: `inline-block px-3 py-1 text-xs font-semibold text-white rounded-full mr-3 ${typeColor}` }, typeLabel),
            React.createElement("span", { className: "text-gray-700 font-bold text-lg truncate" }, fileName),
            date && React.createElement("span", { className: "ml-4 text-xs text-gray-400" }, date)),
        (hasCritical || hasHigh) && (React.createElement("div", { className: "mb-4 p-3 bg-red-50 border border-red-300 rounded text-sm text-red-800 font-semibold flex items-center gap-2" },
            React.createElement("span", { className: "text-2xl" }, "\u26A0\uFE0F"),
            React.createElement("span", null,
                hasCritical ? 'Critical' : 'High',
                " vulnerabilities detected in this analysis. Review immediately."))),
        cleanedLlmSections['EXECUTIVE SUMMARY'] && (React.createElement(SectionCard, { title: "Executive Summary" },
            React.createElement(react_markdown_1.default, null, cleanedLlmSections['EXECUTIVE SUMMARY']))),
        cleanedLlmSections['CYBER SECURITY KEY FINDINGS'] && (React.createElement(SectionCard, { title: "Cyber Security Key Findings", highlight: true }, renderCyberFindings(cleanedLlmSections['CYBER SECURITY KEY FINDINGS']))),
        cleanedLlmSections['GENERAL STRUCTURE OBSERVATIONS'] && (React.createElement(SectionCard, { title: "General Structure Observations" },
            React.createElement(react_markdown_1.default, null, cleanedLlmSections['GENERAL STRUCTURE OBSERVATIONS']))),
        cleanedLlmSections['CODE STRUCTURE & QUALITY REVIEW'] && (React.createElement(SectionCard, { title: "Code Structure & Quality Review" },
            React.createElement(react_markdown_1.default, null, cleanedLlmSections['CODE STRUCTURE & QUALITY REVIEW']))),
        cleanedLlmSections['IMPLICATIONS AND RECOMMENDATIONS'] && (React.createElement(SectionCard, { title: "Implications and Recommendations" }, renderImplicationsTable(cleanedLlmSections['IMPLICATIONS AND RECOMMENDATIONS']) || (React.createElement(react_markdown_1.default, null, cleanedLlmSections['IMPLICATIONS AND RECOMMENDATIONS'])))),
        cleanedLlmSections['NEXT STEPS'] && (React.createElement(SectionCard, { title: "Next Steps" },
            React.createElement(react_markdown_1.default, { components: { li: (_a) => {
                        var props = __rest(_a, []);
                        return React.createElement("li", { className: "mb-1 flex items-center" },
                            React.createElement("span", { className: "text-blue-500 mr-2" }, "\u2714\uFE0F"),
                            React.createElement("span", null, props.children));
                    } } }, cleanedLlmSections['NEXT STEPS']))),
        vulnList.length > 0 && (React.createElement(SectionCard, { title: "Detected Vulnerabilities", highlight: true },
            React.createElement("ul", { className: "list-disc ml-6 text-[#D9534F]" }, vulnList.map((v, i) => (React.createElement("li", { key: i, className: "mb-1 flex items-start" },
                React.createElement("span", { className: "text-red-600 mr-2 mt-1" }, "\u26A0"),
                React.createElement("span", null, typeof v === 'string' ? v : JSON.stringify(v)))))))),
        report.potential_issues && report.potential_issues.length > 0 && (React.createElement(SectionCard, { title: "Potential Issues" },
            React.createElement("ul", { className: "list-disc ml-6" }, report.potential_issues.map((p, i) => React.createElement("li", { key: i }, p))))),
        report.example_malicious_change && (React.createElement(SectionCard, { title: "Example Malicious Change" },
            React.createElement("pre", { className: "bg-gray-100 p-2 rounded text-xs overflow-x-auto" }, report.example_malicious_change))),
        Array.isArray(instructionAnalysis) && instructionAnalysis.length > 0 ? (React.createElement(SectionCard, { title: "Instruction-level Security Analysis" },
            React.createElement(InstructionAnalysisTable_1.default, { data: instructionAnalysis }))) : (React.createElement(SectionCard, { title: "Instruction-level Security Analysis" },
            React.createElement("div", { className: "text-gray-500 italic" }, "No instruction-level analysis available.")))));
};
exports.default = AnalysisDetails;
// Helper: Render Cyber Security Key Findings as a styled list
function renderCyberFindings(content) {
    // Parse markdown-style findings into cards
    const findings = content.split(/\n(?=- \*\*Title\*\*:)/g).filter(f => f.trim().startsWith('- **Title**:'));
    if (findings.length === 0)
        return React.createElement(react_markdown_1.default, null, content);
    // Helper to extract risk level from finding text
    function getRiskLevel(text) {
        const match = text.match(/- \*\*Risk Level\*\*: *(\w+)/i);
        return match ? match[1].toLowerCase() : '';
    }
    return (React.createElement("div", { className: "grid gap-4" }, findings.map((finding, idx) => {
        const riskLevel = getRiskLevel(finding);
        const isCritical = riskLevel === 'critical';
        const isHigh = riskLevel === 'high';
        return (React.createElement("div", { key: idx, className: "bg-[#fff6f6] border border-[#f5c6cb] rounded-lg p-4 shadow-sm flex gap-3 items-start" },
            (isCritical || isHigh) && (React.createElement("span", { className: "inline-block mt-1 text-[#D9534F]" },
                React.createElement("svg", { width: "22", height: "22", fill: "none", viewBox: "0 0 22 22" },
                    React.createElement("circle", { cx: "11", cy: "11", r: "11", fill: "#D9534F" }),
                    React.createElement("path", { d: "M11 6v6", stroke: "#fff", strokeWidth: "2", strokeLinecap: "round" }),
                    React.createElement("circle", { cx: "11", cy: "16", r: "1.2", fill: "#fff" })))),
            React.createElement("div", { className: "flex-1" },
                React.createElement(react_markdown_1.default, { components: {
                        li: (_a) => {
                            var { children } = _a, props = __rest(_a, ["children"]);
                            return (React.createElement("li", { className: "mb-1 flex items-start" },
                                React.createElement("span", { className: "inline-block mr-2 mt-1" }),
                                React.createElement("span", null, children)));
                        },
                        strong: ({ children }) => React.createElement("span", { className: "font-semibold text-[#D9534F]" }, children),
                    } }, finding.trim()))));
    })));
}
