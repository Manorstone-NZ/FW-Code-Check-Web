"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeInstructionAnalysis = void 0;
// Utility to normalize instruction_analysis for consistent rendering everywhere
function normalizeInstructionAnalysis(analysis) {
    var _a;
    if (!analysis)
        return analysis;
    let instr = (_a = analysis.analysis_json) === null || _a === void 0 ? void 0 : _a.instruction_analysis;
    if (typeof instr === 'string') {
        try {
            const parsed = JSON.parse(instr);
            instr = Array.isArray(parsed) ? parsed : [];
        }
        catch (_b) {
            instr = [];
        }
    }
    else if (!Array.isArray(instr)) {
        instr = [];
    }
    return Object.assign(Object.assign({}, analysis), { analysis_json: Object.assign(Object.assign({}, analysis.analysis_json), { instruction_analysis: instr }) });
}
exports.normalizeInstructionAnalysis = normalizeInstructionAnalysis;
