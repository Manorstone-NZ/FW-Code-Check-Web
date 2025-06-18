import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { spawn } from 'child_process';

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
            path.join(__dirname, '../python/analyzer.py'), '--check-openai'
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