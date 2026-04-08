"use client";

import { useState, useEffect } from "react";
import { EventState } from "./types";
import { SCHEDULE } from "./schedule";

export function useCurrentTime(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return now;
}

/** Get hours and minutes in Istanbul timezone from a Date */
function getIstanbulTime(date: Date): { hours: number; minutes: number } {
  const timeStr = date.toLocaleTimeString("en-GB", {
    timeZone: "Europe/Istanbul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const [hours, minutes] = timeStr.split(":").map(Number);
  return { hours, minutes };
}

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

export function getEventState(now: Date): EventState {
  const dateStr = now.toLocaleDateString("en-CA", {
    timeZone: "Europe/Istanbul",
  });

  const firstDate = SCHEDULE[0].date;
  const lastDate = SCHEDULE[SCHEDULE.length - 1].date;

  // Before the first event day
  if (dateStr < firstDate) return "pre-event";

  // After the last event day entirely
  if (dateStr > lastDate) return "post-event";

  // Find which event day we're on
  const dayIndex = SCHEDULE.findIndex((d) => d.date === dateStr);
  if (dayIndex === -1) return "pre-event";

  const day = SCHEDULE[dayIndex];
  const sessions = day.sessions;
  const { hours, minutes } = getIstanbulTime(now);
  const currentMinutes = hours * 60 + minutes;

  // Find the last session that has an end time, or use start time
  const lastSession = [...sessions].reverse().find((s) => s.start);
  if (!lastSession?.start) return "between-days";

  // Determine end of day: use last session's end if available, otherwise start + 120min
  let dayEndMinutes: number;
  const lastSessionWithEnd = [...sessions].reverse().find((s) => s.end);
  if (lastSessionWithEnd?.end) {
    dayEndMinutes = timeToMinutes(lastSessionWithEnd.end);
  } else {
    dayEndMinutes = timeToMinutes(lastSession.start) + 120;
  }

  // On the last day, after the last session ends => post-event
  if (dateStr === lastDate && currentMinutes >= dayEndMinutes) {
    return "post-event";
  }

  // Find the first session start
  const firstSession = sessions.find((s) => s.start);
  if (!firstSession?.start) return "between-days";
  const dayStartMinutes = timeToMinutes(firstSession.start) - 60;

  // Before sessions start for the day or after sessions end
  if (currentMinutes < dayStartMinutes || currentMinutes >= dayEndMinutes) {
    return "between-days";
  }

  return "during-event";
}

export function formatCountdown(totalSeconds: number): {
  minutes: string;
  seconds: string;
} {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return {
    minutes: String(mins).padStart(2, "0"),
    seconds: String(secs).padStart(2, "0"),
  };
}

export function getSecondsUntil(target: Date, now: Date): number {
  return Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
}

export function buildEventDate(dayDate: string, timeStr: string): Date {
  return new Date(`${dayDate}T${timeStr}:00+03:00`);
}
