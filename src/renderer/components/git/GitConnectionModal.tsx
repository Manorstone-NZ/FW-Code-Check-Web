import React, { useState, useEffect } from 'react';
import { 
  FolderIcon, 
  CloudIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  XMarkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface GitConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (repoPath: string) => void;
}

const GitConnectionModal: React.FC<GitConnectionModalProps> = ({ isOpen, onClose, onConnect }) => {
  const [connectionType, setConnectionType] = useState<'local' | 'clone'>('local');
  const [localPath, setLocalPath] = useState('');
  const [gitUrl, setGitUrl] = useState('');
  const [targetPath, setTargetPath] = useState('');
  const [branch, setBranch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        
        const result = await window.electronAPI.gitCloneRepository(
          gitUrl, 
          targetPath, 
          branch || undefined
        );
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
    // This would need to be implemented with a directory picker
    // For now, we'll just focus on manual entry
    console.log('Directory picker not implemented yet');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Connect to Git Repository</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Connection Type Selector */}
        <div className="mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setConnectionType('local')}
              className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                connectionType === 'local'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <FolderIcon className="h-6 w-6 mx-auto mb-2" />
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
              <CloudIcon className="h-6 w-6 mx-auto mb-2" />
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
                />
                <button
                  onClick={handleSelectDirectory}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  title="Browse for directory"
                >
                  <FolderIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Git Repository URL
                </label>
                <input
                  type="text"
                  value={gitUrl}
                  onChange={(e) => setGitUrl(e.target.value)}
                  placeholder="https://github.com/user/repo.git"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Directory
                </label>
                <input
                  type="text"
                  value={targetPath}
                  onChange={(e) => setTargetPath(e.target.value)}
                  placeholder="/path/to/clone/repository"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch (Optional)
                </label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="main, develop, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConnect}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                {connectionType === 'local' ? 'Connecting...' : 'Cloning...'}
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                {connectionType === 'local' ? 'Connect' : 'Clone & Connect'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GitConnectionModal;
