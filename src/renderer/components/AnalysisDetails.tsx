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

const AnalysisDetails: React.FC<AnalysisDetailsProps> = ({ analysis }) => {
  if (!analysis) return null;
  const { fileName, status, date, analysis_json } = analysis;
  const llm = analysis_json?.llm_results;
  const llmStatus = getLLMStatus(llm);
  const llmSections = parseNewLLMSections(typeof llm === 'string' ? llm : '');
  const llmSectionsRaw = parseLLMSectionsRaw(typeof llm === 'string' ? llm : '');
  const llmStructured = parseLLMStructured(typeof llm === 'string' ? llm : '');
  const vulnerabilities = analysis_json?.vulnerabilities || [];
  const recommendations = analysis_json?.recommendations || [];
  const report = analysis_json?.report?.category || {};

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="text-2xl font-extrabold text-[#0275D8]">{fileName}</div>
        <div className="text-gray-500 text-sm mt-1">Status: <span className="font-semibold text-[#28A745]">{status}</span> &nbsp; | &nbsp; Date: {date}</div>
      </div>
      {report.potential_issues && report.potential_issues.length > 0 && (
        <SectionCard title="Potential Issues">
          <ul className="list-disc ml-6">
            {report.potential_issues.map((p: string, i: number) => <li key={i}>{p}</li>)}
          </ul>
        </SectionCard>
      )}
      {report.example_malicious_change && (
        <SectionCard title="Example Malicious Change">
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{report.example_malicious_change}</pre>
        </SectionCard>
      )}
      {report.vulnerabilities && report.vulnerabilities.length > 0 && (
        <SectionCard title="Rule-based Vulnerabilities" highlight>
          <ul className="list-disc ml-6 text-[#D9534F]">
            {report.vulnerabilities.map((v: string, i: number) => <li key={i}>{v}</li>)}
          </ul>
        </SectionCard>
      )}
      {/* LLM Communication Status */}
      <SectionCard title="LLM Communication Status">
        <div className={llmStatus.ok ? "text-green-700 font-semibold" : "text-red-700 font-semibold"}>{llmStatus.status}</div>
        {llmStatus.error && <div className="text-red-600 text-sm mt-1">Error: {llmStatus.error}</div>}
      </SectionCard>
      {/* New LLM Structured Sections */}
      {llmSections && (
        <>
          {Object.entries(llmSections).map(([section, content]) => (
            <SectionCard
              key={section}
              title={section.replace(/_/g, ' ').replace(/\b([a-z])/g, c => c.toUpperCase())}
              highlight={section.toUpperCase().includes('CYBER SECURITY') || section.toUpperCase().includes('FINDINGS')}
            >
              {typeof content === 'string' && content.includes('| Risk | Description | Recommendation |') ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border mt-2">
                    <tbody>
                      {content
                        .split(/\n/)
                        .filter((row) => row.trim().startsWith('|'))
                        .map((row, idx) => (
                          <tr key={idx}>
                            {row.split('|').slice(1, -1).map((cell, i) => (
                              <td key={i} className="p-2 border">{cell.trim()}</td>
                            ))}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : renderLabelValueList(typeof content === 'string' ? content : '') ? (
                renderLabelValueList(typeof content === 'string' ? content : '')
              ) : section.toUpperCase().includes('NEXT STEPS') ? (
                renderNextSteps(typeof content === 'string' ? content : '')
              ) : (
                <ReactMarkdown
                  components={{
                    strong: ({node, ...props}) => <strong className="font-semibold text-gray-800" {...props} />,
                    em: ({node, ...props}) => <em className="italic text-gray-600" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc ml-6 my-2" {...props} />,
                    li: ({node, ...props}) => <li className="mb-1" {...props} />,
                    code: ({node, ...props}) => <code className="bg-gray-100 px-1 rounded text-xs" {...props} />,
                  }}
                >{typeof content === 'string' ? content : String(content)}</ReactMarkdown>
              )}
            </SectionCard>
          ))}
        </>
      )}
      {/* INSTRUCTION-LEVEL ANALYSIS (table or LLM section, never both) */}
      {Array.isArray(analysis.analysis_json?.instruction_analysis) && analysis.analysis_json.instruction_analysis.length > 0 ? (
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
                {analysis.analysis_json.instruction_analysis.map((item: any, idx: number) => (
                  <tr key={idx} className="even:bg-gray-50 hover:bg-blue-50 transition">
                    <td className="p-4 font-mono text-xs text-gray-800 align-top max-w-xs break-all border-b border-gray-100">{item.instruction}</td>
                    <td className="p-4 text-gray-900 align-top max-w-md break-words border-b border-gray-100">{item.insight}</td>
                    <td className="p-4 font-semibold align-top border-b border-gray-100">
                      <span className={
                        item.risk_level.toLowerCase() === 'critical' ? 'text-red-700 bg-red-50 px-3 py-1 rounded-full font-bold' :
                        item.risk_level.toLowerCase() === 'high' ? 'text-orange-700 bg-orange-50 px-3 py-1 rounded-full font-bold' :
                        item.risk_level.toLowerCase() === 'medium' ? 'text-yellow-800 bg-yellow-50 px-3 py-1 rounded-full font-bold' :
                        item.risk_level.toLowerCase() === 'low' ? 'text-green-700 bg-green-50 px-3 py-1 rounded-full font-bold' :
                        'text-gray-800 px-3 py-1 rounded-full font-bold'
                      }>{item.risk_level}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
};

export default AnalysisDetails;
