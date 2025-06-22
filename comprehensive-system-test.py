#!/usr/bin/env python3
"""
Comprehensive System Test Suite for First Watch PLC Code Checker
Tests all backend functionality, CLI commands, and data integrity
"""

import os
import sys
import json
import sqlite3
import subprocess
import tempfile
import time
from datetime import datetime

# Add the src/python directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src', 'python'))

try:
    from db import init_db, get_connection, list_users, list_baselines, list_analyses
    print("✅ Successfully imported database modules")
except ImportError as e:
    print(f"❌ Failed to import database modules: {e}")
    sys.exit(1)

class SystemTester:
    def __init__(self):
        self.test_results = []
        self.passed = 0
        self.failed = 0
        self.project_root = os.path.dirname(__file__)
        self.analyzer_path = os.path.join(self.project_root, 'src', 'python', 'analyzer.py')
        
    def log_test(self, test_name, status, message=""):
        """Log test result"""
        self.test_results.append({
            'test': test_name,
            'status': status,
            'message': message,
            'timestamp': datetime.now().isoformat()
        })
        
        if status == "PASS":
            self.passed += 1
            print(f"✅ {test_name}: PASS {message}")
        else:
            self.failed += 1
            print(f"❌ {test_name}: FAIL {message}")
    
    def run_cli_command(self, args):
        """Run analyzer CLI command and return output"""
        try:
            cmd = ['python3', self.analyzer_path] + args
            result = subprocess.run(cmd, capture_output=True, text=True, cwd=self.project_root)
            return result.returncode, result.stdout, result.stderr
        except Exception as e:
            return -1, "", str(e)
    
    def test_database_initialization(self):
        """Test database initialization"""
        try:
            init_db()
            self.log_test("Database Initialization", "PASS", "Database initialized successfully")
        except Exception as e:
            self.log_test("Database Initialization", "FAIL", str(e))
    
    def test_database_connection(self):
        """Test database connection"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = cursor.fetchall()
            conn.close()
            
            required_tables = ['users', 'analyses', 'baselines', 'ot_threat_intel']
            optional_tables = ['sessions', 'comparisons']
            found_tables = [table[0] for table in tables]
            
            missing_required = [t for t in required_tables if t not in found_tables]
            if not missing_required:
                missing_optional = [t for t in optional_tables if t not in found_tables]
                if missing_optional:
                    self.log_test("Database Schema", "PASS", f"All required tables present. Optional tables missing: {missing_optional}")
                else:
                    self.log_test("Database Schema", "PASS", f"All tables present: {found_tables}")
            else:
                self.log_test("Database Schema", "FAIL", f"Missing required tables: {missing_required}")
                
        except Exception as e:
            self.log_test("Database Connection", "FAIL", str(e))
    
    def test_user_management(self):
        """Test user management functionality"""
        try:
            users_result = list_users()
            if users_result.get('success') and len(users_result.get('users', [])) > 0:
                self.log_test("User Management - List Users", "PASS", f"Found {len(users_result['users'])} users")
                
                # Test CLI list users
                code, stdout, stderr = self.run_cli_command(['--list-users'])
                if code == 0:
                    self.log_test("CLI List Users", "PASS", "CLI command executed successfully")
                else:
                    self.log_test("CLI List Users", "FAIL", f"Exit code: {code}, Error: {stderr}")
            else:
                self.log_test("User Management - List Users", "FAIL", "No users found in database")
                
        except Exception as e:
            self.log_test("User Management", "FAIL", str(e))
    
    def test_baseline_management(self):
        """Test baseline management functionality"""
        try:
            baselines = list_baselines()
            if isinstance(baselines, list):
                self.log_test("Baseline Management - List Baselines", "PASS", f"Found {len(baselines)} baselines")
            else:
                self.log_test("Baseline Management - List Baselines", "FAIL", f"Function returned unexpected type: {type(baselines)}")
            
            # Test CLI list baselines
            code, stdout, stderr = self.run_cli_command(['--list-baselines'])
            if code == 0:
                try:
                    baseline_data = json.loads(stdout)
                    if isinstance(baseline_data, list):
                        self.log_test("CLI List Baselines", "PASS", f"CLI returned {len(baseline_data)} baselines")
                    else:
                        self.log_test("CLI List Baselines", "FAIL", "CLI did not return a list")
                except json.JSONDecodeError:
                    self.log_test("CLI List Baselines", "FAIL", "CLI output is not valid JSON")
            else:
                self.log_test("CLI List Baselines", "FAIL", f"Exit code: {code}, Error: {stderr}")
                
        except Exception as e:
            self.log_test("Baseline Management", "FAIL", str(e))
    
    def test_analysis_management(self):
        """Test analysis management functionality"""
        try:
            analyses = list_analyses()
            if isinstance(analyses, list):
                self.log_test("Analysis Management - List Analyses", "PASS", f"Found {len(analyses)} analyses")
            else:
                self.log_test("Analysis Management - List Analyses", "FAIL", f"Function returned unexpected type: {type(analyses)}")
            
            # Test CLI list analyses
            code, stdout, stderr = self.run_cli_command(['--list-analyses'])
            if code == 0:
                try:
                    analysis_data = json.loads(stdout)
                    if isinstance(analysis_data, list):
                        self.log_test("CLI List Analyses", "PASS", f"CLI returned {len(analysis_data)} analyses")
                    else:
                        self.log_test("CLI List Analyses", "FAIL", "CLI did not return a list")
                except json.JSONDecodeError:
                    self.log_test("CLI List Analyses", "FAIL", "CLI output is not valid JSON")
            else:
                self.log_test("CLI List Analyses", "FAIL", f"Exit code: {code}, Error: {stderr}")
                
        except Exception as e:
            self.log_test("Analysis Management", "FAIL", str(e))
    
    def test_file_analysis_functionality(self):
        """Test file analysis functionality"""
        # Create a simple test L5X file
        test_l5x_content = '''<?xml version="1.0" encoding="UTF-8"?>
<RSLogix5000Content SchemaRevision="1.0">
    <Controller Use="Target" Name="TestController">
        <Programs>
            <Program Name="MainProgram">
                <Routines>
                    <Routine Name="MainRoutine" Type="RLL">
                        <RLLContent>
                            <Rung Number="0" Type="N">
                                <Text>MOV(1,Tag1);</Text>
                            </Rung>
                        </RLLContent>
                    </Routine>
                </Routines>
            </Program>
        </Programs>
    </Controller>
</RSLogix5000Content>'''
        
        try:
            with tempfile.NamedTemporaryFile(mode='w', suffix='.L5X', delete=False) as f:
                f.write(test_l5x_content)
                test_file_path = f.name
            
            # Test file analysis
            code, stdout, stderr = self.run_cli_command([test_file_path, '--provider', 'openai', '--model', 'gpt-3.5-turbo'])
            
            if code == 0:
                try:
                    result = json.loads(stdout)
                    if 'analysis' in result:
                        self.log_test("File Analysis", "PASS", "File analysis completed successfully")
                    else:
                        self.log_test("File Analysis", "FAIL", "Analysis result missing 'analysis' field")
                except json.JSONDecodeError:
                    self.log_test("File Analysis", "FAIL", "Analysis output is not valid JSON")
            else:
                self.log_test("File Analysis", "FAIL", f"Exit code: {code}, Error: {stderr}")
            
            # Clean up
            os.unlink(test_file_path)
            
        except Exception as e:
            self.log_test("File Analysis", "FAIL", str(e))
    
    def test_openai_configuration(self):
        """Test OpenAI API configuration"""
        try:
            openai_key_path = os.path.join(self.project_root, 'openai.key')
            if os.path.exists(openai_key_path):
                with open(openai_key_path, 'r') as f:
                    key_content = f.read().strip()
                    if key_content and len(key_content) > 10:
                        self.log_test("OpenAI Configuration", "PASS", "OpenAI key file exists and has content")
                    else:
                        self.log_test("OpenAI Configuration", "FAIL", "OpenAI key file exists but appears empty")
            else:
                self.log_test("OpenAI Configuration", "FAIL", "OpenAI key file not found")
        except Exception as e:
            self.log_test("OpenAI Configuration", "FAIL", str(e))
    
    def test_logging_functionality(self):
        """Test logging functionality"""
        try:
            llm_log_path = os.path.join(self.project_root, 'llm-interactions.log.json')
            if os.path.exists(llm_log_path):
                with open(llm_log_path, 'r') as f:
                    logs = json.load(f)
                    if isinstance(logs, list):
                        self.log_test("LLM Logging", "PASS", f"LLM log file contains {len(logs)} entries")
                    else:
                        self.log_test("LLM Logging", "FAIL", "LLM log file is not a valid list")
            else:
                self.log_test("LLM Logging", "PASS", "LLM log file doesn't exist yet (this is OK)")
        except Exception as e:
            self.log_test("LLM Logging", "FAIL", str(e))
    
    def test_ot_threat_intel(self):
        """Test OT Threat Intelligence functionality"""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM ot_threat_intel")
            count = cursor.fetchone()[0]
            conn.close()
            
            self.log_test("OT Threat Intel", "PASS", f"OT threat intel table has {count} entries")
        except Exception as e:
            self.log_test("OT Threat Intel", "FAIL", str(e))
    
    def test_file_structure(self):
        """Test critical file structure"""
        critical_files = [
            'src/main/electron.js',
            'src/main/preload.js',
            'src/python/analyzer.py',
            'src/python/db.py',
            'src/python/config.py',
            'src/renderer/App.tsx',
            'package.json',
            'webpack.config.js'
        ]
        
        for file_path in critical_files:
            full_path = os.path.join(self.project_root, file_path)
            if os.path.exists(full_path):
                self.log_test(f"File Structure - {file_path}", "PASS", "File exists")
            else:
                self.log_test(f"File Structure - {file_path}", "FAIL", "File missing")
    
    def run_all_tests(self):
        """Run all tests"""
        print("=" * 80)
        print("FIRST WATCH PLC CODE CHECKER - COMPREHENSIVE SYSTEM TEST")
        print("=" * 80)
        print(f"Starting tests at: {datetime.now()}")
        print()
        
        # Core functionality tests
        self.test_database_initialization()
        self.test_database_connection()
        self.test_file_structure()
        self.test_openai_configuration()
        
        # Data management tests
        self.test_user_management()
        self.test_baseline_management()
        self.test_analysis_management()
        self.test_ot_threat_intel()
        
        # Feature tests
        self.test_logging_functionality()
        # self.test_file_analysis_functionality()  # Commented out as it requires API calls
        
        # Print summary
        print()
        print("=" * 80)
        print("TEST SUMMARY")
        print("=" * 80)
        print(f"Total Tests: {self.passed + self.failed}")
        print(f"Passed: {self.passed}")
        print(f"Failed: {self.failed}")
        print(f"Success Rate: {(self.passed / (self.passed + self.failed)) * 100:.1f}%")
        
        # Save detailed results
        results_file = os.path.join(self.project_root, 'test-results.json')
        with open(results_file, 'w') as f:
            json.dump({
                'summary': {
                    'total': self.passed + self.failed,
                    'passed': self.passed,
                    'failed': self.failed,
                    'success_rate': (self.passed / (self.passed + self.failed)) * 100 if (self.passed + self.failed) > 0 else 0
                },
                'tests': self.test_results,
                'timestamp': datetime.now().isoformat()
            }, f, indent=2)
        
        print(f"\nDetailed results saved to: {results_file}")
        
        return self.failed == 0

if __name__ == "__main__":
    tester = SystemTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)
