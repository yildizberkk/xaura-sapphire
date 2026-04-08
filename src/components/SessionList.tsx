"use client";

import { useRef, useEffect } from "react";
import type { Session } from "@/lib/types";
import { getSessionStatus, getSessionRemainingSeconds } from "@/lib/schedule";
import SessionCard from "./SessionCard";

interface SessionListProps {
  sessions: Session[];
  now: Date;
}

export default function SessionList({ sessions, now }: SessionListProps) {
  const activeRef = useRef<HTMLDivElement | null>(null);
  const hasScrolled = useRef(false);

  // Compute statuses — promote the first "upcoming" to "next"
  let firstUpcomingPromoted = false;
  const enriched = sessions.map((session) => {
    let status = getSessionStatus(session, now);

    if (status === "upcoming" && !firstUpcomingPromoted) {
      status = "next";
      firstUpcomingPromoted = true;
    }

    const remainingSeconds =
      status === "active" ? getSessionRemainingSeconds(session, now) : null;

    return { session, status, remainingSeconds };
  });

  // Auto-scroll to the active session on first render
  useEffect(() => {
    if (!hasScrolled.current && activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      hasScrolled.current = true;
    }
  }, []);

  return (
    <div className="flex flex-col gap-2.5 px-4 pb-12 scrollbar-hide">
      {enriched.map((item, index) => {
        const isActive = item.status === "active";
        return (
          <div key={index} ref={isActive ? activeRef : undefined}>
            <SessionCard
              session={item.session}
              status={item.status}
              remainingSeconds={item.remainingSeconds}
              index={index}
            />
          </div>
        );
      })}
    </div>
  );
}
