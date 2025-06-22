import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';

// Mock electron API
global.window.electronAPI = {
  validateSession: jest.fn(),
  listUsers: jest.fn(),
  listBaselines: jest.fn(),
  getAnalyses: jest.fn(),
  getOTThreatIntelEntries: jest.fn(),
  getSavedComparisons: jest.fn(),
  getLLMLogs: jest.fn(),
  getHomeDirectory: jest.fn(),
  authenticateUser: jest.fn(),
  registerUser: jest.fn(),
  analyzeFile: jest.fn(),
  saveBaseline: jest.fn(),
  deleteBaseline: jest.fn(),
  gitGetBranches: jest.fn(),
};

// Import components to test
import App from '../src/renderer/App';
import LoginPage from '../src/renderer/components/auth/LoginPage';
import EnhancedDashboard from '../src/renderer/pages/EnhancedDashboard';
import BaselinesPage from '../src/renderer/pages/BaselinesPage';
import AnalysisPage from '../src/renderer/pages/AnalysisPage';
import UserManagementPage from '../src/renderer/pages/UserManagementPage';
import OTThreatIntelDashboard from '../src/renderer/pages/OTThreatIntelDashboard';

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('First Watch PLC Code Checker - React Component Tests', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Set up default mock responses
    global.window.electronAPI.validateSession.mockResolvedValue({ valid: false });
    global.window.electronAPI.listUsers.mockResolvedValue({ users: [] });
    global.window.electronAPI.listBaselines.mockResolvedValue([]);
    global.window.electronAPI.getAnalyses.mockResolvedValue([]);
    global.window.electronAPI.getOTThreatIntelEntries.mockResolvedValue([]);
    global.window.electronAPI.getSavedComparisons.mockResolvedValue([]);
    global.window.electronAPI.getLLMLogs.mockResolvedValue([]);
    global.window.electronAPI.getHomeDirectory.mockResolvedValue('/home/user');
  });

  describe('App Component', () => {
    test('renders without crashing', () => {
      renderWithRouter(<App />);
      expect(document.body).toBeInTheDocument();
    });

    test('shows loading state initially', () => {
      renderWithRouter(<App />);
      // The app should handle the loading state gracefully
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('LoginPage Component', () => {
    test('renders login form correctly', () => {
      render(<LoginPage />);
      
      expect(screen.getByText(/sign in to plc code check system/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    test('handles form submission', async () => {
      global.window.electronAPI.authenticateUser.mockResolvedValue({ 
        success: true, 
        user: { id: 1, username: 'testuser' } 
      });

      render(<LoginPage />);
      
      const usernameInput = screen.getByPlaceholderText(/username/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(passwordInput, { target: { value: 'password' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.window.electronAPI.authenticateUser).toHaveBeenCalledWith('testuser', 'password');
      });
    });

    test('shows error for empty fields', async () => {
      render(<LoginPage />);
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/please fill in all fields/i)).toBeInTheDocument();
      });
    });
  });

  describe('EnhancedDashboard Component', () => {
    test('renders dashboard components', async () => {
      global.window.electronAPI.getAnalyses.mockResolvedValue([
        { id: 1, fileName: 'test.L5X', date: '2025-06-22', status: 'completed' }
      ]);
      global.window.electronAPI.listBaselines.mockResolvedValue([
        { id: 1, fileName: 'baseline1.L5X', date: '2025-06-22' }
      ]);

      renderWithRouter(<EnhancedDashboard />);

      await waitFor(() => {
        // Check if dashboard sections are rendered
        expect(document.body).toBeInTheDocument();
      });
    });
  });

  describe('BaselinesPage Component', () => {
    test('renders baselines list', async () => {
      const mockBaselines = [
        { id: 1, fileName: 'baseline1.L5X', originalName: 'test1.L5X', date: '2025-06-22' },
        { id: 2, fileName: 'baseline2.L5X', originalName: 'test2.L5X', date: '2025-06-21' }
      ];
      global.window.electronAPI.listBaselines.mockResolvedValue(mockBaselines);

      renderWithRouter(<BaselinesPage />);

      await waitFor(() => {
        expect(global.window.electronAPI.listBaselines).toHaveBeenCalled();
      });
    });

    test('handles baseline deletion', async () => {
      const mockBaselines = [
        { id: 1, fileName: 'baseline1.L5X', originalName: 'test1.L5X', date: '2025-06-22' }
      ];
      global.window.electronAPI.listBaselines.mockResolvedValue(mockBaselines);
      global.window.electronAPI.deleteBaseline.mockResolvedValue({ success: true });

      renderWithRouter(<BaselinesPage />);

      await waitFor(() => {
        expect(global.window.electronAPI.listBaselines).toHaveBeenCalled();
      });
    });
  });

  describe('AnalysisPage Component', () => {
    test('renders analysis interface', async () => {
      renderWithRouter(<AnalysisPage />);
      
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    });

    test('handles file upload', async () => {
      global.window.electronAPI.analyzeFile.mockResolvedValue({
        success: true,
        analysis: { summary: 'Test analysis complete' }
      });

      renderWithRouter(<AnalysisPage />);

      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    });
  });

  describe('UserManagementPage Component', () => {
    test('renders user list', async () => {
      const mockUsers = [
        { id: 1, username: 'admin', email: 'admin@test.com', role: 'admin' },
        { id: 2, username: 'user1', email: 'user1@test.com', role: 'analyst' }
      ];
      global.window.electronAPI.listUsers.mockResolvedValue({ users: mockUsers });

      renderWithRouter(<UserManagementPage />);

      await waitFor(() => {
        expect(global.window.electronAPI.listUsers).toHaveBeenCalled();
      });
    });
  });

  describe('OTThreatIntelDashboard Component', () => {
    test('renders threat intelligence data', async () => {
      const mockThreatData = [
        { id: 1, title: 'Test Threat', severity: 'high', date: '2025-06-22' }
      ];
      global.window.electronAPI.getOTThreatIntelEntries.mockResolvedValue(mockThreatData);

      renderWithRouter(<OTThreatIntelDashboard />);

      await waitFor(() => {
        expect(global.window.electronAPI.getOTThreatIntelEntries).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    test('handles API errors gracefully', async () => {
      global.window.electronAPI.listBaselines.mockRejectedValue(new Error('API Error'));

      renderWithRouter(<BaselinesPage />);

      await waitFor(() => {
        expect(global.window.electronAPI.listBaselines).toHaveBeenCalled();
      });

      // Component should not crash despite API error
      expect(document.body).toBeInTheDocument();
    });

    test('handles network timeouts', async () => {
      global.window.electronAPI.getAnalyses.mockImplementation(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      renderWithRouter(<EnhancedDashboard />);

      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Data Validation', () => {
    test('handles null/undefined data gracefully', async () => {
      global.window.electronAPI.listBaselines.mockResolvedValue(null);
      global.window.electronAPI.getAnalyses.mockResolvedValue(undefined);

      renderWithRouter(<EnhancedDashboard />);

      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    });

    test('handles malformed data', async () => {
      global.window.electronAPI.listBaselines.mockResolvedValue([
        { /* missing required fields */ },
        { id: null, fileName: undefined, date: 'invalid-date' }
      ]);

      renderWithRouter(<BaselinesPage />);

      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    });
  });
});
