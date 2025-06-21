// Standalone script to install all required Ollama models
const { spawn } = require('child_process');

async function installAllOllamaModels() {
    const models = ['deepseek-coder', 'codellama', 'mistral', 'llama3'];
    for (const model of models) {
        await new Promise((resolve) => {
            const proc = spawn('ollama', ['pull', model], { stdio: 'inherit' });
            proc.on('close', () => resolve());
        });
    }
    console.log('All Ollama models installed.');
}

installAllOllamaModels();
