#!/bin/bash

# Script to clean up debug code from Reset Password functionality

echo "🧹 Cleaning up Reset Password debug code..."

# Remove debug console.log statements from handleResetPassword
sed -i '' '/console.log.*handleResetPassword called/d' src/renderer/pages/UserManagementPage.tsx
sed -i '' '/console.log.*Password entered/d' src/renderer/pages/UserManagementPage.tsx
sed -i '' '/console.log.*Setting loading state/d' src/renderer/pages/UserManagementPage.tsx
sed -i '' '/console.log.*Calling electronAPI/d' src/renderer/pages/UserManagementPage.tsx
sed -i '' '/console.log.*Reset password result/d' src/renderer/pages/UserManagementPage.tsx
sed -i '' '/console.error.*Reset password error/d' src/renderer/pages/UserManagementPage.tsx
sed -i '' '/console.log.*Clearing loading state/d' src/renderer/pages/UserManagementPage.tsx

# Remove debug code from button click handler and restore simple onClick
sed -i '' 's/onClick={(e) => {/onClick={() => {/' src/renderer/pages/UserManagementPage.tsx
sed -i '' '/console.log.*Reset password button clicked/d' src/renderer/pages/UserManagementPage.tsx
sed -i '' '/e.preventDefault();/d' src/renderer/pages/UserManagementPage.tsx
sed -i '' '/e.stopPropagation();/d' src/renderer/pages/UserManagementPage.tsx
sed -i '' 's/onClick={() => {[[:space:]]*handleResetPassword(user.id, user.username);[[:space:]]*}}/onClick={() => handleResetPassword(user.id, user.username)}/' src/renderer/pages/UserManagementPage.tsx

echo "✅ Debug code cleaned up!"
echo "The Reset Password functionality should now work normally without debug messages."
