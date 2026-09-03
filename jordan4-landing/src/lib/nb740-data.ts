// Real content captured from kicksbydavid.hu screenshots (the live site is
// still unreachable from this build environment). Gallery art is still a
// stand-in — swap <ViewArt> for the real product photos when available.

export const PRODUCT = {
  brand: "New Balance",
  name: "New Balance 740",
  colorway: "Dry Lime",
  tag: "Férfi, alacsony szárú, utcai sneaker",
  styleCode: "U7401UW-4-5",
  category: "Utcai sneaker",
  price: 47310,
  compareAtPrice: 61980,
  savings: 14670,
  discountPct: 23,
  currency: "Ft",
  rating: 4.9,
  reviewCount: "100+",
  trustindexScore: 5.0,
  trustindexCount: 12,
  saleStartLabel: "Akció 2026.08.31-től, a készlet erejéig",
  urlSize: "EU 37",
  loyaltyPoints: 946,
};

export const HIGHLIGHTS = [
  "Y2K stílusú retro futócipő sziluett, a '80-as évek kosárlabdacipőinek gyökereivel",
  "Légáteresztő mesh szár, rétegzett szintetikus borítással",
  "ABZORB középtalp az egész napos kényelemért",
  "Tartós gumi talp a klasszikus 740-es mintázattal",
];

export const DESCRIPTION =
  "A New Balance 740 Dry Lime egy igazi streetstyle darab: a 2000-es évek teljesítménycipőjének Y2K-újragondolása, visszafogott krém-fehér alapon lime zöld részletekkel. A légáteresztő mesh és szintetikus szár kombinációját a New Balance ABZORB csillapító középtalpával párosítja, így divatdarabként is megállja a helyét - anélkül, hogy feladná azt a viseletélményt, amiért a sziluettet eredetileg tervezték. Könnyen kombinálható farmerrel, cargo nadrággal vagy semleges színekkel.";

export const SPECS: { label: string; value: string }[] = [
  { label: "Cikkszám", value: "U7401UW-4-5" },
  { label: "Szín", value: "Zöld (Dry Lime)" },
  { label: "Szár anyaga", value: "Textil mesh, szintetikus borítás" },
  { label: "Középtalp", value: "ABZORB csillapítás" },
  { label: "Talp", value: "Gumi" },
  { label: "Zárás", value: "Fűzős" },
  { label: "Fazon", value: "Valósághűen méretezett" },
  { label: "Származási hely", value: "Import" },
];

// Real availability from the live listing — note the gaps (no plain 39/41)
// and that 41.5 is out of stock, ordered ascending (the live page listed
// these out of order: 44, 44.5, 45, 37, 37.5, 38 ...).
export const SIZES = [
  "EU 37",
  "EU 37.5",
  "EU 38",
  "EU 38.5",
  "EU 39.5",
  "EU 40",
  "EU 40.5",
  "EU 41.5",
  "EU 42",
  "EU 42.5",
  "EU 43",
  "EU 44",
  "EU 44.5",
  "EU 45",
] as const;

export const STOCK: Record<string, "in" | "out"> = {
  "EU 37": "in",
  "EU 37.5": "in",
  "EU 38": "in",
  "EU 38.5": "in",
  "EU 39.5": "in",
  "EU 40": "in",
  "EU 40.5": "in",
  "EU 41.5": "out",
  "EU 42": "in",
  "EU 42.5": "in",
  "EU 43": "in",
  "EU 44": "in",
  "EU 44.5": "in",
  "EU 45": "in",
};

export const TRUST_BADGES = [
  { title: "100% eredeti termék", note: "Ellenőrzött forrásból", icon: "check" },
  { title: "Biztonságos fizetés", note: "Védett bankkártyás vásárlás", icon: "bolt" },
  { title: "14 napos visszaküldés", note: "Egyszerű visszaküldési folyamat", icon: "return" },
  { title: "Gyors ügyfélszolgálat", note: "Segítünk, ha kérdésed van", icon: "chat" },
] as const;

export const SHIPPING_INFO = [
  { title: "Packeta szállítás", note: "Gyors és megbízható" },
  { title: "Átvételi pontok", note: "Több mint 2000+" },
  { title: "Utánvét", note: "Készpénz vagy kártya" },
] as const;

export const GIFT_THRESHOLD = {
  target: 40000,
  label: "Vásárolj 40 000 Ft értékben, és tiéd ingyen egy pár Sneaker Shield!",
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
