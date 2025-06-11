import * as React from 'react';
import { saveBaseline } from '../utils/analysisApi';
import AnalysisDetails from './AnalysisDetails';

const FileUploader = () => {
    const [fileName, setFileName] = React.useState<string | null>(null);
    const [result, setResult] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [filePath, setFilePath] = React.useState<string | null>(null);

    const analyzeFile = async (file: File) => {
        setLoading(true);
        setResult(null);
        setError(null);
        setFilePath(file.path);
        try {
            // @ts-ignore
            const analysis = await window.electron.invoke('analyze-file', file.path);
            setResult(analysis);
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
                        className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        onClick={async () => {
                            if (fileName && filePath) {
                                try {
                                    await saveBaseline(fileName, undefined, filePath);
                                    alert('Baseline saved!');
                                } catch (e) {
                                    alert('Failed to save baseline');
                                }
                            }
                        }}
                    >
                        Save as Baseline
                    </button>
                </>
            )}
        </div>
    );
};

export default FileUploader;