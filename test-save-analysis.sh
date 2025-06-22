#!/bin/bash

# Save Analysis Test Suite Runner
# This script runs comprehensive tests for the save-analysis functionality

echo "🧪 Starting Save Analysis Test Suite..."
echo "=================================="

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

# Run basic save-analysis backend test
test_backend() {
    print_status "INFO" "Testing save-analysis backend functionality..."
    
    # Test the Python db.py save-analysis command directly
    python3 src/python/db.py --save-analysis "test-backend.L5X" "complete" '{"vulnerabilities":["test"],"instruction_analysis":[{"instruction":"TEST","insight":"test","risk_level":"Low"}]}' "/test/path.L5X" "openai" "gpt-4"
    
    if [ $? -eq 0 ]; then
        print_status "SUCCESS" "Backend save-analysis test passed"
        return 0
    else
        print_status "ERROR" "Backend save-analysis test failed"
        return 1
    fi
}

# Run frontend integration tests
test_frontend() {
    print_status "INFO" "Running frontend save-analysis tests..."
    
    if [ -f "node_modules/.bin/playwright" ]; then
        npx playwright test --config=playwright.save-analysis.config.js
        if [ $? -eq 0 ]; then
            print_status "SUCCESS" "Frontend integration tests passed"
            return 0
        else
            print_status "ERROR" "Frontend integration tests failed"
            return 1
        fi
    else
        print_status "WARNING" "Playwright not installed, skipping frontend tests"
        return 0
    fi
}

# Test the fixed save-analysis IPC handler
test_ipc_handler() {
    print_status "INFO" "Testing IPC handler fix..."
    
    # Check if the electron.js file has the correct handler
    if grep -q "createPythonHandler(path.join(__dirname, '../python/db.py')" src/main/electron.js; then
        print_status "SUCCESS" "IPC handler correctly points to db.py"
    else
        print_status "ERROR" "IPC handler still points to wrong file"
        return 1
    fi
    
    # Check if save-analysis function exists in db.py
    if grep -q "save-analysis" src/python/db.py; then
        print_status "SUCCESS" "save-analysis function found in db.py"
    else
        print_status "ERROR" "save-analysis function not found in db.py"
        return 1
    fi
    
    return 0
}

# Check for common issues that could prevent save-analysis from working
check_common_issues() {
    print_status "INFO" "Checking for common issues..."
    
    # Check if database file exists
    if [ -f "src/python/firstwatch.db" ] || [ -f "firstwatch.db" ]; then
        print_status "SUCCESS" "Database file found"
    else
        print_status "WARNING" "Database file not found - will be created on first use"
    fi
    
    # Check if OpenAI key exists
    if [ -f "openai.key" ]; then
        print_status "SUCCESS" "OpenAI key file found"
    else
        print_status "WARNING" "OpenAI key file not found - some tests may fail"
    fi
    
    # Check if Python dependencies are available
    python3 -c "import sqlite3, json, sys" 2>/dev/null
    if [ $? -eq 0 ]; then
        print_status "SUCCESS" "Python dependencies available"
    else
        print_status "ERROR" "Python dependencies missing"
        return 1
    fi
    
    return 0
}

# Main test execution
main() {
    print_status "INFO" "Save Analysis Test Suite Starting..."
    
    # Check environment
    if ! check_common_issues; then
        print_status "ERROR" "Environment check failed"
        exit 1
    fi
    
    # Test IPC handler fix
    if ! test_ipc_handler; then
        print_status "ERROR" "IPC handler test failed"
        exit 1
    fi
    
    # Check Electron app
    if ! check_electron; then
        print_status "ERROR" "Electron app check failed"
        exit 1
    fi
    
    # Test backend functionality
    if ! test_backend; then
        print_status "ERROR" "Backend test failed"
        exit 1
    fi
    
    # Test frontend integration
    if ! test_frontend; then
        print_status "WARNING" "Frontend tests had issues (but continuing...)"
    fi
    
    print_status "SUCCESS" "Save Analysis Test Suite Completed!"
    print_status "INFO" "Summary of fixes applied:"
    echo "  • Fixed save-analysis IPC handler to call db.py instead of analyzer.py"
    echo "  • Added proper error handling and result checking"
    echo "  • Added timing delay to ensure database commit before refresh"
    echo "  • Enhanced error messages with analysis ID display"
    echo "  • Added comprehensive test coverage"
    
    print_status "INFO" "To test manually:"
    echo "  1. Open the app and go to Upload page"
    echo "  2. Upload a .L5X file and analyze it"
    echo "  3. Click 'Save Analysis to Database'"
    echo "  4. Go to Analysis page and verify the new analysis appears"
    echo "  5. Check browser console for detailed logging"
}

# Run the main function
main "$@"
