#!/usr/bin/env node

/**
 * Test JSON Upload Issue - "No LLM result found"
 * 
 * This script tests JSON upload functionality and diagnoses why 
 * uploaded JSON results return "No LLM result found"
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing JSON Upload Issue: "No LLM result found"');
console.log('===================================================');

// Simulate the extractLLMResult function from AnalysisDetails.tsx
const extractLLMResult = (analysis) => {
  console.log('\n--- extractLLMResult called ---');
  console.log('Input type:', typeof analysis);
  console.log('Input keys:', analysis && typeof analysis === 'object' ? Object.keys(analysis) : 'not an object');
  
  // First, handle the case where analysis_json is a string that needs parsing
  let parsedAnalysis = analysis;
  if (typeof analysis?.analysis_json === 'string') {
    console.log('Found analysis_json as string, parsing...');
    try {
      parsedAnalysis = JSON.parse(analysis.analysis_json);
      console.log('Successfully parsed analysis_json');
    } catch (e) {
      console.log('Failed to parse analysis_json:', e.message);
    }
  } else if (analysis?.analysis_json && typeof analysis.analysis_json === 'object') {
    console.log('Found analysis_json as object, using it');
    parsedAnalysis = analysis.analysis_json;
  }
  
  console.log('parsedAnalysis keys:', parsedAnalysis && typeof parsedAnalysis === 'object' ? Object.keys(parsedAnalysis) : 'not an object');
  
  // Try all possible locations for llm_results - prioritize the most common location
  let llm = parsedAnalysis?.llm_results
    || parsedAnalysis?.llm_result
    || analysis?.llm_results
    || analysis?.llm_result
    || analysis?.analysis_json?.llm_results
    || analysis?.analysis_json?.llm_result;
  
  console.log('Direct field extraction result:', llm ? 'FOUND' : 'NOT FOUND');
  
  // If still not found, try to find a string value in parsedAnalysis that looks like an LLM result
  if (!llm && parsedAnalysis && typeof parsedAnalysis === 'object') {
    console.log('Searching parsedAnalysis for LLM-like content...');
    for (const key of Object.keys(parsedAnalysis)) {
      const val = parsedAnalysis[key];
      if (typeof val === 'string' &&
        (val.includes('EXECUTIVE SUMMARY') || val.includes('CODE STRUCTURE & QUALITY REVIEW') || val.includes('CYBER SECURITY KEY FINDINGS') || val.includes('SUMMARY') || val.includes('ANALYSIS'))
      ) {
        console.log(`Found LLM-like content in key: ${key}`);
        llm = val;
        break;
      }
    }
  }
  
  // Fallback: check top-level keys for LLM result
  if (!llm && typeof analysis === 'object') {
    console.log('Searching top-level analysis for LLM-like content...');
    for (const key of Object.keys(analysis)) {
      const val = analysis[key];
      if (typeof val === 'string' &&
        (val.includes('EXECUTIVE SUMMARY') || val.includes('CODE STRUCTURE & QUALITY REVIEW') || val.includes('CYBER SECURITY KEY FINDINGS') || val.includes('SUMMARY') || val.includes('ANALYSIS'))
      ) {
        console.log(`Found LLM-like content in top-level key: ${key}`);
        llm = val;
        break;
      }
    }
  }
  
  // Patch: If llm_results is empty, try to parse filePath as JSON and extract llm_results from there
  if ((!llm || llm === "") && typeof analysis.filePath === "string") {
    console.log('Trying to parse filePath as JSON...');
    try {
      const parsed = JSON.parse(analysis.filePath);
      if (parsed && typeof parsed.llm_results === "string" && parsed.llm_results.length > 0) {
        console.log('Found llm_results in parsed filePath');
        llm = parsed.llm_results;
      }
    } catch (e) {
      console.log('Failed to parse filePath as JSON');
    }
  }
  
  const result = typeof llm === 'string' ? llm : null;
  console.log('Final result:', result ? `FOUND (${result.length} chars)` : 'NOT FOUND');
  
  return result;
};

// Test with various JSON structures that might be uploaded
const testCases = [
  {
    name: 'Direct LLM Results',
    data: {
      llm_results: "SUMMARY\nThis is a test analysis with summary and findings.\n\nCYBER SECURITY KEY FINDINGS\nNo significant issues found."
    }
  },
  {
    name: 'Analysis JSON String',
    data: {
      analysis_json: JSON.stringify({
        llm_results: "EXECUTIVE SUMMARY\nTest analysis result.\n\nCODE STRUCTURE & QUALITY REVIEW\nCode looks good."
      })
    }
  },
  {
    name: 'Analysis JSON Object',
    data: {
      analysis_json: {
        llm_results: "SUMMARY\nAnother test case.\n\nCYBER SECURITY KEY FINDINGS\nAll systems secure."
      }
    }
  },
  {
    name: 'Raw Analysis Result',
    data: {
      analysis_result: "EXECUTIVE SUMMARY\nDirect analysis result.\n\nCODE STRUCTURE & QUALITY REVIEW\nStructure is well organized."
    }
  },
  {
    name: 'Database-like Structure',
    data: {
      id: 1,
      fileName: "test.l5x",
      provider: "openai",
      model: "gpt-4",
      analysis_json: JSON.stringify({
        ok: true,
        analysis_type: "PLC Security Analysis",
        llm_results: "SUMMARY\nDatabase stored analysis.\n\nCYBER SECURITY KEY FINDINGS\nSecurity review complete."
      })
    }
  },
  {
    name: 'Problematic Case (No LLM Results)',
    data: {
      fileName: "test.l5x",
      timestamp: "2024-01-01",
      status: "completed"
    }
  },
  {
    name: 'Git Analysis Structure',
    data: {
      success: true,
      analysis_type: "PLC Security Analysis",
      git_metadata: {
        original_path: "test.l5x",
        branch: "main",
        analyzed_from_git: true
      },
      llm_results: "EXECUTIVE SUMMARY\nGit-based analysis.\n\nCYBER SECURITY KEY FINDINGS\nRepository analysis complete."
    }
  }
];

console.log('\n🧪 Testing JSON Upload Scenarios');
console.log('=================================');

testCases.forEach((testCase, index) => {
  console.log(`\n${index + 1}. Testing: ${testCase.name}`);
  console.log('Input structure:', JSON.stringify(testCase.data, null, 2).substring(0, 200) + '...');
  
  const result = extractLLMResult(testCase.data);
  
  if (result) {
    console.log(`✅ SUCCESS: Found LLM result (${result.length} characters)`);
    console.log('Preview:', result.substring(0, 100) + '...');
  } else {
    console.log('❌ FAILED: No LLM result found - would show "No LLM result found."');
  }
});

// Test with a real analysis file if it exists
console.log('\n🔍 Testing with Real Analysis Files');
console.log('===================================');

const possibleAnalysisFiles = [
  'test_output.json',
  'analysisdetails-test-output.json',
  'sample-analysis.json'
];

for (const filename of possibleAnalysisFiles) {
  if (fs.existsSync(filename)) {
    console.log(`\nTesting with real file: ${filename}`);
    try {
      const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
      console.log('File structure keys:', Object.keys(data));
      
      const result = extractLLMResult(data);
      if (result) {
        console.log(`✅ SUCCESS: Real file analysis works (${result.length} characters)`);
      } else {
        console.log('❌ FAILED: Real file would show "No LLM result found."');
        console.log('File contents preview:', JSON.stringify(data, null, 2).substring(0, 300) + '...');
      }
    } catch (e) {
      console.log(`❌ ERROR: Could not parse ${filename}:`, e.message);
    }
  }
}

console.log('\n📋 Summary and Recommendations');
console.log('==============================');
console.log('The "No LLM result found" error occurs when:');
console.log('1. JSON structure doesn\'t have llm_results or llm_result fields');
console.log('2. analysis_json field contains string that needs parsing');
console.log('3. LLM content is stored in unexpected field names');
console.log('4. JSON doesn\'t contain any recognizable LLM analysis content');

console.log('\n💡 Potential Solutions:');
console.log('1. Improve extractLLMResult function to handle more field variations');
console.log('2. Add better error messaging about expected JSON structure');
console.log('3. Provide JSON upload validation with helpful feedback');
console.log('4. Show users what fields are available in their uploaded JSON');

console.log('\n🔧 Next Steps:');
console.log('1. Identify the exact JSON structure being uploaded by users');
console.log('2. Update extractLLMResult to handle that structure');
console.log('3. Add validation and helpful error messages for JSON uploads');
console.log('4. Test with real user JSON files');

console.log('\n✨ Testing complete!');
