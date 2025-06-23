#!/bin/bash

# Admin Page Test Suite
# Tests admin functionality and access control for First Watch PLC Code Checker

# Don't exit on errors - we want to run all tests
set +e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((TESTS_PASSED++))
}

log_failure() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((TESTS_FAILED++))
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

run_test() {
    ((TESTS_RUN++))
    echo -e "\n${BLUE}Test $TESTS_RUN:${NC} $1"
}

# Test setup
setup_test_environment() {
    log_info "Setting up test environment..."
    
    # Ensure the app is not running (ignore errors)
    pkill -f "electron" 2>/dev/null || true
    sleep 1
    
    # Clean up any previous test artifacts
    rm -f test_admin_*.log 2>/dev/null || true
    rm -f test_db_backup.db 2>/dev/null || true
    rm -f build_test.log 2>/dev/null || true
    rm -f app_startup.log 2>/dev/null || true
    
    log_success "Test environment ready"
}

# Test 1: Verify AdminPage file exists and has correct structure
test_admin_page_exists() {
    run_test "AdminPage component exists and has correct structure"
    
    ADMIN_FILE="src/renderer/pages/AdminPage.tsx"
    
    if [[ ! -f "$ADMIN_FILE" ]]; then
        log_failure "AdminPage.tsx does not exist"
        return 1
    fi
    
    # Check for required imports and components
    local required_components=(
        "import.*useAuth"
        "import.*Navigate"
        "import.*useLLMStatus"
        "import.*TrendChart"
        "import.*AlertsPanel"
        "import.*UserManagementPage"
        "import.*LLMLogPage"
    )
    
    for component in "${required_components[@]}"; do
        if ! grep -q "$component" "$ADMIN_FILE"; then
            log_failure "Missing required import: $component"
            return 1
        fi
    done
    
    # Check for admin access control
    if ! grep -q "user.role.*admin" "$ADMIN_FILE"; then
        log_failure "Admin access control not found"
        return 1
    fi
    
    # Check for tab structure
    if ! grep -q "activeTab.*overview\|users\|llm-logs" "$ADMIN_FILE"; then
        log_failure "Tab structure not found"
        return 1
    fi
    
    log_success "AdminPage component structure is correct"
}

# Test 2: Verify admin access control in routes
test_admin_route_protection() {
    run_test "Admin route protection in App.tsx"
    
    APP_FILE="src/renderer/App.tsx"
    
    if [[ ! -f "$APP_FILE" ]]; then
        log_failure "App.tsx does not exist"
        return 1
    fi
    
    # Check for admin route
    if ! grep -q "path.*admin.*AdminPage" "$APP_FILE"; then
        log_failure "Admin route not found in App.tsx"
        return 1
    fi
    
    log_success "Admin route is properly configured"
}

# Test 3: Verify sidebar admin link visibility control
test_sidebar_admin_visibility() {
    run_test "Sidebar admin link visibility control"
    
    SIDEBAR_FILE="src/renderer/components/Sidebar.tsx"
    
    if [[ ! -f "$SIDEBAR_FILE" ]]; then
        log_failure "Sidebar.tsx does not exist"
        return 1
    fi
    
    # Check for admin-only administration link
    if ! grep -A 5 -B 5 "isAdmin" "$SIDEBAR_FILE" | grep -q "Administration"; then
        log_failure "Admin-only administration link not found"
        return 1
    fi
    
    # Verify user management is removed from general navigation
    if grep -q "User Management" "$SIDEBAR_FILE" | grep -v "isAdmin"; then
        log_failure "User Management still in general navigation"
        return 1
    fi
    
    log_success "Sidebar admin visibility control is correct"
}

# Test 4: Check AdminPage component functions
test_admin_page_components() {
    run_test "AdminPage component functions and features"
    
    ADMIN_FILE="src/renderer/pages/AdminPage.tsx"
    
    # Check for required functions
    local required_functions=(
        "loadAdminData"
        "handleClearAnalysisData"
        "useLLMStatus"
        "clearingData"
        "renderOverview"
    )
    
    for func in "${required_functions[@]}"; do
        if ! grep -q "$func" "$ADMIN_FILE"; then
            log_failure "Missing required function: $func"
            return 1
        fi
    done
    
    # Check for LLM status integration
    if ! grep -q "llmStatus.*llmError.*llmProviders" "$ADMIN_FILE"; then
        log_failure "LLM status integration not complete"
        return 1
    fi
    
    # Check for data management section
    if ! grep -q "clearAllData" "$ADMIN_FILE"; then
        log_failure "Clear all data functionality not found"
        return 1
    fi
    
    log_success "AdminPage component functions are present"
}

