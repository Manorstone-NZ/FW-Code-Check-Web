import os
import sqlite3
import json
from datetime import datetime
import sys
import hashlib

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
                filePath TEXT,
                analysis_hash TEXT
            )
        ''')
        # Add analysis_json to baselines if not present
        c.execute('''
            CREATE TABLE IF NOT EXISTS baselines (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fileName TEXT,
                originalName TEXT,
                date TEXT,
                filePath TEXT,
                analysis_json TEXT,
                analysis_hash TEXT
            )
        ''')
        # Migration: add analysis_json if missing
        try:
            c.execute('ALTER TABLE baselines ADD COLUMN analysis_json TEXT')
        except Exception:
            pass  # Already exists
        # Migration: add analysis_hash if missing
        try:
            c.execute('ALTER TABLE analyses ADD COLUMN analysis_hash TEXT')
        except Exception:
            pass  # Already exists
        try:
            c.execute('ALTER TABLE baselines ADD COLUMN analysis_hash TEXT')
        except Exception:
            pass  # Already exists
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

def get_analysis_hash(analysis_json):
    # Use a stable hash of the analysis_json for uniqueness
    return hashlib.sha256(json.dumps(analysis_json, sort_keys=True).encode('utf-8')).hexdigest() if analysis_json else None

def save_analysis(file_name, status, analysis_json, file_path=None):
    with get_connection() as conn:
        c = conn.cursor()
        analysis_hash = get_analysis_hash(analysis_json)
        # Uniqueness check: do not insert if an analysis with the same fileName, filePath, and hash exists
        c.execute('''SELECT id FROM analyses WHERE fileName = ? AND (filePath = ? OR (? IS NULL AND filePath IS NULL)) AND analysis_hash = ?''', (file_name, file_path, file_path, analysis_hash))
        if c.fetchone():
            return None  # Already exists, do not insert duplicate
        c.execute('''
            INSERT INTO analyses (fileName, date, status, analysis_json, filePath, analysis_hash)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (file_name, datetime.now().isoformat(), status, json.dumps(analysis_json), file_path, analysis_hash))
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
        c.execute('SELECT id, fileName, date, status, analysis_json, filePath FROM analyses ORDER BY date DESC')
        return [
            {
                'id': row[0],
                'fileName': row[1],
                'date': row[2],
                'status': row[3],
                'analysis_json': json.loads(row[4]) if row[4] else None,
                'filePath': row[5]
            }
            for row in c.fetchall()
        ]

def save_baseline(file_name, original_name=None, file_path=None, analysis_json=None):
    with get_connection() as conn:
        c = conn.cursor()
        analysis_hash = get_analysis_hash(analysis_json)
        # Uniqueness check: do not insert if a baseline with the same fileName, filePath, and hash exists
        c.execute('''SELECT id FROM baselines WHERE fileName = ? AND (filePath = ? OR (? IS NULL AND filePath IS NULL)) AND analysis_hash = ?''', (file_name, file_path, file_path, analysis_hash))
        if c.fetchone():
            return None  # Already exists, do not insert duplicate
        c.execute('''
            INSERT INTO baselines (fileName, originalName, date, filePath, analysis_json, analysis_hash)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (file_name, original_name or file_name, datetime.now().isoformat(), file_path, json.dumps(analysis_json) if analysis_json else None, analysis_hash))
        conn.commit()
        return c.lastrowid

def get_baseline(baseline_id):
    with get_connection() as conn:
        c = conn.cursor()
        c.execute('SELECT * FROM baselines WHERE id = ?', (baseline_id,))
        row = c.fetchone()
        if row:
            analysis_json = None
            if len(row) > 5 and row[5]:
                try:
                    analysis_json = json.loads(row[5])
                except Exception:
                    analysis_json = None
            return {
                'id': row[0],
                'fileName': row[1],
                'originalName': row[2],
                'date': row[3],
                'filePath': row[4] if len(row) > 4 else None,
                'analysis_json': analysis_json
            }
        return None

def list_baselines():
    with get_connection() as conn:
        c = conn.cursor()
        c.execute('SELECT id, fileName, originalName, date, filePath, analysis_json FROM baselines ORDER BY date DESC')
        return [
            {
                'id': row[0],
                'fileName': row[1],
                'originalName': row[2],
                'date': row[3],
                'filePath': row[4],
                'analysis_json': json.loads(row[5]) if row[5] else None
            }
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

def save_comparison_history(analysis_id, baseline_id, llm_prompt, llm_result, analysis_file_name=None, baseline_file_name=None):
    with get_connection() as conn:
        c = conn.cursor()
        c.execute('''
            INSERT INTO comparison_history (analysisId, baselineId, timestamp, llm_prompt, llm_result, analysisFileName, baselineFileName)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (analysis_id, baseline_id, datetime.now().isoformat(), llm_prompt, llm_result, analysis_file_name, baseline_file_name))
        conn.commit()
        return c.lastrowid

