export interface SkyConfig {
  gradient: string;
  cloudOpacity: number;
  showStars: boolean;
}

interface SkyPreset {
  hour: number;
  colors: [string, string, string];
  cloudOpacity: number;
  showStars: boolean;
}

// Time-of-day presets using brand colors
const PRESETS: SkyPreset[] = [
  // 0h  — Deep night
  { hour: 0, colors: ["#020a3a", "#030d5f", "#0a1048"], cloudOpacity: 0.02, showStars: true },
  // 6h  — Pre-dawn, still dark but lightening
  { hour: 6, colors: ["#030d5f", "#171f6b", "#345092"], cloudOpacity: 0.02, showStars: true },
  // 7h  — Dawn beginning
  { hour: 7, colors: ["#171f6b", "#345092", "#b39369"], cloudOpacity: 0.04, showStars: false },
  // 9h  — Morning, dawn fading into day
  { hour: 9, colors: ["#345092", "#5884cc", "#5574b8"], cloudOpacity: 0.04, showStars: false },
  // 12h — Midday, bright sapphire
  { hour: 12, colors: ["#284589", "#345092", "#5884cc"], cloudOpacity: 0.06, showStars: false },
  // 14h — Early afternoon
  { hour: 14, colors: ["#345092", "#5884cc", "#5574b8"], cloudOpacity: 0.06, showStars: false },
  // 17h — Late afternoon, warm gold creeping in
  { hour: 17, colors: ["#345092", "#5574b8", "#b39369"], cloudOpacity: 0.06, showStars: false },
  // 18h — Sunset beginning
  { hour: 18, colors: ["#171f6b", "#345092", "#b39369"], cloudOpacity: 0.04, showStars: false },
  // 20h — Deep sunset / dusk
  { hour: 20, colors: ["#030d5f", "#171f6b", "#edd29d"], cloudOpacity: 0.04, showStars: false },
  // 21h — Night falling
  { hour: 21, colors: ["#030d5f", "#171f6b", "#0a1048"], cloudOpacity: 0.03, showStars: true },
  // 24h — Deep night (wraps to 0)
  { hour: 24, colors: ["#020a3a", "#030d5f", "#0a1048"], cloudOpacity: 0.02, showStars: true },
];

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0"))
      .join("")
  );
}

function lerpColor(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex(
    ar + (br - ar) * t,
    ag + (bg - ag) * t,
    ab + (bb - ab) * t
  );
}

function lerpNumber(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function getIstanbulHour(date: Date): number {
  const timeStr = date.toLocaleTimeString("en-GB", {
    timeZone: "Europe/Istanbul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours + minutes / 60;
}

export function getSkyConfig(now: Date): SkyConfig {
  const hour = getIstanbulHour(now);

  // Find the two presets to interpolate between
  let lower = PRESETS[0];
  let upper = PRESETS[1];

  for (let i = 0; i < PRESETS.length - 1; i++) {
    if (hour >= PRESETS[i].hour && hour < PRESETS[i + 1].hour) {
      lower = PRESETS[i];
      upper = PRESETS[i + 1];
      break;
    }
  }

  // Edge case: exactly at or past the last preset
  if (hour >= PRESETS[PRESETS.length - 1].hour) {
    lower = PRESETS[PRESETS.length - 1];
    upper = PRESETS[PRESETS.length - 1];
  }

  const range = upper.hour - lower.hour;
  const t = range === 0 ? 0 : (hour - lower.hour) / range;

  const c0 = lerpColor(lower.colors[0], upper.colors[0], t);
  const c1 = lerpColor(lower.colors[1], upper.colors[1], t);
  const c2 = lerpColor(lower.colors[2], upper.colors[2], t);

  const gradient = `linear-gradient(to bottom, ${c0} 0%, ${c1} 50%, ${c2} 100%)`;
  const cloudOpacity = lerpNumber(lower.cloudOpacity, upper.cloudOpacity, t);

  // Stars: only show when both presets agree
  const showStars = lower.showStars && upper.showStars;

  return { gradient, cloudOpacity, showStars };
}
