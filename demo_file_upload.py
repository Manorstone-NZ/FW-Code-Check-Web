#!/usr/bin/env python3
"""
Demo: Upload and analyze PLC files
Shows how to process PLC files like ACM_Services_V1.l5x
"""

import sys
import os
import json
import tempfile
import shutil

# Add src path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src', 'python'))

# Import not needed for demo

def demo_plc_file_analysis():
    """Demonstrate PLC file analysis with the uploaded file"""
    print("🎯 PLC File Analysis Demo")
    print("=" * 50)
    
    # File paths to test
    test_files = [
        "/Users/damian/PLC Code Check/PLC Projects/PLC-Programmes/ACM_Services_V1.l5x",
        "./ACM_Services_V1.l5x",  # Local copy
        "./SamplePLC.L5X"  # Sample file
    ]
    
    # Find available test file
    test_file = None
    for file_path in test_files:
        if os.path.exists(file_path):
            test_file = file_path
            break
    
    if not test_file:
        print("❌ No PLC test files found!")
        print("Available files should be:")
        for f in test_files:
            print(f"  - {f}")
        return False
    
    print(f"📁 Found test file: {test_file}")
    
    # Get file info
    file_size = os.path.getsize(test_file)
    print(f"📊 File size: {file_size:,} bytes ({file_size/1024/1024:.2f} MB)")
    
    # Test different analysis methods
    providers = [
        ("openai", "gpt-4"),
        ("openai", "gpt-3.5-turbo")
    ]
    
    for provider, model in providers:
        print(f"\n🔍 Testing {provider} {model}...")
        
        try:
            # This would be called through the Electron app normally
            print(f"Command: python3 src/python/analyzer.py '{test_file}' {provider} {model}")
            
            # For demo, show what the analysis structure looks like
            print("✅ Analysis structure includes:")
            print("  - Security vulnerabilities and risk levels")
            print("  - Code structure observations")
            print("  - Instruction-level analysis")
            print("  - Recommendations and next steps")
            
        except Exception as e:
            print(f"❌ Error: {e}")
    
    print(f"\n🎉 Demo complete!")
    print("\n📋 How to use in the app:")
    print("1. Start the app: npm start")
    print("2. Go to File Upload page")
    print("3. Choose upload method:")
    print("   • Local Files: Upload .l5x files directly")
    print("   • Git Repository: Analyze files from Git branches")
    print("4. Select LLM provider and model")
    print("5. Analyze and review security findings")
    print("6. For Git workflow: Submit approved files to main branch")
    
    return True

def demo_git_workflow():
    """Demonstrate Git workflow for PLC files"""
    print("\n🔄 Git Workflow Demo")
    print("=" * 30)
    
    print("Git Integration supports:")
    print("✅ Clone repositories")
    print("✅ Connect to local repositories") 
    print("✅ Browse branches and files")
    print("✅ Analyze files from any branch")
    print("✅ Risk-gated submission to main branch")
    
    print("\nSupported PLC file types:")
    extensions = ['.l5x', '.l5k', '.acd', '.txt', '.json', '.xml']
    for ext in extensions:
        print(f"  • {ext}")
    
    print("\nWorkflow steps:")
    print("1. Connect/clone Git repository")
    print("2. Select development branch") 
    print("3. Browse and select PLC files")
    print("4. Analyze for security risks")
    print("5. Review risk assessment")
    print("6. Submit to main (if low risk)")

if __name__ == "__main__":
    print("🚀 First Watch PLC Code Checker - File Upload Demo")
    print("="*60)
    
    # Demo file analysis
    demo_plc_file_analysis()
    
    # Demo Git workflow
    demo_git_workflow()
    
    print("\n✨ Ready to process your PLC files!")
