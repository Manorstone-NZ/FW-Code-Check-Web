#!/bin/bash

# Git Functionality Test Suite Runner
# This script tests the git repository connection and branch fetching functionality

echo "🔗 Starting Git Functionality Test Suite..."
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "INFO")
            echo -e "${BLUE}ℹ️  $message${NC}"
            ;;
        "SUCCESS")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "ERROR")
            echo -e "${RED}❌ $message${NC}"
            ;;
    esac
}

# Check if Electron app is running
check_electron() {
    if pgrep -f "Electron.*first-watch-plc-code-checker" > /dev/null; then
        print_status "INFO" "Electron app is running - good!"
        return 0
    else
        print_status "WARNING" "Electron app is not running. Starting it..."
        npm start &
        sleep 5
        if pgrep -f "Electron.*first-watch-plc-code-checker" > /dev/null; then
            print_status "SUCCESS" "Electron app started successfully"
            return 0
        else
            print_status "ERROR" "Failed to start Electron app"
            return 1
        fi
    fi
}

# Test git remote branches functionality directly with Python
test_python_git_backend() {
    print_status "INFO" "Testing Python git backend functionality..."
    
    # Test remote branches fetch
    python3 src/python/git_integration.py --remote-branches "https://github.com/Damiancnz/PLC-Programmes" > /tmp/git_test_output.json 2>&1
    
    if [ $? -eq 0 ]; then
        # Check if the output contains expected branches
        if grep -q '"success": true' /tmp/git_test_output.json && grep -q '"branches"' /tmp/git_test_output.json; then
            branch_count=$(grep -o '"name"' /tmp/git_test_output.json | wc -l | tr -d ' ')
            print_status "SUCCESS" "Python git backend working - found $branch_count branches"
            return 0
        else
            print_status "ERROR" "Python git backend returned success but no branches found"
            cat /tmp/git_test_output.json
            return 1
        fi
    else
        print_status "ERROR" "Python git backend test failed"
        cat /tmp/git_test_output.json
        return 1
    fi
}

