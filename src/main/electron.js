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
electron_1.ipcMain.handle('analyze-file', function (_event, filePath, provider, model) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, new Promise(function (resolve, reject) {
                // Debug logging: print filePath, provider, and model
                console.log('[analyze-file] filePath:', filePath);
                console.log('[analyze-file] provider:', provider);
                console.log('[analyze-file] model:', model);
                var args = [
                    path.join(__dirname, '../python/analyzer.py'),
                    filePath
                ];
                if (provider) {
                    args.push('--provider');
                    args.push(provider);
                }
                if (model) {
                    args.push('--model');
                    args.push(model);
                }
                console.log('[analyze-file] Python args:', args);
                // Use venv Python if available
                const venvPython = path.join(__dirname, '../../venv/bin/python3');
                const pythonExecutable = require('fs').existsSync(venvPython) ? venvPython : 'python3';
                var pythonProcess = (0, child_process_1.spawn)(pythonExecutable, args);
                var data = '';
                var error = '';
                pythonProcess.stdout.on('data', function (chunk) {
                    data += chunk;
                });
                pythonProcess.stderr.on('data', function (chunk) {
                    error += chunk;
                });
                pythonProcess.on('close', function () {
                    // Log any stderr output for debugging
                    if (error) {
                        console.error('[analyze-file][stderr]', error);
                    }
                    try {
                        if (!data || data.trim() === '') {
                            return reject(new Error('No output from Python process'));
                        }
                        // Split output into lines and find the last valid JSON object
                        const lines = data.split(/\r?\n/);
                        let jsonLine = null;
                        for (const line of lines) {
                            const trimmed = line.trim();
                            if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                                try {
                                    JSON.parse(trimmed);
                                    jsonLine = trimmed; // keep updating, so last valid wins
                                } catch (e) {
                                    // Not valid JSON, skip
                                }
                            }
                        }
                        if (!jsonLine) {
                            return reject(new Error('No valid JSON output from Python process'));
                        }
                        resolve(JSON.parse(jsonLine));
                    } catch (e) {
                        reject(e);
                    }
                });
            })];
    });
}); });
// IPC: Check LLM status
electron_1.ipcMain.handle('check-llm-status', function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, new Promise(function (resolve, reject) {
                var pythonProcess = (0, child_process_1.spawn)(
                    // Use venv Python if available
                    require('path').join(__dirname, '../../venv/bin/python'),
                    [require('path').join(__dirname, '../python/analyzer.py'), '--check-openai'],
                    {
                        cwd: require('path').resolve(__dirname, '../..'),
                        env: process.env
                    }
                );
                var data = '';
                pythonProcess.stdout.on('data', function (chunk) { return data += chunk; });
                pythonProcess.stderr.on('data', function (chunk) { console.error('[check-llm-status][stderr]', chunk.toString()); });
                pythonProcess.on('close', function () {
                    try {
                        if (!data || data.trim() === '') {
                            return resolve({ ok: false, error: 'No output from Python process', analysis: null });
                        }
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
                        if (!data || data.trim() === '') {
                            return resolve({ ok: false, error: 'No output from Python process', analysis: null });
                        }
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
                        if (!data || data.trim() === '') {
                            return resolve({ ok: false, error: 'No output from Python process', analysis: null });
                        }
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
                        if (!data || data.trim() === '') {
                            return resolve({ ok: false, error: 'No output from Python process', analysis: null });
                        }
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
                        if (!data || data.trim() === '') {
                            return resolve({ ok: false, error: 'No output from Python process', analysis: null });
                        }
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
                        if (!data || data.trim() === '') {
                            return resolve({ ok: false, error: 'No output from Python process', analysis: null });
                        }
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
                        if (!data || data.trim() === '') {
                            return resolve({ ok: false, error: 'No output from Python process', analysis: null });
                        }
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
                        if (!data || data.trim() === '') {
                            return resolve({ ok: false, error: 'No output from Python process', analysis: null });
                        }
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
                        if (!data || data.trim() === '') {
                            return resolve({ ok: false, error: 'No output from Python process', analysis: null });
                        }
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
electron_1.ipcMain.handle('save-analysis', function (_event, fileName, status, analysisJson, filePath, provider, model) {
    return new Promise(function (resolve, reject) {
        var py = (0, child_process_1.spawn)('python3', [
            path.join(__dirname, '../python/db.py'), '--save-analysis', fileName, status, JSON.stringify(analysisJson), filePath || '', provider || '', model || ''
        ], {
            cwd: path.resolve(__dirname, '../..'),
            env: process.env
        });
        var data = '';
        py.stdout.on('data', function (chunk) { return data += chunk; });
        py.stderr.on('data', function (err) { return console.error(err.toString()); });
        py.on('close', function () {
            try {
                if (!data || data.trim() === '') {
                    return resolve({ ok: false, error: 'No output from Python process', analysis: null });
                }
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
                        if (!data || data.trim() === '') {
                            return resolve({ ok: false, error: 'No output from Python process', analysis: null });
                        }
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
                if (!data || data.trim() === '') {
                    return resolve({ ok: false, error: 'No output from Python process', analysis: null });
                }
                resolve(JSON.parse(data));
            } catch (e) {
                reject(e);
            }
        });
    });
});
// Handler for save-baseline
electron_1.ipcMain.handle('save-baseline', function (_event, fileName, originalName, filePath, analysisJson, provider, model) {
    return new Promise(function (resolve, reject) {
        var py = (0, child_process_1.spawn)('python3', [
            path.join(__dirname, '../python/db.py'), '--save-baseline', fileName, originalName || '', filePath || '', JSON.stringify(analysisJson || {}), provider || '', model || ''
        ], {
            cwd: path.resolve(__dirname, '../..'),
            env: process.env
        });
        var data = '';
        py.stdout.on('data', function (chunk) { data += chunk; });
        py.stderr.on('data', function (err) { console.error(err.toString()); });
        py.on('close', function () {
            try {
                if (!data || data.trim() === '') {
                    return resolve({ ok: false, error: 'No output from Python process', analysis: null });
                }
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
        const fs = require('fs');
        const os = require('os');
        
        // Helper function to create temp file if needed
        function ensureFilePath(pathOrContent, prefix) {
            // If it looks like a file path and exists, use it directly
            if (typeof pathOrContent === 'string' && pathOrContent.startsWith('/') && fs.existsSync(pathOrContent)) {
                return pathOrContent;
            }
            
            // Otherwise, create a temporary file
            const tempPath = path.join(os.tmpdir(), `${prefix}_${Date.now()}.txt`);
            let content = '';
            
            if (typeof pathOrContent === 'string') {
                // If it's a JSON string, try to extract meaningful content
                try {
                    const parsed = JSON.parse(pathOrContent);
                    
                    // Try to find original file content in various places
                    content = parsed.file_content ||
                             parsed.original_content ||
                             parsed.analysis_json?.file_content ||
                             parsed.analysis_json?.original_content ||
                             parsed.content ||
                             // If no file content, create a synthetic representation
                             `File: ${parsed.fileName || 'unknown'}\n\nAnalysis Summary:\n${JSON.stringify(parsed.analysis_json || parsed, null, 2)}`;
                } catch (e) {
                    // Not JSON, use as-is (might be actual file content)
                    content = pathOrContent;
                }
            } else {
                // Object - convert to meaningful content
                const obj = pathOrContent;
                content = obj.file_content ||
                         obj.original_content ||
                         obj.analysis_json?.file_content ||
                         obj.analysis_json?.original_content ||
                         obj.content ||
                         `File: ${obj.fileName || 'unknown'}\n\nAnalysis Summary:\n${JSON.stringify(obj.analysis_json || obj, null, 2)}`;
            }
            
            fs.writeFileSync(tempPath, content, 'utf8');
            return tempPath;
        }
        
        const analysisPath = ensureFilePath(analysisPathOrContent, 'analysis');
        const baselinePath = ensureFilePath(baselinePathOrContent, 'baseline');
        
        var args = [
            path.join(__dirname, '../python/analyzer.py'), '--compare', analysisPath, baselinePath
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
            // Clean up temp files
            try {
                if (analysisPath.includes(os.tmpdir())) fs.unlinkSync(analysisPath);
                if (baselinePath.includes(os.tmpdir())) fs.unlinkSync(baselinePath);
            } catch (e) {
                // Ignore cleanup errors
            }
            
            try {
                if (!data || data.trim() === '') {
                    return resolve({ ok: false, error: 'No output from Python process', analysis: null });
                }
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
        // Accepts: timestamp, result, analysisFileName, baselineFileName, provider, model
        // We'll store as much as possible, but analysisId/baselineId may be null
        var analysisId = null;
        var baselineId = null;
        var llm_prompt = '';
        var llm_result = payload.result || '';
        var analysisFileName = payload.analysisFileName || '';
        var baselineFileName = payload.baselineFileName || '';
        var provider = payload.provider || '';
        var model = payload.model || '';
        var timestamp = payload.timestamp || new Date().toISOString();
        var py = (0, child_process_1.spawn)('python3', [
            path.join(__dirname, '../python/db.py'), '--save-comparison-history',
            analysisId, baselineId, llm_prompt, llm_result, analysisFileName, baselineFileName, provider, model
        ], {
            cwd: path.resolve(__dirname, '../..'),
            env: process.env
        });
        var data = '';
        py.stdout.on('data', function (chunk) { data += chunk; });
        py.stderr.on('data', function (err) { console.error(err.toString()); });
        py.on('close', function () {
            try {
                if (!data || data.trim() === '') {
                    return resolve({ ok: false, error: 'No output from Python process', analysis: null });
                }
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
                if (!data || data.trim() === '') {
                    return resolve({ ok: false, error: 'No output from Python process', analysis: null });
                }
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
                if (!data || data.trim() === '') {
                    return resolve({ ok: false, error: 'No output from Python process', analysis: null });
                }
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
                if (!data || data.trim() === '') {
                    return resolve({ ok: false, error: 'No output from Python process', analysis: null });
                }
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
                if (!data || data.trim() === '') {
                    return resolve({ ok: false, error: 'No output from Python process', analysis: null });
                }
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
                if (!data || data.trim() === '') {
                    return resolve({ ok: false, error: 'No output from Python process', analysis: null });
                }
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
                if (!data || data.trim() === '') {
                    return resolve({ ok: false, error: 'No output from Python process', analysis: null });
                }
                resolve(JSON.parse(data));
            } catch (e) {
                reject(e);
            }
        });
    });
});
// IPC: Clear LLM log (truncate llm-interactions.log.json)
electron_1.ipcMain.handle('clear-llm-log', function () {
    return new Promise(function (resolve, reject) {
        const fs = require('fs');
        const logPath = path.join(__dirname, '../../llm-interactions.log.json');
        fs.writeFile(logPath, '[]', 'utf-8', function (err) {
            if (err) {
                console.error('Failed to clear LLM log:', err);
                return reject(err);
            }
            resolve({ success: true });
        });
    });
});
// IPC: Install Ollama model
electron_1.ipcMain.handle('install-ollama-model', async (_event, model) => {
    return new Promise((resolve, reject) => {
        if (!model) return reject(new Error('No model specified'));
        const { spawn } = require('child_process');
        const proc = spawn('ollama', ['pull', model]);
        let output = '';
        let error = '';
        proc.stdout.on('data', chunk => { output += chunk; });
        proc.stderr.on('data', chunk => { error += chunk; });
        proc.on('close', code => {
            if (code === 0) {
                resolve({ ok: true, output });
            } else {
                resolve({ ok: false, error: error || `Failed with code ${code}` });
            }
        });
    });
});
// Utility: Install all required Ollama models
async function installAllOllamaModels() {
    const models = ['deepseek-coder', 'codellama', 'mistral', 'llama3'];
    const { spawn } = require('child_process');
    for (const model of models) {
        await new Promise((resolve) => {
            const proc = spawn('ollama', ['pull', model], { stdio: 'inherit' });
            proc.on('close', () => resolve());
        });
    }
    console.log('All Ollama models installed.');
}
// Allow direct invocation from CLI
if (require.main === module && process.argv.includes('--install-ollama-models')) {
    installAllOllamaModels();
}

// === AUTHENTICATION IPC HANDLERS ===

// IPC: Register a new user
electron_1.ipcMain.handle('register-user', (_event, username, email, password, role = 'user') => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve) => {
        const pythonPath = path.join(__dirname, '../python/db.py');
        const venvPython = path.join(__dirname, '../../venv/bin/python3');
        const pythonExecutable = require('fs').existsSync(venvPython) ? venvPython : 'python3';
        
        const args = [pythonPath, '--create-user', username, email, password, role];
        console.log('[register-user] Running:', pythonExecutable, args);
        
        const pythonProcess = (0, child_process_1.spawn)(pythonExecutable, args);
        let data = '';
        let error = '';
        
        pythonProcess.stdout.on('data', (chunk) => {
            data += chunk.toString();
        });
        
        pythonProcess.stderr.on('data', (chunk) => {
            error += chunk.toString();
            console.error('[register-user] Python stderr:', chunk.toString());
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0 && data.trim()) {
                try {
                    const result = JSON.parse(data.trim());
                    console.log('[register-user] Success:', result);
                    resolve(result);
                } catch (parseError) {
                    console.error('[register-user] Parse error:', parseError);
                    resolve({ success: false, error: 'Failed to parse response' });
                }
            } else {
                console.error('[register-user] Failed with code:', code, 'Error:', error);
                resolve({ success: false, error: error || `Process failed with code ${code}` });
            }
        });
    });
}));

// IPC: Authenticate user
electron_1.ipcMain.handle('authenticate-user', (_event, username, password) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve) => {
        const pythonPath = path.join(__dirname, '../python/db.py');
        const venvPython = path.join(__dirname, '../../venv/bin/python3');
        const pythonExecutable = require('fs').existsSync(venvPython) ? venvPython : 'python3';
        
        const args = [pythonPath, '--authenticate-user', username, password];
        console.log('[authenticate-user] Running:', pythonExecutable, args);
        
        const pythonProcess = (0, child_process_1.spawn)(pythonExecutable, args);
        let data = '';
        let error = '';
        
        pythonProcess.stdout.on('data', (chunk) => {
            data += chunk.toString();
        });
        
        pythonProcess.stderr.on('data', (chunk) => {
            error += chunk.toString();
            console.error('[authenticate-user] Python stderr:', chunk.toString());
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0 && data.trim()) {
                try {
                    const result = JSON.parse(data.trim());
                    console.log('[authenticate-user] Success:', result);
                    resolve(result);
                } catch (parseError) {
                    console.error('[authenticate-user] Parse error:', parseError);
                    resolve({ success: false, error: 'Failed to parse response' });
                }
            } else {
                console.error('[authenticate-user] Failed with code:', code, 'Error:', error);
                resolve({ success: false, error: error || `Process failed with code ${code}` });
            }
        });
    });
}));

// IPC: Create session
electron_1.ipcMain.handle('create-session', (_event, userId) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve) => {
        const pythonPath = path.join(__dirname, '../python/db.py');
        const venvPython = path.join(__dirname, '../../venv/bin/python3');
        const pythonExecutable = require('fs').existsSync(venvPython) ? venvPython : 'python3';
        
        const args = [pythonPath, '--create-session', userId.toString()];
        console.log('[create-session] Running:', pythonExecutable, args);
        
        const pythonProcess = (0, child_process_1.spawn)(pythonExecutable, args);
        let data = '';
        let error = '';
        
        pythonProcess.stdout.on('data', (chunk) => {
            data += chunk.toString();
        });
        
        pythonProcess.stderr.on('data', (chunk) => {
            error += chunk.toString();
            console.error('[create-session] Python stderr:', chunk.toString());
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0 && data.trim()) {
                try {
                    const result = JSON.parse(data.trim());
                    console.log('[create-session] Success:', result);
                    resolve(result);
                } catch (parseError) {
                    console.error('[create-session] Parse error:', parseError);
                    resolve({ success: false, error: 'Failed to parse response' });
                }
            } else {
                console.error('[create-session] Failed with code:', code, 'Error:', error);
                resolve({ success: false, error: error || `Process failed with code ${code}` });
            }
        });
    });
}));

