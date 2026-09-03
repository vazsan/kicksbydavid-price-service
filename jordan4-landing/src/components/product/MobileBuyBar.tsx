"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PRODUCT } from "@/lib/nb740-data";

export function MobileBuyBar({ selectedSize }: { selectedSize: string | null }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      const gallery = document.getElementById("buy-box");
      if (!gallery) return;
      setVisible(gallery.getBoundingClientRect().bottom < 0);
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
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e2ddc9] bg-[#f7f4ec]/95 px-5 py-3 backdrop-blur-md md:hidden"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#1f2318]">{PRODUCT.name}</p>
              <p className="text-xs text-[#7a7a63]">
                {selectedSize ?? "Válassz méretet"} · {PRODUCT.price.toLocaleString("hu-HU")} Ft
              </p>
            </div>
            <a
              href="#buy-box"
              className="shrink-0 rounded-lg bg-[#1f2318] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-white"
            >
              Kosárba
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
