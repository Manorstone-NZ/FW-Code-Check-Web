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
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const MAX_LOG_LINES = 2000;
function DebugLogPanel() {
    const [logs, setLogs] = (0, react_1.useState)([]);
    const logRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        // On mount, load the last 100 lines of debug.log for instant feedback
        if (window.electron && typeof window.electron.invoke === 'function') {
            window.electron.invoke('get-debug-log').then((text) => {
                const lines = text.split(/\r?\n/).filter(Boolean);
                setLogs(lines.slice(-100));
            });
        }
        // Register for backend log streaming and subscribe to log events
        if (window.electron && typeof window.electron.send === 'function') {
            console.log('Registering for debug-log streaming');
            window.electron.send('debug-log');
            window.electron.send('debug-log-force-latest');
        }
        // Listen for log events from the backend (via Electron IPC)
        function handleLog(_event, message) {
            if (!message)
                return;
            console.log('Received log:', message);
            setLogs(prev => {
                // Only add if not a duplicate of the last line
                if (prev.length > 0 && prev[prev.length - 1] === message)
                    return prev;
                const next = [...prev, message];
                return next.length > MAX_LOG_LINES ? next.slice(-MAX_LOG_LINES) : next;
            });
        }
        if (window.electron && window.electron.onDebugLog) {
            window.electron.onDebugLog(handleLog);
        }
        return () => {
            if (window.electron && window.electron.offDebugLog) {
                window.electron.offDebugLog(handleLog);
            }
        };
    }, []);
    (0, react_1.useEffect)(() => {
        if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    }, [logs]);
    const sendTestLog = () => {
        if (window.electron && typeof window.electron.invoke === 'function') {
            window.electron.invoke('debug-log-hook', {
                event: 'test-log',
                analysisId: 'test',
                hasLLM: false,
                timestamp: new Date().toISOString(),
            });
        }
    };
    return (react_1.default.createElement("div", { style: { background: '#181818', color: '#eee', height: '100%', overflow: 'auto', fontFamily: 'monospace', fontSize: 13, padding: 8 }, ref: logRef },
        react_1.default.createElement("button", { onClick: sendTestLog, style: { marginBottom: 8, background: '#333', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px', cursor: 'pointer' } }, "Send Test Log"),
        logs.map((line, i) => (react_1.default.createElement("div", { key: i }, line)))));
}
exports.default = DebugLogPanel;
