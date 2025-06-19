import * as React from 'react';
import InstructionAnalysisTable from './InstructionAnalysisTable';
import ReactMarkdown from 'react-markdown';

interface AnalysisDetailsProps {
  analysis: any;
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

const SectionCard = ({ title, children, highlight, noPadding }: { title: string; children: React.ReactNode; highlight?: boolean; noPadding?: boolean }) => (
  <div className={`bg-white rounded-xl shadow-md ${noPadding ? '' : 'p-6'} border ${highlight ? 'border-[#D9534F]' : 'border-gray-100'} mb-6`}> 
    <div className={`font-bold text-xl mb-3 flex items-center gap-2 ${highlight ? 'text-[#D9534F]' : 'text-[#232B3A]'}`}> 
      {/* Remove tick from title, only highlight color if needed */}
      <span>{title}</span>
    </div>
    <div className={`text-gray-700 whitespace-pre-line text-base ${noPadding ? 'p-0' : ''}`}>{children}</div>
  </div>
);

// Helper: Render '- **Label**: Value' and also handle markdown-style headers (e.g., '- **Header**:') with carriage returns between groups
function renderLabelValueList(content: string) {
  const lines = content.split(/\n|---/).map(l => l.trim());
  const items: Array<{ label: string; value: string } | 'break'> = [];
  let lastWasHeader = false;
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^[-*] +\*\*(.+?)\*\*: ?(.*)$/);
    if (match) {
      if (lastWasHeader) items.push('break'); // Insert break before new header
      items.push({ label: match[1], value: match[2] });
      lastWasHeader = true;
    } else if (lines[i] === '' && items.length > 0 && !lastWasHeader) {
      items.push('break');
      lastWasHeader = false;
    } else if (lines[i]) {
      // Continuation of previous value
      const last = items[items.length - 1];
      if (last && last !== 'break' && last.value !== undefined) {
        last.value += (last.value ? '\n' : '') + lines[i];
      }
      lastWasHeader = false;
    }
  }
  if (items.length === 0) return null;
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 mb-2">
      {items.map((item, i) =>
        item === 'break' ? (
          <div key={i} className="col-span-2 h-4" />
        ) : (
          <React.Fragment key={i}>
            <dt className="font-semibold text-gray-700 mt-2 first:mt-0">{item.label}</dt>
            <dd className="text-gray-900 whitespace-pre-line">{item.value}</dd>
          </React.Fragment>
        )
      )}
    </dl>
  );
}

// Helper: Render markdown lists in NEXT STEPS with extra spacing between groups
function renderNextSteps(content: string) {
  // Add a blank line before lines ending with ':' (section headers)
  const formatted = content.replace(/(^|\n)([^\n]+:)/g, '\n\n$2');
  // Use a more professional checkmark icon (SVG)
  return (
    <ReactMarkdown
      components={{
        li: ({ children, ...props }) => (
          <li className="mb-1 flex items-center">
            <span className="inline-block mr-2 align-middle" style={{ width: 18, height: 18 }}>
              <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" width={18} height={18}>
                <circle cx="10" cy="10" r="10" fill="#0275D8" />
                <path d="M6 10.5L9 13.5L14 7.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span>{children}</span>
          </li>
        ),
      }}
    >
      {formatted}
    </ReactMarkdown>
  );
}

