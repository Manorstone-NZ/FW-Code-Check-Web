#!/bin/bash

echo "=== Dashboard Time Filtering Alignment Fix ==="
echo ""

DASHBOARD_FILE="src/renderer/pages/EnhancedDashboard.tsx"

echo "🎯 SOLUTION IMPLEMENTED:"
echo "   Made metrics and daily chart use the same time-filtered data"
echo ""

echo "📊 VERIFICATION:"

# Check that metrics use recentAnalyses instead of all analyses
if grep -q "recentAnalyses.forEach" "$DASHBOARD_FILE"; then
    echo "   ✅ Metrics now use time-filtered data (recentAnalyses)"
else
    echo "   ❌ Metrics still use all analyses"
fi

# Check that both metrics and daily chart filter by time range
if grep -q "recentAnalyses = analyses.filter" "$DASHBOARD_FILE"; then
    echo "   ✅ Time filtering is applied to analyses"
else
    echo "   ❌ No time filtering found"
fi

# Check that totalAnalysisItems uses filtered data
if grep -q "totalAnalysisItems = recentAnalyses.length" "$DASHBOARD_FILE"; then
    echo "   ✅ Analysis items count uses time-filtered data"
else
    echo "   ❌ Analysis items count uses all data"
fi

# Check that totalComparisons uses filtered data
if grep -q "totalComparisons = recentAnalyses.filter" "$DASHBOARD_FILE"; then
    echo "   ✅ Comparisons count uses time-filtered data"
else
    echo "   ❌ Comparisons count uses all data"
fi

# Check that baselines are not time-filtered (as they should be)
if grep -q "totalBaselines = baselines?.length" "$DASHBOARD_FILE"; then
    echo "   ✅ Baselines count correctly uses all baselines (not time-filtered)"
else
    echo "   ❌ Baselines count might be incorrectly filtered"
fi

echo ""
echo "🔧 HOW THE FIX WORKS:"
echo "   BEFORE:"
echo "   - Metrics: Counted ALL analyses across all time"
echo "   - Daily Chart: Only counted analyses within selected time range"
echo "   - Result: Data mismatch between summary and chart"
echo ""
echo "   AFTER:"
echo "   - Metrics: Count only analyses within selected time range"
echo "   - Daily Chart: Count only analyses within selected time range"
echo "   - Result: Both use the same filtered data set"
echo ""
echo "🎯 EXPECTED RESULT:"
echo "   The summary statistics should now match the daily chart totals"
echo "   When you select '7 days', both metrics and chart show last 7 days data"
echo "   When you select '24h', both show last 24 hours data"
echo "   When you select '30d', both show last 30 days data"
echo ""
echo "=== Fix Complete! Test the dashboard now ==="
