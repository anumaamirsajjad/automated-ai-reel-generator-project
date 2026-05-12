import { useEffect, useRef } from "react";

/**
 * Hook to manage reminder notifications with flexible scheduling
 * Supports: daily, specific dates, or specific days of the week
 * @param {string} reminderTime - Time in HH:MM format (e.g., "09:00")
 * @param {string} frequency - "daily", "specific-dates", or "specific-days"
 * @param {string[]} selectedDates - Array of dates in YYYY-MM-DD format for specific-dates mode
 * @param {number[]} selectedDays - Array of day numbers 0-6 (0=Sunday) for specific-days mode
 * @param {boolean} enabled - Whether reminder is enabled
 * @param {boolean} desktopNotificationsEnabled - Whether desktop notification popups are enabled
 */
export function useReminder(reminderTime, frequency = "daily", selectedDates = [], selectedDays = [], enabled = true, desktopNotificationsEnabled = true) {
  const reminderShownRef = useRef({});

  const shouldFireToday = (now) => {
    if (frequency === "daily") return true;
    if (frequency === "specific-dates") {
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      const todayStr = `${yyyy}-${mm}-${dd}`;
      return selectedDates.includes(todayStr);
    }
    if (frequency === "specific-days") {
      return selectedDays.includes(now.getDay());
    }
    return false;
  };

  useEffect(() => {
    if (!enabled || !desktopNotificationsEnabled || !reminderTime) return;

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const intervalId = setInterval(() => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const [targetH, targetM] = reminderTime.split(":").map((part) => Number.parseInt(part, 10) || 0);
      const targetMinutes = targetH * 60 + targetM;
      const todayKey = now.toDateString();

      // Fire once any time after the target minute in the same day.
      if (currentMinutes >= targetMinutes && shouldFireToday(now) && !reminderShownRef.current[todayKey]) {
        reminderShownRef.current[todayKey] = true;

        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("reminder-fired", {
            detail: { reminderTime, frequency },
          }));
        }

        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Time to Post! 🎬", {
            body: `Your reminder at ${reminderTime} - Time to post your reels!`,
            icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='45' fill='%237c3aed'/><text x='50' y='60' font-size='50' fill='white' text-anchor='middle' dominant-baseline='middle'>🎬</text></svg>",
            tag: "post-reminder",
            requireInteraction: false,
          });
        }
      }

      // prune entries older than 7 days
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      Object.keys(reminderShownRef.current).forEach((d) => {
        if (new Date(d) < cutoff) delete reminderShownRef.current[d];
      });
    }, 60000);

    return () => clearInterval(intervalId);
  }, [reminderTime, frequency, selectedDates, selectedDays, enabled, desktopNotificationsEnabled]);
}
