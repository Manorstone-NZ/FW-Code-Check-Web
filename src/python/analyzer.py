import os
import sys
import json
sys.path.append(os.path.dirname(__file__))

# --- OPENAI KEY LOADING LOGIC ---
def load_openai_key():
    key_path = os.path.join(os.path.dirname(__file__), '../../openai.key')
    if os.path.exists(key_path):
        with open(key_path) as f:
            key = f.read().strip()
            if key.startswith('OPENAI_API_KEY='):
                key = key.split('=', 1)[1].strip()
            os.environ['OPENAI_API_KEY'] = key
    # (dotenv can still be used for other config if needed)
    try:
        import yaml
        from config import load_config
        config = load_config()
        if config.get('openai_api_key'):
            os.environ['OPENAI_API_KEY'] = config['openai_api_key']
    except ImportError:
        pass

try:
    import openai
except ImportError:
    openai = None

from db import init_db, save_analysis
from logger import log_info, log_error
import datetime
import requests

LLM_LOG_PATH = os.path.join(os.path.dirname(__file__), '../../llm-interactions.log.json')

def log_llm_interaction(prompt, result, success):
    log_entry = {
        'timestamp': datetime.datetime.now().isoformat(),
        'prompt': prompt,
        'result': result,
        'success': success
    }
    try:
        if os.path.exists(LLM_LOG_PATH):
            with open(LLM_LOG_PATH, 'r', encoding='utf-8') as f:
                logs = json.load(f)
        else:
            logs = []
        logs.append(log_entry)
        with open(LLM_LOG_PATH, 'w', encoding='utf-8') as f:
            json.dump(logs, f, indent=2)
    except Exception as e:
        pass  # Don't crash on logging error

def check_openai_api():
    load_openai_key()
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        print('DEBUG: No OPENAI_API_KEY found', file=sys.stderr)
        return {'ok': False, 'error': 'OPENAI_API_KEY not set in openai.key, .env, or environment.'}
    if not openai:
        print('DEBUG: openai package not installed', file=sys.stderr)
        return {'ok': False, 'error': 'openai package not installed.'}
    try:
        client = openai.OpenAI(api_key=api_key)
        models = client.models.list()
        print(f'DEBUG: models fetched: {[m.id for m in models.data]}', file=sys.stderr)
        return {'ok': True, 'models': [m.id for m in models.data]}
    except Exception as e:
        print(f'DEBUG: Exception in check_openai_api: {e}', file=sys.stderr)
        return {'ok': False, 'error': str(e)}

def ollama_llm_query(prompt, model='llama3'):
    response = requests.post(
        'http://localhost:11434/api/generate',
        json={'model': model, 'prompt': prompt, 'stream': False}
    )
    return response.json()['response']

def llm_analysis(prompt, model="gpt-4o", provider=None):
    """
    provider: 'openai' (default), 'ollama', or None (uses env LLM_PROVIDER or defaults to openai)
    """
    provider = provider or os.environ.get('LLM_PROVIDER', 'openai').lower()
    if provider == 'ollama':
        try:
            return ollama_llm_query(prompt, model='llama3')
        except Exception as e:
            return {'error': f'Ollama error: {e}'}
    # Default: OpenAI
    if not os.environ.get('OPENAI_API_KEY'):
        load_openai_key()
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key or not openai:
        return {'error': 'OpenAI API key not set or openai package not installed.'}
    client = openai.OpenAI(api_key=api_key)
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "system", "content": "You are a senior control systems cybersecurity analyst specialising in industrial automation and PLC threat detection. You have deep expertise in Siemens PCS7/S7 environments, STL/SCL/LAD programming, and cyber-physical attack techniques targeting operational technology (OT) environments."},
                      {"role": "user", "content": prompt}],
            max_tokens=2048,
            temperature=0.2
        )
        return response.choices[0].message.content
    except Exception as e:
        return {'error': str(e)}

