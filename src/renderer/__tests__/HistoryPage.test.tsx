import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HistoryPage from '../pages/HistoryPage';

jest.mock('../utils/analysisApi', () => ({
  useAnalyses: () => ({
    analyses: [
      { id: 1, fileName: 'test1.l5x', date: '2025-06-05', status: 'complete' },
      { id: 2, fileName: 'test2.l5x', date: '2025-06-04', status: 'complete' }
    ],
    loading: false,
    error: null,
    refresh: jest.fn()
  }),
  getAnalysisById: async (id: number) => ({ id, fileName: `test${id}.l5x`, date: '2025-06-05', status: 'complete' })
}));

describe('HistoryPage', () => {
  it('renders analyses table', () => {
    render(<HistoryPage />);
    expect(screen.getByText('Analysis History')).toBeInTheDocument();
    expect(screen.getByText('test1.l5x')).toBeInTheDocument();
    expect(screen.getByText('test2.l5x')).toBeInTheDocument();
  });

  it('renders analyses table with action buttons', () => {
    render(<HistoryPage />);
    expect(screen.getByText('Analysis History')).toBeInTheDocument();
    expect(screen.getByText('test1.l5x')).toBeInTheDocument();
    expect(screen.getByText('test2.l5x')).toBeInTheDocument();
    // Check for action buttons using role and accessible name for reliability
    expect(screen.getAllByRole('button', { name: /view/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /delete/i }).length).toBeGreaterThan(0);
  });

  it('shows details when View is clicked', async () => {
    render(<HistoryPage />);
    fireEvent.click(screen.getAllByRole('button', { name: /view/i })[0]);
    await waitFor(() => expect(screen.getByText('Analysis Details')).toBeInTheDocument());
  });

  it('renders analysis table without compare column', () => {
    render(<HistoryPage />);
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('File Name')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
    expect(screen.queryByText('Compare')).not.toBeInTheDocument();
  });
});