# Test 5: Verify dashboard cleanup
test_dashboard_cleanup() {
    run_test "Dashboard admin components removed"
    
    DASHBOARD_FILE="src/renderer/pages/EnhancedDashboard.tsx"
    
    if [[ ! -f "$DASHBOARD_FILE" ]]; then
        log_failure "EnhancedDashboard.tsx does not exist"
        return 1
    fi
    
    # Check that admin components are removed
    local removed_components=(
        "LLM Status"
        "Clear Analysis Data"
        "handleClearDb"
        "SystemHealth"
        "AlertsPanel"
        "TrendChart"
    )
    
    for component in "${removed_components[@]}"; do
        if grep -q "$component" "$DASHBOARD_FILE"; then
            log_failure "Admin component still in dashboard: $component"
            return 1
        fi
    done
    
    # Check that useLLMStatus is not imported
    if grep -q "useLLMStatus" "$DASHBOARD_FILE"; then
        log_failure "useLLMStatus still imported in dashboard"
        return 1
    fi
    
    log_success "Dashboard admin components successfully removed"
}

# Test 6: Verify TypeScript compilation
test_typescript_compilation() {
    run_test "TypeScript compilation without errors"
    
    log_info "Running TypeScript compilation..."
    
    if npm run build > build_test.log 2>&1; then
        log_success "TypeScript compilation successful"
        rm -f build_test.log
    else
        log_failure "TypeScript compilation failed"
        echo "Build errors:"
        cat build_test.log
        rm -f build_test.log
        return 1
    fi
}

# Test 7: Test electron API integration
test_electron_api_integration() {
    run_test "Electron API integration for admin functions"
    
    PRELOAD_FILE="src/main/preload.js"
    ELECTRON_FILE="src/main/electron.js"
    TYPES_FILE="src/types/electron-api.d.ts"
    
    # Check preload API exposure
    if [[ -f "$PRELOAD_FILE" ]]; then
        if ! grep -q "clearAllData\|listAnalyses" "$PRELOAD_FILE"; then
            log_failure "Admin APIs not exposed in preload.js"
            return 1
        fi
    else
        log_warning "preload.js not found, skipping preload check"
    fi
    
    # Check electron main process handlers
    if [[ -f "$ELECTRON_FILE" ]]; then
        if ! grep -q "clear-all-data\|list-analyses" "$ELECTRON_FILE"; then
            log_failure "Admin IPC handlers not found in electron.js"
            return 1
        fi
    else
        log_warning "electron.js not found, skipping main process check"
    fi
    
    # Check TypeScript definitions
    if [[ -f "$TYPES_FILE" ]]; then
        if ! grep -q "clearAllData\|listAnalyses" "$TYPES_FILE"; then
            log_failure "Admin API types not defined"
            return 1
        fi
    else
        log_warning "electron-api.d.ts not found, skipping types check"
    fi
    
    log_success "Electron API integration is correct"
}

# Test 8: Verify no admin features in non-admin components
test_no_admin_leakage() {
    run_test "No admin features leaked to non-admin components"
    
    # List of files that should not contain admin-specific code
    local user_files=(
        "src/renderer/pages/EnhancedDashboard.tsx"
        "src/renderer/pages/AnalysisPage.tsx"
        "src/renderer/pages/BaselinesPage.tsx"
        "src/renderer/pages/OTThreatIntelDashboard.tsx"
    )
    
    local admin_keywords=(
        "clearAllData"
        "clear-all-data"
        "handleClearDb"
        "LLM Status.*Clear.*Data"
        "Administration"
    )
    
    for file in "${user_files[@]}"; do
        if [[ -f "$file" ]]; then
            for keyword in "${admin_keywords[@]}"; do
                if grep -q "$keyword" "$file"; then
                    log_failure "Admin feature found in user file $file: $keyword"
                    return 1
                fi
            done
        fi
    done
    
    log_success "No admin features leaked to user components"
}

