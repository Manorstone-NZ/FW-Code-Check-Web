import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

// Mock useLLMStatus to simulate all LLM states
jest.mock('../utils/analysisApi', () => ({
  useLLMStatus: (interval: number) => ({ status: 'online', error: null, refresh: jest.fn() })
}));

describe('Sidebar (production behavior)', () => {
  it('renders all navigation links', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Upload')).toBeInTheDocument();
    expect(screen.getByText('Baselines')).toBeInTheDocument();
    expect(screen.getByText('Analysis')).toBeInTheDocument();
    expect(screen.getByText('Comparisons')).toBeInTheDocument();
    expect(screen.queryByText('LLM Log')).not.toBeInTheDocument();
  });

  it('shows LLM status as Online', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
    expect(screen.getByText(/LLM: Online/i)).toBeInTheDocument();
  });
});
