const { spawn } = require('child_process');
const path = require('path');

// Test the save-comparison-history functionality
function testSaveComparison() {
  console.log('=== TESTING SAVE COMPARISON WITH PROVIDER/MODEL ===');
  
  const py = spawn('python3', [
    path.join(__dirname, 'src/python/db.py'), 
    '--save-comparison-history',
    'null', // analysisId
    'null', // baselineId  
    'test prompt', // llm_prompt
    'test result with HIGH severity findings', // llm_result
    'test-analysis.txt', // analysisFileName
    'test-baseline.txt', // baselineFileName
    'openai', // provider
    'gpt-4o' // model
  ], {
    cwd: __dirname,
    env: process.env
  });
  
  let data = '';
  py.stdout.on('data', (chunk) => { data += chunk; });
  py.stderr.on('data', (err) => { console.error('Error:', err.toString()); });
  
  py.on('close', () => {
    try {
      const result = JSON.parse(data);
      console.log('Save result:', result);
      
      if (result.ok) {
        console.log(`✅ Successfully saved comparison with ID: ${result.id}`);
        
        // Now test retrieval
        const listPy = spawn('python3', [
          path.join(__dirname, 'src/python/db.py'), 
          '--list-comparison-history'
        ], {
          cwd: __dirname,
          env: process.env
        });
        
        let listData = '';
        listPy.stdout.on('data', (chunk) => { listData += chunk; });
        listPy.on('close', () => {
          try {
            const comparisons = JSON.parse(listData);
            const latest = comparisons[0];
            
            console.log('\nLatest comparison record:');
            console.log('- ID:', latest.id);
            console.log('- Analysis File:', latest.analysisFileName);
            console.log('- Baseline File:', latest.baselineFileName);
            console.log('- Provider:', latest.provider);
            console.log('- Model:', latest.model);
            console.log('- Timestamp:', latest.timestamp);
            
            if (latest.provider === 'openai' && latest.model === 'gpt-4o') {
              console.log('\n✅ PROVIDER AND MODEL CORRECTLY SAVED AND RETRIEVED');
            } else {
              console.log('\n❌ Provider/Model not correctly saved');
            }
          } catch (e) {
            console.error('Error parsing list result:', e);
          }
        });
      } else {
        console.log('❌ Failed to save comparison');
      }
    } catch (e) {
      console.error('Error parsing save result:', e);
    }
  });
}

testSaveComparison();
