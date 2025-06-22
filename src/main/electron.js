const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs/promises');
const fsSync = require('fs');

let mainWindow = null;

// Use venv python if available
const venvPython = path.join(__dirname, '../../venv/bin/python3');
const pythonExec = fsSync.existsSync(venvPython) ? venvPython : 'python3';

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    // Load the built React app from public/index.html
    const indexPath = path.join(__dirname, '../../public/index.html');
    mainWindow.loadFile(indexPath);

    // Add menu for easy access to test suite
    const { Menu } = require('electron');
    const menuTemplate = [
        {
            label: 'File',
            submenu: [
                { role: 'quit' }
            ]
        },
        {
            label: 'Testing',
            submenu: [
                {
                    label: 'Master Test Suite Dashboard',
                    click: () => {
                        // Open test dashboard in new window
                        const testWindow = new BrowserWindow({
                            width: 1400,
                            height: 900,
                            webPreferences: {
                                preload: path.join(__dirname, 'preload.js'),
                                contextIsolation: true,
                                nodeIntegration: false,
                            },
                        });
                        const testDashboardPath = path.join(__dirname, '../../public/master-test-dashboard.html');
                        testWindow.loadFile(testDashboardPath);
                    }
                },
                {
                    label: 'Button Handler Validation',
                    click: () => {
                        // Open button validation in new window
                        const buttonWindow = new BrowserWindow({
                            width: 1200,
                            height: 800,
                            webPreferences: {
                                preload: path.join(__dirname, 'preload.js'),
                                contextIsolation: true,
                                nodeIntegration: false,
                            },
                        });
                        const buttonValidationPath = path.join(__dirname, '../../public/button-validation.html');
                        buttonWindow.loadFile(buttonValidationPath);
                    }
                },
                { type: 'separator' },
                {
                    label: 'Open DevTools',
                    accelerator: 'F12',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.openDevTools();
                        }
                    }
                }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'About',
                            message: 'First Watch PLC Code Checker V2',
                            detail: 'Comprehensive validation and testing suite for PLC code analysis.'
                        });
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

// Helper function to create Python process handlers
function createPythonHandler(scriptPath, args = []) {
    return new Promise((resolve, reject) => {
        // Sanitize arguments to prevent null bytes and other issues
        const sanitizedArgs = args.map(arg => {
            if (arg == null || arg === undefined) {
                return '';
            }
            return String(arg).replace(/\0/g, ''); // Remove null bytes
        });

        const pythonProcess = spawn(pythonExec, [scriptPath, ...sanitizedArgs], {
            cwd: path.resolve(__dirname, '../..'),
            env: process.env
        });

        let output = '';
        let errorOutput = '';

        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code === 0) {
                try {
                    const result = JSON.parse(output);
                    resolve(result);
                } catch (e) {
                    // If not JSON, return raw output
                    resolve({ success: true, data: output.trim() });
                }
            } else {
                reject(new Error(errorOutput || `Process failed with code ${code}`));
            }
        });
    });
}

// Core handlers
ipcMain.handle('list-baselines', async () => {
    return createPythonHandler(path.join(__dirname, '../python/db.py'), ['--list-baselines']);
});

ipcMain.handle('list-analyses', async () => {
    return createPythonHandler(path.join(__dirname, '../python/db.py'), ['--list-analyses']);
});

ipcMain.handle('get-analyses', async () => {
    return createPythonHandler(path.join(__dirname, '../python/db.py'), ['--list-analyses']);
});

ipcMain.handle('get-analysis', async (event, id) => {
    return createPythonHandler(path.join(__dirname, '../python/db.py'), ['--get-analysis', id.toString()]);
});

ipcMain.handle('get-baseline', async (event, id) => {
    return createPythonHandler(path.join(__dirname, '../python/db.py'), ['--get-baseline', id.toString()]);
});

ipcMain.handle('save-baseline', async (event, fileName, originalName, filePath, analysis_json, provider, model) => {
    const args = ['--save-baseline', fileName || ''];
    if (originalName) args.push(originalName); else args.push('');
    if (filePath) args.push(filePath); else args.push('');
    if (analysis_json) args.push(JSON.stringify(analysis_json)); else args.push('');
    if (provider) args.push(provider); else args.push('');
    if (model) args.push(model); else args.push('');
    
    return createPythonHandler(path.join(__dirname, '../python/db.py'), args);
});

