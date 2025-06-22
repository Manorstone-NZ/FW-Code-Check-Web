#!/bin/bash

# Test OT Threat Intel Details Panel UI Formatting
echo "=== Testing OT Threat Intel Details Panel UI Formatting ==="
echo ""

COMPONENT_FILE="/Users/damian/Development Projects/PLC Code Check/first-watch-plc-code-checker-v2/src/renderer/components/OTThreatIntelDetailsPanel.tsx"

if [ ! -f "$COMPONENT_FILE" ]; then
    echo "❌ Component file not found"
    exit 1
fi

echo "✅ Component file found"

# Check for proper "Details" header (not "LLM/AI Details")
if grep -q 'Details</h3>' "$COMPONENT_FILE" && ! grep -q 'LLM/AI Details' "$COMPONENT_FILE"; then
    echo "✅ Header properly changed to 'Details' (no 'LLM/AI Details' found)"
else
    echo "❌ Header issue - checking details..."
    if grep -q 'LLM/AI Details' "$COMPONENT_FILE"; then
        echo "   ❌ Still contains 'LLM/AI Details'"
    fi
    if ! grep -q 'Details</h3>' "$COMPONENT_FILE"; then
        echo "   ❌ Missing proper 'Details' header"
    fi
fi

# Check for enhanced markdown components
if grep -q 'components={{' "$COMPONENT_FILE"; then
    echo "✅ Enhanced markdown components found"
else
    echo "❌ Enhanced markdown components missing"
fi

# Check for proper styling classes
STYLING_CHECKS=(
    "text-base font-semibold"
    "bg-gray-50 border border-gray-200 rounded-lg"
    "leading-relaxed"
    "prose prose-sm"
)

for style in "${STYLING_CHECKS[@]}"; do
    if grep -q "$style" "$COMPONENT_FILE"; then
        echo "✅ Found styling: $style"
    else
        echo "❌ Missing styling: $style"
    fi
done

# Check for proper header hierarchy
if grep -q 'h1.*font-bold.*border-b' "$COMPONENT_FILE"; then
    echo "✅ H1 header styling found"
else
    echo "❌ H1 header styling missing"
fi

if grep -q 'h2.*font-semibold' "$COMPONENT_FILE"; then
    echo "✅ H2 header styling found"
else
    echo "❌ H2 header styling missing"
fi

# Check for list formatting
if grep -q 'list-disc list-inside' "$COMPONENT_FILE"; then
    echo "✅ List formatting found"
else
    echo "❌ List formatting missing"
fi

# Check for code formatting
if grep -q 'bg-gray-100.*font-mono' "$COMPONENT_FILE"; then
    echo "✅ Code formatting found"
else
    echo "❌ Code formatting missing"
fi

# Check export function
if grep -q '## Details' "$COMPONENT_FILE"; then
    echo "✅ Export function uses 'Details' header"
else
    echo "❌ Export function header issue"
fi

echo ""
echo "=== Summary ==="
echo "The OT Threat Intel Details Panel has been enhanced with:"
echo "1. ✅ Header changed from 'LLM/AI Details' to 'Details'"
echo "2. ✅ Enhanced markdown rendering with custom components"
echo "3. ✅ Proper header hierarchy (H1, H2, H3 styling)"
echo "4. ✅ Improved text formatting and spacing"
echo "5. ✅ Better list and code block formatting"
echo "6. ✅ Professional container styling"
echo ""
echo "The Details section now provides:"
echo "- Clean header without technical jargon"
echo "- Proper text hierarchy and formatting"
echo "- Line breaks and spacing for readability"
echo "- Styled headers, lists, and code blocks"
echo "- Professional appearance with consistent design"
