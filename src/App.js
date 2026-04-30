import { useEffect, useRef, useState } from "react";
import Navbar      from "./components/Navbar";
import Dashboard   from "./pages/Dashboard";
import Create      from "./pages/Create";
import Gallery     from "./pages/Gallery";
import Templates   from "./pages/Templates";
import Settings    from "./pages/Settings";
import { subscribeGeneration } from "./services/reelGenerationManager";
import { buildApiUrl } from "./lib/api";
import { useReminder } from "./hooks/useReminder";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Welcome from "./pages/Welcome";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ color: 'white', fontSize: '18px' }}>Loading...</div>
      </div>
    );
  }

  return isAuthenticated() ? children : <Navigate to="/" replace />;
};

// App Content Component
const AppContent = () => {
  const { isAuthenticated } = useAuth();

  const [globalNotice, setGlobalNotice] = useState(null);
  const [generationStatus, setGenerationStatus] = useState("idle");
  const [reminderConfig, setReminderConfig] = useState({
    reminderTime: "09:00",
    reminderEnabled: true,
    reminderFrequency: "daily",
    selectedDates: [],
    selectedDays: [],
    desktopNotificationsEnabled: true,
  });
  const lastNotifiedAtRef = useRef(null);

  useReminder(
    reminderConfig.reminderTime,
    reminderConfig.reminderFrequency,
    reminderConfig.selectedDates,
    reminderConfig.selectedDays,
    reminderConfig.reminderEnabled,
    reminderConfig.desktopNotificationsEnabled,
  );

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const previousScrollBehavior = root.style.scrollBehavior;
    const previousBodyOverflowX = body.style.overflowX;

    root.style.scrollBehavior = "smooth";
    body.style.overflowX = "hidden";

    return () => {
      root.style.scrollBehavior = previousScrollBehavior;
      body.style.overflowX = previousBodyOverflowX;
    };
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeGeneration((job) => {
      setGenerationStatus(job.status);

      if (!job.finishedAt || job.finishedAt === lastNotifiedAtRef.current) return;

      if (job.status === "success") {
        lastNotifiedAtRef.current = job.finishedAt;
        setGlobalNotice({ type: "success", text: "Your reel is ready. Open Create to preview and download." });
      } else if (job.status === "error") {
        lastNotifiedAtRef.current = job.finishedAt;
        setGlobalNotice({ type: "error", text: `Reel generation failed: ${job.error || "Unknown error"}` });
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadReminderConfig = async () => {
      try {
        const response = await fetch(buildApiUrl("/api/settings"));
        if (!response.ok) return;

        const data = await response.json();
        const settings = data.settings || {};
        setReminderConfig((current) => ({
          ...current,
          reminderTime: typeof settings.reminderTime === "string" ? settings.reminderTime : current.reminderTime,
          reminderEnabled: typeof settings.reminderEnabled === "boolean" ? settings.reminderEnabled : current.reminderEnabled,
          reminderFrequency: typeof settings.reminderFrequency === "string" ? settings.reminderFrequency : current.reminderFrequency,
          selectedDates: Array.isArray(settings.selectedDates) ? settings.selectedDates : current.selectedDates,
          selectedDays: Array.isArray(settings.selectedDays) ? settings.selectedDays : current.selectedDays,
          desktopNotificationsEnabled:
            typeof settings.desktopNotificationsEnabled === "boolean"
              ? settings.desktopNotificationsEnabled
              : current.desktopNotificationsEnabled,
        }));
      } catch {
        // Keep defaults if backend settings are unavailable.
      }
    };

    loadReminderConfig();
  }, []);

  useEffect(() => {
    const onSettingsUpdated = (event) => {
      const payload = event?.detail;
      if (!payload) return;
      setReminderConfig((current) => ({ ...current, ...payload }));
    };

    window.addEventListener("settingsUpdated", onSettingsUpdated);
    return () => window.removeEventListener("settingsUpdated", onSettingsUpdated);
  }, []);

  useEffect(() => {
    const onReminderFired = (event) => {
      const payload = event?.detail;
      if (!payload) return;
      setGlobalNotice({ type: "info", text: payload.message });
    };

    window.addEventListener("reminder-fired", onReminderFired);
    return () => window.removeEventListener("reminder-fired", onReminderFired);
  }, []);

  useEffect(() => {
    if (!globalNotice) return;

    const timeoutId = setTimeout(() => {
      setGlobalNotice(null);
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [globalNotice]);

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        {isAuthenticated() && <Navbar generationStatus={generationStatus} />}
        {globalNotice && (
          <div
            className={`p-4 text-white ${globalNotice.type === "success" ? "bg-green-500" : "bg-red-500"}`}
            onClick={() => setGlobalNotice(null)}
          >
            {globalNotice.text}
          </div>
        )}
        <main className="p-4">
          <Routes>
            <Route path="/" element={
              isAuthenticated() ? <Navigate to="/create" replace /> : <Welcome />
            } />
            <Route path="/create" element={
              <ProtectedRoute>
                <Create setGlobalNotice={setGlobalNotice} />
              </ProtectedRoute>
            } />
            <Route path="/gallery" element={
              <ProtectedRoute>
                <Gallery />
              </ProtectedRoute>
            } />
            <Route path="/templates" element={
              <ProtectedRoute>
                <Templates />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings
                  reminderConfig={reminderConfig}
                  onUpdate={(newConfig) => {
                    setReminderConfig(newConfig);
                    window.dispatchEvent(new CustomEvent("settingsUpdated", { detail: newConfig }));
                  }}
                />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}