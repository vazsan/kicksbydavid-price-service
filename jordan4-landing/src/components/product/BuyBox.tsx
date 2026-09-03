"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { HIGHLIGHTS, PRODUCT, SIZES, STOCK } from "@/lib/nb740-data";

const STOCK_LABEL: Record<string, string> = {
  in: "Raktáron",
  low: "Utolsó darabok",
  out: "Elfogyott",
};
const STOCK_DOT: Record<string, string> = {
  in: "bg-[#7a8a3a]",
  low: "bg-[#c47a2e]",
  out: "bg-[#b3392f]",
};

function formatHuf(n: number) {
  return `${n.toLocaleString("hu-HU")} ${PRODUCT.currency}`;
}

export function BuyBox({ onSizeChange }: { onSizeChange?: (size: string | null) => void }) {
  const [size, setSize] = useState<string | null>(PRODUCT.urlSize);
  const [added, setAdded] = useState(false);
  const discount = Math.round((1 - PRODUCT.price / PRODUCT.compareAtPrice) * 100);

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
      <p className="text-sm text-[#7a7a63]">
        {PRODUCT.brand} <span className="mx-1.5 text-[#c9c4a8]">/</span> {PRODUCT.category}
      </p>
      <h1 className="mt-2 text-3xl font-bold leading-tight text-[#1f2318] md:text-4xl">
        {PRODUCT.name} <span className="font-normal text-[#5a5943]">— {PRODUCT.colorway}</span>
      </h1>

      <div className="mt-3 flex items-center gap-3 text-sm text-[#5a5943]">
        <div className="flex items-center gap-0.5 text-[#c47a2e]">
          {Array.from({ length: 5 }).map((_, i) => (
            <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i < Math.round(PRODUCT.rating) ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.3}>
              <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.9L5.7 21l1.7-7-5.4-4.7 7.1-.6L12 2z" />
            </svg>
          ))}
        </div>
        <span>
          {PRODUCT.rating} · {PRODUCT.reviewCount} értékelés
        </span>
        <span className="text-[#c9c4a8]">·</span>
        <span>Cikkszám: {PRODUCT.styleCode}</span>
      </div>

      <div className="mt-6 flex items-baseline gap-3">
        <span className="text-3xl font-bold text-[#1f2318]">{formatHuf(PRODUCT.price)}</span>
        <span className="text-lg text-[#a8a48c] line-through">{formatHuf(PRODUCT.compareAtPrice)}</span>
        <span className="rounded-full bg-[#f0e7c8] px-2.5 py-0.5 text-xs font-semibold text-[#8a5a1a]">
          -{discount}%
        </span>
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
            const state = STOCK[s];
            const isOut = state === "out";
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
                {!isOut && (
                  <span className={`absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full ${STOCK_DOT[state]}`} />
                )}
              </button>
            );
          })}
        </div>
        {size && (
          <p className="mt-2 text-xs text-[#7a7a63]">
            {size}: <span className="font-medium">{STOCK_LABEL[STOCK[size]]}</span>
          </p>
        )}
      </div>

      <button
        onClick={handleAddToCart}
        disabled={!size}
        className="mt-6 w-full rounded-xl bg-[#1f2318] py-4 text-sm font-semibold uppercase tracking-wide text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {size ? "Kosárba teszem" : "Válassz méretet"}
      </button>

      {added && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-center text-sm font-medium text-[#7a8a3a]"
        >
          A termék bekerült a kosaradba.
        </motion.p>
      )}

      <div className="mt-6 grid grid-cols-3 gap-3 border-t border-[#e2ddc9] pt-6 text-center text-[11px] text-[#5a5943]">
        <div>
          <p className="font-semibold text-[#1f2318]">Ingyenes szállítás</p>
          <p>15 000 Ft felett</p>
        </div>
        <div>
          <p className="font-semibold text-[#1f2318]">14 napos csere</p>
          <p>bontatlan termékre</p>
        </div>
        <div>
          <p className="font-semibold text-[#1f2318]">Eredetiség</p>
          <p>garantált, hivatalos forgalmazó</p>
        </div>
      </div>
    </div>
  );
}