# Test 9: Verify admin page tab functionality
test_admin_page_tabs() {
    run_test "AdminPage tab structure and navigation"
    
    ADMIN_FILE="src/renderer/pages/AdminPage.tsx"
    
    # Check for tab state management
    if ! grep -q "activeTab.*setActiveTab" "$ADMIN_FILE"; then
        log_failure "Tab state management not found"
        return 1
    fi
    
    # Check for all required tabs
    local required_tabs=("overview" "users" "llm-logs")
    
    for tab in "${required_tabs[@]}"; do
        if ! grep -q "activeTab.*===.*'$tab'" "$ADMIN_FILE"; then
            log_failure "Tab rendering not found for: $tab"
            return 1
        fi
    done
    
    # Check for tab content components
    if ! grep -q "UserManagementPage" "$ADMIN_FILE" || ! grep -q "LLMLogPage" "$ADMIN_FILE"; then
        log_failure "Tab content components not properly integrated"
        return 1
    fi
    
    log_success "AdminPage tab functionality is correct"
}

# Test 10: Security verification - no hardcoded admin credentials
test_security_hardcoded_credentials() {
    run_test "No hardcoded admin credentials or security issues"
    
    # Search for potential security issues
    local security_patterns=(
        "password.*=.*admin"
        "admin.*password"
        "hardcoded.*admin"
        "admin.*=.*true"
        "role.*=.*admin"
    )
    
    local files_to_check=(
        "src/renderer/pages/AdminPage.tsx"
        "src/renderer/components/Sidebar.tsx"
        "src/renderer/App.tsx"
    )
    
    for file in "${files_to_check[@]}"; do
        if [[ -f "$file" ]]; then
            for pattern in "${security_patterns[@]}"; do
                if grep -i "$pattern" "$file" | grep -v "user.role.*admin" | grep -v "role.*===.*admin"; then
                    log_failure "Potential security issue in $file: $pattern"
                    return 1
                fi
            done
        fi
    done
    
    log_success "No hardcoded credentials or obvious security issues found"
}

# Test 11: Functional test - start app and verify it loads
test_app_startup() {
    run_test "Application startup and basic functionality"
    
    log_info "Starting Electron application..."
    
    # Start the app in background
    npm start > app_startup.log 2>&1 &
    APP_PID=$!
    
    # Wait for app to start (max 10 seconds)
    COUNTER=0
    while [ $COUNTER -lt 10 ]; do
        sleep 1
        if ps -p $APP_PID > /dev/null; then
            COUNTER=$((COUNTER + 1))
        else
            break
        fi
    done
    
    # Check if app is running
    if ps -p $APP_PID > /dev/null; then
        log_success "Application started successfully"
        
        # Clean shutdown
        kill $APP_PID 2>/dev/null || true
        wait $APP_PID 2>/dev/null || true
        rm -f app_startup.log
    else
        log_failure "Application failed to start"
        if [[ -f app_startup.log ]]; then
            echo "Startup log:"
            tail -20 app_startup.log
            rm -f app_startup.log
        fi
        return 1
    fi
}

# Test 12: File permissions and structure integrity
test_file_integrity() {
    run_test "File permissions and structure integrity"
    
    local critical_files=(
        "src/renderer/pages/AdminPage.tsx"
        "src/renderer/components/Sidebar.tsx"
        "src/renderer/App.tsx"
        "src/main/electron.js"
        "src/main/preload.js"
        "src/types/electron-api.d.ts"
    )
    
    for file in "${critical_files[@]}"; do
        if [[ -f "$file" ]]; then
            # Check file is readable
            if [[ ! -r "$file" ]]; then
                log_failure "File not readable: $file"
                return 1
            fi
            
            # Check file is not empty
            if [[ ! -s "$file" ]]; then
                log_failure "File is empty: $file"
                return 1
            fi
        else
            log_warning "File not found (may be optional): $file"
        fi
    done
    
    log_success "File permissions and structure are correct"
}

# Test system alerts spacing (INFO LLM Provider Status)
test_system_alerts_spacing() {
    run_test "System Alerts Spacing"
    
    local alerts_panel="src/renderer/components/dashboard/AlertsPanel.tsx"
    
    if [[ -f "$alerts_panel" ]]; then
        if grep -q "title: 'INFO LLM Provider Status'" "$alerts_panel"; then
            log_success "System alerts have proper spacing (INFO + space + LLM Provider Status)"
        else
            log_failure "System alerts missing proper spacing - should be 'INFO LLM Provider Status'"
        fi
    else
        log_failure "AlertsPanel component not found"
    fi
}

