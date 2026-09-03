"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { COLORWAYS } from "@/lib/data";
import { Reveal } from "@/components/ui/Reveal";

export function Gallery() {
  const [active, setActive] = useState(0);
  const colorway = COLORWAYS[active];

  return (
    <section id="colorways" className="relative bg-charcoal px-6 py-28 md:px-12 md:py-40">
      <Reveal>
        <p className="eyebrow mb-3">Four Ways to Wear the Archive</p>
      </Reveal>
      <Reveal delay={0.05}>
        <h2 className="max-w-3xl font-display text-5xl leading-[0.95] text-bone md:text-7xl">
          Colorways of Record
        </h2>
      </Reveal>

      <div className="mt-16 grid gap-10 md:grid-cols-[1.3fr_1fr] md:gap-16">
        <div className="relative h-[50vh] overflow-hidden rounded-sm border border-white/10 md:h-[64vh]">
          <AnimatePresence mode="wait">
            <motion.div
              key={colorway.id}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0"
              style={{
                background: `radial-gradient(circle at 40% 35%, ${colorway.swatch}33, #0a0908 70%)`,
              }}
            >
              <div className="absolute inset-0 flex items-end p-8 md:p-12">
                <div>
                  <span className="eyebrow text-gold">Colorway 0{active + 1} / 04</span>
                  <h3 className="mt-3 font-display text-4xl text-bone md:text-6xl">{colorway.label}</h3>
                </div>
              </div>
              <div
                className="absolute right-10 top-10 h-24 w-24 rounded-full border border-white/20 md:h-32 md:w-32"
                style={{ background: colorway.swatch }}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex flex-col justify-center">
          <p className="max-w-sm font-serif text-xl italic leading-relaxed text-bone md:text-2xl">
            {colorway.description}
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            {COLORWAYS.map((c, i) => (
              <button
                key={c.id}
                onClick={() => setActive(i)}
                className={`group flex items-center gap-3 border px-4 py-3 text-left text-xs uppercase tracking-widest2 transition-colors ${
                  i === active ? "border-bone text-bone" : "border-white/15 text-fog hover:border-white/40"
                }`}
              >
                <span
                  className="h-3 w-3 rounded-full border border-white/30"
                  style={{ background: c.swatch }}
                />
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
