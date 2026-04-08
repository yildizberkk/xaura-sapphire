"use client";

import { motion, AnimatePresence } from "framer-motion";

interface FlipDigitProps {
  value: string;
  highlight?: boolean;
}

export default function FlipDigit({ value, highlight = false }: FlipDigitProps) {
  return (
    <div className="w-7 h-9 bg-sky-navy border border-white/10 rounded flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={`text-[16px] font-bold tabular-nums ${
            highlight ? "text-gold-light" : "text-cream"
          }`}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
