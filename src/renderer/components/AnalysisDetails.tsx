import * as React from 'react';
import SectionCard from './analysisDetails/SectionCard';
import VulnerabilityPanel from './analysisDetails/VulnerabilityPanel';
import InstructionAnalysisTable from './analysisDetails/InstructionAnalysisTable';
import { renderCyberFindings } from './analysisDetails/CyberFindingsPanel';
import { renderImplicationsTable } from './analysisDetails/ImplicationsTable';
import ReactMarkdown from 'react-markdown';

interface AnalysisDetailsProps {
  analysis: any;
  provider?: string;
  model?: string;
}

type SectionKey = 'SUMMARY' | 'CODE QUALITY' | 'RECOMMENDATIONS' | 'CYBER SECURITY FINDINGS';

// Helper to parse LLM response into sections (returns all text, not just summary)
function parseLLMSectionsRaw(llmText: string) {
  if (typeof llmText !== 'string') return llmText;
  // Split by section headers, but keep all text
  return llmText.split(/\n(?=[A-Z ]+:)/g).map((section, i) => section.trim()).filter(Boolean);
}

// Helper to parse LLM response into structured sections and subfields
function parseLLMStructured(llmText: string) {
  if (typeof llmText !== 'string' || !llmText.trim()) return null;
  // Split by main section headers
  const sectionRegex = /^(SUMMARY|CODE QUALITY|RECOMMENDATIONS|CYBER SECURITY FINDING[S]?)(:)?$/gim;
  const lines = llmText.split(/\r?\n/);
  let currentSection = null;
  let currentSubfield = null;
  const result: any = {};
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) continue;
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
      } else {
        result[currentSection]._text += (result[currentSection]._text ? '\n' : '') + line;
      }
    }
  }
  return result;
}

