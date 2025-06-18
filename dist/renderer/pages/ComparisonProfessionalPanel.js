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
exports.professionalMarkdown = void 0;
const React = __importStar(require("react"));
const react_markdown_1 = __importDefault(require("react-markdown"));
exports.professionalMarkdown = `
# PLC Code Comparison Report

---

## File Summaries

| File | Description |
|------|-------------|
| **Analysis File** | This file represents a cyclic interrupt block (OB35) in a Siemens PLC program, which includes logic for digital output to DCS, alarm handling, and device group calling. It appears to have been modified to include additional logic for alarm manipulation and device control. |
| **Baseline File** | This file is the original version of the cyclic interrupt block (OB35) without any modifications for alarm handling or device control beyond the standard logic for digital output to DCS and device group calling. |

---

## Structural Differences

| Aspect | Details |
|--------|---------|
| **Additional Networks** | The analysis file contains additional networks (Network 2, 3, 4, 5) that are not present in the baseline file. |
| **Network Reordering** | The order of networks differs, with the analysis file having a different sequence of operations compared to the baseline file. |
| **Missing Function Calls** | The analysis file lacks some function calls present in the baseline file, such as those for device logic (e.g., GRP001_DVC_LGC). |

---

## Logic Differences

| Aspect | Details |
|--------|---------|
| **Alarm Handling** | The analysis file includes logic for skipping alarm function blocks based on a bit (M1.0) and continuously triggering alarms, which is absent in the baseline file. |
| **Alarm Acknowledge and Reset** | The analysis file contains logic to force alarm acknowledgment and reset using specific data blocks (DB99.DBX 0.1 and DB99.DBX 0.2). |
| **Device Control** | The analysis file calls fewer device control functions compared to the baseline file, indicating potential removal or bypassing of certain device logic. |

---

## Security and Risk Analysis

| Threat | Description |
|--------|-------------|
| **Alarm Manipulation** | The ability to skip alarm function blocks and force acknowledgment/reset poses a significant security risk, potentially allowing an attacker to suppress or manipulate alarm conditions. |
| **Control Flow Alteration** | The use of an attacker-controlled bit to skip alarm logic suggests a deliberate attempt to alter control flow for malicious purposes. |
| **Missing Device Logic** | The absence of certain device logic calls in the analysis file could indicate sabotage or unauthorized modification to disable or bypass critical device operations. |

---

## Key Risks and Recommendations

| Risk | Recommendation |
|-----------------------------|-----------------------------------------------------------------------------------------------|
| Alarm Skipping | Implement strict access controls and audit logs to monitor changes to control bits. |
| Forced Alarm Acknowledgment | Review and validate all alarm handling logic to ensure integrity and authenticity. |
| Continuous Alarm Triggering | Implement rate limiting and alert prioritization to prevent alarm fatigue. |
| Device Logic Bypassing | Conduct a thorough review of device group logic to ensure all necessary functions are active. |

---

## Conclusion

The analysis file exhibits significant modifications compared to the baseline file, particularly in alarm handling and device control logic. These changes introduce security risks, including potential alarm suppression and unauthorized control flow alterations. **Immediate action is recommended** to review and restore the original logic, implement access controls, and ensure the integrity of the PLC program.
`;
const keyRisksTable = (React.createElement("div", { className: "my-8" },
    React.createElement("h2", { className: "text-2xl font-bold text-blue-800 mt-10 mb-4 border-b-2 border-blue-100 pb-1 flex items-center gap-2" }, "Key Risks and Recommendations"),
    React.createElement("table", { className: "min-w-full border text-sm my-6 shadow-sm" },
        React.createElement("thead", null,
            React.createElement("tr", { className: "bg-blue-50" },
                React.createElement("th", { className: "border px-3 py-2 bg-blue-50 font-semibold text-blue-900" }, "Risk"),
                React.createElement("th", { className: "border px-3 py-2 bg-blue-50 font-semibold text-blue-900" }, "Recommendation"))),
        React.createElement("tbody", null,
            React.createElement("tr", null,
                React.createElement("td", { className: "border px-3 py-2 align-top" }, "Alarm Skipping"),
                React.createElement("td", { className: "border px-3 py-2 align-top" }, "Implement strict access controls and audit logs to monitor changes to control bits.")),
            React.createElement("tr", null,
                React.createElement("td", { className: "border px-3 py-2 align-top" }, "Forced Alarm Acknowledgment"),
                React.createElement("td", { className: "border px-3 py-2 align-top" }, "Review and validate all alarm handling logic to ensure integrity and authenticity.")),
            React.createElement("tr", null,
                React.createElement("td", { className: "border px-3 py-2 align-top" }, "Continuous Alarm Triggering"),
                React.createElement("td", { className: "border px-3 py-2 align-top" }, "Implement rate limiting and alert prioritization to prevent alarm fatigue.")),
            React.createElement("tr", null,
                React.createElement("td", { className: "border px-3 py-2 align-top" }, "Device Logic Bypassing"),
                React.createElement("td", { className: "border px-3 py-2 align-top" }, "Conduct a thorough review of device group logic to ensure all necessary functions are active."))))));
