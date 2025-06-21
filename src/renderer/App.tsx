import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import FileUploaderPage from './pages/FileUploaderPage';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import BaselinesPage from './pages/BaselinesPage';
import HistoryPage from './pages/HistoryPage';
import LLMLogPage from './pages/LLMLogPage';
import ComparisonsPage from './pages/ComparisonsPage';
import AnalysisPage from './pages/AnalysisPage';
import OTThreatIntelDashboard from './pages/OTThreatIntelDashboard';

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
    <LLMProviderContext.Provider value={{ provider: llmProvider, setProvider: setLlmProvider }}>
      <Router>
        <div className="flex h-screen bg-[#F4F6FA] font-sans">
          <Sidebar />
          <div className="flex flex-col flex-1 min-w-0">
            <header className="bg-white text-[#232B3A] p-6 shadow-sm border-b border-gray-100 flex items-center justify-between">
              <h1 className="text-xl font-extrabold tracking-tight">First Watch PLC Code Checker</h1>
              <div className="flex items-center gap-4">
                <label className="text-sm font-semibold mr-2">LLM Provider:</label>
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={llmProvider}
                  onChange={e => setLlmProvider(e.target.value as LLMProvider)}
                  style={{ minWidth: 100 }}
                >
                  <option value="openai">OpenAI</option>
                  <option value="ollama">Ollama</option>
                </select>
              </div>
            </header>
            <main className="flex-1 p-10 overflow-auto">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/upload" element={<FileUploaderPage />} />
                <Route path="/baselines" element={<BaselinesPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/llm-log" element={<LLMLogPage />} />
                <Route path="/comparisons" element={<ComparisonsPage />} />
                <Route path="/analysis" element={<AnalysisPage />} />
                <Route path="/ot-threat-intel" element={<OTThreatIntelDashboard />} />
              </Routes>
            </main>
          </div>
        </div>
      </Router>
    </LLMProviderContext.Provider>
  );
};

export default App;