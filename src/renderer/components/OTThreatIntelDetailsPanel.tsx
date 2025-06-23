import * as React from 'react';
import { OTThreatIntel } from '../../types/otThreatIntel';
import ReactMarkdown from './ReactMarkdownShim';
import LLMResponseDisplay from './LLMResponseDisplay';

// Simulate user role (replace with real auth in production)
const userRole = window.localStorage.getItem('userRole') || 'analyst'; // 'analyst' or 'viewer'

const OTThreatIntelDetailsPanel: React.FC<{ entry: OTThreatIntel | null; onCurationUpdate?: (entry: OTThreatIntel) => void }> = ({ entry, onCurationUpdate }) => {
  const [editMode, setEditMode] = React.useState(false);
  const [tags, setTags] = React.useState<string[]>(entry?.tags || []);
  const [siteRelevance, setSiteRelevance] = React.useState(entry?.site_relevance || '');
  const [responseNotes, setResponseNotes] = React.useState(entry?.response_notes || '');

  React.useEffect(() => {
    setTags(entry?.tags || []);
    setSiteRelevance(entry?.site_relevance || '');
    setResponseNotes(entry?.response_notes || '');
  }, [entry]);

  if (!entry) return (
    <div className="bg-white border rounded-xl shadow p-4 text-xs text-gray-400">Select a threat entry to view details.</div>
  );

  const handleSave = () => {
    if (onCurationUpdate) {
      onCurationUpdate({ ...entry, tags, site_relevance: siteRelevance, response_notes: responseNotes });
    }
    setEditMode(false);
  };

  const handleExport = (format: 'json' | 'md') => {
    const filename = `${entry.title.replace(/[^a-z0-9]/gi, '_')}_${entry.id}.${format}`;
    let content = '';
    if (format === 'json') {
      content = JSON.stringify(entry, null, 2);
    } else {
      content = `# ${entry.title}\n\n**Type:** ${entry.threat_type}\n**Severity:** ${entry.severity}\n**Vendors:** ${entry.affected_vendors.join(', ')}\n**Protocols:** ${entry.industrial_protocols.join(', ')}\n**Systems:** ${entry.system_targets.join(', ')}\n**Tags:** ${entry.tags.join(', ')}\n**Source:** ${entry.source}\n\n## Summary\n${entry.summary}\n\n## Details\n${entry.llm_response || ''}\n`;
    }
    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white border rounded-xl shadow p-6 text-sm">
      <div className="mb-3 text-lg font-bold text-blue-900">{entry.title}</div>
      <div className="mb-4 text-sm text-gray-500">{entry.threat_type} | {entry.severity} | {new Date(entry.retrieved_at).toLocaleString()}</div>
      
      <div className="space-y-3 mb-4">
        <div><span className="font-semibold">Vendors:</span> {entry.affected_vendors.join(', ')}</div>
        <div><span className="font-semibold">Protocols:</span> {entry.industrial_protocols.join(', ')}</div>
        <div><span className="font-semibold">Systems:</span> {entry.system_targets.join(', ')}</div>
        <div><span className="font-semibold">Tags:</span> {editMode ? (
          <input className="border px-2 py-1 rounded w-48 ml-2" value={tags.join(', ')} onChange={e => setTags(e.target.value.split(',').map(t => t.trim()))} />
        ) : tags.join(', ')}</div>
        <div><span className="font-semibold">Source:</span> {entry.source}</div>
      </div>

      <div className="mb-4">
        <span className="font-semibold text-sm">Summary:</span>
        <div className="mt-2 prose prose-sm max-w-none">
          <ReactMarkdown>{entry.summary}</ReactMarkdown>
        </div>
      </div>

      {entry.llm_response && (
        <div className="mb-6">
          <div className="flex items-center mb-3">
            <h3 className="text-base font-semibold text-gray-800">Details</h3>
          </div>
          <LLMResponseDisplay llmResponse={entry.llm_response} />
        </div>
      )}

      <div className="space-y-3 mb-4">
        <div><span className="font-semibold">Site Relevance:</span> {editMode ? (
          <input className="border px-2 py-1 rounded w-48 ml-2" value={siteRelevance} onChange={e => setSiteRelevance(e.target.value)} />
        ) : siteRelevance}</div>
        <div><span className="font-semibold">Response Notes:</span> {editMode ? (
          <textarea className="border px-2 py-1 rounded w-full mt-2" rows={3} value={responseNotes} onChange={e => setResponseNotes(e.target.value)} />
        ) : (
          <div className="mt-2 prose prose-sm max-w-none">
            <ReactMarkdown>{responseNotes}</ReactMarkdown>
          </div>
        )}</div>
      </div>

      <div className="flex gap-2 mt-4 pt-4 border-t">
        <button className="border px-3 py-2 rounded text-sm bg-gray-100 hover:bg-gray-200 transition-colors" onClick={() => handleExport('json')}>Export JSON</button>
        <button className="border px-3 py-2 rounded text-sm bg-gray-100 hover:bg-gray-200 transition-colors" onClick={() => handleExport('md')}>Export Markdown</button>
        {userRole === 'analyst' && !editMode && (
          <button className="border px-3 py-2 rounded text-sm bg-blue-100 hover:bg-blue-200 transition-colors" onClick={() => setEditMode(true)}>Edit</button>
        )}
        {userRole === 'analyst' && editMode && (
          <button className="border px-3 py-2 rounded text-sm bg-green-100 hover:bg-green-200 transition-colors" onClick={handleSave}>Save</button>
        )}
        {editMode && (
          <button className="border px-3 py-2 rounded text-sm bg-red-100 hover:bg-red-200 transition-colors" onClick={() => setEditMode(false)}>Cancel</button>
        )}
      </div>
      
      <div className="mt-4 text-gray-400 text-xs border-t pt-2">
        <div>Created: {new Date(entry.created_at).toLocaleString()}</div>
        <div>Updated: {new Date(entry.updated_at).toLocaleString()}</div>
      </div>
    </div>
  );
};

export default OTThreatIntelDetailsPanel;
