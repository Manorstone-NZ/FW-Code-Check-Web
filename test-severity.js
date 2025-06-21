// Test the enhanced severity detection function
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
      /\bemergency\b/g,
      /\bexploit\b/g,
      /\battacker\b/g,
      /\bcompromise\b/g
    ],
    high: [
      /\bhigh\b/g,
      /\bsignificant\b/g,
      /\bmajor threat\b/g,
      /\bvulnerabilit(y|ies)\b/g,
      /\bdata tampering\b/g,
      /\bunauthorized access\b/g,
      /\bsecurity breach\b/g,
      /\bmalicious\b/g,
      /\bsecurity risk\b/g,
      /\bsignificant.*risk\b/g,
      /\bsignificant.*security\b/g,
      /\bpotential.*exploit\b/g,
      /\bsuppress.*alarm\b/g,
      /\bhide.*malicious\b/g
    ],
    medium: [
      /\bmedium\b/g,
      /\bmoderate\b/g,
      /\bpotential threat\b/g,
      /\bsuspicious\b/g,
      /\bwarning\b/g,
      /\bconcern\b/g,
      /\breview\b/g,
      /\bmonitoring\b/g
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
  
  // Enhanced context-based scoring for OpenAI structured outputs
  // Look for security analysis sections and risk indicators
  if (text.includes('security and risk analysis') || text.includes('key risks')) {
    severityCounts.high += 2; // Boost for structured risk analysis
  }
  
  // Multiple risk indicators suggest higher severity
  const riskCount = (text.match(/\brisk\b/g) || []).length;
  const securityCount = (text.match(/\bsecurity\b/g) || []).length;
  
  if (riskCount >= 3 && securityCount >= 2) {
    severityCounts.high += 2;
  } else if (riskCount >= 2) {
    severityCounts.medium += 1;
  }
  
  // OpenAI often uses phrases like "introduces...risk" or "poses...risk"
  if (text.includes('introduces') && text.includes('risk')) severityCounts.high += 1;
  if (text.includes('poses') && text.includes('risk')) severityCounts.high += 1;
  if (text.includes('exploited') || text.includes('exploitation')) severityCounts.critical += 1;
  
  // Recommendations section indicates actionable security concerns
  if (text.includes('recommendations') || text.includes('mitigate')) {
    severityCounts.high += 1;
  }
  
  console.log('Severity counts:', severityCounts);
  
  // Determine final severity based on highest count
  const maxCount = Math.max(...Object.values(severityCounts));
  if (maxCount === 0) return 'N/A';
  
  if (severityCounts.critical === maxCount) return 'Critical';
  if (severityCounts.high === maxCount) return 'High';
  if (severityCounts.medium === maxCount) return 'Medium';
  if (severityCounts.low === maxCount) return 'Low';
  
  return 'N/A';
};

// Test with the actual OpenAI content
const openaiContent = `## Overview
- **Analysis File**: This file represents a modified version of the PLC code for a Siemens PCS7/S7 environment, specifically for OB35, a cyclic interrupt block. It includes additional logic for alarm handling and device group calling.
- **Baseline File**: This file serves as the original or reference version of the PLC code for OB35, focusing on device group calling and switch mapping logic without additional alarm handling.

## Structural Differences
- **Networks**:
  - The Analysis File contains additional networks (Network 2, 3, 4, and 5) compared to the Baseline File.
  - The Baseline File has a Network 4 dedicated to "CALLING OF GROUP DEVICE LOGIC," which is absent in the Analysis File.
- **Function Calls**:
  - The Analysis File includes calls to alarm function blocks and additional device group calls not present in the Baseline File.

## Logic Differences
- **Alarm Handling**:
  - The Analysis File introduces logic to handle alarms, including a mechanism to skip alarm function block calls based on an attacker-controlled bit (M1.0).
  - It includes logic to force alarm acknowledgment and reset, which is not present in the Baseline File.
- **Device Group Calls**:
  - The Analysis File calls fewer device group logic functions compared to the Baseline File, which includes calls to additional device group logic functions (e.g., FC 525 to FC 527 and FC 535).

## Security and Risk Analysis
- **Alarm Skipping**:
  - The use of an attacker-controlled bit (M1.0) to skip alarm function block calls introduces a significant security risk, allowing potential attackers to suppress alarms.
- **Forced Alarm Acknowledgment**:
  - The logic to force alarm acknowledgment and reset could be exploited to hide malicious activities by automatically clearing alarms without operator intervention.
- **Missing Device Logic Calls**:
  - The absence of certain device group logic calls in the Analysis File may indicate tampering or incomplete functionality, potentially leading to operational issues.

## Key Risks and Recommendations
| Risk                                      | Recommendation                                      |
|-------------------------------------------|-----------------------------------------------------|
| Alarm suppression via attacker-controlled bit | Implement access controls and monitoring for critical bits like M1.0. |
| Automatic alarm acknowledgment and reset  | Review and restrict logic that forces alarm acknowledgment to ensure operator awareness. |
| Missing device group logic calls          | Verify the completeness of device logic calls to ensure all necessary functions are executed. |

## Conclusion
- The Analysis File introduces significant changes to the alarm handling logic, including potential vulnerabilities such as alarm suppression and forced acknowledgment. These changes pose security risks that could be exploited by attackers to disrupt operations or conceal malicious activities. It is crucial to review these modifications and implement appropriate security measures to mitigate the identified risks.`;

console.log('=== TESTING ENHANCED SEVERITY DETECTION ===');
console.log('Testing OpenAI content...');
const result = detectSeverity(openaiContent);
console.log('Final severity result:', result);
console.log('Expected: High (due to significant security risk, vulnerabilities, malicious, exploited, key risks, etc.)');

// Test with some simple cases too
console.log('\n=== TESTING SIMPLE CASES ===');
console.log('Testing "This is a critical vulnerability":', detectSeverity('This is a critical vulnerability'));
console.log('Testing "High severity risk":', detectSeverity('High severity risk'));
console.log('Testing "Medium threat level":', detectSeverity('Medium threat level'));
console.log('Testing "Low risk detected":', detectSeverity('Low risk detected'));
console.log('Testing "No issues found":', detectSeverity('No issues found'));
