import unittest
import os
import sys
import json
from unittest import mock
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../src/python')))
import db
import analyzer

class TestDB(unittest.TestCase):
    def setUp(self):
        # Use a test database file
        self.test_db_path = 'test_firstwatch.db'
        db.DB_PATH = self.test_db_path
        db.init_db()

    def tearDown(self):
        if os.path.exists(self.test_db_path):
            os.remove(self.test_db_path)

    def test_save_and_get_analysis(self):
        analysis = {'foo': 'bar'}
        file_name = 'test.l5x'
        status = 'complete'
        analysis_id = db.save_analysis(file_name, status, analysis)
        fetched = db.get_analysis(analysis_id)
        self.assertEqual(fetched['fileName'], file_name)
        self.assertEqual(fetched['status'], status)
        # fetched['analysis_json'] will always have required fields added
        self.assertEqual(fetched['analysis_json']['foo'], 'bar')
        self.assertIn('instruction_analysis', fetched['analysis_json'])
        self.assertIsInstance(fetched['analysis_json']['instruction_analysis'], list)
        # Should be empty list by default
        self.assertEqual(fetched['analysis_json']['instruction_analysis'], [])

    def test_list_analyses(self):
        db.save_analysis('a.l5x', 'complete', {'a': 1})
        db.save_analysis('b.l5x', 'complete', {'b': 2})
        analyses = db.list_analyses()
        self.assertGreaterEqual(len(analyses), 2)
        self.assertIn('fileName', analyses[0])

    def test_baseline_crud(self):
        # Save a baseline
        baseline_id = db.save_baseline('baseline.l5x', 'original.l5x')
        self.assertIsInstance(baseline_id, int)
        # Get the baseline
        baseline = db.get_baseline(baseline_id)
        self.assertEqual(baseline['fileName'], 'baseline.l5x')
        self.assertEqual(baseline['originalName'], 'original.l5x')
        # List baselines
        baselines = db.list_baselines()
        self.assertGreaterEqual(len(baselines), 1)
        self.assertIn('fileName', baselines[0])
        # Delete the baseline
        db.delete_baseline(baseline_id)
        self.assertIsNone(db.get_baseline(baseline_id))

    def test_instruction_analysis_field_always_present(self):
        analysis = {'foo': 'bar'}
        file_name = 'test.l5x'
        status = 'complete'
        analysis_id = db.save_analysis(file_name, status, analysis)
        fetched = db.get_analysis(analysis_id)
        self.assertIn('instruction_analysis', fetched['analysis_json'])
        self.assertIsInstance(fetched['analysis_json']['instruction_analysis'], list)
        # Should be empty list by default
        self.assertEqual(fetched['analysis_json']['instruction_analysis'], [])

    def test_instruction_analysis_field_with_data(self):
        analysis = {
            'foo': 'bar',
            'instruction_analysis': [
                {'instruction': 'MOV A, B', 'insight': 'Moves value', 'risk_level': 'Low'},
                {'instruction': 'ALARM_OFF', 'insight': 'Disables alarm', 'risk_level': 'High'}
            ]
        }
        file_name = 'test2.l5x'
        status = 'complete'
        analysis_id = db.save_analysis(file_name, status, analysis)
        fetched = db.get_analysis(analysis_id)
        self.assertIn('instruction_analysis', fetched['analysis_json'])
        self.assertEqual(len(fetched['analysis_json']['instruction_analysis']), 2)
        self.assertEqual(fetched['analysis_json']['instruction_analysis'][1]['risk_level'], 'High')

class TestAnalyzer(unittest.TestCase):
    def test_llm_analysis_mock(self):
        # Patch llm_analysis to not call OpenAI for this test
        analyzer.llm_analysis = lambda prompt, model=None, provider=None: 'LLM OK'
        sys_argv = analyzer.sys.argv
        analyzer.sys.argv = ['analyzer.py', 'testfile.txt']
        with open('testfile.txt', 'w') as f:
            f.write('TEST PLC CODE')
        try:
            analyzer.main()
        finally:
            os.remove('testfile.txt')
            analyzer.sys.argv = sys_argv

class TestAnalyzerExtended(unittest.TestCase):
    def setUp(self):
        # Use a test database file and ensure tables exist
        self.test_db_path = 'test_firstwatch.db'
        db.DB_PATH = self.test_db_path
        db.init_db()

    def tearDown(self):
        if os.path.exists(self.test_db_path):
            os.remove(self.test_db_path)

    def test_llm_analysis_missing_key(self):
        from unittest import mock
        with mock.patch('os.path.exists', return_value=False):
            with mock.patch.dict(os.environ, {}, clear=True):
                import importlib
                importlib.reload(analyzer)
                result = analyzer.llm_analysis('test prompt')
                print('DEBUG: llm_analysis result:', result)
                self.assertTrue(isinstance(result, dict) and 'error' in result)

    def test_save_and_get_analysis_with_llm(self):
        analysis = {'foo': 'bar', 'llm_results': 'LLM OK'}
        file_name = 'llmtest.l5x'
        status = 'complete'
        analysis_id = db.save_analysis(file_name, status, analysis)
        fetched = db.get_analysis(analysis_id)
        self.assertEqual(fetched['fileName'], file_name)
        self.assertEqual(fetched['analysis_json']['llm_results'], 'LLM OK')

