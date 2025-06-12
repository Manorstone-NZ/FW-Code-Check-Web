import unittest
import os
import sys
import json
from unittest import mock
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../src/python')))
import analyzer

class TestLLMOfflineIntegration(unittest.TestCase):
    def test_main_llm_offline_returns_error(self):
        # Simulate no OpenAI key and no openai package
        with mock.patch.dict(os.environ, {}, clear=True):
            with mock.patch('analyzer.openai', None):
                # Create a dummy PLC file
                test_file = 'testfile.txt'
                with open(test_file, 'w') as f:
                    f.write('TEST PLC CODE')
                try:
                    # Redirect stdout to capture output
                    from io import StringIO
                    import contextlib
                    output = StringIO()
                    with contextlib.redirect_stdout(output):
                        sys_argv = analyzer.sys.argv
                        analyzer.sys.argv = ['analyzer.py', test_file]
                        analyzer.main()
                        analyzer.sys.argv = sys_argv
                    result = json.loads(output.getvalue().strip().split('\n')[-1])
                    self.assertIn('llm_results', result)
                    self.assertTrue(isinstance(result['llm_results'], str))
                    self.assertTrue('error' in result['llm_results'].lower() or result['llm_results'] == '')
                    # New: instruction_analysis should always be present and a list
                    self.assertIn('instruction_analysis', result)
                    self.assertIsInstance(result['instruction_analysis'], list)
                finally:
                    os.remove(test_file)

if __name__ == '__main__':
    unittest.main()
