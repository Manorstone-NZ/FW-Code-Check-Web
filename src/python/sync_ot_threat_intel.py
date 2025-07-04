import sys
import json
import uuid
import os
from datetime import datetime
from db import save_ot_threat_intel, log_audit
import requests

def ollama_llm_query(prompt, model='llama3'):
    response = requests.post(
        'http://localhost:11434/api/generate',
        json={'model': model, 'prompt': prompt, 'stream': False}
    )
    return response.json()['response']

# --- OpenAI integration ---
def fetch_openai_ot_threat_intel(provider=None):
    """
    provider: 'openai' (default), 'ollama', or None (uses env LLM_PROVIDER or defaults to openai)
    """
    provider = provider or os.environ.get('LLM_PROVIDER', 'openai').lower()
    try:
        prompt = (
            "Provide the latest 3-5 real-world OT/ICS threat intelligence headlines with details, "
            "including: title, summary, source, affected vendors, threat type, severity, protocols, system targets, tags. "
            "Format as a JSON array of objects with these fields. Focus on PLC malware, protocol vulns, ICS APTs, etc. "
            "Summaries should be concise and OT-relevant."
        )
        if provider == 'ollama':
            content = ollama_llm_query(prompt, model='llama3')
        else:
            import openai
            api_key = os.environ.get('OPENAI_API_KEY')
            if not api_key:
                with open(os.path.join(os.path.dirname(__file__), '../../openai.key')) as f:
                    api_key = f.read().strip()
            openai.api_key = api_key
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1200,
                temperature=0.2
            )
            content = response['choices'][0]['message']['content']
        # Try to parse JSON from LLM response
        try:
            entries = json.loads(content)
        except Exception:
            # fallback: try to extract JSON from markdown/code block
            import re
            match = re.search(r'```json\\n(.*?)```', content, re.DOTALL)
            if match:
                entries = json.loads(match.group(1))
            else:
                raise
        now = datetime.now().isoformat()
        for e in entries:
            e['id'] = str(uuid.uuid4())
            e['retrieved_at'] = now
            e['created_at'] = now
            e['updated_at'] = now
            e['llm_response'] = content
        log_audit('sync_ot_threat_intel', 'system', {'source': provider, 'prompt': prompt})
        return entries
    except Exception as ex:
        # Fallback to mock if LLM fails
        now = datetime.now().isoformat()
        log_audit('sync_ot_threat_intel', 'system', {'source': 'mock', 'error': str(ex)})
        return [
            {
                'id': str(uuid.uuid4()),
                'title': 'Example PLC Malware Campaign',
                'summary': 'A new malware targets Siemens S7-1500 PLCs via the S7 protocol.',
                'source': provider,
                'retrieved_at': now,
                'affected_vendors': ['Siemens'],
                'threat_type': 'PLC malware',
                'severity': 'High',
                'industrial_protocols': ['S7'],
                'system_targets': ['PLC'],
                'tags': ['S7-1500', 'malware', 'ICS'],
                'created_at': now,
                'updated_at': now,
                'site_relevance': None,
                'response_notes': None,
                'llm_response': '## Executive Summary\nA new malware targets Siemens S7-1500 PLCs via the S7 protocol.\n\n**Key Findings:**\n- Exploits S7 protocol vulnerabilities.\n- Impacts Siemens S7-1500 PLCs.\n- High severity for ICS environments.'
            }
        ]

# --- Special LLM call for bulk OT threat intel (past year) ---
def get_openai_api_key():
    api_key = os.environ.get('OPENAI_API_KEY')
    if api_key:
        print(f"[DEBUG] Using OPENAI_API_KEY from environment: {api_key[:8]}...", file=sys.stderr)
        return api_key
    import pathlib
    # Always look for openai.key in the project root
    project_root = pathlib.Path(__file__).parent.parent.parent
    key_path = project_root / 'openai.key'
    print(f"[DEBUG] Looking for openai.key at: {key_path}", file=sys.stderr)
    if key_path.exists():
        with open(key_path) as f:
            key = f.read().strip()
            print(f"[DEBUG] Read from openai.key: {key[:8]}...", file=sys.stderr)
            if key.startswith('OPENAI_API_KEY='):
                key = key.split('=', 1)[1].strip()
                print(f"[DEBUG] Stripped var name, key is now: {key[:8]}...", file=sys.stderr)
            return key
    print("[DEBUG] No valid OpenAI API key found.", file=sys.stderr)
    return None

def fetch_bulk_openai_ot_threat_intel():
    import openai
    api_key = get_openai_api_key()
    if not api_key:
        raise RuntimeError('No valid OpenAI API key found.')
    openai.api_key = api_key
    prompt = (
        "Provide at least 10 real-world OT/ICS threat intelligence headlines and details from the past year (since June 2024), "
        "including: title, summary, source, affected vendors, threat type, severity, protocols, system targets, tags. "
        "Format as a JSON array of objects with these fields. Focus on PLC malware, protocol vulns, ICS APTs, ransomware, supply chain, etc. "
        "Summaries should be concise and OT-relevant."
    )
    response = openai.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=3000,
        temperature=0.2
    )
    content = response.choices[0].message.content
    try:
        entries = json.loads(content)
    except Exception:
        import re
        match = re.search(r'```json\\n(.*?)```', content, re.DOTALL)
        if match:
            entries = json.loads(match.group(1))
        else:
            raise
    now = datetime.now().isoformat()
    for e in entries:
        e['id'] = str(uuid.uuid4())
        e['retrieved_at'] = now
        e['created_at'] = now
        e['updated_at'] = now
        e['llm_response'] = content
    log_audit('bulk_sync_ot_threat_intel', 'system', {'source': 'openai', 'prompt': prompt})
    return entries

def main():
    provider = None
    if len(sys.argv) > 2 and sys.argv[1] == '--provider':
        provider = sys.argv[2]
    entries = fetch_openai_ot_threat_intel(provider=provider)
    new_count = 0
    for entry in entries:
        if save_ot_threat_intel(entry):
            new_count += 1
    print(json.dumps({'ok': True, 'new_entries': new_count}))

if __name__ == '__main__':
    if '--bulk-ot-threat-intel' in sys.argv:
        entries = fetch_bulk_openai_ot_threat_intel()
        new_count = 0
        for entry in entries:
            if save_ot_threat_intel(entry):
                new_count += 1
        print(json.dumps({'ok': True, 'new_entries': new_count}))
        sys.exit(0)
    main()
