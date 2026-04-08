"use client";

import { formatCountdown } from "@/lib/time";
import FlipDigit from "./FlipDigit";

interface FlipCountdownProps {
  remainingSeconds: number;
}

export default function FlipCountdown({ remainingSeconds }: FlipCountdownProps) {
  const { minutes, seconds } = formatCountdown(remainingSeconds);
  const highlight = remainingSeconds <= 300;
  const [m0, m1] = minutes.split("");
  const [s0, s1] = seconds.split("");

  return (
    <div className="border-t border-white/10 pt-3 mt-3">
      <p className="text-[10px] tracking-[0.1em] text-cream/40 mb-1.5">
        Kalan
      </p>
      <div className="flex items-center gap-0.5">
        <FlipDigit value={m0} highlight={highlight} />
        <FlipDigit value={m1} highlight={highlight} />
        <span
          className={`text-[16px] font-bold mx-0.5 ${
            highlight ? "text-gold-light" : "text-cream/60"
          }`}
        >
          :
        </span>
        <FlipDigit value={s0} highlight={highlight} />
        <FlipDigit value={s1} highlight={highlight} />
      </div>
    </div>
  );
}
