// PLACEHOLDER DATA — kicksbydavid.hu could not be reached from this build
// environment (network egress to that domain is blocked), so this content
// is assembled from public New Balance 740 "Dry Lime/Linen" (U7401UW)
// listings rather than scraped from the live product page. Swap PRODUCT,
// price, and GALLERY for the real listing content before shipping.

export const PRODUCT = {
  brand: "New Balance",
  name: "New Balance 740",
  colorway: "Dry Lime / Linen",
  styleCode: "U7401UW",
  category: "Unisex Lifestyle Sneaker",
  price: 46990,
  compareAtPrice: 54990,
  currency: "Ft",
  rating: 4.7,
  reviewCount: 38,
  urlSize: "EU 37",
};

export const HIGHLIGHTS = [
  "Y2K stílusú retro futócipő sziluett, a '80-as évek kosárlabdacipőinek gyökereivel",
  "Légáteresztő mesh szár, rétegzett szintetikus borítással",
  "ABZORB középtalp az egész napos kényelemért",
  "Tartós gumi talp a klasszikus 740-es mintázattal",
];

export const DESCRIPTION =
  "A 2000-es évek egyik meghatározó teljesítménycipőjének újragondolása, amely mára a modern Y2K stílus alapdarabjává vált. A 740-es légáteresztő mesh és szintetikus szár kombinációját a New Balance ABZORB csillapító középtalpával párosítja, így a rétegzett, karakteres forma divatdarabként is megállja a helyét - anélkül, hogy feladná azt a viseletélményt, amiért a sziluettet eredetileg tervezték. A Dry Lime / Linen színvilág visszafogott, meleg tónusú marad, könnyen kombinálható farmerrel, cargo nadrággal vagy semleges színekkel.";

export const SPECS: { label: string; value: string }[] = [
  { label: "Cikkszám", value: "U7401UW" },
  { label: "Szár anyaga", value: "Textil mesh, szintetikus borítás" },
  { label: "Középtalp", value: "ABZORB csillapítás" },
  { label: "Talp", value: "Gumi" },
  { label: "Zárás", value: "Fűzős" },
  { label: "Fazon", value: "Valósághűen méretezett" },
  { label: "Származási hely", value: "Import" },
];

export const SIZES = [
  "EU 36",
  "EU 36.5",
  "EU 37",
  "EU 38",
  "EU 38.5",
  "EU 39",
  "EU 40",
  "EU 40.5",
  "EU 41",
  "EU 42",
  "EU 42.5",
  "EU 43",
  "EU 44",
  "EU 44.5",
  "EU 45",
] as const;

export const STOCK: Record<string, "in" | "low" | "out"> = {
  "EU 36": "in",
  "EU 36.5": "out",
  "EU 37": "low",
  "EU 38": "in",
  "EU 38.5": "in",
  "EU 39": "low",
  "EU 40": "in",
  "EU 40.5": "out",
  "EU 41": "in",
  "EU 42": "low",
  "EU 42.5": "in",
  "EU 43": "in",
  "EU 44": "out",
  "EU 44.5": "in",
  "EU 45": "low",
};

export const GALLERY = [
  { id: "side", label: "Oldalnézet" },
  { id: "top", label: "Felülnézet" },
  { id: "sole", label: "Talp" },
  { id: "detail", label: "Anyag közelről" },
  { id: "box", label: "Doboz" },
] as const;

export const FAQ = [
  {
    q: "Melyik méretet válasszam?",
    a: "A New Balance 740 valósághűen méretezett, a legtöbb vásárlónk a megszokott utcai cipőméretét választja. Széles lábfejhez javasoljuk a fél mérettel nagyobbat.",
  },
  {
    q: "Mennyi idő alatt érkezik meg a rendelés?",
    a: "Raktáron lévő termékek esetén 1-3 munkanapon belül kiszállítjuk. Készlethiány esetén a termékoldalon jelezzük a várható beérkezést.",
  },
  {
    q: "Van lehetőség cserére vagy visszaküldésre?",
    a: "Bontatlan, viseletnyomok nélküli termékeket 14 napon belül díjmentesen visszaküldhetsz vagy kicserélheted.",
  },
];

export const REVIEWS = [
  {
    name: "Petra K.",
    rating: 5,
    quote: "Nagyon kényelmes, egész nap hordható. A színe élőben még szebb, mint a képeken.",
  },
  {
    name: "Bálint T.",
    rating: 5,
    quote: "Pontosan az én méretem jött be, semmi csúszkálás. A csomagolás is prémium érzetű volt.",
  },
  {
    name: "Zsófi N.",
    rating: 4,
    quote: "Szuper darab, a szállítás egy nappal tovább tartott, mint vártam, de megérte a várakozást.",
  },
];

export const RELATED = [
  { name: "New Balance 9060", note: "Robusztus Y2K sziluett", price: 52990 },
  { name: "New Balance 550", note: "Retro kosárlabda klasszikus", price: 41990 },
  { name: "New Balance 993", note: "USA-ban gyártott örökség modell", price: 74990 },
  { name: "New Balance 2002R", note: "Protection Pack csillapítással", price: 57990 },
];