const ComparisonProfessionalPanel = ({ markdown }) => {
    // Split the markdown at the Key Risks and Recommendations section and inject the native table
    const baseFontClass = "text-[0.93rem]"; // Slightly smaller than default
    if (markdown && markdown.includes('Key Risks and Recommendations')) {
        const [before, ...after] = markdown.split(/##? Key Risks and Recommendations/i);
        // Find where the next section starts (--- or ##)
        let afterText = after.join('');
        const nextSectionIdx = afterText.search(/\n(---|##? )/);
        let afterRest = '';
        if (nextSectionIdx !== -1) {
            afterRest = afterText.slice(nextSectionIdx);
            afterText = afterText.slice(0, nextSectionIdx);
        }
        return (React.createElement("div", { className: `bg-white border border-blue-200 rounded-2xl shadow-xl p-8 max-w-4xl mx-auto mb-8 ${baseFontClass}` },
            React.createElement(react_markdown_1.default, { components: {
                    h1: (_a) => {
                        var { node } = _a, props = __rest(_a, ["node"]);
                        return React.createElement("h1", Object.assign({ className: "text-2xl font-extrabold text-blue-900 mb-6 tracking-tight" }, props));
                    },
                    h2: (_a) => {
                        var { node } = _a, props = __rest(_a, ["node"]);
                        return React.createElement("h2", Object.assign({ className: "text-lg font-bold text-blue-800 mt-10 mb-4 border-b-2 border-blue-100 pb-1 flex items-center gap-2" }, props));
                    },
                    table: (_a) => {
                        var { node } = _a, props = __rest(_a, ["node"]);
                        return React.createElement("table", Object.assign({ className: "min-w-full border text-xs my-6 shadow-sm" }, props));
                    },
                    th: (_a) => {
                        var { node } = _a, props = __rest(_a, ["node"]);
                        return React.createElement("th", Object.assign({ className: "border px-2 py-1 bg-blue-50 font-semibold text-blue-900 text-xs" }, props));
                    },
                    td: (_a) => {
                        var { node } = _a, props = __rest(_a, ["node"]);
                        return React.createElement("td", Object.assign({ className: "border px-2 py-1 align-top text-xs" }, props));
                    },
                    p: (_a) => {
                        var { node } = _a, props = __rest(_a, ["node"]);
                        return React.createElement("p", Object.assign({ className: "mb-2" }, props));
                    },
                    ul: (_a) => {
                        var { node } = _a, props = __rest(_a, ["node"]);
                        return React.createElement("ul", Object.assign({ className: "list-disc ml-7 my-2" }, props));
                    },
                    ol: (_a) => {
                        var { node } = _a, props = __rest(_a, ["node"]);
                        return React.createElement("ol", Object.assign({ className: "list-decimal ml-7 my-2" }, props));
                    },
                    li: (_a) => {
                        var { node } = _a, props = __rest(_a, ["node"]);
                        return React.createElement("li", Object.assign({ className: "mb-1" }, props));
                    },
                    code: (_a) => {
                        var { node } = _a, props = __rest(_a, ["node"]);
                        return React.createElement("code", Object.assign({ className: "bg-gray-100 px-1 rounded text-xs" }, props));
                    },
                    pre: (_a) => {
                        var { node } = _a, props = __rest(_a, ["node"]);
                        return React.createElement("pre", Object.assign({ className: "bg-gray-100 rounded p-2 my-2 overflow-x-auto text-xs" }, props));
                    },
                    hr: () => React.createElement("hr", { className: "my-6 border-blue-200" }),
                }, skipHtml: false }, before),
            keyRisksTable,
            React.createElement(react_markdown_1.default, { components: {
                    h1: (_a) => {
                        var { node } = _a, props = __rest(_a, ["node"]);
                        return React.createElement("h1", Object.assign({ className: "text-2xl font-extrabold text-blue-900 mb-6 tracking-tight" }, props));
                    },
                    h2: (_a) => {
                        var { node } = _a, props = __rest(_a, ["node"]);
                        return React.createElement("h2", Object.assign({ className: "text-lg font-bold text-blue-800 mt-10 mb-4 border-b-2 border-blue-100 pb-1 flex items-center gap-2" }, props));
                    },
                    table: (_a) => {
                        var { node } = _a, props = __rest(_a, ["node"]);
                        return React.createElement("table", Object.assign({ className: "min-w-full border text-xs my-6 shadow-sm" }, props));
                    },
                    th: (_a) => {
                        var { node } = _a, props = __rest(_a, ["node"]);
                        return React.createElement("th", Object.assign({ className: "border px-2 py-1 bg-blue-50 font-semibold text-blue-900 text-xs" }, props));
                    },
                    td: (_a) => {
                        var { node } = _a, props = __rest(_a, ["node"]);
                        return React.createElement("td", Object.assign({ className: "border px-2 py-1 align-top text-xs" }, props));
                    },
                    p: (_a) => {
                        var { node } = _a, props = __rest(_a, ["node"]);
                        return React.createElement("p", Object.assign({ className: "mb-2" }, props));
                    },
                    ul: (_a) => {
                        var { node } = _a, props = __rest(_a, ["node"]);
                        return React.createElement("ul", Object.assign({ className: "list-disc ml-7 my-2" }, props));
                    },
                    ol: (_a) => {
                        var { node } = _a, props = __rest(_a, ["node"]);
                        return React.createElement("ol", Object.assign({ className: "list-decimal ml-7 my-2" }, props));
                    },
                    li: (_a) => {
                        var { node } = _a, props = __rest(_a, ["node"]);
                        return React.createElement("li", Object.assign({ className: "mb-1" }, props));
                    },
                    code: (_a) => {
                        var { node } = _a, props = __rest(_a, ["node"]);
                        return React.createElement("code", Object.assign({ className: "bg-gray-100 px-1 rounded text-xs" }, props));
                    },
                    pre: (_a) => {
                        var { node } = _a, props = __rest(_a, ["node"]);
                        return React.createElement("pre", Object.assign({ className: "bg-gray-100 rounded p-2 my-2 overflow-x-auto text-xs" }, props));
                    },
                    hr: () => React.createElement("hr", { className: "my-6 border-blue-200" }),
                }, skipHtml: false }, afterRest)));
    }
    // fallback: just render markdown
    return (React.createElement("div", { className: `bg-white border border-blue-200 rounded-2xl shadow-xl p-8 max-w-4xl mx-auto mb-8 ${baseFontClass}` },
        React.createElement(react_markdown_1.default, { components: {
                h1: (_a) => {
                    var { node } = _a, props = __rest(_a, ["node"]);
                    return React.createElement("h1", Object.assign({ className: "text-2xl font-extrabold text-blue-900 mb-6 tracking-tight" }, props));
                },
                h2: (_a) => {
                    var { node } = _a, props = __rest(_a, ["node"]);
                    return React.createElement("h2", Object.assign({ className: "text-lg font-bold text-blue-800 mt-10 mb-4 border-b-2 border-blue-100 pb-1 flex items-center gap-2" }, props));
                },
                table: (_a) => {
                    var { node } = _a, props = __rest(_a, ["node"]);
                    return React.createElement("table", Object.assign({ className: "min-w-full border text-xs my-6 shadow-sm" }, props));
                },
                th: (_a) => {
                    var { node } = _a, props = __rest(_a, ["node"]);
                    return React.createElement("th", Object.assign({ className: "border px-2 py-1 bg-blue-50 font-semibold text-blue-900 text-xs" }, props));
                },
                td: (_a) => {
                    var { node } = _a, props = __rest(_a, ["node"]);
                    return React.createElement("td", Object.assign({ className: "border px-2 py-1 align-top text-xs" }, props));
                },
                p: (_a) => {
                    var { node } = _a, props = __rest(_a, ["node"]);
                    return React.createElement("p", Object.assign({ className: "mb-2" }, props));
                },
                ul: (_a) => {
                    var { node } = _a, props = __rest(_a, ["node"]);
                    return React.createElement("ul", Object.assign({ className: "list-disc ml-7 my-2" }, props));
                },
                ol: (_a) => {
                    var { node } = _a, props = __rest(_a, ["node"]);
                    return React.createElement("ol", Object.assign({ className: "list-decimal ml-7 my-2" }, props));
                },
                li: (_a) => {
                    var { node } = _a, props = __rest(_a, ["node"]);
                    return React.createElement("li", Object.assign({ className: "mb-1" }, props));
                },
                code: (_a) => {
                    var { node } = _a, props = __rest(_a, ["node"]);
                    return React.createElement("code", Object.assign({ className: "bg-gray-100 px-1 rounded text-xs" }, props));
                },
                pre: (_a) => {
                    var { node } = _a, props = __rest(_a, ["node"]);
                    return React.createElement("pre", Object.assign({ className: "bg-gray-100 rounded p-2 my-2 overflow-x-auto text-xs" }, props));
                },
                hr: () => React.createElement("hr", { className: "my-6 border-blue-200" }),
            }, skipHtml: false }, markdown || exports.professionalMarkdown)));
};
exports.default = ComparisonProfessionalPanel;
