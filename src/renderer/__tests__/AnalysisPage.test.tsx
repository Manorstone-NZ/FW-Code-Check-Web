import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AnalysisPage from '../pages/AnalysisPage';

// Mock the analysisApi hook and methods
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

describe('AnalysisPage', () => {
  it('renders analyses table', () => {
    render(
      <MemoryRouter>
        <AnalysisPage />
      </MemoryRouter>
    );
    expect(screen.getByText('Analysis')).toBeInTheDocument();
    expect(screen.getByText('test1.l5x')).toBeInTheDocument();
    expect(screen.getByText('test2.l5x')).toBeInTheDocument();
  });

  it('renders analyses table with action buttons', () => {
    render(
      <MemoryRouter>
        <AnalysisPage />
      </MemoryRouter>
    );
    expect(screen.getByText('Analysis')).toBeInTheDocument();
    expect(screen.getByText('test1.l5x')).toBeInTheDocument();
    expect(screen.getByText('test2.l5x')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /view/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /delete/i }).length).toBeGreaterThan(0);
  });

  it('shows details when View is clicked', async () => {
    render(
      <MemoryRouter>
        <AnalysisPage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getAllByRole('button', { name: /view/i })[0]);
    await waitFor(() => expect(screen.getByText('Analysis Details')).toBeInTheDocument());
  });

  it('renders analysis table without compare column', () => {
    render(
      <MemoryRouter>
        <AnalysisPage />
      </MemoryRouter>
    );
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('File Name')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
    expect(screen.queryByText('Compare')).not.toBeInTheDocument();
  });

  it('shows loading state', () => {
    jest.resetModules();
    jest.doMock('../utils/analysisApi', () => ({
      useAnalyses: () => ({ analyses: [], loading: true, error: null, refresh: jest.fn() }),
      getAnalysisById: async (id: number) => ({ id, fileName: `test${id}.l5x`, date: '2025-06-05', status: 'complete' })
    }));
    const AnalysisPageReloaded = require('../pages/AnalysisPage').default;
    render(
      <MemoryRouter>
        <AnalysisPageReloaded />
      </MemoryRouter>
    );
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows error state', () => {
    jest.resetModules();
    jest.doMock('../utils/analysisApi', () => ({
      useAnalyses: () => ({ analyses: [], loading: false, error: 'Failed to load', refresh: jest.fn() }),
      getAnalysisById: async (id: number) => ({ id, fileName: `test${id}.l5x`, date: '2025-06-05', status: 'complete' })
    }));
    const AnalysisPageReloaded = require('../pages/AnalysisPage').default;
    render(
      <MemoryRouter>
        <AnalysisPageReloaded />
      </MemoryRouter>
    );
    expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
  });
});
