"use client";

import { useEffect, useRef } from "react";
import { TIMELINE } from "@/lib/data";
import { registerGsap } from "@/lib/gsap";

export function Heritage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const { gsap, ScrollTrigger } = registerGsap();
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    const ctx = gsap.context(() => {
      const distance = track.scrollWidth - container.clientWidth;
      gsap.to(track, {
        x: -distance,
        ease: "none",
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: () => `+=${distance + window.innerHeight}`,
          scrub: 1,
          pin: true,
          anticipatePin: 1,
        },
      });
    }, container);

    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <section id="heritage" ref={containerRef} className="relative overflow-hidden bg-charcoal">
      <div className="flex h-screen flex-col justify-center">
        <div className="px-6 md:px-12">
          <p className="eyebrow mb-3">A Lineage, Not a Launch</p>
          <h2 className="font-display text-5xl text-bone md:text-7xl">37 Years of Legend</h2>
        </div>
        <div ref={trackRef} className="mt-16 flex w-max gap-6 px-6 will-change-transform md:mt-24 md:gap-10 md:px-12">
          {TIMELINE.map((item) => (
            <article
              key={item.year}
              className="group flex h-[46vh] w-[78vw] shrink-0 flex-col justify-between border border-white/10 bg-obsidian/60 p-8 transition-colors hover:border-jordan/50 md:h-[54vh] md:w-[38vw] md:p-12"
            >
              <span className="font-display text-7xl text-transparent text-outline md:text-8xl">
                {item.year}
              </span>
              <p className="max-w-xs font-serif text-xl leading-snug text-bone md:text-2xl">
                {item.label}
              </p>
            </article>
          ))}
          <div className="flex h-[46vh] w-[60vw] shrink-0 items-center md:h-[54vh] md:w-[26vw]">
            <p className="font-serif text-2xl italic text-fog">
              &mdash; and the story continues with you.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