// IPC: Validate session
electron_1.ipcMain.handle('validate-session', (_event, sessionToken) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve) => {
        const pythonPath = path.join(__dirname, '../python/db.py');
        const venvPython = path.join(__dirname, '../../venv/bin/python3');
        const pythonExecutable = require('fs').existsSync(venvPython) ? venvPython : 'python3';
        
        const args = [pythonPath, '--validate-session', sessionToken];
        console.log('[validate-session] Running:', pythonExecutable, args);
        
        const pythonProcess = (0, child_process_1.spawn)(pythonExecutable, args);
        let data = '';
        let error = '';
        
        pythonProcess.stdout.on('data', (chunk) => {
            data += chunk.toString();
        });
        
        pythonProcess.stderr.on('data', (chunk) => {
            error += chunk.toString();
            console.error('[validate-session] Python stderr:', chunk.toString());
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0 && data.trim()) {
                try {
                    const result = JSON.parse(data.trim());
                    console.log('[validate-session] Success:', result);
                    resolve(result);
                } catch (parseError) {
                    console.error('[validate-session] Parse error:', parseError);
                    resolve({ success: false, error: 'Failed to parse response' });
                }
            } else {
                console.error('[validate-session] Failed with code:', code, 'Error:', error);
                resolve({ success: false, error: error || `Process failed with code ${code}` });
            }
        });
    });
}));

