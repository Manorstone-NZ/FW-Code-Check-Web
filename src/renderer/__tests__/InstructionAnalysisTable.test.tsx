import * as React from 'react';
import { render, screen } from '@testing-library/react';
import InstructionAnalysisTable from '../components/InstructionAnalysisTable';

describe('InstructionAnalysisTable', () => {
  it('renders table headers and rows correctly', () => {
    const data = [
      { instruction: 'MOV A, B', insight: 'Moves value', risk_level: 'Low' },
      { instruction: 'ALARM_OFF', insight: 'Disables alarm', risk_level: 'High' },
      { instruction: 'NOP', insight: 'No operation', risk_level: 'Medium' },
    ];
    render(<InstructionAnalysisTable data={data} />);
    expect(screen.getByText('Instruction')).toBeInTheDocument();
    expect(screen.getByText('Insight')).toBeInTheDocument();
    expect(screen.getByText('Risk Level')).toBeInTheDocument();
    expect(screen.getByText('MOV A, B')).toBeInTheDocument();
    expect(screen.getByText('Moves value')).toBeInTheDocument();
    expect(screen.getByText('Low')).toBeInTheDocument();
    expect(screen.getByText('ALARM_OFF')).toBeInTheDocument();
    expect(screen.getByText('Disables alarm')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('NOP')).toBeInTheDocument();
    expect(screen.getByText('No operation')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  it('renders empty state if no data', () => {
    render(<InstructionAnalysisTable data={[]} />);
    expect(screen.getByText(/Instruction/i)).toBeInTheDocument();
    // Should not render any rows
    expect(screen.queryByText('Low')).not.toBeInTheDocument();
    expect(screen.queryByText('High')).not.toBeInTheDocument();
    expect(screen.queryByText('Medium')).not.toBeInTheDocument();
  });
});
