#!/usr/bin/env python3
"""
Fix Git handlers in electron.js by adding missing pythonExecutable definitions
"""

import re
import sys

def fix_git_handlers(content):
    """Fix all Git handlers by adding pythonExecutable definition"""
    
    # Pattern to match Git handlers that are missing pythonExecutable
    pattern = r"(electron_1\.ipcMain\.handle\('git-[^']+.*?\n.*?return new Promise\(\(resolve\) => \{\n.*?const pythonPath = [^\n]+\n)(.*?)(.*?console\.log\(\['[^']+'\] Running:', pythonExecutable, args\);)"
    
    def replace_handler(match):
        start = match.group(1)
        middle = match.group(2)
        end = match.group(3)
        
        # Check if pythonExecutable is already defined
        if 'const pythonExecutable' in middle:
            return match.group(0)  # Already fixed
        
        # Add the pythonExecutable definition
        python_exec_def = "        const venvPython = path.join(__dirname, '../../venv/bin/python3');\n        const pythonExecutable = require('fs').existsSync(venvPython) ? venvPython : 'python3';\n"
        
        return start + python_exec_def + middle + end
    
    # Apply the fix
    fixed_content = re.sub(pattern, replace_handler, content, flags=re.DOTALL)
    return fixed_content

def main():
    file_path = "/Users/damian/Development Projects/PLC Code Check/first-watch-plc-code-checker-v2/src/main/electron.js"
    
    # Read the file
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Apply fixes
    fixed_content = fix_git_handlers(content)
    
    # Write back
    with open(file_path, 'w') as f:
        f.write(fixed_content)
    
    print("Fixed Git handlers in electron.js")

if __name__ == "__main__":
    main()
