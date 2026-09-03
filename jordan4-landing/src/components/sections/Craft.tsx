"use client";

import { MATERIALS } from "@/lib/data";
import { Reveal } from "@/components/ui/Reveal";

const SWATCH_STYLES = [
  "bg-[radial-gradient(circle_at_30%_30%,#3a3733,#0a0908)]",
  "bg-[linear-gradient(135deg,#2c2924,#0a0908_60%)]",
  "bg-[linear-gradient(160deg,#c8102e_0%,#2c0a0f_55%,#0a0908_100%)]",
  "bg-[radial-gradient(circle_at_70%_40%,#8b8680,#141414_70%)]",
];

export function Craft() {
  return (
    <section id="craft" className="relative bg-obsidian px-6 py-28 md:px-12 md:py-40">
      <Reveal>
        <p className="eyebrow mb-3">Materials &amp; Construction</p>
      </Reveal>
      <Reveal delay={0.05}>
        <h2 className="max-w-3xl font-display text-5xl leading-[0.95] text-bone md:text-7xl">
          Built From Four Ideas That Never Aged
        </h2>
      </Reveal>

      <div className="mt-20 grid gap-px overflow-hidden bg-white/10 md:grid-cols-2">
        {MATERIALS.map((m, i) => (
          <Reveal key={m.title} delay={i * 0.08} className="bg-obsidian p-8 md:p-14">
            <div className={`mb-8 h-40 w-full rounded-sm md:h-56 ${SWATCH_STYLES[i % SWATCH_STYLES.length]} mask-fade-b`} />
            <span className="eyebrow text-gold">0{i + 1}</span>
            <h3 className="mt-3 font-display text-2xl text-bone md:text-3xl">{m.title}</h3>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-fog">{m.body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