# Test git IPC handlers by checking electron.js file
test_ipc_handlers() {
    print_status "INFO" "Testing git IPC handler configuration..."
    
    local handlers=(
        "git-connect-repository"
        "git-get-remote-branches"
        "git-get-branches"
        "git-clone-repository"
        "git-checkout-branch"
        "git-get-files"
        "git-get-status"
        "get-home-directory"
    )
    
    local missing_handlers=()
    
    for handler in "${handlers[@]}"; do
        if ! grep -q "ipcMain.handle('$handler'" src/main/electron.js; then
            missing_handlers+=("$handler")
        fi
    done
    
    if [ ${#missing_handlers[@]} -eq 0 ]; then
        print_status "SUCCESS" "All required git IPC handlers are configured"
        return 0
    else
        print_status "ERROR" "Missing IPC handlers: ${missing_handlers[*]}"
        return 1
    fi
}

# Test preload.js git API exposure
test_preload_api() {
    print_status "INFO" "Testing preload.js git API exposure..."
    
    local api_methods=(
        "gitConnectRepository"
        "gitGetRemoteBranches"
        "gitGetBranches"
        "gitCloneRepository"
        "getHomeDirectory"
    )
    
    local missing_methods=()
    
    for method in "${api_methods[@]}"; do
        if ! grep -q "$method:" src/main/preload.js; then
            missing_methods+=("$method")
        fi
    done
    
    if [ ${#missing_methods[@]} -eq 0 ]; then
        print_status "SUCCESS" "All git API methods exposed in preload.js"
        return 0
    else
        print_status "ERROR" "Missing API methods in preload.js: ${missing_methods[*]}"
        return 1
    fi
}

# Check git dependencies
check_git_dependencies() {
    print_status "INFO" "Checking git dependencies..."
    
    # Check if git command is available
    if ! command -v git > /dev/null; then
        print_status "ERROR" "Git command not found in PATH"
        return 1
    fi
    
    # Check if Python git module is available
    python3 -c "import git" 2>/dev/null
    if [ $? -eq 0 ]; then
        print_status "SUCCESS" "Python git module available"
    else
        print_status "ERROR" "Python git module not available - install with: pip install GitPython"
        return 1
    fi
    
    # Check git version
    git_version=$(git --version | cut -d' ' -f3)
    print_status "SUCCESS" "Git version: $git_version"
    
    return 0
}

# Test specific repository connection
test_repo_connection() {
    print_status "INFO" "Testing repository connection functionality..."
    
    # Test with a known public repository
    local test_url="https://github.com/Damiancnz/PLC-Programmes"
    
    # Test git ls-remote directly
    git ls-remote --heads "$test_url" > /tmp/git_ls_remote_test.txt 2>&1
    
    if [ $? -eq 0 ] && [ -s /tmp/git_ls_remote_test.txt ]; then
        branch_count=$(wc -l < /tmp/git_ls_remote_test.txt | tr -d ' ')
        print_status "SUCCESS" "Git ls-remote working - found $branch_count branches"
        
        # Show first few branches
        head -3 /tmp/git_ls_remote_test.txt | while read line; do
            branch_name=$(echo "$line" | cut -f2 | sed 's|refs/heads/||')
            print_status "INFO" "  Branch: $branch_name"
        done
        
        return 0
    else
        print_status "ERROR" "Git ls-remote failed for $test_url"
        cat /tmp/git_ls_remote_test.txt
        return 1
    fi
}

# Check for common git connection issues
check_git_network() {
    print_status "INFO" "Checking git network connectivity..."
    
    # Test network connectivity to GitHub
    if curl -s --connect-timeout 5 https://github.com > /dev/null; then
        print_status "SUCCESS" "Network connectivity to GitHub working"
    else
        print_status "WARNING" "Network connectivity to GitHub may be limited"
    fi
    
    # Test DNS resolution
    if nslookup github.com > /dev/null 2>&1; then
        print_status "SUCCESS" "DNS resolution working"
    else
        print_status "WARNING" "DNS resolution may have issues"
    fi
    
    return 0
}

# Main test execution
main() {
    print_status "INFO" "Git Functionality Test Suite Starting..."
    
    local failed_tests=0
    
    # Check dependencies
    if ! check_git_dependencies; then
        ((failed_tests++))
    fi
    
    # Check network
    check_git_network
    
    # Test IPC handlers
    if ! test_ipc_handlers; then
        ((failed_tests++))
    fi
    
    # Test preload API
    if ! test_preload_api; then
        ((failed_tests++))
    fi
    
    # Test Python backend
    if ! test_python_git_backend; then
        ((failed_tests++))
    fi
    
    # Test repository connection
    if ! test_repo_connection; then
        ((failed_tests++))
    fi
    
    # Check Electron app
    if ! check_electron; then
        ((failed_tests++))
    fi
    
    echo ""
    print_status "INFO" "=========================================="
    if [ $failed_tests -eq 0 ]; then
        print_status "SUCCESS" "All git functionality tests passed!"
        print_status "INFO" "Git branch fetching should now work correctly in the UI"
        print_status "INFO" "To test manually:"
        echo "  1. Open the app and go to Upload page"
        echo "  2. Toggle to 'Connect to Git Repository' mode"
        echo "  3. Enter: https://github.com/Damiancnz/PLC-Programmes"
        echo "  4. Click 'Fetch Branches' button"
        echo "  5. Verify branches appear in dropdown"
    else
        print_status "ERROR" "$failed_tests test(s) failed!"
        print_status "INFO" "Git functionality may not work correctly until issues are resolved"
    fi
    
    # Clean up temp files
    rm -f /tmp/git_test_output.json /tmp/git_ls_remote_test.txt
}

# Run the main function
main "$@"