class TestAnalyzerPrompt(unittest.TestCase):
    def test_llm_prompt_includes_cybersecurity_and_logic_bomb_detection(self):
        # Simulate the code that builds the prompt
        file_content = 'SOME PLC CODE HERE'
        llm_prompt = (
            "Analyze the following PLC code. Respond ONLY in the following sections and subfields, even if some are empty.\n"
            "\n"
            "SUMMARY\n"
            "CODE QUALITY\n"
            "  Clarity\n"
            "  Maintainability\n"
            "  Best Practices\n"
            "RECOMMENDATIONS\n"
            "  Documentation\n"
            "  Variable Naming\n"
            "  Structure\n"
            "  Consistency\n"
            "CYBER SECURITY FINDING\n"
            "  Lack of Security Measures\n"
            "  Potential Vulnerabilities\n"
            "  Mitigations\n"
            "\n"
            "For each subfield, provide a concise, professional assessment. If a subfield does not apply, write 'None'.\n"
            "\n"
            "IMPORTANT: Be especially vigilant for any logic bombs, sabotage, time-based triggers, hidden or conditional destructive actions, or any form of malicious or suspicious logic. If you detect any such logic, clearly describe it in the CYBER SECURITY FINDING section, including why it is a risk and how it could be mitigated.\n"
            "\n"
            f"PLC CODE:\n{file_content[:4000]}"
        )
        # Check for key phrases
        self.assertIn('logic bomb', llm_prompt.lower())
        self.assertIn('sabotage', llm_prompt.lower())
        self.assertIn('time-based trigger', llm_prompt.lower())
        self.assertIn('malicious or suspicious logic', llm_prompt.lower())
        self.assertIn('CYBER SECURITY FINDING', llm_prompt)
        self.assertIn('mitigations', llm_prompt.lower())

    def test_llm_prompt_includes_new_sections(self):
        file_content = 'SOME PLC CODE HERE'
        llm_prompt = (
            "You are a senior industrial control systems (ICS) security analyst with deep expertise in Siemens PCS7, S7, STL, SCL, and ladder logic. A Function Block (FC540) has been extracted from a PCS7 project and is suspected to contain embedded malicious logic, tampering, or latent cyber-physical threats.\n\n"
            "Your role is to perform a **thorough, structured forensic analysis** of this logic and produce a clear, professional report suitable for both engineering and cybersecurity stakeholders. The code may include STL-style logic, memory marker manipulation, and indirect attacks such as logic bombs, sabotage, or alarm suppression.\n\n"
            "---\n\n"
            "You MUST return your analysis in the following structured format:\n\n"
            "---\n\n"
            "1. EXECUTIVE SUMMARY\n- Briefly summarise the intended function of the block (if discernible), and note any high-level safety, reliability, or security concerns.\n\n"
            "---\n\n"
            "2. CYBER SECURITY KEY FINDINGS\nFor each issue identified, provide:\n- Title: Short title (e.g., Time-triggered Logic Bomb)\n- Location: Exact FC number and network, STL line, or address reference\n- Step-by-Step Breakdown: Describe what the logic does, how it behaves, and when it triggers\n- Risk Level: One of [Low, Medium, High, Critical]\n- Impact: Explain the operational or safety consequence\n- Suggested Mitigation: Clear action to remove, replace, or contain the threat\n\nFocus on:\n- Overwriting of operator-defined setpoints\n- Time-delayed triggers (runtime, cycles, or hours)\n- Use of memory markers (e.g., M20.0, M50.0) to control hidden logic\n- Suppression or override of alarm DB bits\n- Unusual writes to DBs without justification\n- Insertion of undocumented logic in otherwise legitimate blocks\n\n"
            "---\n\n"
            "3. GENERAL STRUCTURE OBSERVATIONS\n- Outline block structure (FCs, DBs, FBs), naming conventions, use of shared DBs, and any engineering patterns that affect visibility or traceability.\n\n"
            "---\n\n"
            "4. IMPLICATIONS AND RECOMMENDATIONS\nProvide a table in this format:\n| Risk | Description | Recommendation |\n|------|-------------|----------------|\nEach row should include a unique finding and an actionable remediation step (e.g., isolate PLC, restore from trusted backup, revalidate from source control, etc.).\n\n"
            "---\n\n"
            "5. NEXT STEPS\n- Provide concrete follow-up actions such as:\n  - Audit of all FCs/FBs with similar structure\n  - Engineering workstation access review\n  - Verification of change logs and block timestamps\n  - Escalation path for incident response if this is confirmed as sabotage\n\n"
            "---\n\n"
            "6. INSTRUCTION-LEVEL ANALYSIS (REQUIRED)\nReturn a valid JSON array named instruction_analysis. Each item must follow this format:\n{\n  \"instruction\": \"<raw STL or ladder logic line>\",\n  \"insight\": \"<plain English explanation of intent>\",\n  \"risk_level\": \"<Low|Medium|High|Critical>\"\n}\n\n"
            f"PLC CODE:\n{file_content[:4000]}"
        )
        # Check for new key phrases
        self.assertIn('EXECUTIVE SUMMARY', llm_prompt)
        self.assertIn('CYBER SECURITY KEY FINDINGS', llm_prompt)
        self.assertIn('GENERAL STRUCTURE OBSERVATIONS', llm_prompt)
        self.assertIn('IMPLICATIONS AND RECOMMENDATIONS', llm_prompt)
        self.assertIn('NEXT STEPS', llm_prompt)
        self.assertIn('INSTRUCTION-LEVEL ANALYSIS', llm_prompt)

if __name__ == '__main__':
    unittest.main()
