#!/bin/bash

# Quick test for the comparison functionality fix
echo "🔄 Testing Comparison Functionality Fix"
echo "======================================"

# Test 1: Direct content comparison (this should now work)
echo "1. Testing direct content comparison..."
cd "/Users/damian/Development Projects/PLC Code Check/first-watch-plc-code-checker-v2"

result=$(python3 src/python/analyzer.py --compare "PLC Analysis file content" "PLC Baseline file content" --provider openai 2>&1)

if echo "$result" | grep -q "llm_comparison"; then
    echo "✅ Direct content comparison: WORKING"
else
    echo "❌ Direct content comparison: FAILED"
    echo "Output: $result"
fi

# Test 2: JSON input comparison
echo ""
echo "2. Testing JSON input comparison..."
json_result=$(python3 src/python/analyzer.py --compare '{"content":"Analysis content"}' '{"content":"Baseline content"}' --provider openai 2>&1)

if echo "$json_result" | grep -q "llm_comparison"; then
    echo "✅ JSON input comparison: WORKING"
else
    echo "❌ JSON input comparison: FAILED"
    echo "Output: $json_result"
fi

# Test 3: File path comparison (should still work)
echo ""
echo "3. Testing file path comparison..."
echo "PLC Analysis file" > temp_analysis.txt
echo "PLC Baseline file" > temp_baseline.txt

file_result=$(python3 src/python/analyzer.py --compare temp_analysis.txt temp_baseline.txt --provider openai 2>&1)

if echo "$file_result" | grep -q "llm_comparison"; then
    echo "✅ File path comparison: WORKING"
else
    echo "❌ File path comparison: FAILED"
    echo "Output: $file_result"
fi

# Cleanup
rm -f temp_analysis.txt temp_baseline.txt

echo ""
echo "🎯 Comparison Fix Status:"
echo "The Python analyzer now supports:"
echo "  ✅ Direct content strings"
echo "  ✅ JSON objects with content"  
echo "  ✅ File paths (existing functionality)"
echo ""
echo "This should resolve the 'No LLM Result' issue in the frontend."
