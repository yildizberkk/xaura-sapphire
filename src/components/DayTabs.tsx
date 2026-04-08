"use client";

import { motion } from "framer-motion";
import { SCHEDULE } from "@/lib/schedule";

interface DayTabsProps {
  activeIndex: number;
  onSelect: (index: number) => void;
}

export default function DayTabs({ activeIndex, onSelect }: DayTabsProps) {
  return (
    <div className="flex justify-center gap-2 px-4 py-3">
      {SCHEDULE.map((day, i) => (
        <button
          key={day.day}
          onClick={() => onSelect(i)}
          className={`relative rounded-full px-5 py-2 text-[13px] transition-colors ${
            i === activeIndex
              ? "font-semibold text-cream"
              : "font-normal text-cream/50"
          }`}
        >
          {i === activeIndex && (
            <motion.div
              layoutId="day-tab-bg"
              className="absolute inset-0 rounded-full bg-white/15 border border-gold/40"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{day.day}</span>
        </button>
      ))}
    </div>
  );
}
