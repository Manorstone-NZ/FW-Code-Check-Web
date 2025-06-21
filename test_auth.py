#!/usr/bin/env python3
"""
Test script for user authentication system
"""

import sys
import os
import json

# Add the src/python directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src', 'python'))

from db import create_user, authenticate_user, create_session, validate_session, logout_session

def test_authentication():
    print("=== FirstWatch Authentication System Test ===\n")
    
    # Test 1: Create a test user
    print("1. Creating test user...")
    result = create_user('testuser', 'test@example.com', 'testpass123', 'user')
    if result['success']:
        print(f"✅ User created successfully: {result['user']['username']}")
        user_id = result['user']['id']
    else:
        print(f"❌ User creation failed: {result['error']}")
        return False
    
    # Test 2: Authenticate the user
    print("\n2. Authenticating user...")
    auth_result = authenticate_user('testuser', 'testpass123')
    if auth_result['success']:
        print(f"✅ Authentication successful for user: {auth_result['user']['username']}")
    else:
        print(f"❌ Authentication failed: {auth_result['error']}")
        return False
    
    # Test 3: Create a session
    print("\n3. Creating session...")
    session_result = create_session(user_id)
    if session_result['success']:
        print(f"✅ Session created successfully")
        session_token = session_result['session']['token']
        print(f"   Session token: {session_token[:20]}...")
    else:
        print(f"❌ Session creation failed: {session_result['error']}")
        return False
    
    # Test 4: Validate the session
    print("\n4. Validating session...")
    validate_result = validate_session(session_token)
    if validate_result['success']:
        print(f"✅ Session validation successful for user: {validate_result['user']['username']}")
    else:
        print(f"❌ Session validation failed: {validate_result['error']}")
        return False
    
    # Test 5: Test wrong password
    print("\n5. Testing wrong password...")
    wrong_auth = authenticate_user('testuser', 'wrongpassword')
    if not wrong_auth['success']:
        print(f"✅ Correctly rejected wrong password: {wrong_auth['error']}")
    else:
        print(f"❌ Security issue: wrong password was accepted!")
        return False
    
    # Test 6: Logout session
    print("\n6. Logging out session...")
    logout_result = logout_session(session_token)
    if logout_result['success']:
        print("✅ Session logged out successfully")
    else:
        print(f"❌ Logout failed: {logout_result.get('error', 'Unknown error')}")
        return False
    
    # Test 7: Validate expired session
    print("\n7. Validating logged out session...")
    expired_validate = validate_session(session_token)
    if not expired_validate['success']:
        print(f"✅ Correctly rejected expired session: {expired_validate['error']}")
    else:
        print(f"❌ Security issue: expired session was accepted!")
        return False
    
    print("\n🎉 All authentication tests passed!")
    return True

if __name__ == '__main__':
    success = test_authentication()
    sys.exit(0 if success else 1)
