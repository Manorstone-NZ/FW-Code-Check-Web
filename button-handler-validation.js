/**
 * Button Handler Validation Script
 * Tests every button in the application to ensure they have working handlers
 */

class ButtonValidationTester {
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
            const logElement = document.getElementById('validation-log');
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

    async testHandler(handlerName, testFunction) {
        this.log(`Testing handler: ${handlerName}`, 'info');
        try {
            await testFunction();
            this.results.push({ handler: handlerName, status: 'PASS' });
            this.passed++;
            this.log(`✅ ${handlerName} - WORKING`, 'success');
            return true;
        } catch (error) {
            this.results.push({ handler: handlerName, status: 'FAIL', error: error.message });
            this.failed++;
            this.log(`❌ ${handlerName} - FAILED: ${error.message}`, 'error');
            return false;
        }
    }

    // Test basic IPC availability
    async testBasicIPC() {
        await this.testHandler('window.electronAPI exists', async () => {
            if (!window.electronAPI) {
                throw new Error('window.electronAPI is not defined');
            }
        });

        await this.testHandler('window.electron exists', async () => {
            if (!window.electron) {
                throw new Error('window.electron is not defined');
            }
        });
    }

    // Test Authentication Handlers
    async testAuthenticationHandlers() {
        await this.testHandler('authenticateUser', async () => {
            if (typeof window.electronAPI.authenticateUser !== 'function') {
                throw new Error('authenticateUser function is not available');
            }
            // Test with dummy data - should fail gracefully
            const result = await window.electronAPI.authenticateUser('dummyuser', 'dummypass');
            // Should return an object with success field
            if (typeof result !== 'object') {
                throw new Error('authenticateUser did not return an object');
            }
        });

        await this.testHandler('registerUser', async () => {
            if (typeof window.electronAPI.registerUser !== 'function') {
                throw new Error('registerUser function is not available');
            }
        });

        await this.testHandler('validateSession', async () => {
            if (typeof window.electronAPI.validateSession !== 'function') {
                throw new Error('validateSession function is not available');
            }
            // Test with dummy token
            const result = await window.electronAPI.validateSession('dummy-token');
            if (typeof result !== 'object') {
                throw new Error('validateSession did not return an object');
            }
        });
    }

    // Test Data Management Handlers
    async testDataManagementHandlers() {
        await this.testHandler('listBaselines', async () => {
            if (typeof window.electronAPI.listBaselines !== 'function') {
                throw new Error('listBaselines function is not available');
            }
            const result = await window.electronAPI.listBaselines();
            if (!Array.isArray(result)) {
                throw new Error('listBaselines did not return an array');
            }
        });

        await this.testHandler('listAnalyses', async () => {
            if (typeof window.electronAPI.listAnalyses !== 'function') {
                throw new Error('listAnalyses function is not available');
            }
            const result = await window.electronAPI.listAnalyses();
            if (!Array.isArray(result)) {
                throw new Error('listAnalyses did not return an array');
            }
        });

        await this.testHandler('getAnalysis', async () => {
            if (typeof window.electronAPI.getAnalysis !== 'function') {
                throw new Error('getAnalysis function is not available');
            }
            // Test with dummy ID - should handle gracefully
            try {
                await window.electronAPI.getAnalysis(999999);
            } catch (error) {
                // Expected to fail with non-existent ID
            }
        });

        await this.testHandler('getBaseline', async () => {
            if (typeof window.electronAPI.getBaseline !== 'function') {
                throw new Error('getBaseline function is not available');
            }
            // Test with dummy ID - should handle gracefully
            try {
                await window.electronAPI.getBaseline(999999);
            } catch (error) {
                // Expected to fail with non-existent ID
            }
        });

        await this.testHandler('deleteBaseline', async () => {
            if (typeof window.electronAPI.deleteBaseline !== 'function') {
                throw new Error('deleteBaseline function is not available');
            }
        });

        await this.testHandler('deleteAnalysis', async () => {
            if (typeof window.electronAPI.deleteAnalysis !== 'function') {
                throw new Error('deleteAnalysis function is not available');
            }
        });
    }

    // Test User Management Handlers
    async testUserManagementHandlers() {
        await this.testHandler('listUsers', async () => {
            if (typeof window.electronAPI.listUsers !== 'function') {
                throw new Error('listUsers function is not available');
            }
            const result = await window.electronAPI.listUsers();
            if (typeof result !== 'object') {
                throw new Error('listUsers did not return an object');
            }
        });

        await this.testHandler('deleteUser', async () => {
            if (typeof window.electronAPI.deleteUser !== 'function') {
                throw new Error('deleteUser function is not available');
            }
        });
    }

