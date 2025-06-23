#!/bin/bash

# Comprehensive logo loading diagnostic test

echo "🔍 LOGO LOADING DIAGNOSTIC"
echo "=========================="
echo

# Colors for output  
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}1. File System Check${NC}"
echo "===================="
echo "Logo files in public/:"
ls -la public/firstwatch* 2>/dev/null || echo "No logo files found"
echo

echo "Logo files in assets/:"
ls -la src/renderer/assets/ 2>/dev/null || echo "No assets directory or files"
echo

echo -e "${BLUE}2. HTTP Accessibility Check${NC}" 
echo "==========================="
echo "Testing logo accessibility via HTTP:"

if curl -s -I http://localhost:3000/firstwatch-logo-2.png | head -1 | grep -q "200 OK"; then
    echo -e "✅ ${GREEN}Original logo accessible at /firstwatch-logo-2.png${NC}"
else
    echo -e "❌ ${RED}Original logo NOT accessible at /firstwatch-logo-2.png${NC}"
fi

# Check for webpack hashed version
HASHED_LOGO=$(ls public/ | grep -E '^[0-9a-f]+\.png$' | head -1)
if [ -n "$HASHED_LOGO" ]; then
    echo "Testing hashed logo: $HASHED_LOGO"
    if curl -s -I "http://localhost:3000/$HASHED_LOGO" | head -1 | grep -q "200 OK"; then
        echo -e "✅ ${GREEN}Hashed logo accessible at /$HASHED_LOGO${NC}"
    else
        echo -e "❌ ${RED}Hashed logo NOT accessible at /$HASHED_LOGO${NC}"
    fi
else
    echo -e "ℹ️  ${YELLOW}No webpack hashed logo found${NC}"
fi
echo

echo -e "${BLUE}3. Component Implementation Check${NC}"
echo "================================="
echo "Current Sidebar logo implementation:"
grep -A3 -B1 "<img" src/renderer/components/Sidebar.tsx || echo "No img tag found"
echo

echo -e "${BLUE}4. Webpack Configuration Check${NC}"
echo "=============================="
echo "Webpack image handling:"
if grep -A5 -B2 "asset/resource" webpack.config.js; then
    echo -e "✅ ${GREEN}Webpack configured for image assets${NC}"
else
    echo -e "❌ ${RED}Webpack image asset handling not found${NC}"
fi
echo

echo -e "${BLUE}5. Build Output Analysis${NC}"
echo "======================="
echo "Recent build files:"
ls -lt public/ | head -5
echo

echo -e "${BLUE}6. Development vs Production Check${NC}"
echo "=================================="
if pgrep -f "webpack-dev-server" > /dev/null; then
    echo -e "🔧 ${YELLOW}webpack-dev-server is running (development mode)${NC}"
elif pgrep -f "electron" > /dev/null; then
    echo -e "📦 ${BLUE}Electron is running${NC}" 
    if [ -f "public/bundle.js" ]; then
        echo -e "✅ ${GREEN}Production build exists${NC}"
    else
        echo -e "❌ ${RED}No production build found${NC}"
    fi
else
    echo -e "❌ ${RED}No development server or electron process found${NC}"
fi
echo

echo -e "${BLUE}💡 Recommendations:${NC}"
echo "=================="
echo "Based on the diagnostic results:"
echo "1. If original logo is accessible via HTTP, use absolute path: /firstwatch-logo-2.png"
echo "2. If only hashed version works, webpack import is needed"
echo "3. Check browser console for actual loading errors"
echo "4. Verify file permissions allow web server access"
echo "5. Consider file:// protocol issues in Electron"