// IPC: Logout session
electron_1.ipcMain.handle('logout-session', (_event, sessionToken) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve) => {
        const pythonPath = path.join(__dirname, '../python/db.py');
        const venvPython = path.join(__dirname, '../../venv/bin/python3');
        const pythonExecutable = require('fs').existsSync(venvPython) ? venvPython : 'python3';
        
        const args = [pythonPath, '--logout-session', sessionToken];
        console.log('[logout-session] Running:', pythonExecutable, args);
        
        const pythonProcess = (0, child_process_1.spawn)(pythonExecutable, args);
        let data = '';
        let error = '';
        
        pythonProcess.stdout.on('data', (chunk) => {
            data += chunk.toString();
        });
        
        pythonProcess.stderr.on('data', (chunk) => {
            error += chunk.toString();
            console.error('[logout-session] Python stderr:', chunk.toString());
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0 && data.trim()) {
                try {
                    const result = JSON.parse(data.trim());
                    console.log('[logout-session] Success:', result);
                    resolve(result);
                } catch (parseError) {
                    console.error('[logout-session] Parse error:', parseError);
                    resolve({ success: false, error: 'Failed to parse response' });
                }
            } else {
                console.error('[logout-session] Failed with code:', code, 'Error:', error);
                resolve({ success: false, error: error || `Process failed with code ${code}` });
            }
        });
    });
}));

