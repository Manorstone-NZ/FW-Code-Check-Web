#!/usr/bin/env python3
"""
First Watch PLC Code Checker - System Test Script
This script tests the core functionality of the backend and can be used 
to verify that all systems are working after deployment.
"""

import sys
import os
import json
import requests
import sqlite3
from datetime import datetime

# Add the python module path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src', 'python'))

try:
    from db import (
        init_db, list_users, authenticate_user, list_analyses, 
        list_baselines, create_user, save_baseline
    )
    from analyzer import load_openai_key
except ImportError as e:
    print(f"❌ Import Error: {e}")
    sys.exit(1)

class SystemTester:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        
    def test(self, name, func):
        try:
            result = func()
            if result:
                print(f"✅ {name}")
                self.passed += 1
            else:
                print(f"❌ {name}")
                self.failed += 1
        except Exception as e:
            print(f"❌ {name}: {e}")
            self.failed += 1
    
    def test_database_connection(self):
        """Test database connectivity"""
        try:
            conn = sqlite3.connect('firstwatch.db')
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = cursor.fetchall()
            conn.close()
            return len(tables) > 0
        except Exception:
            return False
    
    def test_user_authentication(self):
        """Test user authentication system"""
        users = list_users()
        if not users.get('success'):
            return False
        
        # Test authentication with known admin user
        auth_result = authenticate_user('admin', 'admin123')
        return auth_result.get('success', False)
    
    def test_analysis_listing(self):
        """Test analysis listing functionality"""
        try:
            analyses = list_analyses()
            return isinstance(analyses, list)
        except Exception:
            return False
    
    def test_baseline_listing(self):
        """Test baseline listing functionality"""
        try:
            baselines = list_baselines()
            return isinstance(baselines, list)
        except Exception:
            return False
    
    def test_openai_key_loading(self):
        """Test OpenAI key loading"""
        try:
            load_openai_key()
            return bool(os.environ.get('OPENAI_API_KEY'))
        except Exception:
            return False
    
    def test_frontend_server(self):
        """Test if frontend dev server is running"""
        try:
            response = requests.get('http://localhost:3000', timeout=5)
            return response.status_code == 200
        except Exception:
            return False
    
    def run_all_tests(self):
        """Run all system tests"""
        print("🔍 First Watch PLC Code Checker - System Test")
        print(f"📅 Test Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 50)
        
        self.test("Database Connection", self.test_database_connection)
        self.test("User Authentication", self.test_user_authentication)
        self.test("Analysis Listing", self.test_analysis_listing)
        self.test("Baseline Listing", self.test_baseline_listing)
        self.test("OpenAI Key Loading", self.test_openai_key_loading)
        self.test("Frontend Server", self.test_frontend_server)
        
        print("=" * 50)
        print(f"📊 Test Results: {self.passed} passed, {self.failed} failed")
        
        if self.failed == 0:
            print("🎉 All tests passed! System is ready.")
            return True
        else:
            print("⚠️  Some tests failed. Please check the issues above.")
            return False

if __name__ == "__main__":
    tester = SystemTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)
