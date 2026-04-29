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
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Welcome from "./pages/Welcome";

export default function App() {
  const [page, setPage] = useState("Create");
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

      setReminderConfig((current) => ({
        ...current,
        reminderTime: typeof payload.reminderTime === "string" ? payload.reminderTime : current.reminderTime,
        reminderEnabled: typeof payload.reminderEnabled === "boolean" ? payload.reminderEnabled : current.reminderEnabled,
        reminderFrequency: typeof payload.reminderFrequency === "string" ? payload.reminderFrequency : current.reminderFrequency,
        selectedDates: Array.isArray(payload.selectedDates) ? payload.selectedDates : current.selectedDates,
        selectedDays: Array.isArray(payload.selectedDays) ? payload.selectedDays : current.selectedDays,
        desktopNotificationsEnabled:
          typeof payload.desktopNotificationsEnabled === "boolean"
            ? payload.desktopNotificationsEnabled
            : current.desktopNotificationsEnabled,
      }));
    };

    window.addEventListener("settings-updated", onSettingsUpdated);
    return () => window.removeEventListener("settings-updated", onSettingsUpdated);
  }, []);

  useEffect(() => {
    const onReminderFired = (event) => {
      const reminderTime = event?.detail?.reminderTime || reminderConfig.reminderTime;
      setGlobalNotice({
        type: "success",
        text: `Reminder: it is time to post your reel${reminderTime ? ` (${reminderTime})` : ""}.`,
      });
    };

    window.addEventListener("reminder-fired", onReminderFired);
    return () => window.removeEventListener("reminder-fired", onReminderFired);
  }, [reminderConfig.reminderTime]);

  useEffect(() => {
    if (!globalNotice) return;
    const timeoutId = setTimeout(() => setGlobalNotice(null), 5000);
    return () => clearTimeout(timeoutId);
  }, [globalNotice]);

  const renderPage = () => {
    if (page === "Dashboard") return <Dashboard  setPage={setPage} />;
    if (page === "Create")    return <Create                       />;
    if (page === "Gallery")   return <Gallery     setPage={setPage} />;
    if (page === "Templates") return <Templates   setPage={setPage} />;
    if (page === "Settings")  return <Settings                     />;
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "#f8f8ff",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      overflowX: "hidden",
    }}>
      <Navbar page={page} setPage={setPage} generationStatus={generationStatus} />
      <main style={{ flex: 1, minHeight: 0, width: "100%" }}>{renderPage()}</main>
      {globalNotice && (
        <div style={{
          position: "fixed",
          right: 18,
          bottom: 18,
          zIndex: 10020,
          maxWidth: 340,
          padding: "12px 14px",
          borderRadius: 12,
          fontSize: 13,
          lineHeight: 1.45,
          color: "#fff",
          boxShadow: "0 12px 28px rgba(15,23,42,0.2)",
          background: globalNotice.type === "error"
            ? "linear-gradient(135deg,#dc2626,#b91c1c)"
            : "linear-gradient(135deg,#16a34a,#15803d)",
        }}>
          {globalNotice.text}
        </div>
      )}
    </div>
  );
}