// === END AUTHENTICATION IPC HANDLERS ===

// === USER MANAGEMENT IPC HANDLERS ===

// IPC: List all users (admin only)
electron_1.ipcMain.handle('list-users', () => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve) => {
        const pythonPath = path.join(__dirname, '../python/db.py');
        const venvPython = path.join(__dirname, '../../venv/bin/python3');
        const pythonExecutable = require('fs').existsSync(venvPython) ? venvPython : 'python3';
        
        const args = [pythonPath, '--list-users'];
        console.log('[list-users] Running:', pythonExecutable, args);
        
        const pythonProcess = (0, child_process_1.spawn)(pythonExecutable, args);
        let data = '';
        let error = '';
        
        pythonProcess.stdout.on('data', (chunk) => {
            data += chunk.toString();
        });
        
        pythonProcess.stderr.on('data', (chunk) => {
            error += chunk.toString();
            console.error('[list-users] Python stderr:', chunk.toString());
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0 && data.trim()) {
                try {
                    const result = JSON.parse(data.trim());
                    console.log('[list-users] Success:', result);
                    resolve(result);
                } catch (parseError) {
                    console.error('[list-users] Parse error:', parseError);
                    resolve({ success: false, error: 'Failed to parse response' });
                }
            } else {
                console.error('[list-users] Failed with code:', code, 'Error:', error);
                resolve({ success: false, error: error || `Process failed with code ${code}` });
            }
        });
    });
}));

