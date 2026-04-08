import type { SessionStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: SessionStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  if (status === "upcoming") return null;

  const config: Record<
    Exclude<SessionStatus, "upcoming">,
    { text: string; className: string }
  > = {
    active: {
      text: "\u2708 B\u0130N\u0130\u015e BA\u015eLADI",
      className: "text-gold font-bold",
    },
    next: {
      text: "SIRADAKİ",
      className: "text-sapphire-mid font-semibold",
    },
    completed: {
      text: "TAMAMLANDI",
      className: "text-gold/60 font-medium",
    },
  };

  const { text, className } = config[status as Exclude<SessionStatus, "upcoming">];

  return (
    <span className={`text-[10px] tracking-[0.1em] ${className}`}>
      {text}
    </span>
  );
}
