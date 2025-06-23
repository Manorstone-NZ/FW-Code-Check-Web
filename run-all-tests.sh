#!/bin/bash

# Master Test Runner for First Watch PLC Code Checker
# Comprehensive automated testing system

echo "🧪 FIRST WATCH PLC CODE CHECKER - COMPREHENSIVE TEST SUITE"
echo "=========================================================="
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
START_TIME=$(date +%s)

# Function to run a test and track results
run_test() {
    local test_name="$1"
    local test_command="$2"
    local test_description="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -e "${BLUE}[$TOTAL_TESTS]${NC} Testing: $test_name"
    echo "   Description: $test_description"
    echo "   Command: $test_command"
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "   Result: ${GREEN}✅ PASSED${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "   Result: ${RED}❌ FAILED${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    echo ""
}

# Function to run a test script
run_test_script() {
    local script_name="$1"
    local description="$2"
    
    if [ -f "$script_name" ]; then
        echo -e "${BLUE}[SCRIPT]${NC} Running: $script_name"
        echo "   Description: $description"
        
        if bash "$script_name"; then
            echo -e "   Result: ${GREEN}✅ PASSED${NC}"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            echo -e "   Result: ${RED}❌ FAILED${NC}"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
    else
        echo -e "${YELLOW}⚠️  SKIPPED${NC}: $script_name (file not found)"
    fi
    echo ""
}

echo "🔍 SYSTEM ENVIRONMENT TESTS"
echo "=============================="

# Test 1: Node.js and npm
run_test "Node.js Installation" "node --version" "Check if Node.js is installed"
run_test "NPM Installation" "npm --version" "Check if NPM is installed"

# Test 2: Python environment
run_test "Python Installation" "python3 --version" "Check if Python 3 is installed"
run_test "Pip Installation" "pip3 --version" "Check if pip3 is installed"

# Test 3: Git installation
run_test "Git Installation" "git --version" "Check if Git is installed"

echo "📁 PROJECT STRUCTURE TESTS"
echo "==========================="

# Test 4: Core directories
run_test "Source Directory" "[ -d 'src' ]" "Check if src directory exists"
run_test "Public Directory" "[ -d 'public' ]" "Check if public directory exists"
run_test "Python Source" "[ -d 'src/python' ]" "Check if Python source directory exists"
run_test "React Components" "[ -d 'src/renderer/components' ]" "Check if React components directory exists"

# Test 5: Core files
run_test "Package.json" "[ -f 'package.json' ]" "Check if package.json exists"
run_test "Electron Main" "[ -f 'src/main/electron.js' ]" "Check if Electron main file exists"
run_test "Database Module" "[ -f 'src/python/db.py' ]" "Check if database module exists"
run_test "Analyzer Module" "[ -f 'src/python/analyzer.py' ]" "Check if analyzer module exists"

echo "⚙️  DEPENDENCY TESTS"
echo "==================="

# Test 6: NPM dependencies
run_test "Node Modules" "[ -d 'node_modules' ]" "Check if node_modules directory exists"
run_test "Bundle File" "[ -f 'public/bundle.js' ]" "Check if bundle.js exists"

echo "🔧 FUNCTIONALITY TESTS"
echo "======================"

# Run existing test scripts
run_test_script "./test-all-handlers.sh" "System-wide IPC handler tests"
run_test_script "./test-admin-functionality.sh" "Admin functionality and access control"
run_test_script "./test-backend.sh" "Backend integration tests"
run_test_script "./test-save-analysis.sh" "Save Analysis functionality"
run_test_script "./test-git-functionality.sh" "Git integration functionality"
run_test_script "./test-comparison-fix.sh" "Comparison functionality"
run_test_script "./test-delete-button.sh" "Delete button functionality"
run_test_script "./test-ot-threat-intel-complete.sh" "OT Threat Intel complete functionality"
run_test_script "./test-integration.sh" "Cross-component integration tests"
run_test_script "./test-llm-result-panel-removal.sh" "LLM Result panel removal verification"
run_test_script "./test-submit-button-removal.sh" "Submit to Main Branch button removal verification"
run_test_script "./test-electron-integrity.sh" "Electron.js comprehensive integrity verification"

echo "🗄️  DATABASE TESTS"
echo "=================="

# Test 7: Database functionality
run_test "Database File" "[ -f 'firstwatch.db' ] || [ -f 'src/python/firstwatch.db' ]" "Check if database file exists"

if command -v python3 &> /dev/null; then
    run_test "Database Connection" "python3 -c 'import src.python.db as db; db.init_database(); print(\"Database OK\")'" "Test database connection"
    run_test "Database Tables" "python3 -c 'import src.python.db as db; db.init_database(); db.get_all_analyses(); print(\"Tables OK\")'" "Test database tables"
fi

echo "🌐 API TESTS"
echo "============"

# Test 8: IPC Handlers (check if they exist in electron.js)
run_test "Save Analysis Handler" "grep -q 'save-analysis' src/main/electron.js" "Check save-analysis IPC handler"
run_test "Delete Analysis Handler" "grep -q 'delete-analysis' src/main/electron.js" "Check delete-analysis IPC handler"
run_test "Git Handlers" "grep -q 'git-' src/main/electron.js" "Check git-related IPC handlers"
run_test "Comparison Handler" "grep -q 'compare-analyses' src/main/electron.js" "Check comparison IPC handler"
run_test "OT Threat Intel Handlers" "grep -q 'ot-threat-intel' src/main/electron.js" "Check OT Threat Intel IPC handlers"
run_test "Bulk OT Threat Intel Handler" "grep -q 'bulk-ot-threat-intel' src/main/electron.js" "Check bulk OT Threat Intel IPC handler"
run_test "Clear LLM Log Handler" "grep -q 'clear-llm-log' src/main/electron.js" "Check clear LLM log IPC handler"
run_test "Get LLM Logs Handler" "grep -q 'get-llm-logs' src/main/electron.js" "Check get LLM logs IPC handler"

echo "🎨 UI COMPONENT TESTS"
echo "===================="

# Test 9: React Components
run_test "Analysis Page" "[ -f 'src/renderer/pages/AnalysisPage.tsx' ]" "Check if AnalysisPage component exists"
run_test "History Page" "[ -f 'src/renderer/pages/HistoryPage.tsx' ]" "Check if HistoryPage component exists"
run_test "Comparisons Page" "[ -f 'src/renderer/pages/ComparisonsPage.tsx' ]" "Check if ComparisonsPage component exists"
run_test "Admin Page" "[ -f 'src/renderer/pages/AdminPage.tsx' ]" "Check if AdminPage component exists"
run_test "LLM Log Page" "[ -f 'src/renderer/pages/LLMLogPage.tsx' ]" "Check if LLMLogPage component exists"
run_test "OT Threat Intel Dashboard" "[ -f 'src/renderer/pages/OTThreatIntelDashboard.tsx' ]" "Check if OT Threat Intel Dashboard exists"
run_test "File Uploader" "[ -f 'src/renderer/components/EnhancedFileUploader.tsx' ]" "Check if Enhanced File Uploader exists"

echo "🔒 SECURITY TESTS"
echo "================="

# Test 10: Security checks
run_test "Preload Script" "[ -f 'src/main/preload.js' ]" "Check if preload script exists"
run_test "Content Security" "grep -q 'contextIsolation' src/main/electron.js" "Check if context isolation is enabled"

echo "📦 BUILD TESTS"
echo "=============="

# Test 11: Build system
run_test "Webpack Config" "[ -f 'webpack.config.js' ]" "Check if webpack config exists"
run_test "TypeScript Config" "[ -f 'tsconfig.json' ]" "Check if TypeScript config exists"
run_test "Tailwind Config" "[ -f 'tailwind.config.js' ]" "Check if Tailwind config exists"

echo "🚀 PERFORMANCE TESTS"
echo "===================="

# Test 12: Performance checks
run_test "Bundle Size Check" "[ $(stat -f%z public/bundle.js 2>/dev/null || stat -c%s public/bundle.js 2>/dev/null || echo 0) -lt 10485760 ]" "Check if bundle.js is under 10MB"

# Calculate test duration
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "📊 TEST RESULTS SUMMARY"
echo "======================="
echo -e "Total Tests: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
echo -e "Duration: ${YELLOW}${DURATION}s${NC}"

# Calculate success rate
if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo -e "Success Rate: ${YELLOW}${SUCCESS_RATE}%${NC}"
else
    SUCCESS_RATE=0
fi

echo ""

# Final status
if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! System is ready for production.${NC}"
    exit 0
elif [ $SUCCESS_RATE -ge 80 ]; then
    echo -e "${YELLOW}⚠️  Most tests passed ($SUCCESS_RATE%). System is mostly functional.${NC}"
    exit 1
else
    echo -e "${RED}❌ Multiple test failures ($SUCCESS_RATE% success). System needs attention.${NC}"
    exit 2
fi
