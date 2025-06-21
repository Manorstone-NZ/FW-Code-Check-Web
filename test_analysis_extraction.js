const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Mock the extractLLMResult function from AnalysisDetails
function extractLLMResult(analysis) {
  console.log('Extracting LLM result from:', typeof analysis);
  
  if (!analysis) {
    console.log('No analysis provided');
    return null;
  }

  // If analysis is a string, try to parse it
  if (typeof analysis === 'string') {
    console.log('Analysis is string, trying to parse JSON');
    try {
      analysis = JSON.parse(analysis);
      console.log('Successfully parsed JSON');
    } catch (e) {
      console.log('Failed to parse JSON, treating as raw text');
      return analysis;
    }
  }

  console.log('Analysis object keys:', Object.keys(analysis));

  // Check specifically for llm_results which was found in the test
  if (analysis.llm_results) {
    console.log('Found llm_results:', typeof analysis.llm_results);
    console.log('llm_results content preview:', analysis.llm_results.substring ? analysis.llm_results.substring(0, 200) : 'not a string');
    return analysis.llm_results;
  }

  // Try different possible locations for LLM result
  const possiblePaths = [
    'llm_result',
    'analysis',
    'result',
    'llm_analysis',
    'content',
    'response'
  ];

  for (const path of possiblePaths) {
    if (analysis[path]) {
      console.log(`Found LLM result at path: ${path}`);
      return typeof analysis[path] === 'string' ? analysis[path] : JSON.stringify(analysis[path], null, 2);
    }
  }

  console.log('No LLM result found in standard paths, returning full analysis');
  return typeof analysis === 'string' ? analysis : JSON.stringify(analysis, null, 2);
}

// Test with real database data
const dbPath = path.join(__dirname, 'firstwatch.db');
const db = new sqlite3.Database(dbPath);

db.get("SELECT * FROM analyses WHERE id = 9", (err, row) => {
  if (err) {
    console.error('Database error:', err);
    return;
  }
  
  if (!row) {
    console.log('No record found');
    return;
  }
  
  console.log('Database record:');
  console.log('- ID:', row.id);
  console.log('- fileName:', row.fileName);
  console.log('- provider:', row.provider);
  console.log('- model:', row.model);
  console.log('- analysis_json length:', row.analysis_json ? row.analysis_json.length : 0);
  
  if (row.analysis_json) {
    console.log('\n--- Testing LLM extraction ---');
    const extractedLLM = extractLLMResult(row.analysis_json);
    console.log('Extracted LLM result length:', extractedLLM ? extractedLLM.length : 0);
    console.log('First 200 chars:', extractedLLM ? extractedLLM.substring(0, 200) + '...' : 'none');
  }
  
  db.close();
});