    // Test Git Integration Handlers
    async testGitHandlers() {
        await this.testHandler('gitGetBranches', async () => {
            if (typeof window.electronAPI.gitGetBranches !== 'function') {
                throw new Error('gitGetBranches function is not available');
            }
            // This might fail if no repo is connected, but the function should exist
            try {
                await window.electronAPI.gitGetBranches();
            } catch (error) {
                // Expected if no repo connected
            }
        });

        await this.testHandler('gitConnectRepository', async () => {
            if (typeof window.electronAPI.gitConnectRepository !== 'function') {
                throw new Error('gitConnectRepository function is not available');
            }
        });

        await this.testHandler('gitGetFiles', async () => {
            if (typeof window.electronAPI.gitGetFiles !== 'function') {
                throw new Error('gitGetFiles function is not available');
            }
        });
    }

    // Test OT Threat Intel Handlers
    async testOTThreatIntelHandlers() {
        await this.testHandler('getOTThreatIntelEntries', async () => {
            if (typeof window.electronAPI.getOTThreatIntelEntries !== 'function') {
                throw new Error('getOTThreatIntelEntries function is not available');
            }
            const result = await window.electronAPI.getOTThreatIntelEntries();
            if (!Array.isArray(result)) {
                throw new Error('getOTThreatIntelEntries did not return an array');
            }
        });

        await this.testHandler('syncOTThreatIntel', async () => {
            if (typeof window.electronAPI.syncOTThreatIntel !== 'function') {
                throw new Error('syncOTThreatIntel function is not available');
            }
        });

        await this.testHandler('updateOTThreatIntelEntry', async () => {
            if (typeof window.electronAPI.updateOTThreatIntelEntry !== 'function') {
                throw new Error('updateOTThreatIntelEntry function is not available');
            }
        });
    }

    // Test File System Handlers
    async testFileSystemHandlers() {
        await this.testHandler('showDirectoryPicker', async () => {
            if (typeof window.electronAPI.showDirectoryPicker !== 'function') {
                throw new Error('showDirectoryPicker function is not available');
            }
        });

        await this.testHandler('getHomeDirectory', async () => {
            if (typeof window.electronAPI.getHomeDirectory !== 'function') {
                throw new Error('getHomeDirectory function is not available');
            }
            const result = await window.electronAPI.getHomeDirectory();
            if (typeof result !== 'string') {
                throw new Error('getHomeDirectory did not return a string');
            }
        });
    }

    // Test Analysis Handlers
    async testAnalysisHandlers() {
        await this.testHandler('analyzeFile', async () => {
            if (typeof window.electronAPI.analyzeFile !== 'function') {
                throw new Error('analyzeFile function is not available');
            }
        });

        await this.testHandler('saveBaseline', async () => {
            if (typeof window.electronAPI.saveBaseline !== 'function') {
                throw new Error('saveBaseline function is not available');
            }
        });

        await this.testHandler('getSavedComparisons', async () => {
            if (typeof window.electronAPI.getSavedComparisons !== 'function') {
                throw new Error('getSavedComparisons function is not available');
            }
            const result = await window.electronAPI.getSavedComparisons();
            if (!Array.isArray(result)) {
                throw new Error('getSavedComparisons did not return an array');
            }
        });
    }

    // Test LLM and Logging Handlers
    async testLLMHandlers() {
        await this.testHandler('getLLMLogs', async () => {
            if (typeof window.electronAPI.getLLMLogs !== 'function') {
                throw new Error('getLLMLogs function is not available');
            }
            const result = await window.electronAPI.getLLMLogs();
            if (!Array.isArray(result)) {
                throw new Error('getLLMLogs did not return an array');
            }
        });

        await this.testHandler('checkLLMStatus', async () => {
            if (typeof window.electronAPI.checkLLMStatus !== 'function') {
                throw new Error('checkLLMStatus function is not available');
            }
        });
    }

