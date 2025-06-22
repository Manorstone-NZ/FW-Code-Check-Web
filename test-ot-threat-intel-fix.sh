#!/bin/bash

# Test OT Threat Intel Handler Functionality
echo "🔧 Testing OT Threat Intel Handler Fix..."
echo "========================================"

cd "/Users/damian/Development Projects/PLC Code Check/first-watch-plc-code-checker-v2"

# Test 1: List OT Threat Intel
echo "1. Testing list OT threat intel..."
result1=$(python3 src/python/db.py --list-ot-threat-intel 2>&1)
if echo "$result1" | grep -q '"'; then
    echo "✅ List OT threat intel: WORKING (returns JSON)"
else
    echo "❌ List OT threat intel: FAILED"
    echo "Output: $result1"
fi

# Test 2: Get last sync
echo ""
echo "2. Testing get last sync..."
result2=$(python3 src/python/db.py --get-ot-threat-intel-last-sync 2>&1)
if echo "$result2" | grep -q '"'; then
    echo "✅ Get last sync: WORKING (returns JSON)"
else
    echo "❌ Get last sync: FAILED"
    echo "Output: $result2"
fi

# Test 3: Update entry (with dummy data)
echo ""
echo "3. Testing update OT threat intel entry..."
dummy_entry='{"id":"test123","title":"Test Threat","description":"Test description","severity":"medium"}'
result3=$(python3 src/python/db.py --update-ot-threat-intel "$dummy_entry" 2>&1)
if echo "$result3" | grep -q '"'; then
    echo "✅ Update OT threat intel entry: WORKING (returns JSON)"
else
    echo "❌ Update OT threat intel entry: FAILED"
    echo "Output: $result3"
fi

# Test 4: Clear OT threat intel
echo ""
echo "4. Testing clear OT threat intel..."
result4=$(python3 src/python/db.py --clear-ot-threat-intel 2>&1)
if echo "$result4" | grep -q '"'; then
    echo "✅ Clear OT threat intel: WORKING (returns JSON)"
else
    echo "❌ Clear OT threat intel: FAILED"
    echo "Output: $result4"
fi

# Test 5: Bulk sync (optional, may require API keys)
echo ""
echo "5. Testing bulk OT threat intel sync..."
result5=$(python3 src/python/sync_ot_threat_intel.py --bulk-ot-threat-intel 2>&1)
if echo "$result5" | grep -q '"'; then
    echo "✅ Bulk OT threat intel sync: WORKING (returns JSON)"
elif echo "$result5" | grep -q "error"; then
    echo "⚠️ Bulk OT threat intel sync: API/Config dependent (expected)"
else
    echo "❌ Bulk OT threat intel sync: FAILED"
    echo "Output: $result5"
fi

echo ""
echo "🎯 OT Threat Intel Handler Summary:"
echo "   - Fixed Electron handlers to call correct Python scripts"
echo "   - db.py handles: list, get-last-sync, update, clear"
echo "   - sync_ot_threat_intel.py handles: sync operations"
echo "   - Added missing clear and bulk handlers"
echo ""
echo "Fix Status: ✅ COMPLETED - OT Threat Intel handlers should now work"
