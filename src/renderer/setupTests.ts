import '@testing-library/jest-dom';

// Polyfill for TextEncoder for React Router/Jest
import { TextEncoder } from 'util';
if (global.TextEncoder === undefined) {
  global.TextEncoder = TextEncoder;
}
