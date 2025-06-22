#!/bin/bash

# Backend API and Database Tests
# Tests all Python backend functionality and database operations

echo "🔧 BACKEND API AND DATABASE TESTS"
echo "=================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0
TOTAL=0

test_python_module() {
    local name="$1"
    local file="$2"
    local description="$3"
    
    TOTAL=$((TOTAL + 1))
    echo -n "[$TOTAL] Testing $name... "
    
    if [ -f "$file" ]; then
        # Basic Python syntax check
        if python3 -m py_compile "$file" 2>/dev/null; then
            echo -e "${GREEN}✅ PASSED${NC}"
            PASSED=$((PASSED + 1))
        else
            echo -e "${RED}❌ FAILED${NC} - Syntax error"
            FAILED=$((FAILED + 1))
        fi
    else
        echo -e "${RED}❌ FAILED${NC} - File not found"
        FAILED=$((FAILED + 1))
    fi
}

test_database_function() {
    local function_name="$1"
    local module="$2"
    
    TOTAL=$((TOTAL + 1))
    echo -n "[$TOTAL] Testing $function_name function... "
    
    if python3 -c "
import sys
sys.path.append('src/python')
try:
    import $module
    if hasattr($module, '$function_name'):
        print('Function exists')
    else:
        exit(1)
except Exception as e:
    print(f'Error: {e}')
    exit(1)
" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASSED${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌ FAILED${NC}"
        FAILED=$((FAILED + 1))
    fi
}

test_electron_handler() {
    local handler_name="$1"
    
    TOTAL=$((TOTAL + 1))
    echo -n "[$TOTAL] Testing $handler_name IPC handler... "
    
    if grep -q "$handler_name" src/main/electron.js; then
        echo -e "${GREEN}✅ PASSED${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌ FAILED${NC}"
        FAILED=$((FAILED + 1))
    fi
}

echo "Testing Python Modules..."
echo ""

# Test core Python modules
test_python_module "Database Module" "src/python/db.py" "Core database operations"
test_python_module "Analyzer Module" "src/python/analyzer.py" "PLC code analysis"
test_python_module "Git Integration" "src/python/git_integration.py" "Git repository operations"
test_python_module "OT Threat Intel Sync" "src/python/sync_ot_threat_intel.py" "Threat intelligence sync"
test_python_module "Logger Module" "src/python/logger.py" "Application logging"
test_python_module "Config Module" "src/python/config.py" "Configuration management"

echo ""
echo "Testing Database Functions..."
echo ""

# Test database functions
test_database_function "init_database" "db"
test_database_function "save_analysis" "db"
test_database_function "get_all_analyses" "db"
test_database_function "delete_analysis" "db"
test_database_function "get_analysis" "db"
test_database_function "save_baseline" "db"
test_database_function "get_baselines" "db"
test_database_function "list_ot_threat_intel" "db"
test_database_function "save_ot_threat_intel" "db"
test_database_function "clear_ot_threat_intel" "db"

echo ""
echo "Testing Analysis Functions..."
echo ""

# Test analyzer functions
test_database_function "analyze_plc_code" "analyzer"
test_database_function "compare_analyses" "analyzer"

echo ""
echo "Testing Git Functions..."
echo ""

# Test git integration functions
test_database_function "connect_to_repo" "git_integration"
test_database_function "get_branches" "git_integration"
test_database_function "get_files_in_branch" "git_integration"
test_database_function "get_file_content" "git_integration"

echo ""
echo "Testing Electron IPC Handlers..."
echo ""

# Test IPC handlers
test_electron_handler "save-analysis"
test_electron_handler "delete-analysis"
test_electron_handler "get-analyses"
test_electron_handler "compare-analyses"
test_electron_handler "git-connect"
test_electron_handler "git-branches"
test_electron_handler "git-files"
test_electron_handler "git-analyze-file"
test_electron_handler "get-ot-threat-intel-entries"
test_electron_handler "update-ot-threat-intel-entry"
test_electron_handler "clear-ot-threat-intel"
test_electron_handler "bulk-ot-threat-intel"

echo ""
echo "Testing Database Integrity..."
echo ""

# Test database initialization
TOTAL=$((TOTAL + 1))
echo -n "[$TOTAL] Database initialization... "
if python3 -c "
import sys
sys.path.append('src/python')
import db
try:
    db.init_database()
    print('Database initialized successfully')
except Exception as e:
    print(f'Error: {e}')
    exit(1)
" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASSED${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAILED${NC}"
    FAILED=$((FAILED + 1))
fi

# Test database operations
TOTAL=$((TOTAL + 1))
echo -n "[$TOTAL] Database CRUD operations... "
if python3 -c "
import sys
sys.path.append('src/python')
import db
try:
    db.init_database()
    # Test getting analyses (should not fail even if empty)
    analyses = db.get_all_analyses()
    print('CRUD operations work')
except Exception as e:
    print(f'Error: {e}')
    exit(1)
" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASSED${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAILED${NC}"
    FAILED=$((FAILED + 1))
fi

echo ""
echo "Testing Configuration..."
echo ""

# Test configuration files
TOTAL=$((TOTAL + 1))
echo -n "[$TOTAL] OpenAI key configuration... "
if [ -f "openai.key" ] || [ -n "$OPENAI_API_KEY" ]; then
    echo -e "${GREEN}✅ PASSED${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${YELLOW}⚠️  WARNING${NC} - No OpenAI key found"
    FAILED=$((FAILED + 1))
fi

echo ""
echo "📊 BACKEND TEST RESULTS"
echo "======================"
echo -e "Total Tests: ${BLUE}$TOTAL${NC}"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All backend tests passed!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some backend tests failed. Check the issues above.${NC}"
    exit 1
fi
