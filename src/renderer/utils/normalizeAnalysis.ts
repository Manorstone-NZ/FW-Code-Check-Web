// Utility to normalize instruction_analysis for consistent rendering everywhere
export function normalizeInstructionAnalysis(analysis: any): any {
  if (!analysis) return analysis;
  let instr = analysis.analysis_json?.instruction_analysis;
  if (typeof instr === 'string') {
    try {
      const parsed = JSON.parse(instr);
      instr = Array.isArray(parsed) ? parsed : [];
    } catch {
      instr = [];
    }
  } else if (!Array.isArray(instr)) {
    instr = [];
  }
  return {
    ...analysis,
    analysis_json: {
      ...analysis.analysis_json,
      instruction_analysis: instr
    }
  };
}
