import * as React from 'react';
import { OTThreatIntel } from '../../types/otThreatIntel';

interface Props {
  entries: OTThreatIntel[];
  onSelect: (entry: OTThreatIntel) => void;
}

const severityColor = (sev: string) => {
  const s = (sev || '').trim().toLowerCase();
  if (s === 'critical') return 'bg-red-800 text-white border-red-900 font-extrabold shadow-lg animate-pulse';
  if (s === 'high') return 'bg-red-700 text-white border-red-700';
  if (s === 'medium') return 'bg-yellow-500 text-black border-yellow-500';
  if (s === 'low') return 'bg-green-500 text-white border-green-500';
  return 'bg-gray-300 text-gray-700 border-gray-300';
};

const formatSeverityLabel = (sev: string) => {
  if (!sev) return '';
  const s = sev.trim().toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const OTThreatIntelTable: React.FC<Props> = ({ entries, onSelect }) => {
  return (
    <div className="bg-white rounded-xl shadow border overflow-x-auto">
      <table className="min-w-full text-xs">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 px-3 font-semibold text-gray-700">Date</th>
            <th className="text-left py-2 px-3 font-semibold text-gray-700">Title</th>
            <th className="text-left py-2 px-3 font-semibold text-gray-700">Type</th>
            <th className="text-left py-2 px-3 font-semibold text-gray-700">Vendors</th>
            <th className="text-left py-2 px-3 font-semibold text-gray-700">Severity</th>
            <th className="text-left py-2 px-3 font-semibold text-gray-700">Source</th>
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 ? (
            <tr><td colSpan={6} className="py-4 text-center text-gray-400">No threat intel entries found.</td></tr>
          ) : entries.map(e => (
            <tr key={e.id} className="border-b hover:bg-blue-50 cursor-pointer" onClick={() => onSelect(e)}>
              <td className="py-2 px-3 align-middle">{new Date(e.retrieved_at).toLocaleDateString()}</td>
              <td className="py-2 px-3 align-middle font-semibold text-blue-900">{e.title}</td>
              <td className="py-2 px-3 align-middle">{e.threat_type}</td>
              <td className="py-2 px-3 align-middle">{e.affected_vendors.join(', ')}</td>
              <td className="py-2 px-3 align-middle">
                <span
                  className={`inline-block px-2 py-0.5 text-xs font-extrabold rounded-full border ${severityColor(e.severity)}`}
                  style={e.severity && e.severity.trim().toLowerCase() === 'critical' ? { backgroundColor: '#b1001c', color: '#fff', borderColor: '#b1001c', fontWeight: 900, boxShadow: '0 0 8px 2px #b1001c' } : {}}
                >
                  {formatSeverityLabel(e.severity)}
                </span>
              </td>
              <td className="py-2 px-3 align-middle">{e.source}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OTThreatIntelTable;
