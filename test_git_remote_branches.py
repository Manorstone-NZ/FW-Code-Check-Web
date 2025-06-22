#!/usr/bin/env python3
"""
Test script to verify the remote branches functionality
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'src', 'python'))

from git_integration import GitRepository
import json

def test_remote_branches():
    """Test getting remote branches from a Git URL"""
    git_repo = GitRepository()
    
    print("Testing remote branches functionality...")
    
    # Test with the demo repository
    test_urls = [
        "https://github.com/Damiancnz/PLC-Programmes",
        "https://github.com/octocat/Hello-World",  # Simple test repo
    ]
    
    for url in test_urls:
        print(f"\nTesting URL: {url}")
        result = git_repo.get_remote_branches(url)
        print(json.dumps(result, indent=2))
        
        if result['success']:
            branches = result['branches']
            print(f"Found {len(branches)} remote branches:")
            for branch in branches:
                print(f"  - {branch['name']} ({branch['commit']})")
        else:
            print(f"Failed: {result['error']}")

if __name__ == "__main__":
    test_remote_branches()
