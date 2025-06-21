import React from 'react';
import ReactMarkdown from 'react-markdown';

// Helper: Render Cyber Security Key Findings as a styled list
export function renderCyberFindings(content: string) {
  const findings = content.split(/\n(?=- \*\*Title\*\*:)/g).filter(f => f.trim().startsWith('- **Title**:'));
  if (findings.length === 0) return <ReactMarkdown>{content}</ReactMarkdown>;
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
            {(isCritical || isHigh) && (
              <span className="inline-block mt-1 text-[#D9534F]">
                <svg width="22" height="22" fill="none" viewBox="0 0 22 22"><circle cx="11" cy="11" r="11" fill="#D9534F"/><path d="M11 6v6" stroke="#fff" strokeWidth="2" strokeLinecap="round"/><circle cx="11" cy="16" r="1.2" fill="#fff"/></svg>
              </span>
            )}
            <div className="flex-1">
              <ReactMarkdown
                components={{
                  li: ({ children }) => (
                    <li className="mb-1 flex items-start">
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

// Remove any local definition of renderCyberFindings in AnalysisDetails.tsx to avoid import conflict.
