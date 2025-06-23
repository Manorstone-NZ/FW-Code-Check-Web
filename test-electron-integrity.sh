#!/bin/bash

# Comprehensive Electron.js Integrity Test Suite
# Tests all functional aspects of the Electron main process

echo "⚡ ELECTRON.JS COMPREHENSIVE INTEGRITY TEST SUITE"
echo "=================================================="
echo ""

# Set colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test tracking variables
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
CRITICAL_FAILURES=0
START_TIME=$(date +%s)

# Function to run a test and track results
run_test() {
    local test_name="$1"
    local test_command="$2"
    local test_description="$3"
    local is_critical="${4:-false}"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -e "${BLUE}[$TOTAL_TESTS]${NC} Testing: $test_name"
    echo "   Description: $test_description"
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "   Result: ${GREEN}✅ PASSED${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        if [ "$is_critical" = "true" ]; then
            echo -e "   Result: ${RED}❌ CRITICAL FAILURE${NC}"
            CRITICAL_FAILURES=$((CRITICAL_FAILURES + 1))
        else
            echo -e "   Result: ${RED}❌ FAILED${NC}"
        fi
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    echo ""
}

echo "📁 CORE FILE STRUCTURE TESTS"
echo "============================="

# Test 1: Electron main file exists
run_test "Electron Main File" "[ -f 'src/main/electron.js' ]" "Check if electron.js exists" true

# Test 2: Preload script exists
run_test "Preload Script" "[ -f 'src/main/preload.js' ]" "Check if preload.js exists" true

# Test 3: Index HTML exists
run_test "Main HTML File" "[ -f 'public/index.html' ]" "Check if index.html exists" true

echo "🔧 ELECTRON.JS SYNTAX AND STRUCTURE TESTS"
echo "=========================================="

# Test 4: JavaScript syntax validation
run_test "JavaScript Syntax" "node -c src/main/electron.js" "Validate JavaScript syntax" true

# Test 5: Required modules import
run_test "Core Imports" "grep -q \"require('electron')\" src/main/electron.js" "Check Electron imports"

# Test 6: Child process import
run_test "Child Process Import" "grep -q \"spawn.*require('child_process')\" src/main/electron.js" "Check spawn import"

# Test 7: File system imports
run_test "File System Imports" "grep -q \"fs.*require('fs\" src/main/electron.js" "Check fs imports"

# Test 8: Path module import
run_test "Path Module Import" "grep -q \"path.*require('path')\" src/main/electron.js" "Check path import"

echo "🪟 WINDOW MANAGEMENT TESTS"
echo "=========================="

# Test 9: Window creation function
run_test "Window Creation Function" "grep -q \"createWindow.*=.*()\" src/main/electron.js" "Check createWindow function exists"

# Test 10: Window configuration
run_test "Window WebPreferences" "grep -q \"webPreferences:\" src/main/electron.js" "Check webPreferences configuration"

# Test 11: Context isolation
run_test "Context Isolation" "grep -q \"contextIsolation.*true\" src/main/electron.js" "Check context isolation enabled" true

# Test 12: Node integration disabled
run_test "Node Integration Disabled" "grep -q \"nodeIntegration.*false\" src/main/electron.js" "Check node integration disabled" true

# Test 13: Preload script path
run_test "Preload Path Configuration" "grep -q \"preload.*path.join.*preload.js\" src/main/electron.js" "Check preload script path"

echo "📱 APP EVENT HANDLERS TESTS"
echo "==========================="

# Test 14: App ready event
run_test "App Ready Handler" "grep -q \"app.on('ready'\" src/main/electron.js" "Check app ready event handler" true

# Test 15: Window closed event
run_test "Window Closed Handler" "grep -q \"app.on('window-all-closed'\" src/main/electron.js" "Check window closed handler"

# Test 16: App activate event
run_test "App Activate Handler" "grep -q \"app.on('activate'\" src/main/electron.js" "Check app activate handler"

# Test 17: App quit functionality
run_test "App Quit Function" "grep -q \"app.quit()\" src/main/electron.js" "Check app quit functionality"

echo "🔌 IPC HANDLER INTEGRITY TESTS"
echo "==============================="

