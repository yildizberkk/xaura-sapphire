import { describe, it, expect } from "vitest";
import { getSkyConfig, SkyConfig } from "@/lib/sky";

/** Helper: create a Date at a specific Istanbul hour on a known date */
function istanbulDate(hour: number, minute = 0): Date {
  // Istanbul is UTC+3. We construct a UTC date such that
  // when converted to Europe/Istanbul, it shows the desired hour.
  const utcHour = hour - 3;
  const d = new Date(Date.UTC(2025, 3, 25, utcHour, minute, 0)); // April 25 2025
  return d;
}

describe("getSkyConfig", () => {
  it("returns a SkyConfig with gradient, cloudOpacity, and showStars", () => {
    const config = getSkyConfig(new Date());
    expect(config).toHaveProperty("gradient");
    expect(config).toHaveProperty("cloudOpacity");
    expect(config).toHaveProperty("showStars");
    expect(typeof config.gradient).toBe("string");
    expect(typeof config.cloudOpacity).toBe("number");
    expect(typeof config.showStars).toBe("boolean");
  });

  describe("night time (0-6h)", () => {
    it("shows stars at 3:00", () => {
      const config = getSkyConfig(istanbulDate(3));
      expect(config.showStars).toBe(true);
    });

    it("shows stars at 0:00", () => {
      const config = getSkyConfig(istanbulDate(0));
      expect(config.showStars).toBe(true);
    });

    it("has low cloud opacity", () => {
      const config = getSkyConfig(istanbulDate(3));
      expect(config.cloudOpacity).toBeLessThanOrEqual(0.03);
    });
  });

  describe("dawn (7-9h)", () => {
    it("does not show stars at 8:00", () => {
      const config = getSkyConfig(istanbulDate(8));
      expect(config.showStars).toBe(false);
    });

    it("has moderate cloud opacity", () => {
      const config = getSkyConfig(istanbulDate(8));
      expect(config.cloudOpacity).toBeGreaterThanOrEqual(0.03);
      expect(config.cloudOpacity).toBeLessThanOrEqual(0.05);
    });
  });

  describe("daytime (9-14h)", () => {
    it("does not show stars at noon", () => {
      const config = getSkyConfig(istanbulDate(12));
      expect(config.showStars).toBe(false);
    });

    it("has higher cloud opacity", () => {
      const config = getSkyConfig(istanbulDate(12));
      expect(config.cloudOpacity).toBeGreaterThanOrEqual(0.04);
    });
  });

  describe("afternoon (14-18h)", () => {
    it("does not show stars at 16:00", () => {
      const config = getSkyConfig(istanbulDate(16));
      expect(config.showStars).toBe(false);
    });

    it("gradient contains gold color (#b39369) at 17:00", () => {
      const config = getSkyConfig(istanbulDate(17));
      expect(config.gradient).toContain("#b39369");
    });

    it("has high cloud opacity", () => {
      const config = getSkyConfig(istanbulDate(16));
      expect(config.cloudOpacity).toBeGreaterThanOrEqual(0.05);
    });
  });

  describe("sunset (18-21h)", () => {
    it("does not show stars at 19:00", () => {
      const config = getSkyConfig(istanbulDate(19));
      expect(config.showStars).toBe(false);
    });
  });

  describe("late night (21-24h)", () => {
    it("shows stars at 22:00", () => {
      const config = getSkyConfig(istanbulDate(22));
      expect(config.showStars).toBe(true);
    });

    it("shows stars at 23:30", () => {
      const config = getSkyConfig(istanbulDate(23, 30));
      expect(config.showStars).toBe(true);
    });
  });

  it("gradient is a valid CSS linear-gradient", () => {
    const config = getSkyConfig(istanbulDate(12));
    expect(config.gradient).toMatch(/^linear-gradient\(to bottom, #[0-9a-f]{6} 0%, #[0-9a-f]{6} 50%, #[0-9a-f]{6} 100%\)$/);
  });

  it("cloud opacity is always within range 0.02-0.06", () => {
    for (let h = 0; h < 24; h++) {
      const config = getSkyConfig(istanbulDate(h));
      expect(config.cloudOpacity).toBeGreaterThanOrEqual(0.02);
      expect(config.cloudOpacity).toBeLessThanOrEqual(0.06);
    }
  });
});
