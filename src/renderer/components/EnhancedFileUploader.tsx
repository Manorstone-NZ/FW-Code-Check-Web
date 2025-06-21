import * as React from 'react';
import { saveBaseline, useAnalyses, analyzeFile as analyzeFileApi } from '../utils/analysisApi';
import AnalysisDetails from './AnalysisDetails';
import { useNavigate } from 'react-router-dom';
import { LLMProviderContext } from '../App';
import LLMProviderModelPicker, { PROVIDERS, OPENAI_MODELS } from './LLMProviderModelPicker';
import GitConnectionModal from './git/GitConnectionModal';
import GitFileBrowser from './git/GitFileBrowser';
import { 
    CloudArrowUpIcon, 
    DocumentIcon, 
    CodeBracketIcon, 
    CommandLineIcon 
} from '@heroicons/react/24/outline';

const EnhancedFileUploader = () => {
    // Existing state
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

    // Git integration state
    const [showGitConnection, setShowGitConnection] = React.useState(false);
    const [showGitBrowser, setShowGitBrowser] = React.useState(false);
    const [gitRepositoryPath, setGitRepositoryPath] = React.useState<string | null>(null);
    const [gitConnected, setGitConnected] = React.useState(false);
    const [uploadMode, setUploadMode] = React.useState<'local' | 'git'>('local');

    // Existing functions
    const analyzeFile = async (file: File) => {
        setLoading(true);
        setResult(null);
        setError(null);
        setFilePath(file.path);
        try {
            const analysis = await analyzeFileApi(file.path, selectedProvider, selectedModel);
            setResult(analysis);
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

    // Git integration functions
    const handleGitConnect = (repoPath: string) => {
        setGitRepositoryPath(repoPath);
        setGitConnected(true);
        setUploadMode('git');
    };

    const handleGitAnalyzeFile = async (filePath: string, branch: string, provider: string, model: string) => {
        setLoading(true);
        setResult(null);
        setError(null);
        setFileName(`${filePath} (${branch})`);
        
        try {
            const analysis = await window.electronAPI.gitAnalyzeFile(filePath, branch, provider, model);
            if (analysis.success) {
                setResult(analysis);
                setFilePath(`git://${gitRepositoryPath}/${filePath}@${branch}`);
                refreshAnalyses();
                // Close Git browser after successful analysis
                setShowGitBrowser(false);
            } else {
                setError(analysis.error || 'Git analysis failed');
            }
            return analysis;
        } catch (e) {
            const errorMsg = e instanceof Error ? e.message : 'Git analysis failed';
            setError(errorMsg);
            return { success: false, error: errorMsg };
        } finally {
            setLoading(false);
        }
    };

    const checkRiskLevel = (analysisResult: any) => {
        if (!analysisResult) return 'unknown';
        
        // Extract risk information from analysis
        const risks = analysisResult.risks || analysisResult.security_risks || [];
        const highRisks = risks.filter((risk: any) => 
            risk.severity === 'HIGH' || risk.level === 'high' || risk.priority === 'high'
        );
        const mediumRisks = risks.filter((risk: any) => 
            risk.severity === 'MEDIUM' || risk.level === 'medium' || risk.priority === 'medium'
        );
        
        if (highRisks.length > 0) return 'high';
        if (mediumRisks.length > 0) return 'medium';
        return 'low';
    };

    const canSubmitToMain = (analysisResult: any) => {
        const riskLevel = checkRiskLevel(analysisResult);
        return riskLevel === 'low';
    };

    const handleSubmitToMain = async () => {
        if (!result || !result.git_metadata) {
            alert('No Git analysis result available for submission');
            return;
        }

        const riskLevel = checkRiskLevel(result);
        if (riskLevel === 'high' || riskLevel === 'medium') {
            alert(`Cannot submit to main branch: ${riskLevel} risk issues detected. Please resolve all high and medium risk issues before submission.`);
            return;
        }

        if (window.confirm('Are you sure you want to submit this file to the main branch? This will commit and push the changes.')) {
            setLoading(true);
            try {
                const { original_path, branch } = result.git_metadata;
                
                // Step 1: Checkout main branch
                console.log('Checking out main branch...');
                const checkoutResult = await window.electronAPI.gitCheckoutBranch('main');
                if (!checkoutResult.success) {
                    throw new Error(`Failed to checkout main branch: ${checkoutResult.error}`);
                }

                // Step 2: Copy file from source branch to main branch working directory
                console.log(`Copying file from ${branch} to main branch...`);
                const copyResult = await window.electronAPI.gitCopyFileFromBranch(original_path, branch);
                if (!copyResult.success) {
                    throw new Error(`Failed to copy file from ${branch}: ${copyResult.error}`);
                }

                // Step 3: Commit the file to main branch
                const commitMessage = `Add analyzed PLC file: ${original_path}\n\nAnalyzed from branch: ${branch}\nRisk level: ${riskLevel}\nAnalysis passed security review.`;
                
                console.log('Committing file to main branch...');
                const commitResult = await window.electronAPI.gitCommitFile(original_path, commitMessage, 'main');
                if (!commitResult.success) {
                    throw new Error(`Failed to commit file: ${commitResult.error}`);
                }

                // Step 4: Push to remote main branch
                console.log('Pushing to remote main branch...');
                const pushResult = await window.electronAPI.gitPushToRemote('main', 'origin');
                if (!pushResult.success) {
                    throw new Error(`Failed to push to remote: ${pushResult.error}`);
                }

                // Success - show confirmation
                alert(`Successfully submitted ${original_path} to main branch!\n\nCommit: ${commitResult.commit_hash}\nPush: ${pushResult.message}`);
                
                // Reset state
                setResult(null);
                setFileName('');
                setFilePath('');
                
            } catch (e) {
                console.error('Submit to main failed:', e);
                alert('Failed to submit to main branch: ' + (e instanceof Error ? e.message : 'Unknown error'));
                
                // Try to switch back to original branch
                try {
                    if (result.git_metadata.branch !== 'main') {
                        await window.electronAPI.gitCheckoutBranch(result.git_metadata.branch);
                    }
                } catch (switchError) {
                    console.error('Failed to switch back to original branch:', switchError);
                }
            } finally {
                setLoading(false);
            }
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
    const btnWarning = `${baseBtn} bg-orange-600 text-white hover:bg-orange-700`;

    return (
        <>
            <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-md border border-gray-200 max-w-4xl mx-auto mt-8">
                <h2 className="mb-4 text-2xl font-bold text-[#0275D8]">Upload PLC Files or Import Analysis</h2>
                
                {/* Upload Mode Selector */}
                <div className="mb-6 w-full max-w-2xl">
                    <div className="flex space-x-4 mb-4">
                        <button
                            onClick={() => setUploadMode('local')}
                            className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                                uploadMode === 'local'
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <CloudArrowUpIcon className="h-8 w-8 mx-auto mb-2" />
                            <div className="font-medium">Local Files</div>
                            <div className="text-sm opacity-75">Upload from computer</div>
                        </button>
                        <button
                            onClick={() => setUploadMode('git')}
                            className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                                uploadMode === 'git'
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <CommandLineIcon className="h-8 w-8 mx-auto mb-2" />
                            <div className="font-medium">Git Repository</div>
                            <div className="text-sm opacity-75">Analyze from Git</div>
                        </button>
                    </div>
                </div>

                {/* LLM Provider/Model Selector */}
                <div className="mb-6 w-full max-w-md">
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

                {/* Upload Interface */}
                {uploadMode === 'local' ? (
                    <div className="flex flex-row gap-4 mb-6 w-full justify-center">
                        <label className={btnPrimary + " cursor-pointer"}>
                            <DocumentIcon className="h-5 w-5" />
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
                            <CodeBracketIcon className="h-5 w-5" />
                            Upload PLC File
                        </label>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4 mb-6 w-full items-center">
                        {!gitConnected ? (
                            <button
                                onClick={() => setShowGitConnection(true)}
                                className={btnPrimary}
                            >
                                <CommandLineIcon className="h-5 w-5" />
                                Connect to Git Repository
                            </button>
                        ) : (
                            <div className="flex flex-col items-center space-y-4">
                                <div className="text-center">
                                    <div className="text-sm text-gray-600">Connected to:</div>
                                    <div className="font-mono text-sm bg-gray-100 px-3 py-1 rounded">
                                        {gitRepositoryPath}
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setShowGitBrowser(true)}
                                        className={btnSuccess}
                                    >
                                        <CodeBracketIcon className="h-5 w-5" />
                                        Browse Files
                                    </button>
                                    <button
                                        onClick={() => {
                                            setGitConnected(false);
                                            setGitRepositoryPath(null);
                                        }}
                                        className={btnGray}
                                    >
                                        Disconnect
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {fileName && <p className="mb-2 text-sm text-gray-700">Selected file: <span className="font-mono font-semibold">{fileName}</span></p>}
                {loading && <p className="mb-2 text-blue-600">Analyzing...</p>}
                {error && <p className="mb-2 text-red-600">Error: {error}</p>}
                
                {result !== null && result !== undefined && (
                    <>
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
                                            let provider = result?.provider || result?.llm_provider || (result?.analysis_json?.provider) || selectedProvider || '';
                                            let model = result?.model || result?.llm_model || (result?.analysis_json?.model) || selectedModel || '';
                                            // @ts-ignore
                                            await window.electron.invoke('save-analysis', fileName, 'complete', result, filePath || '', provider, model);
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
                                className={btnSuccess}
                                onClick={async () => {
                                    if (fileName && result) {
                                        try {
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

                            {/* Git-specific actions */}
                            {result.git_metadata && (
                                <>
                                    {canSubmitToMain(result) ? (
                                        <button
                                            className={btnSuccess}
                                            onClick={handleSubmitToMain}
                                        >
                                            Submit to Main Branch
                                        </button>
                                    ) : (
                                        <button
                                            className={btnWarning}
                                            onClick={() => {
                                                const riskLevel = checkRiskLevel(result);
                                                alert(`Cannot submit: ${riskLevel} risk issues detected. Please resolve all high and medium risk issues before submission.`);
                                            }}
                                        >
                                            ⚠️ Cannot Submit ({checkRiskLevel(result)} risk)
                                        </button>
                                    )}
                                </>
                            )}
                            
                            <button
                                className={btnGray}
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
                                    >×</button>
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

            {/* Git Modals */}
            <GitConnectionModal
                isOpen={showGitConnection}
                onClose={() => setShowGitConnection(false)}
                onConnect={handleGitConnect}
            />

            {gitConnected && gitRepositoryPath && showGitBrowser && (
                <GitFileBrowser
                    repositoryPath={gitRepositoryPath}
                    onAnalyzeFile={handleGitAnalyzeFile}
                    onClose={() => setShowGitBrowser(false)}
                    selectedProvider={selectedProvider}
                    selectedModel={selectedModel}
                />
            )}
        </>
    );
};

export default EnhancedFileUploader;
