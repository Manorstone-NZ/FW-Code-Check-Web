import '@testing-library/jest-dom';

// Polyfill for TextEncoder for React Router/Jest
import { TextEncoder } from 'util';
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}

// Global Jest setup for Electron preload mocks
beforeAll(() => {
  // Use type assertion to avoid TS errors about window shape
  (global as any).window = (global as any).window || {};
  if (!(window as any).electron) {
    (window as any).electron = {
      invoke: jest.fn().mockResolvedValue({}),
    };
  }
});
