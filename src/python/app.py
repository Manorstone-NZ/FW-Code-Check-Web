from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os
import json
import logging
import traceback
from .analyzer import analyze_file_content

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
        from .db import get_db_connection
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT 1;")
        cur.fetchone()
        cur.close()
        conn.close()
        return jsonify({"ok": True, "message": "Database connection successful."})
    except Exception as e:
        log_exception(e)
        return jsonify({"ok": False, "error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
