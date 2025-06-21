#!/usr/bin/env python3
"""
Test script to demonstrate user authentication and management functionality
"""

import sys
import os
import json
import subprocess

# Add the src/python directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src', 'python'))

from db import init_db, create_user, authenticate_user, list_users, delete_user, toggle_user_status, reset_user_password

def run_test():
    print("🔐 Testing PLC Code Checker Authentication System")
    print("=" * 50)
    
    # Initialize database
    print("\n1. Initializing database...")
    init_db()
    print("✅ Database initialized successfully")
    
    # Create test admin user
    print("\n2. Creating admin user...")
    admin_result = create_user("admin", "admin@firstwatch.com", "AdminPass123!", "admin")
    if admin_result['success']:
        print(f"✅ Admin user created: {admin_result['message']}")
    else:
        print(f"⚠️  Admin user: {admin_result['error']}")
    
    # Create test regular user
    print("\n3. Creating regular user...")
    user_result = create_user("analyst1", "analyst@firstwatch.com", "AnalystPass123!", "analyst")
    if user_result['success']:
        print(f"✅ Regular user created: {user_result.get('message', 'Success')}")
    else:
        print(f"⚠️  Regular user: {user_result['error']}")
    
    # Test authentication
    print("\n4. Testing authentication...")
    auth_result = authenticate_user("admin", "AdminPass123!")
    if auth_result['success']:
        print(f"✅ Authentication successful for admin")
    else:
        print(f"❌ Authentication failed: {auth_result['error']}")
    
    # Test wrong password
    print("\n5. Testing wrong password...")
    wrong_auth = authenticate_user("admin", "wrongpassword")
    if not wrong_auth['success']:
        print(f"✅ Correctly rejected wrong password: {wrong_auth['error']}")
    else:
        print(f"❌ Should have rejected wrong password")
    
    # List users
    print("\n6. Listing all users...")
    users_result = list_users()
    if users_result['success']:
        print(f"✅ Found {len(users_result['users'])} users:")
        for user in users_result['users']:
            status = "Active" if user['is_active'] else "Inactive"
            print(f"   - {user['username']} ({user['email']}) - {user['role']} - {status}")
    else:
        print(f"❌ Failed to list users: {users_result['error']}")
    
    print("\n🎉 Authentication system test completed!")
    print("\nNext steps:")
    print("- Start the application with: npm start")
    print("- Login with admin/AdminPass123! or analyst1/AnalystPass123!")
    print("- Admin can access User Management page")
    print("- Use logout button in sidebar to sign out")

if __name__ == "__main__":
    run_test()