// IPC: Delete user
electron_1.ipcMain.handle('delete-user', (_event, userId) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve) => {
        const pythonPath = path.join(__dirname, '../python/db.py');
        const venvPython = path.join(__dirname, '../../venv/bin/python3');
        const pythonExecutable = require('fs').existsSync(venvPython) ? venvPython : 'python3';
        
        const args = [pythonPath, '--delete-user', userId.toString()];
        console.log('[delete-user] Running:', pythonExecutable, args);
        
        const pythonProcess = (0, child_process_1.spawn)(pythonExecutable, args);
        let data = '';
        let error = '';
        
        pythonProcess.stdout.on('data', (chunk) => {
            data += chunk.toString();
        });
        
        pythonProcess.stderr.on('data', (chunk) => {
            error += chunk.toString();
            console.error('[delete-user] Python stderr:', chunk.toString());
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0 && data.trim()) {
                try {
                    const result = JSON.parse(data.trim());
                    console.log('[delete-user] Success:', result);
                    resolve(result);
                } catch (parseError) {
                    console.error('[delete-user] Parse error:', parseError);
                    resolve({ success: false, error: 'Failed to parse response' });
                }
            } else {
                console.error('[delete-user] Failed with code:', code, 'Error:', error);
                resolve({ success: false, error: error || `Process failed with code ${code}` });
            }
        });
    });
}));

// IPC: Toggle user status
electron_1.ipcMain.handle('toggle-user-status', (_event, userId, isActive) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve) => {
        const pythonPath = path.join(__dirname, '../python/db.py');
        const venvPython = path.join(__dirname, '../../venv/bin/python3');
        const pythonExecutable = require('fs').existsSync(venvPython) ? venvPython : 'python3';
        
        const args = [pythonPath, '--toggle-user-status', userId.toString(), isActive.toString()];
        console.log('[toggle-user-status] Running:', pythonExecutable, args);
        
        const pythonProcess = (0, child_process_1.spawn)(pythonExecutable, args);
        let data = '';
        let error = '';
        
        pythonProcess.stdout.on('data', (chunk) => {
            data += chunk.toString();
        });
        
        pythonProcess.stderr.on('data', (chunk) => {
            error += chunk.toString();
            console.error('[toggle-user-status] Python stderr:', chunk.toString());
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0 && data.trim()) {
                try {
                    const result = JSON.parse(data.trim());
                    console.log('[toggle-user-status] Success:', result);
                    resolve(result);
                } catch (parseError) {
                    console.error('[toggle-user-status] Parse error:', parseError);
                    resolve({ success: false, error: 'Failed to parse response' });
                }
            } else {
                console.error('[toggle-user-status] Failed with code:', code, 'Error:', error);
                resolve({ success: false, error: error || `Process failed with code ${code}` });
            }
        });
    });
}));

// IPC: Reset user password
electron_1.ipcMain.handle('reset-user-password', (_event, userId, newPassword) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve) => {
        const pythonPath = path.join(__dirname, '../python/db.py');
        const venvPython = path.join(__dirname, '../../venv/bin/python3');
        const pythonExecutable = require('fs').existsSync(venvPython) ? venvPython : 'python3';
        
        const args = [pythonPath, '--reset-user-password', userId.toString(), newPassword];
        console.log('[reset-user-password] Running:', pythonExecutable, args);
        
        const pythonProcess = (0, child_process_1.spawn)(pythonExecutable, args);
        let data = '';
        let error = '';
        
        pythonProcess.stdout.on('data', (chunk) => {
            data += chunk.toString();
        });
        
        pythonProcess.stderr.on('data', (chunk) => {
            error += chunk.toString();
            console.error('[reset-user-password] Python stderr:', chunk.toString());
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0 && data.trim()) {
                try {
                    const result = JSON.parse(data.trim());
                    console.log('[reset-user-password] Success:', result);
                    resolve(result);
                } catch (parseError) {
                    console.error('[reset-user-password] Parse error:', parseError);
                    resolve({ success: false, error: 'Failed to parse response' });
                }
            } else {
                console.error('[reset-user-password] Failed with code:', code, 'Error:', error);
                resolve({ success: false, error: error || `Process failed with code ${code}` });
            }
        });
    });
}));

// === END USER MANAGEMENT IPC HANDLERS ===

// === GIT INTEGRATION IPC HANDLERS ===

