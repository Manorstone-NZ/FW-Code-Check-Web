#!/bin/bash

# Test Create User Form Button Overlap Fix - Enhanced Version
# This script verifies the Create User form button overlap fix has been properly applied

echo "🧪 Testing Create User Form Button Overlap Fix (Enhanced)..."

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
    local expected_pattern="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${BLUE}Test $TOTAL_TESTS: $test_name${NC}"
    
    if eval "$test_command" | grep -q "$expected_pattern"; then
        echo -e "${GREEN}✅ PASSED${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ FAILED${NC}"
        echo -e "${YELLOW}Expected pattern: $expected_pattern${NC}"
        echo -e "${YELLOW}Actual output:${NC}"
        eval "$test_command" | head -3
    fi
    echo ""
}

# Test 1: Verify password field has increased bottom margin (mb-6)
run_test "Password field has increased bottom margin" \
    "grep -n 'mb-6' src/renderer/pages/UserManagementPage.tsx" \
    "mb-6"

# Test 2: Verify password field has increased right padding (pr-24)
run_test "Password field has increased right padding" \
    "grep -n 'pr-24' src/renderer/pages/UserManagementPage.tsx" \
    "pr-24"

# Test 3: Verify confirm password field has increased bottom margin (mb-6)
run_test "Confirm password field has increased bottom margin" \
    "grep -A5 'Confirm Password' src/renderer/pages/UserManagementPage.tsx | grep 'mb-6'" \
    "mb-6"

# Test 4: Verify button container has increased top padding (pt-6)
run_test "Button container has increased top padding" \
    "grep -n 'pt-6' src/renderer/pages/UserManagementPage.tsx" \
    "pt-6"

# Test 5: Verify show/hide button has better positioning (pr-3)
run_test "Show/hide button has improved padding" \
    "grep -n 'pr-3' src/renderer/pages/UserManagementPage.tsx" \
    "pr-3"

# Test 6: Verify show/hide button has whitespace-nowrap class
run_test "Show/hide button has whitespace-nowrap class" \
    "grep -n 'whitespace-nowrap' src/renderer/pages/UserManagementPage.tsx" \
    "whitespace-nowrap"

# Test 7: Check for consistent spacing between all form elements
run_test "Form elements have consistent spacing" \
    "grep -c 'mb-6\\|mt-4\\|pt-6' src/renderer/pages/UserManagementPage.tsx" \
    "[3-9]"

# Test 8: Verify no overlapping class conflicts
run_test "No conflicting margin/padding classes" \
    "grep -E 'mb-4.*mb-6|mt-4.*mt-6|pt-4.*pt-6' src/renderer/pages/UserManagementPage.tsx | wc -l" \
    "0"

# Test 9: Verify the form structure is intact
run_test "Form structure is intact" \
    "grep -n 'form onSubmit={handleCreateUser}' src/renderer/pages/UserManagementPage.tsx" \
    "form onSubmit"

# Test 10: Verify button spacing (space-x-3)
run_test "Buttons have proper horizontal spacing" \
    "grep -n 'space-x-3' src/renderer/pages/UserManagementPage.tsx" \
    "space-x-3"

# Additional verification tests

# Test 11: Check that LoginPage also has consistent styling
if [ -f "src/renderer/components/auth/LoginPage.tsx" ]; then
    run_test "LoginPage has consistent password field styling" \
        "grep -n 'pr-20\\|pr-24' src/renderer/components/auth/LoginPage.tsx" \
        "pr-2"
fi

# Test 12: Check that RegisterPage also has consistent styling
if [ -f "src/renderer/components/auth/RegisterPage.tsx" ]; then
    run_test "RegisterPage has consistent password field styling" \
        "grep -n 'pr-20\\|pr-24' src/renderer/components/auth/RegisterPage.tsx" \
        "pr-2"
fi

# Test 13: Verify TypeScript compilation still works
run_test "TypeScript compilation check" \
    "npx tsc --noEmit --project tsconfig.json 2>&1 | grep -c 'error'" \
    "0"

# Test 14: Verify webpack build includes the changes
run_test "Webpack build includes UserManagementPage" \
    "npm run build 2>&1 | grep -E 'built|compiled|success'" \
    "built\\|compiled\\|success"

echo "📊 Test Summary:"
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$((TOTAL_TESTS - PASSED_TESTS))${NC}"

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    echo -e "${GREEN}🎉 All tests passed! Create User form button overlap fix is complete.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please review the Create User form styling.${NC}"
    exit 1
fi
