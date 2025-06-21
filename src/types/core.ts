// Core type definitions for production-ready application
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'analyst' | 'viewer';
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  notifications: NotificationSettings;
  dashboard: DashboardSettings;
}

export interface NotificationSettings {
  email: boolean;
  inApp: boolean;
  severity: {
    critical: boolean;
    high: boolean;
    medium: boolean;
    low: boolean;
  };
}

export interface DashboardSettings {
  layout: 'grid' | 'list';
  refreshInterval: number; // seconds
  defaultTimeRange: '1h' | '24h' | '7d' | '30d';
  visibleMetrics: string[];
}

// Analysis types
export interface Analysis {
  id: number;
  fileName: string;
  originalFileName?: string;
  filePath?: string;
  date: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  provider: LLMProvider;
  model: string;
  analysisJson: AnalysisJson;
  createdAt: string;
  updatedAt: string;
  userId?: string;
}

export interface AnalysisJson {
  llmResults?: string;
  llmResult?: string;
  vulnerabilities?: Vulnerability[];
  instructionAnalysis?: InstructionAnalysis[];
  fileName?: string;
  provider?: string;
  model?: string;
  metadata?: AnalysisMetadata;
}

export interface AnalysisMetadata {
  fileSize: number;
  processingTime: number;
  tokensUsed?: number;
  confidence: number;
  version: string;
}

export interface Vulnerability {
  id: string;
  type: VulnerabilityType;
  severity: Severity;
  description: string;
  location: CodeLocation;
  recommendation: string;
  cve?: string;
  references?: string[];
  status: 'open' | 'acknowledged' | 'fixed' | 'false_positive';
}

export interface InstructionAnalysis {
  id: string;
  instruction: string;
  riskLevel: Severity;
  description: string;
  recommendation: string;
  location: CodeLocation;
  confidence: number;
}

export interface CodeLocation {
  file: string;
  line?: number;
  column?: number;
  network?: string;
  rung?: string;
}

// Baseline types
export interface Baseline {
  id: number;
  fileName: string;
  originalFileName?: string;
  filePath?: string;
  date: string;
  analysisJson: AnalysisJson;
  provider: LLMProvider;
  model: string;
  createdAt: string;
  updatedAt: string;
  userId?: string;
  isActive: boolean;
}

// Comparison types
export interface Comparison {
  id: number;
  analysisId: number;
  baselineId: number;
  result: string;
  severity: Severity;
  provider: LLMProvider;
  model: string;
  timestamp: string;
  analysisFileName?: string;
  baselineFileName?: string;
  userId?: string;
}

// Enums and constants
export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type VulnerabilityType = 
  | 'authentication'
  | 'authorization' 
  | 'injection'
  | 'disclosure'
  | 'denial_of_service'
  | 'code_execution'
  | 'configuration'
  | 'other';

export type LLMProvider = 'openai' | 'ollama' | 'anthropic' | 'local';

export interface LLMModel {
  id: string;
  name: string;
  provider: LLMProvider;
  maxTokens: number;
  costPer1kTokens?: number;
  isAvailable: boolean;
  capabilities: string[];
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Dashboard types
export interface DashboardMetric {
  id: string;
  name: string;
  value: number | string;
  previousValue?: number | string;
  change?: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  trend?: DataPoint[];
  status: 'healthy' | 'warning' | 'critical';
  unit?: string;
}

export interface DataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  services: ServiceStatus[];
  lastUpdated: string;
}

export interface ServiceStatus {
  name: string;
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  errorRate?: number;
  lastChecked: string;
}

// OT Threat Intelligence types
export interface ThreatIntel {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  category: string;
  tags: string[];
  publishedDate: string;
  source: string;
  cve?: string;
  affectedSystems: string[];
  mitigations: string[];
  references: string[];
  status: 'active' | 'resolved' | 'investigating';
}

// Settings and Configuration
export interface ApplicationConfig {
  version: string;
  environment: 'development' | 'staging' | 'production';
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
  };
  database: {
    path: string;
    backupInterval: number;
  };
  llm: {
    defaultProvider: LLMProvider;
    defaultModel: string;
    timeout: number;
    maxRetries: number;
  };
  security: {
    encryptionEnabled: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
  };
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  userId?: string;
  context?: Record<string, any>;
}

export interface ValidationError extends AppError {
  field: string;
  value: any;
  constraint: string;
}

// Audit types
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
}

// File handling
export interface FileUpload {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  uploadedAt: string;
  userId: string;
  status: 'uploading' | 'uploaded' | 'processing' | 'failed';
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
