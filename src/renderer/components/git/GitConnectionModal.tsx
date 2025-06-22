import React, { useState, useEffect } from 'react';

interface GitConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (repoPath: string) => void;
}

const GitConnectionModal: React.FC<GitConnectionModalProps> = ({ isOpen, onClose, onConnect }) => {
  const [connectionType, setConnectionType] = useState<'local' | 'clone'>('local');
  const [localPath, setLocalPath] = useState('');
  const [gitUrl, setGitUrl] = useState('https://github.com/Damiancnz/PLC-Programmes');
  const [targetPath, setTargetPath] = useState('');
  const [branch, setBranch] = useState('');
  const [availableBranches, setAvailableBranches] = useState<string[]>([]);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [fetchingBranches, setFetchingBranches] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPrivateRepo, setIsPrivateRepo] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Generate default target path
  useEffect(() => {
    const generateDefaultPath = async () => {
      if (connectionType === 'clone' && gitUrl && !targetPath) {
        try {
          // Extract repository name from URL
          const repoName = gitUrl.split('/').pop()?.replace('.git', '') || 'repository';
          
          console.log('[GitConnectionModal] Generating default path for repo:', repoName);
          
          // Get user's home directory
          const homeResult = await window.electronAPI.getHomeDirectory();
          console.log('[GitConnectionModal] Home directory result:', homeResult);
          
          if (homeResult.success) {
            const defaultPath = `${homeResult.path}/Documents/GitRepos/${repoName}`;
            console.log('[GitConnectionModal] Generated default path:', defaultPath);
            setTargetPath(defaultPath);
          } else {
            // Fallback to a simple default
            const fallbackPath = `~/Documents/GitRepos/${repoName}`;
            console.log('[GitConnectionModal] Using fallback path:', fallbackPath);
            setTargetPath(fallbackPath);
          }
        } catch (error) {
          console.error('[GitConnectionModal] Error generating path:', error);
          // Fallback to a simple default
          const repoName = gitUrl.split('/').pop()?.replace('.git', '') || 'repository';
          const fallbackPath = `~/Documents/GitRepos/${repoName}`;
          console.log('[GitConnectionModal] Using error fallback path:', fallbackPath);
          setTargetPath(fallbackPath);
        }
      }
    };
    
    generateDefaultPath();
  }, [connectionType, gitUrl, targetPath]);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);

    try {
      if (connectionType === 'local') {
        if (!localPath.trim()) {
          setError('Please enter a valid repository path');
          return;
        }
        
        const result = await window.electronAPI.gitConnectRepository(localPath);
        if (result.success) {
          onConnect(localPath);
          onClose();
        } else {
          setError(result.error || 'Failed to connect to repository');
        }
      } else {
        if (!gitUrl.trim() || !targetPath.trim()) {
          setError('Please enter both Git URL and target path');
          return;
        }
        
        // Basic validation for target path
        if (!targetPath || targetPath.trim() === '' || targetPath.includes('path/to/clone/repository')) {
          setError('Please specify a valid target directory for cloning');
          return;
        }
        
        console.log('[GitConnectionModal] Target path validation passed:', targetPath);
        
        if (isPrivateRepo && (!username.trim() || !password.trim())) {
          setError('Please enter both username and password for private repository');
          return;
        }
        
        setLoading(true);
        setError(null);
        
        console.log('[GitConnectionModal] Clone attempt:', {
          gitUrl,
          targetPath,
          branch,
          isPrivateRepo,
          hasUsername: !!username,
          hasPassword: !!password
        });
        
        const result = await window.electronAPI.gitCloneRepository(
          gitUrl, 
          targetPath, 
          branch || undefined,
          isPrivateRepo ? username : undefined,
          isPrivateRepo ? password : undefined
        );
        
        console.log('[GitConnectionModal] Clone result:', result);
        
        if (result.success) {
          onConnect(targetPath);
          onClose();
        } else {
          setError(result.error || 'Failed to clone repository');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDirectory = async () => {
    try {
      const result = await window.electronAPI.showDirectoryPicker();
      if (result.success && result.path) {
        if (connectionType === 'local') {
          setLocalPath(result.path);
        } else {
          setTargetPath(result.path);
        }
      }
    } catch (err) {
      console.error('Failed to open directory picker:', err);
      setError('Failed to open directory picker');
    }
  };

  const fetchBranches = async (url: string) => {
    if (!url.trim()) {
      setAvailableBranches([]);
      return;
    }
    
    setFetchingBranches(true);
    try {
      const result = await window.electronAPI.gitGetRemoteBranches(url);
      if (result.success && result.branches) {
        const branchNames = result.branches.map(branch => branch.name);
        setAvailableBranches(branchNames);
        // Auto-select main/master if available
        if (!branch && (branchNames.includes('main') || branchNames.includes('master'))) {
          setBranch(branchNames.includes('main') ? 'main' : 'master');
        }
      } else {
        console.error('Failed to fetch branches:', result.error);
        // Only show fallback if there was an error, not by default
        setAvailableBranches([]);
      }
    } catch (err) {
      console.error('Failed to fetch branches:', err);
      // Only show fallback if there was an error
      setAvailableBranches([]);
    } finally {
      setFetchingBranches(false);
    }
  };

  // Debounced URL change handler
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (connectionType === 'clone' && gitUrl.trim()) {
        fetchBranches(gitUrl);
      }
    }, 1000); // Wait 1 second after user stops typing

    return () => clearTimeout(timeoutId);
  }, [gitUrl, connectionType]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showBranchDropdown) {
        const target = event.target as HTMLElement;
        if (!target.closest('.branch-dropdown-container')) {
          setShowBranchDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showBranchDropdown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-md">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 p-10 max-h-[95vh] overflow-y-auto border border-gray-300">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Connect to Git Repository
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-3 hover:bg-gray-100 rounded-full"
            title="Close modal"
          >
            Close
          </button>
        </div>

        {/* Connection Type Selector */}
        <div className="mb-5">
          <div className="flex space-x-3">
            <button
              onClick={() => setConnectionType('local')}
              className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                connectionType === 'local'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-sm font-medium">Local Repository</div>
            </button>
            <button
              onClick={() => setConnectionType('clone')}
              className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                connectionType === 'clone'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-sm font-medium">Clone Repository</div>
            </button>
          </div>
        </div>

        {/* Connection Form */}
        <div className="space-y-4">
          {connectionType === 'local' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Repository Path
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={localPath}
                  onChange={(e) => setLocalPath(e.target.value)}
                  placeholder="/path/to/your/repository"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />                    <button
                      onClick={handleSelectDirectory}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                      title="Browse for directory"
                    >
                      Browse
                </button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Git Repository URL
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={gitUrl}
                    onChange={(e) => setGitUrl(e.target.value)}
                    placeholder="https://github.com/user/repo.git"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => fetchBranches(gitUrl)}
                    disabled={fetchingBranches || !gitUrl.trim()}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md transition-colors"
                    title="Fetch branches from repository"
                  >
                    {fetchingBranches ? "Loading..." : "Fetch Branches"}
                  </button>
                </div>
                {fetchingBranches && (
                  <p className="text-xs text-blue-600 mt-1">Fetching branches from repository...</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Directory
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={targetPath}
                    onChange={(e) => setTargetPath(e.target.value)}
                    placeholder="Path will be auto-generated from repository name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleSelectDirectory}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                    title="Browse for directory"
                  >
                    Browse
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch (Optional)
                </label>
                <div className="relative branch-dropdown-container">
                  <div className="flex space-x-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        placeholder="main, develop, etc."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                        onFocus={() => setShowBranchDropdown(true)}
                      />
                      <button
                        onClick={() => setShowBranchDropdown(!showBranchDropdown)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        disabled={fetchingBranches}
                        title="Show available branches"
                      >
                        {fetchingBranches ? "..." : "▼"}
                      </button>
                    </div>
                  </div>
                  
                  {/* Branch Dropdown */}
                  {showBranchDropdown && availableBranches.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto branch-dropdown-container">
                      {availableBranches.map((branchName) => (
                        <button
                          key={branchName}
                          onClick={() => {
                            setBranch(branchName);
                            setShowBranchDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                        >
                          {branchName}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Authentication for private repositories */}
              <div>
                <label className="flex items-center space-x-2 mb-3">
                  <input
                    type="checkbox"
                    checked={isPrivateRepo}
                    onChange={(e) => setIsPrivateRepo(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Private repository (requires authentication)</span>
                </label>
                
                {isPrivateRepo && (
                  <div className="space-y-3 pl-6 border-l-2 border-gray-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Username
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="GitHub username or email"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password/Token
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password or personal access token"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        For GitHub, use a personal access token instead of your password
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <span className="text-red-400 mr-2 mt-0.5 text-lg">!</span>
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4 mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-base font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConnect}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center justify-center text-base font-medium"
          >
            {loading ? (
              <>
                Loading... {connectionType === 'local' ? 'Connecting...' : 'Cloning...'}
              </>
            ) : (
              connectionType === 'local' ? 'Connect' : 'Clone & Connect'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GitConnectionModal;
