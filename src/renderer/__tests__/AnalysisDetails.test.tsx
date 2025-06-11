import * as React from 'react';

const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100">
    <h2 className="text-lg font-semibold text-gray-800 p-4 border-b border-gray-100">{title}</h2>
    {children}
  </div>
);

const AnalysisDetails = ({ analysis }: { analysis: any }) => {
  const { analysis_json } = analysis;
  const { llm_results, instruction_analysis } = analysis_json;

  // Parse llm_results into sections if it's a string
  const llmSections: Record<string, string> | null = typeof llm_results === 'string' && llm_results
    ? llm_results.split('\n\n').reduce((acc: Record<string, string>, section: string) => {
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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* LLM Status */}
      {typeof llm_results === 'object' && llm_results.error ? (
        <SectionCard title="LLM Failed">
          <p className="p-4 text-red-600">{llm_results.error}</p>
        </SectionCard>
      ) : llm_results === '' ? (
        <SectionCard title="No LLM response">
          <p className="p-4 text-gray-600">No LLM response available.</p>
        </SectionCard>
      ) : (
        <SectionCard title="LLM Success">
          <p className="p-4 text-green-600">Analysis completed successfully.</p>
        </SectionCard>
      )}

      {/* Render LLM sections in defined order */}
      {sectionOrder.map(
        (sectionTitle: string) =>
          llmSections && llmSections[sectionTitle] && (
            <SectionCard key={sectionTitle} title={sectionTitle}>
              <div
                className="overflow-x-auto overflow-y-auto w-full bg-white rounded-b-xl border-t border-gray-100"
                style={{
                  maxHeight: '340px',
                  minHeight: '120px',
                  padding: '1.5rem',
                  boxSizing: 'border-box',
                }}
              >
                {(() => {
                  const content = llmSections[sectionTitle];
                  let parsed: any = null;
                  try {
                    parsed = JSON.parse(content);
                  } catch (e) {
                    const match =
                      content.match(/```json\s*([\s\S]+?)```/i) ||
                      content.match(/\[\s*{[\s\S]+}\s*\]/);
                    if (match) {
                      try {
                        parsed = JSON.parse(match[1] || match[0]);
                      } catch (e2) {}
                    }
                  }
                  if (parsed) {
                    return (
                      <pre className="whitespace-pre-wrap text-xs text-gray-800 m-0">
                        {JSON.stringify(parsed, null, 2)}
                      </pre>
                    );
                  }
                  return (
                    <pre className="whitespace-pre-wrap text-xs text-gray-800 m-0">
                      {content}
                    </pre>
                  );
                })()}
              </div>
            </SectionCard>
          )
      )}

      {/* Instruction-level Analysis Table */}
      <SectionCard title="Instruction-level Security Analysis">
        {instruction_analysis && instruction_analysis.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-800">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-3">Instruction</th>
                  <th className="p-3">Insight</th>
                  <th className="p-3">Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {instruction_analysis.map((item: { instruction: string; insight: string; risk_level: string }, index: number) => (
                  <tr key={index} className="border-t border-gray-100">
                    <td className="p-3">{item.instruction}</td>
                    <td className="p-3">{item.insight}</td>
                    <td className="p-3">{item.risk_level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-4 text-gray-600">No instruction-level analysis available.</p>
        )}
      </SectionCard>
    </div>
  );
};

export default AnalysisDetails;