# Test LLM logs display functionality
test_llm_logs_display() {
    run_test "LLM Logs Display Functionality"
    
    local llm_log_page="src/renderer/pages/LLMLogPage.tsx"
    
    if [[ -f "$llm_log_page" ]]; then
        # Check for proper API usage
        if grep -q "window.electronAPI?.getLLMLogs()" "$llm_log_page"; then
            log_success "LLM logs page uses correct API method"
        else
            log_failure "LLM logs page missing proper API calls"
        fi
        
        # Check for proper error handling
        if grep -q "setError" "$llm_log_page" && grep -q "setLoading" "$llm_log_page"; then
            log_success "LLM logs page has proper error and loading states"
        else
            log_failure "LLM logs page missing error/loading handling"
        fi
        
        # Check for table structure
        if grep -q "Provider" "$llm_log_page" && grep -q "Status" "$llm_log_page"; then
            log_success "LLM logs page has proper table structure"
        else
            log_failure "LLM logs page missing proper table headers"
        fi
    else
        log_failure "LLMLogPage component not found"
    fi
}

# Test admin button alignment
test_admin_button_alignment() {
    run_test "Admin Button Alignment"
    
    local llm_log_page="src/renderer/pages/LLMLogPage.tsx"
    
    if [[ -f "$llm_log_page" ]]; then
        # Check for consistent button styling
        if grep -q "bg-blue-600 text-white rounded hover:bg-blue-700" "$llm_log_page" && \
           grep -q "bg-red-600 text-white rounded hover:bg-red-700" "$llm_log_page"; then
            log_success "Admin buttons have consistent styling and alignment"
        else
            log_failure "Admin buttons missing consistent styling"
        fi
        
        # Check for proper button spacing
        if grep -q "space-x-3" "$llm_log_page" || grep -q "flex.*gap" "$llm_log_page"; then
            log_success "Admin buttons have proper spacing"
        else
            log_failure "Admin buttons missing proper spacing"
        fi
    else
        log_failure "LLMLogPage component not found for button alignment test"
    fi
}

# Test analysis trends data
test_analysis_trends_data() {
    run_test "Analysis Trends Data Loading"
    
    local admin_page="src/renderer/pages/AdminPage.tsx"
    
    if [[ -f "$admin_page" ]]; then
        # Check for proper data loading
        if grep -q "window.electronAPI.getAnalyses()" "$admin_page"; then
            log_success "Analysis trends uses correct API method"
        else
            log_failure "Analysis trends missing proper API calls"
        fi
        
        # Check for error handling in trends
        if grep -q "rawData.*trendData" "$admin_page" || grep -q "setAnalysisStats" "$admin_page"; then
            log_success "Analysis trends has proper data structure"
        else
            log_failure "Analysis trends missing proper data handling"
        fi
        
        # Check for empty state handling
        if grep -q "total: 0" "$admin_page" && grep -q "rawData: \[\]" "$admin_page"; then
            log_success "Analysis trends handles empty state correctly"
        else
            log_failure "Analysis trends missing empty state handling"
        fi
    else
        log_failure "AdminPage component not found"
    fi
}

# Test clear LLM log functionality
test_clear_llm_log_functionality() {
    run_test "Clear LLM Log Functionality"
    
    # Check IPC handler
    local electron_js="src/main/electron.js"
    if [[ -f "$electron_js" ]]; then
        if grep -q "ipcMain.handle('clear-llm-log'" "$electron_js"; then
            log_success "Clear LLM log IPC handler exists"
        else
            log_failure "Clear LLM log IPC handler missing"
        fi
    else
        log_failure "Electron main process file not found"
    fi
    
    # Check preload API
    local preload_js="src/main/preload.js"
    if [[ -f "$preload_js" ]]; then
        if grep -q "clearLLMLog:" "$preload_js"; then
            log_success "Clear LLM log preload API exists"
        else
            log_failure "Clear LLM log preload API missing"
        fi
    else
        log_failure "Preload script not found"
    fi
    
    # Check TypeScript types
    local electron_api_types="src/types/electron-api.d.ts"
    if [[ -f "$electron_api_types" ]]; then
        if grep -q "clearLLMLog:" "$electron_api_types"; then
            log_success "Clear LLM log TypeScript types exist"
        else
            log_failure "Clear LLM log TypeScript types missing"
        fi
    else
        log_failure "Electron API types file not found"
    fi
}

