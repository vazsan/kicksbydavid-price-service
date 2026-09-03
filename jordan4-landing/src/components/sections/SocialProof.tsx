"use client";

import { REVIEWS } from "@/lib/data";
import { Reveal } from "@/components/ui/Reveal";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1 text-gold" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i < rating ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.2}>
          <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.9L5.7 21l1.7-7-5.4-4.7 7.1-.6L12 2z" />
        </svg>
      ))}
    </div>
  );
}

export function SocialProof() {
  const avg = (REVIEWS.reduce((s, r) => s + r.rating, 0) / REVIEWS.length).toFixed(1);

  return (
    <section id="reviews" className="relative bg-charcoal px-6 py-28 md:px-12 md:py-40">
      <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
        <div>
          <Reveal>
            <p className="eyebrow mb-3">The Collectors Speak</p>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="font-display text-5xl leading-[0.95] text-bone md:text-6xl">
              Verified Ownership
            </h2>
          </Reveal>
        </div>
        <Reveal delay={0.1} className="flex items-center gap-4">
          <span className="font-display text-6xl text-bone">{avg}</span>
          <div>
            <Stars rating={Math.round(Number(avg))} />
            <p className="mt-1 text-xs text-fog">{REVIEWS.length * 214} verified reviews</p>
          </div>
        </Reveal>
      </div>

      <div className="mt-16 grid gap-px overflow-hidden bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
        {REVIEWS.map((r, i) => (
          <Reveal key={r.name} delay={i * 0.06} className="flex h-full flex-col justify-between bg-charcoal p-6 md:p-8">
            <div>
              <Stars rating={r.rating} />
              <p className="mt-4 font-serif text-base italic leading-relaxed text-bone">
                &ldquo;{r.quote}&rdquo;
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between text-xs text-fog">
              <span>{r.name}</span>
              {r.verified && <span className="text-gold">Verified Buyer</span>}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
