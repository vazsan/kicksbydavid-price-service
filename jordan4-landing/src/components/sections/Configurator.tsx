"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { COLORWAYS, PRODUCT, SIZES, STOCK_LEVELS } from "@/lib/data";
import { Reveal } from "@/components/ui/Reveal";
import { Magnetic } from "@/components/ui/Magnetic";

const STOCK_DOT: Record<string, string> = {
  low: "bg-jordan",
  medium: "bg-gold",
  high: "bg-fog",
};

export function Configurator() {
  const [colorway, setColorway] = useState(0);
  const [size, setSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const selected = COLORWAYS[colorway];

  function handleReserve() {
    if (!size) return;
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2400);
  }

  return (
    <section id="configurator" className="relative bg-obsidian px-6 py-28 md:px-12 md:py-40">
      <div className="grid gap-16 md:grid-cols-[1fr_1.1fr]">
        <div>
          <Reveal>
            <p className="eyebrow mb-3">Configure Your Pair</p>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="font-display text-5xl leading-[0.95] text-bone md:text-6xl">
              {PRODUCT.name}
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-4 font-serif text-2xl italic text-gold">
              ${PRODUCT.price.toFixed(0)} USD
            </p>
          </Reveal>
          <Reveal delay={0.15} className="mt-8 max-w-md text-sm leading-relaxed text-fog">
            <p>
              Each pair is numbered and issued with a signed authentication
              card. This is not restock inventory — once a size in a
              colorway sells out, it will not return.
            </p>
          </Reveal>

          <Reveal delay={0.2} className="mt-10">
            <p className="eyebrow mb-4">Colorway — {selected.label}</p>
            <div className="flex flex-wrap gap-3">
              {COLORWAYS.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => setColorway(i)}
                  aria-label={c.label}
                  className={`h-10 w-10 rounded-full border-2 transition-transform hover:scale-110 ${
                    i === colorway ? "border-bone" : "border-transparent"
                  }`}
                  style={{ background: c.swatch }}
                />
              ))}
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.1} className="border border-white/10 bg-charcoal p-8 md:p-12">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Select Size</p>
            <a href="#faq" className="text-xs text-fog underline decoration-white/20 underline-offset-4 hover:text-bone">
              Size guide
            </a>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {SIZES.map((s) => {
              const stock = STOCK_LEVELS[s];
              const isSelected = size === s;
              return (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`relative border px-3 py-4 text-sm transition-colors ${
                    isSelected
                      ? "border-bone bg-bone text-obsidian"
                      : "border-white/15 text-bone hover:border-white/40"
                  }`}
                >
                  {s}
                  <span
                    className={`absolute right-2 top-2 h-1.5 w-1.5 rounded-full ${STOCK_DOT[stock]}`}
                    title={`${stock} stock`}
                  />
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex items-center gap-4 text-xs text-fog">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-fog" /> In stock
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" /> Limited
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-jordan" /> Almost gone
            </span>
          </div>

          <Magnetic className="mt-10 inline-block">
            <button
              onClick={handleReserve}
              disabled={!size}
              className="w-full border border-jordan bg-jordan px-8 py-4 text-xs uppercase tracking-widest2 text-bone transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-transparent disabled:text-fog md:w-auto"
            >
              {size ? `Reserve — Size ${size}` : "Select a size"}
            </button>
          </Magnetic>

          {added && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-xs uppercase tracking-widest2 text-gold"
            >
              Reserved — check your inbox for the authentication invite.
            </motion.p>
          )}

          <p className="mt-6 text-xs text-fog">
            Free insured shipping · 30-day returns · SKU {PRODUCT.sku}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
