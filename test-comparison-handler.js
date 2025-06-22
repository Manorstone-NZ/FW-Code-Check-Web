// Test LLM Compare Analysis to Baseline Handler
// This script tests the comparison functionality directly

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class ComparisonTester {
    constructor() {
        this.results = [];
    }

    log(test, status, message) {
        const result = { test, status, message, timestamp: new Date().toISOString() };
        this.results.push(result);
        console.log(`${status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️'} ${test}: ${message}`);
    }

    async runPythonScript(args) {
        return new Promise((resolve, reject) => {
            const python = spawn('python3', args, {
                cwd: __dirname,
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let stdout = '';
            let stderr = '';

            python.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            python.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            python.on('close', (code) => {
                resolve({ code, stdout, stderr });
            });

            python.on('error', (error) => {
                reject(error);
            });
        });
    }

    async testDirectComparison() {
        console.log('\n🔍 TESTING DIRECT COMPARISON FUNCTIONALITY');
        console.log('==========================================');

        try {
            // Create test files
            const testAnalysis = {
                findings: [
                    { type: 'security', message: 'Test security finding', severity: 'high' }
                ],
                summary: 'Test analysis'
            };

            const testBaseline = {
                findings: [
                    { type: 'security', message: 'Test baseline finding', severity: 'medium' }
                ],
                summary: 'Test baseline'
            };

            const analysisPath = path.join(__dirname, 'test-analysis.json');
            const baselinePath = path.join(__dirname, 'test-baseline.json');

            fs.writeFileSync(analysisPath, JSON.stringify(testAnalysis, null, 2));
            fs.writeFileSync(baselinePath, JSON.stringify(testBaseline, null, 2));

            this.log('File Creation', 'PASS', 'Test files created successfully');

            // Test Python comparison script directly
            const result = await this.runPythonScript([
                path.join(__dirname, 'src/python/analyzer.py'),
                '--compare',
                analysisPath,
                baselinePath
            ]);

            if (result.code === 0) {
                this.log('Python Comparison', 'PASS', 'Python comparison script executed successfully');
                console.log('Comparison result:', result.stdout);
            } else {
                this.log('Python Comparison', 'FAIL', `Error: ${result.stderr}`);
            }

            // Clean up test files
            fs.unlinkSync(analysisPath);
            fs.unlinkSync(baselinePath);
            this.log('Cleanup', 'PASS', 'Test files cleaned up');

        } catch (error) {
            this.log('Direct Comparison Test', 'FAIL', `Exception: ${error.message}`);
        }
    }

    async testElectronHandler() {
        console.log('\n⚡ TESTING ELECTRON HANDLER EXISTS');
        console.log('==================================');

        try {
            const electronPath = path.join(__dirname, 'src', 'main', 'electron.js');
            const electronContent = fs.readFileSync(electronPath, 'utf8');

            if (electronContent.includes('llm-compare-analysis-baseline')) {
                this.log('Electron Handler', 'PASS', 'llm-compare-analysis-baseline handler exists');
            } else {
                this.log('Electron Handler', 'FAIL', 'llm-compare-analysis-baseline handler missing');
            }

            // Check preload.js
            const preloadPath = path.join(__dirname, 'src', 'main', 'preload.js');
            const preloadContent = fs.readFileSync(preloadPath, 'utf8');

            if (preloadContent.includes('llmCompareAnalysisBaseline')) {
                this.log('Preload Method', 'PASS', 'llmCompareAnalysisBaseline method exists in preload');
            } else {
                this.log('Preload Method', 'FAIL', 'llmCompareAnalysisBaseline method missing from preload');
            }

        } catch (error) {
            this.log('Electron Handler Test', 'FAIL', `Exception: ${error.message}`);
        }
    }

    async testComparisonWorkflow() {
        console.log('\n🔄 TESTING COMPARISON WORKFLOW');
        console.log('===============================');

        try {
            // Test database comparison functions
            const dbResult = await this.runPythonScript([
                path.join(__dirname, 'src/python/db.py'),
                '--list-comparison-history'
            ]);

            if (dbResult.code === 0) {
                this.log('Database Comparison', 'PASS', 'Comparison history listing works');
            } else {
                this.log('Database Comparison', 'FAIL', `Error: ${dbResult.stderr}`);
            }

        } catch (error) {
            this.log('Comparison Workflow', 'FAIL', `Exception: ${error.message}`);
        }
    }

    generateReport() {
        console.log('\n📊 COMPARISON FUNCTIONALITY REPORT');
        console.log('===================================');

        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;
        const info = this.results.filter(r => r.status === 'INFO').length;

        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`⚠️ Info: ${info}`);
        console.log(`📊 Total: ${this.results.length}`);

        if (failed === 0) {
            console.log('\n🎉 COMPARISON FUNCTIONALITY IS WORKING!');
            console.log('The llm-compare-analysis-baseline handler should be functional.');
            console.log('');
            console.log('If you\'re still seeing the error, try:');
            console.log('1. Restart the Electron application');
            console.log('2. Clear the Electron cache');
            console.log('3. Check the browser console for more details');
        } else {
            console.log('\n⚠️ Some comparison functionality tests failed.');
            console.log('Review the results above to identify issues.');
        }
    }

    async run() {
        console.log('🚀 TESTING COMPARISON FUNCTIONALITY');
        console.log('====================================');
        console.log('This test validates the llm-compare-analysis-baseline handler');
        console.log('');

        await this.testElectronHandler();
        await this.testDirectComparison();
        await this.testComparisonWorkflow();

        this.generateReport();
    }
}

// Run the test
const tester = new ComparisonTester();
tester.run().catch(console.error);
