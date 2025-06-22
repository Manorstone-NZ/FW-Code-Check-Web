#!/usr/bin/env python3
"""
Demo script to demonstrate the Git integration with PLC file analysis.
This script simulates the complete workflow:
1. Clone/connect to a Git repository
2. Browse files across branches
3. Analyze PLC files from Git
4. Demonstrate risk gating for commits
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

def create_sample_plc_repository():
    """Create a sample Git repository with PLC files for demonstration."""
    temp_dir = tempfile.mkdtemp(prefix='plc_demo_repo_')
    repo_dir = os.path.join(temp_dir, 'demo_plc_project')
    
    print(f"📁 Creating demo repository at: {repo_dir}")
    os.makedirs(repo_dir)
    
    # Initialize git repo
    subprocess.run(['git', 'init'], cwd=repo_dir, check=True, capture_output=True)
    subprocess.run(['git', 'config', 'user.name', 'Demo User'], cwd=repo_dir, check=True)
    subprocess.run(['git', 'config', 'user.email', 'demo@plc-checker.com'], cwd=repo_dir, check=True)
    
    # Create main branch PLC file (secure)
    main_plc = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<RSLogix5000Content SchemaRevision="1.0" SoftwareRevision="35.00" TargetName="main_controller" TargetType="Controller">
  <Controller Use="Context" Name="main_controller">
    <Programs Use="Context">
      <Program Use="Context" Name="MainProgram" TestEdits="false" MainRoutineName="MainRoutine">
        <Routines Use="Context">
          <Routine Use="Context" Name="MainRoutine" Type="RLL">
            <RLLContent>
              <Rung Number="0" Type="N">
                <Text>XIC(SafetyInput_OK)[MOV(#1,ProductionCounter)];</Text>
              </Rung>
              <Rung Number="1" Type="N">
                <Text>XIC(SystemReady)[OTE(ProcessOutput)];</Text>
              </Rung>
            </RLLContent>
          </Routine>
        </Routines>
      </Program>
    </Programs>
  </Controller>
</RSLogix5000Content>"""
    
    # Create development branch PLC file (potentially risky)
    dev_plc = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<RSLogix5000Content SchemaRevision="1.0" SoftwareRevision="35.00" TargetName="dev_controller" TargetType="Controller">
  <Controller Use="Context" Name="dev_controller">
    <Programs Use="Context">
      <Program Use="Context" Name="MainProgram" TestEdits="false" MainRoutineName="MainRoutine">
        <Routines Use="Context">
          <Routine Use="Context" Name="MainRoutine" Type="RLL">
            <RLLContent>
              <Rung Number="0" Type="N">
                <Text>MOV(#1,DirectOutput);</Text>
              </Rung>
              <Rung Number="1" Type="N">
                <Text>XIC(BypassSafety)[OTE(ProcessOutput)];</Text>
              </Rung>
              <Rung Number="2" Type="N">
                <Text>XIC(RemoteAccess)[OTE(SystemControl)];</Text>
              </Rung>
            </RLLContent>
          </Routine>
        </Routines>
      </Program>
    </Programs>
  </Controller>
</RSLogix5000Content>"""
    
    # Write main branch file
    main_file_path = os.path.join(repo_dir, 'production_control.l5x')
    with open(main_file_path, 'w', encoding='utf-8') as f:
        f.write(main_plc)
    
    # Initial commit
    subprocess.run(['git', 'add', '.'], cwd=repo_dir, check=True)
    subprocess.run(['git', 'commit', '-m', 'Initial commit: Production control system'], cwd=repo_dir, check=True)
    
    # Create development branch
    subprocess.run(['git', 'checkout', '-b', 'development'], cwd=repo_dir, check=True)
    
    # Add development file with potential security issues
    dev_file_path = os.path.join(repo_dir, 'experimental_control.l5x')
    with open(dev_file_path, 'w', encoding='utf-8') as f:
        f.write(dev_plc)
    
    subprocess.run(['git', 'add', '.'], cwd=repo_dir, check=True)
    subprocess.run(['git', 'commit', '-m', 'Add experimental control features'], cwd=repo_dir, check=True)
    
    # Switch back to master
    subprocess.run(['git', 'checkout', 'master'], cwd=repo_dir, check=True)
    
    print(f"✅ Demo repository created at: {repo_dir}")
    return repo_dir, temp_dir

def analyze_file_with_mock_results(file_path):
    """Mock analysis function that returns different results based on file content."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Mock analysis based on content
        if 'BypassSafety' in content or 'RemoteAccess' in content:
            return {
                'success': True,
                'risk_level': 'HIGH',
                'findings': [
                    'CRITICAL: Safety bypass detected in ladder logic',
                    'WARNING: Remote access capabilities without proper authentication',
                    'SECURITY: Direct output manipulation without safety interlocks'
                ],
                'recommendations': [
                    'Remove safety bypass functionality',
                    'Implement proper authentication for remote access',
                    'Add safety interlocks for all critical outputs'
                ]
            }
        else:
            return {
                'success': True,
                'risk_level': 'LOW',
                'findings': [
                    'Safety inputs properly validated',
                    'No unsafe direct outputs detected',
                    'Standard ladder logic patterns used'
                ],
                'recommendations': [
                    'Consider adding additional redundancy for critical systems',
                    'Regular security audits recommended'
                ]
            }
    except Exception as e:
        return {
            'success': False,
            'error': f'Analysis failed: {str(e)}'
        }

def demonstrate_git_workflow():
    """Demonstrate the complete Git + PLC analysis workflow."""
    print("🚀 PLC Code Checker - Git Integration Demo")
    print("=" * 50)
    
    # Create demo repository
    repo_dir, temp_dir = create_sample_plc_repository()
    
    try:
        # Initialize Git integration
        git_repo = GitRepository()
        
        print("\n🔗 Step 1: Connect to Repository")
        result = git_repo.connect_to_repository(repo_dir)
        if not result['success']:
            print(f"❌ Failed: {result['error']}")
            return
        print(f"✅ Connected to: {result['path']}")
        
        print("\n🌿 Step 2: List Available Branches")
        result = git_repo.get_branches()
        if not result['success']:
            print(f"❌ Failed: {result['error']}")
            return
        
        branches = result['branches']
        branch_names = [b['name'] for b in branches]
        print(f"✅ Available branches: {', '.join(branch_names)}")
        print(f"📍 Current branch: {result['current_branch']}")
        
        print("\n📄 Step 3: Browse Files in Master Branch")
        result = git_repo.get_files('master')
        if not result['success']:
            print(f"❌ Failed: {result['error']}")
            return
        
        master_files = result['files']
        for file_info in master_files:
            print(f"  📋 {file_info['path']} ({file_info['size']} bytes)")
        
        print("\n📄 Step 4: Browse Files in Development Branch")
        result = git_repo.get_files('development')
        if not result['success']:
            print(f"❌ Failed: {result['error']}")
            return
        
        dev_files = result['files']
        for file_info in dev_files:
            print(f"  📋 {file_info['path']} ({file_info['size']} bytes)")
        
        print("\n🔍 Step 5: Analyze Master Branch Files")
        for file_info in master_files:
            if file_info['path'].endswith('.l5x'):
                print(f"\n  🔬 Analyzing: {file_info['path']}")
                
                # Create temporary file
                temp_result = git_repo.create_temporary_file(file_info['path'], 'master')
                if not temp_result['success']:
                    print(f"    ❌ Failed to create temp file: {temp_result['error']}")
                    continue
                
                # Mock analysis
                analysis = analyze_file_with_mock_results(temp_result['temp_path'])
                print(f"    📊 Risk Level: {analysis.get('risk_level', 'UNKNOWN')}")
                print(f"    🔍 Findings: {len(analysis.get('findings', []))} issues")
                for finding in analysis.get('findings', [])[:2]:  # Show first 2
                    print(f"      • {finding}")
                
                # Cleanup temp file
                if 'temp_dir' in temp_result:
                    shutil.rmtree(temp_result['temp_dir'], ignore_errors=True)
        
        print("\n🔍 Step 6: Analyze Development Branch Files")
        for file_info in dev_files:
            if file_info['path'].endswith('.l5x'):
                print(f"\n  🔬 Analyzing: {file_info['path']}")
                
                # Create temporary file
                temp_result = git_repo.create_temporary_file(file_info['path'], 'development')
                if not temp_result['success']:
                    print(f"    ❌ Failed to create temp file: {temp_result['error']}")
                    continue
                
                # Mock analysis
                analysis = analyze_file_with_mock_results(temp_result['temp_path'])
                risk_level = analysis.get('risk_level', 'UNKNOWN')
                print(f"    📊 Risk Level: {risk_level}")
                print(f"    🔍 Findings: {len(analysis.get('findings', []))} issues")
                for finding in analysis.get('findings', [])[:2]:  # Show first 2
                    print(f"      • {finding}")
                
                # Demonstrate risk gating
                if risk_level in ['HIGH', 'CRITICAL']:
                    print(f"    🚫 RISK GATE: Cannot merge to main branch due to {risk_level} risk!")
                    print(f"    💡 Action Required: Address security issues before merge")
                else:
                    print(f"    ✅ RISK GATE: Safe to merge to main branch")
                
                # Cleanup temp file
                if 'temp_dir' in temp_result:
                    shutil.rmtree(temp_result['temp_dir'], ignore_errors=True)
        
        print("\n📊 Step 7: Repository Status Summary")
        result = git_repo.get_repository_status()
        if result['success']:
            status = result['status']
            print(f"  📍 Current Branch: {status.get('current_branch', 'unknown')}")
            print(f"  🏠 Repository Path: {status.get('path', 'unknown')}")
            print(f"  📝 Last Commit: {status.get('last_commit', {}).get('message', 'No commits')}")
            print(f"  👤 Last Author: {status.get('last_commit', {}).get('author', 'Unknown')}")
        
        print("\n🎉 Git Integration Demo Complete!")
        print("\n📋 Summary of Capabilities Demonstrated:")
        print("  ✅ Repository connection and branch management")
        print("  ✅ File browsing across different branches")
        print("  ✅ Temporary file creation for analysis")
        print("  ✅ Risk-based security analysis of PLC files")
        print("  ✅ Risk gating for merge protection")
        print("  ✅ Repository status and commit tracking")
        
    finally:
        # Cleanup
        shutil.rmtree(temp_dir, ignore_errors=True)
        print(f"\n🧹 Cleaned up temporary files")

if __name__ == '__main__':
    demonstrate_git_workflow()
