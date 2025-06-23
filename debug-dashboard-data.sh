#!/bin/bash

echo "=== Debug Dashboard Data Calculation ==="
echo ""

DASHBOARD_FILE="src/renderer/pages/EnhancedDashboard.tsx"

echo "Checking if metrics and daily chart use the same time filtering..."

# Check if metrics calculation uses time filtering
if grep -A 10 -B 5 "severityCounts" "$DASHBOARD_FILE" | grep -q "recentAnalyses"; then
    echo "✅ Metrics use time-filtered data"
else
    echo "❌ Metrics use ALL analyses (not time-filtered)"
fi

# Check if daily chart uses time filtering
if grep -A 10 -B 5 "dailyData\[analysisDate\]" "$DASHBOARD_FILE" | grep -q "if (!dailyData\[analysisDate\])"; then
    echo "✅ Daily chart uses time-filtered data"
else
    echo "❌ Daily chart does not use time filtering"
fi

echo ""
echo "Checking severity counting logic consistency..."

# Check metrics vulnerability counting
echo "Metrics vulnerability counting:"
grep -A 5 "vulns.forEach" "$DASHBOARD_FILE" | head -n 6

echo ""
echo "Daily chart vulnerability counting:"
grep -A 5 "vulns.forEach" "$DASHBOARD_FILE" | tail -n 6

echo ""
echo "=== Potential Issues ==="
echo "1. Metrics might be counting ALL analyses (not time-filtered)"
echo "2. Daily chart only counts analyses within the selected time range"
echo "3. This could cause data mismatch between summary and chart"
echo ""
echo "=== Recommendation ==="
echo "Both metrics and daily chart should use the same data set"
echo "Either both should be time-filtered or both should use all data"
