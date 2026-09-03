"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GALLERY } from "@/lib/nb740-data";

// Product photography from kicksbydavid.hu could not be fetched into this
// build (network egress to that domain is blocked from this environment),
// so the gallery is a stand-in silhouette rendered in the Dry Lime / Linen
// palette. Swap the <ViewArt> panels for real shots before shipping.

function ViewArt({ view }: { view: (typeof GALLERY)[number]["id"] }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,#e8e5c9,#f7f4ec_70%)]" />
      <div
        className="relative h-[55%] w-[78%] rounded-[3rem] border border-[#d8d2b8] shadow-inner"
        style={{
          background:
            view === "sole"
              ? "linear-gradient(135deg,#c3d16a,#7a8a3a 70%)"
              : view === "detail"
                ? "linear-gradient(135deg,#f2ede0,#c3d16a 60%,#8a7d5a)"
                : view === "box"
                  ? "linear-gradient(160deg,#efe8d4,#d8d2b8)"
                  : "linear-gradient(120deg,#f2ede0 0%,#e3dcc0 45%,#c3d16a 100%)",
        }}
      >
        <div className="absolute inset-x-8 bottom-6 h-3 rounded-full bg-[#7a8a3a]/70" />
        <div className="absolute inset-x-12 top-8 h-8 rounded-2xl bg-[#f7f4ec]/60" />
      </div>
    </div>
  );
}

export function ProductGallery() {
  const [active, setActive] = useState<(typeof GALLERY)[number]["id"]>("side");

  return (
    <div>
      <div className="relative h-[380px] overflow-hidden rounded-2xl border border-[#e2ddc9] bg-[#f7f4ec] sm:h-[460px] md:h-[560px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            <ViewArt view={active} />
          </motion.div>
        </AnimatePresence>
        <span className="absolute left-4 top-4 rounded-full bg-[#7a8a3a] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
          Új
        </span>
      </div>

      <div className="mt-4 grid grid-cols-5 gap-3">
        {GALLERY.map((g) => (
          <button
            key={g.id}
            onClick={() => setActive(g.id)}
            className={`aspect-square overflow-hidden rounded-xl border-2 transition-colors ${
              active === g.id ? "border-[#7a8a3a]" : "border-[#e2ddc9] hover:border-[#c3d16a]"
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
