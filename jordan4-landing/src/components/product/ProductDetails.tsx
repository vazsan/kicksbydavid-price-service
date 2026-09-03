"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DESCRIPTION, FAQ, SPECS } from "@/lib/nb740-data";

const SIZE_CHART = [
  { eu: "36", us: "5", cm: "22.5" },
  { eu: "37", us: "6", cm: "23.5" },
  { eu: "38", us: "7", cm: "24" },
  { eu: "39", us: "7.5", cm: "24.5" },
  { eu: "40", us: "8", cm: "25.5" },
  { eu: "41", us: "8.5", cm: "26" },
  { eu: "42", us: "9", cm: "26.5" },
  { eu: "43", us: "9.5", cm: "27.5" },
  { eu: "44", us: "10", cm: "28" },
  { eu: "45", us: "11", cm: "29" },
];

function AccordionRow({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-[#e2ddc9]">
      <button onClick={onToggle} className="flex w-full items-center justify-between py-5 text-left" aria-expanded={isOpen}>
        <span className="text-base font-semibold text-[#1f2318]">{title}</span>
        <span className={`text-xl text-[#7a8a3a] transition-transform ${isOpen ? "rotate-45" : ""}`}>+</span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-6 text-sm leading-relaxed text-[#4a4938]">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ProductDetails() {
  const [open, setOpen] = useState<string | null>("description");

  const toggle = (key: string) => setOpen((prev) => (prev === key ? null : key));

  return (
    <div className="mt-16 grid gap-16 lg:grid-cols-[1.4fr_1fr]">
      <div id="meretezes">
        <AccordionRow title="Leírás" isOpen={open === "description"} onToggle={() => toggle("description")}>
          <p>{DESCRIPTION}</p>
        </AccordionRow>

        <AccordionRow title="Anyagok és specifikáció" isOpen={open === "specs"} onToggle={() => toggle("specs")}>
          <dl className="grid grid-cols-2 gap-y-2 sm:grid-cols-2">
            {SPECS.map((s) => (
              <div key={s.label} className="contents">
                <dt className="text-[#7a7a63]">{s.label}</dt>
                <dd className="text-[#1f2318]">{s.value}</dd>
              </div>
            ))}
          </dl>
        </AccordionRow>

        <AccordionRow title="Mérettáblázat" isOpen={open === "sizing"} onToggle={() => toggle("sizing")}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[360px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#e2ddc9] text-[#7a7a63]">
                  <th className="py-2 pr-4 font-medium">EU</th>
                  <th className="py-2 pr-4 font-medium">US</th>
                  <th className="py-2 font-medium">Talphossz (cm)</th>
                </tr>
              </thead>
              <tbody>
                {SIZE_CHART.map((row) => (
                  <tr key={row.eu} className="border-b border-[#efeadb]">
                    <td className="py-2 pr-4 text-[#1f2318]">{row.eu}</td>
                    <td className="py-2 pr-4 text-[#1f2318]">{row.us}</td>
                    <td className="py-2 text-[#1f2318]">{row.cm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AccordionRow>

        <AccordionRow title="Szállítás és visszaküldés" isOpen={open === "shipping"} onToggle={() => toggle("shipping")}>
          <p>
            15 000 Ft feletti rendelés esetén a szállítás ingyenes, ez alatt egységesen 1 490 Ft. A raktáron
            lévő termékeket 1-3 munkanapon belül kiszállítjuk. Bontatlan, viseletnyomok nélküli terméket 14
            napon belül díjmentesen visszaküldhetsz vagy kicserélheted.
          </p>
        </AccordionRow>

        {FAQ.map((item) => (
          <AccordionRow key={item.q} title={item.q} isOpen={open === item.q} onToggle={() => toggle(item.q)}>
            <p>{item.a}</p>
          </AccordionRow>
        ))}
      </div>

      <aside className="rounded-2xl border border-[#e2ddc9] bg-[#fbf9f2] p-6">
        <p className="text-sm font-semibold text-[#1f2318]">Miért a Kicks by David?</p>
        <ul className="mt-4 space-y-3 text-sm text-[#4a4938]">
          <li className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7a8a3a]" />
            100% eredeti termékek, hivatalos beszerzési láncból
          </li>
          <li className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7a8a3a]" />
            Gyors, nyomon követhető házhozszállítás
          </li>
          <li className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7a8a3a]" />
            Ügyfélszolgálat sneaker rajongóktól sneaker rajongóknak
          </li>
        </ul>
      </aside>
    </div>
  );
}
