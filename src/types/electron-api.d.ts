// User authentication types
interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at?: string;
  last_login?: string;
  is_active?: boolean;
  failed_login_attempts?: number;
  locked_until?: string;
}

interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

interface SessionResult {
  success: boolean;
  session?: {
    id: number;
    token: string;
    expires_at: string;
  };
  error?: string;
}

interface SessionValidationResult {
  success: boolean;
  user?: User;
  error?: string;
}

interface LogoutResult {
  success: boolean;
  error?: string;
}

interface UserListResult {
  success: boolean;
  users?: User[];
  error?: string;
}

interface UserManagementResult {
  success: boolean;
  message?: string;
  error?: string;
}

// Git integration types
interface GitBranch {
  name: string;
  type: 'local' | 'remote';
  active: boolean;
  commit: string;
  remote?: string;
}

interface GitFile {
  path: string;
  name: string;
  size: number;
  last_modified: string | number;
  sha?: string;
  full_path?: string;
}

interface GitRepository {
  path: string;
  current_branch?: string;
  is_dirty: boolean;
  untracked_files: string[];
  modified_files: string[];
  staged_files: string[];
  remotes: string[];
  last_commit?: {
    hash: string;
    message: string;
    author: string;
    date: string;
  };
}

interface GitResult {
  success: boolean;
  error?: string;
  message?: string;
  path?: string;
}

interface GitBranchResult extends GitResult {
  branches?: GitBranch[];
  current_branch?: string;
}

interface GitFileResult extends GitResult {
  files?: GitFile[];
  branch?: string;
}

interface GitStatusResult extends GitResult {
  status?: GitRepository;
}

interface GitCommitResult extends GitResult {
  commit_hash?: string;
  branch?: string;
}

interface GitPushResult extends GitResult {
  push_info?: string[];
}

interface GitAnalysisResult {
  success: boolean;
  error?: string;
  git_metadata?: {
    original_path: string;
    branch: string;
    analyzed_from_git: boolean;
  };
  [key: string]: any; // Analysis result properties
}

// Dialog result types
interface DialogResult {
  success: boolean;
  path?: string;
  cancelled?: boolean;
  error?: string;
}

// Electron API declarations
declare global {
  interface Window {
    electronAPI: {
      // === Authentication Methods ===
      registerUser: (username: string, email: string, password: string, role?: string) => Promise<AuthResult>;
      authenticateUser: (username: string, password: string) => Promise<AuthResult>;
      createSession: (userId: number) => Promise<SessionResult>;
      validateSession: (sessionToken: string) => Promise<SessionValidationResult>;
      logoutSession: (sessionToken: string) => Promise<LogoutResult>;
      
      // === User Management Methods ===
      listUsers: () => Promise<UserListResult>;
      deleteUser: (userId: number) => Promise<UserManagementResult>;
      toggleUserStatus: (userId: number, isActive: boolean) => Promise<UserManagementResult>;
      resetUserPassword: (userId: number, newPassword: string) => Promise<UserManagementResult>;
      
      // === Git Integration Methods ===
      gitCloneRepository: (url: string, localPath: string, branch?: string, username?: string, password?: string) => Promise<GitResult>;
      gitConnectRepository: (repoPath: string) => Promise<GitResult>;
      gitGetBranches: () => Promise<GitBranchResult>;
      gitGetRemoteBranches: (url: string) => Promise<GitBranchResult>;
      gitCheckoutBranch: (branchName: string) => Promise<GitResult>;
      gitGetFiles: (branch?: string) => Promise<GitFileResult>;
      gitGetStatus: () => Promise<GitStatusResult>;
      gitAnalyzeFile: (filePath: string, branch?: string, provider?: string, model?: string) => Promise<GitAnalysisResult>;
      gitCommitFile: (filePath: string, commitMessage: string, branch?: string) => Promise<GitCommitResult>;
      gitPushToRemote: (branch?: string, remote?: string) => Promise<GitPushResult>;
      gitCopyFileFromBranch: (filePath: string, sourceBranch: string, targetPath?: string) => Promise<GitResult>;
      
      // === Dialog Methods ===
      showDirectoryPicker: () => Promise<DialogResult>;
      showSaveDirectoryPicker: () => Promise<DialogResult>;
      getHomeDirectory: () => Promise<{ success: boolean; path?: string; error?: string }>;
      
      // === Existing Methods ===
      analyzeFile: (filePath: string, provider?: string, model?: string) => Promise<any>;
      checkLLMStatus: () => Promise<any>;
      listComparisonHistory: (analysisId?: number, baselineId?: number) => Promise<any>;
      getOTThreatIntelEntries: () => Promise<any>;
      getOTThreatIntelLastSync: () => Promise<any>;
      syncOTThreatIntel: (provider?: string) => Promise<any>;
      updateOTThreatIntelEntry: (entry: any) => Promise<any>;
      clearOTThreatIntel: () => Promise<any>;
      bulkOTThreatIntel: () => Promise<any>;
      clearAllData: () => Promise<any>;
      listAnalyses: () => Promise<any>;
      getAnalyses: () => Promise<any>;
      listBaselines: () => Promise<any>;
      debugLogHook: (log: any) => void;
      getSavedComparisons: () => Promise<any>;
      saveAnalysis: (fileName: string, status: string, analysisJson: any, filePath?: string, provider?: string, model?: string) => Promise<any>;
      getAnalysis: (analysisId: number) => Promise<any>;
      getBaseline: (baselineId: number) => Promise<any>;
      saveBaseline: (fileName: string, originalName?: string, filePath?: string, analysisJson?: any, provider?: string, model?: string) => Promise<any>;
      llmCompareAnalysisBaseline: (analysisPathOrContent: string, baselinePathOrContent: string, provider?: string) => Promise<any>;
      saveComparisonResult: (payload: any) => Promise<any>;
      deleteComparisonResult: (comparisonId: number) => Promise<any>;
      getLLMLogs: () => Promise<any>;
      clearLLMLog: () => Promise<any>;
      deleteBaseline: (baselineId: number) => Promise<any>;
      deleteAnalysis: (analysisId: number) => Promise<any>;
      installOllamaModel: (model: string) => Promise<any>;
      
      // === Test Suite Methods ===
      openTestDashboard: () => Promise<void>;
      openDevTools: () => Promise<{ success: boolean; error?: string }>;
    };
    
    // Test Runner Interface
    testRunner?: {
      runQuickValidation: () => Promise<any>;
      runFullValidation: () => Promise<any>;
      runBackendTests: () => Promise<any>;
      runUITests: () => Promise<any>;
      runWorkflowTests: () => Promise<any>;
      runPerformanceTests: () => Promise<any>;
      runSecurityTests: () => Promise<any>;
      runIntegrationTests: () => Promise<any>;
      runFrontendTests: () => Promise<any>;
      checkAvailability: () => void;
    };
  }
}

export {};