// Helper to parse new LLM structured response
function parseNewLLMSections(llmText: string) {
  if (typeof llmText !== 'string' || !llmText.trim()) return null;
  // Use regex to split sections by numbered headers
  const sectionRegex = /^\s*(\d+)\.\s+([A-Z \-]+)\s*$/gm;
  const result: any = {};
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

// Helper: Parse Ollama-style sections (robust, flexible, all markdown headers and bolded headers)
function parseOllamaSections(llmText: string) {
  if (typeof llmText !== 'string' || !llmText.trim()) return null;
  // Match all markdown headers (##, ###, etc.) and bolded headers (with or without numbers/periods)
  // e.g., **1. EXECUTIVE SUMMARY**, **EXECUTIVE SUMMARY**, **INSTRUCTION-LEVEL ANALYSIS (REQUIRED)**
  const sectionRegex = /^(#{2,6})[ \t]*([^\n#]+)[ \t]*$|^\*\*\s*(\d+\.?\s*)?([A-Z0-9 \-()]+)\*\*/gim;
  const codeBlockRegex = /```([\w]*)\n([\s\S]*?)```/g;
  const result: { title: string; content: string }[] = [];
  let match;
  let lastIndex = 0;
  let lastTitle = null;
  let lastHeaderMatch = null;
  let headerMatches: { index: number; title: string }[] = [];

  // Find all section headers (markdown or bolded)
  while ((match = sectionRegex.exec(llmText)) !== null) {
    let title = null;
    if (match[1]) {
      // Markdown header
      title = match[2].trim();
    } else if (match[4]) {
      // Bolded header, with or without number/period
      title = match[4].trim();
    }
    if (title) {
      headerMatches.push({ index: match.index, title });
    }
  }
  // Add a virtual header at the end to capture the last section
  headerMatches.push({ index: llmText.length, title: '' });

  // Extract sections between headers
  for (let i = 0; i < headerMatches.length - 1; i++) {
    const { index, title } = headerMatches[i];
    const nextIndex = headerMatches[i + 1].index;
    const content = llmText.slice(index, nextIndex).replace(sectionRegex, '').trim();
    if (title && content) {
      result.push({ title, content });
    }
  }

  // Find code blocks not already included in a section
  let codeMatch;
  while ((codeMatch = codeBlockRegex.exec(llmText)) !== null) {
    const codeBlock = codeMatch[0];
    const codeIndex = codeMatch.index;
    const alreadyIncluded = result.some(
      s => codeIndex >= llmText.indexOf(s.content) && codeIndex < llmText.indexOf(s.content) + s.content.length
    );
    if (!alreadyIncluded) {
      result.push({ title: 'Code Block', content: codeBlock });
    }
  }
  // Sort sections by their order in the text
  result.sort((a, b) => llmText.indexOf(a.content) - llmText.indexOf(b.content));
  return result;
}

// Helper to parse LLM response into flexible sections (numbered, markdown, or bold headers)
function parseFlexibleLLMSections(llmText: string) {
  if (typeof llmText !== 'string' || !llmText.trim()) return null;
  // Match numbered headers (e.g., '1. EXECUTIVE SUMMARY'), markdown headers (e.g., '## Executive Summary'), or bolded headers
  const sectionRegex = /^(\d+\.|##+|\*\*)\s*([A-Z0-9 \-()_]+)(\*\*)?\s*$/gim;
  const result: Record<string, string> = {};
  let match;
  let lastSection = null;
  let lastIndex = 0;
  while ((match = sectionRegex.exec(llmText)) !== null) {
    if (lastSection) {
      result[lastSection] = llmText.slice(lastIndex, match.index).trim();
    }
    // Normalize section name to uppercase and remove extra chars
    lastSection = match[2].replace(/[^A-Z0-9 \-()_]/gi, '').trim().toUpperCase();
    lastIndex = sectionRegex.lastIndex;
  }
  if (lastSection) {
    result[lastSection] = llmText.slice(lastIndex).trim();
  }
  return result;
}

const getLLMStatus = (llm: any) => {
  if (!llm) return { status: 'No LLM response', ok: false, error: null };
  if (typeof llm === 'object' && llm.error) return { status: 'LLM Failed', ok: false, error: llm.error };
  if (typeof llm === 'string' && llm.trim().length > 0) return { status: 'LLM Success', ok: true, error: null };
  return { status: 'No LLM response', ok: false, error: null };
};

// Extract instruction_analysis from analysis or llm_results
const extractInstructionAnalysis = (analysis: any, llm: string): any[] => {
  // 1. Try top-level field (already normalized by normalizeInstructionAnalysis)
  let instr = analysis.analysis_json?.instruction_analysis;
  if (Array.isArray(instr) && instr.length > 0) return instr;
  // 2. Try to extract from llm_results as JSON code block or array
  if (typeof llm === 'string' && llm.includes('instruction_analysis')) {
    // Try to find a JSON array in a code block
    const jsonBlock = (() => {
      const codeBlock = llm.match(/```json\s*([\s\S]+?)```/i);
      if (codeBlock && codeBlock[1]) return codeBlock[1];
      // Fallback: look for instruction_analysis: [ ... ]
      const arrMatch = llm.match(/instruction_analysis\s*[:=]\s*(\[[\s\S]*?\])/);
      if (arrMatch && arrMatch[1]) return arrMatch[1];
      return null;
    })();
    if (jsonBlock) {
      try {
        const arr = JSON.parse(jsonBlock);
        if (Array.isArray(arr)) return arr;
      } catch {
        // Try eval as fallback
        try {
          // eslint-disable-next-line no-eval
          const arr = eval(jsonBlock);
          if (Array.isArray(arr)) return arr;
        } catch {}
      }
    }
  }
  return [];
};

// Extract LLM result from various possible structures in analysis
const extractLLMResult = (analysis: any): string | null => {
  // First, handle the case where analysis_json is a string that needs parsing
  let parsedAnalysis = analysis;
  if (typeof analysis?.analysis_json === 'string') {
    try {
      parsedAnalysis = JSON.parse(analysis.analysis_json);
    } catch (e) {
      // Parse failed, continue with original analysis
    }
  } else if (analysis?.analysis_json && typeof analysis.analysis_json === 'object') {
    parsedAnalysis = analysis.analysis_json;
  }
  
  // Try all possible locations for llm_results - prioritize the most common location
  let llm = parsedAnalysis?.llm_results
    || parsedAnalysis?.llm_result
    || analysis?.llm_results
    || analysis?.llm_result
    || analysis?.analysis_json?.llm_results
    || analysis?.analysis_json?.llm_result;
  
  // Additional field variations to check
  if (!llm) {
    const additionalFields = [
      'analysis_result', 'result', 'response', 'content', 'output', 
      'analysis', 'report', 'findings', 'assessment', 'review',
      'llm_response', 'ai_analysis', 'security_analysis', 'plc_analysis'
    ];
    
    for (const field of additionalFields) {
      if (parsedAnalysis?.[field] && typeof parsedAnalysis[field] === 'string') {
        llm = parsedAnalysis[field];
        break;
      }
      if (analysis?.[field] && typeof analysis[field] === 'string') {
        llm = analysis[field];
        break;
      }
    }
  }
  
  // If still not found, try to find a string value that looks like an LLM result
  if (!llm && parsedAnalysis && typeof parsedAnalysis === 'object') {
    for (const key of Object.keys(parsedAnalysis)) {
      const val = parsedAnalysis[key];
      if (typeof val === 'string' && val.length > 50 && // Ensure it's substantial content
        (val.includes('EXECUTIVE SUMMARY') || val.includes('CODE STRUCTURE & QUALITY REVIEW') || 
         val.includes('CYBER SECURITY KEY FINDINGS') || val.includes('SUMMARY') || 
         val.includes('ANALYSIS') || val.includes('FINDINGS') || val.includes('RECOMMENDATIONS') ||
         val.includes('VULNERABILITY') || val.includes('SECURITY') || val.includes('PLC'))
      ) {
        llm = val;
        break;
      }
    }
  }
  
  // Fallback: check top-level keys for LLM result
  if (!llm && typeof analysis === 'object') {
    for (const key of Object.keys(analysis)) {
      const val = analysis[key];
      if (typeof val === 'string' && val.length > 50 && // Ensure it's substantial content
        (val.includes('EXECUTIVE SUMMARY') || val.includes('CODE STRUCTURE & QUALITY REVIEW') || 
         val.includes('CYBER SECURITY KEY FINDINGS') || val.includes('SUMMARY') || 
         val.includes('ANALYSIS') || val.includes('FINDINGS') || val.includes('RECOMMENDATIONS') ||
         val.includes('VULNERABILITY') || val.includes('SECURITY') || val.includes('PLC'))
      ) {
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
    } catch (e) {
      // Ignore parse errors
    }
  }
  
  // Final check: reject clearly non-analysis content
  if (llm && typeof llm === 'string') {
    // Filter out generic rejection messages or very short content
    if (llm.includes("I'm sorry, but I can't assist with that request") ||
        llm.includes("I cannot provide assistance") ||
        llm.length < 20) {
      return null;
    }
  }
  
  return typeof llm === 'string' ? llm : null;
};

// Hybrid section parser: handles both OpenAI and Ollama styles
function getLLMSections(llm: string) {
  const flex = parseFlexibleLLMSections(llm);
  const ollama = parseOllamaSections(llm);
  // Use the one with more sections, or fallback to either
  if (flex && ollama) {
    return Object.keys(flex).length >= ollama.length ? flex : Object.fromEntries(ollama.map(s => [s.title.toUpperCase(), s.content]));
  }
  if (flex) return flex;
  if (ollama) return Object.fromEntries(ollama.map(s => [s.title.toUpperCase(), s.content]));
  return null;
}

const AnalysisDetails: React.FC<AnalysisDetailsProps> = (props) => {
  const { analysis, provider: propProvider, model: propModel } = props;
  
  // Parse analysis_json if it's a string
  let parsedAnalysis = analysis;
  if (typeof analysis?.analysis_json === 'string') {
    try {
      parsedAnalysis = { ...analysis, analysis_json: JSON.parse(analysis.analysis_json) };
    } catch (e) {
      // Parse failed, continue with original analysis
    }
  }
  
  // Extract LLM result
  const llm = analysis ? (extractLLMResult(analysis) || '') : '';
  
  // Use hybrid parser for sections
  const llmSections = llm ? getLLMSections(llm) : null;
  
  // Extract vulnerabilities from parsed analysis
  const parsedAnalysisJson = typeof parsedAnalysis?.analysis_json === 'object' 
    ? parsedAnalysis.analysis_json 
    : null;
  const vulnerabilities = parsedAnalysisJson?.vulnerabilities 
    || parsedAnalysisJson?.report?.category?.vulnerabilities 
    || analysis?.vulnerabilities 
    || [];
    
  // Extract instruction analysis
  const instructionAnalysis = extractInstructionAnalysis(analysis, llm || '');

  return (
    <div className="bg-gray-50 rounded-xl shadow max-w-3xl w-full mt-6 p-2 mx-auto">
      {/* Info panel */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <b>File:</b> {analysis?.fileName || parsedAnalysisJson?.fileName || 'N/A'}<br/>
        <b>Provider:</b> {
          propProvider || 
          analysis?.provider || 
          parsedAnalysisJson?.provider || 
          analysis?.analysis_json?.provider ||
          (typeof analysis?.analysis_json === 'string' ? (() => {
            try {
              const parsed = JSON.parse(analysis.analysis_json);
              return parsed?.provider;
            } catch (e) {
              return null;
            }
          })() : null) ||
          'N/A'
        }<br/>
        <b>Model:</b> {
          propModel || 
          analysis?.model || 
          parsedAnalysisJson?.model || 
          analysis?.analysis_json?.model ||
          (typeof analysis?.analysis_json === 'string' ? (() => {
            try {
              const parsed = JSON.parse(analysis.analysis_json);
              return parsed?.model;
            } catch (e) {
              return null;
            }
          })() : null) ||
          'N/A'
        }
      </div>
      {/* Vulnerabilities */}
      {Array.isArray(vulnerabilities) && vulnerabilities.length > 0 && (
        <VulnerabilityPanel vulnerabilities={vulnerabilities} />
      )}
      {/* Executive Summary */}
      {llmSections && (llmSections['EXECUTIVE SUMMARY'] || llmSections['SUMMARY']) && (
        <SectionCard title="Executive Summary">
          <ReactMarkdown>{llmSections['EXECUTIVE SUMMARY'] || llmSections['SUMMARY']}</ReactMarkdown>
        </SectionCard>
      )}
      {/* Cyber Security Key Findings */}
      {llmSections && (llmSections['CYBER SECURITY KEY FINDINGS'] || llmSections['CYBER SECURITY FINDINGS']) && (
        <SectionCard title="Cyber Security Key Findings" highlight>
          {renderCyberFindings(llmSections['CYBER SECURITY KEY FINDINGS'] || llmSections['CYBER SECURITY FINDINGS'])}
        </SectionCard>
      )}
      {/* General Structure Observations */}
      {llmSections && llmSections['GENERAL STRUCTURE OBSERVATIONS'] && (
        <SectionCard title="General Structure Observations">
          <ReactMarkdown>{llmSections['GENERAL STRUCTURE OBSERVATIONS']}</ReactMarkdown>
        </SectionCard>
      )}
      {/* Code Structure & Quality Review */}
      {llmSections && llmSections['CODE STRUCTURE & QUALITY REVIEW'] && (
        <SectionCard title="Code Structure & Quality Review">
          <ReactMarkdown>{llmSections['CODE STRUCTURE & QUALITY REVIEW']}</ReactMarkdown>
        </SectionCard>
      )}
      {/* Implications and Recommendations */}
      {llmSections && llmSections['IMPLICATIONS AND RECOMMENDATIONS'] && (
        <SectionCard title="Implications and Recommendations">
          {renderImplicationsTable(llmSections['IMPLICATIONS AND RECOMMENDATIONS']) || (
            <ReactMarkdown>{llmSections['IMPLICATIONS AND RECOMMENDATIONS']}</ReactMarkdown>
          )}
        </SectionCard>
      )}
      {/* Next Steps */}
      {llmSections && llmSections['NEXT STEPS'] && (
        <SectionCard title="Next Steps">
          <ReactMarkdown>{llmSections['NEXT STEPS']}</ReactMarkdown>
        </SectionCard>
      )}
      {/* Instruction-level analysis */}
      {Array.isArray(instructionAnalysis) && instructionAnalysis.length > 0 && (
        <SectionCard title="Instruction-level Security Analysis">
          <InstructionAnalysisTable data={instructionAnalysis} />
        </SectionCard>
      )}
      {/* Fallback: render any other sections not already shown */}
      {llmSections && Object.entries(llmSections).filter(([section]) => ![
        'EXECUTIVE SUMMARY', 'SUMMARY', 'CYBER SECURITY KEY FINDINGS', 'CYBER SECURITY FINDINGS',
        'GENERAL STRUCTURE OBSERVATIONS', 'CODE STRUCTURE & QUALITY REVIEW',
        'IMPLICATIONS AND RECOMMENDATIONS', 'NEXT STEPS', 'INSTRUCTION-LEVEL ANALYSIS', 'INSTRUCTION-LEVEL ANALYSIS (REQUIRED)'
      ].includes(section)).map(([section, content]) => (
        <SectionCard key={section} title={section}>
          <ReactMarkdown>{content as string}</ReactMarkdown>
        </SectionCard>
      ))}
    </div>
  );
};

export default AnalysisDetails;

// Removed duplicate renderCyberFindings implementation. Now only using the imported version from analysisDetails/CyberFindingsPanel.
