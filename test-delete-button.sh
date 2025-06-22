#!/bin/bash

# Test Delete Analysis Button Functionality
# This script tests the complete delete analysis workflow

echo "🧪 Testing Delete Analysis Button Functionality..."
echo "================================="

# First, let's start the application in the background if not already running
if ! pgrep -f "electron" > /dev/null; then
    echo "Starting Electron application..."
    npm start &
    APP_PID=$!
    sleep 5
    echo "Application started with PID: $APP_PID"
else
    echo "Electron application already running"
fi

# Test 1: Direct backend test for delete functionality
echo ""
echo "📋 Test 1: Backend Delete Functionality"
echo "Testing delete-analysis Python handler..."

# First create a test analysis to delete
python3 -c "
import sys
import os
sys.path.append('src/python')
from db import create_analysis, get_analysis_list, delete_analysis

# Create a test analysis
result = create_analysis('test-delete.L5X', 'completed', '{\"test\": \"data\"}', '/test/path', 'test-provider', 'test-model')
print('Created test analysis:', result)

# List analyses to verify it exists
analyses = get_analysis_list()
print('Total analyses before delete:', len(analyses))

# Delete the analysis (result is the analysis ID integer)
delete_result = delete_analysis(result)
print('Delete result:', delete_result)

# Verify it's gone
analyses_after = get_analysis_list()
print('Total analyses after delete:', len(analyses_after))

if len(analyses_after) == len(analyses) - 1:
    print('✅ Backend delete functionality works correctly')
else:
    print('❌ Backend delete functionality failed')
"

# Test 2: Test the IPC handler
echo ""
echo "📋 Test 2: IPC Handler Test"
echo "Testing Electron IPC delete-analysis handler..."

# Create a simple test file to test IPC
cat > /tmp/test_delete_ipc.js << 'EOF'
const { ipcRenderer } = require('electron');

async function testDeleteIPC() {
    try {
        // First create an analysis
        const createResult = await ipcRenderer.invoke('save-analysis', 
            'test-ipc-delete.L5X',
            'completed',
            JSON.stringify({test: 'ipc-data'}),
            '/test/path/ipc-test.L5X',
            'test-provider',
            'test-model'
        );
        
        console.log('Created analysis for IPC test:', createResult);
        
        if (!createResult || !createResult.id) {
            throw new Error('Failed to create test analysis');
        }
        
        // Now test delete
        const deleteResult = await ipcRenderer.invoke('delete-analysis', createResult.id);
        console.log('Delete IPC result:', deleteResult);
        
        if (deleteResult && deleteResult.ok) {
            console.log('✅ IPC delete functionality works correctly');
        } else {
            console.log('❌ IPC delete functionality failed');
        }
        
    } catch (error) {
        console.error('❌ IPC test failed:', error);
    }
}

testDeleteIPC();
EOF

# Test 3: Frontend button test
echo ""
echo "📋 Test 3: Frontend Button Test"
echo "Testing delete button UI integration..."

# Open the test dashboard in browser for manual verification
echo "Opening test dashboard for manual verification..."
if command -v open &> /dev/null; then
    open "file://$(pwd)/public/master-test-dashboard.html"
elif command -v xdg-open &> /dev/null; then
    xdg-open "file://$(pwd)/public/master-test-dashboard.html"
fi

echo ""
echo "📋 Test 4: Automated Delete Button Test"
echo "Running automated delete button tests..."

# Run our delete button test
node -e "
const path = require('path');
const { execSync } = require('child_process');

// Load and run our delete button test
try {
    const testCode = require('fs').readFileSync('./public/test-delete-button.js', 'utf8');
    eval(testCode);
    
    // Run the test
    if (typeof window !== 'undefined' && window.testDeleteButton) {
        window.testDeleteButton.runAllDeleteButtonTests().then(results => {
            console.log('Delete button test results:', results);
        });
    } else {
        console.log('⚠️ Delete button test requires browser environment');
        console.log('Please run the test in the browser console or test dashboard');
    }
} catch (error) {
    console.error('❌ Failed to run delete button test:', error.message);
}
"

echo ""
echo "📋 Test Summary"
echo "=============="
echo "✅ Backend delete functionality tested"
echo "⚠️  IPC handler requires running application"
echo "⚠️  Frontend button test requires browser environment"
echo ""
echo "To fully test the delete button:"
echo "1. Ensure the Electron app is running"
echo "2. Open the test dashboard in browser"
echo "3. Click 'Run Delete Button Tests'"
echo ""
echo "Or run individual tests in the browser console:"
echo "- window.testDeleteButton.runAllDeleteButtonTests()"
echo "- window.testDeleteAnalysis.runAllDeleteTests()"

# Clean up
if [ ! -z "$APP_PID" ]; then
    echo "Stopping test application..."
    kill $APP_PID 2>/dev/null
fi

echo ""
echo "🎯 Delete Analysis Button Test Complete!"
