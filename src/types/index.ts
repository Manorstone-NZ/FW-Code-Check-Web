export interface PlcFile {
    fileName: string;
    filePath: string;
    fileType: 'l5x' | 'txt';
    content: string;
}

export interface SecurityRisk {
    riskId: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    recommendation: string;
}

export interface AnalysisResult {
    file: PlcFile;
    risks: SecurityRisk[];
    timestamp: Date;
}

export interface UserSettings {
    theme: 'light' | 'dark';
    notificationsEnabled: boolean;
}