#!/bin/bash

# First Watch PLC Code Checker - System-Wide Handler Test Suite
# This script tests all IPC handlers across the entire system

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

# Logging
LOG_FILE="handler-test-results.log"
echo "System-Wide Handler Test Suite - $(date)" > "$LOG_FILE"

# Test tracking (simple arrays for macOS compatibility)
TEST_NAMES=()
TEST_STATUSES=()

print_header() {
    echo -e "${CYAN}============================================${NC}"
    echo -e "${CYAN}🔧 FIRST WATCH PLC CODE CHECKER${NC}"
    echo -e "${CYAN}   SYSTEM-WIDE HANDLER TEST SUITE${NC}"
    echo -e "${CYAN}============================================${NC}"
    echo ""
}

print_section() {
    echo -e "${BLUE}📋 $1${NC}"
    echo -e "${BLUE}$(printf '=%.0s' $(seq 1 ${#1}))${NC}"
}

run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_pattern="$3"
    local description="$4"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -e "${CYAN}[TEST $TOTAL_TESTS]${NC} Testing: $test_name"
    echo -e "   Description: $description"
    echo -e "   Command: $test_command"
    
    if eval "$test_command" 2>&1 | tee -a "$LOG_FILE" | grep -q "$expected_pattern"; then
        echo -e "   Result: ${GREEN}✅ PASSED${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        TEST_NAMES+=("$test_name")
        TEST_STATUSES+=("PASSED")
    else
        echo -e "   Result: ${RED}❌ FAILED${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        TEST_NAMES+=("$test_name")
        TEST_STATUSES+=("FAILED")
    fi
    echo ""
}

