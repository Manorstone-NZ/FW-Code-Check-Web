#!/usr/bin/env python3
"""
Quick integration test for Git functionality
"""

import sys
import os
import tempfile
import shutil
import json

# Add src path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src', 'python'))

from git_integration import GitRepository

def test_git_integration():
    """Test basic Git integration functionality"""
    print("🧪 Testing Git Integration...")
    
    # Test 1: Initialize GitRepository class
    print("\n1. Testing GitRepository initialization...")
    git_repo = GitRepository()
    assert git_repo is not None, "GitRepository should initialize"
    print("✅ GitRepository initialized successfully")
    
    # Test 2: Test help/status without repository
    print("\n2. Testing status without repository...")
    status = git_repo.get_repository_status()
    assert status['success'] == False, "Should fail without repository"
    assert 'No repository connected' in status['error'], "Should show proper error"
    print("✅ Proper error handling without repository")
    
    # Test 3: Test CLI interface
    print("\n3. Testing CLI interface...")
    import subprocess
    result = subprocess.run([
        sys.executable, 'src/python/git_integration.py'
    ], capture_output=True, text=True, cwd=os.path.dirname(__file__))
    
    assert result.returncode == 0, f"CLI should run successfully, got: {result.stderr}"
    assert "Usage: python git_integration.py" in result.stdout, "Should show help message"
    print("✅ CLI interface working")
    
    # Test 4: Test with a real repository (current directory)
    print("\n4. Testing with current repository...")
    current_dir = os.path.dirname(__file__)
    git_repo_current = GitRepository(current_dir)
    
    if git_repo_current.repo:
        print("✅ Successfully connected to current repository")
        
        # Test branches
        branches = git_repo_current.get_branches()
        if branches['success']:
            print(f"✅ Found {len(branches['branches'])} branches")
        else:
            print(f"⚠️  Branch listing failed: {branches['error']}")
        
        # Test status
        status = git_repo_current.get_repository_status()
        if status['success']:
            print(f"✅ Repository status: current branch = {status['status']['current_branch']}")
        else:
            print(f"⚠️  Status failed: {status['error']}")
    else:
        print("⚠️  Current directory is not a Git repository (this is expected if not in a Git repo)")
    
    print("\n🎉 All Git integration tests completed!")
    return True

if __name__ == "__main__":
    try:
        test_git_integration()
        print("\n✅ All tests passed!")
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
