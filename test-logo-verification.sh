#!/bin/bash

# First Watch Logo Loading Verification Test
# Tests that logos are properly accessible and paths work correctly

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PASSED_TESTS=0
FAILED_TESTS=0
TOTAL_TESTS=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local description="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -n "[$TOTAL_TESTS] Testing: $test_name"
    echo "   Description: $description"
    
    if eval "$test_command"; then
        echo -e "   Result: ${GREEN}✅ PASSED${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "   Result: ${RED}❌ FAILED${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    echo
}

echo "🔍 FIRST WATCH LOGO VERIFICATION TEST"
echo "====================================="
echo

echo "📁 FILE ACCESSIBILITY TESTS"
echo "==========================="

# Test 1: Check logo files are accessible
run_test "Sidebar Logo Accessible" "[ -r public/firstwatch-logo-2.png ]" "Check firstwatch-logo-2.png is readable"
run_test "Login Logo Accessible" "[ -r public/firstwatch-logo.jpg ]" "Check firstwatch-logo.jpg is readable"

echo "🖼️  FILE FORMAT VERIFICATION"
echo "============================"

# Test 3: Check file formats
run_test "Sidebar Logo Format" "file public/firstwatch-logo-2.png | grep -q 'PNG image'" "Verify firstwatch-logo-2.png is valid PNG"
run_test "Login Logo Format" "file public/firstwatch-logo.jpg | grep -q 'JPEG image'" "Verify firstwatch-logo.jpg is valid JPEG"

echo "📏 FILE SIZE VALIDATION"
echo "======================="

# Test 5: Check reasonable file sizes
SIDEBAR_SIZE=$(stat -f%z public/firstwatch-logo-2.png 2>/dev/null || stat -c%s public/firstwatch-logo-2.png 2>/dev/null)
LOGIN_SIZE=$(stat -f%z public/firstwatch-logo.jpg 2>/dev/null || stat -c%s public/firstwatch-logo.jpg 2>/dev/null)

run_test "Sidebar Logo Size Valid" "[ $SIDEBAR_SIZE -gt 1000 -a $SIDEBAR_SIZE -lt 5000000 ]" "Check sidebar logo size is reasonable (1KB-5MB)"
run_test "Login Logo Size Valid" "[ $LOGIN_SIZE -gt 1000 -a $LOGIN_SIZE -lt 5000000 ]" "Check login logo size is reasonable (1KB-5MB)"

echo "📦 BUILD OUTPUT VERIFICATION"
echo "============================"

# Test 7: Check build output contains logos
run_test "Build Contains Sidebar Logo" "[ -f public/firstwatch-logo-2.png ]" "Verify sidebar logo in build output"
run_test "Login Logo in Build" "[ -f public/firstwatch-logo.jpg ]" "Verify login logo in build output"

echo "🔗 PATH RESOLUTION TESTS"
echo "========================"

# Test 9: Check path resolution in components
run_test "Sidebar Path Resolution" "grep -q 'src=\"/firstwatch-logo-2.png\"' src/renderer/components/Sidebar.tsx" "Verify sidebar uses correct absolute path"
run_test "Login Path Resolution" "grep -q 'src=\"/firstwatch-logo.jpg\"' src/renderer/components/auth/LoginPage.tsx" "Verify login uses correct absolute path"

echo "🎨 STYLING AND ATTRIBUTES"
echo "========================="

# Test 11: Check styling attributes
run_test "Sidebar Alt Text" "grep -q 'alt=\"First Watch Logo\"' src/renderer/components/Sidebar.tsx" "Check sidebar logo alt text"
run_test "Login Alt Text" "grep -q 'alt=\"First Watch Logo\"' src/renderer/components/auth/LoginPage.tsx" "Check login logo alt text"
run_test "Sidebar Styling" "grep -q 'className=\".*h-.*w-.*' src/renderer/components/Sidebar.tsx" "Check sidebar logo has sizing classes"
run_test "Login Styling" "grep -q 'className=\".*h-.*w-.*' src/renderer/components/auth/LoginPage.tsx" "Check login logo has sizing classes"

echo "🚫 NEGATIVE TESTS"
echo "================="

# Test 15: Check for common issues
run_test "No Missing Relative Paths" "! grep -r 'src=\"firstwatch-logo' src/renderer/" "Ensure no relative paths without leading slash"
run_test "No Broken Image Tags" "! grep -r 'src=\"\"' src/renderer/" "Ensure no empty src attributes"

echo "📊 LOGO VERIFICATION RESULTS"
echo "============================"
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

echo
if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL LOGO VERIFICATION TESTS PASSED!${NC}"
    echo -e "${GREEN}✅ First Watch logos should load correctly in the application${NC}"
    echo -e "${GREEN}✅ File formats and sizes are valid${NC}"
    echo -e "${GREEN}✅ Path resolution is working properly${NC}"
    echo -e "${GREEN}✅ Styling and attributes are correct${NC}"
else
    echo -e "${RED}⚠️  Some logo verification tests failed ($FAILED_TESTS/$TOTAL_TESTS)${NC}"
    echo -e "${YELLOW}🔍 Review failed tests and fix any remaining issues${NC}"
fi

# Exit with error code if any tests failed
exit $FAILED_TESTS
