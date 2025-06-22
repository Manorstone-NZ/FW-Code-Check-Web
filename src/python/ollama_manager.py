#!/usr/bin/env python3
"""
Ollama Model Manager
Handles installation and management of Ollama models
"""

import subprocess
import sys
import json
import argparse
import shutil

class OllamaManager:
    def __init__(self):
        self.ollama_available = self.check_ollama_available()
    
    def check_ollama_available(self):
        """Check if Ollama is installed and available"""
        try:
            result = subprocess.run(['ollama', '--version'], 
                                  capture_output=True, text=True, timeout=10)
            return result.returncode == 0
        except (subprocess.TimeoutExpired, FileNotFoundError):
            return False
    
    def install_model(self, model_name):
        """Install an Ollama model"""
        if not self.ollama_available:
            return {
                'success': False,
                'error': 'Ollama is not installed or not available in PATH'
            }
        
        try:
            # Pull the model
            result = subprocess.run(['ollama', 'pull', model_name], 
                                  capture_output=True, text=True, timeout=300)
            
            if result.returncode == 0:
                return {
                    'success': True,
                    'message': f'Successfully installed model: {model_name}',
                    'output': result.stdout
                }
            else:
                return {
                    'success': False,
                    'error': f'Failed to install model: {result.stderr}',
                    'output': result.stdout
                }
        except subprocess.TimeoutExpired:
            return {
                'success': False,
                'error': 'Model installation timed out (300s)'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Error installing model: {str(e)}'
            }
    
    def list_models(self):
        """List installed Ollama models"""
        if not self.ollama_available:
            return {
                'success': False,
                'error': 'Ollama is not installed or not available',
                'models': []
            }
        
        try:
            result = subprocess.run(['ollama', 'list'], 
                                  capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                # Parse the output to extract model names
                lines = result.stdout.strip().split('\n')[1:]  # Skip header
                models = []
                for line in lines:
                    if line.strip():
                        parts = line.split()
                        if parts:
                            models.append(parts[0])  # Model name is first column
                
                return {
                    'success': True,
                    'models': models,
                    'output': result.stdout
                }
            else:
                return {
                    'success': False,
                    'error': f'Failed to list models: {result.stderr}',
                    'models': []
                }
        except Exception as e:
            return {
                'success': False,
                'error': f'Error listing models: {str(e)}',
                'models': []
            }
    
    def remove_model(self, model_name):
        """Remove an Ollama model"""
        if not self.ollama_available:
            return {
                'success': False,
                'error': 'Ollama is not installed or not available'
            }
        
        try:
            result = subprocess.run(['ollama', 'rm', model_name], 
                                  capture_output=True, text=True, timeout=60)
            
            if result.returncode == 0:
                return {
                    'success': True,
                    'message': f'Successfully removed model: {model_name}',
                    'output': result.stdout
                }
            else:
                return {
                    'success': False,
                    'error': f'Failed to remove model: {result.stderr}',
                    'output': result.stdout
                }
        except Exception as e:
            return {
                'success': False,
                'error': f'Error removing model: {str(e)}'
            }

def main():
    parser = argparse.ArgumentParser(description='Ollama Model Manager')
    parser.add_argument('--install', help='Install a model')
    parser.add_argument('--list', action='store_true', help='List installed models')
    parser.add_argument('--remove', help='Remove a model')
    parser.add_argument('--check', action='store_true', help='Check if Ollama is available')
    
    args = parser.parse_args()
    
    manager = OllamaManager()
    
    try:
        if args.install:
            result = manager.install_model(args.install)
        elif args.list:
            result = manager.list_models()
        elif args.remove:
            result = manager.remove_model(args.remove)
        elif args.check:
            result = {
                'success': True,
                'available': manager.ollama_available,
                'message': 'Ollama is available' if manager.ollama_available else 'Ollama is not available'
            }
        else:
            result = {
                'success': False,
                'error': 'No valid action specified'
            }
        
        print(json.dumps(result, indent=2))
        sys.exit(0 if result.get('success', False) else 1)
    
    except Exception as e:
        error_result = {
            'success': False,
            'error': f'Unexpected error: {str(e)}'
        }
        print(json.dumps(error_result, indent=2))
        sys.exit(1)

if __name__ == '__main__':
    main()
