import * as React from 'react';
import { render, screen } from '@testing-library/react';
import Sidebar from '../components/Sidebar';
import { MemoryRouter } from 'react-router-dom';

describe('Sidebar', () => {
  beforeEach(() => {
    // @ts-ignore
    window.electron = { invoke: jest.fn() };
  });

  it('renders the First Watch logo', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
    expect(screen.getByAltText('First Watch Logo')).toBeInTheDocument();
  });

  it('highlights the active nav item', () => {
    render(
      <MemoryRouter initialEntries={['/baselines']}>
        <Sidebar />
      </MemoryRouter>
    );
    const baselines = screen.getByText('Baselines');
    expect(baselines.closest('a')).toHaveClass('bg-white');
  });

  it('shows LLM status indicator (online)', async () => {
    // @ts-ignore
    window.electron.invoke.mockResolvedValueOnce({ ok: true });
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
    expect(await screen.findByText(/LLM: Online/i)).toBeInTheDocument();
  });

  it('shows LLM status indicator (offline)', async () => {
    // @ts-ignore
    window.electron.invoke.mockResolvedValueOnce({ ok: false, error: 'No key' });
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
    expect(await screen.findByText(/LLM: Offline/i)).toBeInTheDocument();
  });

  it('renders Comparisons link', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
    expect(screen.getByText('Comparisons')).toBeInTheDocument();
  });
});