ipcMain.handle('delete-baseline', async (event, id) => {
    return createPythonHandler(path.join(__dirname, '../python/db.py'), ['--delete-baseline', id.toString()]);
});

// Additional analysis handlers
ipcMain.handle('delete-analysis', async (event, analysisId) => {
    return createPythonHandler(path.join(__dirname, '../python/db.py'), ['--delete-analysis', String(analysisId)]);
});

ipcMain.handle('save-analysis', async (event, fileName, status, analysisJson, filePath, provider, model) => {
    const args = ['--save-analysis', fileName, status, JSON.stringify(analysisJson)];
    if (filePath) args.push(filePath);
    if (provider) args.push(provider);
    if (model) args.push(model);
    return createPythonHandler(path.join(__dirname, '../python/db.py'), args);
});

// File analysis handler
ipcMain.handle('analyze-file', async (event, filePath, provider, model) => {
    console.log('[analyze-file] Running:', pythonExec, [path.join(__dirname, '../python/analyzer.py'), filePath, '--provider', provider || 'openai', '--model', model || 'gpt-4']);
    
    const args = [filePath];
    if (provider) {
        args.push('--provider', provider);
    }
    if (model) {
        args.push('--model', model);
    }

    return createPythonHandler(path.join(__dirname, '../python/analyzer.py'), args);
});

// LLM status handlers
ipcMain.handle('get-llm-status', async () => {
    return createPythonHandler(path.join(__dirname, '../python/analyzer.py'), ['--llm-status']);
});

ipcMain.handle('check-llm-status', async () => {
    return createPythonHandler(path.join(__dirname, '../python/analyzer.py'), ['--check-llm-status']);
});

// Authentication handlers
ipcMain.handle('login', async (event, credentials) => {
    console.log('[login] Running login for:', credentials.username);
    return createPythonHandler(path.join(__dirname, '../python/db.py'), ['--login', credentials.username, credentials.password]);
});

ipcMain.handle('validate-session', async (event, sessionToken) => {
    console.log('[validate-session] Running session validation');
    return createPythonHandler(path.join(__dirname, '../python/db.py'), ['--validate-session', sessionToken]);
});

ipcMain.handle('authenticate-user', async (event, username, password) => {
    return createPythonHandler(path.join(__dirname, '../python/db.py'), ['--authenticate-user', username, password]);
});

ipcMain.handle('register-user', async (event, username, email, password, role) => {
    return createPythonHandler(path.join(__dirname, '../python/db.py'), ['--create-user', username, email, password, role || 'analyst']);
});

ipcMain.handle('create-session', async (event, userId) => {
    return createPythonHandler(path.join(__dirname, '../python/db.py'), ['--create-session', userId.toString()]);
});

ipcMain.handle('logout-session', async (event, sessionToken) => {
    return createPythonHandler(path.join(__dirname, '../python/db.py'), ['--logout-session', sessionToken]);
});

// User management handlers
ipcMain.handle('list-users', async () => {
    return createPythonHandler(path.join(__dirname, '../python/db.py'), ['--list-users']);
});

ipcMain.handle('update-user', async (event, userId, userData) => {
    return createPythonHandler(path.join(__dirname, '../python/db.py'), ['--update-user', userId.toString(), JSON.stringify(userData)]);
});

ipcMain.handle('delete-user', async (event, userId) => {
    return createPythonHandler(path.join(__dirname, '../python/db.py'), ['--delete-user', userId.toString()]);
});

ipcMain.handle('toggle-user-status', async (event, userId, isActive) => {
    return createPythonHandler(path.join(__dirname, '../python/db.py'), ['--toggle-user-status', String(userId), String(isActive)]);
});

ipcMain.handle('reset-user-password', async (event, userId, newPassword) => {
    return createPythonHandler(path.join(__dirname, '../python/db.py'), ['--reset-user-password', String(userId), newPassword]);
});

// Directory picker handlers
ipcMain.handle('show-directory-picker', async () => {
    try {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory']
        });
        
        if (result.canceled || result.filePaths.length === 0) {
            return { success: false, error: 'No directory selected' };
        }
        
        return { success: true, path: result.filePaths[0] };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-home-directory', async () => {
    const os = require('os');
    try {
        const homeDir = os.homedir();
        return {
            success: true,
            path: homeDir
        };
    } catch (error) {
        console.error('Get home directory error:', error);
        return {
            success: false,
            error: error.message
        };
    }
});

