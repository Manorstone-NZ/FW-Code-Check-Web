#!/bin/bash

# Test script to verify that the "LLM Result (first 500 chars)" panel has been removed from AnalysisDetails

echo "🧹 Testing LLM Result Panel Removal from AnalysisDetails"
echo "================================================================"

# Check if the "LLM Result (first 500 chars)" text exists in AnalysisDetails
if grep -q "LLM Result.*first 500" "src/renderer/components/AnalysisDetails.tsx"; then
    echo "❌ FAIL: 'LLM Result (first 500 chars)' text still found in AnalysisDetails.tsx"
    exit 1
else
    echo "✅ PASS: 'LLM Result (first 500 chars)' text successfully removed"
fi

# Check if any reference to .slice(0, 500) exists in AnalysisDetails
if grep -q "\.slice(0, 500)" "src/renderer/components/AnalysisDetails.tsx"; then
    echo "❌ FAIL: '.slice(0, 500)' code still found in AnalysisDetails.tsx"
    exit 1
else
    echo "✅ PASS: '.slice(0, 500)' code successfully removed"
fi

# Check if any reference to "bg-blue-50" for LLM preview still exists
if grep -B2 -A2 "bg-blue-50" "src/renderer/components/AnalysisDetails.tsx" | grep -q "LLM"; then
    echo "❌ FAIL: LLM preview panel with 'bg-blue-50' styling still found"
    exit 1
else
    echo "✅ PASS: LLM preview panel styling successfully removed"
fi

# Verify the file still compiles without syntax errors
echo "🔍 Checking for TypeScript compilation errors..."
if npx tsc --noEmit --project tsconfig.json 2>&1 | grep -q "AnalysisDetails.tsx"; then
    echo "❌ FAIL: TypeScript compilation errors found in AnalysisDetails.tsx"
    npx tsc --noEmit --project tsconfig.json 2>&1 | grep "AnalysisDetails.tsx"
    exit 1
else
    echo "✅ PASS: No TypeScript compilation errors in AnalysisDetails.tsx"
fi

# Verify webpack build still works
echo "🔍 Checking webpack build..."
if npm run build >/dev/null 2>&1; then
    echo "✅ PASS: Webpack build successful after panel removal"
else
    echo "❌ FAIL: Webpack build failed after panel removal"
    exit 1
fi

echo ""
echo "🎉 ALL TESTS PASSED: LLM Result panel successfully removed from AnalysisDetails!"
echo "================================================================"
echo "✅ Panel removal complete"
echo "✅ No compilation errors"
echo "✅ Build still works"
echo ""
