"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GALLERY } from "@/lib/nb740-data";

// Product photography from kicksbydavid.hu could not be fetched into this
// build (network egress to that domain is blocked from this environment).
// The panel below is a stand-in tuned to the real shot's palette (cream
// mesh upper, lime green N-logo/side accents, tan midsole) — swap it for
// the real photos before shipping.

function ViewArt({ view }: { view: (typeof GALLERY)[number]["id"] }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,#faf8ee,#f1ede0_75%)]" />
      <div className="relative h-[52%] w-[80%]">
        {/* midsole */}
        <div
          className="absolute inset-x-0 bottom-0 h-[38%] rounded-[2rem]"
          style={{ background: view === "sole" ? "linear-gradient(135deg,#d8c99a,#a98f5c)" : "linear-gradient(180deg,#e7d9ae,#c9b183)" }}
        />
        {/* upper */}
        <div
          className="absolute inset-x-[6%] top-0 h-[72%] rounded-[1.75rem] border border-[#e4dfca]"
          style={{
            background:
              view === "detail"
                ? "linear-gradient(120deg,#f8f6ec 0%,#d7e6a1 55%,#8ea25a 100%)"
                : view === "box"
                  ? "linear-gradient(160deg,#efe8d4,#d8d2b8)"
                  : "linear-gradient(120deg,#faf8ee 0%,#f2eddb 45%,#c7d98a 100%)",
          }}
        >
          <div className="absolute inset-x-[15%] top-[30%] h-[16%] rounded-full bg-[#a9c25f]/70" />
        </div>
      </div>
    </div>
  );
}

export function ProductGallery() {
  const [index, setIndex] = useState(0);
  const active = GALLERY[index];

  const go = (dir: 1 | -1) => setIndex((i) => (i + dir + GALLERY.length) % GALLERY.length);

  return (
    <div>
      <div className="relative h-[380px] overflow-hidden rounded-2xl border border-[#e2ddc9] bg-[#f7f4ec] sm:h-[460px] md:h-[560px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            <ViewArt view={active.id} />
          </motion.div>
        </AnimatePresence>

        <span className="absolute left-4 top-4 rounded-full bg-[#7a8a3a] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
          Új
        </span>
        <span className="absolute left-4 top-12 rounded-full bg-[#b3392f] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
          -23%
        </span>

        <button
          onClick={() => go(-1)}
          aria-label="Előző kép"
          className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-[#1f2318] shadow-sm hover:bg-white"
        >
          ‹
        </button>
        <button
          onClick={() => go(1)}
          aria-label="Következő kép"
          className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-[#1f2318] shadow-sm hover:bg-white"
        >
          ›
        </button>
        <span className="absolute bottom-3 right-4 rounded-full bg-black/40 px-2.5 py-1 text-[11px] text-white">
          {index + 1} / {GALLERY.length}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-5 gap-3">
        {GALLERY.map((g, i) => (
          <button
            key={g.id}
            onClick={() => setIndex(i)}
            className={`aspect-square overflow-hidden rounded-xl border-2 transition-colors ${
              i === index ? "border-[#7a8a3a]" : "border-[#e2ddc9] hover:border-[#c3d16a]"
            }`}
            aria-label={g.label}
          >
            <ViewArt view={g.id} />
          </button>
        ))}
      </div>
    </div>
  );
}
