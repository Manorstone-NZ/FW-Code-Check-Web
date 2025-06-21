const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Simulate the getAnalysisHistory function from analysisApi.ts
function getAnalysisHistory() {
  return new Promise((resolve, reject) => {
    const dbPath = path.join(__dirname, 'firstwatch.db');
    const db = new sqlite3.Database(dbPath);
    
    db.all("SELECT * FROM analyses ORDER BY date DESC", (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Simulate the data structure that would be returned by the API
      const analysisHistory = rows.map(row => ({
        id: row.id,
        fileName: row.fileName,
        date: row.date,
        status: row.status,
        provider: row.provider,
        model: row.model,
        analysis_json: row.analysis_json
      }));
      
      resolve(analysisHistory);
      db.close();
    });
  });
}

// Simulate the extractLLMResult function from AnalysisDetails
function extractLLMResult(analysis) {
  let parsedAnalysis = analysis;
  if (typeof analysis?.analysis_json === 'string') {
    try {
      parsedAnalysis = JSON.parse(analysis.analysis_json);
    } catch (e) {
      console.log('Failed to parse analysis_json');
      return null;
    }
  }
  
  return parsedAnalysis?.llm_results || null;
}

// Test the complete flow
async function testAnalysisPageFlow() {
  console.log('=== TESTING COMPLETE ANALYSIS PAGE FLOW ===');
  
  try {
    const analysisHistory = await getAnalysisHistory();
    console.log(`Found ${analysisHistory.length} analysis records`);
    
    if (analysisHistory.length > 0) {
      const latestAnalysis = analysisHistory[0];
      console.log('\nLatest Analysis:');
      console.log('- ID:', latestAnalysis.id);
      console.log('- File:', latestAnalysis.fileName);
      console.log('- Provider:', latestAnalysis.provider);
      console.log('- Model:', latestAnalysis.model);
      console.log('- Date:', latestAnalysis.date);
      
      // Test LLM extraction
      const llmResult = extractLLMResult(latestAnalysis);
      console.log('\nLLM Extraction Result:');
      console.log('- Success:', llmResult ? 'YES' : 'NO');
      console.log('- Length:', llmResult ? llmResult.length : 0);
      
      if (llmResult) {
        console.log('- Preview:', llmResult.substring(0, 100) + '...');
        
        // Test if it contains expected sections
        const hasExecutiveSummary = llmResult.includes('EXECUTIVE SUMMARY');
        const hasCyberFindings = llmResult.includes('CYBER SECURITY KEY FINDINGS');
        const hasCodeReview = llmResult.includes('CODE STRUCTURE & QUALITY REVIEW');
        
        console.log('\nContent Analysis:');
        console.log('- Has Executive Summary:', hasExecutiveSummary);
        console.log('- Has Cyber Security Findings:', hasCyberFindings);
        console.log('- Has Code Review:', hasCodeReview);
        
        if (hasExecutiveSummary || hasCyberFindings || hasCodeReview) {
          console.log('\n✅ ANALYSIS PAGE SHOULD DISPLAY RESULTS CORRECTLY');
        } else {
          console.log('\n⚠️  LLM result found but may not have expected sections');
        }
      } else {
        console.log('\n❌ NO LLM RESULT FOUND - Analysis page will show "No LLM result found"');
      }
    } else {
      console.log('\n❌ NO ANALYSIS RECORDS FOUND');
    }
  } catch (error) {
    console.error('Error testing analysis flow:', error);
  }
}

testAnalysisPageFlow();
