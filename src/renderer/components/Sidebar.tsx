import * as React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useLLMStatus } from '../utils/analysisApi';

const navItems = [
  { label: 'Dashboard', path: '/' },
  { label: 'Upload', path: '/upload' },
  { label: 'Baselines', path: '/baselines' },
  { label: 'Analysis', path: '/analysis' },
  { label: 'Comparisons', path: '/comparisons' },
  { label: 'LLM Log', path: '/llm-log' },
];

const Sidebar = () => {
  const location = useLocation();
  const { status: llmStatus, error: llmError } = useLLMStatus(60000); // 60s poll
  const [clearingDb, setClearingDb] = React.useState(false);

  async function handleClearDb() {
    if (!window.confirm('Are you sure you want to clear and reinitialize the database? This will delete all analyses and baselines.')) return;
    setClearingDb(true);
    try {
      // @ts-ignore
      await window.electron.invoke('reset-db');
      window.location.reload();
    } catch (e) {
      alert('Failed to clear database: ' + (e instanceof Error ? e.message : e));
    }
    setClearingDb(false);
  }

  return (
    <aside className="h-full w-64 bg-[#232B3A] text-white flex flex-col py-8 px-4 shadow-lg font-sans">
      <div className="mb-10 flex flex-col items-center select-none">
        <img src="/firstwatch-logo.svg" alt="First Watch Logo" className="h-12 mb-4" style={{maxWidth: '180px'}} />
      </div>
      <nav className="flex-1">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `flex items-center px-6 py-3 mb-3 rounded-lg text-lg font-medium transition-colors duration-150 hover:bg-[#31405A] hover:text-[#0275D8] ${isActive ? 'bg-white text-[#232B3A] shadow font-bold' : ''}`}
          >
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      {/* Remove Hide LLM Status button and always show LLM status */}
      <div className="mt-2 flex flex-col items-center">
        <span className={`text-xs font-semibold px-2 py-1 rounded ${llmStatus === 'online' ? 'bg-green-600 text-white' : llmStatus === 'offline' ? 'bg-red-600 text-white' : 'bg-gray-500 text-white'}`}
          title={llmError ? `LLM error: ${llmError}` : llmStatus === 'online' ? 'LLM is online' : 'LLM status unknown'}>
          LLM: {llmStatus === 'online' ? 'Online' : llmStatus === 'offline' ? 'Offline' : 'Checking...'}
        </span>
        {llmError && <span className="text-xs text-red-300 mt-1">{llmError}</span>}
      </div>
      <div className="mt-auto text-xs text-gray-400 text-center pt-8 select-none">
        <button
          className={`w-full mb-4 px-4 py-2 rounded bg-red-700 hover:bg-red-800 text-white font-semibold shadow transition ${clearingDb ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={clearingDb}
          onClick={handleClearDb}
        >
          {clearingDb ? 'Clearing Database...' : 'Clear Database'}
        </button>
        &copy; {new Date().getFullYear()} First Watch PLC Code Checker
      </div>
    </aside>
  );
};

export default Sidebar;