// Git: Clone repository
electron_1.ipcMain.handle('git-clone-repository', (event, url, localPath, branch) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve) => {
        const pythonPath = path.join(__dirname, '..', '..', 'src', 'python', 'git_integration.py');
        const args = [pythonPath, '--clone', url, localPath];
        if (branch) {
            args.push(branch);
        }
        
        console.log('[git-clone-repository] Running:', pythonExecutable, args);
        
        const pythonProcess = (0, child_process_1.spawn)(pythonExecutable, args);
        let data = '';
        let error = '';
        
        pythonProcess.stdout.on('data', (chunk) => {
            data += chunk.toString();
        });
        
        pythonProcess.stderr.on('data', (chunk) => {
            error += chunk.toString();
            console.error('[git-clone-repository] Python stderr:', chunk.toString());
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0 && data.trim()) {
                try {
                    const result = JSON.parse(data.trim());
                    console.log('[git-clone-repository] Success:', result);
                    resolve(result);
                } catch (parseError) {
                    console.error('[git-clone-repository] Parse error:', parseError);
                    resolve({ success: false, error: 'Failed to parse response' });
                }
            } else {
                console.error('[git-clone-repository] Failed with code:', code, 'Error:', error);
                resolve({ success: false, error: error || `Process failed with code ${code}` });
            }
        });
    });
}));

// Git: Connect to repository
electron_1.ipcMain.handle('git-connect-repository', (event, repoPath) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve) => {
        const pythonPath = path.join(__dirname, '..', '..', 'src', 'python', 'git_integration.py');
        const args = [pythonPath, '--connect', repoPath];
        
        console.log('[git-connect-repository] Running:', pythonExecutable, args);
        
        const pythonProcess = (0, child_process_1.spawn)(pythonExecutable, args);
        let data = '';
        let error = '';
        
        pythonProcess.stdout.on('data', (chunk) => {
            data += chunk.toString();
        });
        
        pythonProcess.stderr.on('data', (chunk) => {
            error += chunk.toString();
            console.error('[git-connect-repository] Python stderr:', chunk.toString());
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0 && data.trim()) {
                try {
                    const result = JSON.parse(data.trim());
                    console.log('[git-connect-repository] Success:', result);
                    resolve(result);
                } catch (parseError) {
                    console.error('[git-connect-repository] Parse error:', parseError);
                    resolve({ success: false, error: 'Failed to parse response' });
                }
            } else {
                console.error('[git-connect-repository] Failed with code:', code, 'Error:', error);
                resolve({ success: false, error: error || `Process failed with code ${code}` });
            }
        });
    });
}));

// Git: Get branches
electron_1.ipcMain.handle('git-get-branches', () => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve) => {
        const pythonPath = path.join(__dirname, '..', '..', 'src', 'python', 'git_integration.py');
        const args = [pythonPath, '--branches'];
        
        console.log('[git-get-branches] Running:', pythonExecutable, args);
        
        const pythonProcess = (0, child_process_1.spawn)(pythonExecutable, args);
        let data = '';
        let error = '';
        
        pythonProcess.stdout.on('data', (chunk) => {
            data += chunk.toString();
        });
        
        pythonProcess.stderr.on('data', (chunk) => {
            error += chunk.toString();
            console.error('[git-get-branches] Python stderr:', chunk.toString());
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0 && data.trim()) {
                try {
                    const result = JSON.parse(data.trim());
                    console.log('[git-get-branches] Success:', result);
                    resolve(result);
                } catch (parseError) {
                    console.error('[git-get-branches] Parse error:', parseError);
                    resolve({ success: false, error: 'Failed to parse response' });
                }
            } else {
                console.error('[git-get-branches] Failed with code:', code, 'Error:', error);
                resolve({ success: false, error: error || `Process failed with code ${code}` });
            }
        });
    });
}));

// Git: Checkout branch
electron_1.ipcMain.handle('git-checkout-branch', (event, branchName) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve) => {
        const pythonPath = path.join(__dirname, '..', '..', 'src', 'python', 'git_integration.py');
        const args = [pythonPath, '--checkout', branchName];
        
        console.log('[git-checkout-branch] Running:', pythonExecutable, args);
        
        const pythonProcess = (0, child_process_1.spawn)(pythonExecutable, args);
        let data = '';
        let error = '';
        
        pythonProcess.stdout.on('data', (chunk) => {
            data += chunk.toString();
        });
        
        pythonProcess.stderr.on('data', (chunk) => {
            error += chunk.toString();
            console.error('[git-checkout-branch] Python stderr:', chunk.toString());
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0 && data.trim()) {
                try {
                    const result = JSON.parse(data.trim());
                    console.log('[git-checkout-branch] Success:', result);
                    resolve(result);
                } catch (parseError) {
                    console.error('[git-checkout-branch] Parse error:', parseError);
                    resolve({ success: false, error: 'Failed to parse response' });
                }
            } else {
                console.error('[git-checkout-branch] Failed with code:', code, 'Error:', error);
                resolve({ success: false, error: error || `Process failed with code ${code}` });
            }
        });
    });
}));

