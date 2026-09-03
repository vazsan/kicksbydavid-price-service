"use client";

import { motion } from "framer-motion";

export function ProductNav() {
  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-0 z-40 border-b border-[#e2ddc9] bg-[#f7f4ec]/90 backdrop-blur-md"
    >
      <div className="bg-[#1f2318] py-2 text-center text-xs font-medium text-white">
        50 000 Ft felett <span className="text-[#c3d16a]">INGYENES</span> a szállítás!
      </div>
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-6 py-4 md:px-10">
        <a href="/" className="text-lg font-bold tracking-tight text-[#1f2318]">
          KICKS<span className="text-[#7a8a3a]">BY</span>DAVID
        </a>
        <nav className="hidden items-center gap-8 text-sm text-[#4a4938] md:flex">
          <a href="#" className="hover:text-[#1f2318]">Férfi</a>
          <a href="#" className="hover:text-[#1f2318]">Női</a>
          <a href="#" className="hover:text-[#1f2318]">Új érkezők</a>
          <a href="#" className="hover:text-[#1f2318]">Akciók</a>
        </nav>
        <div className="flex items-center gap-4 text-sm text-[#4a4938]">
          <button aria-label="Keresés" className="hover:text-[#1f2318]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>
          <button aria-label="Kosár" className="relative hover:text-[#1f2318]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 6h15l-1.5 9h-12z" />
              <path d="M6 6 4.5 3H2" />
              <circle cx="9.5" cy="20" r="1.2" fill="currentColor" stroke="none" />
              <circle cx="17.5" cy="20" r="1.2" fill="currentColor" stroke="none" />
            </svg>
            <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#7a8a3a] text-[10px] text-white">
              1
            </span>
          </button>
        </div>
      </div>
    </motion.header>
  );
}
