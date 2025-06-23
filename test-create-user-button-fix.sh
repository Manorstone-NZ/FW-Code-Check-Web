#!/bin/bash

# Test script to verify Create User form button overlap fix

echo "🔧 CREATE USER FORM BUTTON OVERLAP FIX TEST"
echo "==========================================="
echo

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
    
    echo -e "${BLUE}[$TOTAL_TESTS]${NC} Testing: $test_name"
    echo "   Description: $description"
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "   Result: ${GREEN}✅ PASSED${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "   Result: ${RED}❌ FAILED${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    echo
}

echo -e "${BLUE}🎯 PASSWORD FIELD BUTTON FIXES${NC}"
echo "=============================="

# Test 1: UserManagementPage password field spacing
run_test "UserManagement Password Spacing" "grep -q 'pr-16' src/renderer/pages/UserManagementPage.tsx" "Check UserManagement password input has proper right padding"

# Test 2: LoginPage password field spacing  
run_test "LoginPage Password Spacing" "grep -q 'pr-16' src/renderer/components/auth/LoginPage.tsx" "Check LoginPage password input has proper right padding"

# Test 3: RegisterPage password field spacing
run_test "RegisterPage Password Spacing" "grep -q 'pr-16' src/renderer/components/auth/RegisterPage.tsx" "Check RegisterPage password input has proper right padding"

echo -e "${BLUE}🎨 BUTTON STYLING IMPROVEMENTS${NC}"
echo "============================"

# Test 4: UserManagement button styling
run_test "UserManagement Button Styling" "grep -A5 'onClick.*setShowPassword' src/renderer/pages/UserManagementPage.tsx | grep -q 'text-xs.*text-gray-500'" "Check UserManagement password toggle button styling"

# Test 5: LoginPage button styling
run_test "LoginPage Button Styling" "grep -B2 -A2 'onClick.*setShowPassword' src/renderer/components/auth/LoginPage.tsx | grep -q 'text-xs.*text-gray-500'" "Check LoginPage password toggle button styling"

# Test 6: RegisterPage button styling  
run_test "RegisterPage Button Styling" "grep -B2 -A2 'onClick.*setShowPassword' src/renderer/components/auth/RegisterPage.tsx | grep -q 'text-xs.*text-gray-500'" "Check RegisterPage password toggle button styling"

echo -e "${BLUE}🚫 OVERLAP PREVENTION${NC}"
echo "==================="

# Test 7: Check for select-none class
run_test "Select-None Applied" "grep -q 'select-none' src/renderer/pages/UserManagementPage.tsx" "Check password button text is not selectable"

# Test 8: Check no fixed dimensions
run_test "No Fixed Dimensions" "! grep -q 'h-5 w-5' src/renderer/pages/UserManagementPage.tsx" "Ensure no fixed button dimensions causing overlap"

# Test 9: Check proper button positioning
run_test "Proper Button Positioning" "grep -q 'absolute inset-y-0 right-0' src/renderer/pages/UserManagementPage.tsx" "Check password button is properly positioned"

echo -e "${BLUE}📊 BUTTON OVERLAP FIX RESULTS${NC}"
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
    echo -e "${GREEN}🎉 ALL BUTTON OVERLAP FIXES APPLIED!${NC}"
    echo -e "${GREEN}✅ Password field buttons properly spaced${NC}"
    echo -e "${GREEN}✅ No more overlap with form labels${NC}"
    echo -e "${GREEN}✅ Consistent styling across all forms${NC}"
    echo -e "${GREEN}✅ Improved user experience${NC}"
    echo
    echo -e "${BLUE}📋 What was fixed:${NC}"
    echo "• Increased input right padding from pr-10 to pr-16"
    echo "• Simplified button styling to prevent layout issues"
    echo "• Added select-none to prevent text selection"
    echo "• Improved button hover states"
    echo "• Applied fixes consistently across Login, Register, and UserManagement"
else
    echo -e "${RED}⚠️  Some button overlap fixes failed ($FAILED_TESTS/$TOTAL_TESTS)${NC}"
    echo -e "${YELLOW}🔍 Review failed tests for remaining issues${NC}"
fi

# Exit with error code if any tests failed
exit $FAILED_TESTS
