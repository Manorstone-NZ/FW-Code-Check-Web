#!/bin/bash

echo "=== Testing Password Field Button Overlap Fix ==="
echo ""

# Check RegisterPage password field spacing
REGISTER_FILE="src/renderer/components/auth/RegisterPage.tsx"
LOGIN_FILE="src/renderer/components/auth/LoginPage.tsx"

echo "Checking RegisterPage password field spacing..."

# Check password field has pr-28 padding
if grep -q "pr-28" "$REGISTER_FILE"; then
    echo "✅ Password fields have correct padding (pr-28)"
else
    echo "❌ Password field padding not found"
fi

# Check password buttons have pr-6 padding
if grep -B 2 -A 2 "SHOW\|HIDE" "$REGISTER_FILE" | grep -q "pr-6"; then
    echo "✅ Password buttons have correct padding (pr-6)"
else
    echo "❌ Password button padding not found"
fi

echo ""
echo "Checking LoginPage password field spacing..."

# Check login password field has pr-28 padding
if grep -q "pr-28" "$LOGIN_FILE"; then
    echo "✅ Login password field has correct padding (pr-28)"
else
    echo "❌ Login password field padding not found"
fi

# Check login password button has pr-6 padding
if grep -B 2 -A 2 "SHOW\|HIDE" "$LOGIN_FILE" | grep -q "pr-6"; then
    echo "✅ Login password button has correct padding (pr-6)"
else
    echo "❌ Login password button padding not found"
fi

echo ""
echo "=== Password Field Spacing Test Complete ==="
echo "The pr-28 padding (7rem right padding) should provide enough space"
echo "for the SHOW/HIDE buttons to not overlap with input text."
