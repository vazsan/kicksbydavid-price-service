"use client";

import { RELATED } from "@/lib/nb740-data";

const SWATCHES = [
  "linear-gradient(135deg,#efe4d0,#c9b98a)",
  "linear-gradient(135deg,#e7e2d6,#9aa27a)",
  "linear-gradient(135deg,#f0ece0,#b7ada0)",
  "linear-gradient(135deg,#eee6cf,#7f8f6a)",
];

export function RelatedProducts() {
  return (
    <section className="mt-24">
      <h2 className="text-2xl font-bold text-[#1f2318]">Ezt is szeretheted</h2>
      <div className="mt-6 grid grid-cols-2 gap-5 md:grid-cols-4">
        {RELATED.map((p, i) => (
          <a
            key={p.name}
            href="#"
            className="group block overflow-hidden rounded-xl border border-[#e2ddc9] bg-[#fbf9f2] transition-shadow hover:shadow-md"
          >
            <div className="aspect-square" style={{ background: SWATCHES[i % SWATCHES.length] }} />
            <div className="p-4">
              <p className="text-sm font-semibold text-[#1f2318] group-hover:text-[#7a8a3a]">{p.name}</p>
              <p className="mt-0.5 text-xs text-[#7a7a63]">{p.note}</p>
              <p className="mt-2 text-sm font-medium text-[#1f2318]">
                {p.price.toLocaleString("hu-HU")} Ft
              </p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
