import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

describe('App', () => {
  test('renders error boundary on double Router', () => {
    render(<App />);
    expect(
      screen.getByText(/Something went wrong/i)
    ).toBeInTheDocument();
  });
});
