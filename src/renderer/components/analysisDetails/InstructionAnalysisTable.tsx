import React from 'react';

const normalizeRiskLevel = (val: any) => String(val ?? '').trim().toLowerCase();
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const getRiskLevelClass = (riskLevel: string) => {
  switch (riskLevel) {
    case 'critical':
      return 'bg-red-700 text-white';
    case 'high':
      return 'bg-yellow-500 text-black';
    case 'medium':
      return 'bg-green-500 text-white';
    case 'low':
      return 'bg-blue-500 text-white';
    default:
      return 'bg-gray-400 text-white';
  }
};

const getRiskLevelLabel = (riskLevel: string) => {
  switch (riskLevel) {
    case 'critical': return 'Critical';
    case 'high': return 'High';
    case 'medium': return 'Medium';
    case 'low': return 'Low';
    default: return capitalize(riskLevel);
  }
};

const InstructionAnalysisTable = ({ data }: { data: any[] }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full text-sm border rounded shadow">
      <thead>
        <tr className="bg-gray-100">
          {Object.keys(data[0]).map((col) => (
            <th key={col} className="p-2 text-left font-semibold border-b border-gray-200">{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i} className="border-b last:border-b-0">
            {Object.entries(row).map(([key, val], j) => {
              if (key === 'risk_level') {
                // If val is an object, try to extract a string value
                let riskVal = val;
                if (val && typeof val === 'object') {
                  const v = val as Record<string, any>;
                  riskVal = v.risk_level ?? v.level ?? v.value ?? JSON.stringify(val);
                }
                const normalized = normalizeRiskLevel(riskVal);
                return (
                  <td key={j} className="p-2 align-top">
                    <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getRiskLevelClass(normalized)}`}>
                      {getRiskLevelLabel(normalized)}
                    </span>
                  </td>
                );
              }
              return <td key={j} className="p-2 align-top">{typeof val === 'string' ? val : JSON.stringify(val)}</td>;
            })}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default InstructionAnalysisTable;
