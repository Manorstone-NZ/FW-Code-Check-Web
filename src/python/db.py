import os
import psycopg2
import json
from datetime import datetime, timedelta
import sys
import hashlib
import secrets
import bcrypt

# Load database URL from environment variable
DB_URL = os.getenv('NEON_DATABASE_URL')

def get_connection():
    """Get a new database connection"""
    return psycopg2.connect(DB_URL)

def init_db():
    with get_connection() as conn:
        c = conn.cursor()
        
        # Users table for authentication
        c.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                salt TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                last_login TIMESTAMPTZ,
                is_active BOOLEAN DEFAULT TRUE,
                role TEXT DEFAULT 'user',
                failed_login_attempts INTEGER DEFAULT 0,
                locked_until TIMESTAMPTZ
            )
        ''')
        
        # Sessions table for session management
        c.execute('''
            CREATE TABLE IF NOT EXISTS user_sessions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                session_token TEXT UNIQUE NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                expires_at TIMESTAMPTZ NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
        ''')
        
        c.execute('''
            CREATE TABLE IF NOT EXISTS analyses (
                id SERIAL PRIMARY KEY,
                fileName TEXT,
                date TIMESTAMPTZ,
                status TEXT,
                analysis_json TEXT,
                filePath TEXT,
                analysis_hash TEXT,
                provider TEXT,
                model TEXT,
                user_id INTEGER,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
        ''')
        
        # Migration: add user_id to analyses if missing
        try:
            c.execute('ALTER TABLE analyses ADD COLUMN user_id INTEGER')
        except Exception:
            pass  # Already exists
            
        # Add analysis_json to baselines if not present
        c.execute('''
            CREATE TABLE IF NOT EXISTS baselines (
                id SERIAL PRIMARY KEY,
                fileName TEXT,
                originalName TEXT,
                date TIMESTAMPTZ,
                filePath TEXT,
                analysis_json TEXT,
                analysis_hash TEXT,
                provider TEXT,
                model TEXT,
                user_id INTEGER,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
        ''')
        
        # Migration: add user_id to baselines if missing
        try:
            c.execute('ALTER TABLE baselines ADD COLUMN user_id INTEGER')
        except Exception:
            pass  # Already exists
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
                id SERIAL PRIMARY KEY,
                analysisId INTEGER,
                baselineId INTEGER,
                timestamp TIMESTAMPTZ,
                llm_prompt TEXT,
                llm_result TEXT,
                FOREIGN KEY(analysisId) REFERENCES analyses(id),
                FOREIGN KEY(baselineId) REFERENCES baselines(id)
            )
        ''')
        # Migration: add analysisFileName and baselineFileName if missing
        try:
            c.execute('ALTER TABLE comparison_history ADD COLUMN analysisFileName TEXT')
        except Exception:
            pass  # Already exists
        try:
            c.execute('ALTER TABLE comparison_history ADD COLUMN baselineFileName TEXT')
        except Exception:
            pass  # Already exists
        # Migration: add provider and model columns if missing
        try:
            c.execute('ALTER TABLE comparison_history ADD COLUMN provider TEXT')
        except Exception:
            pass  # Already exists
        try:
            c.execute('ALTER TABLE comparison_history ADD COLUMN model TEXT')
        except Exception:
            pass  # Already exists
        c.execute('''
            CREATE TABLE IF NOT EXISTS ot_threat_intel (
                id TEXT PRIMARY KEY,
                title TEXT,
                summary TEXT,
                source TEXT,
                retrieved_at TEXT,
                affected_vendors TEXT,
                threat_type TEXT,
                severity TEXT,
                industrial_protocols TEXT,
                system_targets TEXT,
                tags TEXT,
                created_at TEXT,
                updated_at TEXT,
                site_relevance TEXT,
                response_notes TEXT,
                llm_response TEXT
            )
        ''')
        c.execute('''
            CREATE TABLE IF NOT EXISTS audit_log (
                id SERIAL PRIMARY KEY,
                timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                action TEXT,
                user TEXT,
                details TEXT
            )
        ''')
        conn.commit()

def get_analysis_hash(analysis_json):
    # Use a stable hash of the analysis_json for uniqueness
    return hashlib.sha256(json.dumps(analysis_json, sort_keys=True).encode('utf-8')).hexdigest() if analysis_json else None

# === USER AUTHENTICATION FUNCTIONS ===

def hash_password(password: str) -> tuple[str, str]:
    """Hash a password with a random salt using bcrypt"""
    salt = bcrypt.gensalt()
    password_hash = bcrypt.hashpw(password.encode('utf-8'), salt)
    return password_hash.decode('utf-8'), salt.decode('utf-8')

def verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against its hash"""
    try:
        return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
    except Exception:
        return False

def create_user(username: str, email: str, password: str, role: str = 'user') -> dict:
    """Create a new user account"""
    with get_connection() as conn:
        c = conn.cursor()
        
        # Check if username or email already exists
        c.execute('SELECT id FROM users WHERE username = %s OR email = %s', (username, email))
        if c.fetchone():
            return {'success': False, 'error': 'Username or email already exists'}
        
        # Hash the password
        password_hash, salt = hash_password(password)
        
        # Create the user
        try:
            c.execute('''
                INSERT INTO users (username, email, password_hash, salt, created_at, role)
                VALUES (%s, %s, %s, %s, %s, %s)
            ''', (username, email, password_hash, salt, datetime.now().isoformat(), role))
            user_id = c.lastrowid
            conn.commit()
            
            return {
                'success': True,
                'user': {
                    'id': user_id,
                    'username': username,
                    'email': email,
                    'role': role,
                    'created_at': datetime.now().isoformat()
                }
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}

def authenticate_user(username: str, password: str) -> dict:
    """Authenticate a user and return user info if successful"""
    with get_connection() as conn:
        c = conn.cursor()
        
        # Get user by username or email
        c.execute('''
            SELECT id, username, email, password_hash, role, is_active, failed_login_attempts, locked_until
            FROM users WHERE (username = %s OR email = %s) AND is_active = TRUE
        ''', (username, username))
        
        user = c.fetchone()
        if not user:
            return {'success': False, 'error': 'Invalid credentials'}
        
        user_id, user_username, email, password_hash, role, is_active, failed_attempts, locked_until = user
        
        # Check if account is locked
        if locked_until:
            lock_time = datetime.fromisoformat(locked_until)
            if datetime.now() < lock_time:
                return {'success': False, 'error': 'Account is temporarily locked'}
        
        # Verify password
        if not verify_password(password, password_hash):
            # Increment failed login attempts
            failed_attempts += 1
            lock_until = None
            
            # Lock account after 5 failed attempts for 30 minutes
            if failed_attempts >= 5:
                lock_until = (datetime.now() + timedelta(minutes=30)).isoformat()
            
            c.execute('''
                UPDATE users SET failed_login_attempts = %s, locked_until = %s
                WHERE id = %s
            ''', (failed_attempts, lock_until, user_id))
            conn.commit()
            
            return {'success': False, 'error': 'Invalid credentials'}
        
        # Reset failed attempts and update last login
        c.execute('''
            UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login = %s
            WHERE id = %s
        ''', (datetime.now().isoformat(), user_id))
        conn.commit()
        
        return {
            'success': True,
            'user': {
                'id': user_id,
                'username': user_username,
                'email': email,
                'role': role
            }
        }

def get_user_by_username(username: str) -> dict:
    """Get user information by username"""
    with get_connection() as conn:
        c = conn.cursor()
        
        c.execute('''
            SELECT id, username, email, role, is_active, created_at, last_login
            FROM users WHERE username = %s
        ''', (username,))
        
        user = c.fetchone()
        if not user:
            return None
        
        user_id, user_username, email, role, is_active, created_at, last_login = user
        
        return {
            'id': user_id,
            'username': user_username,
            'email': email,
            'role': role,
            'is_active': bool(is_active),
            'created_at': created_at,
            'last_login': last_login
        }

def create_session(user_id: int) -> dict:
    """Create a new session for a user"""
    with get_connection() as conn:
        c = conn.cursor()
        
        # Generate secure session token
        session_token = secrets.token_urlsafe(32)
        created_at = datetime.now()
        expires_at = created_at + timedelta(days=7)  # 7 day expiry
        
        c.execute('''
            INSERT INTO user_sessions (user_id, session_token, created_at, expires_at, is_active)
            VALUES (%s, %s, %s, %s, TRUE)
        ''', (user_id, session_token, created_at.isoformat(), expires_at.isoformat()))
        
        session_id = c.lastrowid
        conn.commit()
        
        return {
            'success': True,
            'session': {
                'id': session_id,
                'token': session_token,
                'expires_at': expires_at.isoformat()
            }
        }

def validate_session(session_token: str) -> dict:
    """Validate a session token and return user info if valid"""
    with get_connection() as conn:
        c = conn.cursor()
        
        c.execute('''
            SELECT s.id, s.user_id, s.expires_at, u.username, u.email, u.role
            FROM user_sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.session_token = %s AND s.is_active = TRUE AND u.is_active = TRUE
        ''', (session_token,))
        
        session = c.fetchone()
        if not session:
            return {'success': False, 'error': 'Invalid session'}
        
        session_id, user_id, expires_at, username, email, role = session
        
        # Check if session is expired
        if datetime.now() > datetime.fromisoformat(expires_at):
            # Deactivate expired session
            c.execute('UPDATE user_sessions SET is_active = FALSE WHERE id = %s', (session_id,))
            conn.commit()
            return {'success': False, 'error': 'Session expired'}
        
        return {
            'success': True,
            'user': {
                'id': user_id,
                'username': username,
                'email': email,
                'role': role
            }
        }

def logout_session(session_token: str) -> dict:
    """Logout by deactivating a session"""
    with get_connection() as conn:
        c = conn.cursor()
        
        c.execute('UPDATE user_sessions SET is_active = FALSE WHERE session_token = %s', (session_token,))
        conn.commit()
        
        return {'success': True}

def cleanup_expired_sessions():
    """Clean up expired sessions"""
    with get_connection() as conn:
        c = conn.cursor()
        
        c.execute('UPDATE user_sessions SET is_active = FALSE WHERE expires_at < %s', (datetime.now().isoformat(),))
        conn.commit()

def list_users() -> dict:
    """List all users for admin management"""
    try:
        with get_connection() as conn:
            c = conn.cursor()
            
            c.execute('''
                SELECT id, username, email, role, created_at, last_login, is_active, 
                       failed_login_attempts, locked_until
                FROM users 
                ORDER BY created_at DESC
            ''')
            
            users = []
            for row in c.fetchall():
                users.append({
                    'id': row[0],
                    'username': row[1],
                    'email': row[2],
                    'role': row[3],
                    'created_at': row[4],
                    'last_login': row[5],
                    'is_active': bool(row[6]),
                    'failed_login_attempts': row[7],
                    'locked_until': row[8]
                })
            
            return {'success': True, 'users': users}
    except Exception as e:
        return {'success': False, 'error': str(e)}

def delete_user(user_id: int) -> dict:
    """Delete a user by ID"""
    try:
        with get_connection() as conn:
            c = conn.cursor()
            
            # Check if user exists
            c.execute('SELECT username FROM users WHERE id = %s', (user_id,))
            user = c.fetchone()
            if not user:
                return {'success': False, 'error': 'User not found'}
            
            # Delete user sessions first
            c.execute('DELETE FROM user_sessions WHERE user_id = %s', (user_id,))
            
            # Delete user
            c.execute('DELETE FROM users WHERE id = %s', (user_id,))
            conn.commit()
            
            return {'success': True, 'message': f'User {user[0]} deleted successfully'}
    except Exception as e:
        return {'success': False, 'error': str(e)}

def toggle_user_status(user_id: int, is_active: bool) -> dict:
    """Toggle user active status"""
    try:
        with get_connection() as conn:
            c = conn.cursor()
            
            # Check if user exists
            c.execute('SELECT username FROM users WHERE id = %s', (user_id,))
            user = c.fetchone()
            if not user:
                return {'success': False, 'error': 'User not found'}
            
            # Update user status
            c.execute('UPDATE users SET is_active = %s WHERE id = %s', (is_active, user_id))
            
            # If deactivating, also deactivate all sessions
            if not is_active:
                c.execute('UPDATE user_sessions SET is_active = FALSE WHERE user_id = %s', (user_id,))
            
            conn.commit()
            
            status = 'activated' if is_active else 'deactivated'
            return {'success': True, 'message': f'User {user[0]} {status} successfully'}
    except Exception as e:
        return {'success': False, 'error': str(e)}

def reset_user_password(user_id: int, new_password: str) -> dict:
    """Reset user password"""
    try:
        if len(new_password) < 8:
            return {'success': False, 'error': 'Password must be at least 8 characters long'}
        
        password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        with get_connection() as conn:
            c = conn.cursor()
            
            # Check if user exists
            c.execute('SELECT username FROM users WHERE id = %s', (user_id,))
            user = c.fetchone()
            if not user:
                return {'success': False, 'error': 'User not found'}
            
            # Update password and reset failed attempts
            c.execute('''
                UPDATE users 
                SET password_hash = %s, failed_login_attempts = 0, locked_until = NULL
                WHERE id = %s
            ''', (password_hash, user_id))
            
            # Deactivate all existing sessions to force re-login
            c.execute('UPDATE user_sessions SET is_active = FALSE WHERE user_id = %s', (user_id,))
            
            conn.commit()
            
            return {'success': True, 'message': f'Password reset successfully for user {user[0]}'}
    except Exception as e:
        return {'success': False, 'error': str(e)}

# === END USER AUTHENTICATION FUNCTIONS ===

def save_analysis(file_name, status, analysis_json, file_path=None, provider=None, model=None):
    with get_connection() as conn:
        c = conn.cursor()
        analysis_hash = get_analysis_hash(analysis_json)
        # Uniqueness check: do not insert if an analysis with the same fileName, filePath, and hash exists
        c.execute('''SELECT id FROM analyses WHERE fileName = %s AND (filePath = %s OR (%s IS NULL AND filePath IS NULL)) AND analysis_hash = %s''', (file_name, file_path, file_path, analysis_hash))
        if c.fetchone():
            return None  # Already exists, do not insert duplicate
        c.execute('''
            INSERT INTO analyses (fileName, date, status, analysis_json, filePath, analysis_hash, provider, model)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        ''', (file_name, datetime.now().isoformat(), status, json.dumps(analysis_json), file_path, analysis_hash, provider, model))
        conn.commit()
        return c.lastrowid

def get_analysis(analysis_id):
    with get_connection() as conn:
        c = conn.cursor()
        c.execute('SELECT * FROM analyses WHERE id = %s', (analysis_id,))
        row = c.fetchone()
        if row:
            try:
                # Handle both string and already-parsed JSON
                if isinstance(row[4], str):
                    analysis_json = json.loads(row[4])
                else:
                    analysis_json = row[4]
                
                # Ensure analysis_json is a dictionary before calling ensure_analysis_fields
                if not isinstance(analysis_json, dict):
                    print(f"Warning: analysis_json is not a dict, it's a {type(analysis_json)}: {analysis_json}")
                    # Try to parse it as JSON if it's a string
                    if isinstance(analysis_json, str):
                        try:
                            analysis_json = json.loads(analysis_json)
                        except json.JSONDecodeError:
                            # If it can't be parsed, create a minimal structure
                            analysis_json = {'error': 'Failed to parse analysis JSON', 'raw_data': str(analysis_json)}
                    else:
                        # For other types, create a minimal structure
                        analysis_json = {'error': 'Invalid analysis JSON type', 'raw_data': str(analysis_json)}
                
                from analyzer import ensure_analysis_fields
                analysis_json = ensure_analysis_fields(analysis_json)
                
                return {
                    'id': row[0],
                    'fileName': row[1],
                    'date': row[2],
                    'status': row[3],
                    'analysis_json': analysis_json,
                    'filePath': row[5] if len(row) > 5 else None,
                    'provider': row[7] if len(row) > 7 else None,
                    'model': row[8] if len(row) > 8 else None
                }
            except Exception as e:
                print(f"Error processing analysis {analysis_id}: {e}")
                # Return a basic structure with error information
                return {
                    'id': row[0],
                    'fileName': row[1],
                    'date': row[2],
                    'status': row[3],
                    'analysis_json': {'error': f'Failed to process analysis: {str(e)}'},
                    'filePath': row[5] if len(row) > 5 else None,
                    'provider': row[7] if len(row) > 7 else None,
                    'model': row[8] if len(row) > 8 else None
                }
        return None

def list_analyses():
    with get_connection() as conn:
        c = conn.cursor()
        c.execute('SELECT id, fileName, date, status, analysis_json, filePath, provider, model FROM analyses ORDER BY date DESC')
        return [
            {
                'id': row[0],
                'fileName': row[1],
                'date': row[2],
                'status': row[3],
                'analysis_json': json.loads(row[4]) if row[4] else None,
                'filePath': row[5],
                'provider': row[6] if len(row) > 6 else None,
                'model': row[7] if len(row) > 7 else None
            }
            for row in c.fetchall()
        ]

def save_baseline(file_name, original_name=None, file_path=None, analysis_json=None, provider=None, model=None):
    with get_connection() as conn:
        c = conn.cursor()
        analysis_hash = get_analysis_hash(analysis_json)
        # Uniqueness check: do not insert if a baseline with the same fileName, filePath, and hash exists
        c.execute('''SELECT id FROM baselines WHERE fileName = %s AND (filePath = %s OR (%s IS NULL AND filePath IS NULL)) AND analysis_hash = %s''', (file_name, file_path, file_path, analysis_hash))
        if c.fetchone():
            return None  # Already exists, do not insert duplicate
        c.execute('''
            INSERT INTO baselines (fileName, originalName, date, filePath, analysis_json, analysis_hash, provider, model)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        ''', (file_name, original_name or file_name, datetime.now().isoformat(), file_path, json.dumps(analysis_json) if analysis_json else None, analysis_hash, provider, model))
        conn.commit()
        return c.lastrowid

def get_baseline(baseline_id):
    with get_connection() as conn:
        c = conn.cursor()
        c.execute('SELECT * FROM baselines WHERE id = %s', (baseline_id,))
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
        c.execute('SELECT id, fileName, originalName, date, filePath, analysis_json, provider, model FROM baselines ORDER BY date DESC')
        return [
            {
                'id': row[0],
                'fileName': row[1],
                'originalName': row[2],
                'date': row[3],
                'filePath': row[4],
                'analysis_json': json.loads(row[5]) if row[5] else None,
                'provider': row[6],
                'model': row[7]
            }
            for row in c.fetchall()
        ]

def delete_baseline(baseline_id):
    with get_connection() as conn:
        c = conn.cursor()
        c.execute('DELETE FROM baselines WHERE id = %s', (baseline_id,))
        conn.commit()

def delete_analysis(analysis_id):
    with get_connection() as conn:
        c = conn.cursor()
        c.execute('DELETE FROM analyses WHERE id = %s', (analysis_id,))
        conn.commit()
        return {'ok': True, 'deleted_id': analysis_id}

def save_comparison_history(analysis_id, baseline_id, llm_prompt, llm_result, analysis_file_name=None, baseline_file_name=None, provider=None, model=None):
    with get_connection() as conn:
        c = conn.cursor()
        c.execute('''
            INSERT INTO comparison_history (analysisId, baselineId, timestamp, llm_prompt, llm_result, analysisFileName, baselineFileName, provider, model)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ''', (analysis_id, baseline_id, datetime.now().isoformat(), llm_prompt, llm_result, analysis_file_name, baseline_file_name, provider, model))
        conn.commit()
        return c.lastrowid

def list_comparison_history(analysis_id=None, baseline_id=None):
    with get_connection() as conn:
        c = conn.cursor()
        query = 'SELECT id, analysisId, baselineId, timestamp, llm_prompt, llm_result, analysisFileName, baselineFileName, provider, model FROM comparison_history'
        params = []
        if analysis_id and baseline_id:
            query += ' WHERE analysisId = %s AND baselineId = %s'
            params = [analysis_id, baseline_id]
        elif analysis_id:
            query += ' WHERE analysisId = %s'
            params = [analysis_id]
        elif baseline_id:
            query += ' WHERE baselineId = %s'
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
                'baselineFileName': row[7],
                'provider': row[8] if len(row) > 8 else None,
                'model': row[9] if len(row) > 9 else None
            }
            for row in c.execute(query, params)
        ]

def delete_comparison_history(comparison_id):
    with get_connection() as conn:
        c = conn.cursor()
        c.execute('DELETE FROM comparison_history WHERE id = %s', (comparison_id,))
        conn.commit()
        return {'ok': True, 'deleted_id': comparison_id}

def save_ot_threat_intel(entry):
    with get_connection() as conn:
        c = conn.cursor()
        # Prevent duplicate: unique on (title, summary, source, threat_type, severity, affected_vendors, industrial_protocols, system_targets, tags)
        c.execute('''SELECT id FROM ot_threat_intel WHERE title = %s AND summary = %s AND source = %s AND threat_type = %s AND severity = %s AND affected_vendors = %s AND industrial_protocols = %s AND system_targets = %s AND tags = %s''', (
            entry['title'], entry['summary'], entry['source'], entry.get('threat_type'), entry.get('severity'),
            json.dumps(entry.get('affected_vendors', [])), json.dumps(entry.get('industrial_protocols', [])),
            json.dumps(entry.get('system_targets', [])), json.dumps(entry.get('tags', []))
        ))
        if c.fetchone():
            return None
        c.execute('''
            INSERT INTO ot_threat_intel (id, title, summary, source, retrieved_at, affected_vendors, threat_type, severity, industrial_protocols, system_targets, tags, created_at, updated_at, site_relevance, response_notes, llm_response)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ''', (
            entry['id'], entry['title'], entry['summary'], entry['source'], entry['retrieved_at'],
            json.dumps(entry.get('affected_vendors', [])), entry.get('threat_type'), entry.get('severity'),
            json.dumps(entry.get('industrial_protocols', [])), json.dumps(entry.get('system_targets', [])),
            json.dumps(entry.get('tags', [])), entry['created_at'], entry['updated_at'],
            entry.get('site_relevance'), entry.get('response_notes'), entry.get('llm_response')
        ))
        conn.commit()
        return entry['id']

def list_ot_threat_intel():
    with get_connection() as conn:
        c = conn.cursor()
        c.execute('SELECT * FROM ot_threat_intel ORDER BY retrieved_at DESC')
        return [
            {
                'id': row[0],
                'title': row[1],
                'summary': row[2],
                'source': row[3],
                'retrieved_at': row[4],
                'affected_vendors': json.loads(row[5] or '[]'),
                'threat_type': row[6],
                'severity': row[7],
                'industrial_protocols': json.loads(row[8] or '[]'),
                'system_targets': json.loads(row[9] or '[]'),
                'tags': json.loads(row[10] or '[]'),
                'created_at': row[11],
                'updated_at': row[12],
                'site_relevance': row[13],
                'response_notes': row[14],
                'llm_response': row[15],
            }
            for row in c.fetchall()
        ]

def get_ot_threat_intel_last_sync():
    with get_connection() as conn:
        c = conn.cursor()
        c.execute('SELECT MAX(retrieved_at) FROM ot_threat_intel')
        row = c.fetchone()
        return row[0] if row and row[0] else None

def log_audit(action, user, details=None):
    with get_connection() as conn:
        c = conn.cursor()
        c.execute('''
            INSERT INTO audit_log (timestamp, action, user, details)
            VALUES (%s, %s, %s, %s)
        ''', (datetime.now().isoformat(), action, user, json.dumps(details) if details else None))
        conn.commit()

def update_ot_threat_intel(entry):
    with get_connection() as conn:
        c = conn.cursor()
        c.execute('''
            UPDATE ot_threat_intel SET
                tags = %s,
                site_relevance = %s,
                response_notes = %s,
                updated_at = %s
            WHERE id = %s
        ''', (
            json.dumps(entry.get('tags', [])),
            entry.get('site_relevance'),
            entry.get('response_notes'),
            datetime.now().isoformat(),
            entry['id']
        ))
        conn.commit()
    log_audit('curation_update', entry.get('curation_user', 'analyst'), {'id': entry['id'], 'tags': entry.get('tags'), 'site_relevance': entry.get('site_relevance')})
    return {'ok': True, 'id': entry['id']}

def clear_ot_threat_intel():
    with get_connection() as conn:
        c = conn.cursor()
        c.execute('DELETE FROM ot_threat_intel')
        conn.commit()

def clear_all_data():
    """Delete all rows from analysis and baseline tables, but preserve users and sessions."""
    with get_connection() as conn:
        c = conn.cursor()
        c.execute('DELETE FROM analyses')
        c.execute('DELETE FROM baselines')
        c.execute('DELETE FROM comparison_history')
        c.execute('DELETE FROM ot_threat_intel')
        c.execute('DELETE FROM audit_log')
        # Don't delete users and user_sessions to preserve authentication
        # c.execute('DELETE FROM users')
        # c.execute('DELETE FROM user_sessions')
        conn.commit()

def main():
    if len(sys.argv) > 1 and sys.argv[1] == '--list-analyses':
        from db import list_analyses
        print(json.dumps(list_analyses()))
        return
    if len(sys.argv) > 2 and sys.argv[1] == '--get-analysis':
        from db import get_analysis
        try:
            analysis_id = int(sys.argv[2])
        except ValueError:
            print(json.dumps({'ok': False, 'error': f'Invalid analysis ID: {sys.argv[2]}', 'analysis': None}))
            return
        result = get_analysis(analysis_id)
        if result is None:
            print(json.dumps({'ok': False, 'error': 'Analysis not found', 'analysis': None}))
        else:
            print(json.dumps(result))
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
        provider = sys.argv[6] if len(sys.argv) > 6 else None
        model = sys.argv[7] if len(sys.argv) > 7 else None
        print('[DEBUG] --save-baseline args:', file_name, original_name, file_path, type(analysis_json), str(analysis_json)[:200], provider, model, file=sys.stderr)
        baseline_id = save_baseline(file_name, original_name, file_path, analysis_json, provider, model)
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
            return int(arg) if arg and arg != '' and arg != 'null' else None
        analysis_id = parse_id(sys.argv[2]) if len(sys.argv) > 2 else None
        baseline_id = parse_id(sys.argv[3]) if len(sys.argv) > 3 else None
        result = list_comparison_history(analysis_id, baseline_id)
        print(json.dumps(result))
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
        provider = sys.argv[6] if len(sys.argv) > 6 else None
        model = sys.argv[7] if len(sys.argv) > 7 else None
        analysis_id = save_analysis(file_name, status, analysis_json, file_path, provider, model)
        print(json.dumps({'ok': True, 'analysis_id': analysis_id}))
        return
    if len(sys.argv) > 2 and sys.argv[1] == '--delete-comparison-history':
        from db import delete_comparison_history
        result = delete_comparison_history(int(sys.argv[2]))
        print(json.dumps(result))
        return
    if len(sys.argv) > 2 and sys.argv[1] == '--save-comparison-history':
        from db import save_comparison_history
        # Accepts: analysis_id, baseline_id, llm_prompt, llm_result, analysisFileName, baselineFileName, provider, model
        analysis_id = int(sys.argv[2]) if sys.argv[2] not in ['null', '', 'None'] else None
        baseline_id = int(sys.argv[3]) if sys.argv[3] not in ['null', '', 'None'] else None
        llm_prompt = sys.argv[4]
        llm_result = sys.argv[5]
        analysis_file_name = sys.argv[6] if len(sys.argv) > 6 else None
        baseline_file_name = sys.argv[7] if len(sys.argv) > 7 else None
        provider = sys.argv[8] if len(sys.argv) > 8 else None
        model = sys.argv[9] if len(sys.argv) > 9 else None
        result = save_comparison_history(analysis_id, baseline_id, llm_prompt, llm_result, analysis_file_name, baseline_file_name, provider, model)
        print(json.dumps({'ok': True, 'id': result}))
        return
    if len(sys.argv) > 1 and sys.argv[1] == '--list-ot-threat-intel':
        print(json.dumps(list_ot_threat_intel()))
        return
    if len(sys.argv) > 1 and sys.argv[1] == '--get-ot-threat-intel-last-sync':
        print(json.dumps(get_ot_threat_intel_last_sync()))
        return
    if len(sys.argv) > 2 and sys.argv[1] == '--update-ot-threat-intel':
        entry = json.loads(sys.argv[2])
        from db import update_ot_threat_intel
        print(json.dumps(update_ot_threat_intel(entry)))
        return
    if len(sys.argv) > 1 and sys.argv[1] == '--clear-ot-threat-intel':
        from db import clear_ot_threat_intel
        clear_ot_threat_intel()
        print(json.dumps({'ok': True, 'cleared': True}))
        return
    if len(sys.argv) > 1 and sys.argv[1] == '--reset-db':
        from db import clear_all_data
        clear_all_data()
        print(json.dumps({'ok': True, 'message': 'All data cleared from database.'}))
        return
    
    # Authentication commands
    if len(sys.argv) > 4 and sys.argv[1] == '--create-user':
        username = sys.argv[2]
        email = sys.argv[3]
        password = sys.argv[4]
        role = sys.argv[5] if len(sys.argv) > 5 else 'user'
        result = create_user(username, email, password, role)
        print(json.dumps(result))
        return
    
    if len(sys.argv) > 3 and sys.argv[1] == '--authenticate-user':
        username = sys.argv[2]
        password = sys.argv[3]
        result = authenticate_user(username, password)
        print(json.dumps(result))
        return
    
    if len(sys.argv) > 2 and sys.argv[1] == '--create-session':
        try:
            user_id = int(sys.argv[2])
        except ValueError:
            # If user_id is not a number, try to find user by username
            username = sys.argv[2]
            user = get_user_by_username(username)
            if user:
                user_id = user['id']
            else:
                print(json.dumps({'success': False, 'error': f'User not found: {username}'}))
                return
        result = create_session(user_id)
        print(json.dumps(result))
        return
    
    if len(sys.argv) > 2 and sys.argv[1] == '--validate-session':
        session_token = sys.argv[2]
        result = validate_session(session_token)
        print(json.dumps(result))
        return
    
    if len(sys.argv) > 2 and sys.argv[1] == '--logout-session':
        session_token = sys.argv[2]
        result = logout_session(session_token)
        print(json.dumps(result))
        return
    
    if len(sys.argv) > 1 and sys.argv[1] == '--cleanup-sessions':
        cleanup_expired_sessions()
        print(json.dumps({'ok': True, 'message': 'Expired sessions cleaned up'}))
        return
    
    # User management commands
    if len(sys.argv) > 1 and sys.argv[1] == '--list-users':
        result = list_users()
        print(json.dumps(result))
        return
    
    if len(sys.argv) > 2 and sys.argv[1] == '--delete-user':
        try:
            user_id = int(sys.argv[2])
        except ValueError:
            # If user_id is not a number, try to find user by username
            username = sys.argv[2]
            user = get_user_by_username(username)
            if user:
                user_id = user['id']
            else:
                print(json.dumps({'success': False, 'error': f'User not found: {username}'}))
                return
        result = delete_user(user_id)
        print(json.dumps(result))
        return
    
    if len(sys.argv) > 5 and sys.argv[1] == '--register-user':
        username = sys.argv[2]
        email = sys.argv[3]
        password = sys.argv[4]
        role = sys.argv[5] if len(sys.argv) > 5 else 'user'
        result = create_user(username, email, password, role)
        print(json.dumps(result))
        return
    
    if len(sys.argv) > 3 and sys.argv[1] == '--toggle-user-status':
        try:
            user_id = int(sys.argv[2])
        except ValueError:
            # If user_id is not a number, try to find user by username
            username = sys.argv[2]
            user = get_user_by_username(username)
            if user:
                user_id = user['id']
            else:
                print(json.dumps({'success': False, 'error': f'User not found: {username}'}))
                return
        is_active = sys.argv[3].lower() == 'true'
        result = toggle_user_status(user_id, is_active)
        print(json.dumps(result))
        return
    
    if len(sys.argv) > 3 and sys.argv[1] == '--reset-user-password':
        try:
            user_id = int(sys.argv[2])
        except ValueError:
            # If user_id is not a number, try to find user by username
            username = sys.argv[2]
            user = get_user_by_username(username)
            if user:
                user_id = user['id']
            else:
                print(json.dumps({'success': False, 'error': f'User not found: {username}'}))
                return
        new_password = sys.argv[3]
        result = reset_user_password(user_id, new_password)
        print(json.dumps(result))
        return
    
    init_db()
    print(json.dumps({'ok': True, 'message': f'Database initialized at {DB_URL}'}))

# Add function aliases for compatibility
init_database = init_db
get_all_analyses = list_analyses
get_all_baselines = list_baselines
create_analysis = save_analysis
create_baseline = save_baseline

# Missing handlers that are referenced in preload.js
def debug_log_hook(log_data):
    """Debug logging handler"""
    try:
        print(f"DEBUG: {json.dumps(log_data, indent=2)}")
        return {'ok': True, 'message': 'Debug log recorded'}
    except Exception as e:
        return {'ok': False, 'error': str(e)}

def install_ollama_model(model_name):
    """Install Ollama model handler"""
    try:
        # This would integrate with Ollama CLI in a real implementation
        print(f"Would install Ollama model: {model_name}")
        return {'ok': True, 'message': f'Model {model_name} installation initiated'}
    except Exception as e:
        return {'ok': False, 'error': str(e)}

def reset_db():
    """Reset database handler"""
    try:
        # Clear all tables but keep structure
        with get_connection() as conn:
            c = conn.cursor()
            tables = ['analyses', 'baselines', 'comparison_history', 'ot_threat_intel', 'users', 'user_sessions']
            for table in tables:
                c.execute(f'DELETE FROM {table}')
            conn.commit()
        return {'ok': True, 'message': 'Database reset successfully'}
    except Exception as e:
        return {'ok': False, 'error': str(e)}

def show_save_directory_picker():
    """Directory picker handler - placeholder for Electron integration"""
    return {'ok': True, 'path': '/tmp'}

# Function aliases for backward compatibility and testing
get_analysis_list = list_analyses  # Alias for list_analyses
get_all_analyses = list_analyses   # Another alias
get_analyses = list_analyses       # Another alias
create_analysis = save_analysis    # Alias for save_analysis
init_database = init_db           # Common alias
database_init = init_db           # Another alias

# Add missing comparison handler alias
# (list_comparison_history already exists above)

if __name__ == "__main__":
    main()
