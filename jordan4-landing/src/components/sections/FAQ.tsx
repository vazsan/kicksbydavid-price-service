"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FAQ as FAQ_ITEMS } from "@/lib/data";
import { Reveal } from "@/components/ui/Reveal";

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative bg-obsidian px-6 py-28 md:px-12 md:py-40">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <p className="eyebrow mb-3 text-center">Before You Acquire</p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="text-center font-display text-5xl leading-[0.95] text-bone md:text-6xl">
            Questions, Answered
          </h2>
        </Reveal>

        <div className="mt-16">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q} className="border-b border-white/10">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between py-6 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="pr-6 font-display text-xl text-bone md:text-2xl">{item.q}</span>
                  <span
                    className={`text-2xl text-gold transition-transform duration-500 ${isOpen ? "rotate-45" : ""}`}
                  >
                    +
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="pb-6 max-w-xl text-sm leading-relaxed text-fog">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
