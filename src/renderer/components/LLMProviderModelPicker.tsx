import * as React from 'react';

// Centralized model definitions
export const OPENAI_MODELS = [
    // Most common/recommended models first
    { label: 'GPT-4o', value: 'gpt-4o' },
    { label: 'GPT-4o Mini', value: 'gpt-4o-mini' },
    { label: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
    { label: 'GPT-4', value: 'gpt-4' },
    { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
    { label: 'ChatGPT-4o Latest', value: 'chatgpt-4o-latest' },
    
    // Reasoning models
    { label: 'o1 Preview', value: 'o1-preview' },
    { label: 'o1 Mini', value: 'o1-mini' },
    { label: 'o1', value: 'o1' },
    { label: 'o1 Pro', value: 'o1-pro' },
    { label: 'o3 Mini', value: 'o3-mini' },
    { label: 'o4 Mini', value: 'o4-mini' },
    
    // Newer models
    { label: 'GPT-4.1', value: 'gpt-4.1' },
    { label: 'GPT-4.1 Mini', value: 'gpt-4.1-mini' },
    { label: 'GPT-4.1 Nano', value: 'gpt-4.1-nano' },
    { label: 'GPT-4.5 Preview', value: 'gpt-4.5-preview' },
    
    // Specific dated versions
    { label: 'GPT-4o (2024-11-20)', value: 'gpt-4o-2024-11-20' },
    { label: 'GPT-4o (2024-08-06)', value: 'gpt-4o-2024-08-06' },
    { label: 'GPT-4o (2024-05-13)', value: 'gpt-4o-2024-05-13' },
    { label: 'GPT-4o Mini (2024-07-18)', value: 'gpt-4o-mini-2024-07-18' },
    { label: 'GPT-4 Turbo (2024-04-09)', value: 'gpt-4-turbo-2024-04-09' },
    { label: 'GPT-4 Turbo Preview', value: 'gpt-4-turbo-preview' },
    { label: 'GPT-4 (0613)', value: 'gpt-4-0613' },
    { label: 'GPT-3.5 Turbo (0125)', value: 'gpt-3.5-turbo-0125' },
    { label: 'GPT-3.5 Turbo (1106)', value: 'gpt-3.5-turbo-1106' },
    { label: 'GPT-3.5 Turbo 16K', value: 'gpt-3.5-turbo-16k' },
];

export const OLLAMA_MODELS = [
    { label: 'DeepSeek Coder', value: 'deepseek-coder' },
    { label: 'Code Llama', value: 'codellama' },
    { label: 'Mistral', value: 'mistral' },
    { label: 'Llama 3', value: 'llama3' },
];

export const PROVIDERS = [
    { label: 'OpenAI', value: 'openai', models: OPENAI_MODELS },
    { label: 'Ollama', value: 'ollama', models: OLLAMA_MODELS },
];

export interface LLMProviderModelPickerProps {
    selectedProvider: string;
    selectedModel: string;
    onProviderChange: (provider: string) => void;
    onModelChange: (model: string) => void;
    layout?: 'horizontal' | 'vertical';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const LLMProviderModelPicker: React.FC<LLMProviderModelPickerProps> = ({
    selectedProvider,
    selectedModel,
    onProviderChange,
    onModelChange,
    layout = 'horizontal',
    size = 'md',
    className = ''
}) => {
    // Get models for the current provider
    const getCurrentProviderModels = () => {
        const provider = PROVIDERS.find(p => p.value === selectedProvider);
        return provider ? provider.models : [];
    };

    // Handle provider change and auto-select first model
    const handleProviderChange = (newProvider: string) => {
        onProviderChange(newProvider);
        const provider = PROVIDERS.find(p => p.value === newProvider);
        if (provider && provider.models.length > 0) {
            onModelChange(provider.models[0].value);
        }
    };

    // Size classes
    const sizeClasses = {
        sm: 'text-xs',
        md: 'text-sm', 
        lg: 'text-base'
    };

    const inputSizeClasses = {
        sm: 'px-2 py-1 text-xs',
        md: 'px-2 py-1 text-sm',
        lg: 'px-3 py-2 text-base'
    };

    const containerClass = layout === 'horizontal' 
        ? 'flex flex-row gap-4' 
        : 'flex flex-col gap-2';

    return (
        <div className={`${containerClass} ${className}`}>
            <div>
                <label className={`block font-semibold mb-1 ${sizeClasses[size]}`}>
                    Provider
                </label>
                <select
                    className={`border rounded ${inputSizeClasses[size]} w-full`}
                    value={selectedProvider}
                    onChange={e => handleProviderChange(e.target.value)}
                >
                    {PROVIDERS.map(provider => (
                        <option key={provider.value} value={provider.value}>
                            {provider.label}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label className={`block font-semibold mb-1 ${sizeClasses[size]}`}>
                    Model
                </label>
                <select
                    className={`border rounded ${inputSizeClasses[size]} w-full`}
                    value={selectedModel}
                    onChange={e => onModelChange(e.target.value)}
                >
                    {getCurrentProviderModels().map(model => (
                        <option key={model.value} value={model.value}>
                            {model.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default LLMProviderModelPicker;
