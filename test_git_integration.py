#!/usr/bin/env python3
"""
Test script for Git integration functionality
"""

import sys
import os
import json
import tempfile
import shutil

# Add the src/python directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src', 'python'))

from git_integration import GitRepository

def test_git_functionality():
    print("🔧 Testing PLC Code Checker Git Integration")
    print("=" * 50)
    
    # Test 1: Initialize Git repository instance
    print("\n1. Initializing Git repository instance...")
    git_repo = GitRepository()
    print("✅ Git repository instance created")
    
    # Test 2: Test connection to a non-existent repository
    print("\n2. Testing connection to non-existent repository...")
    result = git_repo.connect_to_repository("/non/existent/path")
    if not result['success']:
        print(f"✅ Correctly rejected invalid path: {result['error']}")
    else:
        print("❌ Should have rejected invalid path")
    
    # Test 3: Create a temporary test repository
    print("\n3. Creating temporary test repository...")
    temp_dir = tempfile.mkdtemp(prefix='plc_git_test_')
    try:
        # Initialize git repo
        import subprocess
        subprocess.run(['git', 'init'], cwd=temp_dir, check=True, capture_output=True)
        subprocess.run(['git', 'config', 'user.email', 'test@example.com'], cwd=temp_dir, check=True)
        subprocess.run(['git', 'config', 'user.name', 'Test User'], cwd=temp_dir, check=True)
        
        # Create a test PLC file
        test_file_path = os.path.join(temp_dir, 'test_plc.l5x')
        with open(test_file_path, 'w') as f:
            f.write('''<?xml version="1.0" encoding="UTF-8"?>
<RSLogix5000Content>
    <Controller Use="Context" Name="TestController">
        <Programs>
            <Program Name="MainProgram">
                <Routines>
                    <Routine Name="MainRoutine" Type="RLL">
                        <!-- Test PLC content -->
                    </Routine>
                </Routines>
            </Program>
        </Programs>
    </Controller>
</RSLogix5000Content>''')
        
        # Add and commit the file
        subprocess.run(['git', 'add', 'test_plc.l5x'], cwd=temp_dir, check=True)
        subprocess.run(['git', 'commit', '-m', 'Initial commit with test PLC file'], cwd=temp_dir, check=True)
        
        print(f"✅ Test repository created at {temp_dir}")
        
        # Test 4: Connect to the test repository
        print("\n4. Connecting to test repository...")
        result = git_repo.connect_to_repository(temp_dir)
        if result['success']:
            print(f"✅ Successfully connected: {result['message']}")
        else:
            print(f"❌ Failed to connect: {result['error']}")
            return
        
        # Test 5: Get repository status
        print("\n5. Getting repository status...")
        result = git_repo.get_repository_status()
        if result['success']:
            status = result['status']
            print(f"✅ Repository status retrieved:")
            print(f"   - Current branch: {status['current_branch']}")
            print(f"   - Is dirty: {status['is_dirty']}")
            print(f"   - Remotes: {status['remotes']}")
            if status['last_commit']:
                print(f"   - Last commit: {status['last_commit']['hash']} - {status['last_commit']['message']}")
        else:
            print(f"❌ Failed to get status: {result['error']}")
        
        # Test 6: Get branches
        print("\n6. Getting branches...")
        result = git_repo.get_branches()
        if result['success']:
            print(f"✅ Found {len(result['branches'])} branches:")
            for branch in result['branches']:
                active_marker = " (active)" if branch['active'] else ""
                print(f"   - {branch['name']} [{branch['type']}]{active_marker} @ {branch['commit']}")
        else:
            print(f"❌ Failed to get branches: {result['error']}")
        
        # Test 7: Get files
        print("\n7. Getting files...")
        result = git_repo.get_files()
        if result['success']:
            print(f"✅ Found {len(result['files'])} PLC files:")
            for file in result['files']:
                print(f"   - {file['name']} ({file['size']} bytes) at {file['path']}")
        else:
            print(f"❌ Failed to get files: {result['error']}")
        
        # Test 8: Get file content
        print("\n8. Getting file content...")
        result = git_repo.get_file_content('test_plc.l5x')
        if result['success']:
            content_preview = result['content'][:100] + "..." if len(result['content']) > 100 else result['content']
            print(f"✅ File content retrieved ({len(result['content'])} characters):")
            print(f"   Preview: {content_preview}")
        else:
            print(f"❌ Failed to get file content: {result['error']}")
        
        # Test 9: Create temporary file
        print("\n9. Creating temporary file...")
        result = git_repo.create_temporary_file('test_plc.l5x')
        if result['success']:
            print(f"✅ Temporary file created: {result['temp_path']}")
            # Verify the file exists and has correct content
            if os.path.exists(result['temp_path']):
                with open(result['temp_path'], 'r') as f:
                    temp_content = f.read()
                print(f"   Content length: {len(temp_content)} characters")
                print(f"   Content matches: {temp_content.startswith('<?xml version')}")
                
                # Clean up
                if result['temp_dir']:
                    shutil.rmtree(result['temp_dir'])
                    print("   Temporary directory cleaned up")
            else:
                print("❌ Temporary file was not created")
        else:
            print(f"❌ Failed to create temporary file: {result['error']}")
            
    except Exception as e:
        print(f"❌ Test failed with exception: {str(e)}")
    finally:
        # Clean up test repository
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
            print(f"\n🧹 Cleaned up test repository: {temp_dir}")
    
    print("\n🎉 Git integration test completed!")
    print("\nNext steps:")
    print("- Start the application with: npm start")
    print("- Navigate to Upload page")
    print("- Switch to 'Git Repository' mode")
    print("- Connect to a Git repository")
    print("- Browse and analyze files from different branches")

if __name__ == "__main__":
    test_git_functionality()
