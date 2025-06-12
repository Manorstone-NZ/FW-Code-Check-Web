import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AnalysisPage from '../pages/AnalysisPage';
import AnalysisDetails from '../components/AnalysisDetails';

// Mock the analysisApi to simulate backend/database
jest.mock('../utils/analysisApi', () => {
  const actual = jest.requireActual('../utils/analysisApi');
  return {
    ...actual,
    useAnalyses: () => ({
      analyses: [
        {
          id: 1,
          fileName: 'llmtest.l5x',
          date: '2025-06-12',
          status: 'complete',
          analysis_json: {
            llm_results: '1. EXECUTIVE SUMMARY\nThis is a test summary from LLM.',
            instruction_analysis: [
              { instruction: 'MOV A, B', insight: 'Moves value', risk_level: 'Low' },
              { instruction: 'ALARM_OFF', insight: 'Disables alarm', risk_level: 'High' }
            ],
            vulnerabilities: [],
            recommendations: [],
            report: { category: {} }
          }
        }
      ],
      loading: false,
      error: null,
      refresh: jest.fn()
    }),
    getAnalysisById: async (id: number) => ({
      id,
      fileName: 'llmtest.l5x',
      date: '2025-06-12',
      status: 'complete',
      analysis_json: {
        llm_results: '1. EXECUTIVE SUMMARY\nThis is a test summary from LLM.',
        instruction_analysis: [
          { instruction: 'MOV A, B', insight: 'Moves value', risk_level: 'Low' },
          { instruction: 'ALARM_OFF', insight: 'Disables alarm', risk_level: 'High' }
        ],
        vulnerabilities: [],
        recommendations: [],
        report: { category: {} }
      }
    })
  };
});

describe('LLM Analysis Database Integration', () => {
  it('writes and recalls LLM response for an analysis', async () => {
    render(
      <MemoryRouter>
        <AnalysisPage />
      </MemoryRouter>
    );
    // Find and click the View button for the analysis
    const viewBtn = screen.getAllByRole('button', { name: /view/i })[0];
    fireEvent.click(viewBtn);
    // Wait for the details to appear
    await waitFor(() => {
      // LLM Results should be visible in the details
      expect(screen.getByText(/executive summary/i)).toBeInTheDocument();
      expect(screen.getByText(/test summary from llm/i)).toBeInTheDocument();
    });
  });
});
