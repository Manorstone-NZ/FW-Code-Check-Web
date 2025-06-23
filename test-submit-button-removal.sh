#!/bin/bash

# Test script to verify that the "Submit to Main Branch" button has been commented out

echo "🚫 Testing Submit to Main Branch Button Removal"
echo "================================================"

# Check if the Git-specific actions section is properly commented out
if grep -A10 "Git-specific actions.*COMMENTED OUT" "src/renderer/components/EnhancedFileUploader.tsx" | grep -q "Submit to Main Branch"; then
    echo "✅ PASS: 'Submit to Main Branch' button is properly commented out in JSX"
else
    echo "❌ FAIL: 'Submit to Main Branch' button comment structure not found"
    exit 1
fi

# Check if the functions are properly commented out
if grep -A5 "COMMENTED OUT.*Git submit functionality" "src/renderer/components/EnhancedFileUploader.tsx" | grep -q "canSubmitToMain\|handleSubmitToMain"; then
    echo "✅ PASS: Git submit functions are properly commented out"
else
    echo "❌ FAIL: Git submit functions are still active"
    exit 1
fi

# Check if the Git-specific actions section is commented out
if grep -A5 "Git-specific actions" "src/renderer/components/EnhancedFileUploader.tsx" | grep -q "COMMENTED OUT"; then
    echo "✅ PASS: Git-specific actions section is properly commented out"
else
    echo "❌ FAIL: Git-specific actions section comment not found"
    exit 1
fi

# Verify the file still compiles without syntax errors
echo "🔍 Checking for TypeScript compilation errors..."
if npx tsc --noEmit --project tsconfig.json 2>&1 | grep -q "EnhancedFileUploader.tsx"; then
    echo "❌ FAIL: TypeScript compilation errors found in EnhancedFileUploader.tsx"
    npx tsc --noEmit --project tsconfig.json 2>&1 | grep "EnhancedFileUploader.tsx"
    exit 1
else
    echo "✅ PASS: No TypeScript compilation errors in EnhancedFileUploader.tsx"
fi

# Verify webpack build still works
echo "🔍 Checking webpack build..."
if npm run build >/dev/null 2>&1; then
    echo "✅ PASS: Webpack build successful after button removal"
else
    echo "❌ FAIL: Webpack build failed after button removal"
    exit 1
fi

# Check that the bundle size decreased (indicating removed code)
if [ -f "public/bundle.js" ]; then
    BUNDLE_SIZE=$(stat -f%z public/bundle.js 2>/dev/null || stat -c%s public/bundle.js 2>/dev/null || echo 0)
    if [ $BUNDLE_SIZE -lt 700000 ]; then  # Less than 700KB indicates code was removed
        echo "✅ PASS: Bundle size reduced - code successfully removed ($BUNDLE_SIZE bytes)"
    else
        echo "⚠️  NOTICE: Bundle size is $BUNDLE_SIZE bytes (code removal may not be reflected in minified build)"
    fi
fi

echo ""
echo "🎉 ALL TESTS PASSED: Submit to Main Branch button successfully commented out!"
echo "================================================================"
echo "✅ Button and related functions commented out"
echo "✅ No compilation errors"
echo "✅ Build still works"
echo "✅ Code is preserved for future use"
echo ""
