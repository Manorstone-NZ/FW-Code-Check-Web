// Configuration management for production-ready deployment

export interface AppConfig {
  environment: 'development' | 'staging' | 'production';
  version: string;
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
    enableRetry: boolean;
  };
  database: {
    path: string;
    backupEnabled: boolean;
    backupInterval: number; // minutes
    maxBackups: number;
  };
  llm: {
    defaultProvider: 'openai' | 'ollama' | 'anthropic';
    defaultModel: string;
    timeout: number;
    maxRetries: number;
    enableCache: boolean;
    cacheExpiry: number; // minutes
  };
  ui: {
    theme: 'light' | 'dark' | 'auto';
    enableAnimations: boolean;
    refreshInterval: number; // milliseconds
    maxRecentItems: number;
  };
  security: {
    enableEncryption: boolean;
    sessionTimeout: number; // minutes
    maxLoginAttempts: number;
    enableAuditLog: boolean;
  };
  features: {
    enableComparisons: boolean;
    enableThreatIntel: boolean;
    enableAdvancedAnalytics: boolean;
    enableExportFeatures: boolean;
    enableUserManagement: boolean;
  };
  logging: {
    level: 'error' | 'warn' | 'info' | 'debug';
    enableConsole: boolean;
    enableFile: boolean;
    maxLogSize: number; // MB
    maxLogFiles: number;
  };
}

// Default configurations for different environments
const DEFAULT_CONFIG: AppConfig = {
  environment: 'development',
  version: '2.0.0',
  api: {
    baseUrl: 'http://localhost:3000',
    timeout: 30000,
    retryAttempts: 3,
    enableRetry: true,
  },
  database: {
    path: './firstwatch.db',
    backupEnabled: true,
    backupInterval: 60, // 1 hour
    maxBackups: 10,
  },
  llm: {
    defaultProvider: 'openai',
    defaultModel: 'gpt-4o',
    timeout: 120000, // 2 minutes
    maxRetries: 3,
    enableCache: true,
    cacheExpiry: 30,
  },
  ui: {
    theme: 'light',
    enableAnimations: true,
    refreshInterval: 30000,
    maxRecentItems: 10,
  },
  security: {
    enableEncryption: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    enableAuditLog: false,
  },
  features: {
    enableComparisons: true,
    enableThreatIntel: true,
    enableAdvancedAnalytics: true,
    enableExportFeatures: true,
    enableUserManagement: false,
  },
  logging: {
    level: 'debug',
    enableConsole: true,
    enableFile: true,
    maxLogSize: 10, // 10MB
    maxLogFiles: 5,
  },
};

const PRODUCTION_CONFIG: Partial<AppConfig> = {
  environment: 'production',
  api: {
    ...DEFAULT_CONFIG.api,
    timeout: 60000, // Increased timeout for production
  },
  security: {
    ...DEFAULT_CONFIG.security,
    enableEncryption: true,
    enableAuditLog: true,
  },
  logging: {
    ...DEFAULT_CONFIG.logging,
    level: 'info',
    enableConsole: false, // Disable console logging in production
  },
  ui: {
    ...DEFAULT_CONFIG.ui,
    refreshInterval: 60000, // Less frequent updates in production
  },
};

const STAGING_CONFIG: Partial<AppConfig> = {
  environment: 'staging',
  logging: {
    ...DEFAULT_CONFIG.logging,
    level: 'info',
  },
  security: {
    ...DEFAULT_CONFIG.security,
    enableAuditLog: true,
  },
};

class ConfigManager {
  private config: AppConfig;
  private readonly configKey = 'plc_checker_config';

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): AppConfig {
    // Start with default config
    let config = { ...DEFAULT_CONFIG };

    // Apply environment-specific overrides
    const env = this.getEnvironment();
    switch (env) {
      case 'production':
        config = { ...config, ...PRODUCTION_CONFIG };
        break;
      case 'staging':
        config = { ...config, ...STAGING_CONFIG };
        break;
      default:
        // Development - use defaults
        break;
    }

    // Load user preferences from localStorage
    try {
      const savedConfig = localStorage.getItem(this.configKey);
      if (savedConfig) {
        const userConfig = JSON.parse(savedConfig);
        config = this.mergeConfigs(config, userConfig);
      }
    } catch (error) {
      console.warn('Failed to load user configuration:', error);
    }

    return config;
  }

  private mergeConfigs(base: AppConfig, override: Partial<AppConfig>): AppConfig {
    const merged = { ...base };
    
    for (const [key, value] of Object.entries(override)) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        const baseValue = merged[key as keyof AppConfig];
        if (baseValue && typeof baseValue === 'object') {
          merged[key as keyof AppConfig] = {
            ...baseValue,
            ...value,
          } as any;
        } else {
          merged[key as keyof AppConfig] = value as any;
        }
      } else {
        merged[key as keyof AppConfig] = value as any;
      }
    }
    
    return merged;
  }

  private getEnvironment(): 'development' | 'staging' | 'production' {
    // Check environment variable first
    if (typeof process !== 'undefined' && process.env.NODE_ENV) {
      if (process.env.NODE_ENV === 'production') return 'production';
      if (process.env.NODE_ENV === 'staging') return 'staging';
    }

    // Check for production builds
    if (typeof window !== 'undefined') {
      // In Electron, you might check for specific conditions
      if ((window as any).electron?.isPackaged) {
        return 'production';
      }
    }

    return 'development';
  }

  get(): AppConfig {
    return { ...this.config };
  }

  set(updates: Partial<AppConfig>): void {
    this.config = this.mergeConfigs(this.config, updates);
    this.saveConfig();
  }

  update(key: keyof AppConfig, value: any): void {
    this.config[key] = value;
    this.saveConfig();
  }

  updateNested<K extends keyof AppConfig>(
    key: K,
    nestedKey: keyof AppConfig[K],
    value: any
  ): void {
    (this.config[key] as any)[nestedKey] = value;
    this.saveConfig();
  }

  private saveConfig(): void {
    try {
      // Only save user-configurable settings, not environment-specific ones
      const userConfig = {
        ui: this.config.ui,
        llm: {
          defaultProvider: this.config.llm.defaultProvider,
          defaultModel: this.config.llm.defaultModel,
        },
        features: this.config.features,
      };
      
      localStorage.setItem(this.configKey, JSON.stringify(userConfig));
    } catch (error) {
      console.error('Failed to save configuration:', error);
    }
  }

  reset(): void {
    localStorage.removeItem(this.configKey);
    this.config = this.loadConfig();
  }

  // Utility methods for common config access
  isProduction(): boolean {
    return this.config.environment === 'production';
  }

  isDevelopment(): boolean {
    return this.config.environment === 'development';
  }

  isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
    return this.config.features[feature];
  }

  getLLMConfig() {
    return this.config.llm;
  }

  getUIConfig() {
    return this.config.ui;
  }

  getSecurityConfig() {
    return this.config.security;
  }

  getLoggingConfig() {
    return this.config.logging;
  }

  // Validation methods
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate required fields
    if (!this.config.version) {
      errors.push('Version is required');
    }

    if (!this.config.api.baseUrl) {
      errors.push('API base URL is required');
    }

    if (this.config.api.timeout < 1000) {
      errors.push('API timeout must be at least 1000ms');
    }

    if (this.config.llm.timeout < 10000) {
      errors.push('LLM timeout must be at least 10000ms');
    }

    // Validate database path
    if (!this.config.database.path) {
      errors.push('Database path is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Singleton instance
const configManager = new ConfigManager();

export default configManager;
export { ConfigManager };
