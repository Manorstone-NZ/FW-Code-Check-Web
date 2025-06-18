"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debugLog = void 0;
// src/renderer/utils/debugLog.ts
function debugLog(event, details = {}) {
    const logLine = `[${new Date().toISOString()}] [frontend-debugLog] event=${event} details=${JSON.stringify(details)}`;
    if (typeof window !== 'undefined' && window.console) {
        console.log(logLine);
    }
    if (window.electron && typeof window.electron.invoke === 'function') {
        window.electron.invoke('debug-log-hook', Object.assign(Object.assign({ event }, details), { timestamp: new Date().toISOString() }));
    }
}
exports.debugLog = debugLog;
