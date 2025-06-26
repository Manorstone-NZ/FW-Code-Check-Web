/// <reference types="react" />
import { useState, useCallback, useEffect } from 'react';

export function useAnalyses() {
    const [analyses, setAnalyses] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAnalyses = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // @ts-ignore
            const data = await window.electron.invoke('list-analyses');
            setAnalyses(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load analyses');
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchAnalyses();
    }, [fetchAnalyses]);

    return { analyses, loading, error, refresh: fetchAnalyses };
}

export async function getAnalysisById(id: number) {
    // @ts-ignore
    return await window.electron.invoke('get-analysis', id);
}

export function useBaselines() {
    const [baselines, setBaselines] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchBaselines = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // @ts-ignore
            const data = await window.electron.invoke('list-baselines');
            setBaselines(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load baselines');
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchBaselines();
    }, [fetchBaselines]);

    return { baselines, loading, error, refresh: fetchBaselines };
}

export async function getBaselineById(id: number) {
    // @ts-ignore
    return await window.electron.invoke('get-baseline', id);
}

export async function saveBaseline(fileName: string, originalName?: string, filePath?: string, analysis_json?: any, provider?: string, model?: string) {
    // @ts-ignore
    return await window.electron.invoke('save-baseline', fileName, originalName, filePath, analysis_json, provider, model);
}

export async function deleteBaseline(id: number) {
    // @ts-ignore
    return await window.electron.invoke('delete-baseline', id);
}

export async function deleteAnalysis(id: number) {
    // @ts-ignore
    return await window.electron.invoke('delete-analysis', id);
}

export function useLLMStatus(pollInterval = 60000) { // Increased to 60 seconds
    const [status, setStatus] = useState<'online' | 'offline' | 'checking'>('checking');
    const [error, setError] = useState<string | null>(null);
    const [providers, setProviders] = useState<any>(null);
    const [onlineProviders, setOnlineProviders] = useState<string[]>([]);

    const checkStatus = useCallback(async () => {
        setStatus('checking');
        setError(null);
        try {
            // @ts-ignore
            const result = await window.electron.invoke('check-llm-status');
            if (result && result.ok) {
                setStatus('online');
                setProviders(result.providers || null);
                setOnlineProviders(result.online_providers || []);
            } else {
                setStatus('offline');
                setError(result?.error || 'Unknown error');
                setProviders(result?.providers || null);
                setOnlineProviders(result?.online_providers || []);
            }
        } catch (e) {
            setStatus('offline');
            setError(e instanceof Error ? e.message : 'Failed to check LLM status');
            setProviders(null);
            setOnlineProviders([]);
        }
    }, []);

    useEffect(() => {
        checkStatus();
        if (pollInterval > 0) {
            const interval = setInterval(checkStatus, pollInterval);
            return () => clearInterval(interval);
        }
    }, [checkStatus, pollInterval]);

    return { status, error, providers, onlineProviders, refresh: checkStatus };
}

export async function llmCompareAnalysisToBaseline(
  analysisPathOrContent: string | object,
  baselinePathOrContent: string | object,
  provider?: string
) {
  // @ts-ignore
  return await window.electron.invoke('llm-compare-analysis-baseline', analysisPathOrContent, baselinePathOrContent, provider);
}

export async function listComparisonHistory(analysisId?: number, baselineId?: number) {
  // @ts-ignore
  return await window.electron.invoke('list-comparison-history', analysisId, baselineId);
}

export async function analyzeFile(file: File, provider?: string, model?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (provider) formData.append('provider', provider);
    if (model) formData.append('model', model);
    // Use relative path for local dev, or set REACT_APP_API_URL for production
    const apiUrl = process.env.REACT_APP_API_URL || '/api/analyze';
    const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
    });
    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to analyze file');
    }
    return await response.json();
}

export async function syncOTThreatIntel(provider?: string) {
    // @ts-ignore
    return await window.electron.invoke('sync-ot-threat-intel', provider);
}