// Git handlers
ipcMain.handle('git-connect-repository', async (event, repoPath) => {
    return createPythonHandler(path.join(__dirname, '../python/git_integration.py'), ['--connect', repoPath]);
});

ipcMain.handle('git-get-branches', async () => {
    return createPythonHandler(path.join(__dirname, '../python/git_integration.py'), ['--branches']);
});

ipcMain.handle('git-get-remote-branches', async (event, url) => {
    return createPythonHandler(path.join(__dirname, '../python/git_integration.py'), ['--remote-branches', url]);
});

ipcMain.handle('git-clone-repository', async (event, url, localPath, branch, username, password) => {
    const args = ['--clone', url, localPath];
    if (branch) args.push(branch);
    if (username) args.push(username);
    if (password) args.push(password);
    return createPythonHandler(path.join(__dirname, '../python/git_integration.py'), args);
});

ipcMain.handle('git-checkout-branch', async (event, branchName) => {
    return createPythonHandler(path.join(__dirname, '../python/git_integration.py'), ['--checkout', branchName]);
});

ipcMain.handle('git-get-status', async () => {
    return createPythonHandler(path.join(__dirname, '../python/git_integration.py'), ['--status']);
});

ipcMain.handle('git-get-files', async (event, branch) => {
    const args = ['--files'];
    if (branch) args.push(branch);
    return createPythonHandler(path.join(__dirname, '../python/git_integration.py'), args);
});

ipcMain.handle('git-commit-file', async (event, filePath, commitMessage, branch) => {
    const args = ['--commit-file', filePath, commitMessage];
    if (branch) args.push(branch);
    return createPythonHandler(path.join(__dirname, '../python/git_integration.py'), args);
});

ipcMain.handle('git-push-to-remote', async (event, branch, remote) => {
    const args = ['--push-to-remote'];
    if (branch) args.push(branch);
    if (remote) args.push(remote);
    return createPythonHandler(path.join(__dirname, '../python/git_integration.py'), args);
});

ipcMain.handle('git-copy-file-from-branch', async (event, filePath, sourceBranch, targetPath) => {
    const args = ['--copy-file-from-branch', filePath, sourceBranch];
    if (targetPath) args.push(targetPath);
    return createPythonHandler(path.join(__dirname, '../python/git_integration.py'), args);
});

