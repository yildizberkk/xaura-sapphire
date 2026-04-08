import { describe, it, expect } from "vitest";
import { getEventState, formatCountdown } from "@/lib/time";

describe("getEventState", () => {
  it("returns pre-event before April 25", () => {
    const date = new Date("2025-04-24T12:00:00+03:00");
    expect(getEventState(date)).toBe("pre-event");
  });

  it("returns during-event on Saturday morning", () => {
    const date = new Date("2025-04-26T10:00:00+03:00");
    expect(getEventState(date)).toBe("during-event");
  });

  it("returns between-days on Friday night late", () => {
    const date = new Date("2025-04-25T23:30:00+03:00");
    expect(getEventState(date)).toBe("between-days");
  });

  it("returns post-event after April 27 15:00", () => {
    const date = new Date("2025-04-27T16:00:00+03:00");
    expect(getEventState(date)).toBe("post-event");
  });
});

describe("formatCountdown", () => {
  it("formats seconds to MM:SS", () => {
    expect(formatCountdown(125)).toEqual({ minutes: "02", seconds: "05" });
  });

  it("handles zero", () => {
    expect(formatCountdown(0)).toEqual({ minutes: "00", seconds: "00" });
  });

  it("handles large values", () => {
    expect(formatCountdown(3661)).toEqual({ minutes: "61", seconds: "01" });
  });
});
