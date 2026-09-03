"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { RevealLines } from "@/components/ui/Reveal";

const ShoeCanvas = dynamic(() => import("./ShoeCanvas").then((m) => m.ShoeCanvas), {
  ssr: false,
});

export function Hero() {
  return (
    <section id="hero-stage" className="relative h-[220vh]" aria-label="Air Jordan 4 hero showcase">
      <div id="top" className="sticky top-0 h-screen w-full overflow-hidden bg-obsidian">
        <div className="absolute inset-0 bg-spotlight" />
        <div className="absolute inset-0">
          <ShoeCanvas />
        </div>

        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between px-6 pb-10 pt-28 md:px-12 md:py-16">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.2 }}
            className="flex items-center justify-between text-xs uppercase tracking-widest2 text-fog"
          >
            <span>Est. 1989</span>
            <span className="hidden md:inline">Limited Reissue · Edition 04/23</span>
            <span>Chicago, IL</span>
          </motion.div>

          <div>
            <p className="eyebrow mb-4">The Icon, Reissued</p>
            <h1 className="font-display text-[15vw] leading-[0.82] tracking-tightest text-bone md:text-[9.5vw]">
              <RevealLines lines={["AIR JORDAN", "IV RETRO"]} />
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1.1, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 max-w-md font-serif text-lg italic text-fog"
            >
              &ldquo;Not a re-release. A restoration.&rdquo;
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.4 }}
            className="flex items-end justify-between"
          >
            <div className="hidden text-xs text-fog md:block">
              <p className="mb-1 uppercase tracking-widest2 text-gold">Scroll to unveil</p>
              <p>Ballistic mesh · Nubuck · Visible Air</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="h-12 w-px animate-pulse bg-bone/40" />
              <span className="text-[10px] uppercase tracking-widest2 text-fog">Scroll</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
