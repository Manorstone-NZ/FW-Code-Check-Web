#!/usr/bin/env node

/**
 * Test JSON Upload Improvements
 * 
 * This script tests the improved JSON upload functionality with better
 * validation, error messages, and LLM result extraction.
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Testing JSON Upload Improvements');
console.log('===================================');

// Updated extractLLMResult function (matching the improved React component)
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
  
  // Additional field variations to check
  if (!llm) {
    console.log('Checking additional field variations...');
    const additionalFields = [
      'analysis_result', 'result', 'response', 'content', 'output', 
      'analysis', 'report', 'findings', 'assessment', 'review',
      'llm_response', 'ai_analysis', 'security_analysis', 'plc_analysis'
    ];
    
    for (const field of additionalFields) {
      if (parsedAnalysis?.[field] && typeof parsedAnalysis[field] === 'string') {
        console.log(`Found content in parsedAnalysis.${field}`);
        llm = parsedAnalysis[field];
        break;
      }
      if (analysis?.[field] && typeof analysis[field] === 'string') {
        console.log(`Found content in analysis.${field}`);
        llm = analysis[field];
        break;
      }
    }
  }
  
  // If still not found, try to find a string value that looks like an LLM result
  if (!llm && parsedAnalysis && typeof parsedAnalysis === 'object') {
    console.log('Searching parsedAnalysis for LLM-like content...');
    for (const key of Object.keys(parsedAnalysis)) {
      const val = parsedAnalysis[key];
      if (typeof val === 'string' && val.length > 50 && // Ensure it's substantial content
        (val.includes('EXECUTIVE SUMMARY') || val.includes('CODE STRUCTURE & QUALITY REVIEW') || 
         val.includes('CYBER SECURITY KEY FINDINGS') || val.includes('SUMMARY') || 
         val.includes('ANALYSIS') || val.includes('FINDINGS') || val.includes('RECOMMENDATIONS') ||
         val.includes('VULNERABILITY') || val.includes('SECURITY') || val.includes('PLC'))
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
      if (typeof val === 'string' && val.length > 50 && // Ensure it's substantial content
        (val.includes('EXECUTIVE SUMMARY') || val.includes('CODE STRUCTURE & QUALITY REVIEW') || 
         val.includes('CYBER SECURITY KEY FINDINGS') || val.includes('SUMMARY') || 
         val.includes('ANALYSIS') || val.includes('FINDINGS') || val.includes('RECOMMENDATIONS') ||
         val.includes('VULNERABILITY') || val.includes('SECURITY') || val.includes('PLC'))
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
  
  // Final check: reject clearly non-analysis content
  if (llm && typeof llm === 'string') {
    console.log('Final validation check...');
    // Filter out generic rejection messages or very short content
    if (llm.includes("I'm sorry, but I can't assist with that request") ||
        llm.includes("I cannot provide assistance") ||
        llm.length < 20) {
      console.log('Rejected: Generic rejection message or too short');
      return null;
    }
  }
  
  const result = typeof llm === 'string' ? llm : null;
  console.log('Final result:', result ? `FOUND (${result.length} chars)` : 'NOT FOUND');
  
  return result;
};

// Improved validation function (matching the React component)
const validateAnalysisContent = (json) => {
  if (!json || typeof json !== 'object') {
    return { isValid: false, message: 'JSON is not a valid object.' };
  }
  
  // Check for direct LLM result fields
  const directFields = ['llm_results', 'llm_result', 'analysis_result', 'result', 'response', 'content'];
  for (const field of directFields) {
    if (json[field] && typeof json[field] === 'string' && json[field].length > 20) {
      // Check if it's a generic rejection message
      if (json[field].includes("I'm sorry, but I can't assist") || 
          json[field].includes("I cannot provide assistance")) {
        return { isValid: false, message: 'Found analysis field but contains rejection message.' };
      }
      return { isValid: true, message: 'Valid analysis content found.' };
    }
  }
  
  // Check for analysis_json field
  if (json.analysis_json) {
    try {
      const parsed = typeof json.analysis_json === 'string' ? 
        JSON.parse(json.analysis_json) : json.analysis_json;
      if (parsed.llm_results || parsed.llm_result || parsed.analysis_result) {
        return { isValid: true, message: 'Analysis content found in analysis_json field.' };
      }
    } catch (e) {
      // analysis_json is not valid JSON
    }
  }
  
  // Look for content that might be analysis-related
  const analysisKeywords = ['EXECUTIVE SUMMARY', 'CODE STRUCTURE', 'CYBER SECURITY', 'SUMMARY', 'ANALYSIS', 'FINDINGS', 'VULNERABILITY', 'SECURITY', 'PLC'];
  for (const key of Object.keys(json)) {
    const value = json[key];
    if (typeof value === 'string' && value.length > 50) {
      for (const keyword of analysisKeywords) {
        if (value.includes(keyword)) {
          return { isValid: true, message: `Analysis-like content found in field: ${key}` };
        }
      }
    }
  }
  
  // Check if this looks like a test result or other non-analysis JSON
  const nonAnalysisIndicators = [
    'numFailedTests', 'numPassedTests', 'testResults', // Jest test results
    'timestamp', 'status', 'completed', // Generic status objects
    'success', 'error', 'message' // Generic response objects
  ];
  
  const hasNonAnalysisFields = nonAnalysisIndicators.some(field => json.hasOwnProperty(field));
  if (hasNonAnalysisFields && Object.keys(json).length < 15) {
    return { isValid: false, message: 'This appears to be a test result or status file, not an analysis result.' };
  }
  
  return { isValid: false, message: 'No recognizable LLM analysis content found in this JSON.' };
};

// Test with enhanced scenarios, including problematic cases
const testCases = [
  {
    name: 'Valid Direct LLM Results',
    data: {
      llm_results: "SUMMARY\nThis is a test analysis with summary and findings.\n\nCYBER SECURITY KEY FINDINGS\nNo significant issues found."
    }
  },
  {
    name: 'Valid Analysis in Alternative Field',
    data: {
      analysis_result: "EXECUTIVE SUMMARY\nComprehensive security analysis completed.\n\nFINDINGS\nSeveral vulnerabilities identified requiring immediate attention."
    }
  },
  {
    name: 'Rejected Generic Message',
    data: {
      llm_results: "I'm sorry, but I can't assist with that request."
    }
  },
  {
    name: 'Very Short Content (Rejected)',
    data: {
      llm_results: "OK"
    }
  },
  {
    name: 'Test Result File (Should be flagged)',
    data: {
      numFailedTests: 1,
      numPassedTests: 5,
      testResults: [],
      success: false
    }
  },
  {
    name: 'Analysis with Alternative Naming',
    data: {
      security_analysis: "VULNERABILITY ASSESSMENT\nThe PLC code shows several security concerns that need addressing.\n\nRECOMMENDATIONS\nImplement access controls and input validation."
    }
  },
  {
    name: 'Nested Analysis in String',
    data: {
      analysis_json: JSON.stringify({
        ok: true,
        llm_results: "EXECUTIVE SUMMARY\nDetailed analysis of the PLC security posture.\n\nCYBER SECURITY KEY FINDINGS\nMultiple areas require attention."
      })
    }
  }
];

console.log('\n🧪 Testing Improved JSON Upload Scenarios');
console.log('==========================================');

testCases.forEach((testCase, index) => {
  console.log(`\n${index + 1}. Testing: ${testCase.name}`);
  console.log('Input structure:', JSON.stringify(testCase.data, null, 2).substring(0, 200) + '...');
  
  // Test validation
  const validation = validateAnalysisContent(testCase.data);
  console.log(`📋 Validation: ${validation.isValid ? '✅ VALID' : '❌ INVALID'}`);
  console.log(`📋 Message: ${validation.message}`);
  
  // Test extraction
  const result = extractLLMResult(testCase.data);
  
  if (result) {
    console.log(`🔍 Extraction: ✅ SUCCESS (${result.length} characters)`);
    console.log('Preview:', result.substring(0, 100) + '...');
  } else {
    console.log('🔍 Extraction: ❌ FAILED - would show improved "No LLM result found" message');
  }
});

// Test with real files
console.log('\n🔍 Testing with Real Files');
console.log('===========================');

const possibleAnalysisFiles = [
  'test_output.json',
  'analysisdetails-test-output.json'
];

for (const filename of possibleAnalysisFiles) {
  if (fs.existsSync(filename)) {
    console.log(`\nTesting with real file: ${filename}`);
    try {
      const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
      console.log('File structure keys:', Object.keys(data));
      
      const validation = validateAnalysisContent(data);
      console.log(`📋 Validation: ${validation.isValid ? '✅ VALID' : '❌ INVALID'}`);
      console.log(`📋 Message: ${validation.message}`);
      
      const result = extractLLMResult(data);
      if (result) {
        console.log(`🔍 Extraction: ✅ SUCCESS (${result.length} characters)`);
      } else {
        console.log('🔍 Extraction: ❌ FAILED - would show improved error message');
        console.log('Available fields for debugging:', Object.keys(data).join(', '));
      }
    } catch (e) {
      console.log(`❌ ERROR: Could not parse ${filename}:`, e.message);
    }
  }
}

console.log('\n📋 Summary of Improvements');
console.log('==========================');
console.log('✅ Enhanced LLM result extraction with more field variations');
console.log('✅ Better validation of JSON content before upload');
console.log('✅ Improved error messages with helpful feedback');
console.log('✅ Detection and filtering of generic rejection messages');
console.log('✅ Identification of test results vs analysis files');
console.log('✅ User-friendly display of available fields for debugging');

console.log('\n🎯 Next Steps for Users');
console.log('=======================');
console.log('1. Upload JSON files will now show validation warnings');
console.log('2. "No LLM result found" message now includes helpful guidance');
console.log('3. Users can see available fields in their JSON for debugging');
console.log('4. System better handles various analysis result formats');

console.log('\n✨ Testing complete!');
