#!/usr/bin/env python3
"""
Demo script showing FirstWatch authentication system capabilities
"""

import sys
import os
import json
import time

# Add the src/python directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src', 'python'))

from db import create_user, authenticate_user, create_session, validate_session, logout_session, cleanup_expired_sessions

def print_banner():
    print("""
╔══════════════════════════════════════════════════════════════╗
║                  FirstWatch Authentication                   ║
║                     System Demo                             ║
╚══════════════════════════════════════════════════════════════╝
    """)

def demo_user_management():
    print("🔐 USER MANAGEMENT DEMO")
    print("=" * 50)
    
    # Create different types of users
    users = [
        ('alice_admin', 'alice@company.com', 'secure_admin_pass', 'admin'),
        ('bob_analyst', 'bob@company.com', 'analyst_password', 'analyst'),
        ('charlie_user', 'charlie@company.com', 'user_password', 'user')
    ]
    
    print("Creating demo users...")
    for username, email, password, role in users:
        result = create_user(username, email, password, role)
        if result['success']:
            print(f"✅ Created {role}: {username} ({email})")
        else:
            if 'already exists' in result['error']:
                print(f"ℹ️  {role} {username} already exists")
            else:
                print(f"❌ Failed to create {username}: {result['error']}")
    
    return users

def demo_authentication(users):
    print("\n🔑 AUTHENTICATION DEMO")
    print("=" * 50)
    
    sessions = []
    
    for username, email, password, role in users:
        print(f"\nAuthenticating {username} ({role})...")
        
        # Authenticate
        auth_result = authenticate_user(username, password)
        if auth_result['success']:
            print(f"  ✅ Authentication successful")
            
            # Create session
            session_result = create_session(auth_result['user']['id'])
            if session_result['success']:
                print(f"  ✅ Session created")
                sessions.append((username, session_result['session']['token']))
            else:
                print(f"  ❌ Session creation failed: {session_result['error']}")
        else:
            print(f"  ❌ Authentication failed: {auth_result['error']}")
    
    return sessions

def demo_session_validation(sessions):
    print("\n🎫 SESSION VALIDATION DEMO")
    print("=" * 50)
    
    for username, token in sessions:
        print(f"\nValidating session for {username}...")
        result = validate_session(token)
        if result['success']:
            user = result['user']
            print(f"  ✅ Valid session for {user['username']} ({user['role']})")
        else:
            print(f"  ❌ Invalid session: {result['error']}")

def demo_security_features():
    print("\n🛡️  SECURITY FEATURES DEMO")
    print("=" * 50)
    
    print("\n1. Testing wrong password protection...")
    wrong_auth = authenticate_user('alice_admin', 'wrong_password')
    if not wrong_auth['success']:
        print(f"  ✅ Correctly rejected wrong password: {wrong_auth['error']}")
    
    print("\n2. Testing non-existent user...")
    fake_auth = authenticate_user('fake_user', 'any_password')
    if not fake_auth['success']:
        print(f"  ✅ Correctly rejected non-existent user: {fake_auth['error']}")
    
    print("\n3. Testing invalid session token...")
    invalid_session = validate_session('invalid_token_12345')
    if not invalid_session['success']:
        print(f"  ✅ Correctly rejected invalid token: {invalid_session['error']}")

def demo_session_management(sessions):
    print("\n📝 SESSION MANAGEMENT DEMO")
    print("=" * 50)
    
    if sessions:
        username, token = sessions[0]
        print(f"\nTesting session logout for {username}...")
        
        # Logout session
        logout_result = logout_session(token)
        if logout_result['success']:
            print(f"  ✅ Session logged out successfully")
            
            # Try to validate the logged out session
            validate_result = validate_session(token)
            if not validate_result['success']:
                print(f"  ✅ Logged out session correctly invalidated: {validate_result['error']}")
            else:
                print(f"  ❌ Security issue: logged out session still valid!")
        else:
            print(f"  ❌ Logout failed: {logout_result.get('error', 'Unknown error')}")
    
    print(f"\nCleaning up expired sessions...")
    cleanup_expired_sessions()
    print(f"  ✅ Expired sessions cleaned up")

def demo_role_based_access():
    print("\n👥 ROLE-BASED ACCESS DEMO")
    print("=" * 50)
    
    print("\nDemonstrating role hierarchy:")
    print("  • Admin: Full system access")
    print("  • Analyst: Analysis and reporting access")
    print("  • User: Basic analysis access")
    
    print("\nIn the UI, roles are enforced through:")
    print("  • ProtectedRoute components")
    print("  • Role-based navigation")
    print("  • Feature access controls")

def main():
    print_banner()
    
    try:
        # Run demos
        users = demo_user_management()
        sessions = demo_authentication(users)
        demo_session_validation(sessions)
        demo_security_features()
        demo_session_management(sessions)
        demo_role_based_access()
        
        print("\n" + "=" * 60)
        print("🎉 DEMO COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        print("""
Next steps:
1. Start the application: npm start
2. Open the React dev server: npm run dev
3. Navigate to http://localhost:3000
4. Try logging in with the demo users:
   • alice_admin / secure_admin_pass
   • bob_analyst / analyst_password  
   • charlie_user / user_password
        """)
        
    except Exception as e:
        print(f"\n❌ Demo failed with error: {e}")
        return False
    
    return True

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
