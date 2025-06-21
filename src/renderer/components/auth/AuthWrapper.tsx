import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';

type AuthMode = 'login' | 'register';

const AuthWrapper: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading FirstWatch...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, don't show auth screens
  if (isAuthenticated) {
    return null;
  }

  // Show appropriate auth screen
  if (authMode === 'register') {
    return (
      <RegisterPage 
        onShowLogin={() => setAuthMode('login')} 
      />
    );
  }

  return (
    <LoginPage 
      onShowRegister={() => setAuthMode('register')} 
    />
  );
};

export default AuthWrapper;
