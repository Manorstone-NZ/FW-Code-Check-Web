const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs/promises');

let mainWindow = null;

// Use venv python if available
const venvPython = path.join(__dirname, '../../venv/bin/python3');
const pythonExec = require('fs').existsSync(venvPython) ? venvPython : 'python3';

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

    mainWindow.loadURL('http://localhost:3000');

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
        const pythonProcess = spawn(pythonExec, [scriptPath, ...args], {
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
        return { success: true, path: homeDir };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Git handlers
ipcMain.handle('git-connect-repository', async (event, repoPath) => {
    return createPythonHandler(path.join(__dirname, '../python/git_integration.py'), ['--connect', repoPath]);
});

ipcMain.handle('git-get-branches', async () => {
    return createPythonHandler(path.join(__dirname, '../python/git_integration.py'), ['--branches']);
});

ipcMain.handle('git-get-files', async (event, branch) => {
    const args = ['--files'];
    if (branch) args.push(branch);
    return createPythonHandler(path.join(__dirname, '../python/git_integration.py'), args);
});

// Git file analysis handler
ipcMain.handle('git-analyze-file', async (event, fileName, branch, provider, model) => {
    const args = ['--analyze-file', fileName];
    if (branch) args.push('--branch', branch);
    if (provider) args.push('--provider', provider);
    if (model) args.push('--model', model);
    return createPythonHandler(path.join(__dirname, '../python/git_integration.py'), args);
});

// OT Threat Intel handlers
ipcMain.handle('get-ot-threat-intel-entries', async () => {
    try {
        return await createPythonHandler(path.join(__dirname, '../python/db.py'), ['--get-ot-threat-intel-entries']);
    } catch (e) {
        return [];
    }
});

ipcMain.handle('get-ot-threat-intel-last-sync', async () => {
    try {
        return await createPythonHandler(path.join(__dirname, '../python/db.py'), ['--get-ot-threat-intel-last-sync']);
    } catch (e) {
        return null;
    }
});

ipcMain.handle('sync-ot-threat-intel', async (event, provider) => {
    return createPythonHandler(path.join(__dirname, '../python/sync_ot_threat_intel.py'), ['--sync', provider || 'default']);
});

ipcMain.handle('update-ot-threat-intel-entry', async (event, entry) => {
    return createPythonHandler(path.join(__dirname, '../python/db.py'), ['--update-ot-threat-intel-entry', JSON.stringify(entry)]);
});

// Comparison handlers
ipcMain.handle('get-saved-comparisons', async () => {
    try {
        return await createPythonHandler(path.join(__dirname, '../python/db.py'), ['--list-comparison-results']);
    } catch (e) {
        return [];
    }
});

ipcMain.handle('delete-comparison-result', async (event, id) => {
    return createPythonHandler(path.join(__dirname, '../python/db.py'), ['--delete-comparison-result', id.toString()]);
});

ipcMain.handle('list-comparison-history', async (event, analysisId, baselineId) => {
    return createPythonHandler(path.join(__dirname, '../python/db.py'), ['--list-comparison-history', analysisId.toString(), baselineId.toString()]);
});

// LLM logs handler
ipcMain.handle('get-llm-logs', async () => {
    try {
        return await createPythonHandler(path.join(__dirname, '../python/db.py'), ['--get-llm-logs']);
    } catch (e) {
        return [];
    }
});

// Debug handler
ipcMain.handle('debug-log-hook', async (event, logData) => {
    console.log('[Debug Log]:', logData);
    return { success: true };
});

// Database reset handler
ipcMain.handle('reset-db', async () => {
    return createPythonHandler(path.join(__dirname, '../python/db.py'), ['--reset-db']);
});

console.log('[Electron] All IPC handlers registered successfully');