// Helper: Render Implications and Recommendations as a table if markdown table is present
function renderImplicationsTable(content: string) {
  // Try to extract markdown table
  const tableMatch = content.match(/\|\s*Risk\s*\|.*?\|([\s\S]+?)\n\s*\|/i);
  if (!tableMatch) return null;
  // Parse all table rows
  const rows = content.split('\n').filter(l => l.trim().startsWith('|'));
  if (rows.length < 3) return null; // header + separator + at least one row
  const headers = rows[0].split('|').map(h => h.trim()).filter(Boolean);
  const dataRows = rows.slice(2).map(row => row.split('|').map(cell => cell.trim()).filter(Boolean));
  return (
    <div className="overflow-x-auto">
      <table className="table-auto w-full bg-white text-sm border rounded shadow">
        <thead>
          <tr className="bg-gray-100">
            {headers.map((h, i) => <th key={i} className="p-3 text-left font-semibold">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {dataRows.map((cells, i) => (
            <tr key={i} className="border-b last:border-b-0">
              {cells.map((cell, j) => <td key={j} className="p-3 align-top">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
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
  // Try all possible locations for llm_results
  let llm = analysis?.analysis_json?.llm_results
    || analysis?.llm_results
    || analysis?.llm_result
    || analysis?.analysis_json?.llm_result;
  // If still not found, try to find a string value in analysis_json that looks like an LLM result
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
  // Fallback: check top-level keys for LLM result
  if (!llm && typeof analysis === 'object') {
    for (const key of Object.keys(analysis)) {
      const val = analysis[key];
      if (typeof val === 'string' &&
        (val.includes('EXECUTIVE SUMMARY') || val.includes('CODE STRUCTURE & QUALITY REVIEW') || val.includes('CYBER SECURITY KEY FINDINGS'))
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
  return typeof llm === 'string' ? llm : null;
};

const AnalysisDetails: React.FC<AnalysisDetailsProps> = ({ analysis }) => {
  if (!analysis) return null;
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
  const detectedProvider = (provider || analysis.llm_provider || analysis_json?.provider || '').toLowerCase();

  // Parse sections based on provider
  let llmSections: any = {};
  if (detectedProvider === 'ollama') {
    // Use Ollama parser for markdown/bolded headers
    const ollamaSections = parseOllamaSections(typeof llm === 'string' ? llm : '');
    if (Array.isArray(ollamaSections) && ollamaSections.length > 0) {
      // Convert array to object for consistent rendering
      ollamaSections.forEach(({ title, content }) => {
        llmSections[title.toUpperCase()] = content;
      });
    }
  } else {
    // Default to flexible parser for OpenAI and others
    llmSections = parseFlexibleLLMSections(typeof llm === 'string' ? llm : '');
  }
  const llmSectionsRaw = parseLLMSectionsRaw(typeof llm === 'string' ? llm : '');
  const llmStructured = parseLLMStructured(typeof llm === 'string' ? llm : '');
  const vulnerabilities = analysis_json?.vulnerabilities || [];
  const recommendations = analysis_json?.recommendations || [];
  const report = analysis_json?.report?.category || {};

  // --- UI CLEANUP & PROFESSIONAL RENDERING ---
  // Remove debug sections, focus on professional report layout
  // Extract key LLM sections for prominent display
  const execSummary = llmSections?.['EXECUTIVE SUMMARY'] || '';
  const cyberFindings = llmSections?.['CYBER SECURITY KEY FINDINGS'] || '';
  const structureObs = llmSections?.['GENERAL STRUCTURE OBSERVATIONS'] || '';
  const codeQuality = llmSections?.['CODE STRUCTURE & QUALITY REVIEW'] || '';
  const implications = llmSections?.['IMPLICATIONS AND RECOMMENDATIONS'] || '';
  const nextSteps = llmSections?.['NEXT STEPS'] || '';

  // Highlight if any critical/high vulnerabilities
  const vulnList = Array.isArray(report.vulnerabilities) ? report.vulnerabilities : [];
  const hasCritical = vulnList.some((v: any) => typeof v === 'string' ? v.toLowerCase().includes('critical') : JSON.stringify(v).toLowerCase().includes('critical'));
  const hasHigh = vulnList.some((v: any) => typeof v === 'string' ? v.toLowerCase().includes('high') : JSON.stringify(v).toLowerCase().includes('high'));

  // Robustly extract instruction_analysis from all possible sources
  const instructionAnalysis = extractInstructionAnalysis(analysis, typeof llm === 'string' ? llm : '');

  // --- HIDE RAW INSTRUCTION-LEVEL ANALYSIS JSON BLOCKS IN LLM OUTPUT ---
  // If llm_results contains a code block with INSTRUCTION-LEVEL ANALYSIS or a JSON array, remove it from the markdown rendering
  let cleanedLlmSections = { ...llmSections };
  if (cleanedLlmSections && typeof cleanedLlmSections === 'object') {
    Object.keys(cleanedLlmSections).forEach((key) => {
      if (key.toUpperCase().includes('INSTRUCTION-LEVEL ANALYSIS')) {
        delete cleanedLlmSections[key];
      } else if (typeof cleanedLlmSections[key] === 'string') {
        // Remove any code block containing a JSON array
        cleanedLlmSections[key] = cleanedLlmSections[key].replace(/```json[\s\S]*?```/g, '').replace(/\n{3,}/g, '\n\n');
      }
    });
  }

  // Render Ollama sections if detected
  if (Array.isArray(llmSections) && llmSections.length > 0) {
    // Display all sections in order, with original titles
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center mb-4">
          <span className={`inline-block px-3 py-1 text-xs font-semibold text-white rounded-full mr-3 ${typeColor}`}>{typeLabel}</span>
          <span className="text-gray-700 font-bold text-lg truncate">{fileName}</span>
          {date && <span className="ml-4 text-xs text-gray-400">{date}</span>}
          <span className="ml-4 text-xs text-blue-500">Provider: {detectedProvider}</span>
        </div>
        {Array.isArray(llmSections)
          ? llmSections.map(({ title, content }, i) =>
              content ? (
                <SectionCard key={i} title={title}>
                  <ReactMarkdown>{content}</ReactMarkdown>
                </SectionCard>
              ) : null
            )
          : null}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Type badge */}
      <div className="flex items-center mb-4">
        <span className={`inline-block px-3 py-1 text-xs font-semibold text-white rounded-full mr-3 ${typeColor}`}>{typeLabel}</span>
        <span className="text-gray-700 font-bold text-lg truncate">{fileName}</span>
        {date && <span className="ml-4 text-xs text-gray-400">{date}</span>}
      </div>
      {/* Banner for critical/high vulnerabilities */}
      {(hasCritical || hasHigh) && (
        <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded text-sm text-red-800 font-semibold flex items-center gap-2">
          <span className="text-2xl">⚠️</span>
          <span>
            {hasCritical ? 'Critical' : 'High'} vulnerabilities detected in this analysis. Review immediately.
          </span>
        </div>
      )}
      {/* Executive Summary */}
      {cleanedLlmSections['EXECUTIVE SUMMARY'] && (
        <SectionCard title="Executive Summary">
          <ReactMarkdown>{cleanedLlmSections['EXECUTIVE SUMMARY']}</ReactMarkdown>
        </SectionCard>
      )}
      {/* Cyber Security Key Findings */}
      {cleanedLlmSections['CYBER SECURITY KEY FINDINGS'] && (
        <SectionCard title="Cyber Security Key Findings" highlight>
          {renderCyberFindings(cleanedLlmSections['CYBER SECURITY KEY FINDINGS'])}
        </SectionCard>
      )}
      {/* General Structure Observations */}
      {cleanedLlmSections['GENERAL STRUCTURE OBSERVATIONS'] && (
        <SectionCard title="General Structure Observations">
          <ReactMarkdown>{cleanedLlmSections['GENERAL STRUCTURE OBSERVATIONS']}</ReactMarkdown>
        </SectionCard>
      )}
      {/* Code Structure & Quality Review - always use SectionCard and match header style */}
      {cleanedLlmSections['CODE STRUCTURE & QUALITY REVIEW'] && (
        <SectionCard title="Code Structure & Quality Review">
          <ReactMarkdown>{cleanedLlmSections['CODE STRUCTURE & QUALITY REVIEW']}</ReactMarkdown>
        </SectionCard>
      )}
      {/* Implications and Recommendations as table if present */}
      {cleanedLlmSections['IMPLICATIONS AND RECOMMENDATIONS'] && (
        <SectionCard title="Implications and Recommendations">
          {renderImplicationsTable(cleanedLlmSections['IMPLICATIONS AND RECOMMENDATIONS']) || (
            <ReactMarkdown>{cleanedLlmSections['IMPLICATIONS AND RECOMMENDATIONS']}</ReactMarkdown>
          )}
        </SectionCard>
      )}
      {/* Next Steps */}
      {cleanedLlmSections['NEXT STEPS'] && (
        <SectionCard title="Next Steps">
          <ReactMarkdown components={{li: ({...props}) => <li className="mb-1 flex items-center"><span className="text-blue-500 mr-2">✔️</span><span>{props.children}</span></li>}}>{cleanedLlmSections['NEXT STEPS']}</ReactMarkdown>
        </SectionCard>
      )}
      {/* Vulnerabilities (from report) */}
      {vulnList.length > 0 && (
        <SectionCard title="Detected Vulnerabilities" highlight>
          <ul className="list-disc ml-6 text-[#D9534F]">
            {vulnList.map((v: any, i: number) => (
              <li key={i} className="mb-1 flex items-start"><span className="text-red-600 mr-2 mt-1">&#9888;</span><span>{typeof v === 'string' ? v : JSON.stringify(v)}</span></li>
            ))}
          </ul>
        </SectionCard>
      )}
      {/* Potential Issues */}
      {report.potential_issues && report.potential_issues.length > 0 && (
        <SectionCard title="Potential Issues">
          <ul className="list-disc ml-6">
            {report.potential_issues.map((p: string, i: number) => <li key={i}>{p}</li>)}
          </ul>
        </SectionCard>
      )}
      {/* Example Malicious Change */}
      {report.example_malicious_change && (
        <SectionCard title="Example Malicious Change">
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{report.example_malicious_change}</pre>
        </SectionCard>
      )}
      {/* Instruction-level Security Analysis (table) */}
      {Array.isArray(instructionAnalysis) && instructionAnalysis.length > 0 ? (
        <SectionCard title="Instruction-level Security Analysis">
          {/* Only one scrollable container: let the table scroll, not the parent div */}
          <InstructionAnalysisTable data={instructionAnalysis} />
        </SectionCard>
      ) : (
        <SectionCard title="Instruction-level Security Analysis">
          <div className="text-gray-500 italic">No instruction-level analysis available.</div>
        </SectionCard>
      )}
    </div>
  );
};

export default AnalysisDetails;

// Helper: Render Cyber Security Key Findings as a styled list
function renderCyberFindings(content: string) {
  // Parse markdown-style findings into cards
  const findings = content.split(/\n(?=- \*\*Title\*\*:)/g).filter(f => f.trim().startsWith('- **Title**:'));
  if (findings.length === 0) return <ReactMarkdown>{content}</ReactMarkdown>;
  // Helper to extract risk level from finding text
  function getRiskLevel(text: string) {
    const match = text.match(/- \*\*Risk Level\*\*: *(\w+)/i);
    return match ? match[1].toLowerCase() : '';
  }
  return (
    <div className="grid gap-4">
      {findings.map((finding, idx) => {
        const riskLevel = getRiskLevel(finding);
        const isCritical = riskLevel === 'critical';
        const isHigh = riskLevel === 'high';
        return (
          <div key={idx} className="bg-[#fff6f6] border border-[#f5c6cb] rounded-lg p-4 shadow-sm flex gap-3 items-start">
            {/* Only show warning icon for High or Critical */}
            {(isCritical || isHigh) && (
              <span className="inline-block mt-1 text-[#D9534F]">
                <svg width="22" height="22" fill="none" viewBox="0 0 22 22"><circle cx="11" cy="11" r="11" fill="#D9534F"/><path d="M11 6v6" stroke="#fff" strokeWidth="2" strokeLinecap="round"/><circle cx="11" cy="16" r="1.2" fill="#fff"/></svg>
              </span>
            )}
            <div className="flex-1">
              <ReactMarkdown
                components={{
                  li: ({ children, ...props }) => (
                    <li className="mb-1 flex items-start">
                      {/* Remove tick from info panel items */}
                      <span className="inline-block mr-2 mt-1" />
                      <span>{children}</span>
                    </li>
                  ),
                  strong: ({ children }) => <span className="font-semibold text-[#D9534F]">{children}</span>,
                }}
              >{finding.trim()}</ReactMarkdown>
            </div>
          </div>
        );
      })}
    </div>
  );
}
