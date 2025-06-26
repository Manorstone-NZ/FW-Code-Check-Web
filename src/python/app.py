from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os
import json
import logging
import traceback
from .analyzer import analyze_file_content
from .db import authenticate_user, create_user, create_session, validate_session, logout_session

print("[DEBUG] Flask app.py loaded", file=sys.stderr)

app = Flask(__name__)
CORS(app)

# Global error handler for logging exceptions
def log_exception(e):
    logging.error("Exception in Flask route: %s\n%s", e, traceback.format_exc())
    print(f"[ERROR] Exception in Flask route: {e}\n{traceback.format_exc()}", file=sys.stderr)

@app.errorhandler(Exception)
def handle_exception(e):
    log_exception(e)
    return jsonify({"error": str(e)}), 500

def run_analysis(file_content):
    # Call the refactored analysis function
    return analyze_file_content(file_content)

@app.route("/api/analyze", methods=["POST"])
def analyze():
    print("[DEBUG] /api/analyze called", file=sys.stderr)
    if 'file' not in request.files:
        return jsonify({"ok": False, "error": "No file uploaded"}), 400
    file = request.files['file']
    content = file.read().decode('utf-8')
    result = run_analysis(content)
    return jsonify(result)

@app.route("/api/health", methods=["GET"])
def health():
    print("[DEBUG] /api/health called", file=sys.stderr)
    return jsonify({"ok": True, "status": "healthy"})

@app.route("/api/db-health", methods=["GET"])
def db_health():
    print("[DEBUG] /api/db-health called", file=sys.stderr)
    try:
        from .db import get_connection
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT 1;")
        cur.fetchone()
        cur.close()
        conn.close()
        return jsonify({"ok": True, "message": "Database connection successful."})
    except Exception as e:
        log_exception(e)
        return jsonify({"ok": False, "error": str(e)}), 500

@app.route("/api/auth/login", methods=["POST"])
def api_login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    if not username or not password:
        return jsonify({"success": False, "error": "Missing username or password"}), 400
    auth_result = authenticate_user(username, password)
    if not auth_result.get("success"):
        return jsonify({"success": False, "error": auth_result.get("error", "Authentication failed")}), 401
    user = auth_result["user"]
    session_result = create_session(user["id"])
    if not session_result.get("success"):
        return jsonify({"success": False, "error": "Session creation failed"}), 500
    return jsonify({
        "success": True,
        "user": user,
        "sessionToken": session_result["session"]["token"]
    })

@app.route("/api/auth/register", methods=["POST"])
def api_register():
    data = request.get_json()
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role", "user")
    if not username or not email or not password:
        return jsonify({"success": False, "error": "Missing registration fields"}), 400
    reg_result = create_user(username, email, password, role)
    if not reg_result.get("success"):
        return jsonify({"success": False, "error": reg_result.get("error", "Registration failed")}), 400
    return jsonify({"success": True, "user": reg_result["user"]})

@app.route("/api/auth/validate-session", methods=["POST"])
def api_validate_session():
    data = request.get_json()
    session_token = data.get("sessionToken")
    if not session_token:
        return jsonify({"success": False, "error": "Missing session token"}), 400
    result = validate_session(session_token)
    if not result.get("success"):
        return jsonify({"success": False, "error": result.get("error", "Invalid session")}), 401
    return jsonify({"success": True, "user": result["user"]})

@app.route("/api/auth/logout", methods=["POST"])
def api_logout():
    data = request.get_json()
    session_token = data.get("sessionToken")
    if not session_token:
        return jsonify({"success": False, "error": "Missing session token"}), 400
    result = logout_session(session_token)
    return jsonify(result)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
