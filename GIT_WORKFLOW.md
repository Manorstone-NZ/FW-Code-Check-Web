# Git Integration Workflow

## Overview

The PLC Code Checker now supports Git integration, allowing users to connect to Git repositories, browse files from development branches, analyze them for security risks, and submit approved files to the main branch.

## Features

### 1. Git Repository Connection
- **Clone Repository**: Clone a remote Git repository to a local directory
- **Connect to Local Repository**: Connect to an existing local Git repository
- **Repository Status**: View current repository status, branches, and file changes

### 2. Branch Management
- **List Branches**: View all local and remote branches
- **Switch Branches**: Checkout different branches for file analysis
- **Branch Information**: See current branch, commit hash, and branch status

### 3. File Browser
- **Browse Repository Files**: View files in the current or specified branch
- **Filter by Extension**: Automatically filters for supported PLC file types (.L5X, .L5K, etc.)
- **File Metadata**: See file size, last modified date, and path information

### 4. Git-Based Analysis
- **Analyze from Git**: Select and analyze files directly from Git branches
- **Temporary File Creation**: Creates secure temporary files for analysis without modifying repository
- **Branch Context**: Analysis results include Git metadata (branch, file path, etc.)

### 5. Risk-Gated Submission
- **Risk Assessment**: Automatically evaluates analysis results for security risks
- **Submission Gating**: Only allows submission to main branch if no high or medium risks are detected
- **Commit and Push**: Automatically commits approved files to main branch and pushes to remote

## Workflow

### Step 1: Connect to Repository
1. Open the File Uploader page
2. Select "Git Repository" upload mode
3. Choose either:
   - **Clone Repository**: Enter Git URL and local path
   - **Connect Local**: Browse to existing local repository

### Step 2: Browse and Select Files
1. Select branch from dropdown (defaults to current branch)
2. Browse available files in the repository
3. Click "Analyze" on desired file

### Step 3: Review Analysis Results
1. Review security analysis results
2. Check risk level classification:
   - **Low Risk**: Safe for submission to main
   - **Medium Risk**: Requires resolution before submission
   - **High Risk**: Must be fixed before submission

### Step 4: Submit to Main Branch (if approved)
1. If analysis shows only low risks, "Submit to Main" button becomes available
2. Click "Submit to Main Branch"
3. System will:
   - Switch to main branch
   - Copy file from source branch
   - Commit with detailed message
   - Push to remote main branch

## Risk Levels and Gating

### Risk Classification
- **High Risk**: Critical security vulnerabilities that must be addressed
- **Medium Risk**: Significant issues that should be resolved
- **Low Risk**: Minor issues or no significant security concerns

### Submission Rules
- ✅ **Low Risk Only**: File can be submitted to main branch
- ❌ **Medium or High Risk**: Submission blocked until issues are resolved

### Commit Message Format
```
Add analyzed PLC file: <file_path>

Analyzed from branch: <source_branch>
Risk level: <risk_level>
Analysis passed security review.
```

## Technical Implementation

### Backend Components
- **git_integration.py**: Python module handling all Git operations using GitPython
- **Electron IPC Handlers**: Bridge between frontend and Python Git operations
- **CLI Interface**: Command-line interface for testing and debugging Git operations

### Frontend Components
- **GitConnectionModal**: UI for connecting/cloning repositories
- **GitFileBrowser**: File browser with Git integration
- **EnhancedFileUploader**: Main upload interface with Git support
- **Risk Gating Logic**: Automatic risk assessment and submission control

### API Methods
- `gitCloneRepository(url, localPath, branch?)`
- `gitConnectRepository(repoPath)`
- `gitGetBranches()`
- `gitCheckoutBranch(branchName)`
- `gitGetFiles(branch?)`
- `gitAnalyzeFile(filePath, branch?, provider?, model?)`
- `gitCommitFile(filePath, commitMessage, branch?)`
- `gitPushToRemote(branch?, remote?)`
- `gitCopyFileFromBranch(filePath, sourceBranch, targetPath?)`

## Security Considerations

### Safe Analysis
- Files are analyzed in temporary directories
- Original repository files are never modified during analysis
- Temporary files are automatically cleaned up

### Controlled Submission
- Risk-based gating prevents unsafe files from reaching main branch
- All submissions require explicit user confirmation
- Detailed audit trail in commit messages

### Repository Safety
- All Git operations are performed safely with error handling
- Branch switching includes automatic restoration on failure
- Remote operations include proper authentication handling

## Requirements

### Dependencies
- **GitPython**: Python library for Git operations
- **Node.js/Electron**: Desktop application framework
- **React**: Frontend UI framework

### Git Setup
- Git must be installed on the system
- Repository must have proper remote configuration
- User must have appropriate Git credentials configured

## Usage Examples

### Connecting to a Repository
```javascript
// Clone a repository
const result = await window.electronAPI.gitCloneRepository(
  'https://github.com/user/repo.git',
  '/path/to/local/repo',
  'development'
);

// Connect to existing repository
const result = await window.electronAPI.gitConnectRepository('/path/to/repo');
```

### Analyzing a File from Git
```javascript
// Analyze file from specific branch
const analysis = await window.electronAPI.gitAnalyzeFile(
  'src/plc_files/program.L5X',
  'feature-branch',
  'openai',
  'gpt-4'
);
```

### Submitting to Main Branch
```javascript
// This is handled automatically by the UI based on risk assessment
// User clicks "Submit to Main" button, system performs:
// 1. Risk check
// 2. Branch checkout
// 3. File copy
// 4. Commit
// 5. Push
```

## Troubleshooting

### Common Issues
1. **Git Not Found**: Ensure Git is installed and in system PATH
2. **Authentication Errors**: Configure Git credentials properly
3. **Permission Denied**: Check repository permissions and SSH keys
4. **Branch Not Found**: Ensure branch exists locally or remotely

### Debug Mode
Enable debug logging by setting environment variable:
```bash
DEBUG=1 npm start
```

### CLI Testing
Test Git operations directly:
```bash
python3 src/python/git_integration.py --status
python3 src/python/git_integration.py --branches
```
