#!/usr/bin/env python3
"""
Test script to validate that the database clear function preserves user data.
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'src/python'))

from db import clear_all_data, list_users, list_analyses, list_baselines

def test_clear_function():
    print("=== Testing Database Clear Function ===")
    
    # Check users before clear
    users_before = list_users()
    print(f"Users before clear: {len(users_before.get('users', []))}")
    
    # Check if there are any analyses/baselines (there shouldn't be any yet)
    analyses_before = list_analyses()
    baselines_before = list_baselines()
    print(f"Analyses before clear: {len(analyses_before)}")
    print(f"Baselines before clear: {len(baselines_before)}")
    
    # Clear the database
    print("Clearing database...")
    clear_all_data()
    
    # Check users after clear
    users_after = list_users()
    print(f"Users after clear: {len(users_after.get('users', []))}")
    
    # Check analyses/baselines after clear
    analyses_after = list_analyses()
    baselines_after = list_baselines()
    print(f"Analyses after clear: {len(analyses_after)}")
    print(f"Baselines after clear: {len(baselines_after)}")
    
    # Validate results
    if len(users_before.get('users', [])) == len(users_after.get('users', [])):
        print("✅ SUCCESS: User accounts preserved")
    else:
        print("❌ FAILURE: User accounts were deleted")
    
    print("=== Test Complete ===")

if __name__ == "__main__":
    test_clear_function()
