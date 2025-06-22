import React, { useState, useEffect } from 'react';

// Local type definitions for Git integration
interface GitFile {
  path: string;
  name: string;
  size: number;
  last_modified: string | number;
  sha?: string;
  full_path?: string;
}

interface GitBranch {
  name: string;
  type: 'local' | 'remote';
  active: boolean;
  commit: string;
  remote?: string;
}

interface GitAnalysisResult {
  success: boolean;
  error?: string;
  git_metadata?: {
    original_path: string;
    branch: string;
    analyzed_from_git: boolean;
  };
  [key: string]: any;
}

interface GitFileBrowserProps {
  repositoryPath: string;
  onAnalyzeFile: (filePath: string, branch: string, provider: string, model: string) => Promise<GitAnalysisResult>;
  onClose: () => void;
  selectedProvider?: string;
  selectedModel?: string;
}

const GitFileBrowser: React.FC<GitFileBrowserProps> = ({ 
  repositoryPath, 
  onAnalyzeFile, 
  onClose,
  selectedProvider = 'openai',
  selectedModel = 'gpt-4'
}) => {
  const [branches, setBranches] = useState<GitBranch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<string>('');
  const [files, setFiles] = useState<GitFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<GitFile | null>(null);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<Map<string, GitAnalysisResult>>(new Map());

  useEffect(() => {
    loadBranches();
  }, [repositoryPath]);

  useEffect(() => {
    if (currentBranch) {
      loadFiles(currentBranch);
    }
  }, [currentBranch]);

  const loadBranches = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await window.electronAPI.gitGetBranches();
      if (result.success) {
        setBranches(result.branches || []);
        setCurrentBranch(result.current_branch || '');
      } else {
        setError(result.error || 'Failed to load branches');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  const loadFiles = async (branch: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await window.electronAPI.gitGetFiles(branch);
      if (result.success) {
        setFiles(result.files || []);
      } else {
        setError(result.error || 'Failed to load files');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleBranchChange = async (branchName: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await window.electronAPI.gitCheckoutBranch(branchName);
      if (result.success) {
        setCurrentBranch(branchName);
        await loadFiles(branchName);
      } else {
        setError(result.error || 'Failed to checkout branch');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to checkout branch');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeFile = async (file: GitFile) => {
    const fileKey = `${currentBranch}:${file.path}`;
    setAnalyzing(fileKey);
    setError(null);

    try {
      const result = await onAnalyzeFile(file.path, currentBranch, selectedProvider, selectedModel);
      setAnalysisResults(prev => new Map(prev.set(fileKey, result)));
      
      if (!result.success) {
        setError(result.error || 'Analysis failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(null);
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.toLowerCase().split('.').pop();
    switch (extension) {
      case 'l5x':
      case 'l5k':
      case 'acd':
        return <span className="text-blue-600 text-xs font-bold">.L5X</span>;
      case 'txt':
        return <span className="text-gray-600 text-xs font-bold">.TXT</span>;
      case 'json':
        return <span className="text-green-600 text-xs font-bold">.JSON</span>;
      default:
        return <span className="text-gray-400 text-xs font-bold">FILE</span>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateValue: string | number) => {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : new Date(dateValue * 1000);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getAnalysisStatus = (file: GitFile) => {
    const fileKey = `${currentBranch}:${file.path}`;
    if (analyzing === fileKey) {
      return 'analyzing';
    }
    if (analysisResults.has(fileKey)) {
      const result = analysisResults.get(fileKey);
      return result?.success ? 'success' : 'error';
    }
    return 'none';
  };

  const getAnalysisResult = (file: GitFile) => {
    const fileKey = `${currentBranch}:${file.path}`;
    return analysisResults.get(fileKey);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full mx-4 h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Git Repository Browser</h2>
            <p className="text-sm text-gray-600 mt-1">{repositoryPath}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            Close
          </button>
        </div>

        {/* Branch Selector */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-4">
            <span className="text-gray-600 mr-2 text-sm font-bold">BRANCH:</span>
            <select
              value={currentBranch}
              onChange={(e) => handleBranchChange(e.target.value)}
              disabled={loading}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              {branches.map((branch) => (
                <option key={branch.name} value={branch.name}>
                  {branch.name} {branch.active ? '(current)' : ''} {branch.type === 'remote' ? `(${branch.remote})` : ''}
                </option>
              ))}
            </select>
            <button
              onClick={() => loadFiles(currentBranch)}
              disabled={loading}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md transition-colors flex items-center text-sm"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <div className="flex">
              <span className="text-red-400 mr-2 mt-0.5 font-bold text-sm">ERROR:</span>
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* File List */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <span className="text-blue-500 font-bold">LOADING FILES...</span>
            </div>
          ) : (
            <div className="h-full overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      File
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Modified
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {files.map((file) => {
                    const analysisStatus = getAnalysisStatus(file);
                    const analysisResult = getAnalysisResult(file);
                    
                    return (
                      <tr
                        key={file.path}
                        className={`hover:bg-gray-50 ${selectedFile?.path === file.path ? 'bg-blue-50' : ''}`}
                        onClick={() => setSelectedFile(file)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getFileIcon(file.name)}
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{file.name}</div>
                              <div className="text-sm text-gray-500">{file.path}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatFileSize(file.size)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(file.last_modified)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAnalyzeFile(file);
                              }}
                              disabled={analysisStatus === 'analyzing'}
                              className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-medium rounded-md transition-colors"
                              title="Analyze this file"
                            >
                              {analysisStatus === 'analyzing' ? (
                                'Analyzing...'
                              ) : (
                                'Analyze'
                              )}
                            </button>
                            
                            {analysisStatus === 'success' && (
                              <span className="text-green-500 text-xs font-bold" title="Analysis completed successfully">SUCCESS</span>
                            )}
                            
                            {analysisStatus === 'error' && (
                              <span className="text-red-500 text-xs font-bold" title="Analysis failed">FAILED</span>
                            )}
                            
                            {analysisResult && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // TODO: Show analysis details
                                  console.log('Show analysis details:', analysisResult);
                                }}
                                className="inline-flex items-center px-2 py-1 text-gray-600 hover:text-gray-800 transition-colors text-xs"
                                title="View analysis results"
                              >
                                View
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {files.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center h-64">
                  <span className="text-gray-400 mb-4 text-lg font-bold">NO FILES</span>
                  <p className="text-gray-500">No PLC files found in this branch</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Looking for .l5x, .txt, and .json files
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {files.length} file{files.length !== 1 ? 's' : ''} found
              {currentBranch && ` in branch "${currentBranch}"`}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GitFileBrowser;
