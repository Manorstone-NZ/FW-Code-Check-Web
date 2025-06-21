// Expose a secure IPC bridge for renderer
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // === Authentication Methods ===
  registerUser: (username, email, password, role) => ipcRenderer.invoke('register-user', username, email, password, role),
  authenticateUser: (username, password) => ipcRenderer.invoke('authenticate-user', username, password),
  createSession: (userId) => ipcRenderer.invoke('create-session', userId),
  validateSession: (sessionToken) => ipcRenderer.invoke('validate-session', sessionToken),
  logoutSession: (sessionToken) => ipcRenderer.invoke('logout-session', sessionToken),
  
  // === User Management Methods ===
  listUsers: () => ipcRenderer.invoke('list-users'),
  deleteUser: (userId) => ipcRenderer.invoke('delete-user', userId),
  toggleUserStatus: (userId, isActive) => ipcRenderer.invoke('toggle-user-status', userId, isActive),
  resetUserPassword: (userId, newPassword) => ipcRenderer.invoke('reset-user-password', userId, newPassword),
  
  // === Git Integration Methods ===
  gitCloneRepository: (url, localPath, branch) => ipcRenderer.invoke('git-clone-repository', url, localPath, branch),
  gitConnectRepository: (repoPath) => ipcRenderer.invoke('git-connect-repository', repoPath),
  gitGetBranches: () => ipcRenderer.invoke('git-get-branches'),
  gitCheckoutBranch: (branchName) => ipcRenderer.invoke('git-checkout-branch', branchName),
  gitGetFiles: (branch) => ipcRenderer.invoke('git-get-files', branch),
  gitGetStatus: () => ipcRenderer.invoke('git-get-status'),
  gitAnalyzeFile: (filePath, branch, provider, model) => ipcRenderer.invoke('git-analyze-file', filePath, branch, provider, model),
  gitCommitFile: (filePath, commitMessage, branch) => ipcRenderer.invoke('git-commit-file', filePath, commitMessage, branch),
  gitPushToRemote: (branch, remote) => ipcRenderer.invoke('git-push-to-remote', branch, remote),
  gitCopyFileFromBranch: (filePath, sourceBranch, targetPath) => ipcRenderer.invoke('git-copy-file-from-branch', filePath, sourceBranch, targetPath),
  
  // === Existing Methods ===
  analyzeFile: (filePath, provider, model) => ipcRenderer.invoke('analyze-file', filePath, provider, model),
  checkLLMStatus: () => ipcRenderer.invoke('check-llm-status'),
  listComparisonHistory: (analysisId, baselineId) => ipcRenderer.invoke('list-comparison-history', analysisId, baselineId),
  getOTThreatIntelEntries: () => ipcRenderer.invoke('get-ot-threat-intel-entries'),
  getOTThreatIntelLastSync: () => ipcRenderer.invoke('get-ot-threat-intel-last-sync'),
  syncOTThreatIntel: (provider) => ipcRenderer.invoke('sync-ot-threat-intel', provider),
  updateOTThreatIntelEntry: (entry) => ipcRenderer.invoke('update-ot-threat-intel-entry', entry),
  listAnalyses: () => ipcRenderer.invoke('list-analyses'),
  listBaselines: () => ipcRenderer.invoke('list-baselines'),
  debugLogHook: (log) => ipcRenderer.invoke('debug-log-hook', log),
  getSavedComparisons: () => ipcRenderer.invoke('get-saved-comparisons'),
  saveAnalysis: (fileName, status, analysisJson, filePath, provider, model) => ipcRenderer.invoke('save-analysis', fileName, status, analysisJson, filePath, provider, model),
  getAnalysis: (analysisId) => ipcRenderer.invoke('get-analysis', analysisId),
  getBaseline: (baselineId) => ipcRenderer.invoke('get-baseline', baselineId),
  saveBaseline: (fileName, originalName, filePath, analysisJson, provider, model) => ipcRenderer.invoke('save-baseline', fileName, originalName, filePath, analysisJson, provider, model),
  llmCompareAnalysisBaseline: (analysisPathOrContent, baselinePathOrContent, provider) => ipcRenderer.invoke('llm-compare-analysis-baseline', analysisPathOrContent, baselinePathOrContent, provider),
  saveComparisonResult: (payload) => ipcRenderer.invoke('save-comparison-result', payload),
  deleteComparisonResult: (comparisonId) => ipcRenderer.invoke('delete-comparison-result', comparisonId),
  getLLMLogs: () => ipcRenderer.invoke('get-llm-logs'),
  deleteBaseline: (baselineId) => ipcRenderer.invoke('delete-baseline', baselineId),
  deleteAnalysis: (analysisId) => ipcRenderer.invoke('delete-analysis', analysisId),
  installOllamaModel: (model) => ipcRenderer.invoke('install-ollama-model', model),
});

// Keep legacy support for existing code
contextBridge.exposeInMainWorld('electron', {
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args)
});