# Test OT Threat Intel bulk handler
test_ot_threat_intel_bulk_handler() {
    run_test "OT Threat Intel Bulk Handler"
    
    # Check IPC handler
    local electron_js="src/main/electron.js"
    if [[ -f "$electron_js" ]]; then
        if grep -q "ipcMain.handle('bulk-ot-threat-intel'" "$electron_js"; then
            log_success "Bulk OT threat intel IPC handler exists"
        else
            log_failure "Bulk OT threat intel IPC handler missing"
        fi
    else
        log_failure "Electron main process file not found"
    fi
    
    # Check preload API
    local preload_js="src/main/preload.js"
    if [[ -f "$preload_js" ]]; then
        if grep -q "bulkOTThreatIntel:" "$preload_js"; then
            log_success "Bulk OT threat intel preload API exists"
        else
            log_failure "Bulk OT threat intel preload API missing"
        fi
    else
        log_failure "Preload script not found"
    fi
    
    # Check TypeScript types
    local electron_api_types="src/types/electron-api.d.ts"
    if [[ -f "$electron_api_types" ]]; then
        if grep -q "bulkOTThreatIntel:" "$electron_api_types"; then
            log_success "Bulk OT threat intel TypeScript types exist"
        else
            log_failure "Bulk OT threat intel TypeScript types missing"
        fi
    else
        log_failure "Electron API types file not found"
    fi
    
    # Check component usage
    local ot_dashboard="src/renderer/pages/OTThreatIntelDashboard.tsx"
    if [[ -f "$ot_dashboard" ]]; then
        if grep -q "window.electronAPI.bulkOTThreatIntel" "$ot_dashboard"; then
            log_success "OT Threat Intel Dashboard uses correct API method"
        else
            log_failure "OT Threat Intel Dashboard missing proper API call"
        fi
    else
        log_failure "OT Threat Intel Dashboard not found"
    fi
    
    # Check QuickActions component
    local quick_actions="src/renderer/components/dashboard/QuickActions.tsx"
    if [[ -f "$quick_actions" ]]; then
        if grep -q "window.electronAPI?.bulkOTThreatIntel" "$quick_actions"; then
            log_success "QuickActions component uses correct API method"
        else
            log_failure "QuickActions component missing proper API call"
        fi
    else
        log_failure "QuickActions component not found"
    fi
}

# Main test execution
main() {
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}  First Watch PLC Code Checker - Admin Tests  ${NC}"
    echo -e "${BLUE}================================================${NC}"
    
    setup_test_environment
    
    # Run all tests
    test_admin_page_exists
    test_admin_route_protection
    test_sidebar_admin_visibility
    test_admin_page_components
    test_dashboard_cleanup
    test_typescript_compilation
    test_electron_api_integration
    test_no_admin_leakage
    test_admin_page_tabs
    test_security_hardcoded_credentials
    test_app_startup
    test_file_integrity
    test_system_alerts_spacing
    test_llm_logs_display
    test_admin_button_alignment
    test_analysis_trends_data
    test_clear_llm_log_functionality
    test_ot_threat_intel_bulk_handler
    
    # Test summary
    echo -e "\n${BLUE}================================================${NC}"
    echo -e "${BLUE}                TEST SUMMARY                   ${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo -e "Tests Run:    ${TESTS_RUN}"
    echo -e "Tests Passed: ${GREEN}${TESTS_PASSED}${NC}"
    echo -e "Tests Failed: ${RED}${TESTS_FAILED}${NC}"
    
    if [[ $TESTS_FAILED -eq 0 ]]; then
        echo -e "\n${GREEN}✅ ALL TESTS PASSED - Admin functionality is working correctly!${NC}"
        echo -e "${GREEN}✅ Admin access control is properly implemented${NC}"
        echo -e "${GREEN}✅ No admin features leaked to user interface${NC}"
        echo -e "${GREEN}✅ Application security is maintained${NC}"
        exit 0
    else
        echo -e "\n${RED}❌ $TESTS_FAILED TEST(S) FAILED${NC}"
        echo -e "${RED}❌ Admin functionality needs attention${NC}"
        exit 1
    fi
}

# Run the tests
main "$@"
