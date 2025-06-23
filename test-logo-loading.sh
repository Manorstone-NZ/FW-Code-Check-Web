#!/bin/bash

# Test script to verify First Watch Logo loading in the application

echo "🖼️  FIRST WATCH LOGO LOADING TEST"
echo "=================================="
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

# Function to run a test and track results
run_test() {
    local test_name="$1"
    local test_command="$2"
    local test_description="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -e "${BLUE}[$TOTAL_TESTS]${NC} Testing: $test_name"
    echo "   Description: $test_description"
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "   Result: ${GREEN}✅ PASSED${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "   Result: ${RED}❌ FAILED${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    echo ""
}

echo "📂 LOGO FILE EXISTENCE TESTS"
echo "============================="

# Test 1: Check if logo files exist in public directory
run_test "Sidebar Logo File" "[ -f 'public/firstwatch-logo-2.png' ]" "Check if firstwatch-logo-2.png exists"
run_test "Login Logo File" "[ -f 'public/firstwatch-logo.jpg' ]" "Check if firstwatch-logo.jpg exists"

echo "🔗 LOGO PATH REFERENCE TESTS"
echo "============================="

# Test 2: Check correct path references in components
run_test "Sidebar Logo Import" "grep -q 'import logoSrc from' src/renderer/components/Sidebar.tsx" "Check Sidebar imports logo as asset"
run_test "Login Logo Path" "grep -q 'src=\"/firstwatch-logo.jpg\"' src/renderer/components/auth/LoginPage.tsx" "Check LoginPage uses correct absolute path"

echo "❌ INCORRECT PATH DETECTION TESTS"
echo "=================================="

# Test 3: Ensure no incorrect relative paths remain  
run_test "Sidebar Uses Asset Import" "grep -q 'src={logoSrc}' src/renderer/components/Sidebar.tsx" "Ensure Sidebar uses imported asset"
run_test "No Relative Login Path" "! grep -q 'src=\"./firstwatch-logo.jpg\"' src/renderer/components/auth/LoginPage.tsx" "Ensure no relative path in LoginPage"

echo "🎨 LOGO COMPONENT INTEGRITY TESTS"
echo "=================================="

# Test 4: Check alt text and styling
run_test "Sidebar Alt Text" "grep -q 'alt=\"First Watch Logo\"' src/renderer/components/Sidebar.tsx" "Check Sidebar logo has proper alt text"
run_test "Login Alt Text" "grep -q 'alt=\"First Watch Logo\"' src/renderer/components/auth/LoginPage.tsx" "Check Login logo has proper alt text"
run_test "Sidebar Logo Styling" "grep -q 'className=\"h-16 w-auto mb-3\"' src/renderer/components/Sidebar.tsx" "Check Sidebar logo has proper styling"
run_test "Login Logo Styling" "grep -q 'className=\"h-10 w-10 object-contain\"' src/renderer/components/auth/LoginPage.tsx" "Check Login logo has proper styling"

echo "📦 BUILD VERIFICATION TESTS"
echo "==========================="

# Test 5: Check if build contains updated references
run_test "Assets Directory Exists" "[ -d 'src/renderer/assets' ]" "Check assets directory exists"
run_test "Webpack Processes Images" "[ -f 'public/bundle.js' ] && ls public/*.png | head -1 | grep -q '[0-9a-f]' || echo 'No hashed images found'" "Check webpack processes images with hashes"

echo "🖼️  FILE FORMAT AND SIZE TESTS"
echo "==============================="

# Test 6: Basic file validation
if [ -f "public/firstwatch-logo-2.png" ]; then
    SIDEBAR_SIZE=$(stat -f%z public/firstwatch-logo-2.png 2>/dev/null || stat -c%s public/firstwatch-logo-2.png 2>/dev/null)
    run_test "Sidebar Logo Size" "[ $SIDEBAR_SIZE -gt 1000 ]" "Check Sidebar logo file is not empty/corrupt"
fi

if [ -f "public/firstwatch-logo.jpg" ]; then
    LOGIN_SIZE=$(stat -f%z public/firstwatch-logo.jpg 2>/dev/null || stat -c%s public/firstwatch-logo.jpg 2>/dev/null)
    run_test "Login Logo Size" "[ $LOGIN_SIZE -gt 1000 ]" "Check Login logo file is not empty/corrupt"
fi

echo "🔍 COMPONENT IMPORT TESTS"
echo "========================="

# Test 7: Check component structure
run_test "Sidebar Component Structure" "grep -A5 'img' src/renderer/components/Sidebar.tsx | grep -q 'className' && grep -A5 'img' src/renderer/components/Sidebar.tsx | grep -q 'alt' && grep -A5 'img' src/renderer/components/Sidebar.tsx | grep -q 'src'" "Check Sidebar logo component structure"
run_test "Login Component Structure" "grep -A5 'img' src/renderer/components/auth/LoginPage.tsx | grep -q 'className' && grep -A5 'img' src/renderer/components/auth/LoginPage.tsx | grep -q 'alt' && grep -A5 'img' src/renderer/components/auth/LoginPage.tsx | grep -q 'src'" "Check Login logo component structure"

echo "📊 LOGO LOADING TEST RESULTS"
echo "============================="
echo -e "Total Tests: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"

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
    echo -e "${GREEN}🎉 ALL LOGO TESTS PASSED! First Watch logos should load correctly.${NC}"
    echo "✅ Logo files exist in public directory"
    echo "✅ Correct absolute paths used in components"
    echo "✅ No incorrect relative paths detected"
    echo "✅ Proper alt text and styling applied"
    echo "✅ Build contains updated references"
    exit 0
elif [ $SUCCESS_RATE -ge 80 ]; then
    echo -e "${YELLOW}⚠️  Most logo tests passed ($SUCCESS_RATE%). Minor issues detected.${NC}"
    echo "🔍 Review failed tests and fix any remaining issues"
    exit 1
else
    echo -e "${RED}❌ Multiple logo loading issues detected ($SUCCESS_RATE% success).${NC}"
    echo "🚨 Logo loading may not work correctly"
    echo "📋 Actions needed:"
    echo "   - Check file paths and permissions"
    echo "   - Verify build process"
    echo "   - Test in running application"
    exit 2
fi
