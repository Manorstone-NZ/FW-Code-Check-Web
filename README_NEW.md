# First Watch PLC Code Checker v2

A comprehensive security analysis tool for Programmable Logic Controller (PLC) code, featuring advanced Git integration and risk-based workflow management.

## 🚀 Features

### Core Analysis
- **PLC Code Security Analysis**: Comprehensive security scanning for PLC files (.L5X, .L5K, etc.)
- **Multiple LLM Support**: OpenAI GPT-4, Anthropic Claude, Google Gemini, and local Ollama models
- **Risk Classification**: Automatic categorization of security issues by severity
- **Baseline Comparison**: Compare analysis results against established baselines
- **OT Threat Intelligence**: Integration with operational technology threat databases

### Git Integration (NEW)
- **Repository Connection**: Clone remote repositories or connect to local Git repositories
- **Branch Management**: Browse and switch between branches for analysis
- **File Browser**: Navigate repository files with filtering for PLC file types
- **Risk-Gated Submission**: Automatic risk assessment with submission control
- **Automated Workflow**: Seamless commit and push to main branch for approved files

### User Management
- **Multi-User Support**: User registration, authentication, and role management
- **Session Management**: Secure session handling with token-based authentication
- **Access Control**: Role-based permissions and user status management

### Analysis Management
- **Analysis History**: Complete audit trail of all security analyses
- **Baseline Management**: Create and maintain security baselines
- **Comparison Reports**: Detailed comparison between analysis and baseline results
- **Export/Import**: JSON-based analysis result management

## 🔄 Git Workflow

The application now supports a complete Git-based workflow for PLC code analysis:

1. **Connect**: Clone or connect to Git repositories
2. **Browse**: Navigate branches and files within the repository
3. **Analyze**: Perform security analysis on files from any branch
4. **Review**: Examine risk levels and security findings
5. **Submit**: Automatically submit low-risk files to main branch

### Risk-Based Gating
- **High Risk**: ❌ Submission blocked - critical issues must be resolved
- **Medium Risk**: ❌ Submission blocked - significant issues require attention  
- **Low Risk**: ✅ Approved for submission to main branch

## 📋 Requirements

### System Requirements
- **Node.js** 16+ and npm
- **Python** 3.8+ with pip
- **Git** (for Git integration features)
- **Operating System**: Windows, macOS, or Linux

### Dependencies
- **Frontend**: React, TypeScript, Tailwind CSS, Heroicons
- **Backend**: Electron, Python, SQLite
- **Git Integration**: GitPython
- **AI/ML**: OpenAI API, Anthropic API, Google AI API, Ollama (optional)

## 🛠️ Installation

### 1. Clone Repository
```bash
git clone <repository-url>
cd first-watch-plc-code-checker-v2
```

### 2. Install Dependencies
```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
pip install -r requirements.txt
```

### 3. Configuration
Create configuration files for API keys:
```bash
# OpenAI API Key (optional)
echo "your-openai-api-key" > openai.key

# Set up other LLM providers as needed
```

### 4. Database Setup
```bash
# Initialize database
python src/python/db.py --init
```

## 🏃‍♂️ Running the Application

### Development Mode
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Electron App
```bash
npm run electron
```

## 📖 Usage

### Basic Analysis
1. Launch the application
2. Navigate to "File Upload" page
3. Choose upload mode:
   - **Local Files**: Upload PLC files from your computer
   - **Git Repository**: Analyze files from Git repositories
4. Select LLM provider and model
5. Upload/analyze files
6. Review security analysis results

### Git Integration Workflow
1. **Connect Repository**:
   - Click "Git Repository" tab
   - Enter repository URL and local path (for cloning)
   - Or browse to existing local repository
   
2. **Browse Files**:
   - Select branch from dropdown
   - Browse available PLC files
   - Click "Analyze" on desired file
   
3. **Review Analysis**:
   - Examine security findings
   - Check risk level classification
   - Review detailed analysis results
   
4. **Submit to Main** (if approved):
   - Button appears only for low-risk files
   - Click to automatically commit and push to main branch
   - System handles branch switching and file management

### User Management
1. **Registration**: Create user accounts with roles
2. **Authentication**: Secure login with session management
3. **User Administration**: Manage user status and permissions

## 🔧 Configuration

### LLM Providers
Configure API keys for different providers:
- **OpenAI**: Place API key in `openai.key`
- **Anthropic**: Configure in application settings
- **Google AI**: Set up API credentials
- **Ollama**: Install and configure local models

### Git Configuration
Ensure Git is properly configured:
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## 🧪 Testing

### Backend Tests
```bash
python -m pytest tests/
```

### Git Integration Tests
```bash
python test_git_integration.py
```

### Frontend Tests
```bash
npm test
```

## 📁 Project Structure

```
├── src/
│   ├── main/                 # Electron main process
│   │   ├── electron.js      # Main Electron entry point
│   │   └── preload.js       # Preload script for IPC
│   ├── python/              # Python backend
│   │   ├── analyzer.py      # Core analysis engine
│   │   ├── db.py           # Database operations
│   │   ├── git_integration.py # Git operations
│   │   └── config.py       # Configuration management
│   ├── renderer/            # React frontend
│   │   ├── components/     # React components
│   │   ├── pages/         # Application pages
│   │   └── utils/         # Utility functions
│   └── types/              # TypeScript definitions
├── tests/                   # Test files
├── public/                  # Static assets
└── docs/                   # Documentation
```

## 🔒 Security Features

### Analysis Security
- **Sandboxed Analysis**: Files analyzed in isolated temporary environments
- **No Code Execution**: Static analysis only, no PLC code execution
- **Secure Cleanup**: Automatic cleanup of temporary files

### Git Security
- **Safe Repository Operations**: All Git operations performed safely
- **Credential Management**: Secure handling of Git credentials
- **Branch Protection**: Automatic branch restoration on errors

### User Security
- **Encrypted Passwords**: Secure password hashing
- **Session Management**: Token-based authentication
- **Role-Based Access**: Granular permission control

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Documentation
- [Git Workflow Guide](GIT_WORKFLOW.md)
- [API Documentation](docs/API.md)
- [Troubleshooting Guide](docs/TROUBLESHOOTING.md)

### Getting Help
- Create an issue on GitHub
- Check existing documentation
- Review troubleshooting guides

## 🔄 Changelog

### v2.0.0 (Latest)
- ✨ **NEW**: Complete Git integration with repository management
- ✨ **NEW**: Risk-based submission gating for main branch
- ✨ **NEW**: Automated commit and push workflow
- ✨ **NEW**: Branch browsing and file selection
- 🔧 Enhanced user interface with Git controls
- 🔧 Improved error handling and user feedback
- 🔧 Extended API with Git operations

### v1.0.0
- 🎉 Initial release with core PLC analysis features
- 👥 Multi-user authentication system
- 📊 Baseline comparison functionality
- 🔗 Multiple LLM provider support
- 📈 Analysis history and reporting

---

**First Watch PLC Code Checker v2** - Securing industrial control systems through intelligent code analysis and Git-integrated workflows.
