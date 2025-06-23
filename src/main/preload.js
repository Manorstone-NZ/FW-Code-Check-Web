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
  gitCloneRepository: (url, localPath, branch, username, password) => ipcRenderer.invoke('git-clone-repository', url, localPath, branch, username, password),
  gitConnectRepository: (repoPath) => ipcRenderer.invoke('git-connect-repository', repoPath),
  gitGetBranches: () => ipcRenderer.invoke('git-get-branches'),
  gitGetRemoteBranches: (url) => ipcRenderer.invoke('git-get-remote-branches', url),
  gitCheckoutBranch: (branchName) => ipcRenderer.invoke('git-checkout-branch', branchName),
  gitGetFiles: (branch) => ipcRenderer.invoke('git-get-files', branch),
  gitGetStatus: () => ipcRenderer.invoke('git-get-status'),
  gitAnalyzeFile: (filePath, branch, provider, model) => ipcRenderer.invoke('git-analyze-file', filePath, branch, provider, model),
  gitCommitFile: (filePath, commitMessage, branch) => ipcRenderer.invoke('git-commit-file', filePath, commitMessage, branch),
  gitPushToRemote: (branch, remote) => ipcRenderer.invoke('git-push-to-remote', branch, remote),
  gitCopyFileFromBranch: (filePath, sourceBranch, targetPath) => ipcRenderer.invoke('git-copy-file-from-branch', filePath, sourceBranch, targetPath),
  
  // === Dialog Methods ===
  showDirectoryPicker: () => ipcRenderer.invoke('show-directory-picker'),
  showSaveDirectoryPicker: () => ipcRenderer.invoke('show-save-directory-picker'),
  getHomeDirectory: () => ipcRenderer.invoke('get-home-directory'),
  
  // === Existing Methods ===
  analyzeFile: (filePath, provider, model) => ipcRenderer.invoke('analyze-file', filePath, provider, model),
  checkLLMStatus: () => ipcRenderer.invoke('check-llm-status'),
  listComparisonHistory: (analysisId, baselineId) => ipcRenderer.invoke('list-comparison-history', analysisId, baselineId),
  getOTThreatIntelEntries: () => ipcRenderer.invoke('get-ot-threat-intel-entries'),
  getOTThreatIntelLastSync: () => ipcRenderer.invoke('get-ot-threat-intel-last-sync'),
  syncOTThreatIntel: (provider) => ipcRenderer.invoke('sync-ot-threat-intel', provider),
  updateOTThreatIntelEntry: (entry) => ipcRenderer.invoke('update-ot-threat-intel-entry', entry),
  clearOTThreatIntel: () => ipcRenderer.invoke('clear-ot-threat-intel'),
  clearAllData: () => ipcRenderer.invoke('clear-all-data'),
  bulkOTThreatIntel: () => ipcRenderer.invoke('bulk-ot-threat-intel'),
  listAnalyses: () => ipcRenderer.invoke('list-analyses'),
  listBaselines: () => ipcRenderer.invoke('list-baselines'),
  debugLogHook: (log) => ipcRenderer.invoke('debug-log-hook', log),
  getSavedComparisons: () => ipcRenderer.invoke('get-saved-comparisons'),
  getAnalysis: (analysisId) => ipcRenderer.invoke('get-analysis', analysisId),
  getBaseline: (baselineId) => ipcRenderer.invoke('get-baseline', baselineId),
  saveBaseline: (fileName, originalName, filePath, analysisJson, provider, model) => ipcRenderer.invoke('save-baseline', fileName, originalName, filePath, analysisJson, provider, model),
  llmCompareAnalysisBaseline: (analysisPathOrContent, baselinePathOrContent, provider) => ipcRenderer.invoke('llm-compare-analysis-baseline', analysisPathOrContent, baselinePathOrContent, provider),
  saveComparisonResult: (payload) => ipcRenderer.invoke('save-comparison-result', payload),
  deleteComparisonResult: (comparisonId) => ipcRenderer.invoke('delete-comparison-result', comparisonId),
  getLLMLogs: () => ipcRenderer.invoke('get-llm-logs'),
  clearLLMLog: () => ipcRenderer.invoke('clear-llm-log'),
  deleteBaseline: (baselineId) => ipcRenderer.invoke('delete-baseline', baselineId),
  
  // === Missing Handler Exposures ===
  getAnalyses: () => ipcRenderer.invoke('get-analyses'),
  getLlmStatus: () => ipcRenderer.invoke('get-llm-status'),
  login: (credentials) => ipcRenderer.invoke('login', credentials),
  updateUser: (userId, userData) => ipcRenderer.invoke('update-user', userId, userData),
  resetDb: () => ipcRenderer.invoke('reset-db'),
  
  // === Additional Missing Handlers ===
  deleteAnalysis: (analysisId) => ipcRenderer.invoke('delete-analysis', analysisId),
  saveAnalysis: (fileName, status, analysisJson, filePath, provider, model) => ipcRenderer.invoke('save-analysis', fileName, status, analysisJson, filePath, provider, model),
  
  // === Missing System Handlers ===
  showSaveDirectoryPicker: () => ipcRenderer.invoke('show-save-directory-picker'),
  installOllamaModel: (modelName) => ipcRenderer.invoke('install-ollama-model', modelName),
  
  // === Comparison Handler Alias ===
  compareAnalyses: (analysisPathOrContent, baselinePathOrContent, provider) => ipcRenderer.invoke('compare-analyses', analysisPathOrContent, baselinePathOrContent, provider),
  
  // === Test Suite Methods ===
  openTestDashboard: () => ipcRenderer.invoke('open-test-dashboard'),
  openDevTools: () => ipcRenderer.invoke('open-dev-tools'),
});

// Keep legacy support for existing code
contextBridge.exposeInMainWorld('electron', {
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args)
});
