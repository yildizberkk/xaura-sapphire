"use client";

import { motion } from "framer-motion";

export default function Header() {
  return (
    <motion.header
      className="pt-10 pb-4 text-center"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <h1 className="leading-none">
        <span className="block text-[28px] font-extrabold tracking-[0.15em] text-cream">
          SAPPHIRE
        </span>
        <span className="block text-[28px] font-light tracking-[0.15em] text-gold">
          MOMENTUM
        </span>
        <span className="block text-[22px] font-bold tracking-[0.2em] text-gold">
          II
        </span>
      </h1>
      <p className="mt-2 text-[10px] tracking-[0.2em] text-cream/40">
        24-26 NİSAN &bull; ANTALYA
      </p>
    </motion.header>
  );
}
