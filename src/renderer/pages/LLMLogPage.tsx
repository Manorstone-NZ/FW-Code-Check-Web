import React, { useEffect, useState } from 'react';

const LLMLogPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    // @ts-ignore
    window.electron.invoke('get-llm-logs')
      .then((data: any[]) => {
        // Sort logs newest to oldest
        setLogs(Array.isArray(data) ? [...data].sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || '')) : []);
        setLoading(false);
      })
      .catch((e: any) => {
        setError(e.message || 'Failed to load logs');
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-6 text-[#0275D8]">LLM Interaction Log</h1>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {logs.length === 0 && !loading && !error && <div>No LLM interactions logged yet.</div>}
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">#</th>
            <th className="p-2 text-left">Date/Time</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-left">Summary</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, idx) => {
            const summary = (log.result && typeof log.result === 'string')
              ? log.result.slice(0, 80).replace(/\n/g, ' ')
              : (log.result && log.result.error ? log.result.error : '');
            return (
              <React.Fragment key={idx}>
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-2">{log.id || idx + 1}</td>
                  <td className="p-2 whitespace-nowrap">{log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}</td>
                  <td className={"p-2 " + (log.success ? 'text-green-700' : 'text-red-700')}>{log.success ? 'Success' : 'Fail'}</td>
                  <td className="p-2 truncate max-w-xs">{summary || <span className="italic text-gray-400">(no summary)</span>}</td>
                  <td className="p-2">
                    <button
                      className="ml-2 px-2 py-1 text-xs bg-[#0275D8] text-white rounded hover:bg-[#0256a3]"
                      onClick={() => setExpanded(expanded === idx ? null : idx)}
                    >
                      {expanded === idx ? 'Hide' : 'View'}
                    </button>
                  </td>
                </tr>
                {expanded === idx && (
                  <tr>
                    <td colSpan={5} className="bg-gray-50 p-4">
                      <div className="mb-2 text-xs text-gray-500">{log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}</div>
                      <div className="mb-2"><span className="font-semibold">Prompt:</span><pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{log.prompt}</pre></div>
                      <div className="mb-2"><span className="font-semibold">Result:</span><pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{typeof log.result === 'string' ? log.result : JSON.stringify(log.result, null, 2)}</pre></div>
                      <div className="mb-2"><span className="font-semibold">Status:</span> <span className={log.success ? 'text-green-700' : 'text-red-700'}>{log.success ? 'Success' : 'Fail'}</span></div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default LLMLogPage;
