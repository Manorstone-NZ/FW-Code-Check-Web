#!/bin/bash

echo "=== Testing Login Page Structure ==="
echo ""

# Check if the login page file exists and has the correct structure
LOGIN_FILE="src/renderer/components/auth/LoginPage.tsx"

if [ ! -f "$LOGIN_FILE" ]; then
    echo "❌ Login page file not found: $LOGIN_FILE"
    exit 1
fi

echo "✅ Login page file exists: $LOGIN_FILE"
echo ""

# Check for logo placement (should be first in header)
if grep -A 10 "Header" "$LOGIN_FILE" | grep -q "firstwatch-logo.jpg"; then
    echo "✅ Logo is present in header section"
else
    echo "❌ Logo not found in header section"
fi

# Check for logo size (should be h-24 w-24)
if grep -q "h-24 w-24" "$LOGIN_FILE"; then
    echo "✅ Logo has correct size (h-24 w-24)"
else
    echo "❌ Logo size not correct"
fi

# Check for subtitle as header (should be h2 with "Secure PLC Code Analysis Platform")
if grep -A 2 '<h2' "$LOGIN_FILE" | grep -q "Secure PLC Code Analysis Platform"; then
    echo "✅ Subtitle is correctly formatted as h2 header"
else
    echo "❌ Subtitle not found as h2 header"
fi

# Check that logo comes before subtitle in the structure
LOGO_LINE=$(grep -n "firstwatch-logo.jpg" "$LOGIN_FILE" | cut -d: -f1)
SUBTITLE_LINE=$(grep -n "Secure PLC Code Analysis Platform" "$LOGIN_FILE" | cut -d: -f1)

if [ "$LOGO_LINE" -lt "$SUBTITLE_LINE" ]; then
    echo "✅ Logo appears before subtitle (correct order)"
else
    echo "❌ Logo does not appear before subtitle"
fi

# Check that there's no main heading (h1 with title other than the subtitle)
MAIN_HEADINGS=$(grep -c '<h1' "$LOGIN_FILE")
if [ "$MAIN_HEADINGS" -eq 0 ]; then
    echo "✅ No main heading found (as requested)"
else
    echo "❌ Found $MAIN_HEADINGS main heading(s) - should be removed"
fi

echo ""
echo "=== Login Page Structure Test Complete ==="
