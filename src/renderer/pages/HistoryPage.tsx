import * as React from 'react';
import { useAnalyses, getAnalysisById } from '../utils/analysisApi';
import CompareAnalysisToBaseline from '../pages/CompareAnalysisToBaseline';
import AnalysisDetails from '../components/AnalysisDetails';

const HistoryPage = () => {
  const { analyses, loading, error, refresh } = useAnalyses();
  const [details, setDetails] = React.useState<any | null>(null);
  const [compareId, setCompareId] = React.useState<number | null>(null);

  const handleView = async (id: number) => {
    setDetails(null);
    const data = await getAnalysisById(id);
    setDetails(data);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this analysis?')) return;
    // @ts-ignore
    await window.electron.invoke('delete-analysis', id);
    refresh();
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Analysis History</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      <table className="min-w-full bg-white rounded shadow mb-6">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2 px-4">ID</th>
            <th className="py-2 px-4">File Name</th>
            <th className="py-2 px-4">Date</th>
            <th className="py-2 px-4">Status</th>
            <th className="py-2 px-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {analyses.map((a: any) => (
            <tr key={a.id} className="border-b hover:bg-gray-50">
              <td className="py-2 px-4">{a.id}</td>
              <td className="py-2 px-4">{a.fileName}</td>
              <td className="py-2 px-4">{a.date}</td>
              <td className="py-2 px-4">{a.status}</td>
              <td className="py-2 px-4 flex gap-2">
                <button
                  className="px-3 py-1 text-xs font-semibold bg-blue-600 text-white rounded shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transition"
                  onClick={() => handleView(a.id)}
                  aria-label={`View analysis ${a.id}`}
                >
                  View
                </button>
                <button
                  className="px-3 py-1 text-xs font-semibold bg-red-600 text-white rounded shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50 transition"
                  onClick={() => handleDelete(a.id)}
                  aria-label={`Delete analysis ${a.id}`}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {details && (
        <div className="bg-gray-100 p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Analysis Details</h3>
          <AnalysisDetails analysis={details} />
        </div>
      )}
      {compareId && (
        <div className="bg-gray-100 p-4 rounded shadow mt-4">
          <h3 className="font-semibold mb-2">Compare Analysis to Baseline</h3>
          <CompareAnalysisToBaseline analysisId={compareId} />
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