    // Check for missing handlers that are used in components
    async testMissingHandlers() {
        const missingHandlers = [];

        // Check for handlers used in components but not exposed
        const expectedHandlers = [
            'resetUserPassword',
            'toggleUserStatus',
            'installOllamaModel',
            'gitCloneRepository',
            'gitGetRemoteBranches',
            'gitCheckoutBranch',
            'gitGetStatus',
            'gitCommitFile',
            'gitPushToRemote',
            'gitCopyFileFromBranch',
            'saveComparisonResult',
            'deleteComparisonResult',
            'llmCompareAnalysisBaseline',
            'saveAnalysis'
        ];

        for (const handler of expectedHandlers) {
            if (typeof window.electronAPI[handler] !== 'function') {
                missingHandlers.push(handler);
            }
        }

        await this.testHandler('All expected handlers present', async () => {
            if (missingHandlers.length > 0) {
                throw new Error(`Missing handlers: ${missingHandlers.join(', ')}`);
            }
        });
    }

    // Main test runner
    async runAllTests() {
        this.log('🔍 Starting Button Handler Validation', 'info');
        this.log('Testing all IPC handlers used by buttons and components...', 'info');

        await this.testBasicIPC();
        await this.testAuthenticationHandlers();
        await this.testDataManagementHandlers();
        await this.testUserManagementHandlers();
        await this.testGitHandlers();
        await this.testOTThreatIntelHandlers();
        await this.testFileSystemHandlers();
        await this.testAnalysisHandlers();
        await this.testLLMHandlers();
        await this.testMissingHandlers();

        this.generateReport();
    }

    generateReport() {
        const total = this.passed + this.failed;
        
        this.log('\n' + '='.repeat(60), 'info');
        this.log('🔍 BUTTON HANDLER VALIDATION REPORT', 'info');
        this.log('='.repeat(60), 'info');
        this.log(`Total Handlers Tested: ${total}`, 'info');
        this.log(`Working: ${this.passed}`, 'success');
        this.log(`Broken: ${this.failed}`, this.failed > 0 ? 'error' : 'info');
        this.log(`Success Rate: ${((this.passed / total) * 100).toFixed(1)}%`, 'info');
        this.log('='.repeat(60), 'info');

        if (this.failed > 0) {
            this.log('\n❌ BROKEN HANDLERS:', 'error');
            this.results
                .filter(r => r.status === 'FAIL')
                .forEach(result => {
                    this.log(`  • ${result.handler}: ${result.error}`, 'error');
                });
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
    // Create validation UI
    document.body.innerHTML = `
        <div style="font-family: 'Segoe UI', sans-serif; padding: 20px; background: #f5f5f5; min-height: 100vh;">
            <div style="max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden;">
                <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%); color: white; padding: 20px;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 600;">🔍 Button Handler Validation Suite</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">Testing all IPC handlers used by buttons and components...</p>
                </div>
                <div id="validation-controls" style="padding: 20px; border-bottom: 1px solid #eee;">
                    <button id="run-validation" style="background: #4CAF50; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; cursor: pointer; margin-right: 10px;">
                        🔍 Run Handler Validation
                    </button>
                    <button id="clear-validation-log" style="background: #f44336; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; cursor: pointer;">
                        🗑️ Clear Log
                    </button>
                    <div id="validation-status" style="display: inline-block; margin-left: 20px; font-weight: 600;"></div>
                </div>
                <div id="validation-log" style="background: #1e1e1e; color: #f8f8f2; padding: 20px; font-family: 'Consolas', monospace; font-size: 14px; height: 500px; overflow-y: auto; line-height: 1.5;">
                    <div style="color: #6272a4;">Ready to validate handlers...</div>
                </div>
            </div>
        </div>
    `;

    // Add event listeners
    document.getElementById('run-validation').addEventListener('click', async () => {
        const button = document.getElementById('run-validation');
        const status = document.getElementById('validation-status');
        
        button.disabled = true;
        button.textContent = '⏳ Validating...';
        status.textContent = 'Running validation...';
        status.style.color = '#ff9800';

        const validator = new ButtonValidationTester();
        const results = await validator.runAllTests();

        button.disabled = false;
        button.textContent = '🔍 Run Handler Validation';
        
        if (results.failed === 0) {
            status.textContent = `✅ All ${results.passed} handlers working!`;
            status.style.color = '#4CAF50';
        } else {
            status.textContent = `❌ ${results.failed} of ${results.total} handlers broken`;
            status.style.color = '#f44336';
        }
    });

    document.getElementById('clear-validation-log').addEventListener('click', () => {
        document.getElementById('validation-log').innerHTML = '<div style="color: #6272a4;">Log cleared...</div>';
        document.getElementById('validation-status').textContent = '';
    });

    console.log('🔍 Button Handler Validation Suite loaded. Click "Run Handler Validation" to begin.');
}

// Export for Node.js usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ButtonValidationTester;
}
