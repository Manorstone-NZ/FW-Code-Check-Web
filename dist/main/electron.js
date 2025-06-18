"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
let mainWindow;
// Use venv python if available
const venvPython = path.join(__dirname, '../../venv/bin/python3');
const pythonExec = require('fs').existsSync(venvPython) ? venvPython : 'python3';
const createWindow = () => {
    mainWindow = new electron_1.BrowserWindow({
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
electron_1.app.on('ready', createWindow);
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
// IPC communication example
electron_1.ipcMain.on('perform-analysis', (event, filePath) => {
    // Logic to analyze the PLC file
    // Send results back to renderer process
    event.reply('analysis-results', { /* results */});
});
// IPC communication: analyze-file
electron_1.ipcMain.handle('analyze-file', (_event, filePath) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        const pythonProcess = (0, child_process_1.spawn)('python3', [
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
                }
                catch (e) {
                    reject(e);
                }
            }
            else {
                reject(error || 'Python process failed');
            }
        });
    });
}));
// IPC: Check LLM status
electron_1.ipcMain.handle('check-llm-status', () => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve) => {
        const pythonProcess = (0, child_process_1.spawn)(pythonExec, [
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
                }
                else {
                    resolve(JSON.parse(data));
                }
            }
            catch (e) {
                resolve({ ok: false, error: 'Invalid JSON from LLM status check.' });
            }
        });
    });
}));
// IPC: List comparison history
electron_1.ipcMain.handle('list-comparison-history', (_event, analysisId, baselineId) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        const py = (0, child_process_1.spawn)(path.join(__dirname, '../../venv/bin/python3'), [
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
            }
            catch (e) {
                reject(e);
            }
        });
    });
}));
// IPC: Get OT Threat Intel entries
electron_1.ipcMain.handle('get-ot-threat-intel-entries', () => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        const py = (0, child_process_1.spawn)('python3', [
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
            }
            catch (e) {
                reject(e);
            }
        });
    });
}));
// IPC: Get last sync time for OT Threat Intel
electron_1.ipcMain.handle('get-ot-threat-intel-last-sync', () => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        const py = (0, child_process_1.spawn)('python3', [
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
            }
            catch (e) {
                reject(e);
            }
        });
    });
}));
// IPC: Sync OT Threat Intel
electron_1.ipcMain.handle('sync-ot-threat-intel', () => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        const py = (0, child_process_1.spawn)('python3', [
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
            }
            catch (e) {
                reject(e);
            }
        });
    });
}));
// IPC: Update OT Threat Intel entry (curation)
electron_1.ipcMain.handle('update-ot-threat-intel-entry', (_event, entry) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        const py = (0, child_process_1.spawn)('python3', [
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
            }
            catch (e) {
                reject(e);
            }
        });
    });
}));
