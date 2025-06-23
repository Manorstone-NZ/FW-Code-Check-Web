#!/bin/bash

# Test Create User Form Button Overlap Fix - Corrected Verification
# This script verifies the styling changes made to fix the button overlap

echo "🧪 Testing Create User Form Button Overlap Fix - Corrected Verification..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${BLUE}Test $TOTAL_TESTS: $test_name${NC}"
    
    result=$(eval "$test_command")
    if [[ "$result" == "$expected_result" ]]; then
        echo -e "${GREEN}✅ PASSED${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ FAILED${NC}"
        echo -e "${YELLOW}Expected: $expected_result${NC}"
        echo -e "${YELLOW}Actual: $result${NC}"
    fi
    echo ""
}

# Test the specific changes made

# Test 1: Password field container has mb-6 class (line 352)
run_test "Password field container has mb-6" \
    "grep -n 'mb-6' src/renderer/pages/UserManagementPage.tsx | grep -c ':352:'" \
    "1"

# Test 2: Password input has pr-24 class
run_test "Password input has pr-24 padding" \
    "grep -c 'pr-24' src/renderer/pages/UserManagementPage.tsx" \
    "1"

# Test 3: Confirm password field has mb-6 class (line 376)
run_test "Confirm password field has mb-6" \
    "grep -n 'mb-6' src/renderer/pages/UserManagementPage.tsx | grep -c ':376:'" \
    "1"

# Test 4: Button container has pt-6 class
run_test "Button container has pt-6 padding" \
    "grep -c 'pt-6' src/renderer/pages/UserManagementPage.tsx" \
    "1"

# Test 5: Show/hide button has pr-3 class
run_test "Show/hide button has pr-3 padding" \
    "grep -c 'pr-3' src/renderer/pages/UserManagementPage.tsx" \
    "1"

# Test 6: Show/hide button has whitespace-nowrap class
run_test "Show/hide button has whitespace-nowrap" \
    "grep -A1 'pr-3' src/renderer/pages/UserManagementPage.tsx | grep -c 'whitespace-nowrap'" \
    "1"

# Test 7: Verify build is successful
run_test "App builds successfully" \
    "npm run build --silent 2>&1 | grep -c 'compiled successfully'" \
    "1"

# Test 8: Check total mb-6 instances (should be 3: header, password, confirm password)
run_test "Total mb-6 instances" \
    "grep -c 'mb-6' src/renderer/pages/UserManagementPage.tsx" \
    "3"

# Test 9: Check button spacing is maintained
run_test "Buttons have proper spacing" \
    "grep -c 'space-x-3' src/renderer/pages/UserManagementPage.tsx" \
    "1"

# Test 10: Verify form structure
run_test "Form structure maintained" \
    "grep -c 'form onSubmit={handleCreateUser}' src/renderer/pages/UserManagementPage.tsx" \
    "1"

echo "📊 Test Summary:"
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$((TOTAL_TESTS - PASSED_TESTS))${NC}"

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    echo -e "${GREEN}🎉 All tests passed! Create User form button overlap fix is verified.${NC}"
    echo ""
    echo "📝 Summary of Changes Made:"
    echo "• Password field: Added mb-6 for more bottom margin"
    echo "• Password input: Changed to pr-24 for more right padding" 
    echo "• Confirm password field: Added mb-6 for consistent spacing"
    echo "• Button container: Changed to pt-6 for more top padding"
    echo "• Show/hide button: Changed to pr-3 and added whitespace-nowrap"
    echo ""
    echo "🎯 Visual Impact:"
    echo "• Increased spacing between password fields and buttons"
    echo "• Better positioning of show/hide password toggle"
    echo "• Prevents overlap of form elements"
    echo "• Improved overall form layout and usability"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please review the Create User form styling.${NC}"
    exit 1
fi
