import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';
import { BrowserRouter } from 'react-router-dom';

describe('App', () => {
  test('renders welcome message', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    expect(
      screen.getByText(/Welcome to First Watch PLC Code Checker/i)
    ).toBeInTheDocument();
  });
});
