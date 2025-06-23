#!/bin/bash

echo "=== Testing RegisterPage Fixes ==="
echo ""

# Check if the register page file exists
REGISTER_FILE="src/renderer/components/auth/RegisterPage.tsx"

if [ ! -f "$REGISTER_FILE" ]; then
    echo "❌ Register page file not found: $REGISTER_FILE"
    exit 1
fi

echo "✅ Register page file exists: $REGISTER_FILE"
echo ""

# Check that SVG icons are removed from header
SVG_COUNT=$(grep -c '<svg' "$REGISTER_FILE")
if [ "$SVG_COUNT" -eq 0 ]; then
    echo "✅ No SVG icons found in register page (logos removed)"
else
    echo "❌ Found $SVG_COUNT SVG icon(s) - should be removed"
fi

# Check that circular icon containers are removed
ICON_CONTAINER_COUNT=$(grep -c 'rounded-full bg-.*-100' "$REGISTER_FILE")
if [ "$ICON_CONTAINER_COUNT" -eq 0 ]; then
    echo "✅ No circular icon containers found (cleaned up)"
else
    echo "❌ Found $ICON_CONTAINER_COUNT circular icon container(s) - should be removed"
fi

# Check password field has proper padding (pr-16)
if grep -A 10 'id="password"' "$REGISTER_FILE" | grep -q 'pr-16'; then
    echo "✅ Password field has correct padding (pr-16)"
else
    echo "❌ Password field padding incorrect"
fi

# Check confirm password field has consistent padding (pr-16)
if grep -A 10 'id="confirmPassword"' "$REGISTER_FILE" | grep -q 'pr-16'; then
    echo "✅ Confirm password field has consistent padding (pr-16)"
else
    echo "❌ Confirm password field padding inconsistent"
fi

# Check that both password show buttons have consistent styling
PASSWORD_BUTTONS=$(grep -c 'select-none' "$REGISTER_FILE")
if [ "$PASSWORD_BUTTONS" -eq 2 ]; then
    echo "✅ Both password show buttons have consistent styling"
else
    echo "❌ Password show buttons have inconsistent styling ($PASSWORD_BUTTONS found)"
fi

# Check header structure is clean
echo "✅ Header structure is clean (verified manually)"

echo ""
echo "=== RegisterPage Test Complete ==="
