import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FileUploader from '../components/FileUploader';
import AnalysisDetails from '../components/AnalysisDetails';

describe('FileUploader', () => {
  it('renders upload UI', () => {
    render(<FileUploader />);
    expect(screen.getByText('Upload PLC Files')).toBeInTheDocument();
    expect(screen.getByText(/Drag and drop/)).toBeInTheDocument();
  });

  it('renders analysis details with all structured LLM sections and subfields', () => {
    // Simulate a result as would be returned from backend
    const mockResult = {
      llm_results: `1. EXECUTIVE SUMMARY\nThis is a summary.\n\n2. CYBER SECURITY KEY FINDINGS\n- **Title**: Logic Bomb\n- **Location**: FC540, NW10\n- **Step-by-Step Breakdown**: Triggers after 100 hours.\n- **Risk Level**: Critical\n- **Impact**: Plant shutdown.\n- **Suggested Mitigation**: Remove logic.\n\n3. GENERAL STRUCTURE OBSERVATIONS\nBlock uses FCs, DBs, and memory markers.\n\n4. IMPLICATIONS AND RECOMMENDATIONS\n| Risk | Description | Recommendation |\n|------|-------------|----------------|\n| Logic Bomb | Triggers after 100h | Remove logic, audit all FCs |\n\n5. NEXT STEPS\nAudit all FCs, review change logs.\n\n6. INSTRUCTION-LEVEL ANALYSIS (REQUIRED)\ninstruction_analysis: [ { "instruction": "A M20.0", "insight": "Checks memory marker", "risk_level": "Medium" } ]`,
      vulnerabilities: [],
      recommendations: [],
      instruction_analysis: [
        { instruction: 'A M20.0', insight: 'Checks memory marker', risk_level: 'Medium' }
      ]
    };
    render(<AnalysisDetails analysis={{
      fileName: 'test.l5x',
      status: 'complete',
      date: '2025-06-05',
      analysis_json: mockResult
    }} />);
    // Should render the exact required section headings
    expect(screen.getByText('EXECUTIVE SUMMARY')).toBeInTheDocument();
    expect(screen.getByText('CYBER SECURITY KEY FINDINGS')).toBeInTheDocument();
    expect(screen.getByText('GENERAL STRUCTURE OBSERVATIONS')).toBeInTheDocument();
    expect(screen.getByText('IMPLICATIONS AND RECOMMENDATIONS')).toBeInTheDocument();
    expect(screen.getByText('NEXT STEPS')).toBeInTheDocument();
    expect(screen.getByText('Instruction-level Security Analysis')).toBeInTheDocument();
    expect(screen.getByText('A M20.0')).toBeInTheDocument();
    expect(screen.getByText('Checks memory marker')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  it('renders instruction-level analysis section if present', () => {
    const mockResult = {
      llm_results: 'SUMMARY\nThis is a summary.',
      vulnerabilities: [],
      recommendations: [],
      instruction_analysis: [
        { instruction: 'MOV A, B', insight: 'Moves value, no risk', risk_level: 'Low' }
      ]
    };
    render(<AnalysisDetails analysis={{
      fileName: 'test.l5x',
      status: 'complete',
      date: '2025-06-05',
      analysis_json: mockResult
    }} />);
    expect(screen.getByText('Instruction-level Security Analysis')).toBeInTheDocument();
    expect(screen.getByText('MOV A, B')).toBeInTheDocument();
    expect(screen.getByText('Moves value, no risk')).toBeInTheDocument();
    expect(screen.getByText('Low')).toBeInTheDocument();
  });

  it('renders instruction-level analysis section even if empty', () => {
    const mockResult = {
      llm_results: 'SUMMARY\nThis is a summary.',
      vulnerabilities: [],
      recommendations: [],
      instruction_analysis: []
    };
    render(<AnalysisDetails analysis={{
      fileName: 'test.l5x',
      status: 'complete',
      date: '2025-06-05',
      analysis_json: mockResult
    }} />);
    expect(screen.getByText('Instruction-level Security Analysis')).toBeInTheDocument();
    expect(screen.getByText('No instruction-level analysis available.')).toBeInTheDocument();
  });
});
