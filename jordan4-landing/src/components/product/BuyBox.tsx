"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  GIFT_THRESHOLD,
  HIGHLIGHTS,
  PRODUCT,
  SHIPPING_INFO,
  SIZES,
  STOCK,
  TRUST_BADGES,
} from "@/lib/nb740-data";

const ICONS: Record<string, React.ReactNode> = {
  check: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20 7 9 18l-5-5" />
    </svg>
  ),
  bolt: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
    </svg>
  ),
  return: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 10a8 8 0 1 1 2.6 5.9" />
      <path d="M3 4v6h6" />
    </svg>
  ),
  chat: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 12a8 8 0 1 1-3.4-6.5L21 4l-1 3.5A7.9 7.9 0 0 1 21 12Z" />
    </svg>
  ),
};

function formatHuf(n: number) {
  return `${n.toLocaleString("hu-HU")} ${PRODUCT.currency}`;
}

export function BuyBox({ onSizeChange }: { onSizeChange?: (size: string | null) => void }) {
  const [size, setSize] = useState<string | null>(PRODUCT.urlSize);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  const cartValue = PRODUCT.price * qty;
  const giftProgress = Math.min(cartValue / GIFT_THRESHOLD.target, 1);

  function selectSize(s: string) {
    if (STOCK[s] === "out") return;
    setSize(s);
    onSizeChange?.(s);
  }

  function handleAddToCart() {
    if (!size) return;
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
  }

  return (
    <div>
      <p className="text-sm text-[#7a7a63]">{PRODUCT.tag}</p>
      <h1 className="mt-1 text-3xl font-bold leading-tight text-[#1f2318] md:text-4xl">
        {PRODUCT.name} <span className="font-normal text-[#5a5943]">— {PRODUCT.colorway}</span>
      </h1>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#5a5943]">
        <span>Cikkszám: {PRODUCT.styleCode}</span>
        <span className="text-[#c9c4a8]">·</span>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5 text-[#c47a2e]">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i < Math.round(PRODUCT.rating) ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.3}>
                <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.9L5.7 21l1.7-7-5.4-4.7 7.1-.6L12 2z" />
              </svg>
            ))}
          </div>
          <span>
            {PRODUCT.rating}/5 · {PRODUCT.reviewCount} elégedett vásárló
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d8d2b8] bg-[#fbf9f2] px-3 py-1 text-xs font-medium text-[#1f2318]">
          🛡️ 100% eredetiséggarancia
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eaf1d8] px-3 py-1 text-xs font-medium text-[#4d5c28]">
          ● Raktáron
        </span>
      </div>

      <div className="mt-6">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold text-[#1f2318]">{formatHuf(PRODUCT.price)}</span>
          <span className="text-lg text-[#a8a48c] line-through">{formatHuf(PRODUCT.compareAtPrice)}</span>
          <span className="rounded-full bg-[#b3392f] px-2.5 py-0.5 text-xs font-semibold text-white">
            -{PRODUCT.discountPct}%
          </span>
        </div>
        <p className="mt-1 text-sm font-medium text-[#4d7c2e]">
          {PRODUCT.savings.toLocaleString("hu-HU")} Ft-ot spórolsz
        </p>
        <p className="text-xs text-[#8a8870]">{PRODUCT.saleStartLabel}</p>
      </div>

      <ul className="mt-6 space-y-2 text-sm text-[#4a4938]">
        {HIGHLIGHTS.map((h) => (
          <li key={h} className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7a8a3a]" />
            {h}
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[#1f2318]">Méret</p>
          <a href="#meretezes" className="text-xs text-[#7a7a63] underline underline-offset-4 hover:text-[#1f2318]">
            Mérettáblázat
          </a>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
          {SIZES.map((s) => {
            const isOut = STOCK[s] === "out";
            const isSelected = size === s;
            return (
              <button
                key={s}
                disabled={isOut}
                onClick={() => selectSize(s)}
                className={`relative rounded-lg border px-2 py-2.5 text-sm transition-colors ${
                  isOut
                    ? "cursor-not-allowed border-[#e2ddc9] text-[#c9c4a8] line-through"
                    : isSelected
                      ? "border-[#1f2318] bg-[#1f2318] text-white"
                      : "border-[#d8d2b8] text-[#1f2318] hover:border-[#7a8a3a]"
                }`}
              >
                {s.replace("EU ", "")}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-[#7a7a63]">
          A New Balance 740 valósághűen méretezett — a legtöbb vásárló a megszokott méretét választja.
        </p>
      </div>

      <div className="mt-6 flex gap-3">
        <div className="flex items-center rounded-xl border border-[#d8d2b8]">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="px-4 py-4 text-[#1f2318] hover:bg-[#f1ede1]"
            aria-label="Mennyiség csökkentése"
          >
            −
          </button>
          <span className="w-6 text-center text-sm font-medium text-[#1f2318]">{qty}</span>
          <button
            onClick={() => setQty((q) => q + 1)}
            className="px-4 py-4 text-[#1f2318] hover:bg-[#f1ede1]"
            aria-label="Mennyiség növelése"
          >
            +
          </button>
        </div>
        <button
          onClick={handleAddToCart}
          disabled={!size}
          className="flex-1 rounded-xl bg-[#b3562e] py-4 text-sm font-semibold uppercase tracking-wide text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {size ? "Kosárba teszem" : "Válassz méretet"}
        </button>
      </div>

      {added && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-center text-sm font-medium text-[#7a8a3a]"
        >
          A termék bekerült a kosaradba.
        </motion.p>
      )}

      <div className="mt-6 flex items-center gap-6 text-[#5a5943]">
        <button onClick={() => setWishlisted((w) => !w)} className="flex items-center gap-1.5 text-xs hover:text-[#1f2318]" aria-label="Kedvencekhez adás">
          <svg width="18" height="18" viewBox="0 0 24 24" fill={wishlisted ? "#b3392f" : "none"} stroke={wishlisted ? "#b3392f" : "currentColor"} strokeWidth="1.6">
            <path d="M12 21s-7-4.35-9.5-8.5C.9 9 2.5 5.5 6 5c2-.3 3.7.8 6 3 2.3-2.2 4-3.3 6-3 3.5.5 5.1 4 3.5 7.5C19 16.65 12 21 12 21Z" />
          </svg>
          Kedvenc
        </button>
        <button className="flex items-center gap-1.5 text-xs hover:text-[#1f2318]" aria-label="Megosztás">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
            <path d="M16 6l-4-4-4 4" />
            <path d="M12 2v13" />
          </svg>
          Megosztás
        </button>
        <button className="flex items-center gap-1.5 text-xs hover:text-[#1f2318]" aria-label="Összehasonlítás">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M7 3v13M7 21l-3-4h6zM17 21V8M17 3l3 4h-6z" />
          </svg>
          Összehasonlítás
        </button>
      </div>

      <div className="mt-6 rounded-xl border border-[#e2ddc9] bg-[#fbf9f2] p-4">
        <p className="text-xs text-[#4a4938]">{GIFT_THRESHOLD.label}</p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e2ddc9]">
          <div className="h-full rounded-full bg-[#7a8a3a]" style={{ width: `${giftProgress * 100}%` }} />
        </div>
        {giftProgress < 1 ? (
          <p className="mt-1.5 text-[11px] text-[#7a7a63]">
            Már csak {(GIFT_THRESHOLD.target - cartValue).toLocaleString("hu-HU")} Ft van hátra az ajándékig.
          </p>
        ) : (
          <p className="mt-1.5 text-[11px] font-medium text-[#4d7c2e]">A rendelésed jogosult az ajándékra!</p>
        )}
      </div>

      <p className="mt-3 text-xs text-[#8a8870]">
        A vásárlás után járó pontok: <span className="font-medium text-[#1f2318]">{PRODUCT.loyaltyPoints} Ft</span>
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 border-t border-[#e2ddc9] pt-6 sm:grid-cols-4">
        {TRUST_BADGES.map((b) => (
          <div key={b.title} className="text-center text-[11px] text-[#5a5943]">
            <div className="mx-auto mb-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-[#eaf1d8] text-[#4d5c28]">
              {ICONS[b.icon]}
            </div>
            <p className="font-semibold text-[#1f2318]">{b.title}</p>
            <p>{b.note}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3 rounded-xl bg-[#f1ede1] p-4 text-center text-[11px] text-[#5a5943]">
        {SHIPPING_INFO.map((s) => (
          <div key={s.title}>
            <p className="font-semibold text-[#1f2318]">{s.title}</p>
            <p>{s.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
