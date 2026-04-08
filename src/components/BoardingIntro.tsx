"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BoardingIntroProps {
  onComplete: () => void;
}

type Phase = "void" | "card" | "reveal";

const STORAGE_KEY = "sapphire-visited";

export default function BoardingIntro({ onComplete }: BoardingIntroProps) {
  const [phase, setPhase] = useState<Phase>("void");
  const [visible, setVisible] = useState(true);
  const isRepeat = useRef(false);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const visited = typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY);
    isRepeat.current = !!visited;

    if (visited) {
      // Repeat visit: show card briefly then fade
      setPhase("card");
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => {
          onComplete();
        }, 400);
      }, 500);
      return () => clearTimeout(timer);
    }

    // First visit: full sequence
    // void phase: 0 - 500ms
    const cardTimer = setTimeout(() => setPhase("card"), 500);
    // reveal phase: 1800ms
    const revealTimer = setTimeout(() => setPhase("reveal"), 1800);
    // complete: 3000ms
    const completeTimer = setTimeout(() => {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, "1");
      }
      setVisible(false);
      setTimeout(() => {
        onComplete();
      }, 300);
    }, 3000);

    return () => {
      clearTimeout(cardTimer);
      clearTimeout(revealTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const isRepeatVisit = isRepeat.current;

  // Detail items for staggered fill-in
  const details = [
    { label: "TARİH", value: "24-26 NİSAN" },
    { label: "KONUM", value: "ANTALYA" },
    { label: "KAPI", value: "A1" },
  ];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "#020a3a" }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Void phase: warm light point */}
          {phase === "void" && (
            <motion.div
              className="absolute rounded-full"
              style={{
                width: 8,
                height: 8,
                background: "radial-gradient(circle, #edd29d, #b39369 60%, transparent 100%)",
                boxShadow: "0 0 40px 15px rgba(237, 210, 157, 0.3)",
              }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          )}

          {/* Card phase */}
          {(phase === "card" || phase === "reveal") && (
            <motion.div
              className="relative w-[320px] rounded-2xl border border-gold/30 overflow-hidden"
              style={{
                background: "linear-gradient(180deg, rgba(52, 80, 146, 0.4) 0%, rgba(3, 13, 95, 0.8) 100%)",
                backdropFilter: "blur(20px)",
              }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={
                phase === "reveal"
                  ? { opacity: 0, scale: 0.7, y: -100 }
                  : { opacity: isRepeatVisit ? 0.7 : 1, scale: 1, y: 0 }
              }
              transition={
                phase === "reveal"
                  ? { duration: 1.0, ease: "easeIn" }
                  : { duration: 0.5, ease: "easeOut" }
              }
            >
              {/* Top bar */}
              <div className="px-5 pt-4 pb-2">
                <p className="text-[9px] tracking-[0.2em] text-cream/40 font-semibold">
                  BİNİŞ KARTI &bull; BOARDING PASS
                </p>
              </div>

              {/* Title section */}
              <div className="px-5 pb-3">
                <motion.h2
                  className="text-[28px] font-extrabold tracking-[0.12em] text-cream leading-none"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.4 }}
                >
                  SAPPHIRE
                </motion.h2>
                <motion.p
                  className="text-[22px] font-light tracking-[0.15em] text-gold mt-0.5"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.4 }}
                >
                  MOMENTUM II
                </motion.p>
              </div>

              {/* Divider */}
              <div className="mx-5 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

              {/* Details row */}
              <div className="flex justify-between px-5 py-4">
                {details.map((detail, i) => (
                  <motion.div
                    key={detail.label}
                    className="text-center"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.12, duration: 0.35 }}
                  >
                    <p className="text-[8px] tracking-[0.15em] text-cream/30 mb-0.5">
                      {detail.label}
                    </p>
                    <p className="text-[13px] font-semibold tracking-wide text-cream/90">
                      {detail.value}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Welcome line */}
              <motion.div
                className="px-5 pb-5 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.4 }}
              >
                <p className="text-[12px] tracking-[0.15em] text-gold/70 font-semibold">
                  ✈ HOŞ GELDİNİZ
                </p>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
