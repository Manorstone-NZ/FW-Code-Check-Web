#!/usr/bin/env python3

import json
import datetime
import os
import sys

# Add the current directory to the path to import analyzer
sys.path.append(os.path.dirname(__file__))

from src.python.analyzer import log_llm_interaction

def test_llm_logging():
    """Test LLM logging functionality"""
    print("Testing LLM logging functionality...")
    
    # Create a test log entry
    test_prompt = "Analyze this PLC code for security vulnerabilities: LD %IX0.0"
    test_result = {
        "vulnerabilities": [
            {
                "type": "Input validation",
                "severity": "medium",
                "description": "Direct input usage without validation"
            }
        ],
        "recommendations": ["Add input validation", "Implement bounds checking"]
    }
    
    print("Creating test log entry...")
    log_llm_interaction(
        prompt=test_prompt,
        result=test_result,
        success=True,
        provider="openai",
        model="gpt-4o"
    )
    
    print("✅ Test log entry created successfully!")
    print("📝 Check the LLM Log page in the admin panel to see the entry.")
    
    # Check if log file was created
    log_path = os.path.join(os.path.dirname(__file__), 'llm-interactions.log.json')
    if os.path.exists(log_path):
        print(f"✅ Log file exists at: {log_path}")
        with open(log_path, 'r', encoding='utf-8') as f:
            content = f.read()
            lines = [line.strip() for line in content.split('\n') if line.strip()]
            print(f"✅ Log file has {len(lines)} entries")
    else:
        print("❌ Log file not found")

if __name__ == "__main__":
    test_llm_logging()