def ensure_analysis_fields(analysis):
    # Ensure all required fields and subfields are present
    analysis.setdefault('fileName', '')
    analysis.setdefault('report', {})
    analysis['report'].setdefault('category', {})
    cat = analysis['report']['category']
    cat.setdefault('description', '')
    cat.setdefault('findings', [])
    cat.setdefault('potential_issues', [])
    cat.setdefault('example_malicious_change', None)
    cat.setdefault('vulnerabilities', [])
    cat.setdefault('cyber_security_key_findings', '')
    cat.setdefault('general_structure_observations', '')
    cat.setdefault('code_structure_and_quality_review', '')
    cat.setdefault('implications_and_recommendations', '')
    cat.setdefault('next_steps', '')
    analysis.setdefault('vulnerabilities', [])
    analysis.setdefault('recommendations', [])
    analysis.setdefault('instruction_analysis', [])
    # LLM results must always be a string
    if 'llm_results' not in analysis or not isinstance(analysis['llm_results'], str):
        analysis['llm_results'] = ''
    return analysis

def main():
    if len(sys.argv) > 1 and sys.argv[1] == '--check-openai':
        try:
            result = check_openai_api()
            print(json.dumps(result))
        except Exception as e:
            print(json.dumps({'ok': False, 'error': str(e)}))
        return
    if len(sys.argv) > 1 and sys.argv[1] == '--init-db':
        try:
            init_db()
            log_info('Database initialized.')
            print(json.dumps({'ok': True, 'message': 'Database initialized.'}))
        except Exception as e:
            log_error(f'Database init failed: {e}')
            print(json.dumps({'ok': False, 'error': str(e)}))
        return
    if len(sys.argv) > 1 and sys.argv[1] == '--list-analyses':
        from db import list_analyses
        try:
            result = list_analyses()
            log_info('Listed analyses.')
            print(json.dumps(result))
        except Exception as e:
            log_error(f'List analyses failed: {e}')
            print(json.dumps({'ok': False, 'error': str(e)}))
        return
    if len(sys.argv) > 2 and sys.argv[1] == '--get-analysis':
        from db import get_analysis
        try:
            result = get_analysis(int(sys.argv[2]))
            log_info(f'Fetched analysis id={sys.argv[2]}')
            print(json.dumps(result))
        except Exception as e:
            log_error(f'Get analysis failed: {e}')
            print(json.dumps({'ok': False, 'error': str(e)}))
        return
    # LLM comparison mode
    if len(sys.argv) > 3 and sys.argv[1] == '--compare':
        analysis_path = sys.argv[2]
        baseline_path = sys.argv[3]
        provider = None
        if len(sys.argv) > 5 and sys.argv[4] == '--provider':
            provider = sys.argv[5]
        try:
            with open(analysis_path, 'r', encoding='utf-8') as f:
                analysis_content = f.read()
            with open(baseline_path, 'r', encoding='utf-8') as f:
                baseline_content = f.read()
        except Exception as e:
            print(json.dumps({'error': f'Failed to read files: {str(e)}'}))
            return
        llm_prompt = f'''
You are a senior control systems cybersecurity analyst. Compare the following two PLC code files in detail.

Respond ONLY in the following structured markdown format, using the exact section headers below, in this order. Each section must start with either '## Header' or '**Header**' (both are accepted). If a section has no relevant content, write "None" under the header. Use bullet points, subheaders, code blocks, and tables as appropriate for clarity and professional presentation.

---
ANALYSIS FILE:
{analysis_content[:4000]}
---
BASELINE FILE:
{baseline_content[:4000]}
---

Return your response in this canonical markdown structure:

## Overview
- Briefly summarize the main purpose and function of each file, and the context of the comparison.

## Structural Differences
- List and explain all differences in structure, organization, or layout between the two files (e.g., blocks, networks, routines, organization, naming, modularity).

## Logic Differences
- Detail all differences in logic, control flow, or instruction usage. Highlight any new, missing, or modified instructions, logic bombs, suspicious changes, or functional changes.

## Security and Risk Analysis
- Analyze all security-relevant differences, including potential vulnerabilities, unsafe logic, sabotage, or covert threats. Use bullet points and subheaders for each key finding.

## Key Risks and Recommendations
- Summarize the most important risks and provide actionable recommendations. Use a table if appropriate. List each risk and its recommended mitigation.

## Conclusion
- Provide a concise summary of the overall comparison, including any critical findings or next steps.

If a section has no content, write "None" under the header. Use markdown formatting throughout, and ensure all sections are present and clearly labeled.
'''
        llm_result = llm_analysis(llm_prompt, model="gpt-4o", provider=provider)
        # Log LLM interaction (comparison mode)
        try:
            log_llm_interaction(llm_prompt, llm_result, not (isinstance(llm_result, dict) and 'error' in llm_result))
        except Exception:
            pass
        print(json.dumps({'llm_comparison': llm_result}))
        from db import save_comparison_history
        # Try to extract analysisId and baselineId from file names if possible
        def extract_id_from_path(path):
            try:
                # Expecting .../analysis_<id>.json or .../baseline_<id>.json
                import re
                m = re.search(r'(?:analysis|baseline)[^0-9]*([0-9]+)', os.path.basename(path))
                return int(m.group(1)) if m else None
            except Exception:
                return None
        analysis_id = extract_id_from_path(analysis_path)
        baseline_id = extract_id_from_path(baseline_path)
        try:
            save_comparison_history(analysis_id, baseline_id, llm_prompt, llm_result)
        except Exception as e:
            log_error(f'Failed to save comparison history: {e}')
        return
    # If a file path is provided, read and analyze it
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
        provider = None
        # Check for --provider argument
        if len(sys.argv) > 3 and sys.argv[2] == '--provider':
            provider = sys.argv[3]
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                file_content = f.read()
        except Exception as e:
            log_error(f'Failed to read file {file_path}: {e}')
            print(json.dumps({'error': f'Failed to read file: {str(e)}'}))
            return
        # Rule-based analysis placeholder (reuse existing result)
        rule_based = {
            "fileName": file_path,
            "report": {
                "category": {
                    "description": "Sample description.",
                    "findings": ["No issues found."],
                    "potential_issues": [],
                    "example_malicious_change": None,
                    "vulnerabilities": []
                }
            },
            "vulnerabilities": [],
            "recommendations": ["Keep firmware updated."]
        }
        # Improved Python-friendly prompt
        llm_prompt = '''\
You are a senior control systems cybersecurity analyst specialising in industrial automation and PLC threat detection. You have deep expertise in Siemens PCS7/S7 environments, STL/SCL/LAD programming, and cyber-physical attack techniques targeting operational technology (OT) environments.

The following function block (FC540) from a Siemens PCS7 system is under investigation for any signs of **malicious logic, embedded threats, unsafe control logic, or suspicious code structures**.

You must perform a **complete forensic and quality analysis** of this logic to detect known and novel PLC-based threats. These may include logic bombs, sabotage, unauthorised overrides, covert control logic, payload hiding, and bad engineering practices that weaken system integrity or safety.

---

Respond ONLY in the following structured format. Be precise, professional, and concise. Your audience includes ICS engineers, cybersecurity analysts, and operations managers.

---

1. EXECUTIVE SUMMARY  
- Summarise the code's functional intent (if discernible)  
- Note any high-level safety or security concerns at a glance  

---

2. CYBER SECURITY KEY FINDINGS  
For each issue identified, provide:
- **Title**: Short description (e.g., "Runtime-triggered Logic Bomb")  
- **Location**: FC/FB number, network or STL line number  
- **Threat Behaviour**: Explain step-by-step what the code does  
- **Risk Level**: [Low, Medium, High, Critical]  
- **Impact**: Operational and/or safety consequences  
- **Mitigation**: How to neutralise or remove the threat  

You MUST check for:
- Hardcoded overrides (e.g., MOV or L/T instructions overwriting DBs or setpoints)
- Time-delayed triggers using counters, runtime, or process values
- Covert logic hidden in redundant branches or unused blocks
- Suppressed alarms (e.g., writing 0 to alarm bits or masking DB alarms)
- Memory marker misuse (e.g., hidden M-bit toggles or reserved bits)
- Persistence mechanisms or backdoors (e.g., uncalled FCs, reserved DB usage)
- Payload hiding (e.g., logic embedded in FBs called conditionally only once)
- Any logic that could damage equipment, affect product quality, or trigger false signals
- External command injection risk (e.g., inputs that override operator logic)
- Signature mismatches, version mismatches, or timestamp oddities
- Triggers that appear inactive but are activated via indirect markers

---

3. GENERAL STRUCTURE OBSERVATIONS  
- Outline code structure (FCs, DBs, reuse of FBs)  
- Comment on naming patterns, modularity, and clarity  
- Identify any undocumented or poorly explained elements  

---

4. CODE STRUCTURE & QUALITY REVIEW  
- Highlight issues like:
  - Unstructured memory access
  - Lack of symbolic addressing
  - Copy-paste logic or repetition
  - Poor naming conventions
  - Missing comments for key logic paths
  - Engineering anti-patterns that increase error risk  
- Suggest improvements for maintainability, auditability, and clarity

---

5. IMPLICATIONS AND RECOMMENDATIONS  
Provide a table:

| Risk | Description | Recommendation |

Ensure each row is unique, meaningful, and offers a specific mitigation or follow-up.

---

6. NEXT STEPS  
- Recommend immediate and mid-term actions, such as:
  - Isolate suspect logic
  - Perform logic diff against trusted baseline
  - Audit engineering workstation access and project files
  - Revalidate logic signatures and timestamps
  - Review linked FCs, OBs, and conditional FB calls
  - Conduct site-wide scan for similar patterns in other blocks

---

7. INSTRUCTION-LEVEL ANALYSIS (REQUIRED)  
Return a JSON array named `instruction_analysis` with this format:

[
  {
    "instruction": "<raw STL or SCL line>",
    "insight": "<plain-language description>",
    "risk_level": "<Low|Medium|High|Critical>"
  }
]

If a section has no relevant content, write "None".

Now analyse the following PCS7 Function Block logic (partial STL/SCL export):\n'''
        llm_prompt += file_content[:4000]
        llm_result = llm_analysis(llm_prompt, model="gpt-4o", provider=provider)
        # Log LLM interaction (main analysis mode)
        try:
            log_llm_interaction(llm_prompt, llm_result, not (isinstance(llm_result, dict) and 'error' in llm_result))
        except Exception:
            pass
        # Try to extract instruction_analysis JSON array if present in LLM result
        import re
        import ast
        instruction_analysis = []
        if isinstance(llm_result, str):
            # Try to extract JSON code block for instruction_analysis
            json_block = None
            json_match = re.search(r'```json\s*(\[.*?\])\s*```', llm_result, re.DOTALL)
            if json_match:
                json_block = json_match.group(1)
            else:
                # Fallback: look for instruction_analysis: [ ... ]
                match = re.search(r'instruction_analysis\s*[:=]\s*(\[.*?\])', llm_result, re.DOTALL)
                if match:
                    json_block = match.group(1)
            if json_block:
                try:
                    arr = ast.literal_eval(json_block)
                    if isinstance(arr, list):
                        instruction_analysis = arr
                except Exception:
                    try:
                        import json as _json
                        arr = _json.loads(json_block)
                        if isinstance(arr, list):
                            instruction_analysis = arr
                    except Exception:
                        pass
        rule_based['llm_results'] = llm_result
        rule_based['instruction_analysis'] = instruction_analysis
        analysis_result = ensure_analysis_fields(rule_based)
        result_obj = dict(analysis_result)
        result_obj['ok'] = True
        # Do NOT save automatically here; only return the result to the frontend
        print(json.dumps(result_obj))
        return
    print(json.dumps({'ok': False, 'error': 'No file specified for analysis.'}))

# Only load the key when running as main or when explicitly called
if __name__ == "__main__":
    load_openai_key()
    print(json.dumps({"cwd": os.getcwd(), "openai_key_present": bool(os.environ.get('OPENAI_API_KEY')), "openai_key_start": os.environ.get('OPENAI_API_KEY', '')[:8]}), file=sys.stderr)
    main()
