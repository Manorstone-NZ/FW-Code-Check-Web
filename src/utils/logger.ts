// Production-ready logging utility with multiple levels and outputs

import configManager from './config';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  category?: string;
  userId?: string;
  sessionId?: string;
  errorId?: string;
  stack?: string;
}

export interface LogOptions {
  category?: string;
  userId?: string;
  errorId?: string;
  sanitize?: boolean;
}

class Logger {
  private sessionId: string;
  private logBuffer: LogEntry[] = [];
  private readonly maxBufferSize = 1000;

  constructor() {
    this.sessionId = this.generateSessionId();
    
    // Flush logs periodically in production
    if (configManager.isProduction()) {
      setInterval(() => this.flushLogs(), 30000); // Every 30 seconds
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldLog(level: LogLevel): boolean {
    const configLevel = configManager.getLoggingConfig().level;
    const levels: LogLevel[] = ['error', 'warn', 'info', 'debug'];
    
    return levels.indexOf(level) <= levels.indexOf(configLevel);
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    data?: any,
    options: LogOptions = {}
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      sessionId: this.sessionId,
      ...options,
    };

    if (data !== undefined) {
      entry.data = options.sanitize ? this.sanitizeData(data) : data;
    }

    if (data instanceof Error) {
      entry.stack = data.stack;
      entry.message = `${message}: ${data.message}`;
    }

    return entry;
  }

  private sanitizeData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sensitiveFields = [
      'password', 'key', 'token', 'secret', 'api_key', 'apikey',
      'auth', 'authorization', 'credential', 'pwd', 'pass'
    ];

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }

    const sanitized = { ...data };
    for (const [key, value] of Object.entries(sanitized)) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeData(value);
      }
    }

    return sanitized;
  }

  private outputLog(entry: LogEntry): void {
    const config = configManager.getLoggingConfig();
    
    // Console output
    if (config.enableConsole || configManager.isDevelopment()) {
      const consoleMethod = entry.level === 'error' ? console.error :
                           entry.level === 'warn' ? console.warn :
                           entry.level === 'debug' ? console.debug :
                           console.log;

      const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;
      const category = entry.category ? ` [${entry.category}]` : '';
      
      if (entry.data) {
        consoleMethod(`${prefix}${category} ${entry.message}`, entry.data);
      } else {
        consoleMethod(`${prefix}${category} ${entry.message}`);
      }

      if (entry.stack && configManager.isDevelopment()) {
        console.debug('Stack trace:', entry.stack);
      }
    }

    // Add to buffer for file output
    if (config.enableFile) {
      this.logBuffer.push(entry);
      
      // Prevent memory leaks
      if (this.logBuffer.length > this.maxBufferSize) {
        this.logBuffer = this.logBuffer.slice(-this.maxBufferSize / 2);
      }
    }

    // Send to external service in production
    if (configManager.isProduction() && entry.level === 'error') {
      this.sendToMonitoringService(entry);
    }
  }

  private async sendToMonitoringService(entry: LogEntry): Promise<void> {
    try {
      // In a real application, send to monitoring service like Sentry, LogRocket, etc.
      // await monitoringService.captureException(entry);
      
      // For now, just store in Electron's main process
      if (typeof window !== 'undefined' && (window as any).electron) {
        (window as any).electron.invoke('log-error', entry);
      }
    } catch (error) {
      // Fallback to console if monitoring service fails
      console.error('Failed to send log to monitoring service:', error);
    }
  }

  private async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    try {
      // In a real application, write to file or send to log aggregation service
      if (typeof window !== 'undefined' && (window as any).electron) {
        await (window as any).electron.invoke('flush-logs', [...this.logBuffer]);
        this.logBuffer = [];
      }
    } catch (error) {
      console.error('Failed to flush logs:', error);
    }
  }

  // Public logging methods
  error(message: string, data?: any, options: LogOptions = {}): void {
    if (!this.shouldLog('error')) return;
    
    const entry = this.createLogEntry('error', message, data, {
      ...options,
      sanitize: configManager.isProduction(),
    });
    
    this.outputLog(entry);
  }

  warn(message: string, data?: any, options: LogOptions = {}): void {
    if (!this.shouldLog('warn')) return;
    
    const entry = this.createLogEntry('warn', message, data, options);
    this.outputLog(entry);
  }

  info(message: string, data?: any, options: LogOptions = {}): void {
    if (!this.shouldLog('info')) return;
    
    const entry = this.createLogEntry('info', message, data, options);
    this.outputLog(entry);
  }

  debug(message: string, data?: any, options: LogOptions = {}): void {
    if (!this.shouldLog('debug')) return;
    
    const entry = this.createLogEntry('debug', message, data, options);
    this.outputLog(entry);
  }

  // Specialized logging methods
  security(message: string, data?: any, options: LogOptions = {}): void {
    this.warn(message, data, { ...options, category: 'SECURITY' });
  }

  performance(message: string, data?: any, options: LogOptions = {}): void {
    this.info(message, data, { ...options, category: 'PERFORMANCE' });
  }

  audit(action: string, details?: any, options: LogOptions = {}): void {
    this.info(`User action: ${action}`, details, { 
      ...options, 
      category: 'AUDIT' 
    });
  }

  llm(message: string, data?: any, options: LogOptions = {}): void {
    this.info(message, data, { ...options, category: 'LLM' });
  }

  database(message: string, data?: any, options: LogOptions = {}): void {
    this.debug(message, data, { ...options, category: 'DATABASE' });
  }

  // Performance measurement
  time(label: string): void {
    if (configManager.isDevelopment()) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (configManager.isDevelopment()) {
      console.timeEnd(label);
    }
  }

  // Get logs for debugging or export
  getLogs(level?: LogLevel, category?: string, limit = 100): LogEntry[] {
    let filtered = [...this.logBuffer];

    if (level) {
      filtered = filtered.filter(entry => entry.level === level);
    }

    if (category) {
      filtered = filtered.filter(entry => entry.category === category);
    }

    return filtered
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  // Clear logs
  clearLogs(): void {
    this.logBuffer = [];
  }

  // Export logs for support
  exportLogs(): string {
    return JSON.stringify(this.logBuffer, null, 2);
  }

  // Get session info
  getSessionInfo(): { sessionId: string; startTime: string; logCount: number } {
    return {
      sessionId: this.sessionId,
      startTime: this.logBuffer[0]?.timestamp || new Date().toISOString(),
      logCount: this.logBuffer.length,
    };
  }
}

// Singleton instance
const logger = new Logger();

// Capture unhandled errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    logger.error('Unhandled error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
    }, { category: 'UNHANDLED_ERROR' });
  });

  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection', {
      reason: event.reason,
    }, { category: 'UNHANDLED_REJECTION' });
  });
}

export default logger;
export { Logger };
