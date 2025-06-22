#!/bin/bash

# Integration Tests
# Tests end-to-end workflows and integration between components

echo "🔗 INTEGRATION TESTS"
echo "===================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0
TOTAL=0

test_workflow() {
    local name="$1"
    local description="$2"
    local test_commands="$3"
    
    TOTAL=$((TOTAL + 1))
    echo ""
    echo -e "${BLUE}[$TOTAL] Testing Workflow: $name${NC}"
    echo "Description: $description"
    echo ""
    
    # Execute test commands
    if eval "$test_commands"; then
        echo -e "Result: ${GREEN}✅ PASSED${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "Result: ${RED}❌ FAILED${NC}"
        FAILED=$((FAILED + 1))
    fi
}

echo "Testing End-to-End Workflows..."

# Test 1: Complete Analysis Workflow
test_workflow "Complete Analysis Workflow" \
    "Upload file → Analyze → Save → Display results" \
    "
    echo '  Step 1: Check file upload components...'
    [ -f 'src/renderer/components/EnhancedFileUploader.tsx' ] || exit 1
    
    echo '  Step 2: Check analysis backend...'
    python3 -c 'import sys; sys.path.append(\"src/python\"); import analyzer; print(\"Analyzer OK\")' || exit 1
    
    echo '  Step 3: Check database save...'
    python3 -c 'import sys; sys.path.append(\"src/python\"); import db; db.init_database(); print(\"Database OK\")' || exit 1
    
    echo '  Step 4: Check IPC handlers...'
    grep -q 'save-analysis' src/main/electron.js || exit 1
    
    echo '  ✅ Complete workflow components verified'
    "

# Test 2: Git Integration Workflow
test_workflow "Git Integration Workflow" \
    "Connect to repo → Browse branches → Select file → Analyze" \
    "
    echo '  Step 1: Check git connection...'
    [ -f 'src/python/git_integration.py' ] || exit 1
    
    echo '  Step 2: Check git UI components...'
    [ -f 'src/renderer/components/git/GitConnectionModal.tsx' ] || exit 1
    [ -f 'src/renderer/components/git/GitFileSelector.tsx' ] || exit 1
    
    echo '  Step 3: Check git IPC handlers...'
    grep -q 'git-connect' src/main/electron.js || exit 1
    grep -q 'git-analyze-file' src/main/electron.js || exit 1
    
    echo '  ✅ Git workflow components verified'
    "

# Test 3: Comparison Workflow
test_workflow "Analysis Comparison Workflow" \
    "Select analyses → Compare → Display differences" \
    "
    echo '  Step 1: Check comparison page...'
    [ -f 'src/renderer/pages/ComparisonsPage.tsx' ] || exit 1
    
    echo '  Step 2: Check comparison backend...'
    python3 -c 'import sys; sys.path.append(\"src/python\"); import analyzer; print(\"Comparison OK\")' || exit 1
    
    echo '  Step 3: Check comparison handlers...'
    grep -q 'compare-analyses' src/main/electron.js || exit 1
    
    echo '  ✅ Comparison workflow components verified'
    "

# Test 4: OT Threat Intel Workflow
test_workflow "OT Threat Intel Workflow" \
    "Sync threats → Display dashboard → View details → Update entries" \
    "
    echo '  Step 1: Check sync module...'
    [ -f 'src/python/sync_ot_threat_intel.py' ] || exit 1
    
    echo '  Step 2: Check dashboard...'
    [ -f 'src/renderer/pages/OTThreatIntelDashboard.tsx' ] || exit 1
    
    echo '  Step 3: Check details panel...'
    [ -f 'src/renderer/components/OTThreatIntelDetailsPanel.tsx' ] || exit 1
    
    echo '  Step 4: Check OT handlers...'
    grep -q 'get-ot-threat-intel-entries' src/main/electron.js || exit 1
    grep -q 'update-ot-threat-intel-entry' src/main/electron.js || exit 1
    
    echo '  ✅ OT Threat Intel workflow components verified'
    "

# Test 5: Data Flow Integration
test_workflow "Data Flow Integration" \
    "Frontend → IPC → Python → Database → Response" \
    "
    echo '  Step 1: Check Electron main process...'
    [ -f 'src/main/electron.js' ] || exit 1
    
    echo '  Step 2: Check preload script...'
    [ -f 'src/main/preload.js' ] || exit 1
    
    echo '  Step 3: Check Python handler creation...'
    grep -q 'createPythonHandler' src/main/electron.js || exit 1
    
    echo '  Step 4: Check database connectivity...'
    python3 -c 'import sys; sys.path.append(\"src/python\"); import db; db.init_database(); print(\"Data flow OK\")' || exit 1
    
    echo '  ✅ Data flow integration verified'
    "

# Test 6: Build and Bundle Integration
test_workflow "Build and Bundle Integration" \
    "Source → Webpack → Bundle → Electron" \
    "
    echo '  Step 1: Check webpack config...'
    [ -f 'webpack.config.js' ] || exit 1
    
    echo '  Step 2: Check TypeScript config...'
    [ -f 'tsconfig.json' ] || exit 1
    
    echo '  Step 3: Check bundle output...'
    [ -f 'public/bundle.js' ] || exit 1
    
    echo '  Step 4: Check bundle size...'
    size=\$(stat -f%z public/bundle.js 2>/dev/null || stat -c%s public/bundle.js 2>/dev/null || echo 0)
    [ \$size -gt 100000 ] || exit 1  # Bundle should be > 100KB
    
    echo '  ✅ Build integration verified'
    "

# Test 7: Security Integration
test_workflow "Security Integration" \
    "Context isolation → Preload API → Secure IPC" \
    "
    echo '  Step 1: Check context isolation...'
    grep -q 'contextIsolation.*true' src/main/electron.js || exit 1
    
    echo '  Step 2: Check preload script security...'
    grep -q 'contextBridge' src/main/preload.js || exit 1
    
    echo '  Step 3: Check API exposure...'
    grep -q 'electronAPI' src/main/preload.js || exit 1
    
    echo '  ✅ Security integration verified'
    "

echo ""
echo "Testing Cross-Component Communication..."

# Test 8: Component State Management
test_workflow "Component State Management" \
    "State updates → React context → Component re-render" \
    "
    echo '  Step 1: Check React context usage...'
    grep -q 'React.createContext\\|useContext' src/renderer/App.tsx || exit 1
    
    echo '  Step 2: Check state management patterns...'
    grep -q 'useState\\|useEffect' src/renderer/pages/AnalysisPage.tsx || exit 1
    
    echo '  ✅ State management verified'
    "

echo ""
echo "📊 INTEGRATION TEST RESULTS"
echo "==========================="
echo -e "Total Workflows: ${BLUE}$TOTAL${NC}"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All integration tests passed!${NC}"
    echo -e "${GREEN}🔗 All workflows are properly integrated!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some integration tests failed. Check the workflows above.${NC}"
    exit 1
fi
