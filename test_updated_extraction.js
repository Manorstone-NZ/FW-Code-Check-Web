const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Updated extractLLMResult function (matching the React component)
function extractLLMResult(analysis) {
  console.log('extractLLMResult called with analysis keys:', analysis ? Object.keys(analysis) : 'none');
  
  // First, handle the case where analysis_json is a string that needs parsing
  let parsedAnalysis = analysis;
  if (typeof analysis?.analysis_json === 'string') {
    try {
      parsedAnalysis = JSON.parse(analysis.analysis_json);
      console.log('extractLLMResult parsed analysis_json string');
    } catch (e) {
      console.log('extractLLMResult failed to parse analysis_json as JSON');
    }
  } else if (analysis?.analysis_json && typeof analysis.analysis_json === 'object') {
    parsedAnalysis = analysis.analysis_json;
  }
  
  // Try all possible locations for llm_results - prioritize the most common location
  let llm = parsedAnalysis?.llm_results
    || parsedAnalysis?.llm_result
    || analysis?.llm_results
    || analysis?.llm_result
    || analysis?.analysis_json?.llm_results
    || analysis?.analysis_json?.llm_result;
    
  console.log('extractLLMResult initial extraction result:', llm ? 'FOUND' : 'NOT FOUND');
  
  const result = typeof llm === 'string' ? llm : null;
  console.log('extractLLMResult final result length:', result ? result.length : 0);
  return result;
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
  
  console.log('=== TESTING UPDATED EXTRACTION LOGIC ===');
  console.log('Database record:');
  console.log('- ID:', row.id);
  console.log('- fileName:', row.fileName);
  console.log('- provider:', row.provider);
  console.log('- model:', row.model);
  console.log('- analysis_json length:', row.analysis_json ? row.analysis_json.length : 0);
  
  if (row.analysis_json) {
    // Simulate the same structure that React component receives
    const analysisStructure = {
      id: row.id,
      fileName: row.fileName,
      provider: row.provider,
      model: row.model,
      analysis_json: row.analysis_json // This is the string from DB
    };
    
    console.log('\n--- Testing Updated LLM Extraction ---');
    const extractedLLM = extractLLMResult(analysisStructure);
    console.log('Extraction SUCCESS:', extractedLLM ? 'YES' : 'NO');
    if (extractedLLM) {
      console.log('Extracted LLM result length:', extractedLLM.length);
      console.log('First 200 chars:', extractedLLM.substring(0, 200) + '...');
    }
  }
  
  db.close();
});
