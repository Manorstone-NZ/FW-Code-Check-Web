import * as React from 'react';
import { OTThreatIntel } from '../../types/otThreatIntel';
import OTThreatIntelTable from '../components/OTThreatIntelTable';
import OTThreatIntelFilterPanel from '../components/OTThreatIntelFilterPanel';
import OTThreatIntelDetailsPanel from '../components/OTThreatIntelDetailsPanel';
import { syncOTThreatIntel } from '../utils/analysisApi';
import { LLMProviderContext } from '../App';

const OTThreatIntelDashboard: React.FC = () => {
  const [entries, setEntries] = React.useState<OTThreatIntel[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [lastSync, setLastSync] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<OTThreatIntel | null>(null);
  const [filters, setFilters] = React.useState<any>({});
  const { provider: llmProvider } = React.useContext(LLMProviderContext);

  // Fetch entries from DB on mount
  React.useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    setLoading(true);
    // @ts-ignore
    const data = await window.electron.invoke('get-ot-threat-intel-entries');
    setEntries(data || []);
    // @ts-ignore
    const last = await window.electron.invoke('get-ot-threat-intel-last-sync');
    setLastSync(last || null);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setLoading(true);
    await syncOTThreatIntel(llmProvider);
    await fetchEntries();
  };

  const filteredEntries = React.useMemo(() => {
    // Filtering logic (by vendor, protocol, severity, system type, etc.)
    return entries.filter(e => {
      if (filters.vendor && !e.affected_vendors.includes(filters.vendor)) return false;
      if (filters.protocol && !e.industrial_protocols.includes(filters.protocol)) return false;
      if (filters.severity && e.severity !== filters.severity) return false;
      if (filters.system && !e.system_targets.includes(filters.system)) return false;
      return true;
    });
  }, [entries, filters]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-blue-900">OT Threat Intelligence Dashboard</h1>
        <div className="flex items-center gap-4">
          <button
            className="px-4 py-2 bg-blue-700 text-white rounded shadow hover:bg-blue-800 text-sm disabled:opacity-50"
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? 'Syncing...' : 'Fetch Latest OT Threat Intel'}
          </button>
          <span className="text-xs text-gray-500">Last sync: {lastSync ? new Date(lastSync).toLocaleString() : 'Never'}</span>
        </div>
      </div>
      <OTThreatIntelFilterPanel filters={filters} setFilters={setFilters} entries={entries} />
      <div className="mt-4 grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <OTThreatIntelTable entries={filteredEntries} onSelect={setSelected} />
        </div>
        <div className="col-span-1">
          <OTThreatIntelDetailsPanel
            entry={selected}
            onCurationUpdate={async (updated) => {
              // @ts-ignore
              await window.electron.invoke('update-ot-threat-intel-entry', updated);
              setSelected(updated);
              setEntries(entries => entries.map(e => e.id === updated.id ? updated : e));
            }}
          />
        </div>
      </div>
      <div className="mt-6 flex gap-4">
        <button
          className="px-4 py-2 bg-red-700 text-white rounded shadow hover:bg-red-800 text-sm disabled:opacity-50"
          onClick={async () => {
            setLoading(true);
            // @ts-ignore
            await window.electron.invoke('clear-ot-threat-intel');
            await fetchEntries();
            setSelected(null);
            setLoading(false);
          }}
          disabled={loading}
        >
          {loading ? 'Clearing...' : 'Clear All'}
        </button>
        <button
          className="px-4 py-2 bg-green-700 text-white rounded shadow hover:bg-green-800 text-sm disabled:opacity-50"
          onClick={async () => {
            setLoading(true);
            // @ts-ignore
            await window.electron.invoke('bulk-ot-threat-intel');
            await fetchEntries();
            setLoading(false);
          }}
          disabled={loading}
        >
          {loading ? 'Populating...' : 'Populate with LLM (10+ past year)'}
        </button>
      </div>
    </div>
  );
};

export default OTThreatIntelDashboard;
