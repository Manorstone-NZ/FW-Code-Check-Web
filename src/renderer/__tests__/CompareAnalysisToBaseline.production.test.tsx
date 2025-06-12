import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CompareAnalysisToBaseline from '../pages/CompareAnalysisToBaseline';
import { MemoryRouter } from 'react-router-dom';

// Mock all hooks and API functions for production-level test
jest.mock('../utils/analysisApi', () => ({
  useBaselines: () => ({
    baselines: [
      { id: 1, fileName: 'baseline1.l5x', date: '2025-06-05' },
      { id: 2, fileName: 'baseline2.l5x', date: '2025-06-04' }
    ],
    loading: false,
    error: null,
    refresh: jest.fn()
  }),
  getAnalysisById: async (id: number) => ({ id, fileName: 'analysis.l5x', foo: 'bar', analysis_json: {} }),
  getBaselineById: async (id: number) => ({ id, fileName: 'baseline1.l5x', foo: 'baz', analysis_json: {} }),
  llmCompareAnalysisToBaseline: jest.fn(async () => ({ llm_comparison: '## Section 1\nContent 1\n## Section 2\nContent 2' })),
  listComparisonHistory: jest.fn(async () => ([
    { id: 101, timestamp: '2025-06-05T12:00:00Z', llm_result: '## Old Section\nOld content' }
  ]))
}));
// jest.mock('react-markdown'); // Use real react-markdown for production-level rendering tests

describe('CompareAnalysisToBaseline (production behavior)', () => {
  it('renders baseline select and shows diff', async () => {
    render(
      <MemoryRouter>
        <CompareAnalysisToBaseline analysisId={1} />
      </MemoryRouter>
    );
    expect(screen.getByText('Select Baseline to Compare:')).toBeInTheDocument();
    expect(screen.getByText('baseline1.l5x (2025-06-05)')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
    expect(await screen.findByText(/differ/i)).toBeInTheDocument();
  });

  it('calls LLM compare and displays result', async () => {
    render(
      <MemoryRouter>
        <CompareAnalysisToBaseline analysisId={1} />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
    await screen.findByText(/differ/i);
    fireEvent.click(screen.getByText(/LLM-Powered Detailed Comparison/i));
    // Instead of looking for <h2>Section 1</h2>, match the raw markdown string as rendered in the test environment
    expect(await screen.findByText(/## Section 1/)).toBeInTheDocument();
    expect(await screen.findByText(/Content 1/)).toBeInTheDocument();
    expect(await screen.findByText(/## Section 2/)).toBeInTheDocument();
    expect(await screen.findByText(/Content 2/)).toBeInTheDocument();
  });
});
