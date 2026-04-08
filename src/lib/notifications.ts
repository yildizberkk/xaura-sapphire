import { SCHEDULE } from "./schedule";

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch (error) {
    console.error("SW registration failed:", error);
    return null;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  const permission = await Notification.requestPermission();
  return permission === "granted";
}

export function getNotificationPreference(): "granted" | "denied" | "undecided" {
  const stored = localStorage.getItem("sapphire-notification-pref");
  if (stored === "dismissed") return "denied";
  if ("Notification" in window && Notification.permission === "granted") return "granted";
  return "undecided";
}

export function dismissNotificationPrompt(): void {
  localStorage.setItem("sapphire-notification-pref", "dismissed");
}

export function scheduleNotifications(): void {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const now = new Date();
  SCHEDULE.forEach((day) => {
    day.sessions.forEach((session) => {
      if (!session.speaker || !session.start) return;
      const sessionDate = new Date(`${day.date}T${session.start}:00+03:00`);
      // 5-minute reminder
      const reminderDelay = sessionDate.getTime() - 5 * 60 * 1000 - now.getTime();
      if (reminderDelay > 0 && reminderDelay < 24 * 60 * 60 * 1000) {
        setTimeout(() => {
          new Notification("\u23f1 5 dk sonra", {
            body: `${session.title} — ${session.speaker}`,
            tag: `reminder-${session.start}`,
          });
        }, reminderDelay);
      }
      // Now live
      const liveDelay = sessionDate.getTime() - now.getTime();
      if (liveDelay > 0 && liveDelay < 24 * 60 * 60 * 1000) {
        setTimeout(() => {
          new Notification("\u2708 Şimdi", {
            body: `${session.title} — ${session.speaker}`,
            tag: `live-${session.start}`,
          });
        }, liveDelay);
      }
    });
  });
}

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as unknown as { standalone: boolean }).standalone);
}
