import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import logger from '../../utils/logger';

// Types
interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  sessionToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; sessionToken: string } }
  | { type: 'LOGOUT' }
  | { type: 'SESSION_VALIDATED'; payload: User };

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, email: string, password: string, role?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  validateSession: () => Promise<boolean>;
}

// Initial state
const initialState: AuthState = {
  user: null,
  sessionToken: localStorage.getItem('session_token'),
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        sessionToken: action.payload.sessionToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'SESSION_VALIDATED':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        sessionToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    default:
      return state;
  }
};

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Validate session on app start
  useEffect(() => {
    validateSession();
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const authResult = await response.json();
      if (!authResult.success) {
        dispatch({ type: 'SET_ERROR', payload: authResult.error || 'Authentication failed' });
        return { success: false, error: authResult.error };
      }
      const sessionToken = authResult.sessionToken;
      localStorage.setItem('session_token', sessionToken);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: authResult.user,
          sessionToken,
        },
      });
      logger.info('User logged in successfully', { username: authResult.user.username });
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      logger.error('Login error', error);
      return { success: false, error: errorMessage };
    }
  };

  const register = async (username: string, email: string, password: string, role = 'user'): Promise<{ success: boolean; error?: string }> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, role })
      });
      const result = await response.json();
      if (!result.success) {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Registration failed' });
        return { success: false, error: result.error };
      }
      dispatch({ type: 'SET_LOADING', payload: false });
      logger.info('User registered successfully', { username });
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      logger.error('Registration error', error);
      return { success: false, error: errorMessage };
    }
  };

  const validateSession = async (): Promise<boolean> => {
    const sessionToken = localStorage.getItem('session_token');
    if (!sessionToken) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return false;
    }
    try {
      const response = await fetch('/api/auth/validate-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken })
      });
      const result = await response.json();
      if (result.success && result.user) {
        dispatch({ type: 'SESSION_VALIDATED', payload: result.user });
        return true;
      } else {
        localStorage.removeItem('session_token');
        dispatch({ type: 'LOGOUT' });
        return false;
      }
    } catch (error) {
      logger.error('Session validation error', error);
      localStorage.removeItem('session_token');
      dispatch({ type: 'LOGOUT' });
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    const sessionToken = localStorage.getItem('session_token');
    if (sessionToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionToken })
        });
      } catch (error) {
        logger.error('Logout error', error);
      }
    }
    localStorage.removeItem('session_token');
    dispatch({ type: 'LOGOUT' });
    logger.info('User logged out');
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    validateSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Higher-order component for protected routes
interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
  requiredRole?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback = null, 
  requiredRole 
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  // Check role if required
  if (requiredRole && user?.role !== requiredRole && user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this resource.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