def list_comparison_history(analysis_id=None, baseline_id=None):
    with get_connection() as conn:
        c = conn.cursor()
        query = 'SELECT id, analysisId, baselineId, timestamp, llm_prompt, llm_result, analysisFileName, baselineFileName FROM comparison_history'
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
                'llm_result': row[5],
                'analysisFileName': row[6],
                'baselineFileName': row[7]
            }
            for row in c.execute(query, params)
        ]

def delete_comparison_history(comparison_id):
    with get_connection() as conn:
        c = conn.cursor()
        c.execute('DELETE FROM comparison_history WHERE id = ?', (comparison_id,))
        conn.commit()
        return {'ok': True, 'deleted_id': comparison_id}

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
        file_name = sys.argv[2]
        original_name = sys.argv[3] if len(sys.argv) > 3 else None
        file_path = sys.argv[4] if len(sys.argv) > 4 else None
        try:
            analysis_json = json.loads(sys.argv[5]) if len(sys.argv) > 5 else None
        except Exception:
            analysis_json = None
        print('[DEBUG] --save-baseline args:', file_name, original_name, file_path, type(analysis_json), str(analysis_json)[:200], file=sys.stderr)
        baseline_id = save_baseline(file_name, original_name, file_path, analysis_json)
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
    if len(sys.argv) > 4 and sys.argv[1] == '--save-analysis':
        from db import save_analysis
        file_name = sys.argv[2]
        status = sys.argv[3]
        try:
            analysis_json = json.loads(sys.argv[4])
        except Exception:
            analysis_json = {}
        file_path = sys.argv[5] if len(sys.argv) > 5 else None
        analysis_id = save_analysis(file_name, status, analysis_json, file_path)
        print(json.dumps({'ok': True, 'analysis_id': analysis_id}))
        return
    if len(sys.argv) > 2 and sys.argv[1] == '--delete-comparison-history':
        from db import delete_comparison_history
        result = delete_comparison_history(int(sys.argv[2]))
        print(json.dumps(result))
        return
    if len(sys.argv) > 2 and sys.argv[1] == '--save-comparison-history':
        from db import save_comparison_history
        # Accepts: analysis_id, baseline_id, llm_prompt, llm_result, analysisFileName, baselineFileName
        analysis_id = int(sys.argv[2]) if sys.argv[2] != 'null' else None
        baseline_id = int(sys.argv[3]) if sys.argv[3] != 'null' else None
        llm_prompt = sys.argv[4]
        llm_result = sys.argv[5]
        analysis_file_name = sys.argv[6] if len(sys.argv) > 6 else None
        baseline_file_name = sys.argv[7] if len(sys.argv) > 7 else None
        result = save_comparison_history(analysis_id, baseline_id, llm_prompt, llm_result, analysis_file_name, baseline_file_name)
        print(json.dumps({'ok': True, 'id': result}))
        return
    init_db()
    print(json.dumps({'ok': True, 'message': f'Database initialized at {DB_PATH}'}))

if __name__ == "__main__":
    main()
