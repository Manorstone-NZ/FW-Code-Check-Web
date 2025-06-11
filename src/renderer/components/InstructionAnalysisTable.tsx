import React from 'react';
import type { FC } from 'react';

interface InstructionAnalysisTableProps {
  data: Array<{ instruction: string; insight: string; risk_level: string }>;
}

const RiskBadge = ({ level }: { level: string }) => {
  const normalized = level.trim().toLowerCase();
  let color = '';
  if (normalized === 'critical') color = 'text-red-700 font-bold';
  else if (normalized === 'high') color = 'text-orange-600 font-bold';
  else if (normalized === 'medium') color = 'text-yellow-700 font-bold';
  else if (normalized === 'low') color = 'text-green-700 font-bold';
  else color = 'text-gray-800';
  return <span className={color}>{level}</span>;
};

const InstructionAnalysisTable: FC<InstructionAnalysisTableProps> = ({ data }) => (
  <div className="overflow-auto rounded-b-xl bg-white border-t border-gray-100 relative" style={{ maxHeight: '340px', minHeight: '120px', padding: '0 1.5rem 1.5rem 1.5rem', boxSizing: 'border-box' }}>
    <table className="table-auto w-full bg-white text-sm border">
      <thead>
        <tr className="bg-gray-100">
          <th className="p-3 text-left font-semibold">Instruction</th>
          <th className="p-3 text-left font-semibold">Insight</th>
          <th className="p-3 text-left font-semibold">Risk Level</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item, idx) => (
          <tr key={idx} className="border-b last:border-b-0">
            <td className="p-3 font-mono align-top break-all max-w-xs">{item.instruction}</td>
            <td className="p-3 align-top break-words max-w-md">{item.insight}</td>
            <td className="p-3 font-semibold align-top"><RiskBadge level={item.risk_level} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default InstructionAnalysisTable;
