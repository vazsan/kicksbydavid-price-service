"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PRODUCT } from "@/lib/data";

export function StickyPurchaseBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      const heroEl = document.getElementById("hero-stage");
      const footerEl = document.querySelector("footer");
      const heroBottom = heroEl ? heroEl.getBoundingClientRect().bottom : 0;
      const footerTop = footerEl ? footerEl.getBoundingClientRect().top : Infinity;
      setVisible(heroBottom < 0 && footerTop > window.innerHeight);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-obsidian/90 px-6 py-4 backdrop-blur-md md:px-12"
        >
          <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate font-display text-lg text-bone md:text-xl">{PRODUCT.name}</p>
              <p className="text-xs text-gold">${PRODUCT.price.toFixed(0)} USD</p>
            </div>
            <a
              href="#configurator"
              className="shrink-0 border border-jordan bg-jordan px-6 py-3 text-xs uppercase tracking-widest2 text-bone transition-opacity hover:opacity-90"
            >
              Reserve
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
