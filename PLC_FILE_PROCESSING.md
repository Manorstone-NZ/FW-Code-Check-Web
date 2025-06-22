# PLC File Processing Guide

## 📁 **Supported File Types**
- **`.l5x`** - RSLogix 5000 Export files (like your ACM_Services_V1.l5x)
- **`.l5k`** - RSLogix 5000 Archive files
- **`.acd`** - Studio 5000 Archive files
- **`.txt`** - Text-based PLC code exports
- **`.json`** - Previously analyzed results
- **`.xml`** - XML-based PLC configurations

## 🔄 **Processing Methods**

### **1. Local File Upload**
```
1. Open the application (npm start)
2. Navigate to "File Upload" page
3. Select "Local Files" tab
4. Choose LLM provider (OpenAI, Claude, etc.)
5. Click "Upload PLC File"
6. Select your .l5x file
7. Review security analysis results
```

### **2. Git Integration Workflow**
```
1. Select "Git Repository" tab
2. Connect to your repository:
   - Clone: Enter Git URL and local path
   - Connect: Browse to existing local repo
3. Select branch (development/feature branch)
4. Browse available PLC files
5. Click "Analyze" on desired file
6. Review risk assessment
7. Submit to main branch (if low risk)
```

### **3. CLI Analysis (for testing)**
```bash
# Direct analysis
python3 src/python/analyzer.py "path/to/file.l5x" openai gpt-4

# Git integration
python3 src/python/git_integration.py --connect /path/to/repo
python3 src/python/git_integration.py --files
```

## 🛡️ **Security Analysis Output**

Your PLC file analysis includes:

### **Risk Levels**
- 🔴 **High Risk**: Critical security issues (blocks submission)
- 🟡 **Medium Risk**: Significant concerns (blocks submission)
- 🟢 **Low Risk**: Minor issues (allows submission)

### **Analysis Sections**
1. **Executive Summary** - High-level overview
2. **Cyber Security Key Findings** - Specific vulnerabilities
3. **General Structure Observations** - Code organization
4. **Code Structure & Quality Review** - Best practices
5. **Implications and Recommendations** - Action items
6. **Next Steps** - Follow-up actions
7. **Instruction-Level Analysis** - Detailed code review

## 📊 **Your File Analysis Results**

**File**: `ACM_Services_V1.l5x` (9.92 MB)
**Key Findings**:
- ⚠️ **Medium Risk**: Lack of Data Validation
- ⚠️ **Medium Risk**: Potential Covert Data Manipulation
- 📋 **Structure**: Generator communication data types
- 🔧 **Recommendations**: Add input validation and logging

**Specific Issues Identified**:
- Direct read/write access without validation
- Poor naming conventions (MW_00, MW_01, etc.)
- Missing documentation for malfunction bit ranges
- Lack of audit trails for data changes

## 🎯 **Recommended Workflow**

1. **Upload & Analyze**: Process your PLC file through the application
2. **Review Findings**: Examine all security issues and recommendations
3. **Address Issues**: Fix medium/high risk problems in your code
4. **Re-analyze**: Upload the corrected version
5. **Submit**: Use Git workflow to commit approved changes

## 🔧 **Integration Options**

### **For Development Teams**
- Set up Git integration for continuous analysis
- Use branch-based workflow with risk gating
- Implement automated submission to main branch

### **For Individual Analysis**
- Use local file upload for one-off analysis
- Export results as JSON for documentation
- Compare against baselines for change tracking

## 📞 **Support & Troubleshooting**

- **App won't start**: Check `npm start` output for errors
- **Analysis fails**: Verify file format and LLM API keys
- **Git issues**: Ensure repository permissions and Git credentials
- **Large files**: Consider breaking down complex PLC projects

---

**Your PLC file is ready for analysis!** The system has already successfully processed `ACM_Services_V1.l5x` and identified several security improvements that should be addressed before production deployment.
