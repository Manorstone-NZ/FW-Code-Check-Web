import React, { useState, useEffect } from 'react';

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

interface GitFileSelectorProps {
  repositoryPath: string;
  onFileSelect: (file: GitFile, branch: string) => void;
  selectedFile?: GitFile | null;
  selectedBranch?: string;
}

const GitFileSelector: React.FC<GitFileSelectorProps> = ({ 
  repositoryPath, 
  onFileSelect, 
  selectedFile,
  selectedBranch
}) => {
  const [branches, setBranches] = useState<GitBranch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<string>(selectedBranch || '');
  const [files, setFiles] = useState<GitFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

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
        const currentBranchName = selectedBranch || result.current_branch || '';
        setCurrentBranch(currentBranchName);
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
        // Filter for PLC files (.l5x, .L5X) and text files
        const plcFiles = (result.files || []).filter((file: GitFile) => 
          file.name.toLowerCase().endsWith('.l5x') || 
          file.name.toLowerCase().endsWith('.txt') ||
          file.name.toLowerCase().endsWith('.plc')
        );
        setFiles(plcFiles);
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

  const getFileIcon = (fileName: string) => {
    if (fileName.toLowerCase().endsWith('.l5x')) {
      return <span className="h-6 w-6 text-blue-500 flex items-center justify-center text-xs font-bold bg-blue-50 rounded">.L5X</span>;
    }
    return <span className="h-6 w-6 text-gray-500 flex items-center justify-center text-xs font-bold bg-gray-50 rounded">FILE</span>;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: string | number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full">
      {/* Branch Selector */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-3">
          <span className="h-6 w-6 text-gray-600 flex items-center justify-center text-xs font-bold">BRANCH</span>
          <select
            value={currentBranch}
            onChange={(e) => handleBranchChange(e.target.value)}
            disabled={loading}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="">Select a branch...</option>
            {branches.map((branch) => (
              <option key={branch.name} value={branch.name}>
                {branch.name} {branch.active ? '(current)' : ''} {branch.type === 'remote' ? `(${branch.remote})` : ''}
              </option>
            ))}
          </select>
          <button
            onClick={() => loadFiles(currentBranch)}
            disabled={loading || !currentBranch}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md transition-colors flex items-center text-sm"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {/* File List Toggle */}
      {files.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center justify-between w-full p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm font-medium text-gray-900">
              {files.length} PLC file{files.length === 1 ? '' : 's'} found
              {selectedFile && ` (${selectedFile.name} selected)`}
            </span>
            <span className="h-6 w-6 text-gray-500 flex items-center justify-center text-xs font-bold">
              {expanded ? 'Hide' : 'Show'}
            </span>
          </button>

          {/* File List */}
          {expanded && (
            <div className="mt-2 border border-gray-200 rounded-lg bg-white max-h-60 overflow-y-auto">
              {files.map((file) => (
                <button
                  key={file.path}
                  onClick={() => {
                    onFileSelect(file, currentBranch);
                    setExpanded(false);
                  }}
                  className={`w-full p-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                    selectedFile?.path === file.path ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    {getFileIcon(file.name)}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{file.name}</div>
                      <div className="text-xs text-gray-500 truncate">{file.path}</div>
                    </div>
                    <div className="text-xs text-gray-500">
                      <div>{formatFileSize(file.size)}</div>
                      <div>{formatDate(file.last_modified)}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center p-4">
          <span className="text-sm text-gray-600 font-bold">LOADING FILES...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && currentBranch && files.length === 0 && (
        <div className="text-center p-4 text-gray-500">
          <span className="h-6 w-6 mx-auto mb-2 text-gray-400 flex items-center justify-center text-sm font-bold">EMPTY</span>
          <p className="text-sm">No PLC files found in this branch</p>
        </div>
      )}
    </div>
  );
};

export default GitFileSelector;
