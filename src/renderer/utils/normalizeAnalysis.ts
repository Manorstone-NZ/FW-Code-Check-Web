// Utility to normalize instruction_analysis for consistent rendering everywhere
export function normalizeInstructionAnalysis(analysis: any): any {
  if (!analysis) return analysis;
  let instr = analysis.analysis_json?.instruction_analysis;
  // Try to extract from LLM result if not present or empty
  if (!instr || (Array.isArray(instr) && instr.length === 0)) {
    // Try all possible locations for llm_results
    let llm = analysis?.analysis_json?.llm_results
      || analysis?.llm_results
      || analysis?.llm_result
      || analysis?.analysis_json?.llm_result;
    if (!llm && analysis?.analysis_json && typeof analysis.analysis_json === 'object') {
      for (const key of Object.keys(analysis.analysis_json)) {
        const val = analysis.analysis_json[key];
        if (typeof val === 'string' &&
          (val.includes('EXECUTIVE SUMMARY') || val.includes('CODE STRUCTURE & QUALITY REVIEW') || val.includes('CYBER SECURITY KEY FINDINGS'))
        ) {
          llm = val;
          break;
        }
      }
    }
    if (typeof llm === 'string' && llm.includes('instruction_analysis')) {
      // Try to find a JSON array in a code block
      const codeBlock = llm.match(/```json\s*([\s\S]+?)```/i);
      let arr = [];
      if (codeBlock && codeBlock[1]) {
        try {
          arr = JSON.parse(codeBlock[1]);
        } catch {}
      } else {
        // Fallback: look for instruction_analysis: [ ... ]
        const arrMatch = llm.match(/instruction_analysis\s*[:=]\s*(\[[\s\S]*?\])/);
        if (arrMatch && arrMatch[1]) {
          try {
            arr = JSON.parse(arrMatch[1]);
          } catch {}
        }
      }
      if (Array.isArray(arr) && arr.length > 0) {
        instr = arr;
      }
    }
  }
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
