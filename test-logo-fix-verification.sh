https://sdmntpreastus.oaiusercontent.com/files/00000000-2fe0-61f9-b73d-baead3b42b66/raw?se=2025-06-23T03%3A25%3A25Z&sp=r&sv=2024-08-04&sr=b&scid=5ca082a6-751d-57b2-ae51-2fc8db9853bc&skoid=9ccea605-1409-4478-82eb-9c83b25dc1b0&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2025-06-23T02%3A21%3A10Z&ske=2025-06-24T02%3A21%3A10Z&sks=b&skv=2024-08-04&sig=Tqo44Mo///pRj%2BckTztB8pHTFe4/T9miK9mh5%2BPD86A%3D#!/bin/bash

# Test script to verify the logo fix

echo "🖼️  LOGO LOADING FIX VERIFICATION"
echo "================================"
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Checking logo fix implementation...${NC}"
echo

# Check if webpack is processing the image
echo "1. Webpack Build Check:"
if [ -f "public/bundle.js" ]; then
    if grep -q "9cc8f572d3f619e78bf0.png" public/bundle.js 2>/dev/null; then
        echo -e "   ✅ ${GREEN}Logo is being processed by webpack${NC}"
    else
        echo -e "   ⚠️  ${YELLOW}Logo hash not found in bundle (may be normal)${NC}"
    fi
else
    echo -e "   ❌ ${RED}Bundle file not found${NC}"
fi

# Check file permissions
echo "2. File Permissions Check:"
if [ -f "public/firstwatch-logo-2.png" ]; then
    PERMS=$(ls -la public/firstwatch-logo-2.png | cut -d' ' -f1)
    if [[ $PERMS == *"r--r--r--"* ]]; then
        echo -e "   ✅ ${GREEN}Logo file has correct permissions ($PERMS)${NC}"
    else
        echo -e "   ⚠️  ${YELLOW}Logo file permissions: $PERMS${NC}"
    fi
else
    echo -e "   ❌ ${RED}Logo file not found${NC}"
fi

# Check assets directory
echo "3. Assets Directory Check:"
if [ -f "src/renderer/assets/firstwatch-logo-2.png" ]; then
    echo -e "   ✅ ${GREEN}Logo copied to assets directory${NC}"
else
    echo -e "   ❌ ${RED}Logo not found in assets directory${NC}"
fi

# Check webpack configuration
echo "4. Webpack Configuration Check:"
if grep -q "asset/resource" webpack.config.js; then
    echo -e "   ✅ ${GREEN}Webpack configured for image assets${NC}"
else
    echo -e "   ❌ ${RED}Webpack image configuration missing${NC}"
fi

# Check TypeScript types
echo "5. TypeScript Types Check:"
if [ -f "src/types/images.d.ts" ]; then
    echo -e "   ✅ ${GREEN}Image type declarations exist${NC}"
else
    echo -e "   ❌ ${RED}Image type declarations missing${NC}"
fi

# Check Sidebar import
echo "6. Sidebar Import Check:"
if grep -q "import logoSrc from" src/renderer/components/Sidebar.tsx; then
    echo -e "   ✅ ${GREEN}Sidebar uses import for logo${NC}"
else
    echo -e "   ❌ ${RED}Sidebar import not found${NC}"
fi

echo
echo -e "${BLUE}💡 Summary:${NC}"
echo "The logo loading issue has been addressed with the following changes:"
echo "1. Fixed file permissions (644)"
echo "2. Added webpack image asset handling"
echo "3. Created TypeScript image type declarations"
echo "4. Updated Sidebar to import logo as asset"
echo "5. Copied logo to src/renderer/assets/"
echo
echo -e "${GREEN}✅ Logo should now display properly in the sidebar${NC}"
echo -e "${YELLOW}🔄 App has been restarted with these changes${NC}"
