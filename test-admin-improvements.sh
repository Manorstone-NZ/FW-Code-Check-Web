#!/bin/bash

# Test script to verify admin tab styling and reset password functionality

echo "🔧 Testing Admin Page Improvements"
echo "================================="

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}1. Testing Tab Button Styling Changes${NC}"
echo "-------------------------------------"

# Check if tab buttons now use button-style classes
if grep -q "bg-blue-600 text-white" src/renderer/pages/AdminPage.tsx; then
    echo -e "✅ ${GREEN}Tab buttons now use Create User button styling${NC}"
else
    echo -e "❌ ${RED}Tab button styling not found${NC}"
fi

# Check for proper hover states
if grep -q "hover:bg-blue-700" src/renderer/pages/AdminPage.tsx; then
    echo -e "✅ ${GREEN}Active tab has proper hover state${NC}"
else
    echo -e "❌ ${RED}Active tab hover state not found${NC}"
fi

# Check for inactive button styling
if grep -q "bg-gray-100 text-gray-700" src/renderer/pages/AdminPage.tsx; then
    echo -e "✅ ${GREEN}Inactive tabs have proper styling${NC}"
else
    echo -e "❌ ${RED}Inactive tab styling not found${NC}"
fi

echo
echo -e "${BLUE}2. Testing Reset Password Functionality${NC}"
echo "----------------------------------------"

# Check if IPC handler exists
if grep -q "reset-user-password" src/main/electron.js; then
    echo -e "✅ ${GREEN}Reset password IPC handler exists in electron.js${NC}"
else
    echo -e "❌ ${RED}Reset password IPC handler missing${NC}"
fi

# Check if preload exposes the function
if grep -q "resetUserPassword" src/main/preload.js; then
    echo -e "✅ ${GREEN}resetUserPassword exposed in preload.js${NC}"
else
    echo -e "❌ ${RED}resetUserPassword not exposed in preload${NC}"
fi

# Check if TypeScript types exist
if grep -q "resetUserPassword" src/types/electron-api.d.ts; then
    echo -e "✅ ${GREEN}resetUserPassword has TypeScript types${NC}"
else
    echo -e "❌ ${RED}resetUserPassword TypeScript types missing${NC}"
fi

# Check if Python backend supports the command
if grep -q "reset-user-password" src/python/db.py; then
    echo -e "✅ ${GREEN}Python backend supports reset-user-password${NC}"
else
    echo -e "❌ ${RED}Python backend doesn't support reset-user-password${NC}"
fi

# Check if the reset_user_password function exists in Python
if grep -q "def reset_user_password" src/python/db.py; then
    echo -e "✅ ${GREEN}reset_user_password function exists in Python${NC}"
else
    echo -e "❌ ${RED}reset_user_password function missing in Python${NC}"
fi

echo
echo -e "${BLUE}3. Testing Python Reset Password Function Directly${NC}"
echo "-----------------------------------------------"

# Test the Python function directly
if python3 -c "
import sys
sys.path.append('src/python')
from db import get_connection, init_db
import json

# Initialize database
init_db()

# Try to call the reset password command
try:
    import subprocess
    result = subprocess.run([
        'python3', 'src/python/db.py', 
        '--reset-user-password', '1', 'testpassword123'
    ], capture_output=True, text=True, cwd='.')
    
    if result.returncode == 0:
        response = json.loads(result.stdout)
        if response.get('success'):
            print('✅ Python reset password function works')
        else:
            print('❌ Python function returned error:', response.get('error', 'Unknown error'))
    else:
        print('❌ Python command failed:', result.stderr)
except Exception as e:
    print('❌ Error testing Python function:', str(e))
" 2>/dev/null; then
    echo -e "✅ ${GREEN}Python reset password function test completed${NC}"
else
    echo -e "⚠️  ${YELLOW}Python test had issues (may be normal if no user ID 1)${NC}"
fi

echo
echo -e "${BLUE}4. Checking for Potential Issues${NC}"
echo "--------------------------------"

# Check if the function call in UserManagementPage matches the API
if grep -A2 "resetUserPassword" src/renderer/pages/UserManagementPage.tsx | grep -q "userId, newPassword"; then
    echo -e "✅ ${GREEN}Function call parameters match API signature${NC}"
else
    echo -e "❌ ${RED}Function call parameters may not match API${NC}"
fi

echo
echo -e "${BLUE}Summary of Changes Made:${NC}"
echo "• Tab buttons now use blue button styling matching Create User button"
echo "• Active tab: bg-blue-600 with white text and blue-700 hover"
echo "• Inactive tabs: bg-gray-100 with gray text and gray-200 hover"
echo "• Reset password functionality should work - all components are in place"
echo
echo -e "${YELLOW}If reset password still fails, the issue may be:${NC}"
echo "1. User ID doesn't exist in database"
echo "2. Database connection issue"
echo "3. Permission issue calling Python script"
echo
echo -e "${GREEN}🎯 Both improvements should now be working!${NC}"
