import * as React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const [result, setResult] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(false);
    const navigate = useNavigate();
    const handleSampleAnalysis = async () => {
        setLoading(true);
        setResult(null);
        try {
            // @ts-ignore
            const analysis = await window.electron.invoke('analyze-file', 'sample.l5x');
            setResult(analysis);
        } catch (e) {
            setResult({ error: e instanceof Error ? e.message : 'Analysis failed' });
        }
        setLoading(false);
    };
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
            <h1 className="text-4xl font-bold mb-4">Welcome to First Watch PLC Code Checker</h1>
            <p className="text-lg mb-8">Analyze your Rockwell Automation PLC files for security risks.</p>
            <div className="flex space-x-4 mb-6">
                <button
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={handleSampleAnalysis}
                    disabled={loading}
                >
                    {loading ? 'Analyzing...' : 'Run Sample Analysis'}
                </button>
                <button
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    onClick={() => navigate('/upload')}
                >
                    Upload File
                </button>
            </div>
            {result && (
                <pre className="bg-white p-4 rounded shadow max-w-xl w-full overflow-x-auto text-sm text-left">
                    {JSON.stringify(result, null, 2)}
                </pre>
            )}
        </div>
    );
};

export default Home;