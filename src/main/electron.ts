import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { spawn } from 'child_process';
import * as os from 'os';
import * as fs from 'fs/promises';

let mainWindow: BrowserWindow | null;

// Use venv python if available
const venvPython = path.join(__dirname, '../../venv/bin/python3');
const pythonExec = require('fs').existsSync(venvPython) ? venvPython : 'python3';

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    mainWindow.loadURL('http://localhost:3000'); // Assuming React app runs on this port

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

// IPC communication example
ipcMain.on('perform-analysis', (event, filePath) => {
    // Logic to analyze the PLC file
    // Send results back to renderer process
    event.reply('analysis-results', { /* results */ });
});

// IPC communication: analyze-file
ipcMain.handle('analyze-file', async (_event, filePath: string) => {
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python3', [
            path.join(__dirname, '../python/analyzer.py'),
            filePath
        ]);
        let data = '';
        let error = '';
        pythonProcess.stdout.on('data', (chunk) => {
            data += chunk;
        });
        pythonProcess.stderr.on('data', (chunk) => {
            error += chunk;
        });
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            } else {
                reject(error || 'Python process failed');
            }
        });
    });
});

// IPC: Check LLM status
ipcMain.handle('check-llm-status', async () => {
    return new Promise((resolve) => {
        const pythonProcess = spawn(pythonExec, [
            path.join(__dirname, '../python/analyzer.py'), '--check-llm-status'
        ], {
            cwd: path.resolve(__dirname, '../..'),
            env: process.env
        });
        let data = '';
        pythonProcess.stdout.on('data', (chunk) => data += chunk);
        pythonProcess.stderr.on('data', (chunk) => console.error(chunk.toString()));
        pythonProcess.on('close', () => {
            try {
                if (!data || !data.trim()) {
                    resolve({ ok: false, error: 'No response from LLM status check.' });
                } else {
                    resolve(JSON.parse(data));
                }
            } catch (e) {
                resolve({ ok: false, error: 'Invalid JSON from LLM status check.' });
            }
        });
    });
});

// IPC: List comparison history
ipcMain.handle('list-comparison-history', async (_event, analysisId, baselineId) => {
    return new Promise((resolve, reject) => {
        const py = spawn(path.join(__dirname, '../../venv/bin/python3'), [
            path.join(__dirname, '../python/db.py'), '--list-comparison-history', analysisId ? String(analysisId) : '', baselineId ? String(baselineId) : ''
        ], {
            cwd: path.resolve(__dirname, '../..'),
            env: process.env
        });
        let data = '';
        py.stdout.on('data', chunk => data += chunk);
        py.stderr.on('data', err => console.error(err.toString()));
        py.on('close', () => {
            try {
                resolve(JSON.parse(data));
            } catch (e) {
                reject(e);
            }
        });
    });
});

