const { app, BrowserWindow, ipcMain } = require('electron');
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

// Handler for list-baselines
ipcMain.handle('list-baselines', async () => {
  // ...existing code...
});

// File analysis handler
ipcMain.handle('analyze-file', async (event, filePath, provider, model) => {
  console.log('[analyze-file] Running:', pythonExec, [path.join(__dirname, '../python/analyzer.py'), filePath, '--provider', provider || 'openai', '--model', model || 'gpt-4']);
  return new Promise((resolve, reject) => {
    const args = [path.join(__dirname, '../python/analyzer.py'), filePath];
    if (provider) {
      args.push('--provider', provider);
    }
    if (model) {
      args.push('--model', model);
    }

    const pythonProcess = spawn(pythonExec, args, {
      cwd: path.resolve(__dirname, '../..'),
      env: process.env
    });

    let data = '';
    pythonProcess.stdout.on('data', (chunk) => data += chunk);
    pythonProcess.stderr.on('data', (chunk) => console.error(chunk.toString()));
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Invalid response from analysis service'));
        }
      } else {
        reject(new Error('Analysis service failed'));
      }
    });
  });
});

// LLM status checking handler
ipcMain.handle('get-llm-status', async () => {
  console.log('[get-llm-status] Called');
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(pythonExec, [
      path.join(__dirname, '../python/analyzer.py'), '--llm-status'
    ], {
      cwd: path.resolve(__dirname, '../..'),
      env: process.env
    });

    let data = '';
    pythonProcess.stdout.on('data', (chunk) => data += chunk);
    pythonProcess.stderr.on('data', (chunk) => console.error(chunk.toString()));
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(data);
          console.log('[get-llm-status] Result:', result);
          resolve(result);
        } catch (e) {
          reject(new Error('Invalid response from LLM status service'));
        }
      } else {
        reject(new Error('LLM status service failed'));
      }
    });
  });
});

// Authentication handlers
ipcMain.handle('login', async (event, credentials) => {
  console.log('[login] Running:', pythonExec, [path.join(__dirname, '../python/db.py'), '--login', credentials.username, credentials.password]);
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(pythonExec, [
      path.join(__dirname, '../python/db.py'), '--login', credentials.username, credentials.password
    ], {
      cwd: path.resolve(__dirname, '../..'),
      env: process.env
    });
    let data = '';
    let error = '';
    pythonProcess.stdout.on('data', (chunk) => data += chunk);
    pythonProcess.stderr.on('data', (chunk) => {
      error += chunk;
      console.error(chunk.toString());
    });
    pythonProcess.on('close', (code) => {
      console.log('[login] Exit code:', code, 'Data:', data, 'Error:', error);
      if (code === 0) {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Invalid response from login service'));
        }
      } else {
        reject(new Error(error || 'Login failed'));
      }
    });
  });
});

ipcMain.handle('validate-session', async (event, sessionToken) => {
  console.log('[validate-session] Running:', pythonExec, [path.join(__dirname, '../python/db.py'), '--validate-session', sessionToken]);
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(pythonExec, [
      path.join(__dirname, '../python/db.py'), '--validate-session', sessionToken
    ], {
      cwd: path.resolve(__dirname, '../..'),
      env: process.env
    });
    let data = '';
    let error = '';
    pythonProcess.stdout.on('data', (chunk) => data += chunk);
    pythonProcess.stderr.on('data', (chunk) => {
      error += chunk;
      console.error(chunk.toString());
    });
    pythonProcess.on('close', (code) => {
      console.log('[validate-session] Success:', JSON.parse(data));
      if (code === 0) {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Invalid response from session validation service'));
        }
      } else {
        reject(new Error(error || 'Session validation failed'));
      }
    });
  });
});

// Authentication handlers
ipcMain.handle('authenticate-user', async (event, username, password) => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(pythonExec, [
      path.join(__dirname, '../python/db.py'), '--authenticate-user', username, password
    ], {
      cwd: path.resolve(__dirname, '../..'),
      env: process.env
    });
    let data = '';
    let error = '';
    pythonProcess.stdout.on('data', (chunk) => data += chunk);
    pythonProcess.stderr.on('data', (chunk) => {
      error += chunk;
      console.error(chunk.toString());
    });
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Invalid response from authentication service'));
        }
      } else {
        reject(new Error(error || 'Authentication failed'));
      }
    });
  });
});

ipcMain.handle('register-user', async (event, username, email, password, role) => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(pythonExec, [
      path.join(__dirname, '../python/db.py'), '--create-user', username, email, password, role || 'analyst'
    ], {
      cwd: path.resolve(__dirname, '../..'),
      env: process.env
    });
    let data = '';
    let error = '';
    pythonProcess.stdout.on('data', (chunk) => data += chunk);
    pythonProcess.stderr.on('data', (chunk) => {
      error += chunk;
      console.error(chunk.toString());
    });
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Invalid response from registration service'));
        }
      } else {
        reject(new Error(error || 'Registration failed'));
      }
    });
  });
});