// Git file analysis handler
ipcMain.handle('git-analyze-file', async (event, filePath, branch, provider, model) => {
    try {
        // Get file content from git using create-temp-file
        const tempArgs = [
            path.join(__dirname, '../python/git_integration.py'),
            '--create-temp-file',
            filePath,
            branch || 'main'
        ];
        
        console.log('[git-analyze-file] Creating temp file:', pythonExec, tempArgs);
        
        const getFileResult = await new Promise((resolve, reject) => {
            const pythonProcess = spawn(pythonExec, tempArgs, {
                cwd: path.resolve(__dirname, '../..'),
                env: process.env
            });
            
            let data = '';
            let error = '';
            
            pythonProcess.stdout.on('data', (chunk) => data += chunk);
            pythonProcess.stderr.on('data', (chunk) => {
                error += chunk;
                console.error('[git-analyze-file] Temp file stderr:', chunk.toString());
            });
            
            pythonProcess.on('close', (code) => {
                if (code === 0) {
                    try {
                        const result = JSON.parse(data);
                        if (result.success && result.temp_path) {
                            resolve(result.temp_path);
                        } else {
                            reject(new Error(result.error || 'Failed to create temp file'));
                        }
                    } catch (parseError) {
                        console.error('[git-analyze-file] Temp file parse error:', parseError);
                        reject(new Error('Invalid response from temp file creation'));
                    }
                } else {
                    console.error('[git-analyze-file] Temp file creation failed with code:', code, 'Error:', error);
                    reject(new Error(error || 'Failed to create temp file'));
                }
            });
        });
        
        // Now analyze the temp file using the analyzer
        const analyzeArgs = [
            path.join(__dirname, '../python/analyzer.py'),
            getFileResult
        ];
        
        if (provider) {
            analyzeArgs.push('--provider', provider);
        }
        if (model) {
            analyzeArgs.push('--model', model);
        }
        
        console.log('[git-analyze-file] Analyzing temp file:', pythonExec, analyzeArgs);
        
        const analysisResult = await new Promise((resolve, reject) => {
            const pythonProcess = spawn(pythonExec, analyzeArgs, {
                cwd: path.resolve(__dirname, '../..'),
                env: process.env
            });
            
            let data = '';
            let error = '';
            
            pythonProcess.stdout.on('data', (chunk) => data += chunk);
            pythonProcess.stderr.on('data', (chunk) => {
                error += chunk;
                console.error('[git-analyze-file] Analysis stderr:', chunk.toString());
            });
            
            pythonProcess.on('close', async (code) => {
                // Cleanup temp file
                try {
                    const fs = require('fs').promises;
                    await fs.unlink(getFileResult);
                } catch (cleanupError) {
                    console.warn('[git-analyze-file] Failed to cleanup temp file:', cleanupError);
                }
                
                if (code === 0) {
                    try {
                        const result = JSON.parse(data);
                        console.log('[git-analyze-file] Analysis success:', result);
                        
                        // Wrap the result to match expected frontend format
                        const wrappedResult = {
                            success: result.ok || false,
                            ...result,
                            git_metadata: {
                                original_path: filePath,
                                branch: branch,
                                temp_path: getFileResult,
                                analyzed_from_git: true
                            }
                        };
                        
                        resolve(wrappedResult);
                    } catch (parseError) {
                        console.error('[git-analyze-file] Analysis parse error:', parseError);
                        reject(new Error('Invalid response from analysis'));
                    }
                } else {
                    console.error('[git-analyze-file] Analysis failed with code:', code, 'Error:', error);
                    reject(new Error(error || 'Analysis failed'));
                }
            });
        });
        
        return analysisResult;
        
    } catch (error) {
        console.error('[git-analyze-file] Error:', error);
        return {
            success: false,
            error: error.message || 'Git file analysis failed'
        };
    }
});

// === OT THREAT INTEL HANDLERS ===

// Get OT threat intel entries
ipcMain.handle('get-ot-threat-intel-entries', async () => {
    try {
        const result = await createPythonHandler(path.join(__dirname, '../python/db.py'), ['--list-ot-threat-intel']);
        // Ensure we return an array
        if (result && Array.isArray(result.entries)) {
            return result.entries;
        } else if (Array.isArray(result)) {
            return result;
        } else {
            return []; // Return empty array if no valid data
        }
    } catch (error) {
        console.error('Get OT threat intel entries error:', error);
        return []; // Return empty array on error
    }
});

// Get OT threat intel last sync time
ipcMain.handle('get-ot-threat-intel-last-sync', async () => {
    try {
        return createPythonHandler(path.join(__dirname, '../python/db.py'), ['--get-ot-threat-intel-last-sync']);
    } catch (error) {
        console.error('Get OT threat intel last sync error:', error);
        return { success: false, error: error.message, lastSync: null };
    }
});

// Sync OT threat intel
ipcMain.handle('sync-ot-threat-intel', async (event, provider) => {
    try {
        const args = ['--sync'];
        if (provider) args.push('--provider', provider);
        return createPythonHandler(path.join(__dirname, '../python/sync_ot_threat_intel.py'), args);
    } catch (error) {
        console.error('Sync OT threat intel error:', error);
        return { success: false, error: error.message };
    }
});

// Update OT threat intel entry
ipcMain.handle('update-ot-threat-intel-entry', async (event, entry) => {
    try {
        const entryJson = JSON.stringify(entry);
        return createPythonHandler(path.join(__dirname, '../python/db.py'), ['--update-ot-threat-intel', entryJson]);
    } catch (error) {
        console.error('Update OT threat intel entry error:', error);
        return { success: false, error: error.message };
    }
});

// Clear OT threat intel
ipcMain.handle('clear-ot-threat-intel', async () => {
    try {
        return createPythonHandler(path.join(__dirname, '../python/db.py'), ['--clear-ot-threat-intel']);
    } catch (error) {
        console.error('Clear OT threat intel error:', error);
        return { success: false, error: error.message };
    }
});

