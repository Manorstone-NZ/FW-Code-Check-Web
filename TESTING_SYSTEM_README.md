# Testing System Documentation

## Overview
The First Watch PLC Code Checker now includes a comprehensive shell-based testing system that replaces the frontend test suite. This provides more reliable, automated testing that can be triggered from the terminal.

## Quick Start

### Interactive Test Menu
```bash
./test-menu.sh
```
This opens an interactive menu with all available test options.

### Quick Validation
```bash
./quick-test.sh
```
Runs essential system checks in under 30 seconds.

### Complete Test Suite
```bash
./run-all-tests.sh
```
Runs all comprehensive tests (2-3 minutes).

## Test Categories

### 1. Quick Tests (`./quick-test.sh`)
**Duration**: ~30 seconds  
**Purpose**: Fast validation for development workflow  
**Includes**:
- System dependencies (Node.js, Python, Git)
- Project structure validation
- Core file existence
- Key component verification
- Basic database connectivity

### 2. Frontend Tests (`./test-frontend.sh`)
**Duration**: ~1 minute  
**Purpose**: React component and UI validation  
**Includes**:
- React component existence and exports
- TypeScript integration checks
- CSS and styling validation
- Build system configuration
- Bundle file verification

### 3. Backend Tests (`./test-backend.sh`)
**Duration**: ~1-2 minutes  
**Purpose**: Python backend and database validation  
**Includes**:
- Python module syntax checking
- Database function availability
- Electron IPC handler verification
- Database integrity tests
- Configuration validation

### 4. Integration Tests (`./test-integration.sh`)
**Duration**: ~2 minutes  
**Purpose**: End-to-end workflow validation  
**Includes**:
- Complete analysis workflow
- Git integration workflow
- Comparison workflow
- OT Threat Intel workflow
- Data flow integration
- Security integration

### 5. Comprehensive Suite (`./run-all-tests.sh`)
**Duration**: ~3-5 minutes  
**Purpose**: Complete system validation  
**Includes**:
- All above tests plus:
- System environment validation
- Performance checks
- Security audits
- Detailed reporting

## Individual Feature Tests

### Core Feature Tests
- `./test-save-analysis.sh` - Save analysis functionality
- `./test-git-functionality.sh` - Git integration
- `./test-comparison-fix.sh` - Analysis comparison
- `./test-delete-button.sh` - Delete operations
- `./test-ot-threat-intel-fix.sh` - OT Threat Intel system

### UI-Specific Tests
- `./test-ot-threat-intel-ui-improvements.sh` - UI formatting
- `./test-ot-threat-intel-details-formatting.sh` - Details panel

## Test Output and Results

### Color-coded Results
- 🟢 **Green ✅**: Test passed
- 🔴 **Red ❌**: Test failed
- 🟡 **Yellow ⚠️**: Warning or partial success

### Exit Codes
- `0`: All tests passed
- `1`: Some tests failed but system mostly functional
- `2`: Critical failures, system needs attention

### Sample Output
```
🧪 QUICK VALIDATION TESTS
========================
Essential System Checks:

[1] Node.js...                    ✅
[2] Python3...                    ✅
[3] Git...                        ✅

Project Structure:

[4] Source directory...           ✅
[5] Public directory...           ✅
[6] Node modules...               ✅
[7] Bundle file...                ✅

📊 QUICK TEST SUMMARY
=====================
Total: 15 | Passed: 15 | Failed: 0
Success Rate: 100%

🎉 All quick tests passed! System ready!
```

## Integration with Development Workflow

### Pre-commit Testing
```bash
# Quick validation before committing changes
./quick-test.sh && git commit -m "Your commit message"
```

### Build Validation
```bash
# After building/installing dependencies
npm run build && ./test-frontend.sh
```

### Deployment Validation
```bash
# Before deployment
./run-all-tests.sh
```

### Continuous Integration
The test scripts can be integrated into CI/CD pipelines:
```yaml
# Example GitHub Actions
- name: Run Tests
  run: |
    chmod +x *.sh
    ./run-all-tests.sh
```

## Debugging Failed Tests

### Individual Test Analysis
When a test fails, run the specific category:
```bash
# If backend tests fail
./test-backend.sh

# If frontend tests fail
./test-frontend.sh
```

### Verbose Output
For detailed error information, run tests with verbose output:
```bash
bash -x ./test-backend.sh
```

### Manual Verification
Each test script can be examined to understand what it's checking:
```bash
# View test script contents
cat ./test-frontend.sh
```

## Adding New Tests

### Custom Test Scripts
Create new test scripts following the pattern:
```bash
#!/bin/bash
# Your custom test

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

PASSED=0
FAILED=0
TOTAL=0

# Your test functions here

echo "Test Results: Passed $PASSED, Failed $FAILED"
```

### Integration with Master Suite
Add your test to `run-all-tests.sh`:
```bash
run_test_script "./your-custom-test.sh" "Description of your test"
```

## Advantages Over Frontend Test Suite

### Reliability
- ✅ No browser dependencies
- ✅ No UI rendering issues
- ✅ Consistent execution environment
- ✅ Fast execution

### Automation
- ✅ CI/CD integration ready
- ✅ Command-line automation
- ✅ Scriptable and schedulable
- ✅ Exit code handling

### Debugging
- ✅ Clear error messages
- ✅ Detailed output logs
- ✅ Individual test isolation
- ✅ Verbose debugging options

### Maintenance
- ✅ Simple shell scripts
- ✅ Easy to modify/extend
- ✅ Version control friendly
- ✅ No complex dependencies

## Best Practices

### Regular Testing
- Run `./quick-test.sh` frequently during development
- Run `./run-all-tests.sh` before major releases
- Use individual tests when working on specific features

### Test-Driven Development
- Write tests for new features
- Ensure tests pass before committing
- Use tests to verify bug fixes

### Performance Monitoring
- Monitor test execution time
- Optimize slow tests
- Use quick tests for rapid feedback

## Troubleshooting

### Common Issues

**Permission Denied**
```bash
chmod +x *.sh
```

**Python Import Errors**
```bash
# Ensure you're in the project root
cd "/Users/damian/Development Projects/PLC Code Check/first-watch-plc-code-checker-v2"
```

**Missing Dependencies**
```bash
npm install
pip3 install -r requirements.txt  # if exists
```

### Support
For issues with the testing system, check:
1. All shell scripts are executable (`chmod +x *.sh`)
2. You're in the correct project directory
3. All dependencies are installed
4. Python path includes `src/python`

---

**The comprehensive shell-based testing system provides reliable, automated validation of the entire First Watch PLC Code Checker application.**