ipcMain.handle('create-session', async (event, userId) => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(pythonExec, [
      path.join(__dirname, '../python/db.py'), '--create-session', userId.toString()
    ], {
      cwd: path.resolve(__dirname, '../..'),
      env: process.env
    });
    let data = '';
    pythonProcess.stdout.on('data', (chunk) => data += chunk);
    pythonProcess.stderr.on('data', (chunk) => console.error(chunk.toString()));
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Invalid response from session service'));
        }
      } else {
        reject(new Error('Session creation failed'));
      }
    });
  });
});

// Directory picker handlers
ipcMain.handle('show-directory-picker', async () => {
  const { dialog } = require('electron');
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
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(pythonExec, [
      path.join(__dirname, '../python/git_integration.py'), '--connect', repoPath
    ], {
      cwd: path.resolve(__dirname, '../..'),
      env: process.env
    });
    let data = '';
    pythonProcess.stdout.on('data', (chunk) => data += chunk);
    pythonProcess.stderr.on('data', (chunk) => console.error(chunk.toString()));
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Invalid response from git service'));
        }
      } else {
        reject(new Error('Git service failed'));
      }
    });
  });
});

ipcMain.handle('git-get-branches', async () => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(pythonExec, [
      path.join(__dirname, '../python/git_integration.py'), '--branches'
    ], {
      cwd: path.resolve(__dirname, '../..'),
      env: process.env
    });
    let data = '';
    pythonProcess.stdout.on('data', (chunk) => data += chunk);
    pythonProcess.stderr.on('data', (chunk) => console.error(chunk.toString()));
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Invalid response from git branches service'));
        }
      } else {
        reject(new Error('Git branches service failed'));
      }
    });
  });
});

ipcMain.handle('git-get-files', async (event, branch) => {
  return new Promise((resolve, reject) => {
    const args = [path.join(__dirname, '../python/git_integration.py'), '--files'];
    if (branch) args.push(branch);
    
    const pythonProcess = spawn(pythonExec, args, {
      cwd: path.resolve(__dirname, '../..'),
      env: process.env
    });
    let data = '';
    pythonProcess.stdout.on('data', (chunk) => data += chunk);
    pythonProcess.stderr.on('data', (chunk) => console.error(chunk.toString()));
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Invalid response from git files service'));
        }
      } else {
        reject(new Error('Git files service failed'));
      }
    });
  });
});

// Handler for get-analyses (alias for list-analyses)
ipcMain.handle('get-analyses', async () => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(pythonExec, [
      path.join(__dirname, '../python/db.py'), '--list-analyses'
    ]);

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
          reject(new Error('Invalid response from analyses service'));
        }
      } else {
        reject(new Error(errorOutput || 'Analyses service failed'));
      }
    });
  });
});

// Handler for list-analyses
ipcMain.handle('list-analyses', async () => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(pythonExec, [
      path.join(__dirname, '../python/db.py'), '--list-analyses'
    ]);

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
          reject(new Error('Invalid response from analyses service'));
        }
      } else {
        reject(new Error(errorOutput || 'Analyses service failed'));
      }
    });
  });
});

// Handler for check-llm-status (alias for get-llm-status)
ipcMain.handle('check-llm-status', async () => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(pythonExec, [
      path.join(__dirname, '../python/analyzer.py'), '--check-llm-status'
    ]);

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
          reject(new Error('Invalid response from LLM status service'));
        }
      } else {
        reject(new Error(errorOutput || 'LLM status service failed'));
      }
    });
  });
});

// Handler for debug-log-hook
ipcMain.handle('debug-log-hook', async (event, logData) => {
  console.log('[Debug Log]:', logData);
  return { success: true };
});

// Handler for get-saved-comparisons
ipcMain.handle('get-saved-comparisons', async () => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(pythonExec, [
      path.join(__dirname, '../python/db.py'), '--list-comparison-results'
    ]);

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
          resolve([]);  // Return empty array if parsing fails
        }
      } else {
        resolve([]);  // Return empty array on error
      }
    });
  });
});

// Handler for delete-comparison-result
ipcMain.handle('delete-comparison-result', async (event, id) => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(pythonExec, [
      path.join(__dirname, '../python/db.py'), '--delete-comparison-result', id.toString()
    ]);

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
          resolve({ success: true });
        }
      } else {
        reject(new Error(errorOutput || 'Delete comparison result failed'));
      }
    });
  });
});

