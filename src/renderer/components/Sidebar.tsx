import * as React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { label: 'Dashboard', path: '/' },
  { label: 'Upload', path: '/upload' },
  { label: 'Baselines', path: '/baselines' },
  { label: 'Analysis', path: '/analysis' },
  { label: 'Comparisons', path: '/comparisons' },
  { label: 'OT Threat Intel', path: '/ot-threat-intel' }, // New navigation link
  // Only show LLM Log in development
  ...(process.env.NODE_ENV !== 'production' ? [{ label: 'LLM Log', path: '/llm-log' }] : []),
] as Array<{label: string; path: string; icon?: string}>;

const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await logout();
    }
  };

  // Check if user has admin access
  const isAdmin = user?.role === 'admin';

  return (
    <aside className="h-full w-64 bg-[#232B3A] text-white flex flex-col py-6 px-4 shadow-lg font-sans">
      <div className="mb-8 mt-4 flex flex-col items-center select-none">
        <img src="./firstwatch-logo-2.png" alt="First Watch Logo" className="h-16 w-auto mb-3" style={{maxWidth: '200px'}} />
      </div>
      
      {/* User Info */}
      {user && (
        <div className="mb-5 p-3 bg-[#2A3441] rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.username}</p>
              <p className="text-xs text-gray-300 truncate">{user.email}</p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${
                user.role === 'admin' ? 'bg-red-100 text-red-800' :
                user.role === 'analyst' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
            </div>
          </div>
        </div>
      )}
      
      <nav className="flex-1">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `flex items-center px-4 py-2 mb-2 rounded-lg text-sm font-medium transition-colors duration-150 hover:bg-[#31405A] hover:text-[#0275D8] ${isActive ? 'bg-white text-[#232B3A] shadow font-semibold' : ''}`}
          >
            {item.icon && <span className="mr-2">{item.icon}</span>}
            <span>{item.label}</span>
          </NavLink>
        ))}
        
        {/* Admin-only User Management */}
        {isAdmin && (
          <NavLink
            to="/users"
            className={({ isActive }) => `flex items-center px-4 py-2 mb-2 rounded-lg text-sm font-medium transition-colors duration-150 hover:bg-[#31405A] hover:text-[#0275D8] ${isActive ? 'bg-white text-[#232B3A] shadow font-semibold' : ''}`}
          >
            <span>User Management</span>
          </NavLink>
        )}
        
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center px-4 py-2 mb-2 rounded-lg text-sm font-medium transition-colors duration-150 hover:bg-[#31405A] hover:text-red-400 w-full text-left"
        >
          <span>Sign Out</span>
        </button>
      </nav>
      <div className="mt-auto text-xs text-gray-400 text-center pt-6 select-none">
        &copy; {new Date().getFullYear()} First Watch PLC Code Checker
      </div>
    </aside>
  );
};

export default Sidebar;
