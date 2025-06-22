import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import FileUploaderPage from './pages/FileUploaderPage';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/EnhancedDashboard';
import BaselinesPage from './pages/BaselinesPage';
import HistoryPage from './pages/HistoryPage';
import LLMLogPage from './pages/LLMLogPage';
import ComparisonsPage from './pages/ComparisonsPage';
import AnalysisPage from './pages/AnalysisPage';
import OTThreatIntelDashboard from './pages/OTThreatIntelDashboard';
import UserManagementPage from './pages/UserManagementPage';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider, ProtectedRoute } from './contexts/AuthContext';
import AuthWrapper from './components/auth/AuthWrapper';

// Context for LLM provider
type LLMProvider = 'openai' | 'ollama';
export const LLMProviderContext = React.createContext<{
  provider: LLMProvider;
  setProvider: (p: LLMProvider) => void;
}>({ provider: 'openai', setProvider: () => {} });

const App = () => {
  const [llmProvider, setLlmProvider] = React.useState<LLMProvider>(() => {
    return (localStorage.getItem('llmProvider') as LLMProvider) || 'openai';
  });
  React.useEffect(() => {
    localStorage.setItem('llmProvider', llmProvider);
  }, [llmProvider]);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <LLMProviderContext.Provider value={{ provider: llmProvider, setProvider: setLlmProvider }}>
          <Router>
            <ProtectedRoute fallback={<AuthWrapper />}>
              <div className="flex h-screen bg-[#F4F6FA] font-sans">
                <ErrorBoundary isolateErrors>
                  <Sidebar />
                </ErrorBoundary>
                <div className="flex flex-col flex-1 min-w-0">
                  <header className="bg-white text-[#232B3A] p-4 shadow-sm border-b border-gray-100 flex items-center">
                    <h1 className="text-lg font-extrabold tracking-tight">First Watch PLC Code Checker</h1>
                  </header>
                  <main className="flex-1 p-6 overflow-auto">
                    <ErrorBoundary isolateErrors>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/upload" element={<FileUploaderPage />} />
                        <Route path="/baselines" element={<BaselinesPage />} />
                        <Route path="/history" element={<HistoryPage />} />
                        <Route path="/llm-log" element={<LLMLogPage />} />
                        <Route path="/comparisons" element={<ComparisonsPage />} />
                        <Route path="/analysis" element={<AnalysisPage />} />
                        <Route path="/ot-threat-intel" element={<OTThreatIntelDashboard />} />
                        <Route path="/users" element={<UserManagementPage />} />
                      </Routes>
                    </ErrorBoundary>
                  </main>
                </div>
              </div>
            </ProtectedRoute>
          </Router>
        </LLMProviderContext.Provider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;