// Git: Get files
electron_1.ipcMain.handle('git-get-files', (event, branch) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve) => {
        const pythonPath = path.join(__dirname, '..', '..', 'src', 'python', 'git_integration.py');
        const args = [pythonPath, '--files'];
        if (branch) {
            args.push(branch);
        }
        
        console.log('[git-get-files] Running:', pythonExecutable, args);
        
        const pythonProcess = (0, child_process_1.spawn)(pythonExecutable, args);
        let data = '';
        let error = '';
        
        pythonProcess.stdout.on('data', (chunk) => {
            data += chunk.toString();
        });
        
        pythonProcess.stderr.on('data', (chunk) => {
            error += chunk.toString();
            console.error('[git-get-files] Python stderr:', chunk.toString());
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0 && data.trim()) {
                try {
                    const result = JSON.parse(data.trim());
                    console.log('[git-get-files] Success:', result);
                    resolve(result);
                } catch (parseError) {
                    console.error('[git-get-files] Parse error:', parseError);
                    resolve({ success: false, error: 'Failed to parse response' });
                }
            } else {
                console.error('[git-get-files] Failed with code:', code, 'Error:', error);
                resolve({ success: false, error: error || `Process failed with code ${code}` });
            }
        });
    });
}));

// Git: Get repository status
electron_1.ipcMain.handle('git-get-status', () => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve) => {
        const pythonPath = path.join(__dirname, '..', '..', 'src', 'python', 'git_integration.py');
        const args = [pythonPath, '--status'];
        
        console.log('[git-get-status] Running:', pythonExecutable, args);
        
        const pythonProcess = (0, child_process_1.spawn)(pythonExecutable, args);
        let data = '';
        let error = '';
        
        pythonProcess.stdout.on('data', (chunk) => {
            data += chunk.toString();
        });
        
        pythonProcess.stderr.on('data', (chunk) => {
            error += chunk.toString();
            console.error('[git-get-status] Python stderr:', chunk.toString());
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0 && data.trim()) {
                try {
                    const result = JSON.parse(data.trim());
                    console.log('[git-get-status] Success:', result);
                    resolve(result);
                } catch (parseError) {
                    console.error('[git-get-status] Parse error:', parseError);
                    resolve({ success: false, error: 'Failed to parse response' });
                }
            } else {
                console.error('[git-get-status] Failed with code:', code, 'Error:', error);
                resolve({ success: false, error: error || `Process failed with code ${code}` });
            }
        });
    });
}));

// Git: Analyze file from repository
electron_1.ipcMain.handle('git-analyze-file', (event, filePath, branch, provider, model) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve) => {
        // First, create a temporary file from the Git repository
        const pythonPath = path.join(__dirname, '..', '..', 'src', 'python', 'git_integration.py');
        const tempArgs = [pythonPath, '--create-temp-file', filePath];
        if (branch) {
            tempArgs.push(branch);
        }
        
        console.log('[git-analyze-file] Creating temp file:', pythonExecutable, tempArgs);
        
        const tempProcess = (0, child_process_1.spawn)(pythonExecutable, tempArgs);
        let tempData = '';
        let tempError = '';
        
        tempProcess.stdout.on('data', (chunk) => {
            tempData += chunk.toString();
        });
        
        tempProcess.stderr.on('data', (chunk) => {
            tempError += chunk.toString();
            console.error('[git-analyze-file] Temp file stderr:', chunk.toString());
        });
        
        tempProcess.on('close', (code) => {
            if (code === 0 && tempData.trim()) {
                try {
                    const tempResult = JSON.parse(tempData.trim());
                    if (tempResult.success) {
                        // Now analyze the temporary file
                        const analyzerPath = path.join(__dirname, '..', '..', 'src', 'python', 'analyzer.py');
                        const analyzeArgs = [analyzerPath, tempResult.temp_path, provider || 'openai', model || 'gpt-4'];
                        
                        console.log('[git-analyze-file] Analyzing temp file:', pythonExecutable, analyzeArgs);
                        
                        const analyzeProcess = (0, child_process_1.spawn)(pythonExecutable, analyzeArgs);
                        let analyzeData = '';
                        let analyzeError = '';
                        
                        analyzeProcess.stdout.on('data', (chunk) => {
                            analyzeData += chunk.toString();
                        });
                        
                        analyzeProcess.stderr.on('data', (chunk) => {
                            analyzeError += chunk.toString();
                            console.error('[git-analyze-file] Analysis stderr:', chunk.toString());
                        });
                        
                        analyzeProcess.on('close', (analyzeCode) => {
                            // Clean up temp file
                            if (tempResult.temp_dir) {
                                const fs = require('fs');
                                try {
                                    fs.rmSync(tempResult.temp_dir, { recursive: true, force: true });
                                } catch (cleanupError) {
                                    console.warn('[git-analyze-file] Failed to cleanup temp dir:', cleanupError);
                                }
                            }
                            
                            if (analyzeCode === 0 && analyzeData.trim()) {
                                try {
                                    const analyzeResult = JSON.parse(analyzeData.trim());
                                    // Add Git metadata to the result
                                    analyzeResult.git_metadata = {
                                        original_path: tempResult.original_path,
                                        branch: tempResult.branch,
                                        analyzed_from_git: true
                                    };
                                    console.log('[git-analyze-file] Analysis success:', analyzeResult);
                                    resolve(analyzeResult);
                                } catch (parseError) {
                                    console.error('[git-analyze-file] Analysis parse error:', parseError);
                                    resolve({ success: false, error: 'Failed to parse analysis response' });
                                }
                            } else {
                                console.error('[git-analyze-file] Analysis failed with code:', analyzeCode, 'Error:', analyzeError);
                                resolve({ success: false, error: analyzeError || `Analysis failed with code ${analyzeCode}` });
                            }
                        });
                    } else {
                        resolve(tempResult);
                    }
                } catch (parseError) {
                    console.error('[git-analyze-file] Temp file parse error:', parseError);
                    resolve({ success: false, error: 'Failed to parse temp file response' });
                }
            } else {
                console.error('[git-analyze-file] Temp file creation failed with code:', code, 'Error:', tempError);
                resolve({ success: false, error: tempError || `Temp file creation failed with code ${code}` });
            }
        });
    });
}));

