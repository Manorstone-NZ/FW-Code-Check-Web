#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'src/python'))

from db import get_connection
import json

def check_database():
    with get_connection() as conn:
        c = conn.cursor()
        
        # Check analyses table structure
        c.execute("PRAGMA table_info(analyses)")
        columns = c.fetchall()
        print("Analyses table columns:")
        for col in columns:
            print(f"  {col[1]} ({col[2]})")
        
        print("\n" + "="*50 + "\n")
        
        # Check recent analyses
        c.execute("SELECT id, fileName, provider, model, substr(analysis_json, 1, 100) FROM analyses ORDER BY id DESC LIMIT 5")
        rows = c.fetchall()
        print("Recent analyses:")
        for row in rows:
            print(f"ID: {row[0]}")
            print(f"  File: {row[1]}")
            print(f"  Provider: {row[2]}")
            print(f"  Model: {row[3]}")
            print(f"  Analysis JSON (first 100 chars): {row[4]}...")
            print()

if __name__ == "__main__":
    check_database()
