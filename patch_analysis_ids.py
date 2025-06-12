import sqlite3
import json

DB_PATH = "firstwatch.db"

def patch_analysis_ids():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT id, analysis_json FROM analyses")
    rows = c.fetchall()
    for row in rows:
        analysis_id, analysis_json_str = row
        try:
            analysis_json = json.loads(analysis_json_str)
        except Exception:
            analysis_json = {}
        # Patch id if missing or incorrect
        if analysis_json.get("id") != analysis_id:
            analysis_json["id"] = analysis_id
            c.execute(
                "UPDATE analyses SET analysis_json = ? WHERE id = ?",
                (json.dumps(analysis_json), analysis_id)
            )
    conn.commit()
    conn.close()
    print("Patched all analysis records with correct id.")

if __name__ == "__main__":
    patch_analysis_ids()
