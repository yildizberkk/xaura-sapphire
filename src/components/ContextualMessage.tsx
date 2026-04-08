"use client";

import { motion } from "framer-motion";
import type { EventState } from "@/lib/types";
import { getSecondsUntil, buildEventDate } from "@/lib/time";
import { SCHEDULE } from "@/lib/schedule";

interface ContextualMessageProps {
  eventState: EventState;
  now: Date;
}

export default function ContextualMessage({
  eventState,
  now,
}: ContextualMessageProps) {
  if (eventState === "during-event") return null;

  let headline = "";
  let submessage = "";

  if (eventState === "pre-event") {
    const firstDay = SCHEDULE[0];
    const firstSession = firstDay.sessions.find((s) => s.start);
    if (firstSession?.start) {
      const target = buildEventDate(firstDay.date, firstSession.start);
      const totalSeconds = getSecondsUntil(target, now);
      const totalMinutes = Math.floor(totalSeconds / 60);
      const days = Math.floor(totalMinutes / (60 * 24));
      const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
      const minutes = totalMinutes % 60;

      if (days > 0) {
        headline = `Kalkışa ${days} gün`;
      } else {
        headline = `Kalkışa ${hours} saat ${minutes} dakika`;
      }
    } else {
      headline = "Kalkışa hazırlanıyor...";
    }
    submessage = "Sapphire Momentum II \u2022 Kremlin Palace, Antalya";
  } else if (eventState === "between-days") {
    headline = "İyi geceler, yarın görüşürüz \u2708";
    submessage = "Programa aşağıdan göz atabilirsiniz";
  } else if (eventState === "post-event") {
    headline = "Uçuş tamamlandı. Teşekkürler.";
    submessage = "Sapphire Momentum II \u2022 24-26 Nisan 2025";
  }

  return (
    <motion.div
      className="text-center px-6 py-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <p className="text-[18px] font-semibold text-cream leading-snug">
        {headline}
      </p>
      <p className="text-[11px] text-cream/40 mt-1 tracking-wide">
        {submessage}
      </p>
    </motion.div>
  );
}