// Bulk OT threat intel sync
ipcMain.handle('bulk-ot-threat-intel', async () => {
    try {
        return createPythonHandler(path.join(__dirname, '../python/sync_ot_threat_intel.py'), ['--bulk-ot-threat-intel']);
    } catch (error) {
        console.error('Bulk OT threat intel error:', error);
        return { success: false, error: error.message };
    }
});

// Get saved comparisons
ipcMain.handle('get-saved-comparisons', async () => {
    try {
        const result = await createPythonHandler(path.join(__dirname, '../python/db.py'), ['--list-comparison-history']);
        // Ensure we return an array
        if (result && Array.isArray(result.comparisons)) {
            return result.comparisons;
        } else if (Array.isArray(result)) {
            return result;
        } else {
            return []; // Return empty array if no valid data
        }
    } catch (error) {
        console.error('Get saved comparisons error:', error);
        return []; // Return empty array on error
    }
});

// Save comparison result
ipcMain.handle('save-comparison-result', async (event, payload) => {
    try {
        return createPythonHandler(path.join(__dirname, '../python/db.py'), [
            '--save-comparison-history',
            payload.analysisId?.toString() || '',
            payload.baselineId?.toString() || '',
            payload.llm_prompt || '',
            payload.llm_result || '',
            payload.analysisFileName || '',
            payload.baselineFileName || '',
            payload.provider || '',
            payload.model || ''
        ]);
    } catch (error) {
        console.error('Save comparison result error:', error);
        return { ok: false, error: error.message };
    }
});

// Delete comparison result
ipcMain.handle('delete-comparison-result', async (event, comparisonId) => {
    try {
        return createPythonHandler(path.join(__dirname, '../python/db.py'), [
            '--delete-comparison-history',
            comparisonId.toString()
        ]);
    } catch (error) {
        console.error('Delete comparison result error:', error);
        return { ok: false, error: error.message };
    }
});

// Get LLM logs
ipcMain.handle('get-llm-logs', async () => {
    try {
        const logsPath = path.join(__dirname, '../../llm-interactions.log.json');
        if (fsSync.existsSync(logsPath)) {
            const logsContent = fsSync.readFileSync(logsPath, 'utf8');
            const logs = logsContent.split('\n')
                .filter(line => line.trim())
                .map(line => {
                    try {
                        return JSON.parse(line);
                    } catch {
                        return null;
                    }
                })
                .filter(log => log !== null);
            return logs; // Return the array directly
        } else {
            return []; // Return empty array if no log file
        }
    } catch (error) {
        console.error('Get LLM logs error:', error);
        return []; // Return empty array on error
    }
});

// === Test Suite Handlers ===
ipcMain.handle('open-test-dashboard', async () => {
    try {
        // Open test dashboard in new window
        const testWindow = new BrowserWindow({
            width: 1400,
            height: 900,
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                contextIsolation: true,
                nodeIntegration: false,
            },
        });
        const testDashboardPath = path.join(__dirname, '../../public/master-test-dashboard.html');
        await testWindow.loadFile(testDashboardPath);
        return { success: true };
    } catch (error) {
        console.error('Open test dashboard error:', error);
        return { success: false, error: error.message };
    }
});

// === DevTools Handler ===
ipcMain.handle('open-dev-tools', async () => {
    try {
        if (mainWindow) {
            mainWindow.webContents.openDevTools();
            return { success: true };
        }
        return { success: false, error: 'Main window not available' };
    } catch (error) {
        console.error('Open DevTools error:', error);
        return { success: false, error: error.message };
    }
});

// === LLM Compare Analysis to Baseline Handler ===
ipcMain.handle('llm-compare-analysis-baseline', async (event, analysisPathOrContent, baselinePathOrContent, provider = 'ollama') => {
    try {
        console.log('LLM Compare request:', { analysisPathOrContent, baselinePathOrContent, provider });
        
        const args = [
            '--compare',
            analysisPathOrContent,
            baselinePathOrContent
        ];
        
        if (provider) {
            args.push('--provider', provider);
        }

        const result = await createPythonHandler(path.join(__dirname, '../python/analyzer.py'), args);
        console.log('LLM Compare result:', result);
        
        // The Python script outputs JSON with llm_comparison key directly
        return result;
    } catch (error) {
        console.error('LLM Compare error:', error);
        return {
            success: false,
            error: error.message
        };
    }
});