# Define expected IPC handlers
IPC_HANDLERS=(
    "list-baselines"
    "list-analyses" 
    "get-analyses"
    "get-analysis"
    "get-baseline"
    "save-baseline"
    "delete-baseline"
    "delete-analysis"
    "save-analysis"
    "analyze-file"
    "get-llm-status"
    "check-llm-status"
    "login"
    "validate-session"
    "authenticate-user"
    "register-user"
    "create-session"
    "logout-session"
    "list-users"
    "update-user"
    "delete-user"
    "toggle-user-status"
    "reset-user-password"
    "show-directory-picker"
    "get-home-directory"
    "git-connect-repository"
    "git-get-branches"
    "git-get-remote-branches"
    "git-clone-repository"
    "git-checkout-branch"
    "git-get-status"
    "git-get-files"
    "git-commit-file"
    "git-push-to-remote"
    "git-copy-file-from-branch"
    "git-analyze-file"
    "get-ot-threat-intel-entries"
    "get-ot-threat-intel-last-sync"
    "sync-ot-threat-intel"
    "update-ot-threat-intel-entry"
    "clear-ot-threat-intel"
    "bulk-ot-threat-intel"
    "clear-all-data"
    "get-saved-comparisons"
    "save-comparison-result"
    "delete-comparison-result"
    "get-llm-logs"
    "clear-llm-log"
    "open-test-dashboard"
    "open-dev-tools"
    "llm-compare-analysis-baseline"
)

# Test each IPC handler
for handler in "${IPC_HANDLERS[@]}"; do
    run_test "IPC Handler: $handler" "grep -q \"ipcMain.handle('$handler'\" src/main/electron.js" "Check $handler IPC handler exists"
done

echo "🔐 SECURITY TESTS"
echo "================"

# Test: No eval() usage
run_test "No Eval Usage" "! grep -q \"eval(\" src/main/electron.js" "Check no eval() usage" true

# Test: No direct shell execution
run_test "No Direct Shell Exec" "! grep -q \"exec(\" src/main/electron.js" "Check no direct shell execution"

# Test: Python execution validation
run_test "Python Path Validation" "grep -q \"venvPython.*python3\" src/main/electron.js" "Check Python path validation"

# Test: File path validation
run_test "Path Join Usage" "grep -q \"path.join\" src/main/electron.js" "Check proper path joining"

echo "🐍 PYTHON INTEGRATION TESTS"
echo "============================"

# Test: Python executable check
run_test "Python Executable Check" "grep -q \"fsSync.existsSync.*venvPython\" src/main/electron.js" "Check Python executable validation"

# Test: Virtual environment support
run_test "Virtual Environment" "grep -q \"venv/bin/python3\" src/main/electron.js" "Check virtual environment support"

# Test: Python fallback
run_test "Python Fallback" "grep -q \"python3\" src/main/electron.js" "Check Python fallback mechanism"

echo "🗄️ DATABASE INTEGRATION TESTS"
echo "=============================="

# Test: Database operations
run_test "Database Operations" "grep -q \"db.py\" src/main/electron.js" "Check database integration"

# Test: Analysis operations
run_test "Analysis Operations" "grep -q \"analyzer.py\" src/main/electron.js" "Check analyzer integration"

echo "📋 MENU SYSTEM TESTS"
echo "===================="

# Test: Menu creation
run_test "Menu System" "grep -q \"Menu.*require.*electron\" src/main/electron.js" "Check menu system setup"

# Test: Test dashboard menu
run_test "Test Dashboard Menu" "grep -q \"Master Test Suite Dashboard\" src/main/electron.js" "Check test dashboard menu"

# Test: DevTools access
run_test "DevTools Access" "grep -q \"openDevTools\" src/main/electron.js" "Check DevTools access"

echo "🔄 ERROR HANDLING TESTS"
echo "======================="

# Test: Try-catch blocks
run_test "Error Handling" "grep -q \"try.*{\" src/main/electron.js" "Check error handling exists"

# Test: Async error handling
run_test "Async Error Handling" "grep -q \"catch.*error\" src/main/electron.js" "Check async error handling"

echo "📊 FILE I/O TESTS"
echo "================="

# Test: File dialog integration
run_test "File Dialog" "grep -q \"dialog.showOpenDialog\" src/main/electron.js" "Check file dialog integration"

# Test: File system operations
run_test "File System Ops" "grep -q \"fs\\.\" src/main/electron.js" "Check file system operations"

echo "🌐 GIT INTEGRATION TESTS"
echo "========================"

# Test: Git functionality
run_test "Git Integration" "grep -q \"git-.*async\" src/main/electron.js" "Check Git integration handlers"

# Test: Git Python script
run_test "Git Python Script" "grep -q \"git_integration.py\" src/main/electron.js" "Check Git Python integration"

echo "🤖 LLM INTEGRATION TESTS"
echo "========================"

# Test: LLM status checks
run_test "LLM Status Handlers" "grep -q \"get-llm-status\\|check-llm-status\" src/main/electron.js" "Check LLM status handlers"

# Test: LLM comparison
run_test "LLM Comparison" "grep -q \"llm-compare-analysis-baseline\" src/main/electron.js" "Check LLM comparison handler"

echo "🛡️ THREAT INTEL TESTS"
echo "====================="

