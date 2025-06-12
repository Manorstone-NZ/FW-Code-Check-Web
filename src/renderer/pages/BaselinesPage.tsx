import * as React from 'react';
import { useBaselines, getBaselineById, deleteBaseline } from '../utils/analysisApi';
import AnalysisDetails from '../components/AnalysisDetails';

const BaselinesPage = () => {
  const { baselines, loading, error, refresh } = useBaselines();
  const [selected, setSelected] = React.useState<any | null>(null);
  const [details, setDetails] = React.useState<any | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const handleView = async (id: number) => {
    setDetails(null);
    const data = await getBaselineById(id);
    setDetails(data);
  };

  const handleDelete = async (id: number) => {
    setDeleting(true);
    await deleteBaseline(id);
    setDeleting(false);
    setDetails(null);
    refresh();
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Baselines</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      <table className="min-w-full bg-white rounded shadow mb-6">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2 px-4">ID</th>
            <th className="py-2 px-4">File Name</th>
            <th className="py-2 px-4">Original Name</th>
            <th className="py-2 px-4">Date</th>
            <th className="py-2 px-4">Actions</th>
            <th className="py-2 px-4">Export</th>
          </tr>
        </thead>
        <tbody>
          {baselines.map((b: any) => (
            <tr key={b.id} className="border-b hover:bg-gray-50">
              <td className="py-2 px-4">{b.id}</td>
              <td className="py-2 px-4">{b.fileName}</td>
              <td className="py-2 px-4">{b.originalName}</td>
              <td className="py-2 px-4">{b.date}</td>
              <td className="py-2 px-4 space-x-2">
                <button className="px-2 py-1 bg-blue-600 text-white rounded" onClick={() => handleView(b.id)}>View</button>
                <button className="px-2 py-1 bg-red-600 text-white rounded" onClick={() => handleDelete(b.id)} disabled={deleting}>Delete</button>
              </td>
              <td className="py-2 px-4">
                <button className="px-2 py-1 bg-green-600 text-white rounded" onClick={() => {
                  getBaselineById(b.id).then(data => {
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `baseline_${b.id}.json`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  });
                }}>Export</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {details && (
        <div className="bg-gray-100 p-4 rounded shadow mt-4">
          <h3 className="font-semibold mb-2">Baseline Details</h3>
          {/* Use the same detailed LLM result view as upload/analysis */}
          <AnalysisDetails analysis={details} />
        </div>
      )}
    </div>
  );
};

export default BaselinesPage;
