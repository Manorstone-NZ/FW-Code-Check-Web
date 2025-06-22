#!/usr/bin/env node
/**
 * Quick Backend IPC Handler Test
 * Tests if all IPC handlers in electron.js are properly registered
 */

const fs = require('fs');
const path = require('path');

// Read the electron.js file to extract all IPC handlers
const electronPath = path.join(__dirname, 'src', 'main', 'electron.js');
const electronContent = fs.readFileSync(electronPath, 'utf8');

// Extract all IPC handlers
const handlerPattern = /ipcMain\.handle\('([^']+)'/g;
const handlers = [];
let match;
while ((match = handlerPattern.exec(electronContent)) !== null) {
    handlers.push(match[1]);
}

console.log('='.repeat(60));
console.log('🔍 IPC HANDLER REGISTRATION ANALYSIS');
console.log('='.repeat(60));
console.log(`Found ${handlers.length} IPC handlers in electron.js:`);
console.log('');

// Group handlers by category
const categories = {
    'Authentication': handlers.filter(h => h.includes('login') || h.includes('auth') || h.includes('register') || h.includes('session')),
    'User Management': handlers.filter(h => h.includes('user') && !h.includes('auth')),
    'Data Management': handlers.filter(h => h.includes('baseline') || h.includes('analysis') || h.includes('get-') || h.includes('list-') || h.includes('save-') || h.includes('delete-')),
    'Git Integration': handlers.filter(h => h.includes('git')),
    'File System': handlers.filter(h => h.includes('directory') || h.includes('file') && !h.includes('git')),
    'OT Threat Intel': handlers.filter(h => h.includes('ot-threat')),
    'Comparisons': handlers.filter(h => h.includes('comparison')),
    'LLM & Logging': handlers.filter(h => h.includes('llm') || h.includes('log')),
    'Other': []
};

// Add uncategorized handlers to "Other"
const categorized = Object.values(categories).flat();
categories['Other'] = handlers.filter(h => !categorized.includes(h));

for (const [category, categoryHandlers] of Object.entries(categories)) {
    if (categoryHandlers.length > 0) {
        console.log(`📂 ${category} (${categoryHandlers.length}):`);
        categoryHandlers.forEach(handler => {
            console.log(`   ✅ ${handler}`);
        });
        console.log('');
    }
}

// Check preload.js to see what's exposed
const preloadPath = path.join(__dirname, 'src', 'main', 'preload.js');
const preloadContent = fs.readFileSync(preloadPath, 'utf8');

// Extract exposed functions
const exposedPattern = /(\w+):\s*\([^)]*\)\s*=>\s*ipcRenderer\.invoke\('([^']+)'/g;
const exposedFunctions = [];
let exposedMatch;
while ((exposedMatch = exposedPattern.exec(preloadContent)) !== null) {
    exposedFunctions.push({
        function: exposedMatch[1],
        handler: exposedMatch[2]
    });
}

console.log('='.repeat(60));
console.log('🌐 PRELOAD FUNCTION EXPOSURE ANALYSIS');
console.log('='.repeat(60));
console.log(`Found ${exposedFunctions.length} exposed functions in preload.js:`);
console.log('');

// Check for mismatches
const exposedHandlers = exposedFunctions.map(f => f.handler);
const missingHandlers = handlers.filter(h => !exposedHandlers.includes(h));
const extraExposed = exposedHandlers.filter(h => !handlers.includes(h));

exposedFunctions.forEach(f => {
    const status = handlers.includes(f.handler) ? '✅' : '❌';
    console.log(`   ${status} ${f.function} → ${f.handler}`);
});

console.log('');
console.log('='.repeat(60));
console.log('🔍 HANDLER MISMATCH ANALYSIS');
console.log('='.repeat(60));

if (missingHandlers.length > 0) {
    console.log(`❌ HANDLERS NOT EXPOSED IN PRELOAD (${missingHandlers.length}):`);
    missingHandlers.forEach(handler => {
        console.log(`   • ${handler}`);
    });
    console.log('');
}

if (extraExposed.length > 0) {
    console.log(`⚠️  EXPOSED FUNCTIONS WITH NO HANDLER (${extraExposed.length}):`);
    extraExposed.forEach(handler => {
        console.log(`   • ${handler}`);
    });
    console.log('');
}

if (missingHandlers.length === 0 && extraExposed.length === 0) {
    console.log('✅ ALL HANDLERS PROPERLY EXPOSED!');
    console.log('');
}

console.log('='.repeat(60));
console.log('📊 SUMMARY');
console.log('='.repeat(60));
console.log(`Total IPC Handlers: ${handlers.length}`);
console.log(`Exposed Functions: ${exposedFunctions.length}`);
console.log(`Missing Exposures: ${missingHandlers.length}`);
console.log(`Extra Exposures: ${extraExposed.length}`);
console.log(`Match Rate: ${(((exposedFunctions.length - extraExposed.length) / handlers.length) * 100).toFixed(1)}%`);

// Generate fix suggestions
if (missingHandlers.length > 0) {
    console.log('');
    console.log('🔧 SUGGESTED FIXES FOR PRELOAD.JS:');
    console.log('Add these lines to contextBridge.exposeInMainWorld(\'electronAPI\', {');
    missingHandlers.forEach(handler => {
        const functionName = handler.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        console.log(`   ${functionName}: (...args) => ipcRenderer.invoke('${handler}', ...args),`);
    });
    console.log('});');
}

process.exit(missingHandlers.length > 0 || extraExposed.length > 0 ? 1 : 0);
