#!/bin/bash

# Test script to verify User Management buttons are properly displayed and spaced

echo "👥 USER MANAGEMENT BUTTONS VERIFICATION"
echo "======================================="
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

TESTS_PASSED=0
TESTS_FAILED=0

# Function to print test result
print_test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "   ✅ ${GREEN}$2${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "   ❌ ${RED}$2${NC}"
        ((TESTS_FAILED++))
    fi
}

echo -e "${BLUE}📋 Checking User Management page buttons...${NC}"
echo

# Test 1: Check if all three buttons are present in the UserManagementPage
echo "1. Button Presence Check:"
BUTTON_COUNT=$(grep -c "px-3 py-1.5 text-xs font-semibold" src/renderer/pages/UserManagementPage.tsx)
if [ "$BUTTON_COUNT" -ge 3 ]; then
    print_test_result 0 "All three action buttons are present"
else
    print_test_result 1 "Missing action buttons (found $BUTTON_COUNT, expected at least 3)"
fi

# Test 2: Check for Deactivate/Activate button
echo "2. Deactivate/Activate Button Check:"
if grep -q "Deactivate.*Activate" src/renderer/pages/UserManagementPage.tsx; then
    print_test_result 0 "Deactivate/Activate button exists"
else
    print_test_result 1 "Deactivate/Activate button not found"
fi

# Test 3: Check for Reset Password button
echo "3. Reset Password Button Check:"
if grep -q "Reset Password" src/renderer/pages/UserManagementPage.tsx; then
    print_test_result 0 "Reset Password button exists"
else
    print_test_result 1 "Reset Password button not found"
fi

# Test 4: Check for Delete button
echo "4. Delete Button Check:"
if grep -q ">Delete<" src/renderer/pages/UserManagementPage.tsx; then
    print_test_result 0 "Delete button exists"
else
    print_test_result 1 "Delete button not found"
fi

# Test 5: Check for proper spacing (gap-4)
echo "5. Button Spacing Check:"
if grep -q "gap-4" src/renderer/pages/UserManagementPage.tsx; then
    print_test_result 0 "Proper button spacing (gap-4) is applied"
else
    print_test_result 1 "Button spacing not found"
fi

# Test 6: Check color classes for each button
echo "6. Button Color Styling Check:"
ORANGE_BUTTON=$(grep -c "bg-orange-500" src/renderer/pages/UserManagementPage.tsx)
GREEN_BUTTON=$(grep -c "bg-green-500" src/renderer/pages/UserManagementPage.tsx)
BLUE_BUTTON=$(grep -c "bg-blue-500" src/renderer/pages/UserManagementPage.tsx)
RED_BUTTON=$(grep -c "bg-red-500" src/renderer/pages/UserManagementPage.tsx)

if [ "$ORANGE_BUTTON" -ge 1 ] && [ "$GREEN_BUTTON" -ge 1 ] && [ "$BLUE_BUTTON" -ge 1 ] && [ "$RED_BUTTON" -ge 1 ]; then
    print_test_result 0 "All button colors are properly defined (orange, green, blue, red)"
else
    print_test_result 1 "Missing button color styling (orange:$ORANGE_BUTTON, green:$GREEN_BUTTON, blue:$BLUE_BUTTON, red:$RED_BUTTON)"
fi

# Test 7: Check handleDeleteUser function exists
echo "7. Delete Handler Function Check:"
if grep -q "handleDeleteUser.*async" src/renderer/pages/UserManagementPage.tsx; then
    print_test_result 0 "handleDeleteUser function exists"
else
    print_test_result 1 "handleDeleteUser function not found"
fi

# Test 8: Check IPC handler for delete-user
echo "8. Delete User IPC Handler Check:"
if grep -q "delete-user.*async" src/main/electron.js; then
    print_test_result 0 "delete-user IPC handler exists"
else
    print_test_result 1 "delete-user IPC handler not found"
fi

# Test 9: Check preload API exposure
echo "9. Delete User API Exposure Check:"
if grep -q "deleteUser.*userId" src/main/preload.js; then
    print_test_result 0 "deleteUser API is exposed in preload"
else
    print_test_result 1 "deleteUser API not exposed"
fi

# Test 10: Check TypeScript types
echo "10. Delete User Type Definition Check:"
if grep -q "deleteUser.*number.*Promise" src/types/electron-api.d.ts; then
    print_test_result 0 "deleteUser type definition exists"
else
    print_test_result 1 "deleteUser type definition not found"
fi

echo
echo -e "${BLUE}📊 Test Summary:${NC}"
echo -e "   ${GREEN}✅ Passed: $TESTS_PASSED${NC}"
echo -e "   ${RED}❌ Failed: $TESTS_FAILED${NC}"

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
SUCCESS_RATE=$((TESTS_PASSED * 100 / TOTAL_TESTS))
echo -e "   📈 Success Rate: ${SUCCESS_RATE}%"

echo
if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All User Management button tests passed!${NC}"
    echo -e "${GREEN}✅ Buttons should display with proper spacing and colors:${NC}"
    echo -e "   ${YELLOW}• Deactivate (orange) / Activate (green)${NC}"
    echo -e "   ${BLUE}• Reset Password (blue)${NC}"
    echo -e "   ${RED}• Delete (red)${NC}"
    echo -e "   ${GREEN}• gap-4 spacing between buttons${NC}"
else
    echo -e "${RED}⚠️  Some tests failed. Please check the issues above.${NC}"
fi

echo
echo -e "${YELLOW}💡 If buttons are still not visible, try:${NC}"
echo "1. Refresh the browser/restart the app"
echo "2. Check browser console for JavaScript errors"
echo "3. Verify you're logged in as an admin user"
echo "4. Check that users exist in the database"
