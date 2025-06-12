// src/renderer/utils/debugLog.ts
export function debugLog(event: string, details: Record<string, any> = {}) {
  const logLine = `[${new Date().toISOString()}] [frontend-debugLog] event=${event} details=${JSON.stringify(details)}`;
  if (typeof window !== 'undefined' && window.console) {
    console.log(logLine);
  }
  if (window.electron && typeof (window.electron as any).invoke === 'function') {
    (window.electron as any).invoke('debug-log-hook', {
      event,
      ...details,
      timestamp: new Date().toISOString(),
    });
  }
}