// IPC: Get OT Threat Intel entries
ipcMain.handle('get-ot-threat-intel-entries', async () => {
  return new Promise((resolve, reject) => {
    const py = spawn('python3', [
      path.join(__dirname, '../python/db.py'), '--list-ot-threat-intel'
    ], {
      cwd: path.resolve(__dirname, '../..'),
      env: process.env
    });
    let data = '';
    py.stdout.on('data', chunk => data += chunk);
    py.stderr.on('data', err => console.error(err.toString()));
    py.on('close', () => {
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
  });
});

// IPC: Get last sync time for OT Threat Intel
ipcMain.handle('get-ot-threat-intel-last-sync', async () => {
  return new Promise((resolve, reject) => {
    const py = spawn('python3', [
      path.join(__dirname, '../python/db.py'), '--get-ot-threat-intel-last-sync'
    ], {
      cwd: path.resolve(__dirname, '../..'),
      env: process.env
    });
    let data = '';
    py.stdout.on('data', chunk => data += chunk);
    py.stderr.on('data', err => console.error(err.toString()));
    py.on('close', () => {
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
  });
});

// IPC: Sync OT Threat Intel
ipcMain.handle('sync-ot-threat-intel', async () => {
  return new Promise((resolve, reject) => {
    const py = spawn('python3', [
      path.join(__dirname, '../python/sync_ot_threat_intel.py')
    ], {
      cwd: path.resolve(__dirname, '../..'),
      env: process.env
    });
    let data = '';
    py.stdout.on('data', chunk => data += chunk);
    py.stderr.on('data', err => console.error(err.toString()));
    py.on('close', () => {
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
  });
});

// IPC: Update OT Threat Intel entry (curation)
ipcMain.handle('update-ot-threat-intel-entry', async (_event, entry) => {
  return new Promise((resolve, reject) => {
    const py = spawn('python3', [
      path.join(__dirname, '../python/db.py'), '--update-ot-threat-intel', JSON.stringify(entry)
    ], {
      cwd: path.resolve(__dirname, '../..'),
      env: process.env
    });
    let data = '';
    py.stdout.on('data', chunk => data += chunk);
    py.stderr.on('data', err => console.error(err.toString()));
    py.on('close', () => {
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
  });
});

// IPC: Authentication handlers
ipcMain.handle('authenticate-user', async (_event, username: string, password: string) => {
  return new Promise((resolve, reject) => {
    const py = spawn('python3', [
      path.join(__dirname, '../python/db.py'), '--authenticate-user', username, password
    ], {
      cwd: path.resolve(__dirname, '../..'),
      env: process.env
    });
    let data = '';
    let error = '';
    py.stdout.on('data', chunk => data += chunk);
    py.stderr.on('data', chunk => error += chunk);
    py.on('close', (code) => {
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

// IPC: Create session
ipcMain.handle('create-session', async (_event, userId: number) => {
  return new Promise((resolve, reject) => {
    const py = spawn('python3', [
      path.join(__dirname, '../python/db.py'), '--create-session', String(userId)
    ], {
      cwd: path.resolve(__dirname, '../..'),
      env: process.env
    });
    let data = '';
    let error = '';
    py.stdout.on('data', chunk => data += chunk);
    py.stderr.on('data', chunk => error += chunk);
    py.on('close', (code) => {
      if (code === 0) {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Invalid response from session service'));
        }
      } else {
        reject(new Error(error || 'Session creation failed'));
      }
    });
  });
});

// IPC: Validate session
ipcMain.handle('validate-session', async (_event, sessionToken: string) => {
  return new Promise((resolve, reject) => {
    const py = spawn('python3', [
      path.join(__dirname, '../python/db.py'), '--validate-session', sessionToken
    ], {
      cwd: path.resolve(__dirname, '../..'),
      env: process.env
    });
    let data = '';
    let error = '';
    py.stdout.on('data', chunk => data += chunk);
    py.stderr.on('data', chunk => error += chunk);
    py.on('close', (code) => {
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

// IPC: Logout session
ipcMain.handle('logout-session', async (_event, sessionToken: string) => {
  return new Promise((resolve, reject) => {
    const py = spawn('python3', [
      path.join(__dirname, '../python/db.py'), '--logout-session', sessionToken
    ], {
      cwd: path.resolve(__dirname, '../..'),
      env: process.env
    });
    let data = '';
    let error = '';
    py.stdout.on('data', chunk => data += chunk);
    py.stderr.on('data', chunk => error += chunk);
    py.on('close', (code) => {
      if (code === 0) {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Invalid response from logout service'));
        }
      } else {
        reject(new Error(error || 'Logout failed'));
      }
    });
  });
});

// IPC: Register user
ipcMain.handle('register-user', async (_event, username: string, email: string, password: string, role: string = 'user') => {
  return new Promise((resolve, reject) => {
    const py = spawn('python3', [
      path.join(__dirname, '../python/db.py'), '--register-user', username, email, password, role
    ], {
      cwd: path.resolve(__dirname, '../..'),
      env: process.env
    });
    let data = '';
    let error = '';
    py.stdout.on('data', chunk => data += chunk);
    py.stderr.on('data', chunk => error += chunk);
    py.on('close', (code) => {
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

// Handler for list-baselines
ipcMain.handle('list-baselines', async () => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(pythonExec, [
      path.join(__dirname, '../python/db.py'), '--list-baselines'
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
          reject(new Error('Invalid response from baselines service'));
        }
      } else {
        reject(new Error('Baselines service failed'));
      }
    });
  });
});

// Handler for get-analyses
ipcMain.handle('get-analyses', async () => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(pythonExec, [
      path.join(__dirname, '../python/analyzer.py'), '--list-analyses'
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
          reject(new Error('Invalid response from analyses service'));
        }
      } else {
        reject(new Error('Analyses service failed'));
      }
    });
  });
});

// Handler for get-baseline
ipcMain.handle('get-baseline', async (_event, id: string) => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(pythonExec, [
      path.join(__dirname, '../python/db.py'), '--get-baseline', id
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
          reject(new Error('Invalid response from baseline service'));
        }
      } else {
        reject(new Error('Baseline service failed'));
      }
    });
  });
});

// Handler for save-baseline
ipcMain.handle('save-baseline', async (_event, name: string, description: string, analysisJson: any, llmResults: string, tags: string[], metadata: any) => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(pythonExec, [
      path.join(__dirname, '../python/db.py'), '--save-baseline', 
      JSON.stringify({ name, description, analysis_json: analysisJson, llm_results: llmResults, tags, metadata })
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
          reject(new Error('Invalid response from save baseline service'));
        }
      } else {
        reject(new Error('Save baseline service failed'));
      }
    });
  });
});

// Handler for delete-baseline
ipcMain.handle('delete-baseline', async (_event, id: string) => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(pythonExec, [
      path.join(__dirname, '../python/db.py'), '--delete-baseline', id
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
          reject(new Error('Invalid response from delete baseline service'));
        }
      } else {
        reject(new Error('Delete baseline service failed'));
      }
    });
  });
});

// Handler for reset-db
ipcMain.handle('reset-db', async () => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(pythonExec, [
      path.join(__dirname, '../python/db.py'), '--reset-analysis-data'
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
          reject(new Error('Invalid response from reset db service'));
        }
      } else {
        reject(new Error('Reset db service failed'));
      }
    });
  });
});

// Handler for git-analyze-file
ipcMain.handle('git-analyze-file', async (_event, filePath: string, branch: string, provider?: string, model?: string) => {
  try {
    // Get file content from git using create-temp-file
    const tempArgs = [
      path.join(__dirname, '../python/git_integration.py'),
      '--create-temp-file',
      filePath,
      branch || 'main'
    ];
    
    console.log('[git-analyze-file] Creating temp file:', pythonExec, tempArgs);
    
    const getFileResult = await new Promise<string>((resolve, reject) => {
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
    
    const analysisResult = await new Promise<any>((resolve, reject) => {
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
                temp_path: getFileResult
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
    throw error;
  }
});