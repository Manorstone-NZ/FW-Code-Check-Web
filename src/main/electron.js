const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow = null;

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
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
ipcMain.handle('analyze-file', async (_event, filePath) => {
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn(path.join(__dirname, '../../venv/bin/python3'), [
            path.join(__dirname, '../python/analyzer.py'),
            filePath
        ], {
            cwd: path.resolve(__dirname, '../..'),
            env: process.env
        });
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

// IPC: List all analyses
ipcMain.handle('list-analyses', async () => {
    return new Promise((resolve, reject) => {
        const py = spawn(path.join(__dirname, '../../venv/bin/python3'), [
            path.join(__dirname, '../python/db.py'), '--list-analyses'
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

// IPC: Get analysis by ID
ipcMain.handle('get-analysis', async (_event, id) => {
    return new Promise((resolve, reject) => {
        const py = spawn(path.join(__dirname, '../../venv/bin/python3'), [
            path.join(__dirname, '../python/db.py'), '--get-analysis', String(id)
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

// IPC: List all baselines
ipcMain.handle('list-baselines', async () => {
    return new Promise((resolve, reject) => {
        const py = spawn(path.join(__dirname, '../../venv/bin/python3'), [
            path.join(__dirname, '../python/db.py'), '--list-baselines'
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

// IPC: Get baseline by ID
ipcMain.handle('get-baseline', async (_event, id) => {
    return new Promise((resolve, reject) => {
        const py = spawn(path.join(__dirname, '../../venv/bin/python3'), [
            path.join(__dirname, '../python/db.py'), '--get-baseline', String(id)
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

// IPC: Save baseline
ipcMain.handle('save-baseline', async (_event, fileName, originalName) => {
    return new Promise((resolve, reject) => {
        const args = [
            path.join(__dirname, '../python/db.py'), '--save-baseline', fileName
        ];
        if (originalName) args.push(originalName);
        const py = spawn(path.join(__dirname, '../../venv/bin/python3'), args, {
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

// IPC: Delete baseline
ipcMain.handle('delete-baseline', async (_event, id) => {
    return new Promise((resolve, reject) => {
        const py = spawn(path.join(__dirname, '../../venv/bin/python3'), [
            path.join(__dirname, '../python/db.py'), '--delete-baseline', String(id)
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

// IPC: Delete analysis by ID
ipcMain.handle('delete-analysis', async (_event, id) => {
    return new Promise((resolve, reject) => {
        const py = spawn(path.join(__dirname, '../../venv/bin/python3'), [
            path.join(__dirname, '../python/db.py'), '--delete-analysis', String(id)
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

// IPC: LLM compare analysis to baseline
ipcMain.handle('llm-compare-analysis-baseline', async (_event, analysisArg, baselineArg) => {
    const fs = require('fs');
    const os = require('os');
    const path = require('path');
    function prepareFile(arg, label) {
        if (typeof arg === 'string' && fs.existsSync(arg)) {
            return arg;
        } else if (typeof arg === 'string') {
            // Assume it's JSON content
            const tmpPath = path.join(os.tmpdir(), `llm_compare_${label}_${Date.now()}.json`);
            fs.writeFileSync(tmpPath, arg, 'utf-8');
            return tmpPath;
        } else if (typeof arg === 'object') {
            const tmpPath = path.join(os.tmpdir(), `llm_compare_${label}_${Date.now()}.json`);
            fs.writeFileSync(tmpPath, JSON.stringify(arg), 'utf-8');
            return tmpPath;
        }
        throw new Error('Invalid argument for LLM comparison');
    }
    return new Promise((resolve, reject) => {
        try {
            const analysisPath = prepareFile(analysisArg, 'analysis');
            const baselinePath = prepareFile(baselineArg, 'baseline');
            const py = spawn(path.join(__dirname, '../../venv/bin/python3'), [
                path.join(__dirname, '../python/analyzer.py'), '--compare', analysisPath, baselinePath
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
                        reject(e);
                    }
                } else {
                    reject(error || 'Python process failed');
                }
            });
        } catch (e) {
            reject(e);
        }
    });
});

const LLM_LOG_PATH = path.join(__dirname, '../../llm-interactions.log.json');

ipcMain.handle('get-llm-logs', async () => {
  try {
    if (!fs.existsSync(LLM_LOG_PATH)) return [];
    const raw = fs.readFileSync(LLM_LOG_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
});

// IPC: Check LLM status
ipcMain.handle('check-llm-status', async () => {
    return new Promise((resolve, reject) => {
        const py = spawn(path.join(__dirname, '../../venv/bin/python3'), [
            path.join(__dirname, '../python/analyzer.py'), '--check-openai'
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

// IPC: Get comparison result by ID
ipcMain.handle('get-comparison-result', async (_event, id) => {
    return new Promise((resolve, reject) => {
        const py = spawn(path.join(__dirname, '../../venv/bin/python3'), [
            path.join(__dirname, '../python/db.py'), '--get-comparison-result', String(id)
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
