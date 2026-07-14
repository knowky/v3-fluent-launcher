import { useEffect, useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useAppStore } from "./stores/appStore";
import Sidebar from "./components/Sidebar";
import TitleBar from "./components/TitleBar";
import Dashboard from "./pages/Dashboard";
import ModStudio from "./pages/ModStudio";
import SaveCommand from "./pages/SaveCommand";
import Configuration from "./pages/Configuration";
import LaunchPad from "./pages/LaunchPad";
import ConflictCenter from "./pages/ConflictCenter";
import Toolbox from "./pages/Toolbox";
import Settings from "./pages/Settings";
import SetupWizard from "./pages/SetupWizard";

function App() {
  const { gameInfo, detectGame, error, setError } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [errorVisible, setErrorVisible] = useState(false);

  useEffect(() => {
    detectGame();
  }, []);

  useEffect(() => {
    if (error) {
      setErrorVisible(true);
      const t = setTimeout(() => {
        setErrorVisible(false);
        setTimeout(() => setError(null), 300);
      }, 6000);
      return () => clearTimeout(t);
    }
  }, [error]);

  useEffect(() => {
    if (gameInfo && !gameInfo.installed && location.pathname !== "/setup") {
      navigate("/setup");
    }
  }, [gameInfo]);

  return (
    <div className="flex flex-col h-screen overflow-hidden aurora-bg">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden relative z-[1]">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          {/* Error Toast */}
          {error && (
            <div
              className={`mb-4 toast toast-error flex items-center justify-between transition-all duration-300 ${
                errorVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
              }`}
            >
              <span className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 5v3M8 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                {error}
              </span>
              <button
                onClick={() => { setErrorVisible(false); setTimeout(() => setError(null), 300); }}
                className="text-white/40 hover:text-white ml-4 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          )}
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/mods" element={<ModStudio />} />
              <Route path="/saves" element={<SaveCommand />} />
              <Route path="/config" element={<Configuration />} />
              <Route path="/launch" element={<LaunchPad />} />
              <Route path="/conflicts" element={<ConflictCenter />} />
              <Route path="/tools" element={<Toolbox />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/setup" element={<SetupWizard />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default App;
