#!/usr/bin/env python3
"""
End-to-end test for Git integration functionality.
This test validates that the Git integration works properly with .l5x files.
"""

import sys
import os
import tempfile
import shutil
import subprocess
import json
from pathlib import Path

# Add the src/python directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src', 'python'))

from git_integration import GitRepository

def run_test():
    """Run end-to-end Git integration test."""
    print("🧪 Starting Git Integration End-to-End Test")
    
    # Create a temporary directory for our test
    with tempfile.TemporaryDirectory() as temp_dir:
        test_repo_dir = os.path.join(temp_dir, 'test_repo')
        
        # Initialize a new Git repository
        print(f"📁 Creating test repository at: {test_repo_dir}")
        os.makedirs(test_repo_dir)
        
        # Initialize git repo
        subprocess.run(['git', 'init'], cwd=test_repo_dir, check=True, capture_output=True)
        subprocess.run(['git', 'config', 'user.name', 'Test User'], cwd=test_repo_dir, check=True)
        subprocess.run(['git', 'config', 'user.email', 'test@example.com'], cwd=test_repo_dir, check=True)
        
        # Create a sample .l5x file (simplified version)
        sample_l5x = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<RSLogix5000Content SchemaRevision="1.0" SoftwareRevision="35.00" TargetName="test_plc" TargetType="Controller" TargetRevision="35.00" TargetLastEdited="2024-01-01T00:00:00.000Z" ContainsContext="true" Owner="TestUser" ExportDate="Mon Jan 01 12:00:00 2024" ExportOptions="References DecoratedData Context Dependencies ForceProtectedEncoding AllProjDocTrans">
  <Controller Use="Context" Name="test_plc">
    <DataTypes Use="Context">
    </DataTypes>
    <Modules Use="Context">
    </Modules>
    <Programs Use="Context">
      <Program Use="Context" Name="MainProgram" TestEdits="false" MainRoutineName="MainRoutine" Disabled="false" UseAsFolder="false">
        <Tags Use="Context">
        </Tags>
        <Routines Use="Context">
          <Routine Use="Context" Name="MainRoutine" Type="RLL">
            <RLLContent>
              <Rung Number="0" Type="N">
                <Text>XIC(local_input_bit)[OTE(local_output_bit)];XIC(remote_input_bit)[OTE(remote_output_bit)];</Text>
              </Rung>
            </RLLContent>
          </Routine>
        </Routines>
      </Program>
    </Programs>
  </Controller>
</RSLogix5000Content>"""
        
        # Write the sample file
        sample_file_path = os.path.join(test_repo_dir, 'test_sample.l5x')
        with open(sample_file_path, 'w', encoding='utf-8') as f:
            f.write(sample_l5x)
        
        # Create initial commit
        subprocess.run(['git', 'add', '.'], cwd=test_repo_dir, check=True)
        subprocess.run(['git', 'commit', '-m', 'Initial commit with sample .l5x file'], cwd=test_repo_dir, check=True)
        
        # Create a development branch
        subprocess.run(['git', 'checkout', '-b', 'development'], cwd=test_repo_dir, check=True)
        
        # Add another .l5x file to the development branch
        dev_l5x_path = os.path.join(test_repo_dir, 'dev_sample.l5x')
        with open(dev_l5x_path, 'w', encoding='utf-8') as f:
            f.write(sample_l5x.replace('test_plc', 'dev_plc').replace('test_sample', 'dev_sample'))
        
        subprocess.run(['git', 'add', '.'], cwd=test_repo_dir, check=True)
        subprocess.run(['git', 'commit', '-m', 'Add development .l5x file'], cwd=test_repo_dir, check=True)
        
        # Switch back to master branch (default)
        subprocess.run(['git', 'checkout', 'master'], cwd=test_repo_dir, check=True)
        
        print("✅ Test repository created successfully")
        
        # Now test the Git integration
        git_integration = GitRepository()
        
        # Test connection
        print("🔗 Testing repository connection...")
        result = git_integration.connect_to_repository(test_repo_dir)
        if not result['success']:
            print(f"❌ Failed to connect to repository: {result['error']}")
            return False
        print(f"✅ Connected to repository: {result['path']}")
        
        # Test getting branches
        print("🌿 Testing branch listing...")
        result = git_integration.get_branches()
        if not result['success']:
            print(f"❌ Failed to get branches: {result['error']}")
            return False
        
        branches = result['branches']
        branch_names = [b['name'] for b in branches] if isinstance(branches, list) else branches
        print(f"✅ Found branches: {', '.join(branch_names)}")
        
        if 'master' not in branch_names or 'development' not in branch_names:
            print("❌ Expected branches not found")
            return False
        
        # Test getting files from master branch
        print("📄 Testing file listing on master branch...")
        result = git_integration.get_files('master')
        if not result['success']:
            print(f"❌ Failed to get files: {result['error']}")
            return False
        
        files = result['files']
        file_names = [f['path'] for f in files] if files else []
        print(f"✅ Files on master branch: {', '.join(file_names)}")
        
        # Check for .l5x files
        l5x_files = [f for f in file_names if f.endswith('.l5x')]
        if not l5x_files:
            print("❌ No .l5x files found on master branch")
            return False
        print(f"✅ Found .l5x files: {', '.join(l5x_files)}")
        
        # Test getting files from development branch
        print("📄 Testing file listing on development branch...")
        result = git_integration.get_files('development')
        if not result['success']:
            print(f"❌ Failed to get files from development: {result['error']}")
            return False
        
        dev_files = result['files']
        dev_file_names = [f['path'] for f in dev_files] if dev_files else []
        print(f"✅ Files on development branch: {', '.join(dev_file_names)}")
        
        # Test creating temporary file
        print("🔧 Testing temporary file creation...")
        result = git_integration.create_temporary_file('test_sample.l5x', 'master')
        if not result['success']:
            print(f"❌ Failed to create temp file: {result['error']}")
            return False
        
        temp_path = result['temp_path']
        print(f"✅ Created temporary file: {temp_path}")
        
        # Verify the temp file contains the expected content
        if os.path.exists(temp_path):
            with open(temp_path, 'r', encoding='utf-8') as f:
                content = f.read()
                if 'test_plc' in content and 'RSLogix5000Content' in content:
                    print("✅ Temporary file content verified")
                else:
                    print("❌ Temporary file content is incorrect")
                    return False
        else:
            print("❌ Temporary file was not created")
            return False
        
        # Test repository status
        print("📊 Testing repository status...")
        result = git_integration.get_repository_status()
        if not result['success']:
            print(f"❌ Failed to get status: {result['error']}")
            return False
        
        status = result['status']
        print(f"✅ Repository status - Current branch: {status.get('current_branch', 'unknown')}")
        
        # Test checkout
        print("🔄 Testing branch checkout...")
        result = git_integration.checkout_branch('development')
        if not result['success']:
            print(f"❌ Failed to checkout development branch: {result['error']}")
            return False
        print("✅ Successfully checked out development branch")
        
        # Verify we're on the development branch
        result = git_integration.get_repository_status()
        if result['success'] and result['status'].get('current_branch') == 'development':
            print("✅ Confirmed on development branch")
        else:
            print("❌ Branch checkout verification failed")
            return False
        
        # Switch back to master
        git_integration.checkout_branch('master')
        
        print("🎉 All Git integration tests passed!")
        return True

if __name__ == '__main__':
    success = run_test()
    sys.exit(0 if success else 1)
