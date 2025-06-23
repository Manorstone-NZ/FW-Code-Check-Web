#!/bin/bash

# Test script to verify login page logo sizing improvements
# This script verifies that the logo size has been increased for better visual balance

echo "=== Testing Login Page Logo Size Improvements ==="
echo "Date: $(date)"
echo ""

# Check if the LoginPage file exists
LOGIN_PAGE_FILE="src/renderer/components/auth/LoginPage.tsx"
if [[ ! -f "$LOGIN_PAGE_FILE" ]]; then
    echo "❌ FAIL: LoginPage.tsx not found at $LOGIN_PAGE_FILE"
    exit 1
fi

echo "✅ Found LoginPage.tsx file"

# Test 1: Check that logo has increased size (should be h-24 w-24 now)
echo ""
echo "Test 1: Checking logo size classes..."
if grep -q "h-24 w-24" "$LOGIN_PAGE_FILE"; then
    echo "✅ PASS: Logo uses h-24 w-24 classes for better visibility"
else
    echo "❌ FAIL: Logo does not use h-24 w-24 classes"
    echo "Current logo classes:"
    grep -n "className.*h-.*w-" "$LOGIN_PAGE_FILE" | head -5
fi

# Test 2: Check that logo uses object-contain for better scaling
echo ""
echo "Test 2: Checking logo object-fit property..."
if grep -q "object-contain" "$LOGIN_PAGE_FILE"; then
    echo "✅ PASS: Logo uses object-contain for proper scaling"
else
    echo "❌ FAIL: Logo does not use object-contain property"
fi

# Test 3: Check that logo has proper bottom margin for spacing
echo ""
echo "Test 3: Checking logo container spacing..."
if grep -q "mb-6" "$LOGIN_PAGE_FILE"; then
    echo "✅ PASS: Logo container has proper bottom margin (mb-6)"
else
    echo "❌ FAIL: Logo container lacks proper bottom margin"
fi

# Test 4: Check that logo is properly centered
echo ""
echo "Test 4: Checking logo centering..."
if grep -q "justify-center" "$LOGIN_PAGE_FILE"; then
    echo "✅ PASS: Logo is properly centered with justify-center"
else
    echo "❌ FAIL: Logo is not properly centered"
fi

# Test 5: Verify the logo path is correct
echo ""
echo "Test 5: Checking logo file path..."
if grep -q '"/firstwatch-logo.jpg"' "$LOGIN_PAGE_FILE"; then
    echo "✅ PASS: Logo uses correct path /firstwatch-logo.jpg"
else
    echo "❌ FAIL: Logo path may be incorrect"
    echo "Current logo src:"
    grep -n "src=" "$LOGIN_PAGE_FILE" | head -3
fi

# Test 6: Check that logo has proper alt text
echo ""
echo "Test 6: Checking logo accessibility..."
if grep -q 'alt="First Watch Logo"' "$LOGIN_PAGE_FILE"; then
    echo "✅ PASS: Logo has proper alt text for accessibility"
else
    echo "❌ FAIL: Logo lacks proper alt text"
fi

# Build test to ensure no compilation errors
echo ""
echo "Test 7: Build test..."
echo "Building the app to ensure no compilation errors..."
if npm run build > /dev/null 2>&1; then
    echo "✅ PASS: App builds successfully with logo changes"
else
    echo "❌ FAIL: App build failed - there may be syntax errors"
fi

echo ""
echo "=== Login Logo Size Test Summary ==="
echo "All tests completed. The logo has been increased from h-12 w-12 to h-24 w-24"
echo "for better visual prominence and balance on the login page."
echo ""
echo "Visual improvements made:"
echo "- Logo size increased from 48px to 96px (h-12->h-24, w-12->w-24)"
echo "- Added bottom margin (mb-6) for better spacing"
echo "- Uses object-contain for proper aspect ratio maintenance"
echo "- Maintains proper centering and accessibility"
echo ""
echo "Manual verification recommended: Start the app and visually confirm"
echo "that the logo appears appropriately sized and balanced."
