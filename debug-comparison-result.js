// Debug the comparison result issue
// This will help us see exactly what's being returned

const fs = require('fs');
const path = require('path');

async function debugComparisonResult() {
    console.log('🔍 Debugging Comparison Result Issue');
    console.log('====================================');
    
    // Create test files
    const analysisFile = path.join(__dirname, 'debug_analysis.txt');
    const baselineFile = path.join(__dirname, 'debug_baseline.txt');
    
    fs.writeFileSync(analysisFile, `PLC ANALYSIS FILE
Network 1: Start logic
Network 2: Safety interlocks
Network 3: Output controls`);
    
    fs.writeFileSync(baselineFile, `PLC BASELINE FILE
Network 1: Start logic  
Network 2: Different safety interlocks
Network 3: Output controls`);
    
    try {
        // Test if electronAPI is available (this would be in the Electron renderer)
        if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.llmCompareAnalysisBaseline) {
            console.log('✅ ElectronAPI available, testing comparison...');
            
            const result = await window.electronAPI.llmCompareAnalysisBaseline(
                analysisFile,
                baselineFile,
                'openai'
            );
            
            console.log('📋 Raw result from Electron:');
            console.log(JSON.stringify(result, null, 2));
            
            console.log('\n📋 Result analysis:');
            console.log('- Type:', typeof result);
            console.log('- Has llm_comparison:', !!result?.llm_comparison);
            console.log('- Has success:', !!result?.success);
            console.log('- Has error:', !!result?.error);
            console.log('- Keys:', Object.keys(result || {}));
            
            if (result?.llm_comparison) {
                console.log('✅ llm_comparison found:', result.llm_comparison.substring(0, 100) + '...');
            } else {
                console.log('❌ No llm_comparison found');
                console.log('Full result:', result);
            }
            
        } else {
            console.log('❌ ElectronAPI not available (not in Electron renderer context)');
            console.log('This script needs to run in the Electron app context');
        }
    } catch (error) {
        console.error('❌ Error during comparison test:', error);
    } finally {
        // Cleanup
        try {
            fs.unlinkSync(analysisFile);
            fs.unlinkSync(baselineFile);
        } catch (e) {
            // Ignore cleanup errors
        }
    }
}

// If running in browser (Electron renderer), run the debug
if (typeof window !== 'undefined') {
    debugComparisonResult();
} else {
    console.log('This script is designed to run in the Electron renderer context.');
    console.log('Copy this code into the browser console when the Electron app is running.');
}
