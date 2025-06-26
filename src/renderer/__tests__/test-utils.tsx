/**
 * Test utilities and mocks for First Watch PLC Code Checker
 * This file provides shared testing utilities and mock implementations
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';

// Mock window.electronAPI
Object.defineProperty(window, 'electronAPI', {
  value: {},
  writable: true,
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  role: 'user',
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockAnalysis = (overrides = {}) => ({
  id: 1,
  filename: 'test.L5X',
  analysis_text: 'Test analysis results',
  created_at: '2024-01-01T00:00:00Z',
  user_id: 1,
  file_size: 1024,
  security_issues: [
    { type: 'warning', message: 'Test security issue' }
  ],
  ...overrides,
});

export const createMockBaseline = (overrides = {}) => ({
  id: 1,
  name: 'Test Baseline',
  description: 'Test baseline description',
  analysis_id: 1,
  created_at: '2024-01-01T00:00:00Z',
  user_id: 1,
  ...overrides,
});

export const createMockSession = (overrides = {}) => ({
  id: 1,
  token: 'test-session-token-123',
  user_id: 1,
  created_at: '2024-01-01T00:00:00Z',
  expires_at: '2024-01-02T00:00:00Z',
  ...overrides,
});

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'queries'> {
  initialEntries?: string[];
  user?: any;
}

export const renderWithProviders = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { initialEntries = ['/'], user, ...renderOptions } = options;

  // Mock initial auth state if user provided
  if (user) {
    localStorageMock.setItem('session_token', 'test-token');
  }

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BrowserRouter>
        <AuthProvider>
          {children}
        </AuthProvider>
      </BrowserRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Mock successful API responses
export const setupSuccessfulMocks = () => {
  const mockUser = createMockUser();
  const mockAnalysis = createMockAnalysis();
  const mockBaseline = createMockBaseline();
  const mockSession = createMockSession();

  return {
    mockUser,
    mockAnalysis,
    mockBaseline,
    mockSession,
  };
};

// Mock failed API responses
export const setupFailedMocks = (errorMessage = 'Test error') => {
  const errorResponse = {
    success: false,
    error: errorMessage,
  };

  Object.keys(mockElectronAPI).forEach((key) => {
    (mockElectronAPI as any)[key].mockResolvedValue(errorResponse);
  });
};

// Reset all mocks
export const resetAllMocks = () => {
  Object.keys(mockElectronAPI).forEach((key) => {
    (mockElectronAPI as any)[key].mockReset();
  });
  localStorageMock.clear();
};

// Export mock API for direct access in tests
export { mockElectronAPI };

export default {
  renderWithProviders,
  setupSuccessfulMocks,
  setupFailedMocks,
  resetAllMocks,
  mockElectronAPI,
  createMockUser,
  createMockAnalysis,
  createMockBaseline,
  createMockSession,
};
