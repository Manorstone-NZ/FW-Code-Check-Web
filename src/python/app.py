from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os
import json
from .analyzer import analyze_file_content

app = Flask(__name__)
CORS(app)

def run_analysis(file_content):
    # Call the refactored analysis function
    return analyze_file_content(file_content)

@app.route("/api/analyze", methods=["POST"])
def analyze():
    if 'file' not in request.files:
        return jsonify({"ok": False, "error": "No file uploaded"}), 400
    file = request.files['file']
    content = file.read().decode('utf-8')
    result = run_analysis(content)
    return jsonify(result)

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"ok": True, "status": "healthy"})

@app.route("/api/db-health", methods=["GET"])
def db_health():
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
        return jsonify({"ok": False, "error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
