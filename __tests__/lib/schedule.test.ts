import { describe, it, expect } from "vitest";
import {
  SCHEDULE,
  EVENT_INFO,
  getSessionsForDay,
  getSessionStatus,
  getCurrentDayIndex,
  getActiveSession,
  getNextSpeakerSession,
} from "@/lib/schedule";

describe("schedule data", () => {
  it("has 3 days", () => {
    expect(SCHEDULE).toHaveLength(3);
  });

  it("has correct day names", () => {
    expect(SCHEDULE.map((d) => d.day)).toEqual([
      "Cuma",
      "Cumartesi",
      "Pazar",
    ]);
  });

  it("has event info", () => {
    expect(EVENT_INFO.name).toBe("Sapphire Momentum II");
  });
});

describe("getSessionsForDay", () => {
  it("returns sessions for Cumartesi", () => {
    const sessions = getSessionsForDay(1);
    expect(sessions.length).toBeGreaterThan(0);
    expect(sessions[0].title).toBe("Kahvaltı");
  });
});

describe("getSessionStatus", () => {
  it("returns completed for past sessions", () => {
    const date = new Date("2025-04-26T11:30:00+03:00");
    const session = SCHEDULE[1].sessions[1]; // 09:30-10:15 session
    expect(getSessionStatus(session, date)).toBe("completed");
  });

  it("returns active for current session", () => {
    const date = new Date("2025-04-26T09:45:00+03:00");
    const session = SCHEDULE[1].sessions[1]; // 09:30-10:15
    expect(getSessionStatus(session, date)).toBe("active");
  });

  it("returns upcoming for future sessions", () => {
    const date = new Date("2025-04-26T08:00:00+03:00");
    const session = SCHEDULE[1].sessions[1]; // 09:30-10:15
    expect(getSessionStatus(session, date)).toBe("upcoming");
  });
});

describe("getCurrentDayIndex", () => {
  it("returns 1 for Saturday", () => {
    const date = new Date("2025-04-26T12:00:00+03:00");
    expect(getCurrentDayIndex(date)).toBe(1);
  });

  it("returns 0 for pre-event", () => {
    const date = new Date("2025-04-20T12:00:00+03:00");
    expect(getCurrentDayIndex(date)).toBe(0);
  });

  it("returns 2 for post-event", () => {
    const date = new Date("2025-04-28T12:00:00+03:00");
    expect(getCurrentDayIndex(date)).toBe(2);
  });
});

describe("getActiveSession", () => {
  it("returns active session during event", () => {
    const date = new Date("2025-04-26T09:45:00+03:00");
    const result = getActiveSession(1, date);
    expect(result).not.toBeNull();
    expect(result!.title).toBe("İkna Problemi Değil İnanç Problemi");
  });

  it("returns null when no session active", () => {
    const date = new Date("2025-04-26T06:00:00+03:00");
    const result = getActiveSession(1, date);
    expect(result).toBeNull();
  });
});

describe("getNextSpeakerSession", () => {
  it("returns next session with a speaker", () => {
    const date = new Date("2025-04-26T08:00:00+03:00");
    const result = getNextSpeakerSession(1, date);
    expect(result).not.toBeNull();
    expect(result!.speaker).toBe("Yusuf Erdem Bakır");
  });
});
