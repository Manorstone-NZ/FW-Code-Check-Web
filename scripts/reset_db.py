#!/usr/bin/env python3
"""
Reset and re-initialize the First Watch PLC Code Checker database with all required tables and fields.
This script deletes the existing database file and recreates all tables using the latest schema.
"""
import os
import sys
import sqlite3
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), '../firstwatch.db')

SCHEMA = '''
DROP TABLE IF EXISTS analyses;
DROP TABLE IF EXISTS baselines;
DROP TABLE IF EXISTS comparison_history;

CREATE TABLE analyses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fileName TEXT,
    date TEXT,
    status TEXT,
    filePath TEXT,
    analysis_json TEXT
);

CREATE TABLE baselines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fileName TEXT,
    originalName TEXT,
    date TEXT,
    filePath TEXT
);

CREATE TABLE comparison_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    analysisId INTEGER,
    baselineId INTEGER,
    timestamp TEXT,
    llm_result TEXT
);
'''

def reset_db():
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.executescript(SCHEMA)
    conn.commit()
    conn.close()
    print(f"Database reset and initialized at {DB_PATH}")

if __name__ == "__main__":
    reset_db()
