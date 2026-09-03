"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const LINKS = [
  { href: "#heritage", label: "Heritage" },
  { href: "#craft", label: "Craft" },
  { href: "#colorways", label: "Colorways" },
  { href: "#reviews", label: "Reviews" },
  { href: "#faq", label: "FAQ" },
];

export function Nav() {
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        solid ? "bg-obsidian/85 backdrop-blur-md border-b border-white/5" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-5 md:px-12">
        <a href="#top" className="font-display text-lg tracking-widest2 text-bone">
          AJ&nbsp;IV
        </a>
        <ul className="hidden items-center gap-10 text-xs uppercase tracking-widest2 text-fog md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="transition-colors hover:text-bone">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <a
          href="#configurator"
          className="border border-bone/30 px-5 py-2 text-xs uppercase tracking-widest2 text-bone transition-colors hover:border-jordan hover:text-jordan"
        >
          Acquire
        </a>
      </nav>
    </motion.header>
  );
}
