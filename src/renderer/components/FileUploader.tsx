import * as React from 'react';
import { saveBaseline, useAnalyses } from '../utils/analysisApi';
import AnalysisDetails from './AnalysisDetails';
import { useNavigate } from 'react-router-dom';

const FileUploader = () => {
    const [fileName, setFileName] = React.useState<string | null>(null);
    const [result, setResult] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [filePath, setFilePath] = React.useState<string | null>(null);
    const { refresh: refreshAnalyses } = useAnalyses();
    const navigate = useNavigate();
    const [saved, setSaved] = React.useState(false);
    const [showRaw, setShowRaw] = React.useState(false);

    const analyzeFile = async (file: File) => {
        setLoading(true);
        setResult(null);
        setError(null);
        setFilePath(file.path);
        try {
            // @ts-ignore
            const analysis = await window.electron.invoke('analyze-file', file.path);
            setResult(analysis);
            // Refresh analyses list after upload
            refreshAnalyses();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Analysis failed');
        }
        setLoading(false);
    };

    const handleFileChange = (event: any) => {
        const file = event.target.files?.[0];
        if (file) {
            setFileName(file.name);
            analyzeFile(file);
        }
    };

    const handleDragOver = (event: any) => {
        event.preventDefault();
    };

    const handleDrop = (event: any) => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file) {
            setFileName(file.name);
            analyzeFile(file);
        }
    };

    // Handler for uploading a JSON result file
    const handleJsonUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const json = JSON.parse(e.target?.result as string);
                    setResult(json);
                    setFileName(file.name);
                    setFilePath(null);
                    setSaved(false);
                } catch (err) {
                    alert('Invalid JSON file.');
                }
            };
            reader.readAsText(file);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-md border border-gray-200 max-w-2xl mx-auto mt-8">
            <h2 className="mb-4 text-2xl font-bold text-[#0275D8]">Upload PLC Files or Import Analysis</h2>
            <div className="flex flex-row gap-4 mb-6 w-full justify-center">
                <label className="px-4 py-2 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-700 font-semibold shadow transition">
                    Upload JSON Result
                    <input
                        type="file"
                        accept="application/json,.json"
                        onChange={handleJsonUpload}
                        className="hidden"
                    />
                </label>
                <input
                    type="file"
                    accept=".l5x,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                    id="plc-upload-input"
                />
                <label htmlFor="plc-upload-input" className="px-4 py-2 bg-green-600 text-white rounded cursor-pointer hover:bg-green-700 font-semibold shadow transition">
                    Upload PLC File
                </label>
            </div>
            {fileName && <p className="mb-2 text-sm text-gray-700">Selected file: <span className="font-mono font-semibold">{fileName}</span></p>}
            {loading && <p className="mb-2 text-blue-600">Analyzing...</p>}
            {error && <p className="mb-2 text-red-600">Error: {error}</p>}
            {result !== null && result !== undefined && (
                <>
                    <div className="bg-gray-50 rounded-xl shadow max-w-3xl w-full mt-6 p-2">
                        <AnalysisDetails analysis={{
                            fileName: fileName,
                            filePath: filePath,
                            status: 'complete',
                            date: new Date().toISOString(),
                            analysis_json: result
                        }} />
                    </div>
                    <div className="flex flex-row flex-wrap gap-4 mt-6 w-full justify-center">
                        <button
                            className="px-5 py-2 bg-green-600 text-white rounded-lg font-semibold shadow hover:bg-green-700 disabled:opacity-60 transition"
                            disabled={saved}
                            onClick={async () => {
                                if (fileName && result) {
                                    try {
                                        // @ts-ignore
                                        await window.electron.invoke('save-analysis', fileName, 'complete', result, filePath || '');
                                        setSaved(true);
                                        refreshAnalyses();
                                        alert('Analysis saved to database!');
                                    } catch (e) {
                                        alert('Failed to save analysis');
                                    }
                                }
                            }}
                        >
                            {saved ? 'Saved to Database' : 'Save Analysis to Database'}
                        </button>
                        <button
                            className="px-5 py-2 bg-white border border-green-700 text-green-700 rounded-lg font-semibold shadow hover:bg-green-50 hover:border-green-800 transition flex items-center gap-2"
                            style={{ minWidth: 180 }}
                            onClick={async () => {
                                if (fileName && result) {
                                    try {
                                        await saveBaseline(fileName, fileName, filePath || '');
                                        alert('Saved as baseline!');
                                    } catch (e) {
                                        alert('Failed to save as baseline');
                                    }
                                }
                            }}
                        >
                            <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><rect x="3" y="3" width="14" height="14" rx="3" fill="#27ae60"/><path d="M7 10.5L9 13L13 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            Save as Baseline
                        </button>
                        <button
                            className="px-5 py-2 bg-gray-500 text-white rounded-lg font-semibold shadow hover:bg-gray-700 transition"
                            onClick={() => {
                                if (result && fileName) {
                                    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
                                    const url = URL.createObjectURL(blob);
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.download = `${fileName.replace(/\.[^.]+$/, '') || 'analysis'}-llm-result.json`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    URL.revokeObjectURL(url);
                                }
                            }}
                        >
                            Save to File
                        </button>
                        <button
                            className="px-5 py-2 bg-blue-700 text-white rounded-lg font-semibold shadow hover:bg-blue-900 transition"
                            onClick={() => setShowRaw(true)}
                        >
                            Show Raw Output
                        </button>
                    </div>
                    {showRaw && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                            <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full p-6 relative">
                                <button
                                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl font-bold"
                                    onClick={() => setShowRaw(false)}
                                    aria-label="Close"
                                >×</button>
                                <h2 className="text-lg font-bold mb-4">Raw LLM Output</h2>
                                <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto max-h-96">{JSON.stringify(result, null, 2)}</pre>
                                <button
                                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    onClick={() => {
                                        navigator.clipboard.writeText(JSON.stringify(result, null, 2));
                                        alert('Raw output copied to clipboard!');
                                    }}
                                >Copy to Clipboard</button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default FileUploader;