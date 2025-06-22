/**
 * Comprehensive First Watch PLC Code Checker Application Test Suite
 * 
 * This script tests all major workflows and functionality of the application:
 * 1. Authentication (login/register/logout)
 * 2. File upload and analysis
 * 3. Baseline management (create/list/delete)
 * 4. Analysis history and comparisons
 * 5. User management (admin functions)
 * 6. OT Threat Intelligence
 * 7. LLM Logs and settings
 * 8. Error handling and edge cases
 */

class AppTester {
    constructor() {
        this.testResults = [];
        this.currentUser = null;
        this.testBaselines = [];
        this.testAnalyses = [];
        this.startTime = Date.now();
    }

    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        console.log(logMessage);
        
        // Also log to the page for visibility
        if (typeof document !== 'undefined') {
            const logElement = document.getElementById('test-log');
            if (logElement) {
                const logLine = document.createElement('div');
                logLine.className = `log-${level}`;
                logLine.textContent = logMessage;
                logElement.appendChild(logLine);
                logElement.scrollTop = logElement.scrollHeight;
            }
        }
    }

    async runTest(testName, testFunction) {
        this.log(`Starting test: ${testName}`, 'info');
        try {
            const result = await testFunction();
            this.testResults.push({ name: testName, status: 'PASS', result });
            this.log(`✅ ${testName} - PASSED`, 'success');
            return result;
        } catch (error) {
            this.testResults.push({ name: testName, status: 'FAIL', error: error.message });
            this.log(`❌ ${testName} - FAILED: ${error.message}`, 'error');
            throw error;
        }
    }

    // Test 1: Check if all required Electron API functions are available
    async testElectronAPIAvailability() {
        return this.runTest('Electron API Availability', async () => {
            const requiredAPIs = [
                'authenticateUser', 'registerUser', 'createSession', 'validateSession', 'logoutSession',
                'uploadFile', 'analyzeFile', 'saveBaseline', 'getBaselines', 'deleteBaseline',
                'getAnalyses', 'getAnalysis', 'compareAnalyses', 'getUserList', 'createUser',
                'deleteUser', 'syncOTThreatIntel', 'getOTThreatIntel', 'getLLMLog'
            ];

            const missing = [];
            for (const api of requiredAPIs) {
                if (!window.electronAPI || typeof window.electronAPI[api] !== 'function') {
                    missing.push(api);
                }
            }

            if (missing.length > 0) {
                throw new Error(`Missing Electron APIs: ${missing.join(', ')}`);
            }

            return { availableAPIs: requiredAPIs.length, missingAPIs: 0 };
        });
    }

    // Test 2: User Registration
    async testUserRegistration() {
        return this.runTest('User Registration', async () => {
            const testUsername = `testuser_${Date.now()}`;
            const testEmail = `${testUsername}@test.com`;
            const testPassword = 'TestPassword123!';

            const result = await window.electronAPI.registerUser(testUsername, testEmail, testPassword, 'user');
            
            if (!result.success) {
                throw new Error(`Registration failed: ${result.error}`);
            }

            return { username: testUsername, email: testEmail };
        });
    }

    // Test 3: User Authentication
    async testUserAuthentication() {
        return this.runTest('User Authentication', async () => {
            // First, register a test user
            const testUsername = `authtest_${Date.now()}`;
            const testEmail = `${testUsername}@test.com`;
            const testPassword = 'TestPassword123!';

            const regResult = await window.electronAPI.registerUser(testUsername, testEmail, testPassword, 'user');
            if (!regResult.success) {
                throw new Error(`Failed to register test user: ${regResult.error}`);
            }

            // Now authenticate
            const authResult = await window.electronAPI.authenticateUser(testUsername, testPassword);
            if (!authResult.success) {
                throw new Error(`Authentication failed: ${authResult.error}`);
            }

            this.currentUser = authResult.user;
            return { user: authResult.user };
        });
    }

    // Test 4: Session Management
    async testSessionManagement() {
        return this.runTest('Session Management', async () => {
            if (!this.currentUser) {
                throw new Error('No authenticated user available for session test');
            }

            // Create session
            const sessionResult = await window.electronAPI.createSession(this.currentUser.id);
            if (!sessionResult.success) {
                throw new Error(`Session creation failed: ${sessionResult.error}`);
            }

            const sessionToken = sessionResult.session.token;

            // Validate session
            const validateResult = await window.electronAPI.validateSession(sessionToken);
            if (!validateResult.success) {
                throw new Error(`Session validation failed: ${validateResult.error}`);
            }

            // Logout session
            const logoutResult = await window.electronAPI.logoutSession(sessionToken);
            if (!logoutResult.success) {
                throw new Error(`Session logout failed: ${logoutResult.error}`);
            }

            return { sessionToken, validated: true, loggedOut: true };
        });
    }

    // Test 5: File Upload and Analysis
    async testFileAnalysis() {
        return this.runTest('File Upload and Analysis', async () => {
            // Create a mock PLC file content
            const mockPLCContent = `<?xml version="1.0" encoding="UTF-8"?>
<RSLogix5000Content SchemaRevision="1.0">
    <Controller Use="Context" Name="TestController">
        <Programs>
            <Program Use="Context" Name="MainProgram">
                <Routines>
                    <Routine Use="Context" Name="MainRoutine" Type="RLL">
                        <RLLContent>
                            <Rung Number="0" Type="N">
                                <Text>XIC(Start_Button)OTE(Motor_Start);</Text>
                            </Rung>
                        </RLLContent>
                    </Routine>
                </Routines>
            </Program>
        </Programs>
    </Controller>
</RSLogix5000Content>`;

            // Create a temporary file
            const blob = new Blob([mockPLCContent], { type: 'application/xml' });
            const file = new File([blob], 'test_plc.L5X', { type: 'application/xml' });

            // Upload and analyze
            const uploadResult = await window.electronAPI.uploadFile(file.name, mockPLCContent);
            if (!uploadResult.success) {
                throw new Error(`File upload failed: ${uploadResult.error}`);
            }

            const analysisResult = await window.electronAPI.analyzeFile(uploadResult.fileId, {
                provider: 'openai',
                model: 'gpt-4'
            });
            
            if (!analysisResult.success) {
                throw new Error(`File analysis failed: ${analysisResult.error}`);
            }

            this.testAnalyses.push(analysisResult.analysis);
            return { fileId: uploadResult.fileId, analysisId: analysisResult.analysis.id };
        });
    }

    // Test 6: Baseline Management
    async testBaselineManagement() {
        return this.runTest('Baseline Management', async () => {
            if (this.testAnalyses.length === 0) {
                throw new Error('No analyses available for baseline creation');
            }

            const analysis = this.testAnalyses[0];
            const baselineName = `Test Baseline ${Date.now()}`;

            // Save baseline
            const saveResult = await window.electronAPI.saveBaseline(analysis.id, baselineName, 'Test baseline description');
            if (!saveResult.success) {
                throw new Error(`Baseline save failed: ${saveResult.error}`);
            }

            this.testBaselines.push(saveResult.baseline);

            // Get baselines list
            const baselinesResult = await window.electronAPI.getBaselines();
            if (!baselinesResult.success) {
                throw new Error(`Get baselines failed: ${baselinesResult.error}`);
            }

            const savedBaseline = baselinesResult.baselines.find(b => b.id === saveResult.baseline.id);
            if (!savedBaseline) {
                throw new Error('Saved baseline not found in baselines list');
            }

            // Delete baseline
            const deleteResult = await window.electronAPI.deleteBaseline(saveResult.baseline.id);
            if (!deleteResult.success) {
                throw new Error(`Baseline deletion failed: ${deleteResult.error}`);
            }

            return { 
                created: saveResult.baseline.id, 
                found: true, 
                deleted: true 
            };
        });
    }

    // Test 7: Analysis History
    async testAnalysisHistory() {
        return this.runTest('Analysis History', async () => {
            const analysesResult = await window.electronAPI.getAnalyses();
            if (!analysesResult.success) {
                throw new Error(`Get analyses failed: ${analysesResult.error}`);
            }

            if (analysesResult.analyses.length === 0) {
                throw new Error('No analyses found in history');
            }

            // Get specific analysis
            const analysisId = analysesResult.analyses[0].id;
            const analysisResult = await window.electronAPI.getAnalysis(analysisId);
            if (!analysisResult.success) {
                throw new Error(`Get analysis failed: ${analysisResult.error}`);
            }

            return { 
                totalAnalyses: analysesResult.analyses.length,
                retrievedAnalysis: analysisResult.analysis.id 
            };
        });
    }

    // Test 8: User Management (Admin Functions)
    async testUserManagement() {
        return this.runTest('User Management', async () => {
            // Get user list
            const usersResult = await window.electronAPI.getUserList();
            if (!usersResult.success) {
                throw new Error(`Get user list failed: ${usersResult.error}`);
            }

            const initialUserCount = usersResult.users.length;

            // Create a new user
            const newUsername = `mgmttest_${Date.now()}`;
            const createResult = await window.electronAPI.createUser(
                newUsername,
                `${newUsername}@test.com`,
                'TempPassword123!',
                'user'
            );
            
            if (!createResult.success) {
                throw new Error(`User creation failed: ${createResult.error}`);
            }

            // Verify user was created
            const updatedUsersResult = await window.electronAPI.getUserList();
            if (!updatedUsersResult.success) {
                throw new Error(`Get updated user list failed: ${updatedUsersResult.error}`);
            }

            if (updatedUsersResult.users.length !== initialUserCount + 1) {
                throw new Error('User count did not increase after creation');
            }

            // Delete the test user
            const deleteResult = await window.electronAPI.deleteUser(createResult.user.id);
            if (!deleteResult.success) {
                throw new Error(`User deletion failed: ${deleteResult.error}`);
            }

            return { 
                initialCount: initialUserCount,
                created: createResult.user.id,
                deleted: true 
            };
        });
    }

    // Test 9: OT Threat Intelligence
    async testOTThreatIntel() {
        return this.runTest('OT Threat Intelligence', async () => {
            // Get current threat intel data
            const threatIntelResult = await window.electronAPI.getOTThreatIntel();
            if (!threatIntelResult.success) {
                throw new Error(`Get OT threat intel failed: ${threatIntelResult.error}`);
            }

            const initialCount = threatIntelResult.data ? threatIntelResult.data.length : 0;

            // Sync threat intel (this may take time in real scenarios)
            const syncResult = await window.electronAPI.syncOTThreatIntel();
            if (!syncResult.success) {
                throw new Error(`Sync OT threat intel failed: ${syncResult.error}`);
            }

            return { 
                initialCount,
                syncCompleted: true 
            };
        });
    }

    // Test 10: LLM Log Functionality
    async testLLMLog() {
        return this.runTest('LLM Log Functionality', async () => {
            const logResult = await window.electronAPI.getLLMLog();
            if (!logResult.success) {
                throw new Error(`Get LLM log failed: ${logResult.error}`);
            }

            return { 
                logEntries: logResult.logs ? logResult.logs.length : 0 
            };
        });
    }

    // Test 11: Error Handling
    async testErrorHandling() {
        return this.runTest('Error Handling', async () => {
            const tests = [];

            // Test invalid authentication
            try {
                const result = await window.electronAPI.authenticateUser('nonexistent', 'wrongpassword');
                if (result.success) {
                    throw new Error('Invalid authentication should fail');
                }
                tests.push('invalid_auth_handled');
            } catch (error) {
                if (error.message === 'Invalid authentication should fail') {
                    throw error;
                }
                tests.push('invalid_auth_handled');
            }

            // Test invalid file analysis
            try {
                const result = await window.electronAPI.analyzeFile(999999, { provider: 'openai' });
                if (result.success) {
                    throw new Error('Invalid file analysis should fail');
                }
                tests.push('invalid_analysis_handled');
            } catch (error) {
                if (error.message === 'Invalid file analysis should fail') {
                    throw error;
                }
                tests.push('invalid_analysis_handled');
            }

            // Test invalid baseline deletion
            try {
                const result = await window.electronAPI.deleteBaseline(999999);
                if (result.success) {
                    throw new Error('Invalid baseline deletion should fail');
                }
                tests.push('invalid_delete_handled');
            } catch (error) {
                if (error.message === 'Invalid baseline deletion should fail') {
                    throw error;
                }
                tests.push('invalid_delete_handled');
            }

            return { errorTestsPassed: tests };
        });
    }

    // Test 12: Performance and Memory
    async testPerformance() {
        return this.runTest('Performance and Memory', async () => {
            const startMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
            const startTime = performance.now();

            // Perform multiple operations
            const operations = [];
            for (let i = 0; i < 5; i++) {
                operations.push(window.electronAPI.getBaselines());
                operations.push(window.electronAPI.getAnalyses());
                operations.push(window.electronAPI.getUserList());
            }

            await Promise.all(operations);

            const endTime = performance.now();
            const endMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;

            return {
                operationsTime: endTime - startTime,
                memoryDelta: endMemory - startMemory,
                operationsCount: operations.length
            };
        });
    }

    // Main test runner
    async runAllTests() {
        this.log('🚀 Starting Comprehensive App Test Suite', 'info');
        
        try {
            // Core functionality tests
            await this.testElectronAPIAvailability();
            await this.testUserRegistration();
            await this.testUserAuthentication();
            await this.testSessionManagement();
            
            // Feature tests
            await this.testFileAnalysis();
            await this.testBaselineManagement();
            await this.testAnalysisHistory();
            await this.testUserManagement();
            await this.testOTThreatIntel();
            await this.testLLMLog();
            
            // Edge case and performance tests
            await this.testErrorHandling();
            await this.testPerformance();

        } catch (error) {
            this.log(`Critical test failure: ${error.message}`, 'error');
        }

        // Generate final report
        this.generateReport();
    }

    generateReport() {
        const endTime = Date.now();
        const totalTime = endTime - this.startTime;
        
        const passed = this.testResults.filter(t => t.status === 'PASS').length;
        const failed = this.testResults.filter(t => t.status === 'FAIL').length;
        const total = this.testResults.length;

        this.log('\n' + '='.repeat(60), 'info');
        this.log('📊 COMPREHENSIVE TEST REPORT', 'info');
        this.log('='.repeat(60), 'info');
        this.log(`Total Tests: ${total}`, 'info');
        this.log(`Passed: ${passed}`, 'success');
        this.log(`Failed: ${failed}`, failed > 0 ? 'error' : 'info');
        this.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`, 'info');
        this.log(`Total Time: ${(totalTime / 1000).toFixed(2)}s`, 'info');
        this.log('='.repeat(60), 'info');

        if (failed > 0) {
            this.log('\n❌ FAILED TESTS:', 'error');
            this.testResults
                .filter(t => t.status === 'FAIL')
                .forEach(test => {
                    this.log(`  • ${test.name}: ${test.error}`, 'error');
                });
        }

        this.log('\n✅ PASSED TESTS:', 'success');
        this.testResults
            .filter(t => t.status === 'PASS')
            .forEach(test => {
                this.log(`  • ${test.name}`, 'success');
            });

        return {
            total,
            passed,
            failed,
            successRate: (passed / total) * 100,
            totalTime,
            results: this.testResults
        };
    }
}

// Auto-run tests when script loads in browser context
if (typeof window !== 'undefined' && window.electronAPI) {
    // Create test UI
    document.body.innerHTML = `
        <div style="font-family: 'Segoe UI', sans-serif; padding: 20px; background: #f5f5f5; min-height: 100vh;">
            <div style="max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 600;">🧪 First Watch PLC Code Checker - Comprehensive Test Suite</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">Testing all application functionality and workflows...</p>
                </div>
                <div id="test-controls" style="padding: 20px; border-bottom: 1px solid #eee;">
                    <button id="run-tests" style="background: #4CAF50; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; cursor: pointer; margin-right: 10px;">
                        🚀 Run All Tests
                    </button>
                    <button id="clear-log" style="background: #f44336; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; cursor: pointer;">
                        🗑️ Clear Log
                    </button>
                    <div id="test-status" style="display: inline-block; margin-left: 20px; font-weight: 600;"></div>
                </div>
                <div id="test-log" style="background: #1e1e1e; color: #f8f8f2; padding: 20px; font-family: 'Consolas', monospace; font-size: 14px; height: 500px; overflow-y: auto; line-height: 1.5;">
                    <div style="color: #6272a4;">Ready to run tests...</div>
                </div>
            </div>
        </div>
        <style>
            .log-info { color: #f8f8f2; }
            .log-success { color: #50fa7b; }
            .log-error { color: #ff5555; }
            .log-warn { color: #ffb86c; }
            #run-tests:hover { background: #45a049; }
            #clear-log:hover { background: #da190b; }
        </style>
    `;

    // Add event listeners
    document.getElementById('run-tests').addEventListener('click', async () => {
        const button = document.getElementById('run-tests');
        const status = document.getElementById('test-status');
        
        button.disabled = true;
        button.textContent = '⏳ Running Tests...';
        status.textContent = 'Running...';
        status.style.color = '#ff9800';

        const tester = new AppTester();
        const results = await tester.runAllTests();

        button.disabled = false;
        button.textContent = '🚀 Run All Tests';
        
        if (results.failed === 0) {
            status.textContent = `✅ All ${results.passed} tests passed!`;
            status.style.color = '#4CAF50';
        } else {
            status.textContent = `❌ ${results.failed} of ${results.total} tests failed`;
            status.style.color = '#f44336';
        }
    });

    document.getElementById('clear-log').addEventListener('click', () => {
        document.getElementById('test-log').innerHTML = '<div style="color: #6272a4;">Log cleared...</div>';
        document.getElementById('test-status').textContent = '';
    });

    console.log('🧪 Comprehensive Test Suite loaded. Click "Run All Tests" to begin.');
}

// Export for Node.js usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppTester;
}
