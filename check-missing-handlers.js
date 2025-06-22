/**
 * Missing Handler Analysis
 * Run this to identify specific missing handlers
 */

const expectedHandlers = [
    'authenticateUser', 'registerUser', 'validateSession', 'createSession', 'logoutSession',
    'listBaselines', 'listAnalyses', 'getAnalysis', 'getBaseline', 'saveBaseline', 'deleteBaseline', 'deleteAnalysis', 'saveAnalysis', 'getSavedComparisons',
    'listUsers', 'deleteUser', 'toggleUserStatus', 'resetUserPassword',
    'gitGetBranches', 'gitConnectRepository', 'gitGetFiles', 'gitCloneRepository', 'gitGetRemoteBranches', 'gitCheckoutBranch', 'gitGetStatus', 'gitCommitFile', 'gitPushToRemote', 'gitCopyFileFromBranch',
    'getOTThreatIntelEntries', 'syncOTThreatIntel', 'updateOTThreatIntelEntry',
    'showDirectoryPicker', 'showSaveDirectoryPicker', 'getHomeDirectory',
    'analyzeFile', 'checkLLMStatus', 'getLLMLogs',
    'llmCompareAnalysisBaseline', 'saveComparisonResult', 'deleteComparisonResult',
    'installOllamaModel'
];

// Check current preload.js for these handlers
const fs = require('fs');
const path = require('path');

const preloadPath = path.join(__dirname, 'src/main/preload.js');
const preloadContent = fs.readFileSync(preloadPath, 'utf8');

console.log('Checking preload.js for missing handlers...\n');

const missing = [];
expectedHandlers.forEach(handler => {
    if (!preloadContent.includes(`${handler}:`)) {
        missing.push(handler);
    }
});

if (missing.length > 0) {
    console.log('❌ Missing from preload.js:');
    missing.forEach(handler => console.log(`  • ${handler}`));
    console.log('\nThese handlers need to be added to preload.js');
} else {
    console.log('✅ All expected handlers are in preload.js');
}

console.log(`\nTotal expected: ${expectedHandlers.length}`);
console.log(`Missing: ${missing.length}`);
console.log(`Present: ${expectedHandlers.length - missing.length}`);
