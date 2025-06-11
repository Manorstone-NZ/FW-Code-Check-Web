import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BaselinesPage from '../pages/BaselinesPage';

jest.mock('../utils/analysisApi', () => ({
  useBaselines: () => ({
    baselines: [
      { id: 1, fileName: 'baseline1.l5x', originalName: 'orig1.l5x', date: '2025-06-05' },
      { id: 2, fileName: 'baseline2.l5x', originalName: 'orig2.l5x', date: '2025-06-04' }
    ],
    loading: false,
    error: null,
    refresh: jest.fn()
  }),
  getBaselineById: async (id: number) => ({ id, fileName: `baseline${id}.l5x`, originalName: `orig${id}.l5x`, date: '2025-06-05' }),
  deleteBaseline: async (id: number) => true
}));

describe('BaselinesPage', () => {
  it('renders baselines table', () => {
    render(<BaselinesPage />);
    expect(screen.getByText('Baselines')).toBeInTheDocument();
    expect(screen.getByText('baseline1.l5x')).toBeInTheDocument();
    expect(screen.getByText('baseline2.l5x')).toBeInTheDocument();
  });

  it('shows details when View is clicked', async () => {
    render(<BaselinesPage />);
    fireEvent.click(screen.getAllByText('View')[0]);
    await waitFor(() => expect(screen.getByText('Baseline Details')).toBeInTheDocument());
  });
});
