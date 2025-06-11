import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';

jest.mock('../utils/analysisApi', () => ({
  useAnalyses: () => ({
    analyses: [
      {
        id: 1,
        fileName: 'test.l5x',
        date: '2025-06-05',
        status: 'complete',
        analysis_json: {
          vulnerabilities: ['Vuln1', 'Vuln2'],
          instruction_analysis: [
            { instruction: 'MOV', insight: 'Moves value', risk_level: 'Low' },
            { instruction: 'ALARM_OFF', insight: 'Disables alarm', risk_level: 'High' },
            { instruction: 'NOP', insight: 'No operation', risk_level: 'Medium' }
          ]
        }
      }
    ],
    loading: false,
    error: null
  }),
  useBaselines: () => ({ baselines: [{ id: 1, fileName: 'baseline.l5x', date: '2025-06-01', originalName: 'baseline.l5x' }], loading: false, error: null })
}));

describe('Dashboard', () => {
  it('renders metrics and buttons with correct styles', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    // Metrics (use getAllByText for repeated labels)
    expect(screen.getAllByText('Analyses').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Baselines').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Vulnerabilities').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Risks').length).toBeGreaterThan(0);
    // Chart values (use getAllByText for repeated numbers)
    expect(screen.getAllByText('1').length).toBeGreaterThan(1); // Analyses & Baselines
    expect(screen.getAllByText('2').length).toBeGreaterThan(1); // Vulnerabilities & Risks (High + Medium)
    // Main action buttons
    const uploadBtn = screen.getByRole('button', { name: /upload new file/i });
    expect(uploadBtn).toHaveClass('h-10', 'min-w-[130px]', 'px-6', 'py-2', 'rounded-lg', 'font-semibold', 'flex', 'items-center', 'justify-center');
    const baselineBtn = screen.getByRole('button', { name: /manage baselines/i });
    expect(baselineBtn).toHaveClass('h-10', 'min-w-[130px]', 'px-6', 'py-2', 'rounded-lg', 'font-semibold', 'flex', 'items-center', 'justify-center');
    const compareBtn = screen.getByRole('button', { name: /compare files/i });
    expect(compareBtn).toHaveClass('h-10', 'min-w-[130px]', 'px-6', 'py-2', 'rounded-lg', 'font-semibold', 'flex', 'items-center', 'justify-center');
    const llmlogBtn = screen.getByRole('button', { name: /llm log/i });
    expect(llmlogBtn).toHaveClass('h-10', 'min-w-[130px]', 'px-6', 'py-2', 'rounded-lg', 'font-semibold', 'flex', 'items-center', 'justify-center');
  });
});
