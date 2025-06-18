"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var electron_1 = require("electron");
var path = require("path");
var child_process_1 = require("child_process");
var mainWindow;
var createWindow = function () {
    mainWindow = new electron_1.BrowserWindow({
        width: 1280, // Reasonable width for all dashboard content
        height: 900, // Reasonable height for all dashboard content
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });
    mainWindow.loadURL('http://localhost:3000'); // Assuming React app runs on this port
    mainWindow.on('closed', function () {
        mainWindow = null;
    });
};
electron_1.app.on('ready', createWindow);
electron_1.app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});
// IPC communication example
electron_1.ipcMain.on('perform-analysis', function (event, filePath) {
    // Logic to analyze the PLC file
    // Send results back to renderer process
    event.reply('analysis-results', { /* results */});
});
// IPC communication: analyze-file
electron_1.ipcMain.handle('analyze-file', function (_event, filePath, provider) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, new Promise(function (resolve, reject) {
                var args = [
                    path.join(__dirname, '../python/analyzer.py'),
                    filePath
                ];
                if (provider) {
                    args.push('--provider');
                    args.push(provider);
                }
                var pythonProcess = (0, child_process_1.spawn)('python3', args);
                var data = '';
                var error = '';
                pythonProcess.stdout.on('data', function (chunk) {
                    data += chunk;
                });
                pythonProcess.stderr.on('data', function (chunk) {
                    error += chunk;
                });
                pythonProcess.on('close', function (code) {
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
            })];
    });
}); });
// IPC: Check LLM status
electron_1.ipcMain.handle('check-llm-status', function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, new Promise(function (resolve, reject) {
                var pythonProcess = (0, child_process_1.spawn)('python3', [
                    path.join(__dirname, '../python/analyzer.py'), '--check-openai'
                ], {
                    cwd: path.resolve(__dirname, '../..'),
                    env: process.env
                });
                var data = '';
                pythonProcess.stdout.on('data', function (chunk) { return data += chunk; });
                pythonProcess.stderr.on('data', function (chunk) { return console.error(chunk.toString()); });
                pythonProcess.on('close', function () {
                    try {
                        resolve(JSON.parse(data));
                    }
                    catch (e) {
                        reject(e);
                    }
                });
            })];
    });
}); });
// IPC: List comparison history
electron_1.ipcMain.handle('list-comparison-history', function (_event, analysisId, baselineId) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, new Promise(function (resolve, reject) {
                var py = (0, child_process_1.spawn)(path.join(__dirname, '../../venv/bin/python3'), [
                    path.join(__dirname, '../python/db.py'), '--list-comparison-history', analysisId ? String(analysisId) : '', baselineId ? String(baselineId) : ''
                ], {
                    cwd: path.resolve(__dirname, '../..'),
                    env: process.env
                });
                var data = '';
                py.stdout.on('data', function (chunk) { return data += chunk; });
                py.stderr.on('data', function (err) { return console.error(err.toString()); });
                py.on('close', function () {
                    try {
                        resolve(JSON.parse(data));
                    }
                    catch (e) {
                        reject(e);
                    }
                });
            })];
    });
}); });
// IPC: Get OT Threat Intel entries
electron_1.ipcMain.handle('get-ot-threat-intel-entries', function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, new Promise(function (resolve, reject) {
                var py = (0, child_process_1.spawn)('python3', [
                    path.join(__dirname, '../python/db.py'), '--list-ot-threat-intel'
                ], {
                    cwd: path.resolve(__dirname, '../..'),
                    env: process.env
                });
                var data = '';
                py.stdout.on('data', function (chunk) { return data += chunk; });
                py.stderr.on('data', function (err) { return console.error(err.toString()); });
                py.on('close', function () {
                    try {
                        resolve(JSON.parse(data));
                    }
                    catch (e) {
                        reject(e);
                    }
                });
            })];
    });
}); });
// IPC: Get last sync time for OT Threat Intel
electron_1.ipcMain.handle('get-ot-threat-intel-last-sync', function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, new Promise(function (resolve, reject) {
                var py = (0, child_process_1.spawn)('python3', [
                    path.join(__dirname, '../python/db.py'), '--get-ot-threat-intel-last-sync'
                ], {
                    cwd: path.resolve(__dirname, '../..'),
                    env: process.env
                });
                var data = '';
                py.stdout.on('data', function (chunk) { return data += chunk; });
                py.stderr.on('data', function (err) { return console.error(err.toString()); });
                py.on('close', function () {
                    try {
                        resolve(JSON.parse(data));
                    }
                    catch (e) {
                        reject(e);
                    }
                });
            })];
    });
}); });
// IPC: Sync OT Threat Intel
electron_1.ipcMain.handle('sync-ot-threat-intel', function (_event, provider) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, new Promise(function (resolve, reject) {
                var args = [
                    path.join(__dirname, '../python/sync_ot_threat_intel.py')
                ];
                if (provider) {
                    args.push('--provider');
                    args.push(provider);
                }
                var py = (0, child_process_1.spawn)('python3', args, {
                    cwd: path.resolve(__dirname, '../..'),
                    env: process.env
                });
                var data = '';
                py.stdout.on('data', function (chunk) { return data += chunk; });
                py.stderr.on('data', function (err) { return console.error(err.toString()); });
                py.on('close', function () {
                    try {
                        resolve(JSON.parse(data));
                    }
                    catch (e) {
                        reject(e);
                    }
                });
            })];
    });
}); });
// IPC: Update OT Threat Intel entry (curation)
electron_1.ipcMain.handle('update-ot-threat-intel-entry', function (_event, entry) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, new Promise(function (resolve, reject) {
                var py = (0, child_process_1.spawn)('python3', [
                    path.join(__dirname, '../python/db.py'), '--update-ot-threat-intel', JSON.stringify(entry)
                ], {
                    cwd: path.resolve(__dirname, '../..'),
                    env: process.env
                });
                var data = '';
                py.stdout.on('data', function (chunk) { return data += chunk; });
                py.stderr.on('data', function (err) { return console.error(err.toString()); });
                py.on('close', function () {
                    try {
                        resolve(JSON.parse(data));
                    }
                    catch (e) {
                        reject(e);
                    }
                });
            })];
    });
}); });
// Handler for list-analyses
electron_1.ipcMain.handle('list-analyses', function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, new Promise(function (resolve, reject) {
                var py = (0, child_process_1.spawn)('python3', [
                    path.join(__dirname, '../python/db.py'), '--list-analyses'
                ], {
                    cwd: path.resolve(__dirname, '../..'),
                    env: process.env
                });
                var data = '';
                py.stdout.on('data', function (chunk) { return data += chunk; });
                py.stderr.on('data', function (err) { return console.error(err.toString()); });
                py.on('close', function () {
                    try {
                        resolve(JSON.parse(data));
                    }
                    catch (e) {
                        reject(e);
                    }
                });
            })];
    });
}); });
// Handler for list-baselines
electron_1.ipcMain.handle('list-baselines', function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, new Promise(function (resolve, reject) {
                var py = (0, child_process_1.spawn)('python3', [
                    path.join(__dirname, '../python/db.py'), '--list-baselines'
                ], {
                    cwd: path.resolve(__dirname, '../..'),
                    env: process.env
                });
                var data = '';
                py.stdout.on('data', function (chunk) { return data += chunk; });
                py.stderr.on('data', function (err) { return console.error(err.toString()); });
                py.on('close', function () {
                    try {
                        resolve(JSON.parse(data));
                    }
                    catch (e) {
                        reject(e);
                    }
                });
            })];
    });
}); });
// IPC: Debug log hook for frontend logging
electron_1.ipcMain.handle('debug-log-hook', function (_event, log) {
    // You can extend this to write to a file or forward to Python logger
    console.log('[DEBUG-LOG-HOOK]', log);
    return { ok: true };
});
// IPC: Get saved comparisons
electron_1.ipcMain.handle('get-saved-comparisons', function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, new Promise(function (resolve, reject) {
                var py = (0, child_process_1.spawn)('python3', [
                    path.join(__dirname, '../python/db.py'), '--list-comparison-history'
                ], {
                    cwd: path.resolve(__dirname, '../..'),
                    env: process.env
                });
                var data = '';
                py.stdout.on('data', function (chunk) { return data += chunk; });
                py.stderr.on('data', function (err) { return console.error(err.toString()); });
                py.on('close', function () {
                    try {
                        resolve(JSON.parse(data));
                    }
                    catch (e) {
                        reject(e);
                    }
                });
            })];
    });
}); });
// IPC: Save analysis
electron_1.ipcMain.handle('save-analysis', function (_event, fileName, status, analysisJson, filePath) {
    return new Promise(function (resolve, reject) {
        var py = (0, child_process_1.spawn)('python3', [
            path.join(__dirname, '../python/db.py'), '--save-analysis', fileName, status, JSON.stringify(analysisJson), filePath || ''
        ], {
            cwd: path.resolve(__dirname, '../..'),
            env: process.env
        });
        var data = '';
        py.stdout.on('data', function (chunk) { return data += chunk; });
        py.stderr.on('data', function (err) { return console.error(err.toString()); });
        py.on('close', function () {
            try {
                resolve(JSON.parse(data));
            }
            catch (e) {
                reject(e);
            }
        });
    });
});
// IPC: Get analysis by ID
electron_1.ipcMain.handle('get-analysis', function (_event, analysisId) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, new Promise(function (resolve, reject) {
                var py = (0, child_process_1.spawn)('python3', [
                    path.join(__dirname, '../python/db.py'), '--get-analysis', String(analysisId)
                ], {
                    cwd: path.resolve(__dirname, '../..'),
                    env: process.env
                });
                var data = '';
                py.stdout.on('data', function (chunk) { return data += chunk; });
                py.stderr.on('data', function (err) { return console.error(err.toString()); });
                py.on('close', function () {
                    try {
                        resolve(JSON.parse(data));
                    }
                    catch (e) {
                        reject(e);
                    }
                });
            })];
    });
}); });
// IPC: Get baseline by ID
electron_1.ipcMain.handle('get-baseline', function (_event, baselineId) {
    return new Promise(function (resolve, reject) {
        var py = (0, child_process_1.spawn)('python3', [
            path.join(__dirname, '../python/db.py'), '--get-baseline', String(baselineId)
        ], {
            cwd: path.resolve(__dirname, '../..'),
            env: process.env
        });
        var data = '';
        py.stdout.on('data', function (chunk) { data += chunk; });
        py.stderr.on('data', function (err) { console.error(err.toString()); });
        py.on('close', function () {
            try {
                resolve(JSON.parse(data));
            } catch (e) {
                reject(e);
            }
        });
    });
});
// Handler for save-baseline
electron_1.ipcMain.handle('save-baseline', function (_event, fileName, originalName, filePath, analysisJson) {
    return new Promise(function (resolve, reject) {
        var py = (0, child_process_1.spawn)('python3', [
            path.join(__dirname, '../python/db.py'), '--save-baseline', fileName, originalName || '', filePath || '', JSON.stringify(analysisJson || {})
        ], {
            cwd: path.resolve(__dirname, '../..'),
            env: process.env
        });
        var data = '';
        py.stdout.on('data', function (chunk) { data += chunk; });
        py.stderr.on('data', function (err) { console.error(err.toString()); });
        py.on('close', function () {
            try {
                resolve(JSON.parse(data));
            } catch (e) {
                reject(e);
            }
        });
    });
});
// IPC: LLM Compare Analysis to Baseline
// Args: analysisPathOrContent, baselinePathOrContent (can be file paths or JSON strings)
electron_1.ipcMain.handle('llm-compare-analysis-baseline', function (_event, analysisPathOrContent, baselinePathOrContent, provider) {
    return new Promise(function (resolve, reject) {
        var args = [
            path.join(__dirname, '../python/analyzer.py'), '--compare', analysisPathOrContent, baselinePathOrContent
        ];
        if (provider) {
            args.push('--provider');
            args.push(provider);
        }
        var py = (0, child_process_1.spawn)('python3', args, {
            cwd: path.resolve(__dirname, '../..'),
            env: process.env
        });
        var data = '';
        py.stdout.on('data', function (chunk) { data += chunk; });
        py.stderr.on('data', function (err) { console.error(err.toString()); });
        py.on('close', function () {
            try {
                resolve(JSON.parse(data));
            } catch (e) {
                reject(e);
            }
        });
    });
});
// IPC: Save comparison result (manual/professional report)
electron_1.ipcMain.handle('save-comparison-result', function (_event, payload) {
    return new Promise(function (resolve, reject) {
        // Accepts: timestamp, result, analysisFileName, baselineFileName
        // We'll store as much as possible, but analysisId/baselineId may be null
        var analysisId = null;
        var baselineId = null;
        var llm_prompt = '';
        var llm_result = payload.result || '';
        var analysisFileName = payload.analysisFileName || '';
        var baselineFileName = payload.baselineFileName || '';
        var timestamp = payload.timestamp || new Date().toISOString();
        var py = (0, child_process_1.spawn)('python3', [
            path.join(__dirname, '../python/db.py'), '--save-comparison-history',
            analysisId, baselineId, llm_prompt, llm_result, analysisFileName, baselineFileName
        ], {
            cwd: path.resolve(__dirname, '../..'),
            env: process.env
        });
        var data = '';
        py.stdout.on('data', function (chunk) { data += chunk; });
        py.stderr.on('data', function (err) { console.error(err.toString()); });
        py.on('close', function () {
            try {
                resolve(JSON.parse(data));
            } catch (e) {
                reject(e);
            }
        });
    });
});
// IPC: Delete comparison result by ID
electron_1.ipcMain.handle('delete-comparison-result', function (_event, comparisonId) {
    return new Promise(function (resolve, reject) {
        var py = (0, child_process_1.spawn)('python3', [
            path.join(__dirname, '../python/db.py'), '--delete-comparison-history', String(comparisonId)
        ], {
            cwd: path.resolve(__dirname, '../..'),
            env: process.env
        });
        var data = '';
        py.stdout.on('data', function (chunk) { data += chunk; });
        py.stderr.on('data', function (err) { console.error(err.toString()); });
        py.on('close', function () {
            try {
                resolve(JSON.parse(data));
            } catch (e) {
                reject(e);
            }
        });
    });
});
// IPC: Get LLM logs (returns contents of llm-interactions.log.json)
electron_1.ipcMain.handle('get-llm-logs', function () {
    return new Promise(function (resolve, reject) {
        const fs = require('fs');
        const logPath = path.join(__dirname, '../../llm-interactions.log.json');
        fs.readFile(logPath, 'utf-8', function (err, data) {
            if (err) {
                console.error('Failed to read LLM log:', err);
                return reject(err);
            }
            try {
                resolve(JSON.parse(data));
            } catch (e) {
                // If not valid JSON, return as string
                resolve({ raw: data });
            }
        });
    });
});
// IPC: Delete baseline by ID
electron_1.ipcMain.handle('delete-baseline', function (_event, baselineId) {
    return new Promise(function (resolve, reject) {
        var py = (0, child_process_1.spawn)('python3', [
            path.join(__dirname, '../python/db.py'), '--delete-baseline', String(baselineId)
        ], {
            cwd: path.resolve(__dirname, '../..'),
            env: process.env
        });
        var data = '';
        py.stdout.on('data', function (chunk) { data += chunk; });
        py.stderr.on('data', function (err) { console.error(err.toString()); });
        py.on('close', function () {
            try {
                resolve(JSON.parse(data));
            } catch (e) {
                reject(e);
            }
        });
    });
});
// IPC: Delete analysis by ID
electron_1.ipcMain.handle('delete-analysis', function (_event, analysisId) {
    return new Promise(function (resolve, reject) {
        var py = (0, child_process_1.spawn)('python3', [
            path.join(__dirname, '../python/db.py'), '--delete-analysis', String(analysisId)
        ], {
            cwd: path.resolve(__dirname, '../..'),
            env: process.env
        });
        var data = '';
        py.stdout.on('data', function (chunk) { data += chunk; });
        py.stderr.on('data', function (err) { console.error(err.toString()); });
        py.on('close', function () {
            try {
                resolve(JSON.parse(data));
            } catch (e) {
                reject(e);
            }
        });
    });
});
// IPC: Clear all OT Threat Intel entries
electron_1.ipcMain.handle('clear-ot-threat-intel', function () {
    return new Promise(function (resolve, reject) {
        var py = (0, child_process_1.spawn)('python3', [
            path.join(__dirname, '../python/db.py'), '--clear-ot-threat-intel'
        ], {
            cwd: path.resolve(__dirname, '../..'),
            env: process.env
        });
        var data = '';
        py.stdout.on('data', function (chunk) { data += chunk; });
        py.stderr.on('data', function (err) { console.error(err.toString()); });
        py.on('close', function () {
            try {
                resolve(JSON.parse(data));
            } catch (e) {
                resolve({ ok: true }); // fallback: just return ok
            }
        });
    });
});
// IPC: Reset/Reinitialize the database
electron_1.ipcMain.handle('reset-db', function () {
    return new Promise(function (resolve, reject) {
        var py = (0, child_process_1.spawn)('python3', [
            path.join(__dirname, '../python/db.py'), '--reset-db'
        ], {
            cwd: path.resolve(__dirname, '../..'),
            env: process.env
        });
        var data = '';
        py.stdout.on('data', function (chunk) { data += chunk; });
        py.stderr.on('data', function (err) { console.error(err.toString()); });
        py.on('close', function () {
            try {
                resolve(JSON.parse(data));
            } catch (e) {
                resolve({ ok: true }); // fallback: just return ok
            }
        });
    });
});
// IPC: Bulk LLM OT Threat Intel (populate dashboard with 10+ entries)
electron_1.ipcMain.handle('bulk-ot-threat-intel', function () {
    return new Promise(function (resolve, reject) {
        var py = (0, child_process_1.spawn)('python3', [
            path.join(__dirname, '../python/sync_ot_threat_intel.py'), '--bulk-ot-threat-intel'
        ], {
            cwd: path.resolve(__dirname, '../..'),
            env: process.env
        });
        var data = '';
        py.stdout.on('data', function (chunk) { data += chunk; });
        py.stderr.on('data', function (err) { console.error(err.toString()); });
        py.on('close', function () {
            try {
                resolve(JSON.parse(data));
            } catch (e) {
                reject(e);
            }
        });
    });
});
