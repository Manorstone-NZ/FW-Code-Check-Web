import * as React from 'react';
import { saveBaseline, useAnalyses, analyzeFile as analyzeFileApi } from '../utils/analysisApi';
import AnalysisDetails from './AnalysisDetails';
import { useNavigate } from 'react-router-dom';
import { LLMProviderContext } from '../App';
import LLMProviderModelPicker, { PROVIDERS, OPENAI_MODELS } from './LLMProviderModelPicker';

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
    const { provider: llmProvider } = React.useContext(LLMProviderContext);
    const [selectedProvider, setSelectedProvider] = React.useState('openai');
    const [selectedModel, setSelectedModel] = React.useState(OPENAI_MODELS[0].value);

    const analyzeFile = async (file: File) => {
        setLoading(true);
        setResult(null);
        setError(null);
        setFilePath(file.path);
        try {
            const analysis = await analyzeFileApi(file.path, selectedProvider, selectedModel);
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

    // Update model list when provider changes
    const handleProviderChange = (provider: string) => {
        setSelectedProvider(provider);
    };

    const handleModelChange = (model: string) => {
        setSelectedModel(model);
    };

    // Define a shared button style for consistency
    const baseBtn = "px-6 py-3 min-w-[160px] rounded-lg font-semibold shadow transition-colors duration-200 flex items-center justify-center gap-2 text-base";
    const btnPrimary = `${baseBtn} bg-blue-600 text-white hover:bg-blue-700`;
    const btnSuccess = `${baseBtn} bg-green-600 text-white hover:bg-green-700`;
    const btnSecondary = `${baseBtn} bg-white border-2 border-green-600 text-green-600 hover:bg-green-50 hover:border-green-700`;
    const btnGray = `${baseBtn} bg-gray-600 text-white hover:bg-gray-700`;
    const btnDanger = `${baseBtn} bg-red-600 text-white hover:bg-red-700`;

    return (
        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-md border border-gray-200 max-w-2xl mx-auto mt-8">
            <h2 className="mb-4 text-2xl font-bold text-[#0275D8]">Upload PLC Files or Import Analysis</h2>
            {/* LLM Provider/Model Selector */}
            <div className="mb-4 w-full max-w-md">
                <LLMProviderModelPicker
                    selectedProvider={selectedProvider}
                    selectedModel={selectedModel}
                    onProviderChange={handleProviderChange}
                    onModelChange={handleModelChange}
                    layout="horizontal"
                    size="sm"
                    className="justify-center"
                />
            </div>
            <div className="flex flex-row gap-4 mb-6 w-full justify-center">
                <label className={btnPrimary + " cursor-pointer"}>
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
                <label htmlFor="plc-upload-input" className={btnSuccess + " cursor-pointer"}>
                    Upload PLC File
                </label>
            </div>
            {fileName && <p className="mb-2 text-sm text-gray-700">Selected file: <span className="font-mono font-semibold">{fileName}</span></p>}
            {loading && <p className="mb-2 text-blue-600">Analyzing...</p>}
            {error && <p className="mb-2 text-red-600">Error: {error}</p>}
            {result !== null && result !== undefined && (
                <>
                    {/* AnalysisDetails now includes its own container/card styling */}
                    <AnalysisDetails analysis={{
                        fileName: fileName,
                        filePath: filePath,
                        status: 'complete',
                        date: new Date().toISOString(),
                        analysis_json: result,
                        provider: selectedProvider,
                        model: selectedModel
                    }} />
                    <div className="flex flex-row flex-wrap gap-4 mt-6 w-full justify-center">
                        <button
                            className={btnSuccess}
                            disabled={saved}
                            onClick={async () => {
                                if (fileName && result) {
                                    try {
                                        // Extract provider/model if present in result
                                        let provider = result?.provider || result?.llm_provider || (result?.analysis_json?.provider) || selectedProvider || '';
                                        let model = result?.model || result?.llm_model || (result?.analysis_json?.model) || selectedModel || '';
                                        // @ts-ignore
                                        const saveResult = await window.electron.invoke('save-analysis', fileName, 'complete', result, filePath || '', provider, model);
                                        console.log('Save analysis result:', saveResult);
                                        
                                        if (saveResult && saveResult.ok) {
                                            setSaved(true);
                                            // Add a small delay to ensure database operation is fully committed
                                            await new Promise(resolve => setTimeout(resolve, 100));
                                            await refreshAnalyses();
                                            alert(`Analysis saved to database! (ID: ${saveResult.analysis_id})`);
                                        } else {
                                            throw new Error(saveResult?.error || 'Save failed');
                                        }
                                    } catch (e) {
                                        console.error('Save analysis error:', e);
                                        const errorMessage = e instanceof Error ? e.message : String(e);
                                        alert(`Failed to save analysis: ${errorMessage}`);
                                    }
                                }
                            }}
                        >
                            {saved ? 'Saved to Database' : 'Save Analysis to Database'}
                        </button>
                        <button
                            className={btnSuccess}
                            onClick={async () => {
                                if (fileName && result) {
                                    try {
                                        // Extract provider/model if present in result
                                        let provider = result?.provider || result?.llm_provider || (result?.analysis_json?.provider) || selectedProvider || '';
                                        let model = result?.model || result?.llm_model || (result?.analysis_json?.model) || selectedModel || '';
                                        await saveBaseline(fileName, fileName, filePath || '', result, provider, model);
                                        alert('Saved as baseline!');
                                    } catch (e) {
                                        alert('Failed to save as baseline');
                                    }
                                }
                            }}
                        >
                            Save as Baseline
                        </button>
                        <button
                            className={btnGray}
                            style={{ opacity: 1, visibility: 'visible', display: 'flex', backgroundColor: '#6B7280', color: '#fff', border: 'none' }}
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
                            className={btnPrimary}
                            onClick={() => setShowRaw(true)}
                        >
                            Show Raw Output
                        </button>
                    </div>
                    {showRaw && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                            <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full p-6 relative">
                                <button
                                    className={btnDanger + " absolute top-4 right-4 w-10 h-10 !p-0 flex items-center justify-center text-2xl"}
                                    onClick={() => setShowRaw(false)}
                                    aria-label="Close"
                                >Close</button>
                                <h2 className="text-lg font-bold mb-4">Raw LLM Output</h2>
                                <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto max-h-96">{JSON.stringify(result, null, 2)}</pre>
                                <button
                                    className={btnPrimary + " mt-4"}
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