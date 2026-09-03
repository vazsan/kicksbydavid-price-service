export const PRODUCT = {
  name: "Air Jordan IV Retro",
  colorway: "Bred Reimagined",
  price: 210,
  currency: "USD",
  sku: "AJ4-RETRO-BR-2026",
  edition: "Limited Re-Issue — 04 / 23",
};

export const COLORWAYS = [
  {
    id: "bred",
    label: "Bred",
    swatch: "#c8102e",
    description: "Black nubuck, fire-red accents, the silhouette that started it.",
  },
  {
    id: "white-cement",
    label: "White Cement",
    swatch: "#e7e2d6",
    description: "Grey cement print on bone leather — the collector's grail.",
  },
  {
    id: "black-cat",
    label: "Black Cat",
    swatch: "#141414",
    description: "Tonal black-on-black, nubuck and mesh in total eclipse.",
  },
  {
    id: "military-black",
    label: "Military Black",
    swatch: "#2c2e2b",
    description: "Olive undertones with jet black overlays — off-court utility.",
  },
] as const;

export const SIZES = [
  "US 7",
  "US 7.5",
  "US 8",
  "US 8.5",
  "US 9",
  "US 9.5",
  "US 10",
  "US 10.5",
  "US 11",
  "US 11.5",
  "US 12",
  "US 13",
] as const;

export const MATERIALS = [
  {
    title: "Ballistic Mesh",
    body: "Visible woven mesh panels for structured breathability — a 1989 innovation still unmatched today.",
  },
  {
    title: "Premium Nubuck",
    body: "Full-grain nubuck overlays, hand-cut and stitched for a texture that ages like fine leather.",
  },
  {
    title: "Molded Wings",
    body: "The iconic eyestay wings, injection-molded for a crisp, architectural silhouette.",
  },
  {
    title: "Visible Air Sole",
    body: "Encapsulated Air-Sole cushioning in the heel, exposed as proof — not a promise.",
  },
];

export const TIMELINE = [
  { year: "1989", label: "Designed by Tinker Hatfield, worn by MJ in his 2nd title run." },
  { year: "1997", label: "First retro release — the silhouette enters legend." },
  { year: "2012", label: "The Bred colorway becomes the most coveted retro of its era." },
  { year: "2026", label: "Reissued as a limited museum-grade artifact." },
];

export const REVIEWS = [
  {
    name: "D. Alaba",
    rating: 5,
    quote:
      "The wings are sharper than any retro I've owned. This isn't a re-run — it's a restoration.",
    verified: true,
  },
  {
    name: "M. Okafor",
    rating: 5,
    quote:
      "Fit true to size, and the nubuck texture is genuinely different from the 2019 retro. Worth the wait.",
    verified: true,
  },
  {
    name: "S. Park",
    rating: 4,
    quote:
      "Box and authentication card make this feel like buying art. Shipping took a week longer than expected.",
    verified: true,
  },
  {
    name: "J. Torres",
    rating: 5,
    quote:
      "Bought it as a collector piece, ended up wearing it every day. That's the mark of a great shoe.",
    verified: true,
  },
];

export const FAQ = [
  {
    q: "Is this the original 1989 construction?",
    a: "Yes. The upper pattern, wing geometry and sole architecture are rebuilt from Tinker Hatfield's original technical drawings, with modern material tolerances for consistency at scale.",
  },
  {
    q: "How does sizing compare to previous retros?",
    a: "True to size for most collectors. If you sit between sizes or have a wider foot, we recommend sizing up half a size — see the fit notes in the size guide.",
  },
  {
    q: "What's included with each pair?",
    a: "Every pair ships in a numbered box with a signed authentication card, a microfiber dust bag, and a printed archive card detailing the 1989 release.",
  },
  {
    q: "What is the return policy?",
    a: "30-day returns on unworn pairs in original packaging. Limited-edition colorways with a numbered authentication card are final sale once the seal is broken.",
  },
  {
    q: "How many pairs were produced in this run?",
    a: "This reissue is capped at a regionally allocated run per colorway. Once a size sells out in a colorway, it will not be restocked.",
  },
];

export const STOCK_LEVELS: Record<string, "low" | "medium" | "high"> = {
  "US 7": "low",
  "US 7.5": "medium",
  "US 8": "low",
  "US 8.5": "high",
  "US 9": "medium",
  "US 9.5": "low",
  "US 10": "high",
  "US 10.5": "medium",
  "US 11": "low",
  "US 11.5": "medium",
  "US 12": "high",
  "US 13": "low",
};
