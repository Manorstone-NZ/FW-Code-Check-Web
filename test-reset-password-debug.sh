#!/bin/bash

# Test script to debug Reset Password functionality

echo "🔍 Reset Password Debug Test"
echo "============================"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}1. Checking if debugging code was added${NC}"
echo "---------------------------------------"

# Check if console.log debugging was added
if grep -q "console.log('handleResetPassword called" src/renderer/pages/UserManagementPage.tsx; then
    echo -e "✅ ${GREEN}Debug logging added to handleResetPassword${NC}"
else
    echo -e "❌ ${RED}Debug logging not found${NC}"
fi

# Check if button click logging was added
if grep -q "console.log('Reset password button clicked!" src/renderer/pages/UserManagementPage.tsx; then
    echo -e "✅ ${GREEN}Debug logging added to button click${NC}" 
else
    echo -e "❌ ${RED}Button click logging not found${NC}"
fi

# Check if preventDefault/stopPropagation was added
if grep -q "e.preventDefault()" src/renderer/pages/UserManagementPage.tsx; then
    echo -e "✅ ${GREEN}Event prevention added${NC}"
else
    echo -e "❌ ${RED}Event prevention not found${NC}"
fi

echo
echo -e "${BLUE}2. Checking IPC chain integrity${NC}"
echo "------------------------------"

# Check electron.js handler
if grep -A2 "reset-user-password" src/main/electron.js | grep -q "createPythonHandler"; then
    echo -e "✅ ${GREEN}Electron IPC handler exists${NC}"
else
    echo -e "❌ ${RED}Electron IPC handler missing${NC}"
fi

# Check preload.js exposure
if grep -q "resetUserPassword:" src/main/preload.js; then
    echo -e "✅ ${GREEN}Preload function exposed${NC}"
else
    echo -e "❌ ${RED}Preload function not exposed${NC}"
fi

echo
echo -e "${BLUE}3. Testing Python backend directly${NC}"
echo "--------------------------------"

# Create a test user if none exists and test reset
python3 -c "
import sys
sys.path.append('src/python')
from db import init_db, create_user, reset_user_password
import json

# Initialize database
init_db()

# Try to create a test user
try:
    result = create_user('testuser', 'test@example.com', 'oldpassword123', 'user')
    if result.get('success'):
        print('✅ Test user created successfully')
        user_id = result.get('user_id', 1)
    else:
        print('⚠️  Test user may already exist, using ID 1')
        user_id = 1
        
    # Test password reset
    reset_result = reset_user_password(user_id, 'newpassword123')
    if reset_result.get('success'):
        print('✅ Password reset function works')
    else:
        print('❌ Password reset failed:', reset_result.get('error'))
        
except Exception as e:
    print('❌ Python test error:', str(e))
" 2>/dev/null || echo -e "⚠️  ${YELLOW}Python test had issues (database may not be initialized)${NC}"

echo
echo -e "${BLUE}4. Instructions for debugging${NC}"
echo "-----------------------------"
echo -e "${YELLOW}To debug the Reset Password button:${NC}"
echo "1. Open the Electron app (should be running)"
echo "2. Navigate to Admin → User Management"
echo "3. Open Developer Tools (Ctrl+Shift+I or Cmd+Option+I)"
echo "4. Go to the Console tab"
echo "5. Click the 'Reset Password' button for any user"
echo "6. Check the console for debug messages:"
echo "   - 'Reset password button clicked!' should appear immediately"
echo "   - 'handleResetPassword called with:' should appear next"
echo "   - A password prompt should appear"
echo "   - After entering password, more debug messages should appear"
echo
echo -e "${GREEN}If you see no console messages when clicking the button, the issue is:${NC}"
echo "• Button click handler is not firing (JavaScript error)"
echo "• Button is disabled"
echo "• Event is being prevented somewhere else"
echo
echo -e "${GREEN}If you see button click messages but no handleResetPassword messages:${NC}"
echo "• Function is not being called properly"
echo "• Event propagation issue"
echo
echo -e "${GREEN}If you see function messages but no prompt:${NC}"
echo "• window.prompt is being blocked"
echo "• JavaScript error in the function"

echo
echo -e "${BLUE}Dev server is running at: http://localhost:3000${NC}"
echo -e "${YELLOW}App should automatically reload with debug changes${NC}"
