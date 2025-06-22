/**
 * Electron DevTools Console Handler Test
 * Run this script in the Electron app's DevTools console to test all handlers
 */

(async function() {
    console.log('🔍 Starting comprehensive handler validation...');
    
    const results = {
        working: [],
        missing: [],
        broken: []
    };
    
    // Test if electronAPI is available
    if (typeof window.electronAPI === 'undefined') {
        console.log('❌ window.electronAPI is not available');
        return;
    }
    
    console.log('✅ window.electronAPI is available');
    
    // List of all expected handlers
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
        'showSaveDirectoryPicker',
        'getHomeDirectory',
        
        // Analysis
        'analyzeFile',
        'checkLLMStatus',
        'getLLMLogs',
        
        // Comparison
        'llmCompareAnalysisBaseline',
        'saveComparisonResult',
        'deleteComparisonResult',
        
        // Additional handlers
        'installOllamaModel'
    ];
    
    console.log(`Testing ${expectedHandlers.length} handlers...`);
    
    for (const handlerName of expectedHandlers) {
        if (typeof window.electronAPI[handlerName] === 'function') {
            console.log(`✅ ${handlerName} - AVAILABLE`);
            results.working.push(handlerName);
        } else {
            console.log(`❌ ${handlerName} - MISSING`);
            results.missing.push(handlerName);
        }
    }
    
    // Test some handlers that should work with dummy data
    console.log('\n🧪 Testing handlers with dummy data...');
    
    try {
        console.log('Testing listBaselines...');
        const baselines = await window.electronAPI.listBaselines();
        console.log('✅ listBaselines worked:', Array.isArray(baselines));
    } catch (error) {
        console.log('❌ listBaselines failed:', error.message);
        results.broken.push('listBaselines');
    }
    
    try {
        console.log('Testing listAnalyses...');
        const analyses = await window.electronAPI.listAnalyses();
        console.log('✅ listAnalyses worked:', Array.isArray(analyses));
    } catch (error) {
        console.log('❌ listAnalyses failed:', error.message);
        results.broken.push('listAnalyses');
    }
    
    try {
        console.log('Testing getHomeDirectory...');
        const homeDir = await window.electronAPI.getHomeDirectory();
        console.log('✅ getHomeDirectory worked:', typeof homeDir === 'string');
    } catch (error) {
        console.log('❌ getHomeDirectory failed:', error.message);
        results.broken.push('getHomeDirectory');
    }
    
    try {
        console.log('Testing getSavedComparisons...');
        const comparisons = await window.electronAPI.getSavedComparisons();
        console.log('✅ getSavedComparisons worked:', Array.isArray(comparisons));
    } catch (error) {
        console.log('❌ getSavedComparisons failed:', error.message);
        results.broken.push('getSavedComparisons');
    }
    
    try {
        console.log('Testing getLLMLogs...');
        const logs = await window.electronAPI.getLLMLogs();
        console.log('✅ getLLMLogs worked:', Array.isArray(logs));
    } catch (error) {
        console.log('❌ getLLMLogs failed:', error.message);
        results.broken.push('getLLMLogs');
    }
    
    try {
        console.log('Testing getOTThreatIntelEntries...');
        const entries = await window.electronAPI.getOTThreatIntelEntries();
        console.log('✅ getOTThreatIntelEntries worked:', Array.isArray(entries));
    } catch (error) {
        console.log('❌ getOTThreatIntelEntries failed:', error.message);
        results.broken.push('getOTThreatIntelEntries');
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('🔍 HANDLER VALIDATION SUMMARY');
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
    
    console.log('\n🎯 Handler validation complete!');
    
    // Store results globally for further inspection
    window.handlerValidationResults = results;
    
    return results;
})();
