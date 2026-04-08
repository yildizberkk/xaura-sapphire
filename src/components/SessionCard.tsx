"use client";

import { motion } from "framer-motion";
import type { Session, SessionStatus } from "@/lib/types";
import StatusBadge from "./StatusBadge";
import FlipCountdown from "./FlipCountdown";

interface SessionCardProps {
  session: Session;
  status: SessionStatus;
  remainingSeconds: number | null;
  index: number;
}

function getBorderColor(status: SessionStatus): string {
  switch (status) {
    case "active":
      return "var(--color-gold)";
    case "next":
      return "rgba(88, 132, 204, 0.5)"; // sapphire-mid/50
    case "upcoming":
      return "rgba(88, 132, 204, 0.3)"; // sapphire-mid/30
    case "completed":
      return "rgba(255, 255, 255, 0.15)";
  }
}

export default function SessionCard({
  session,
  status,
  remainingSeconds,
  index,
}: SessionCardProps) {
  const isActive = status === "active";
  const isCompleted = status === "completed";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
      className={`rounded-xl backdrop-blur-xl border-l-[3px] px-4 py-3.5 ${
        isActive
          ? "bg-white/[0.08]"
          : "bg-white/[0.05]"
      } ${isCompleted ? "opacity-45" : ""}`}
      style={{
        borderLeftColor: getBorderColor(status),
        boxShadow: isActive
          ? "0 0 20px rgba(179, 147, 105, 0.12), 0 0 40px rgba(179, 147, 105, 0.06)"
          : undefined,
      }}
    >
      {/* Top row: badge + time */}
      <div className="flex items-center justify-between mb-1">
        <StatusBadge status={status} />
        {session.start && (
          <span className="text-[11px] tracking-[0.05em] text-cream/40 tabular-nums">
            {session.start}
            {session.end ? ` - ${session.end}` : ""}
          </span>
        )}
      </div>

      {/* Title */}
      <h3
        className={`text-[15px] font-semibold leading-tight ${
          isActive ? "text-cream" : "text-cream/80"
        }`}
      >
        {session.title}
      </h3>

      {/* Speaker */}
      {session.speaker && (
        <p className="text-[12px] text-gold/70 mt-0.5">{session.speaker}</p>
      )}

      {/* Subtitle (e.g., ceremony details) */}
      {session.subtitle && (
        <p className="text-[11px] text-cream/40 mt-0.5">{session.subtitle}</p>
      )}

      {/* Countdown for active sessions */}
      {isActive && remainingSeconds !== null && (
        <FlipCountdown remainingSeconds={remainingSeconds} />
      )}
    </motion.div>
  );
}
