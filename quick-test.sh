#!/bin/bash

# Quick Test Runner
# Fast essential tests for development workflow

echo "⚡ QUICK VALIDATION TESTS"
echo "========================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0
TOTAL=0

quick_test() {
    local name="$1"
    local command="$2"
    
    TOTAL=$((TOTAL + 1))
    printf "%-30s" "[$TOTAL] $name..."
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e " ${GREEN}✅${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e " ${RED}❌${NC}"
        FAILED=$((FAILED + 1))
    fi
}

echo "Essential System Checks:"
echo ""

# Core system checks
quick_test "Node.js" "node --version"
quick_test "Python3" "python3 --version"
quick_test "Git" "git --version"

echo ""
echo "Project Structure:"
echo ""

# Project structure
quick_test "Source directory" "[ -d 'src' ]"
quick_test "Public directory" "[ -d 'public' ]"
quick_test "Node modules" "[ -d 'node_modules' ]"
quick_test "Bundle file" "[ -f 'public/bundle.js' ]"

echo ""
echo "Core Files:"
echo ""

# Core files
quick_test "Package.json" "[ -f 'package.json' ]"
quick_test "Electron main" "[ -f 'src/main/electron.js' ]"
quick_test "Database module" "[ -f 'src/python/db.py' ]"
quick_test "Main React app" "[ -f 'src/renderer/App.tsx' ]"

echo ""
echo "Key Components:"
echo ""

# Key components
quick_test "Analysis page" "[ -f 'src/renderer/pages/AnalysisPage.tsx' ]"
quick_test "File uploader" "[ -f 'src/renderer/components/EnhancedFileUploader.tsx' ]"
quick_test "OT dashboard" "[ -f 'src/renderer/pages/OTThreatIntelDashboard.tsx' ]"
quick_test "Git integration" "[ -f 'src/python/git_integration.py' ]"

echo ""
echo "Database:"
echo ""

# Database check
quick_test "DB initialization" "python3 -c 'import sys; sys.path.append(\"src/python\"); import db; db.init_database()'"

echo ""
echo "IPC Handlers:"
echo ""

# IPC handlers
quick_test "Save analysis" "grep -q 'save-analysis' src/main/electron.js"
quick_test "Git handlers" "grep -q 'git-' src/main/electron.js"
quick_test "OT handlers" "grep -q 'ot-threat-intel' src/main/electron.js"

echo ""
echo "📊 QUICK TEST SUMMARY"
echo "====================="
echo -e "Total: ${BLUE}$TOTAL${NC} | Passed: ${GREEN}$PASSED${NC} | Failed: ${RED}$FAILED${NC}"

# Calculate success rate
if [ $TOTAL -gt 0 ]; then
    SUCCESS_RATE=$((PASSED * 100 / TOTAL))
    echo -e "Success Rate: ${YELLOW}${SUCCESS_RATE}%${NC}"
else
    SUCCESS_RATE=0
fi

echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All quick tests passed! System ready!${NC}"
    exit 0
elif [ $SUCCESS_RATE -ge 80 ]; then
    echo -e "${YELLOW}⚠️  Mostly working ($SUCCESS_RATE%). Minor issues detected.${NC}"
    exit 1
else
    echo -e "${RED}❌ Multiple failures ($SUCCESS_RATE%). System needs attention.${NC}"
    exit 2
fi
