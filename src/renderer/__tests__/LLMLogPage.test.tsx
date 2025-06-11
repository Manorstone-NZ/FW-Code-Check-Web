import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import LLMLogPage from '../pages/LLMLogPage';

// Mock window.electron.invoke
beforeAll(() => {
  // @ts-ignore
  window.electron = { invoke: jest.fn() };
});

afterEach(() => {
  // @ts-ignore
  window.electron.invoke.mockReset();
});

describe('LLMLogPage', () => {
  it('renders single-line summaries and expands to show details', async () => {
    // @ts-ignore
    window.electron.invoke.mockResolvedValue([
      { id: 1, timestamp: '2025-06-05T12:00:00Z', prompt: 'Prompt1', result: 'Result1', success: true },
      { id: 2, timestamp: '2025-06-05T12:01:00Z', prompt: 'Prompt2', result: { error: 'fail' }, success: false }
    ]);
    await act(async () => {
      render(<LLMLogPage />);
    });
    expect(screen.getByText(/LLM Interaction Log/i)).toBeInTheDocument();
    expect(screen.getByText('Result1')).toBeInTheDocument(); // summary
    expect(screen.getByText('fail')).toBeInTheDocument(); // summary
    // Expand first
    await act(async () => {
      screen.getAllByText('View')[0].click();
    });
    expect(screen.getByText(/Prompt1/)).toBeInTheDocument();
    // Use getAllByText for Result1 since it appears in both summary and details
    expect(screen.getAllByText(/Result1/).length).toBeGreaterThan(1);
    // Collapse
    await act(async () => {
      screen.getAllByText('Hide')[0].click();
    });
    expect(screen.queryByText(/Prompt1/)).not.toBeInTheDocument();
    expect(screen.queryAllByText(/Result1/)[0]).toBeInTheDocument();
  });

  it('shows error if log fetch fails', async () => {
    // @ts-ignore
    window.electron.invoke.mockRejectedValue(new Error('fail to load'));
    await act(async () => {
      render(<LLMLogPage />);
    });
    await waitFor(() => expect(screen.getByText(/fail to load/i)).toBeInTheDocument());
  });

  it('shows empty state if no logs', async () => {
    // @ts-ignore
    window.electron.invoke.mockResolvedValue([]);
    await act(async () => {
      render(<LLMLogPage />);
    });
    await waitFor(() => expect(screen.getByText(/No LLM interactions logged yet/i)).toBeInTheDocument());
  });
});
