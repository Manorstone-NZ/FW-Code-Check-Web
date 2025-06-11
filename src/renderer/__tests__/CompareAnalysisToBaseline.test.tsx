import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CompareAnalysisToBaseline from '../pages/CompareAnalysisToBaseline';
import { MemoryRouter } from 'react-router-dom';
import ComparisonsPage from '../pages/ComparisonsPage';
import Sidebar from '../components/Sidebar';

jest.mock('../utils/analysisApi', () => ({
  useBaselines: () => ({
    baselines: [
      { id: 1, fileName: 'baseline1.l5x', date: '2025-06-05' },
      { id: 2, fileName: 'baseline2.l5x', date: '2025-06-04' }
    ]
  }),
  getAnalysisById: async (id: number) => ({ id, fileName: 'analysis.l5x', foo: 'bar' }),
  getBaselineById: async (id: number) => ({ id, fileName: 'baseline1.l5x', foo: 'baz' }),
  llmCompareAnalysisToBaseline: jest.fn(async () => ({ llm_comparison: 'LLM says: These files are different.' }))
}));

describe('CompareAnalysisToBaseline', () => {
  it('renders baseline select', () => {
    render(<CompareAnalysisToBaseline analysisId={1} />);
    expect(screen.getByText('Select Baseline to Compare:')).toBeInTheDocument();
    expect(screen.getByText('baseline1.l5x (2025-06-05)')).toBeInTheDocument();
  });

  it('shows diff after selecting baseline', async () => {
    render(<CompareAnalysisToBaseline analysisId={1} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
    expect(await screen.findByText(/differ/i)).toBeInTheDocument();
  });

  it('calls LLM compare and displays result', async () => {
    render(<CompareAnalysisToBaseline analysisId={1} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
    await screen.findByText(/differ/i);
    fireEvent.click(screen.getByText(/LLM-Powered Detailed Comparison/i));
    expect(await screen.findByText(/LLM says:/i)).toBeInTheDocument();
  });

  it('renders LLM Markdown output with sections', async () => {
    jest.resetModules();
    jest.doMock('../utils/analysisApi', () => ({
      useBaselines: () => ({
        baselines: [
          { id: 1, fileName: 'baseline1.l5x', date: '2025-06-05' }
        ]
      }),
      getAnalysisById: async (id: number) => ({ id, fileName: 'analysis.l5x', foo: 'bar' }),
      getBaselineById: async (id: number) => ({ id, fileName: 'baseline1.l5x', foo: 'baz' }),
      llmCompareAnalysisToBaseline: jest.fn(async () => ({
        llm_comparison: '## Section 1\nContent 1\n## Section 2\nContent 2' }))
    }));
    const { default: CompareAnalysisToBaseline } = await import('../pages/CompareAnalysisToBaseline');
    render(<CompareAnalysisToBaseline analysisId={1} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
    await screen.findByText(/differ/i);
    fireEvent.click(screen.getByText(/LLM-Powered Detailed Comparison/i));
    expect(await screen.findByText('Section 1')).toBeInTheDocument();
    expect(await screen.findByText('Section 2')).toBeInTheDocument();
  });

  it('shows and selects from comparison history', async () => {
    jest.resetModules();
    jest.doMock('../utils/analysisApi', () => ({
      useBaselines: () => ({
        baselines: [
          { id: 1, fileName: 'baseline1.l5x', date: '2025-06-05' }
        ]
      }),
      getAnalysisById: async (id: number) => ({ id, fileName: 'analysis.l5x', foo: 'bar' }),
      getBaselineById: async (id: number) => ({ id, fileName: 'baseline1.l5x', foo: 'baz' }),
      llmCompareAnalysisToBaseline: jest.fn(async () => ({
        llm_comparison: '## Section 1\nContent 1' })),
      listComparisonHistory: async () => ([
        { id: 101, timestamp: '2025-06-05T12:00:00Z', llm_result: '## Old Section\nOld content' }
      ])
    }));
    const { default: CompareAnalysisToBaseline } = await import('../pages/CompareAnalysisToBaseline');
    render(<CompareAnalysisToBaseline analysisId={1} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
    await screen.findByText(/differ/i);
    fireEvent.click(screen.getByText(/LLM-Powered Detailed Comparison/i));
    fireEvent.click(screen.getByText(/Show Comparison History/i));
    expect(await screen.findByText(/Past Comparisons/i)).toBeInTheDocument();
    expect(await screen.findByText(/Old Section/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Old content/i));
    expect(await screen.findByText(/Old Section/i)).toBeInTheDocument();
  });
});

describe('ComparisonsPage', () => {
  it('renders and allows selection of analysis and baseline', async () => {
    render(
      <MemoryRouter>
        <ComparisonsPage />
      </MemoryRouter>
    );
    expect(screen.getByText('Comparison History')).toBeInTheDocument();
    expect(screen.getByText('Select Analysis')).toBeInTheDocument();
    expect(screen.getByText('Select Baseline')).toBeInTheDocument();
  });
});

describe('Sidebar navigation', () => {
  it('shows Comparisons link', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
    expect(screen.getByText('Comparisons')).toBeInTheDocument();
  });
});
