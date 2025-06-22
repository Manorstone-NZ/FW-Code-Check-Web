#!/usr/bin/env python3
"""
Test the remote branches functionality with the demo repository
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'src', 'python'))

from git_integration import GitRepository
import json

def test_git_remote_branches():
    """Test the remote branches functionality"""
    print("Testing Git remote branches functionality...")
    
    git_repo = GitRepository()
    
    # Test the demo repository
    url = "https://github.com/Damiancnz/PLC-Programmes"
    print(f"Testing URL: {url}")
    
    result = git_repo.get_remote_branches(url)
    print(json.dumps(result, indent=2))
    
    if result['success']:
        print(f"✅ Successfully fetched {len(result['branches'])} branches:")
        for branch in result['branches']:
            print(f"  - {branch['name']} ({branch['commit']})")
    else:
        print(f"❌ Failed: {result['error']}")
        return False
    
    return True

if __name__ == "__main__":
    success = test_git_remote_branches()
    if success:
        print("\n✅ All tests passed!")
    else:
        print("\n❌ Some tests failed!")
        sys.exit(1)
