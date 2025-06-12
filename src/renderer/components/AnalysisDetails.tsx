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

const SectionCard = ({ title, children, highlight, noPadding }: { title: string; children: React.ReactNode; highlight?: boolean; noPadding?: boolean }) => (
  <div className={`bg-white rounded-xl shadow-md ${noPadding ? '' : 'p-6'} border ${highlight ? 'border-[#D9534F]' : 'border-gray-100'} mb-4`}>
    <div className={`font-bold text-lg mb-2 ${highlight ? 'text-[#D9534F]' : 'text-[#232B3A]'}`}>{title}</div>
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
  return <ReactMarkdown>{formatted}</ReactMarkdown>;
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

const AnalysisDetails: React.FC<AnalysisDetailsProps> = ({ analysis }) => {
  if (!analysis) return null;
  const { fileName, status, date, analysis_json } = analysis;

  // Patch: If llm_results is empty, try to parse filePath as JSON and extract llm_results from there
  let llm = analysis.analysis_json?.llm_results;
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
  const llmStatus = getLLMStatus(llm);
  const llmSections = parseNewLLMSections(typeof llm === 'string' ? llm : '');
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

  return (
    <div className="max-w-3xl mx-auto">
      {/* DEBUG: Show instruction_analysis raw data */}
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded text-xs text-gray-700">
        <strong>Debug: instruction_analysis</strong>
        <pre className="whitespace-pre-wrap break-all mt-1">{JSON.stringify(instructionAnalysis, null, 2)}</pre>
      </div>
      {/* Banner for critical/high vulnerabilities */}
      {(hasCritical || hasHigh) && (
        <div className={`rounded-xl p-4 mb-6 flex items-center shadow border-2 ${hasCritical ? 'border-red-700 bg-red-50' : 'border-orange-500 bg-orange-50'}`}> 
          <span className={`mr-3 text-2xl ${hasCritical ? 'text-red-700' : 'text-orange-500'}`}>⚠️</span>
          <span className="font-bold text-lg text-[#232B3A]">
            {hasCritical ? 'Critical vulnerabilities detected!' : 'High-risk vulnerabilities detected!'}
          </span>
        </div>
      )}
      <div className="mb-6">
        <div className="text-2xl font-extrabold text-[#0275D8]">{fileName}</div>
        <div className="text-gray-500 text-sm mt-1">Status: <span className="font-semibold text-[#28A745]">{status}</span> &nbsp; | &nbsp; Date: {date}</div>
      </div>
      {/* Executive Summary */}
      {execSummary && (
        <SectionCard title="Executive Summary">
          <ReactMarkdown>{execSummary}</ReactMarkdown>
        </SectionCard>
      )}
      {/* Cyber Security Key Findings */}
      {cyberFindings && (
        <SectionCard title="Cyber Security Key Findings" highlight>
          <ReactMarkdown components={{li: ({...props}) => <li className="mb-2 flex items-start"><span className="text-red-600 mr-2 mt-1">&#9888;</span><span>{props.children}</span></li>}}>{cyberFindings}</ReactMarkdown>
        </SectionCard>
      )}
      {/* General Structure Observations */}
      {structureObs && (
        <SectionCard title="General Structure Observations">
          <ReactMarkdown>{structureObs}</ReactMarkdown>
        </SectionCard>
      )}
      {/* Code Structure & Quality Review */}
      {codeQuality && (
        <SectionCard title="Code Structure & Quality Review">
          <ReactMarkdown>{codeQuality}</ReactMarkdown>
        </SectionCard>
      )}
      {/* Implications and Recommendations as table if present */}
      {implications && implications.includes('|') ? (
        <SectionCard title="Implications and Recommendations">
          <div className="overflow-x-auto">
            <ReactMarkdown components={{
              table: ({...props}) => <table className="min-w-full text-sm border mt-2">{props.children}</table>,
              th: ({...props}) => <th className="p-2 border bg-gray-100 font-bold">{props.children}</th>,
              td: ({...props}) => <td className="p-2 border">{props.children}</td>,
            }}>{implications}</ReactMarkdown>
          </div>
        </SectionCard>
      ) : implications && (
        <SectionCard title="Implications and Recommendations">
          <ReactMarkdown>{implications}</ReactMarkdown>
        </SectionCard>
      )}
      {/* Next Steps as checklist */}
      {nextSteps && (
        <SectionCard title="Next Steps">
          <ReactMarkdown components={{li: ({...props}) => <li className="mb-1 flex items-center"><span className="text-blue-500 mr-2">✔️</span><span>{props.children}</span></li>}}>{nextSteps}</ReactMarkdown>
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
          <div className="overflow-x-auto overflow-y-auto w-full bg-white rounded-b-xl border-t border-gray-100" style={{maxHeight: '340px', minHeight: '120px', padding: '0 1.5rem 1.5rem 1.5rem', boxSizing: 'border-box'}}>
            <table className="table-auto w-full text-sm border-separate border-spacing-0 shadow-sm">
              <thead>
                <tr className="bg-[#f3f6fa] text-[#232B3A]">
                  <th className="p-4 text-left font-bold border-b border-gray-200">Instruction</th>
                  <th className="p-4 text-left font-bold border-b border-gray-200">Insight</th>
                  <th className="p-4 text-left font-bold border-b border-gray-200">Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {instructionAnalysis.map((item: any, idx: number) => (
                  <tr key={idx} className="even:bg-gray-50 hover:bg-blue-50 transition">
                    <td className="p-4 font-mono text-xs text-gray-800 align-top max-w-xs break-all border-b border-gray-100">{item.instruction}</td>
                    <td className="p-4 text-gray-900 align-top max-w-md break-words border-b border-gray-100">{item.insight}</td>
                    <td className="p-4 font-semibold align-top border-b border-gray-100">
                      <span className={
                        item.risk_level && item.risk_level.toLowerCase() === 'critical' ? 'text-red-700 bg-red-50 px-3 py-1 rounded-full font-bold' :
                        item.risk_level && item.risk_level.toLowerCase() === 'high' ? 'text-orange-700 bg-orange-50 px-3 py-1 rounded-full font-bold' :
                        item.risk_level && item.risk_level.toLowerCase() === 'medium' ? 'text-yellow-800 bg-yellow-50 px-3 py-1 rounded-full font-bold' :
                        item.risk_level && item.risk_level.toLowerCase() === 'low' ? 'text-green-700 bg-green-50 px-3 py-1 rounded-full font-bold' :
                        'text-gray-800 px-3 py-1 rounded-full font-bold'
                      }>{item.risk_level}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      ) : (
        <SectionCard title="Instruction-level Security Analysis">
          <div className="text-gray-500 italic">No instruction-level analysis available.</div>
        </SectionCard>
      )}
      {/* If the LLM markdown contains a raw instruction-level analysis JSON block, show it as a collapsible panel for troubleshooting (optional, can be hidden by default) */}
    </div>
  );
};

export default AnalysisDetails;
