// Security configuration and utilities for production deployment
import * as path from 'path';

export interface SecurityConfig {
  encryption: {
    enabled: boolean;
    algorithm: string;
    keyLength: number;
  };
  session: {
    timeout: number; // milliseconds
    regenerateInterval: number;
    secure: boolean;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    enabled: boolean;
  };
  fileUpload: {
    maxFileSize: number; // bytes
    allowedExtensions: string[];
    scanForMalware: boolean;
  };
  api: {
    corsEnabled: boolean;
    allowedOrigins: string[];
    validateHeaders: boolean;
  };
  logging: {
    level: 'error' | 'warn' | 'info' | 'debug';
    sanitizeData: boolean;
    includeStackTrace: boolean;
  };
}

export const PRODUCTION_SECURITY_CONFIG: SecurityConfig = {
  encryption: {
    enabled: true,
    algorithm: 'aes-256-gcm',
    keyLength: 32,
  },
  session: {
    timeout: 30 * 60 * 1000, // 30 minutes
    regenerateInterval: 5 * 60 * 1000, // 5 minutes
    secure: true,
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    enabled: true,
  },
  fileUpload: {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedExtensions: ['.l5x', '.l5k', '.acd', '.rsp'],
    scanForMalware: true,
  },
  api: {
    corsEnabled: false, // Disable CORS in Electron app
    allowedOrigins: [],
    validateHeaders: true,
  },
  logging: {
    level: 'info',
    sanitizeData: true,
    includeStackTrace: false,
  },
};

export const DEVELOPMENT_SECURITY_CONFIG: SecurityConfig = {
  ...PRODUCTION_SECURITY_CONFIG,
  session: {
    ...PRODUCTION_SECURITY_CONFIG.session,
    timeout: 8 * 60 * 60 * 1000, // 8 hours for development
  },
  rateLimit: {
    ...PRODUCTION_SECURITY_CONFIG.rateLimit,
    enabled: false,
  },
  logging: {
    level: 'debug',
    sanitizeData: false,
    includeStackTrace: true,
  },
};

// Input validation utilities
export class InputValidator {
  static sanitizeFileName(fileName: string): string {
    // Remove potentially dangerous characters and normalize
    return fileName
      .replace(/[^\w\s.-]/gi, '')
      .replace(/\s+/g, '_')
      .substring(0, 255);
  }

  static validateFileExtension(fileName: string, allowedExtensions: string[]): boolean {
    const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    return allowedExtensions.includes(ext);
  }

  static sanitizePath(filePath: string): string {
    // Prevent directory traversal attacks
    return path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');
  }

  static validateJsonInput(input: any): boolean {
    try {
      if (typeof input === 'string') {
        JSON.parse(input);
      }
      return true;
    } catch {
      return false;
    }
  }

  static sanitizeLogData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sensitiveFields = ['password', 'key', 'token', 'secret', 'api_key'];
    const sanitized = { ...data };

    for (const [key, value] of Object.entries(sanitized)) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = InputValidator.sanitizeLogData(value);
      }
    }

    return sanitized;
  }
}

// Error handling utilities
export class SecureErrorHandler {
  static formatError(error: Error, includeStack = false): {
    message: string;
    code?: string;
    stack?: string;
  } {
    return {
      message: error.message || 'An error occurred',
      code: (error as any).code,
      ...(includeStack && { stack: error.stack }),
    };
  }

  static logSecurityEvent(event: string, details: any, userId?: string): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details: InputValidator.sanitizeLogData(details),
      userId,
      severity: 'security',
    };

    // In a real application, this would go to a secure logging service
    console.warn('[SECURITY]', JSON.stringify(logEntry));
  }
}

export default {
  PRODUCTION_SECURITY_CONFIG,
  DEVELOPMENT_SECURITY_CONFIG,
  InputValidator,
  SecureErrorHandler,
};
