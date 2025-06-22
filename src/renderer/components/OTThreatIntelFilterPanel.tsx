import * as React from 'react';
import { OTThreatIntel } from '../../types/otThreatIntel';

interface Props {
  filters: any;
  setFilters: (f: any) => void;
  entries: OTThreatIntel[];
}

// Accepts array of objects and extracts unique values for a given key (array or string field)
const getUnique = (arr: OTThreatIntel[], key: keyof OTThreatIntel): string[] => {
  if (!Array.isArray(arr)) return [];
  const values = arr.flatMap(e => Array.isArray(e[key]) ? e[key] : [e[key]]);
  return Array.from(new Set(values)).filter(Boolean) as string[];
};

const OTThreatIntelFilterPanel: React.FC<Props> = ({ filters, setFilters, entries }) => {
  const vendors = getUnique(entries, 'affected_vendors');
  const protocols = getUnique(entries, 'industrial_protocols');
  const severities = ['High', 'Medium', 'Low'];
  const systems = getUnique(entries, 'system_targets');

  return (
    <div className="flex gap-4 mb-2">
      <div>
        <label className="block text-xs font-semibold mb-1">Vendor</label>
        <select className="p-1 border rounded text-xs" value={filters.vendor || ''} onChange={e => setFilters((f: any) => ({ ...f, vendor: e.target.value || undefined }))}>
          <option value="">All</option>
          {vendors.map((v: string) => <option key={v} value={v}>{v}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1">Protocol</label>
        <select className="p-1 border rounded text-xs" value={filters.protocol || ''} onChange={e => setFilters((f: any) => ({ ...f, protocol: e.target.value || undefined }))}>
          <option value="">All</option>
          {protocols.map((p: string) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1">Severity</label>
        <select className="p-1 border rounded text-xs" value={filters.severity || ''} onChange={e => setFilters((f: any) => ({ ...f, severity: e.target.value || undefined }))}>
          <option value="">All</option>
          {severities.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1">System</label>
        <select className="p-1 border rounded text-xs" value={filters.system || ''} onChange={e => setFilters((f: any) => ({ ...f, system: e.target.value || undefined }))}>
          <option value="">All</option>
          {systems.map((s: string) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
    </div>
  );
};

export default OTThreatIntelFilterPanel;