run_python_handler_test() {
    local handler_name="$1"
    local args="$2"
    local description="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -e "${CYAN}[TEST $TOTAL_TESTS]${NC} Python Handler: $handler_name"
    echo -e "   Description: $description"
    echo -e "   Args: $args"
    
    # Check if handler exists in electron.js
    if grep -q "$handler_name" src/main/electron.js; then
        echo -e "   Electron Handler: ${GREEN}✅ EXISTS${NC}"
        
        # Test the Python command
        if python3 -c "
import sys
import os
sys.path.append('src/python')
try:
    import db
    result = db.${handler_name//-/_}($args)
    print('Handler result:', result)
    print('SUCCESS')
except Exception as e:
    print('ERROR:', str(e))
    sys.exit(1)
" 2>&1 | tee -a "$LOG_FILE" | grep -q "SUCCESS"; then
            echo -e "   Python Handler: ${GREEN}✅ WORKING${NC}"
            echo -e "   Result: ${GREEN}✅ PASSED${NC}"
            PASSED_TESTS=$((PASSED_TESTS + 1))
            TEST_NAMES+=("$handler_name")
            TEST_STATUSES+=("PASSED")
        else
            echo -e "   Python Handler: ${RED}❌ FAILED${NC}"
            echo -e "   Result: ${RED}❌ FAILED${NC}"
            FAILED_TESTS=$((FAILED_TESTS + 1))
            TEST_NAMES+=("$handler_name")
            TEST_STATUSES+=("FAILED")
        fi
    else
        echo -e "   Electron Handler: ${RED}❌ MISSING${NC}"
        echo -e "   Result: ${YELLOW}⚠️ SKIPPED${NC}"
        SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
        TEST_NAMES+=("$handler_name")
        TEST_STATUSES+=("SKIPPED")
    fi
    echo ""
}

run_handler_existence_test() {
    local handler_name="$1"
    local file_path="$2"
    local description="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -e "${CYAN}[TEST $TOTAL_TESTS]${NC} Handler Existence: $handler_name"
    echo -e "   Description: $description"
    echo -e "   File: $file_path"
    
    if grep -q "$handler_name" "$file_path"; then
        echo -e "   Result: ${GREEN}✅ HANDLER EXISTS${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        TEST_NAMES+=("$handler_name-existence")
        TEST_STATUSES+=("PASSED")
        
        # Check if it's also in preload.js
        if grep -q "$handler_name" src/main/preload.js; then
            echo -e "   Preload: ${GREEN}✅ EXPOSED${NC}"
        else
            echo -e "   Preload: ${YELLOW}⚠️ NOT EXPOSED${NC}"
        fi
    else
        echo -e "   Result: ${RED}❌ HANDLER MISSING${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        TEST_NAMES+=("$handler_name-existence")
        TEST_STATUSES+=("FAILED")
    fi
    echo ""
}

skip_test() {
    local test_name="$1"
    local reason="$2"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
    
    echo -e "${CYAN}[TEST $TOTAL_TESTS]${NC} Testing: $test_name"
    echo -e "   Result: ${YELLOW}⚠️ SKIPPED${NC} - $reason"
    TEST_NAMES+=("$test_name")
    TEST_STATUSES+=("SKIPPED")
    echo ""
}

check_prerequisites() {
    echo -e "${PURPLE}🔍 CHECKING PREREQUISITES${NC}"
    echo -e "${PURPLE}=========================${NC}"
    
    # Check if Electron app is running
    if pgrep -f "electron" > /dev/null; then
        echo -e "✅ Electron app is running"
        APP_RUNNING=true
    else
        echo -e "⚠️ Electron app is not running - some tests will be skipped"
        APP_RUNNING=false
    fi
    
    # Check Python dependencies
    if python3 -c "import sys; sys.path.append('src/python'); import db" 2>/dev/null; then
        echo -e "✅ Python database module available"
        PYTHON_DB_AVAILABLE=true
    else
        echo -e "⚠️ Python database module not available"
        PYTHON_DB_AVAILABLE=false
    fi
    
    # Check files
    if [ -f "src/main/electron.js" ]; then
        echo -e "✅ Electron main file found"
        ELECTRON_FILE_EXISTS=true
    else
        echo -e "❌ Electron main file not found"
        ELECTRON_FILE_EXISTS=false
    fi
    
    if [ -f "src/main/preload.js" ]; then
        echo -e "✅ Preload file found"
        PRELOAD_FILE_EXISTS=true
    else
        echo -e "❌ Preload file not found"
        PRELOAD_FILE_EXISTS=false
    fi
    
    echo ""
}

test_core_analysis_handlers() {
    print_section "CORE ANALYSIS HANDLERS"
    
    run_handler_existence_test "analyze-file" "src/main/electron.js" "File analysis handler"
    run_handler_existence_test "save-analysis" "src/main/electron.js" "Save analysis handler"
    run_handler_existence_test "delete-analysis" "src/main/electron.js" "Delete analysis handler"
    run_handler_existence_test "get-analysis" "src/main/electron.js" "Get single analysis handler"
    run_handler_existence_test "get-analyses" "src/main/electron.js" "Get all analyses handler"
    run_handler_existence_test "list-analyses" "src/main/electron.js" "List analyses handler"
}

test_baseline_handlers() {
    print_section "BASELINE HANDLERS"
    
    run_handler_existence_test "save-baseline" "src/main/electron.js" "Save baseline handler"
    run_handler_existence_test "delete-baseline" "src/main/electron.js" "Delete baseline handler"
    run_handler_existence_test "get-baseline" "src/main/electron.js" "Get single baseline handler"
    run_handler_existence_test "list-baselines" "src/main/electron.js" "List baselines handler"
}

test_authentication_handlers() {
    print_section "AUTHENTICATION HANDLERS"
    
    run_handler_existence_test "login" "src/main/electron.js" "Login handler"
    run_handler_existence_test "authenticate-user" "src/main/electron.js" "User authentication handler"
    run_handler_existence_test "register-user" "src/main/electron.js" "User registration handler"
    run_handler_existence_test "create-session" "src/main/electron.js" "Session creation handler"
    run_handler_existence_test "validate-session" "src/main/electron.js" "Session validation handler"
    run_handler_existence_test "logout-session" "src/main/electron.js" "Logout session handler"
}

test_user_management_handlers() {
    print_section "USER MANAGEMENT HANDLERS"
    
    run_handler_existence_test "list-users" "src/main/electron.js" "List users handler"
    run_handler_existence_test "update-user" "src/main/electron.js" "Update user handler"
    run_handler_existence_test "delete-user" "src/main/electron.js" "Delete user handler"
    run_handler_existence_test "toggle-user-status" "src/main/electron.js" "Toggle user status handler"
    run_handler_existence_test "reset-user-password" "src/main/electron.js" "Reset user password handler"
}

test_git_handlers() {
    print_section "GIT INTEGRATION HANDLERS"
    
    run_handler_existence_test "git-connect-repository" "src/main/electron.js" "Git connect repository handler"
    run_handler_existence_test "git-get-branches" "src/main/electron.js" "Git get branches handler"
    run_handler_existence_test "git-get-remote-branches" "src/main/electron.js" "Git get remote branches handler"
    run_handler_existence_test "git-clone-repository" "src/main/electron.js" "Git clone repository handler"
    run_handler_existence_test "git-checkout-branch" "src/main/electron.js" "Git checkout branch handler"
    run_handler_existence_test "git-get-status" "src/main/electron.js" "Git get status handler"
    run_handler_existence_test "git-get-files" "src/main/electron.js" "Git get files handler"
    run_handler_existence_test "git-commit-file" "src/main/electron.js" "Git commit file handler"
    run_handler_existence_test "git-push-to-remote" "src/main/electron.js" "Git push to remote handler"
    run_handler_existence_test "git-copy-file-from-branch" "src/main/electron.js" "Git copy file from branch handler"
    run_handler_existence_test "git-analyze-file" "src/main/electron.js" "Git analyze file handler"
}

test_ot_threat_intel_handlers() {
    print_section "OT THREAT INTELLIGENCE HANDLERS"
    
    run_handler_existence_test "get-ot-threat-intel-entries" "src/main/electron.js" "Get OT threat intel entries handler"
    run_handler_existence_test "get-ot-threat-intel-last-sync" "src/main/electron.js" "Get OT threat intel last sync handler"
    run_handler_existence_test "sync-ot-threat-intel" "src/main/electron.js" "Sync OT threat intel handler"
    run_handler_existence_test "update-ot-threat-intel-entry" "src/main/electron.js" "Update OT threat intel entry handler"
    run_handler_existence_test "clear-ot-threat-intel" "src/main/electron.js" "Clear OT threat intel handler"
    run_handler_existence_test "bulk-ot-threat-intel" "src/main/electron.js" "Bulk OT threat intel handler"
}

test_comparison_handlers() {
    print_section "COMPARISON HANDLERS"
    
    run_handler_existence_test "get-saved-comparisons" "src/main/electron.js" "Get saved comparisons handler"
    run_handler_existence_test "save-comparison-result" "src/main/electron.js" "Save comparison result handler"
    run_handler_existence_test "delete-comparison-result" "src/main/electron.js" "Delete comparison result handler"
    run_handler_existence_test "llm-compare-analysis-baseline" "src/main/electron.js" "LLM compare analysis baseline handler"
}

test_system_handlers() {
    print_section "SYSTEM HANDLERS"
    
    run_handler_existence_test "show-directory-picker" "src/main/electron.js" "Show directory picker handler"
    run_handler_existence_test "get-home-directory" "src/main/electron.js" "Get home directory handler"
    run_handler_existence_test "get-llm-status" "src/main/electron.js" "Get LLM status handler"
    run_handler_existence_test "check-llm-status" "src/main/electron.js" "Check LLM status handler"
    run_handler_existence_test "get-llm-logs" "src/main/electron.js" "Get LLM logs handler"
}

test_development_handlers() {
    print_section "DEVELOPMENT HANDLERS"
    
    run_handler_existence_test "open-test-dashboard" "src/main/electron.js" "Open test dashboard handler"
    run_handler_existence_test "open-dev-tools" "src/main/electron.js" "Open dev tools handler"
}

test_python_backend_handlers() {
    print_section "PYTHON BACKEND HANDLERS"
    
    if [ "$PYTHON_DB_AVAILABLE" = true ]; then
        # Test core database functions
        run_test "Python Database Init" "python3 -c 'import sys; sys.path.append(\"src/python\"); import db; db.init_database(); print(\"SUCCESS\")'" "SUCCESS" "Initialize database"
        
        # Test analysis functions
        run_test "Python Get All Analyses" "python3 -c 'import sys; sys.path.append(\"src/python\"); import db; result = db.get_all_analyses(); print(\"SUCCESS\")'" "SUCCESS" "Get all analyses from database"
        
        # Test baseline functions
        run_test "Python Get All Baselines" "python3 -c 'import sys; sys.path.append(\"src/python\"); import db; result = db.get_all_baselines(); print(\"SUCCESS\")'" "SUCCESS" "Get all baselines from database"
        
        # Test OT threat intel functions
        run_test "Python OT Threat Intel List" "python3 -c 'import sys; sys.path.append(\"src/python\"); import db; result = db.list_ot_threat_intel(); print(\"SUCCESS\")'" "SUCCESS" "List OT threat intelligence entries"
        
        # Test comparison functions
        run_test "Python List Comparisons" "python3 -c 'import sys; sys.path.append(\"src/python\"); import db; result = db.list_comparison_history(); print(\"SUCCESS\")'" "SUCCESS" "List comparison history"
        
        # Test user management functions
        run_test "Python List Users" "python3 -c 'import sys; sys.path.append(\"src/python\"); import db; result = db.list_users(); print(\"SUCCESS\")'" "SUCCESS" "List users from database"
    else
        skip_test "Python Backend Handlers" "Python database module not available"
    fi
}

test_preload_api_exposure() {
    print_section "PRELOAD API EXPOSURE"
    
    if [ "$PRELOAD_FILE_EXISTS" = true ]; then
        # Check if critical APIs are exposed
        run_test "Preload Analysis APIs" "grep -q 'analyzeFile\\|saveAnalysis\\|deleteAnalysis' src/main/preload.js" "analyzeFile" "Analysis APIs exposed in preload"
        run_test "Preload Git APIs" "grep -q 'gitCloneRepository\\|gitGetBranches' src/main/preload.js" "git" "Git APIs exposed in preload"
        run_test "Preload Auth APIs" "grep -q 'authenticateUser\\|registerUser' src/main/preload.js" "authenticateUser" "Authentication APIs exposed in preload"
        run_test "Preload OT Threat Intel APIs" "grep -q 'getOTThreatIntelEntries\\|syncOTThreatIntel' src/main/preload.js" "getOTThreatIntelEntries" "OT Threat Intel APIs exposed in preload"
        run_test "Preload System APIs" "grep -q 'showDirectoryPicker\\|getHomeDirectory' src/main/preload.js" "showDirectoryPicker" "System APIs exposed in preload"
    else
        skip_test "Preload API Exposure" "Preload file not found"
    fi
}

test_handler_consistency() {
    print_section "HANDLER CONSISTENCY CHECKS"
    
    if [ "$ELECTRON_FILE_EXISTS" = true ] && [ "$PRELOAD_FILE_EXISTS" = true ]; then
        # Extract handler names from electron.js
        local electron_handlers=$(grep -o "ipcMain.handle('[^']*'" src/main/electron.js | sed "s/ipcMain.handle('//g" | sed "s/'//g" | sort)
        local preload_handlers=$(grep -o "ipcRenderer.invoke('[^']*'" src/main/preload.js | sed "s/ipcRenderer.invoke('//g" | sed "s/'//g" | sort)
        
        # Check for handlers in electron.js but not in preload.js
        local missing_in_preload=0
        for handler in $electron_handlers; do
            if ! echo "$preload_handlers" | grep -q "^$handler$"; then
                echo -e "   ${YELLOW}⚠️ Handler '$handler' exists in electron.js but not exposed in preload.js${NC}"
                missing_in_preload=$((missing_in_preload + 1))
            fi
        done
        
        # Check for handlers in preload.js but not in electron.js
        local missing_in_electron=0
        for handler in $preload_handlers; do
            if ! echo "$electron_handlers" | grep -q "^$handler$"; then
                echo -e "   ${YELLOW}⚠️ Handler '$handler' exposed in preload.js but not defined in electron.js${NC}"
                missing_in_electron=$((missing_in_electron + 1))
            fi
        done
        
        if [ $missing_in_preload -eq 0 ] && [ $missing_in_electron -eq 0 ]; then
            echo -e "   ${GREEN}✅ All handlers are consistently defined and exposed${NC}"
            PASSED_TESTS=$((PASSED_TESTS + 1))
            TEST_NAMES+=("handler-consistency")
            TEST_STATUSES+=("PASSED")
        else
            echo -e "   ${RED}❌ Found $missing_in_preload missing in preload, $missing_in_electron missing in electron${NC}"
            FAILED_TESTS=$((FAILED_TESTS + 1))
            TEST_NAMES+=("handler-consistency")
            TEST_STATUSES+=("FAILED")
        fi
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
    else
        skip_test "Handler Consistency" "Required files not found"
    fi
    echo ""
}

generate_summary() {
    print_section "TEST RESULTS SUMMARY"
    
    echo -e "${CYAN}Total Tests:${NC} $TOTAL_TESTS"
    echo -e "${GREEN}Passed:${NC} $PASSED_TESTS"
    echo -e "${RED}Failed:${NC} $FAILED_TESTS"
    echo -e "${YELLOW}Skipped:${NC} $SKIPPED_TESTS"
    
    if [ $TOTAL_TESTS -gt 0 ]; then
        local success_rate=$((PASSED_TESTS * 100 / TOTAL_TESTS))
        echo -e "${CYAN}Success Rate:${NC} $success_rate%"
    fi
    
    echo ""
    
    # Generate detailed results
    echo -e "${BLUE}📊 DETAILED RESULTS${NC}"
    echo -e "${BLUE}==================${NC}"
    
    echo -e "${GREEN}✅ PASSED TESTS:${NC}"
    for i in "${!TEST_NAMES[@]}"; do
        if [ "${TEST_STATUSES[$i]}" = "PASSED" ]; then
            echo -e "   • ${TEST_NAMES[$i]}"
        fi
    done
    
    if [ $FAILED_TESTS -gt 0 ]; then
        echo -e "${RED}❌ FAILED TESTS:${NC}"
        for i in "${!TEST_NAMES[@]}"; do
            if [ "${TEST_STATUSES[$i]}" = "FAILED" ]; then
                echo -e "   • ${TEST_NAMES[$i]}"
            fi
        done
    fi
    
    if [ $SKIPPED_TESTS -gt 0 ]; then
        echo -e "${YELLOW}⚠️ SKIPPED TESTS:${NC}"
        for i in "${!TEST_NAMES[@]}"; do
            if [ "${TEST_STATUSES[$i]}" = "SKIPPED" ]; then
                echo -e "   • ${TEST_NAMES[$i]}"
            fi
        done
    fi
    
    echo ""
    echo -e "${CYAN}📝 Detailed log saved to: $LOG_FILE${NC}"
    
    # Overall status
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}🎉 ALL CRITICAL TESTS PASSED!${NC}"
        echo -e "${GREEN}The system handlers are working correctly.${NC}"
        return 0
    else
        echo -e "${RED}⚠️ Some tests failed. Review the results above.${NC}"
        return 1
    fi
}

# Main execution
main() {
    print_header
    check_prerequisites
    
    # Run all test suites
    test_core_analysis_handlers
    test_baseline_handlers
    test_authentication_handlers
    test_user_management_handlers
    test_git_handlers
    test_ot_threat_intel_handlers
    test_comparison_handlers
    test_system_handlers
    test_development_handlers
    test_python_backend_handlers
    test_preload_api_exposure
    test_handler_consistency
    
    # Generate summary and exit with appropriate code
    generate_summary
    exit $?
}

# Run the test suite
main "$@"
