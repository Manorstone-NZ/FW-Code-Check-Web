import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

describe('App', () => {
  test('renders login page', () => {
    render(<App />);
    expect(
      screen.getByText(/Secure PLC Code Analysis Platform/i)
    ).toBeInTheDocument();
  });
});
