"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;

export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "span";
}) {
  const MotionTag = as === "span" ? motion.span : motion.div;
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 1.1, delay, ease: EASE }}
    >
      {children}
    </MotionTag>
  );
}

export function RevealLines({
  lines,
  className,
  delayStep = 0.08,
  offset = 220,
}: {
  lines: string[];
  className?: string;
  delayStep?: number;
  offset?: number;
}) {
  // The clip mask (overflow: hidden) on each line fully hides the
  // transformed child whenever `offset` exceeds one line's height, which
  // means a whileInView observer placed on the child itself can never
  // report "in view" — a permanent deadlock. So viewport detection lives
  // on this unclipped wrapper instead, and the reveal state is propagated
  // down to the clipped children via variants.
  const container: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: delayStep } },
  };
  const line: Variants = {
    hidden: { y: offset },
    visible: { y: 0, transition: { duration: 1, ease: EASE } },
  };

  return (
    <motion.span
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={container}
    >
      {lines.map((l) => (
        <span key={l} style={{ display: "block", overflow: "hidden" }}>
          <motion.span style={{ display: "block" }} variants={line}>
            {l}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}
