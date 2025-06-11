import os
import sqlite3
import json
from datetime import datetime
import sys

DB_PATH = os.path.join(os.path.dirname(__file__), '../../firstwatch.db')

def get_connection():
    return sqlite3.connect(DB_PATH)

def init_db():
    with get_connection() as conn:
        c = conn.cursor()
        c.execute('''
            CREATE TABLE IF NOT EXISTS analyses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fileName TEXT,
                date TEXT,
                status TEXT,
                analysis_json TEXT,
                filePath TEXT
            )
        ''')
        c.execute('''
            CREATE TABLE IF NOT EXISTS baselines (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fileName TEXT,
                originalName TEXT,
                date TEXT,
                filePath TEXT
            )
        ''')
        c.execute('''
            CREATE TABLE IF NOT EXISTS comparison_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                analysisId INTEGER,
                baselineId INTEGER,
                timestamp TEXT,
                llm_prompt TEXT,
                llm_result TEXT,
                FOREIGN KEY(analysisId) REFERENCES analyses(id),
                FOREIGN KEY(baselineId) REFERENCES baselines(id)
            )
        ''')
        conn.commit()

def save_analysis(file_name, status, analysis_json, file_path=None):
    with get_connection() as conn:
        c = conn.cursor()
        c.execute('''
            INSERT INTO analyses (fileName, date, status, analysis_json, filePath)
            VALUES (?, ?, ?, ?, ?)
        ''', (file_name, datetime.now().isoformat(), status, json.dumps(analysis_json), file_path))
        conn.commit()
        return c.lastrowid

def get_analysis(analysis_id):
    with get_connection() as conn:
        c = conn.cursor()
        c.execute('SELECT * FROM analyses WHERE id = ?', (analysis_id,))
        row = c.fetchone()
        if row:
            analysis_json = json.loads(row[4])
            from analyzer import ensure_analysis_fields
            analysis_json = ensure_analysis_fields(analysis_json)
            return {
                'id': row[0],
                'fileName': row[1],
                'date': row[2],
                'status': row[3],
                'analysis_json': analysis_json,
                'filePath': row[5] if len(row) > 5 else None
            }
        return None

def list_analyses():
    with get_connection() as conn:
        c = conn.cursor()
        c.execute('SELECT id, fileName, date, status, filePath FROM analyses ORDER BY date DESC')
        return [
            {'id': row[0], 'fileName': row[1], 'date': row[2], 'status': row[3], 'filePath': row[4]}
            for row in c.fetchall()
        ]

def save_baseline(file_name, original_name=None, file_path=None):
    with get_connection() as conn:
        c = conn.cursor()
        c.execute('''
            INSERT INTO baselines (fileName, originalName, date, filePath)
            VALUES (?, ?, ?, ?)
        ''', (file_name, original_name or file_name, datetime.now().isoformat(), file_path))
        conn.commit()
        return c.lastrowid

def get_baseline(baseline_id):
    with get_connection() as conn:
        c = conn.cursor()
        c.execute('SELECT * FROM baselines WHERE id = ?', (baseline_id,))
        row = c.fetchone()
        if row:
            return {
                'id': row[0],
                'fileName': row[1],
                'originalName': row[2],
                'date': row[3],
                'filePath': row[4] if len(row) > 4 else None
            }
        return None

def list_baselines():
    with get_connection() as conn:
        c = conn.cursor()
        c.execute('SELECT id, fileName, originalName, date, filePath FROM baselines ORDER BY date DESC')
        return [
            {'id': row[0], 'fileName': row[1], 'originalName': row[2], 'date': row[3], 'filePath': row[4]}
            for row in c.fetchall()
        ]

def delete_baseline(baseline_id):
    with get_connection() as conn:
        c = conn.cursor()
        c.execute('DELETE FROM baselines WHERE id = ?', (baseline_id,))
        conn.commit()

def delete_analysis(analysis_id):
    with get_connection() as conn:
        c = conn.cursor()
        c.execute('DELETE FROM analyses WHERE id = ?', (analysis_id,))
        conn.commit()
        return {'ok': True, 'deleted_id': analysis_id}

def save_comparison_history(analysis_id, baseline_id, llm_prompt, llm_result):
    with get_connection() as conn:
        c = conn.cursor()
        c.execute('''
            INSERT INTO comparison_history (analysisId, baselineId, timestamp, llm_prompt, llm_result)
            VALUES (?, ?, ?, ?, ?)
        ''', (analysis_id, baseline_id, datetime.now().isoformat(), llm_prompt, llm_result))
        conn.commit()
        return c.lastrowid

def list_comparison_history(analysis_id=None, baseline_id=None):
    with get_connection() as conn:
        c = conn.cursor()
        query = 'SELECT id, analysisId, baselineId, timestamp, llm_prompt, llm_result FROM comparison_history'
        params = []
        if analysis_id and baseline_id:
            query += ' WHERE analysisId = ? AND baselineId = ?'
            params = [analysis_id, baseline_id]
        elif analysis_id:
            query += ' WHERE analysisId = ?'
            params = [analysis_id]
        elif baseline_id:
            query += ' WHERE baselineId = ?'
            params = [baseline_id]
        query += ' ORDER BY timestamp DESC'
        return [
            {
                'id': row[0],
                'analysisId': row[1],
                'baselineId': row[2],
                'timestamp': row[3],
                'llm_prompt': row[4],
                'llm_result': row[5]
            }
            for row in c.execute(query, params)
        ]

def main():
    if len(sys.argv) > 1 and sys.argv[1] == '--list-analyses':
        from db import list_analyses
        print(json.dumps(list_analyses()))
        return
    if len(sys.argv) > 2 and sys.argv[1] == '--get-analysis':
        from db import get_analysis
        print(json.dumps(get_analysis(int(sys.argv[2]))))
        return
    if len(sys.argv) > 1 and sys.argv[1] == '--list-baselines':
        from db import list_baselines
        print(json.dumps(list_baselines()))
        return
    if len(sys.argv) > 2 and sys.argv[1] == '--get-baseline':
        from db import get_baseline
        print(json.dumps(get_baseline(int(sys.argv[2]))))
        return
    if len(sys.argv) > 2 and sys.argv[1] == '--save-baseline':
        from db import save_baseline
        baseline_id = save_baseline(sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else None)
        print(json.dumps({'ok': True, 'baseline_id': baseline_id}))
        return
    if len(sys.argv) > 2 and sys.argv[1] == '--delete-baseline':
        from db import delete_baseline
        delete_baseline(int(sys.argv[2]))
        print(json.dumps({'ok': True, 'deleted': sys.argv[2]}))
        return
    if len(sys.argv) > 2 and sys.argv[1] == '--delete-analysis':
        print(json.dumps(delete_analysis(int(sys.argv[2]))))
        return
    if len(sys.argv) > 1 and sys.argv[1] == '--list-comparison-history':
        from db import list_comparison_history
        def parse_id(arg):
            return int(arg) if arg and arg != '' else None
        analysis_id = parse_id(sys.argv[2]) if len(sys.argv) > 2 else None
        baseline_id = parse_id(sys.argv[3]) if len(sys.argv) > 3 else None
        print(json.dumps(list_comparison_history(analysis_id, baseline_id)))
        return
    init_db()
    print(json.dumps({'ok': True, 'message': f'Database initialized at {DB_PATH}'}))

if __name__ == "__main__":
    main()
