/**
 * Quick Handler Test Script - Run in Electron's DevTools Console
 * This script will identify missing or broken IPC handlers
 */

async function testAllHandlers() {
    console.log('🔍 Testing all IPC handlers...');
    
    const results = {
        working: [],
        missing: [],
        broken: []
    };
    
    // List of expected handlers from validation script
    const expectedHandlers = [
        // Authentication
        'authenticateUser',
        'registerUser', 
        'validateSession',
        'createSession',
        'logoutSession',
        
        // Data Management
        'listBaselines',
        'listAnalyses',
        'getAnalysis',
        'getBaseline',
        'saveBaseline',
        'deleteBaseline',
        'deleteAnalysis',
        'saveAnalysis',
        'getSavedComparisons',
        
        // User Management
        'listUsers',
        'deleteUser',
        'toggleUserStatus',
        'resetUserPassword',
        
        // Git Integration
        'gitGetBranches',
        'gitConnectRepository',
        'gitGetFiles',
        'gitCloneRepository',
        'gitGetRemoteBranches',
        'gitCheckoutBranch',
        'gitGetStatus',
        'gitCommitFile',
        'gitPushToRemote',
        'gitCopyFileFromBranch',
        
        // OT Threat Intel
        'getOTThreatIntelEntries',
        'syncOTThreatIntel',
        'updateOTThreatIntelEntry',
        
        // File System
        'showDirectoryPicker',
        'getHomeDirectory',
        
        // Analysis
        'analyzeFile',
        'checkLLMStatus',
        'getLLMLogs',
        
        // Comparison
        'llmCompareAnalysisBaseline',
        'saveComparisonResult',
        'deleteComparisonResult',
        
        // Additional handlers used in components
        'installOllamaModel'
    ];
    
    // Test each handler
    for (const handlerName of expectedHandlers) {
        try {
            if (typeof window.electronAPI[handlerName] === 'function') {
                console.log(`✅ ${handlerName} - AVAILABLE`);
                results.working.push(handlerName);
            } else {
                console.log(`❌ ${handlerName} - MISSING`);
                results.missing.push(handlerName);
            }
        } catch (error) {
            console.log(`💥 ${handlerName} - ERROR: ${error.message}`);
            results.broken.push(handlerName);
        }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('🔍 HANDLER TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tested: ${expectedHandlers.length}`);
    console.log(`Working: ${results.working.length}`);
    console.log(`Missing: ${results.missing.length}`);
    console.log(`Broken: ${results.broken.length}`);
    
    if (results.missing.length > 0) {
        console.log('\n❌ MISSING HANDLERS:');
        results.missing.forEach(handler => console.log(`  • ${handler}`));
    }
    
    if (results.broken.length > 0) {
        console.log('\n💥 BROKEN HANDLERS:');
        results.broken.forEach(handler => console.log(`  • ${handler}`));
    }
    
    return results;
}

// Auto-run
testAllHandlers().then(results => {
    console.log('\n🎯 Handler test complete!');
    window.handlerTestResults = results; // Store results globally
});
