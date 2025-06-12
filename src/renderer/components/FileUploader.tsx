import * as React from 'react';
import { saveBaseline, useAnalyses } from '../utils/analysisApi';
import AnalysisDetails from './AnalysisDetails';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const FileUploader = () => {
    const [fileName, setFileName] = React.useState<string | null>(null);
    const [result, setResult] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [filePath, setFilePath] = React.useState<string | null>(null);
    const [showRawModal, setShowRawModal] = React.useState(false);
    const { refresh: refreshAnalyses } = useAnalyses();
    const navigate = useNavigate();
    const [saved, setSaved] = useState(false);
    const [showRaw, setShowRaw] = useState(false);

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

    return (
        <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
            <h2 className="mb-4 text-lg font-semibold">Upload PLC Files</h2>
            <input
                type="file"
                accept=".l5x,.txt"
                onChange={handleFileChange}
                className="mb-4"
            />
            <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="w-full h-32 flex items-center justify-center border-2 border-dashed border-gray-400 rounded-lg"
            >
                <p className="text-gray-500">Drag and drop your .l5x or .txt files here</p>
            </div>
            {fileName && <p className="mt-2 text-sm text-gray-700">Selected file: {fileName}</p>}
            {loading && <p className="mt-2 text-blue-600">Analyzing...</p>}
            {error && <p className="mt-2 text-red-600">Error: {error}</p>}
            {result && (
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
                    <button
                        className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60"
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
                        className="mt-2 ml-2 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-900"
                        onClick={() => setShowRaw(true)}
                    >
                        Show Raw Output
                    </button>
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