// Git: Commit file
electron_1.ipcMain.handle('git-commit-file', (event, filePath, commitMessage, branch) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve) => {
        const pythonPath = path.join(__dirname, '..', '..', 'src', 'python', 'git_integration.py');
        const args = [pythonPath, '--commit-file', filePath, commitMessage];
        if (branch) {
            args.push(branch);
        }
        
        console.log('[git-commit-file] Running:', pythonExecutable, args);
        
        const pythonProcess = (0, child_process_1.spawn)(pythonExecutable, args);
        let data = '';
        let error = '';
        
        pythonProcess.stdout.on('data', (chunk) => {
            data += chunk.toString();
        });
        
        pythonProcess.stderr.on('data', (chunk) => {
            error += chunk.toString();
            console.error('[git-commit-file] Python stderr:', chunk.toString());
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0 && data.trim()) {
                try {
                    const result = JSON.parse(data.trim());
                    console.log('[git-commit-file] Success:', result);
                    resolve(result);
                } catch (parseError) {
                    console.error('[git-commit-file] Parse error:', parseError);
                    resolve({ success: false, error: 'Failed to parse response' });
                }
            } else {
                console.error('[git-commit-file] Failed with code:', code, 'Error:', error);
                resolve({ success: false, error: error || `Process failed with code ${code}` });
            }
        });
    });
}));

// Git: Push to remote
electron_1.ipcMain.handle('git-push-to-remote', (event, branch, remote) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve) => {
        const pythonPath = path.join(__dirname, '..', '..', 'src', 'python', 'git_integration.py');
        const args = [pythonPath, '--push-to-remote'];
        if (branch) {
            args.push(branch);
        }
        if (remote) {
            args.push(remote);
        }
        
        console.log('[git-push-to-remote] Running:', pythonExecutable, args);
        
        const pythonProcess = (0, child_process_1.spawn)(pythonExecutable, args);
        let data = '';
        let error = '';
        
        pythonProcess.stdout.on('data', (chunk) => {
            data += chunk.toString();
        });
        
        pythonProcess.stderr.on('data', (chunk) => {
            error += chunk.toString();
            console.error('[git-push-to-remote] Python stderr:', chunk.toString());
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0 && data.trim()) {
                try {
                    const result = JSON.parse(data.trim());
                    console.log('[git-push-to-remote] Success:', result);
                    resolve(result);
                } catch (parseError) {
                    console.error('[git-push-to-remote] Parse error:', parseError);
                    resolve({ success: false, error: 'Failed to parse response' });
                }
            } else {
                console.error('[git-push-to-remote] Failed with code:', code, 'Error:', error);
                resolve({ success: false, error: error || `Process failed with code ${code}` });
            }
        });
    });
}));

// Git: Copy file from branch
electron_1.ipcMain.handle('git-copy-file-from-branch', (event, filePath, sourceBranch, targetPath) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve) => {
        const pythonPath = path.join(__dirname, '..', '..', 'src', 'python', 'git_integration.py');
        const args = [pythonPath, '--copy-file-from-branch', filePath, sourceBranch];
        if (targetPath) {
            args.push(targetPath);
        }
        
        console.log('[git-copy-file-from-branch] Running:', pythonExecutable, args);
        
        const pythonProcess = (0, child_process_1.spawn)(pythonExecutable, args);
        let data = '';
        let error = '';
        
        pythonProcess.stdout.on('data', (chunk) => {
            data += chunk.toString();
        });
        
        pythonProcess.stderr.on('data', (chunk) => {
            error += chunk.toString();
            console.error('[git-copy-file-from-branch] Python stderr:', chunk.toString());
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0 && data.trim()) {
                try {
                    const result = JSON.parse(data.trim());
                    console.log('[git-copy-file-from-branch] Success:', result);
                    resolve(result);
                } catch (parseError) {
                    console.error('[git-copy-file-from-branch] Parse error:', parseError);
                    resolve({ success: false, error: 'Failed to parse response' });
                }
            } else {
                console.error('[git-copy-file-from-branch] Failed with code:', code, 'Error:', error);
                resolve({ success: false, error: error || `Process failed with code ${code}` });
            }
        });
    });
}));

// === END GIT INTEGRATION IPC HANDLERS ===

// IPC: Install Ollama model
