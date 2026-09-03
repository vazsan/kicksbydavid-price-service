"use client";

import { PRODUCT, REVIEWS } from "@/lib/nb740-data";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 text-[#c47a2e]">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill={i < rating ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.3}>
          <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.9L5.7 21l1.7-7-5.4-4.7 7.1-.6L12 2z" />
        </svg>
      ))}
    </div>
  );
}

export function ReviewsSection() {
  return (
    <section className="mt-24">
      <div className="flex items-end justify-between">
        <h2 className="text-2xl font-bold text-[#1f2318]">Vásárlói vélemények</h2>
        <div className="flex items-center gap-2 text-sm text-[#5a5943]">
          <Stars rating={Math.round(PRODUCT.rating)} />
          <span>
            {PRODUCT.rating} / 5 · {PRODUCT.reviewCount} értékelés
          </span>
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {REVIEWS.map((r) => (
          <div key={r.name} className="rounded-xl border border-[#e2ddc9] bg-[#fbf9f2] p-5">
            <Stars rating={r.rating} />
            <p className="mt-3 text-sm leading-relaxed text-[#3a3927]">&bdquo;{r.quote}&rdquo;</p>
            <p className="mt-4 text-xs font-medium text-[#7a7a63]">{r.name} · Hitelesített vásárló</p>
          </div>
        ))}
      </div>
    </section>
  );
}
