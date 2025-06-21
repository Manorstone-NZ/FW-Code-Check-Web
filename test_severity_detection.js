const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Enhanced severity detection function (same as in ComparisonsPage)
const detectSeverity = (resultText) => {
  if (!resultText) return 'N/A';
  
  const text = resultText.toLowerCase();
  
  // Define severity patterns with weights
  const severityPatterns = {
    critical: [
      /\bcritical\b/g,
      /\bsevere\b/g,
      /\bimmediate threat\b/g,
      /\bsystem compromise\b/g,
      /\bcatastrophic\b/g,
      /\bemergency\b/g
    ],
    high: [
      /\bhigh\b/g,
      /\bsignificant\b/g,
      /\bmajor threat\b/g,
      /\bvulnerability\b/g,
      /\bdata tampering\b/g,
      /\bunauthorized access\b/g,
      /\bsecurity breach\b/g,
      /\bmalicious\b/g
    ],
    medium: [
      /\bmedium\b/g,
      /\bmoderate\b/g,
      /\bpotential threat\b/g,
      /\bsuspicious\b/g,
      /\bwarning\b/g,
      /\bconcern\b/g
    ],
    low: [
      /\blow\b/g,
      /\bminor\b/g,
      /\blow risk\b/g,
      /\bno significant threat\b/g,
      /\bminimal impact\b/g
    ]
  };
  
  // Count matches for each severity level
  const severityCounts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  };
  
  Object.entries(severityPatterns).forEach(([level, patterns]) => {
    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        severityCounts[level] += matches.length;
      }
    });
  });
  
  // Additional context-based scoring
  if (text.includes('compromise') || text.includes('attack')) severityCounts.critical += 1;
  if (text.includes('risk') && text.includes('security')) severityCounts.high += 1;
  if (text.includes('review') && text.includes('audit')) severityCounts.medium += 1;
  
  // Determine final severity based on highest count
  const maxCount = Math.max(...Object.values(severityCounts));
  if (maxCount === 0) return 'N/A';
  
  if (severityCounts.critical === maxCount) return 'Critical';
  if (severityCounts.high === maxCount) return 'High';
  if (severityCounts.medium === maxCount) return 'Medium';
  if (severityCounts.low === maxCount) return 'Low';
  
  return 'N/A';
};

// Test severity detection with actual Ollama data
const dbPath = path.join(__dirname, 'firstwatch.db');
const db = new sqlite3.Database(dbPath);

db.all("SELECT id, provider, model, llm_result FROM comparison_history WHERE provider = 'ollama' ORDER BY id DESC", (err, rows) => {
  if (err) {
    console.error('Database error:', err);
    return;
  }
  
  console.log('=== TESTING SEVERITY DETECTION WITH OLLAMA RESULTS ===');
  
  rows.forEach(row => {
    const severity = detectSeverity(row.llm_result);
    console.log(`\nRecord ID: ${row.id}`);
    console.log(`Provider: ${row.provider}`);
    console.log(`Model: ${row.model}`);
    console.log(`Detected Severity: ${severity}`);
    console.log(`Content preview: ${row.llm_result.substring(0, 200)}...`);
    
    // Show some key phrases found
    const text = row.llm_result.toLowerCase();
    const keyPhrases = [
      'critical', 'high', 'medium', 'low', 'vulnerability', 'data tampering', 
      'security', 'risk', 'malicious', 'compromise', 'threat'
    ];
    const foundPhrases = keyPhrases.filter(phrase => text.includes(phrase));
    console.log(`Key phrases found: ${foundPhrases.join(', ') || 'none'}`);
  });
  
  db.close();
});