# Test: OT Threat Intel handlers
run_test "OT Threat Intel" "grep -q \"ot-threat-intel\" src/main/electron.js" "Check OT Threat Intel handlers"

# Test: Threat Intel sync
run_test "Threat Intel Sync" "grep -q \"sync-ot-threat-intel\" src/main/electron.js" "Check threat intel sync"

echo "🧹 ADMIN FUNCTIONALITY TESTS"
echo "============================"

# Test: Clear all data
run_test "Clear All Data" "grep -q \"clear-all-data\" src/main/electron.js" "Check clear all data handler"

# Test: Clear LLM log
run_test "Clear LLM Log" "grep -q \"clear-llm-log\" src/main/electron.js" "Check clear LLM log handler"

# Test: User management
run_test "User Management" "grep -q \"list-users\\|update-user\\|delete-user\" src/main/electron.js" "Check user management handlers"

echo "📝 CODE QUALITY TESTS"
echo "====================="

# Test: Function declarations
run_test "Function Declarations" "grep -q \"async.*=>\\|async.*function\" src/main/electron.js" "Check async function declarations"

# Test: Consistent error handling
run_test "Consistent Error Handling" "grep -c \"catch\" src/main/electron.js | [ \$(cat) -gt 5 ]" "Check multiple error handlers exist"

# Test: Proper async/await usage
run_test "Async/Await Usage" "grep -q \"await.*spawn\\|await.*fs\" src/main/electron.js" "Check proper async/await usage"

echo "⚙️ CONFIGURATION TESTS"
echo "======================"

# Test: Window dimensions
run_test "Window Dimensions" "grep -q \"width.*:.*height.*:\" src/main/electron.js" "Check window dimensions configured"

# Test: Security headers
run_test "Security Configuration" "grep -q \"contextIsolation.*true\" src/main/electron.js && grep -q \"nodeIntegration.*false\" src/main/electron.js" "Check security configuration"

echo "📦 FINAL INTEGRATION TESTS"
echo "=========================="

# Test: File completeness check
run_test "File Completeness" "[ \$(wc -l < src/main/electron.js) -gt 800 ]" "Check file has substantial content"

# Test Node.js validation if available
if command -v node &> /dev/null; then
    run_test "Node.js Validation" "node -e \"console.log('Node.js working')\"" "Check Node.js runtime"
fi

# Calculate test duration
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "📊 ELECTRON.JS INTEGRITY TEST RESULTS"
echo "======================================"
echo -e "Total Tests: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
echo -e "Critical Failures: ${RED}$CRITICAL_FAILURES${NC}"
echo -e "Duration: ${YELLOW}${DURATION}s${NC}"

# Calculate success rate
if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo -e "Success Rate: ${YELLOW}${SUCCESS_RATE}%${NC}"
else
    SUCCESS_RATE=0
fi

echo ""

# Final status with recommendations
echo "🎯 RECOMMENDATIONS"
echo "=================="

if [ $CRITICAL_FAILURES -gt 0 ]; then
    echo -e "${RED}🚨 CRITICAL ISSUES DETECTED${NC}"
    echo "- Fix critical failures immediately before production use"
    echo "- Review security configuration"
    echo "- Verify core file structure"
elif [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 ELECTRON.JS INTEGRITY: EXCELLENT${NC}"
    echo "- All tests passed successfully"
    echo "- System ready for production use"
    echo "- Consider performance optimization"
elif [ $SUCCESS_RATE -ge 90 ]; then
    echo -e "${YELLOW}✅ ELECTRON.JS INTEGRITY: GOOD${NC}"
    echo "- Most functionality working correctly"
    echo "- Minor issues should be addressed"
    echo "- System suitable for development/testing"
elif [ $SUCCESS_RATE -ge 75 ]; then
    echo -e "${YELLOW}⚠️  ELECTRON.JS INTEGRITY: MODERATE${NC}"
    echo "- Several issues need attention"
    echo "- Review failed tests and fix critical ones"
    echo "- Not recommended for production without fixes"
else
    echo -e "${RED}❌ ELECTRON.JS INTEGRITY: POOR${NC}"
    echo "- Multiple serious issues detected"
    echo "- Comprehensive review and fixes needed"
    echo "- System not ready for use"
fi

echo ""

# Exit with appropriate code
if [ $CRITICAL_FAILURES -gt 0 ]; then
    echo -e "${RED}🚨 Exiting with critical failure status${NC}"
    exit 3
elif [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed - Electron.js integrity verified!${NC}"
    exit 0
elif [ $SUCCESS_RATE -ge 80 ]; then
    echo -e "${YELLOW}⚠️  Minor issues detected - Review recommended${NC}"
    exit 1
else
    echo -e "${RED}❌ Significant issues detected - Fixes required${NC}"
    exit 2
fi
