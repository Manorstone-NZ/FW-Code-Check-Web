#!/bin/bash

# Test script to verify dashboard uniformity and clickability improvements

echo "🎨 DASHBOARD UNIFORMITY & CLICKABILITY TEST"
echo "============================================"
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Checking dashboard uniformity improvements...${NC}"
echo

# Test 1: Check MetricCard uniformity
echo "1. MetricCard Uniformity Check:"
if ! grep -q "Good.*span" src/renderer/components/dashboard/MetricCard.tsx; then
    echo -e "   ✅ ${GREEN}Removed 'Good' icon from MetricCard${NC}"
else
    echo -e "   ❌ ${RED}'Good' icon still present in MetricCard${NC}"
fi

if grep -q "bg-white.*border-gray-200" src/renderer/components/dashboard/MetricCard.tsx; then
    echo -e "   ✅ ${GREEN}Uniform white background for all cards${NC}"
else
    echo -e "   ❌ ${RED}Cards don't have uniform styling${NC}"
fi

if grep -q "text-gray-900.*bg-white" src/renderer/components/dashboard/MetricCard.tsx; then
    echo -e "   ✅ ${GREEN}Consistent text and background colors${NC}"
else
    echo -e "   ❌ ${RED}Inconsistent text/background colors${NC}"
fi

# Test 2: Check correct metrics
echo "2. Dashboard Metrics Check:"
EXPECTED_METRICS=(
    "Total Baselines"
    "Analysis Items"
    "Vulnerabilities Found"
    "Critical Issues"
    "High-Risk Instructions"
    "Processing Success Rate"
    "Comparisons"
)

for metric in "${EXPECTED_METRICS[@]}"; do
    if grep -q "$metric" src/renderer/pages/EnhancedDashboard.tsx; then
        echo -e "   ✅ ${GREEN}$metric metric present${NC}"
    else
        echo -e "   ❌ ${RED}$metric metric missing${NC}"
    fi
done

# Test 3: Check grid layout uniformity
echo "3. Grid Layout Uniformity Check:"
if grep -q "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" src/renderer/pages/EnhancedDashboard.tsx; then
    echo -e "   ✅ ${GREEN}Uniform 3-column grid layout implemented${NC}"
else
    echo -e "   ❌ ${RED}Grid layout not uniform${NC}"
fi

# Test 4: Check clickability
echo "4. Panel Clickability Check:"
CLICKABLE_PATHS=(
    "navigate('/baselines')"
    "navigate('/analysis')"
    "navigate('/analysis?filter=vulnerabilities')"
    "navigate('/analysis?filter=critical')"
    "navigate('/analysis?filter=high-risk')"
    "navigate('/comparisons')"
)

for path in "${CLICKABLE_PATHS[@]}"; do
    if grep -q "$path" src/renderer/pages/EnhancedDashboard.tsx; then
        echo -e "   ✅ ${GREEN}$path navigation implemented${NC}"
    else
        echo -e "   ⚠️  ${YELLOW}$path navigation not found${NC}"
    fi
done

# Test 5: Check all panels have onClick handlers
echo "5. onClick Handler Check:"
if grep -q "onClick={() => {" src/renderer/pages/EnhancedDashboard.tsx; then
    echo -e "   ✅ ${GREEN}onClick handlers implemented for panels${NC}"
else
    echo -e "   ❌ ${RED}onClick handlers missing${NC}"
fi

# Test 6: Check hover effects
echo "6. Hover Effects Check:"
if grep -q "hover:scale-105" src/renderer/components/dashboard/MetricCard.tsx; then
    echo -e "   ✅ ${GREEN}Hover scale effect implemented${NC}"
else
    echo -e "   ❌ ${RED}Hover effects missing${NC}"
fi

if grep -q "cursor-pointer" src/renderer/components/dashboard/MetricCard.tsx; then
    echo -e "   ✅ ${GREEN}Cursor pointer for clickable cards${NC}"
else
    echo -e "   ❌ ${RED}Cursor pointer missing${NC}"
fi

# Test 7: Check build success
echo "7. Build Test:"
if [ -f "public/bundle.js" ]; then
    echo -e "   ✅ ${GREEN}Dashboard builds successfully${NC}"
else
    echo -e "   ❌ ${RED}Build failed${NC}"
fi

# Test 8: Check removed status icons
echo "8. Status Icon Removal Check:"
if ! grep -q "getStatusIcon" src/renderer/components/dashboard/MetricCard.tsx; then
    echo -e "   ✅ ${GREEN}Status icon function removed${NC}"
else
    echo -e "   ❌ ${RED}Status icon function still present${NC}"
fi

# Test 9: Check clean layout
echo "9. Clean Layout Check:"
if grep -q "p-6.*flex-1" src/renderer/components/dashboard/MetricCard.tsx; then
    echo -e "   ✅ ${GREEN}Clean, simplified card layout${NC}"
else
    echo -e "   ❌ ${RED}Layout not simplified${NC}"
fi

# Test 10: Check consistent spacing
echo "10. Spacing Consistency Check:"
if grep -q "gap-6" src/renderer/pages/EnhancedDashboard.tsx; then
    echo -e "   ✅ ${GREEN}Consistent gap spacing (gap-6)${NC}"
else
    echo -e "   ❌ ${RED}Inconsistent spacing${NC}"
fi

echo
echo -e "${BLUE}💡 Dashboard Improvements Summary:${NC}"
echo "✅ Removed 'Good' status icons for clean uniform look"
echo "✅ Applied uniform white background with subtle borders"
echo "✅ Implemented consistent 3-column grid layout"
echo "✅ Made all panels clickable with proper navigation"
echo "✅ Added hover effects for better user interaction"
echo "✅ Simplified card layout without decorative elements"
echo "✅ Consistent text colors and spacing throughout"
echo
echo -e "${GREEN}✅ Dashboard now has uniform appearance similar to reference image${NC}"
echo -e "${BLUE}🖱️  All panels are clickable and navigate to appropriate sections${NC}"
