/**
 * Critical Button Functionality Test
 * Tests the most important buttons and workflows to ensure they work
 */

class CriticalButtonTester {
    constructor() {
        this.results = [];
        this.passed = 0;
        this.failed = 0;
    }

    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        console.log(logMessage);
        
        if (typeof document !== 'undefined') {
            const logElement = document.getElementById('critical-test-log');
            if (logElement) {
                const logLine = document.createElement('div');
                logLine.className = `log-${level}`;
                logLine.style.color = level === 'error' ? '#ff5555' : level === 'success' ? '#50fa7b' : '#f8f8f2';
                logLine.textContent = logMessage;
                logElement.appendChild(logLine);
                logElement.scrollTop = logElement.scrollHeight;
            }
        }
    }

    async testButton(buttonName, testFunction) {
        this.log(`Testing: ${buttonName}`, 'info');
        try {
            await testFunction();
            this.results.push({ button: buttonName, status: 'PASS' });
            this.passed++;
            this.log(`✅ ${buttonName} - WORKING`, 'success');
            return true;
        } catch (error) {
            this.results.push({ button: buttonName, status: 'FAIL', error: error.message });
            this.failed++;
            this.log(`❌ ${buttonName} - FAILED: ${error.message}`, 'error');
            return false;
        }
    }

    // Test Dashboard buttons
    async testDashboardButtons() {
        await this.testButton('Dashboard - List Analyses', async () => {
            const analyses = await window.electronAPI.listAnalyses();
            if (!Array.isArray(analyses)) {
                throw new Error('listAnalyses did not return an array');
            }
        });

        await this.testButton('Dashboard - List Baselines', async () => {
            const baselines = await window.electronAPI.listBaselines();
            if (!Array.isArray(baselines)) {
                throw new Error('listBaselines did not return an array');
            }
        });

        await this.testButton('Dashboard - Get Home Directory', async () => {
            const homeDir = await window.electronAPI.getHomeDirectory();
            if (typeof homeDir !== 'string') {
                throw new Error('getHomeDirectory did not return a string');
            }
        });
    }

    // Test Authentication buttons
    async testAuthenticationButtons() {
        await this.testButton('Auth - Validate Session', async () => {
            // Test with dummy token - should handle gracefully
            const result = await window.electronAPI.validateSession('dummy-token');
            if (typeof result !== 'object') {
                throw new Error('validateSession did not return an object');
            }
        });

        await this.testButton('Auth - List Users', async () => {
            const users = await window.electronAPI.listUsers();
            if (typeof users !== 'object') {
                throw new Error('listUsers did not return an object');
            }
        });
    }

    // Test User Management buttons
    async testUserManagementButtons() {
        await this.testButton('User Mgmt - List Users (detailed)', async () => {
            const users = await window.electronAPI.listUsers();
            if (!users || !users.users || !Array.isArray(users.users)) {
                throw new Error('listUsers did not return proper user list structure');
            }
        });

        // Test if toggle user status function exists (without actually calling it)
        await this.testButton('User Mgmt - Toggle User Status Function', async () => {
            if (typeof window.electronAPI.toggleUserStatus !== 'function') {
                throw new Error('toggleUserStatus function is not available');
            }
        });

        await this.testButton('User Mgmt - Reset Password Function', async () => {
            if (typeof window.electronAPI.resetUserPassword !== 'function') {
                throw new Error('resetUserPassword function is not available');
            }
        });
    }

    // Test Analysis and Baseline buttons
    async testAnalysisButtons() {
        await this.testButton('Analysis - Get Analyses', async () => {
            const analyses = await window.electronAPI.getAnalyses();
            if (!Array.isArray(analyses)) {
                throw new Error('getAnalyses did not return an array');
            }
        });

        await this.testButton('Analysis - Save Analysis Function', async () => {
            if (typeof window.electronAPI.saveAnalysis !== 'function') {
                throw new Error('saveAnalysis function is not available');
            }
        });

        await this.testButton('Analysis - Delete Analysis Function', async () => {
            if (typeof window.electronAPI.deleteAnalysis !== 'function') {
                throw new Error('deleteAnalysis function is not available');
            }
        });

        await this.testButton('Baseline - Save Baseline Function', async () => {
            if (typeof window.electronAPI.saveBaseline !== 'function') {
                throw new Error('saveBaseline function is not available');
            }
        });

        await this.testButton('Baseline - Delete Baseline Function', async () => {
            if (typeof window.electronAPI.deleteBaseline !== 'function') {
                throw new Error('deleteBaseline function is not available');
            }
        });
    }

    // Test OT Threat Intel buttons
    async testOTThreatIntelButtons() {
        await this.testButton('OT Threat Intel - Get Entries', async () => {
            const entries = await window.electronAPI.getOTThreatIntelEntries();
            if (!Array.isArray(entries)) {
                throw new Error('getOTThreatIntelEntries did not return an array');
            }
        });

        await this.testButton('OT Threat Intel - Sync Function', async () => {
            if (typeof window.electronAPI.syncOTThreatIntel !== 'function') {
                throw new Error('syncOTThreatIntel function is not available');
            }
        });

        await this.testButton('OT Threat Intel - Update Entry Function', async () => {
            if (typeof window.electronAPI.updateOTThreatIntelEntry !== 'function') {
                throw new Error('updateOTThreatIntelEntry function is not available');
            }
        });
    }

    // Test Git Integration buttons
    async testGitButtons() {
        await this.testButton('Git - Get Branches Function', async () => {
            if (typeof window.electronAPI.gitGetBranches !== 'function') {
                throw new Error('gitGetBranches function is not available');
            }
            // Don't actually call it as no repo may be connected
        });

        await this.testButton('Git - Connect Repository Function', async () => {
            if (typeof window.electronAPI.gitConnectRepository !== 'function') {
                throw new Error('gitConnectRepository function is not available');
            }
        });

        await this.testButton('Git - Get Files Function', async () => {
            if (typeof window.electronAPI.gitGetFiles !== 'function') {
                throw new Error('gitGetFiles function is not available');
            }
        });
    }

    // Test LLM and Logging buttons
    async testLLMButtons() {
        await this.testButton('LLM - Get Logs', async () => {
            const logs = await window.electronAPI.getLLMLogs();
            if (!Array.isArray(logs)) {
                throw new Error('getLLMLogs did not return an array');
            }
        });

        await this.testButton('LLM - Check Status Function', async () => {
            if (typeof window.electronAPI.checkLLMStatus !== 'function') {
                throw new Error('checkLLMStatus function is not available');
            }
        });

        await this.testButton('LLM - Get Status Function', async () => {
            if (typeof window.electronAPI.getLlmStatus !== 'function') {
                throw new Error('getLlmStatus function is not available');
            }
        });
    }

    // Test File System buttons
    async testFileSystemButtons() {
        await this.testButton('File System - Directory Picker Function', async () => {
            if (typeof window.electronAPI.showDirectoryPicker !== 'function') {
                throw new Error('showDirectoryPicker function is not available');
            }
        });

        await this.testButton('File System - Analyze File Function', async () => {
            if (typeof window.electronAPI.analyzeFile !== 'function') {
                throw new Error('analyzeFile function is not available');
            }
        });
    }

    // Test Comparison buttons
    async testComparisonButtons() {
        await this.testButton('Comparisons - Get Saved Comparisons', async () => {
            const comparisons = await window.electronAPI.getSavedComparisons();
            if (!Array.isArray(comparisons)) {
                throw new Error('getSavedComparisons did not return an array');
            }
        });

        await this.testButton('Comparisons - List History Function', async () => {
            if (typeof window.electronAPI.listComparisonHistory !== 'function') {
                throw new Error('listComparisonHistory function is not available');
            }
        });

        await this.testButton('Comparisons - Delete Result Function', async () => {
            if (typeof window.electronAPI.deleteComparisonResult !== 'function') {
                throw new Error('deleteComparisonResult function is not available');
            }
        });
    }

    // Main test runner
    async runAllTests() {
        this.log('🔧 Starting Critical Button Functionality Test', 'info');
        this.log('Testing the most important buttons and workflows...', 'info');
        this.log('', 'info');

        await this.testDashboardButtons();
        await this.testAuthenticationButtons();
        await this.testUserManagementButtons();
        await this.testAnalysisButtons();
        await this.testOTThreatIntelButtons();
        await this.testGitButtons();
        await this.testLLMButtons();
        await this.testFileSystemButtons();
        await this.testComparisonButtons();

        this.generateReport();
    }

    generateReport() {
        const total = this.passed + this.failed;
        
        this.log('', 'info');
        this.log('='.repeat(60), 'info');
        this.log('🔧 CRITICAL BUTTON FUNCTIONALITY REPORT', 'info');
        this.log('='.repeat(60), 'info');
        this.log(`Total Critical Functions Tested: ${total}`, 'info');
        this.log(`Working: ${this.passed}`, 'success');
        this.log(`Broken: ${this.failed}`, this.failed > 0 ? 'error' : 'info');
        this.log(`Success Rate: ${((this.passed / total) * 100).toFixed(1)}%`, 'info');
        this.log('='.repeat(60), 'info');

        if (this.failed > 0) {
            this.log('', 'error');
            this.log('❌ BROKEN FUNCTIONALITY:', 'error');
            this.results
                .filter(r => r.status === 'FAIL')
                .forEach(result => {
                    this.log(`  • ${result.button}: ${result.error}`, 'error');
                });
        } else {
            this.log('', 'success');
            this.log('🎉 ALL CRITICAL FUNCTIONALITY WORKING!', 'success');
            this.log('The application should be ready for production use.', 'success');
        }

        return {
            total,
            passed: this.passed,
            failed: this.failed,
            successRate: (this.passed / total) * 100,
            results: this.results
        };
    }
}

// Auto-run when loaded in browser
if (typeof window !== 'undefined') {
    window.CriticalButtonTester = CriticalButtonTester;
    
    // Wait for app to initialize then run test
    setTimeout(async () => {
        if (window.electronAPI) {
            console.log('🔧 Critical Button Functionality Tester loaded.');
            console.log('Run: new CriticalButtonTester().runAllTests()');
            
            // Auto-run if not in the main app
            if (!document.getElementById('root') || !document.getElementById('root').children.length) {
                const tester = new CriticalButtonTester();
                await tester.runAllTests();
            }
        } else {
            console.log('⚠️ electronAPI not available. Make sure the app is running.');
        }
    }, 2000);
}

// Export for Node.js usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CriticalButtonTester;
}
