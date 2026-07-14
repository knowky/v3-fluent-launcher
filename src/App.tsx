import { useEffect } from "react";
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

  useEffect(() => {
    detectGame();
  }, []);

  // 自动跳转设置向导
  useEffect(() => {
    if (gameInfo && !gameInfo.installed && location.pathname !== "/setup") {
      navigate("/setup");
    }
  }, [gameInfo]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-v3-dark">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 px-4 py-3 bg-error/10 border border-error/30 rounded-lg text-error text-sm flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-white/50 hover:text-white ml-4"
              >
                ✕
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
