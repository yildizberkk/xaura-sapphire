"use client";

import { useMemo } from "react";
import { getSkyConfig } from "@/lib/sky";

interface SkyBackgroundProps {
  now: Date;
}

const STAR_POSITIONS = [
  { top: "8%", left: "12%", delay: "0s", size: 2 },
  { top: "15%", left: "78%", delay: "1.2s", size: 1.5 },
  { top: "22%", left: "45%", delay: "0.6s", size: 2 },
  { top: "5%", left: "90%", delay: "2.1s", size: 1 },
  { top: "35%", left: "25%", delay: "0.3s", size: 1.5 },
  { top: "12%", left: "60%", delay: "1.8s", size: 2 },
  { top: "28%", left: "85%", delay: "0.9s", size: 1 },
  { top: "18%", left: "35%", delay: "2.4s", size: 1.5 },
  { top: "40%", left: "55%", delay: "1.5s", size: 2 },
  { top: "6%", left: "5%", delay: "0.7s", size: 1 },
];

export default function SkyBackground({ now }: SkyBackgroundProps) {
  const config = useMemo(() => getSkyConfig(now), [now]);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Gradient layer */}
      <div
        className="absolute inset-0 transition-all duration-[5000ms]"
        style={{ background: config.gradient }}
      />

      {/* Cloud layer 1 — large, slow */}
      <div
        className="absolute inset-0"
        style={{
          opacity: config.cloudOpacity,
          animation: "cloud-drift-slow 60s ease-in-out infinite alternate",
        }}
      >
        <div
          className="absolute w-[600px] h-[200px] rounded-full blur-3xl"
          style={{
            background: "radial-gradient(ellipse, rgba(255,255,255,0.4), transparent 70%)",
            top: "20%",
            left: "-5%",
          }}
        />
        <div
          className="absolute w-[500px] h-[180px] rounded-full blur-3xl"
          style={{
            background: "radial-gradient(ellipse, rgba(255,255,255,0.3), transparent 70%)",
            top: "40%",
            right: "-10%",
          }}
        />
      </div>

      {/* Cloud layer 2 — medium, moderate speed */}
      <div
        className="absolute inset-0"
        style={{
          opacity: config.cloudOpacity * 1.2,
          animation: "cloud-drift 45s ease-in-out infinite alternate",
        }}
      >
        <div
          className="absolute w-[400px] h-[150px] rounded-full blur-2xl"
          style={{
            background: "radial-gradient(ellipse, rgba(255,255,255,0.35), transparent 70%)",
            top: "55%",
            left: "15%",
          }}
        />
      </div>

      {/* Cloud layer 3 — small, fast */}
      <div
        className="absolute inset-0"
        style={{
          opacity: config.cloudOpacity * 0.8,
          animation: "cloud-drift 30s ease-in-out infinite alternate-reverse",
        }}
      >
        <div
          className="absolute w-[350px] h-[120px] rounded-full blur-2xl"
          style={{
            background: "radial-gradient(ellipse, rgba(255,255,255,0.25), transparent 70%)",
            top: "30%",
            right: "5%",
          }}
        />
        <div
          className="absolute w-[300px] h-[100px] rounded-full blur-xl"
          style={{
            background: "radial-gradient(ellipse, rgba(255,255,255,0.2), transparent 70%)",
            top: "65%",
            left: "30%",
          }}
        />
      </div>

      {/* Star particles */}
      {config.showStars &&
        STAR_POSITIONS.map((star, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: star.size,
              height: star.size,
              top: star.top,
              left: star.left,
              animation: `star-twinkle 3s ease-in-out ${star.delay} infinite`,
              opacity: 0.3,
            }}
          />
        ))}
    </div>
  );
}
