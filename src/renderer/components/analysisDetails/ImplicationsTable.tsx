import React from 'react';

const normalizeRiskLevel = (val: string) => val.trim().toLowerCase();

const getRiskLevelClass = (riskLevel: string) => {
  const normalized = normalizeRiskLevel(riskLevel);
  switch (normalized) {
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
  const normalized = normalizeRiskLevel(riskLevel);
  switch (normalized) {
    case 'critical': return 'Critical';
    case 'high': return 'High';
    case 'medium': return 'Medium';
    case 'low': return 'Low';
    default: return riskLevel.trim();
  }
};

// Helper to detect if a cell contains a risk level (including compound levels)
const isRiskLevel = (text: string) => {
  const normalized = normalizeRiskLevel(text);
  const basicRiskLevels = ['critical', 'high', 'medium', 'low'];
  
  // Check for basic risk levels
  if (basicRiskLevels.includes(normalized)) {
    return true;
  }
  
  // Check for compound risk levels (e.g., "Medium-High", "Low-Medium")
  if (text.includes('-')) {
    const parts = text.split('-').map(part => normalizeRiskLevel(part));
    return parts.every(part => basicRiskLevels.includes(part));
  }
  
  return false;
};

// Helper to render risk level pills (supports compound levels)
const renderRiskLevelPills = (text: string) => {
  // Handle compound risk levels (e.g., "Medium-High")
  if (text.includes('-')) {
    const parts = text.split('-').map(part => part.trim());
    return (
      <div className="flex flex-wrap gap-1">
        {parts.map((part, index) => {
          const normalized = normalizeRiskLevel(part);
          return (
            <span
              key={index}
              className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getRiskLevelClass(normalized)}`}
            >
              {getRiskLevelLabel(normalized)}
            </span>
          );
        })}
      </div>
    );
  }
  
  // Handle single risk level
  const normalized = normalizeRiskLevel(text);
  return (
    <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getRiskLevelClass(normalized)}`}>
      {getRiskLevelLabel(normalized)}
    </span>
  );
};

// Helper to render cell content with risk level pills
const renderCellContent = (cell: string, headerIndex: number, headers: string[]) => {
  const header = headers[headerIndex]?.toLowerCase() || '';
  
  // Check if this column is likely to contain risk levels
  const isRiskColumn = header.includes('risk') || header.includes('severity') || header.includes('level');
  
  // Check if the cell content looks like a risk level
  if (isRiskColumn && isRiskLevel(cell)) {
    return renderRiskLevelPills(cell);
  }
  
  return cell;
};

// Helper: Render Implications and Recommendations as a table if markdown table is present
export function renderImplicationsTable(content: string) {
  const tableMatch = content.match(/\|\s*Risk\s*\|.*?\|([\s\S]+?)\n\s*\|/i);
  if (!tableMatch) return null;
  const rows = content.split('\n').filter(l => l.trim().startsWith('|'));
  if (rows.length < 3) return null;
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
              {cells.map((cell, j) => (
                <td key={j} className="p-3 align-top">
                  {renderCellContent(cell, j, headers)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
