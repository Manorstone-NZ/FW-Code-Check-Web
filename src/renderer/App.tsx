import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import FileUploader from './components/FileUploader';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import BaselinesPage from './pages/BaselinesPage';
import HistoryPage from './pages/HistoryPage';
import LLMLogPage from './pages/LLMLogPage';
import ComparisonsPage from './pages/ComparisonsPage';
import AnalysisPage from './pages/AnalysisPage';
import OTThreatIntelDashboard from './pages/OTThreatIntelDashboard';

const App = () => {
  return (
    <Router>
      <div className="flex h-screen bg-[#F4F6FA] font-sans">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="bg-white text-[#232B3A] p-6 shadow-sm border-b border-gray-100">
            <h1 className="text-2xl font-extrabold tracking-tight">First Watch PLC Code Checker</h1>
          </header>
          <main className="flex-1 p-10 overflow-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/upload" element={<FileUploader />} />
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
  );
};

export default App;