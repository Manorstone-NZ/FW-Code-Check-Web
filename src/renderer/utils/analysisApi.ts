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

export async function saveBaseline(fileName: string, originalName?: string, filePath?: string) {
    // @ts-ignore
    return await window.electron.invoke('save-baseline', fileName, originalName, filePath);
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

    const checkStatus = useCallback(async () => {
        setStatus('checking');
        setError(null);
        try {
            // @ts-ignore
            const result = await window.electron.invoke('check-llm-status');
            if (result && result.ok) {
                setStatus('online');
            } else {
                setStatus('offline');
                setError(result?.error || 'Unknown error');
            }
        } catch (e) {
            setStatus('offline');
            setError(e instanceof Error ? e.message : 'Failed to check LLM status');
        }
    }, []);

    useEffect(() => {
        checkStatus();
        if (pollInterval > 0) {
            const interval = setInterval(checkStatus, pollInterval);
            return () => clearInterval(interval);
        }
    }, [checkStatus, pollInterval]);

    return { status, error, refresh: checkStatus };
}

export async function llmCompareAnalysisToBaseline(
  analysisPathOrContent: string | object,
  baselinePathOrContent: string | object
) {
  // @ts-ignore
  return await window.electron.invoke('llm-compare-analysis-baseline', analysisPathOrContent, baselinePathOrContent);
}

export async function listComparisonHistory(analysisId?: number, baselineId?: number) {
  // @ts-ignore
  return await window.electron.invoke('list-comparison-history', analysisId, baselineId);
}
