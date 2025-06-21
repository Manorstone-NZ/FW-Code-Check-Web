// Utility functions for checking available LLM models
// This can be extended in the future to dynamically fetch models

export interface ModelInfo {
    label: string;
    value: string;
    category?: 'recommended' | 'reasoning' | 'specialized' | 'legacy';
    description?: string;
}

// Function to check if OpenAI API is available and get models
export async function getAvailableOpenAIModels(): Promise<ModelInfo[]> {
    // For now, return our static list
    // In the future, this could make an API call to get dynamic models
    return [
        // Recommended models
        { label: 'GPT-4o', value: 'gpt-4o', category: 'recommended', description: 'Most capable multimodal model' },
        { label: 'GPT-4o Mini', value: 'gpt-4o-mini', category: 'recommended', description: 'Fast and efficient' },
        { label: 'GPT-4 Turbo', value: 'gpt-4-turbo', category: 'recommended', description: 'Balanced performance' },
        { label: 'GPT-4', value: 'gpt-4', category: 'recommended', description: 'Most capable model' },
        { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo', category: 'recommended', description: 'Fast and cost-effective' },
        
        // Reasoning models
        { label: 'o1 Preview', value: 'o1-preview', category: 'reasoning', description: 'Advanced reasoning' },
        { label: 'o1 Mini', value: 'o1-mini', category: 'reasoning', description: 'Reasoning optimized' },
        { label: 'o1', value: 'o1', category: 'reasoning', description: 'Production reasoning' },
        { label: 'o1 Pro', value: 'o1-pro', category: 'reasoning', description: 'Professional reasoning' },
        
        // New models
        { label: 'o3 Mini', value: 'o3-mini', category: 'specialized', description: 'Latest mini model' },
        { label: 'o4 Mini', value: 'o4-mini', category: 'specialized', description: 'Experimental model' },
        { label: 'GPT-4.1', value: 'gpt-4.1', category: 'specialized', description: 'Enhanced GPT-4' },
        { label: 'GPT-4.1 Mini', value: 'gpt-4.1-mini', category: 'specialized', description: 'Compact enhanced model' },
        { label: 'GPT-4.1 Nano', value: 'gpt-4.1-nano', category: 'specialized', description: 'Ultra-compact model' },
    ];
}

// Function to check available Ollama models
export async function getAvailableOllamaModels(): Promise<ModelInfo[]> {
    // For now, return our static list
    // In the future, this could run 'ollama list' or make an API call
    return [
        { label: 'DeepSeek Coder', value: 'deepseek-coder', category: 'specialized', description: 'Code-focused model' },
        { label: 'Code Llama', value: 'codellama', category: 'specialized', description: 'Code generation model' },
        { label: 'Mistral', value: 'mistral', category: 'recommended', description: 'General purpose model' },
        { label: 'Llama 3', value: 'llama3', category: 'recommended', description: 'Latest Llama model' },
    ];
}

// Function to get all available models for a provider
export async function getModelsForProvider(provider: 'openai' | 'ollama'): Promise<ModelInfo[]> {
    if (provider === 'openai') {
        return await getAvailableOpenAIModels();
    } else {
        return await getAvailableOllamaModels();
    }
}

// Check if a specific model is available
export async function isModelAvailable(provider: 'openai' | 'ollama', modelValue: string): Promise<boolean> {
    const models = await getModelsForProvider(provider);
    return models.some(model => model.value === modelValue);
}
