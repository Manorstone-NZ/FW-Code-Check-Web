import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    debugLogEmitter?: {
      on: (event: string, cb: (message: string) => void) => void;
      off: (event: string, cb: (message: string) => void) => void;
    };
    electron?: {
      onDebugLog?: (cb: (event: any, message: string) => void) => void;
      offDebugLog?: (cb: (event: any, message: string) => void) => void;
    };
  }
}

const MAX_LOG_LINES = 2000;

export default function DebugLogPanel() {
  const [logs, setLogs] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // On mount, load the last 100 lines of debug.log for instant feedback
    if (window.electron && typeof (window.electron as any).invoke === 'function') {
      (window.electron as any).invoke('get-debug-log').then((text: string) => {
        const lines = text.split(/\r?\n/).filter(Boolean);
        setLogs(lines.slice(-100));
      });
    }
    // Register for backend log streaming and subscribe to log events
    if (window.electron && typeof (window.electron as any).send === 'function') {
      console.log('Registering for debug-log streaming');
      (window.electron as any).send('debug-log');
      (window.electron as any).send('debug-log-force-latest');
    }
    // Listen for log events from the backend (via Electron IPC)
    function handleLog(_event: any, message: string) {
      if (!message) return;
      console.log('Received log:', message);
      setLogs(prev => {
        // Only add if not a duplicate of the last line
        if (prev.length > 0 && prev[prev.length - 1] === message) return prev;
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

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  const sendTestLog = () => {
    if (window.electron && typeof (window.electron as any).invoke === 'function') {
      (window.electron as any).invoke('debug-log-hook', {
        event: 'test-log',
        analysisId: 'test',
        hasLLM: false,
        timestamp: new Date().toISOString(),
      });
    }
  };

  return (
    <div style={{ background: '#181818', color: '#eee', height: '100%', overflow: 'auto', fontFamily: 'monospace', fontSize: 13, padding: 8 }} ref={logRef}>
      <button onClick={sendTestLog} style={{marginBottom: 8, background: '#333', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px', cursor: 'pointer'}}>Send Test Log</button>
      {logs.map((line, i) => (
        <div key={i}>{line}</div>
      ))}
    </div>
  );
}