// Handler for get-analysis
ipcMain.handle('get-analysis', async (event, id) => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(pythonExec, [
      path.join(__dirname, '../python/db.py'), '--get-analysis', id.toString()
    ]);

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
          reject(new Error('Invalid response from get analysis service'));
        }
      } else {
        reject(new Error(errorOutput || 'Get analysis service failed'));
      }
    });
  });
});

// Handler for get-ot-threat-intel-entries
ipcMain.handle('get-ot-threat-intel-entries', async () => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(pythonExec, [
      path.join(__dirname, '../python/db.py'), '--get-ot-threat-intel-entries'
    ]);

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
          resolve([]);  // Return empty array if parsing fails
        }
      } else {
        resolve([]);  // Return empty array on error
      }
    });
  });
});

// Handler for get-ot-threat-intel-last-sync
ipcMain.handle('get-ot-threat-intel-last-sync', async () => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(pythonExec, [
      path.join(__dirname, '../python/db.py'), '--get-ot-threat-intel-last-sync'
    ]);

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
          resolve(null);  // Return null if parsing fails
        }
      } else {
        resolve(null);  // Return null on error
      }
    });
  });
});

// Handler for sync-ot-threat-intel
ipcMain.handle('sync-ot-threat-intel', async (event, provider) => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(pythonExec, [
      path.join(__dirname, '../python/sync_ot_threat_intel.py'), '--sync', provider || 'default'
    ]);

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
          resolve({ success: true, message: 'Sync completed' });
        }
      } else {
        reject(new Error(errorOutput || 'OT threat intel sync failed'));
      }
    });
  });
});

// Handler for update-ot-threat-intel-entry
ipcMain.handle('update-ot-threat-intel-entry', async (event, entry) => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(pythonExec, [
      path.join(__dirname, '../python/db.py'), '--update-ot-threat-intel-entry', JSON.stringify(entry)
    ]);

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
          resolve({ success: true });
        }
      } else {
        reject(new Error(errorOutput || 'Update OT threat intel entry failed'));
      }
    });
  });
});

// Handler for list-users
ipcMain.handle('list-users', async () => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(pythonExec, [
      path.join(__dirname, '../python/db.py'), '--list-users'
    ]);

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
          resolve([]);  // Return empty array if parsing fails
        }
      } else {
        resolve([]);  // Return empty array on error
      }
    });
  });
});

// Handler for update-user
ipcMain.handle('update-user', async (event, userId, userData) => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(pythonExec, [
      path.join(__dirname, '../python/db.py'), '--update-user', userId.toString(), JSON.stringify(userData)
    ]);

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
          resolve({ success: true });
        }
      } else {
        reject(new Error(errorOutput || 'Update user failed'));
      }
    });
  });
});

// Handler for delete-user
ipcMain.handle('delete-user', async (event, userId) => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(pythonExec, [
      path.join(__dirname, '../python/db.py'), '--delete-user', userId.toString()
    ]);

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
          resolve({ success: true });
        }
      } else {
        reject(new Error(errorOutput || 'Delete user failed'));
      }
    });
  });
});

// Handler for get-llm-logs
ipcMain.handle('get-llm-logs', async () => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(pythonExec, [
      path.join(__dirname, '../python/db.py'), '--get-llm-logs'
    ]);

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
          resolve([]);  // Return empty array if parsing fails
        }
      } else {
        resolve([]);  // Return empty array on error
      }
    });
  });
});

// Handler for save-baseline
ipcMain.handle('save-baseline', async (event, fileName, originalName, filePath, analysis_json, provider, model) => {
  return new Promise((resolve, reject) => {
    const args = [
      path.join(__dirname, '../python/db.py'), 
      '--save-baseline', 
      fileName || ''
    ];
    
    if (originalName) args.push(originalName);
    else args.push('');
    
    if (filePath) args.push(filePath);
    else args.push('');
    
    if (analysis_json) args.push(JSON.stringify(analysis_json));
    else args.push('');
    
    if (provider) args.push(provider);
    else args.push('');
    
    if (model) args.push(model);
    else args.push('');

    const pythonProcess = spawn(pythonExec, args);

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
          resolve({ success: true, message: 'Baseline saved successfully' });
        }
      } else {
        reject(new Error(errorOutput || 'Save baseline failed'));
      }
    });
  });
});

// Handler for logout-session
ipcMain.handle('logout-session', async (event, sessionToken) => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(pythonExec, [
      path.join(__dirname, '../python/db.py'), '--logout-session', sessionToken
    ]);

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
          resolve({ success: true });
        }
      } else {
        resolve({ success: true }); // Always succeed for logout
      }
    });
  });
});