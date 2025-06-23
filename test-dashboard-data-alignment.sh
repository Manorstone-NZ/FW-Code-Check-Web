#!/bin/bash

echo "=== Dashboard Data Alignment Fix Test ==="
echo ""

DASHBOARD_FILE="src/renderer/pages/EnhancedDashboard.tsx"

echo "Checking dashboard severity calculation fixes..."

# Check that daily chart no longer defaults to 'low'
if grep -A 10 -B 5 "Count items by day and severity" "$DASHBOARD_FILE" | grep -q "|| 'low'"; then
    echo "❌ Daily chart still defaults unknown severity to 'low'"
else
    echo "✅ Daily chart no longer defaults unknown severity to 'low'"
fi

# Check that vulnerabilities are counted separately from instructions
if grep -A 20 "Count vulnerabilities by severity" "$DASHBOARD_FILE" | grep -q "vulns.forEach" && \
   grep -A 20 "Count instructions by risk level" "$DASHBOARD_FILE" | grep -q "instructions.forEach"; then
    echo "✅ Vulnerabilities and instructions are counted separately"
else
    echo "❌ Vulnerabilities and instructions are not counted separately"
fi

# Check that severity validation exists
if grep -A 25 "Count vulnerabilities by severity" "$DASHBOARD_FILE" | grep -q "includes(severity)" && \
   grep -A 25 "Count instructions by risk level" "$DASHBOARD_FILE" | grep -q "includes(riskLevel)"; then
    echo "✅ Severity validation exists to prevent invalid values"
else
    echo "❌ Missing severity validation"
fi

# Check that empty/undefined severities are handled properly
if grep -A 25 "Count vulnerabilities by severity" "$DASHBOARD_FILE" | grep -q "if (severity &&" && \
   grep -A 25 "Count instructions by risk level" "$DASHBOARD_FILE" | grep -q "if (riskLevel &&"; then
    echo "✅ Empty/undefined severities are properly handled"
else
    echo "❌ Empty/undefined severities are not properly handled"
fi

echo ""
echo "=== Expected Behavior ==="
echo "📊 Daily chart severity counts should now match the metric card counts"
echo "📊 Items without valid severity will be ignored (not defaulted to 'low')"
echo "📊 Vulnerabilities and instructions are counted separately"
echo "📊 Only valid severity levels (critical, high, medium, low) are counted"
echo ""
echo "🎯 The chart should now show the correct severity breakdown!"
echo "=== Test Complete ==="
