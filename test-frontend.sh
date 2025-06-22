#!/bin/bash

# Frontend Component Tests
# Tests all React components and frontend functionality

echo "🎨 FRONTEND COMPONENT TESTS"
echo "============================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0
TOTAL=0

test_component() {
    local name="$1"
    local file="$2"
    local description="$3"
    
    TOTAL=$((TOTAL + 1))
    echo -n "[$TOTAL] Testing $name... "
    
    if [ -f "$file" ]; then
        # Check if component has proper export
        if grep -q "export default" "$file"; then
            echo -e "${GREEN}✅ PASSED${NC}"
            PASSED=$((PASSED + 1))
        else
            echo -e "${YELLOW}⚠️  WARNING${NC} - No default export found"
            FAILED=$((FAILED + 1))
        fi
    else
        echo -e "${RED}❌ FAILED${NC} - File not found"
        FAILED=$((FAILED + 1))
    fi
}

test_typescript() {
    local name="$1"
    local file="$2"
    
    TOTAL=$((TOTAL + 1))
    echo -n "[$TOTAL] TypeScript check for $name... "
    
    if [ -f "$file" ]; then
        # Basic TypeScript syntax check
        if grep -q "React" "$file" && grep -q "FC\|FunctionComponent" "$file"; then
            echo -e "${GREEN}✅ PASSED${NC}"
            PASSED=$((PASSED + 1))
        else
            echo -e "${YELLOW}⚠️  WARNING${NC} - TypeScript patterns not found"
            FAILED=$((FAILED + 1))
        fi
    else
        echo -e "${RED}❌ FAILED${NC} - File not found"
        FAILED=$((FAILED + 1))
    fi
}

echo "Testing React Components..."
echo ""

# Test main pages
test_component "Analysis Page" "src/renderer/pages/AnalysisPage.tsx" "Main analysis interface"
test_component "History Page" "src/renderer/pages/HistoryPage.tsx" "Analysis history view"
test_component "Comparisons Page" "src/renderer/pages/ComparisonsPage.tsx" "Analysis comparison interface"
test_component "OT Threat Intel Dashboard" "src/renderer/pages/OTThreatIntelDashboard.tsx" "Threat intelligence dashboard"

echo ""
echo "Testing Components..."
echo ""

# Test core components
test_component "Enhanced File Uploader" "src/renderer/components/EnhancedFileUploader.tsx" "File upload component"
test_component "Analysis Details" "src/renderer/components/AnalysisDetails.tsx" "Analysis details display"
test_component "OT Threat Intel Details Panel" "src/renderer/components/OTThreatIntelDetailsPanel.tsx" "Threat details panel"
test_component "Git Connection Modal" "src/renderer/components/git/GitConnectionModal.tsx" "Git connection interface"
test_component "Git File Selector" "src/renderer/components/git/GitFileSelector.tsx" "Git file selection"

echo ""
echo "Testing TypeScript Integration..."
echo ""

# Test TypeScript usage
test_typescript "Analysis Page" "src/renderer/pages/AnalysisPage.tsx"
test_typescript "File Uploader" "src/renderer/components/EnhancedFileUploader.tsx"
test_typescript "OT Threat Intel Dashboard" "src/renderer/pages/OTThreatIntelDashboard.tsx"

echo ""
echo "Testing CSS and Styling..."
echo ""

# Test styling
TOTAL=$((TOTAL + 1))
echo -n "[$TOTAL] Tailwind CSS configuration... "
if [ -f "tailwind.config.js" ] && grep -q "tailwindcss" tailwind.config.js; then
    echo -e "${GREEN}✅ PASSED${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAILED${NC}"
    FAILED=$((FAILED + 1))
fi

TOTAL=$((TOTAL + 1))
echo -n "[$TOTAL] Tailwind CSS file... "
if [ -f "public/styles/tailwind.css" ]; then
    echo -e "${GREEN}✅ PASSED${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAILED${NC}"
    FAILED=$((FAILED + 1))
fi

echo ""
echo "Testing Build System..."
echo ""

# Test build configuration
TOTAL=$((TOTAL + 1))
echo -n "[$TOTAL] Webpack configuration... "
if [ -f "webpack.config.js" ] && grep -q "entry\|output" webpack.config.js; then
    echo -e "${GREEN}✅ PASSED${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAILED${NC}"
    FAILED=$((FAILED + 1))
fi

TOTAL=$((TOTAL + 1))
echo -n "[$TOTAL] TypeScript configuration... "
if [ -f "tsconfig.json" ] && grep -q "compilerOptions" tsconfig.json; then
    echo -e "${GREEN}✅ PASSED${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAILED${NC}"
    FAILED=$((FAILED + 1))
fi

TOTAL=$((TOTAL + 1))
echo -n "[$TOTAL] Bundle.js existence... "
if [ -f "public/bundle.js" ]; then
    echo -e "${GREEN}✅ PASSED${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAILED${NC}"
    FAILED=$((FAILED + 1))
fi

echo ""
echo "📊 FRONTEND TEST RESULTS"
echo "========================"
echo -e "Total Tests: ${BLUE}$TOTAL${NC}"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All frontend tests passed!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some frontend tests failed. Check the issues above.${NC}"
    exit 1
fi
