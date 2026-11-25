/* KicksByDavid kezdőlap R2 (HU + SK, domain alapján) – hős, bizalmi sáv, Most érkezett, méretcsempék, márkalogók, Legnépszerűbb + értékelések, Akciós.
   Dávid TG 2386, Főnök msg 2060. A kártyák az Unas SAJÁT, szerver által renderelt termékkártyái (az Akciós és a Legnépszerűbb a kezdőlap natív moduljából,
   a Most érkezett a natív /ujdonsagok AJAX-listából): a csomópontok ÁT vannak helyezve (nem másolva), a bolt saját JS-e (kedvenc, összehasonlítás, gyorsnézet) ugyanúgy kezeli őket.
   A kapcsolót a kbd-home.js adja (süti kbdhome, ?kbdhome=1 / 0). Ez a fájl csak akkor töltődik be, ha az R2 be van kapcsolva, csak a HU kezdőlapon. */
(function () {
  "use strict";
  if (window.KBD_R2_HOME) return;
  window.KBD_R2_HOME = 1;

  var BASE = window.KBD_R2H_BASE || "";
  var IMG = BASE + "img/";
  var ORIGIN = location.protocol + "//" + location.host;
  var SK = /\.sk$/i.test(location.hostname);
  function skPl(n) { return n === 1 ? "hodnotenie" : (n >= 2 && n <= 4 ? "hodnotenia" : "hodnotení"); }
  /* szövegek és címek nyelvenként. SK: Zara szövegei, Dávid OK-ja (TG 2390); a hős címe SK-n Dávid lektorálása (TG 2398). A -N% jelvény és a számok mindkét nyelven az élő kártyákból / a Trustindexből jönnek. */
  var L = SK ? {
    base: "/vsetky-produkty", newUrl: "/novinky", saleUrl: "/akcie", tkdur: 24,
    h1: "Tenisky, ktoré<br>práve letia", sub: "Výrobný kód pri každom produkte", btn: "Zobraziť všetko",
    ticker: ["VÝMENA VEĽKOSTI DO 14 DNÍ", "DOBIERKA", "KLARNA", "VÝROBNÝ KÓD", "RATE", "DOPRAVA ZADARMO NAD 120 €"], rate: "GOOGLE",
    kl: ["Zaplať v 3 splátkach s Klarnou", "Pozor! Požičanie peňazí stojí peniaze. Pri oneskorenej platbe môžu vzniknúť poplatky."],
    klb: { url: "/sneakery", how: "Ako to funguje?", howUrl: "/shop_contact.php?tab=payment",
      alt: "Odteraz môžeš platiť aj s Klarnou. 3 rovnaké splátky, každých 30 dní. 3 splátky bez úrokov, už od 16,34 € za splátku*. Pozri si tenisky. Pozor! Požičanie peňazí stojí peniaze. Pri oneskorenej platbe môžu vzniknúť poplatky. *Cena nášho najlacnejšieho páru k 20. 11. 2026, rozdelená na 3 splátky. Platbu na splátky poskytuje Klarna podľa svojich podmienok." },
    newT: "Novinky", all: "Všetko", sizeT: "Nakupuj podľa veľkosti", sizeAll: "VŠETKY", sizeNote: "Ak ti nesadne veľkosť, do 14 dní ju vymeníme: novú veľkosť ti pošleme my, zaplatíš len spätné zaslanie.",
    brandsT: "Obľúbené značky", topT: "Najobľúbenejšie", revT: "Čo o nás hovoria zákazníci", saleT: "Zľavy",
    stlT: "Kompletné outfity", grailT: "Grail", grailUrl: "/grail",
    revBasis: function (n) { return "Na základe " + n + " " + skPl(n); }, gBtn: "Hodnotenia na Google", revLang: "sk",
    tiBig: "6b883db76988873e850692b71b0", tiSmall: "f2ddae483a2767044106f3718af", tiles: "tiles-sk.json", prev: "Predchádzajúce", next: "Ďalšie",
    starsAria: function (n) { return n + "/5"; }, alt: "ASICS Gel-NYC Oyster Grey", aria: "KicksByDavid"
  } : {
    base: "/osszes-termek", newUrl: "/ujdonsagok", saleUrl: "/akcios-termekek", tkdur: 26,
    h1: "Felkapott<br>sneakerek", sub: "Gyári cikkszám minden terméklapon", btn: "Mutasd az összeset",
    ticker: ["14 NAPOS MÉRETCSERE", "UTÁNVÉT", "KLARNA", "GYÁRI CIKKSZÁM", "RATE", "INGYENES SZÁLLÍTÁS 46 250 FT FELETT"], rate: "GOOGLE",
    kl: ["Fizess 3 részletben a Klarnával", "Figyelem! A hitelfelvétel pénzbe kerül. Késedelmes fizetés esetén a hitel költségekkel járhat."],
    klb: { url: "/sneakerek", how: "Hogyan működik?", howUrl: "/shop_contact.php?tab=payment",
      alt: "Mostantól Klarnával is fizethetsz. 3 egyenlő részlet, 30 naponként. 3 részletben, kamatmentesen, részletenként akár 6 044 Ft-tól*. Böngészd a cipőket. Figyelem! A hitelfelvétel pénzbe kerül. Késedelmes fizetés esetén a hitel költségekkel járhat. *A legolcsóbb párunk ára 2026. november 20-án, 3 részletre osztva. A részletfizetést a Klarna nyújtja, a saját feltételei szerint." },
    newT: "Most érkezett", all: "Mind", sizeT: "Vásárolj a méretedben", sizeAll: "ÖSSZES", sizeNote: "Ha nem jó a méret, 14 napon belül kicseréljük: az új méretet mi küldjük, csak a visszaküldést fizeted.",
    brandsT: "Népszerű márkák", topT: "Legnépszerűbb", revT: "Rólunk mondták", saleT: "Akciós",
    stlT: "Összeillő párok", grailT: "Grail", grailUrl: "/grail",
    revBasis: function (n) { return n + " vélemény alapján"; }, gBtn: "Vélemények a Google-on", revLang: "hu",
    tiBig: "3ba033477a0d031a5f060029c5d", tiSmall: "0d3908782f85181dd586d19e174", tiles: "tiles.json", prev: "Előző", next: "Következő",
    starsAria: function (n) { return n + " csillag az 5-ből"; }, alt: "ASICS Gel-NYC Oyster Grey sneaker utcai kövön", aria: "Kezdőlap"
  };
  var TI_BIG = L.tiBig, TI_SMALL = L.tiSmall;

  var SIZES = ["36", "36.5", "37.5", "38", "38.5", "39", "40", "40.5", "41", "42", "42.5", "43", "44", "44.5", "45", "45.5", "46", "47", "47.5"];
  var BRANDS = [["Nike", "nike"], ["Air Jordan", "air-jordan"], ["Adidas", "adidas"], ["New Balance", "new-balance"], ["ASICS", "asics"], ["UGG", "ugg"], ["ON", "on"], ["Puma", "puma"],
    ["Converse", "converse"], ["Vans", "vans"], ["Salomon", "salomon"], ["Saucony", "saucony"], ["Crocs", "crocs"], ["Birkenstock", "birkenstock"], ["Timberland", "timberland"], ["Supreme", "supreme"]];
  var N_NEW = 8, N_TOP = 6, N_SALE = 10, N_GRAIL = 12;

  var ARROW = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  var CHECK = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
  var STAR = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="m12 2.8 2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z"/></svg>';
  var CHEV = {
    l: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg>',
    r: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>'
  };

  /* ---------- CSS: minden szabály a #khr alatt (nincs ütközés a témával) ---------- */
  var CSS = ""
    + "#khr{--ink:#171717;--rust:#A3481F;--soft:#5E5A53;--line:#E6E3DD;--grey:#F4F3F0;color:var(--ink);font:500 15px/1.5 Montserrat,sans-serif;-webkit-font-smoothing:antialiased;background:#fff;overflow-x:clip;position:relative;z-index:0}"
    + "#khr *,#khr *::before,#khr *::after{box-sizing:border-box}"
    + "#khr a{color:inherit;text-decoration:none}#khr a:hover{color:inherit;text-decoration:none}"
    + "#khr img{max-width:100%}"
    + "#khr .khr-w{padding:0 16px}"
    + "#khr .khr-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:48px;padding:0 22px;border-radius:12px;background:var(--ink);color:#fff;font-size:14px;font-weight:800}"
    + "#khr .khr-pill{display:inline-block;height:24px;padding:0 9px;border-radius:12px;background:var(--rust);color:#fff;font-size:12px;font-weight:800;line-height:24px;letter-spacing:0;vertical-align:middle}"
    + "#khr .khr-stars{display:inline-flex;gap:1px}"
    + "#khr .khr-sec{padding:32px 0 0}#khr .khr-w{padding-bottom:40px}#khr .khr-two [data-k=\"rev\"]{margin-top:32px}"
    + "#khr .khr-sh{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}"
    + "#khr .khr-sh h2{margin:0;padding:0;font:800 28px/1.02 Montserrat,sans-serif;letter-spacing:-1px;text-transform:none;color:var(--ink)}"
    + "#khr .khr-sh h2::before,#khr .khr-sh h2::after{display:none}"
    + "#khr .khr-sh>a{flex:none;display:inline-flex;align-items:center;gap:4px;height:44px;font-size:13px;font-weight:800}"
    + "#khr .khr-sh>a span{border-bottom:2px solid var(--ink)}"
    /* hős */
    + "#khr .khr-hero{position:relative;display:block;height:520px;overflow:hidden;background:#CFC6B8}"
    + "#khr .khr-hero picture,#khr .khr-hero img{display:block;width:100%;height:100%}"
    + "#khr .khr-hero img{object-fit:cover;object-position:50% 60%}"
    + "#khr .khr-hero::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(246,243,237,.78) 0,rgba(246,243,237,.42) 34%,rgba(246,243,237,0) 52%);pointer-events:none}"
    + "#khr .khr-ht{position:absolute;z-index:1;left:0;right:0;top:0;padding:30px 20px 0;text-align:center}"
    + "#khr .khr-hero h1{margin:0;padding:0;font:800 38px/1.02 Montserrat,sans-serif;letter-spacing:-1.6px;text-transform:uppercase;color:var(--ink)}"
    + "#khr .khr-hero p{margin:12px 0 0;font-size:15px;font-weight:800;color:#111}"
    + "#khr .khr-hero .khr-btn{margin-top:16px;color:#fff}"
    + "#khr .khr-cap{position:absolute;z-index:1;right:16px;bottom:16px;color:#fff;font-size:11px;font-weight:800;letter-spacing:.1em;text-align:right;line-height:1.35;text-shadow:0 1px 6px rgba(0,0,0,.35)}"
    /* slider-mód: H1-sor a slider alatt + pöttyök a natív slideren */
    + "#khr .khr-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}"
    + "#khr .khr-intro{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:26px 0 0}"
    + "#khr .khr-intro h1{margin:0;padding:0;font:800 28px/1.02 Montserrat,sans-serif;letter-spacing:-1px;text-transform:none;color:var(--ink)}"
    + "#khr .khr-intro>a{flex:none;display:inline-flex;align-items:center;gap:4px;height:44px;font-size:13px;font-weight:800}#khr .khr-intro>a span{border-bottom:2px solid var(--ink)}"
    + "html.khr-slider #start_banner_big{position:relative}"
    + ".khr-dots{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:center;gap:0;z-index:6;pointer-events:none}"
    + ".khr-dots button{pointer-events:auto;width:44px;height:44px;border:0;background:transparent;padding:0;cursor:pointer;display:grid;place-items:center}"
    + ".khr-dots button::before{content:'';width:9px;height:9px;border-radius:50%;background:rgba(255,255,255,.6);box-shadow:0 0 0 1.5px rgba(23,23,23,.55)}"
    + ".khr-dots button[aria-current=true]::before{background:#171717;box-shadow:0 0 0 1.5px #fff}"
    + ".khr-sn{display:none}"
    /* bizalmi sáv */
    /* előnysáv: lassú, folyamatos balra gördülés (marquee, csak CSS: a tartalom 4x, translateX(-25%), ~35 px/s; hover/érintés megáll; reduced-motion: áll) */
    + "#khr .khr-tk{overflow:hidden;white-space:nowrap;height:38px;margin:0 -16px;border-bottom:1px solid var(--line);font-size:11px;font-weight:800;letter-spacing:.08em}"
    + "#khr .khr-tkin{display:flex;align-items:center;height:38px;width:max-content;animation:khrm var(--tkd,26s) linear infinite;will-change:transform}"
    + "#khr .khr-tkh{display:flex;align-items:center;gap:18px;padding-right:18px;flex:none}"
    + "@keyframes khrm{from{transform:translateX(0)}to{transform:translateX(-25%)}}"
    + "#khr .khr-tk:hover .khr-tkin,#khr .khr-tk:active .khr-tkin,#khr .khr-tk:focus-within .khr-tkin,#khr .khr-tk.khr-tkp .khr-tkin{animation-play-state:paused}"
    + "@media (prefers-reduced-motion:reduce){#khr .khr-tkin{animation:none;transform:none}#khr .khr-tkh:not(:first-child){display:none}#khr .khr-tk{padding:0 16px}}"
    + "#khr .khr-tk{position:relative}#khr .khr-tk.khr-tkx .khr-tkin{animation-play-state:paused}"
    + "#khr .khr-tkb{position:absolute;right:0;top:0;width:44px;height:38px;border:0;padding:0;margin:0;display:grid;place-items:center;background:linear-gradient(90deg,rgba(255,255,255,0),#fff 35%);color:#171717;cursor:pointer;z-index:2}"
    + "#khr .khr-tkb:focus-visible{outline:2px solid #171717;outline-offset:-3px}"
    + "@media (prefers-reduced-motion:reduce){#khr .khr-tkb{display:none}}"
    + "#khr .khr-tk span{display:inline-flex;align-items:center;gap:6px}#khr .khr-tk svg{width:14px;height:14px}#khr .khr-tk i{font-style:normal}"
    + "#khr .khr-klb-a{position:relative;display:block;max-width:600px;margin:0 auto;aspect-ratio:1280/1792;border-radius:12px;overflow:hidden;background:#e9e9e9;container-type:inline-size}"
    + "#khr .khr-klb-m{position:absolute;inset:0;display:block}"
    + "#khr .khr-klb-how{position:absolute;z-index:2;left:47.73%;top:60.43%;width:30.94%;height:3.68%;display:flex;align-items:center;font-size:12px;font-size:max(12px,3.4375cqw);line-height:1;font-weight:700;color:#171717;text-decoration:underline;text-underline-offset:2px;white-space:nowrap}"
    + "#khr .khr-klb-sk .khr-klb-how{left:40.70%}"
    + "#khr .khr-klb-bg{display:block;width:100%;height:100%;object-fit:cover}"
    + "#khr .khr-klb-card{position:absolute;left:30.47%;top:3.906%;width:39.0625%;height:36.83%;perspective:1400px;transform:rotate(-5deg)}"
    + "#khr .khr-klb-in{position:relative;display:block;width:100%;height:100%;transform-style:preserve-3d;-webkit-transform-style:preserve-3d;transition:transform .95s cubic-bezier(.3,.1,.2,1)}"
    + "#khr .khr-klb-in picture,#khr .khr-klb-in img{position:absolute;inset:0;display:block;width:100%;height:100%;backface-visibility:hidden;-webkit-backface-visibility:hidden}"
    + "#khr .khr-klb-in picture:last-child{transform:rotateY(180deg)}#khr .khr-klb.on .khr-klb-in{transform:rotateY(180deg)}"
    + "@media (min-width:992px){#khr .khr-klb-a{max-width:none;aspect-ratio:3840/1440}#khr .khr-klb-card{left:53.125%;top:12.5%;width:21.354%;height:75%}"
    + "#khr .khr-klb-how{left:24.19%;top:43.125%;width:11.25%;height:5%;font-size:max(12px,1.25cqw)}#khr .khr-klb-sk .khr-klb-how{left:21.61%}}"
    + "@media (prefers-reduced-motion:reduce){#khr .khr-klb-in{transition:none}}"
    + "#khr .khr-tk .khr-kl{gap:8px;font-size:12px;letter-spacing:.02em;text-transform:none}#khr .khr-tk .khr-kl em{font-style:normal;font-weight:600;color:#3A3A36}"
    + "#khr .khr-klp{display:inline-flex;align-items:center;height:20px;padding:0 8px;border-radius:999px;background:#FFB3C7;color:#0B051D;font-size:11px;font-weight:800;letter-spacing:.01em}"
    + "#khr .khr-first{padding-top:18px}"
    /* kártyasín és rács: a kártya a natív Unas kártya */
    + "#khr .khr-rail{display:grid;grid-auto-flow:column;grid-auto-columns:184px;gap:10px;overflow-x:auto;margin:0 -16px 0 -5px;padding:6px 16px 8px 5px;scrollbar-width:none;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain}"
    + "#khr .khr-rail::-webkit-scrollbar{display:none}"
    + "#khr .khr-rail,#khr .khr-grid{--image-width:248px;--image-height:248px}"
    + "#khr .khr-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;padding:5px;margin:0 -5px}"
    + "#khr .khr-rail>.product,#khr .khr-grid>.product{flex:none;max-width:none;width:auto;min-width:0;padding:0;margin:0;position:static;transform:none;float:none;left:auto}"
    + "#khr .khr-rail>.product:nth-child(n+1){height:auto}"
    + "#khr .khr-grid>.product:nth-child(n+5){display:none}"
    + "#khr .khr-railbox{position:relative}"
    + "#khr .khr-nav{display:none}"
    + "#khr .khr-ph{background:var(--grey);border-radius:10px;min-height:380px;grid-column:1/-1;animation:khrp 1.4s ease-in-out infinite}"
    + "#khr .khr-rail{min-height:392px}#khr .khr-grid{min-height:760px}"
    + "@keyframes khrp{0%,100%{opacity:1}50%{opacity:.55}}"
    /* méretcsempék */
    + "#khr .khr-szr{display:grid;grid-auto-flow:column;grid-auto-columns:62px;gap:6px;overflow-x:auto;margin:0 -16px 0 0;padding-right:16px;scrollbar-width:none}"
    + "#khr .khr-szr::-webkit-scrollbar{display:none}"
    + "#khr .khr-szr a{height:56px;display:flex;flex-direction:column;align-items:center;justify-content:center;border:1.5px solid var(--line);border-radius:12px;background:#fff}"
    + "#khr .khr-szr small{font-size:10px;font-weight:800;color:var(--soft);letter-spacing:.06em;line-height:1}"
    + "#khr .khr-szr b{font-size:16px;font-weight:800;line-height:1.2}"
    + "#khr .khr-szn{margin:10px 0 0;font-size:13px;font-weight:600;color:var(--soft)}"
    + "#khr .khr-stl:empty{padding:0}"
    /* márkák */
    + "#khr .khr-bl{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}"
    + "#khr .khr-bl a{height:72px;display:grid;place-items:center;border:1.5px solid var(--line);border-radius:14px;background:#fff}"
    + "#khr .khr-bl img{width:96%;height:auto;max-height:60px;object-fit:contain;display:block}"
    /* értékelések */
    + "#khr .khr-rs{display:flex;align-items:center;gap:16px;padding:18px;border:2.5px solid var(--ink);border-radius:20px}"
    + "#khr .khr-rs .n{font-size:56px;font-weight:800;letter-spacing:-2.4px;line-height:.85}"
    + "#khr .khr-rs b{display:block;margin-top:4px;font-size:15px;font-weight:800;line-height:1.25}"
    + "#khr .khr-rs .khr-glogo{display:block;width:74px;height:auto;margin-top:6px}"
    + "#khr .khr-rv{display:grid;grid-auto-flow:column;grid-auto-columns:262px;gap:8px;overflow-x:auto;margin:8px -16px 0 0;padding-right:16px;scrollbar-width:none}"
    + "#khr .khr-rv::-webkit-scrollbar{display:none}"
    + "#khr .khr-rv.khr-one{grid-auto-columns:100%}"
    + "#khr .khr-rc{padding:16px;border:1px solid var(--line);border-radius:18px;background:#fff}"
    + "#khr .khr-rc .hd2{display:flex;align-items:center;gap:10px}"
    + "#khr .khr-rc .av{flex:none;width:36px;height:36px;border-radius:18px;background:var(--grey);border:1px solid var(--line);display:grid;place-items:center;font-size:15px;font-weight:800;overflow:hidden}"
    + "#khr .khr-rc .av img{width:100%;height:100%;object-fit:cover}"
    + "#khr .khr-rc .nm2{flex:1;min-width:0}"
    + "#khr .khr-rc .nm2 b{display:block;font-size:14px;font-weight:800;line-height:1.2}"
    + "#khr .khr-rc .nm2 small{font-size:12px;font-weight:600;color:var(--soft)}"
    + "#khr .khr-rc .gi{width:18px;height:18px}"
    + "#khr .khr-rc .khr-stars{margin-top:10px}"
    + "#khr .khr-rc p{margin:6px 0 0;font-size:15px;font-weight:600;line-height:1.4}"
    + "#khr .khr-rc0 .khr-stars{margin-top:8px}#khr .khr-rc0{padding-bottom:12px}"
    + "#khr .khr-rvbox{position:relative}"
    + "#khr .khr-gl{display:flex;align-items:center;justify-content:center;height:48px;margin-top:8px;border:1.5px solid var(--ink);border-radius:14px;font-size:14px;font-weight:800}"
    + "#khr .khr-rvph{height:230px;margin-top:8px;border-radius:18px;background:var(--grey);animation:khrp 1.4s ease-in-out infinite}"
    /* a kártya a téma saját kártyája: alap betű (a #khr 15 px-es alapja ne öröklődjön) */
    + "#khr .product{font-size:14px;font-weight:400;line-height:1.5}"
    + "#khr .product__func-btn{min-width:44px;min-height:44px}#khr .product__details-btn{min-height:44px}"
    + "@media (min-width:992px){"
    + "#khr .khr-w{max-width:1272px;margin:0 auto;padding:0 16px 72px}#khr .khr-two [data-k=\"rev\"]{margin-top:0}"
    + "#khr .khr-sec{padding:56px 0 0}"
    + "#khr .khr-sh{margin-bottom:20px}#khr .khr-sh h2{font-size:40px;letter-spacing:-1.5px}#khr .khr-intro{padding-top:44px}#khr .khr-intro h1{font-size:40px;letter-spacing:-1.5px}"
    + "#khr .khr-hero{height:600px}"
    + "#khr .khr-hero img{object-position:30% 50%}"
    + "#khr .khr-hero::after{background:linear-gradient(90deg,rgba(246,243,237,0) 40%,rgba(246,243,237,.5) 58%,rgba(246,243,237,.62) 100%)}"
    + "#khr .khr-ht{left:auto;right:max(16px,calc((100vw - 1240px)/2));top:50%;transform:translateY(-50%);width:520px;padding:0;text-align:left}"
    + "#khr .khr-hero h1{font-size:64px;letter-spacing:-2.6px}"
    + "#khr .khr-hero p{margin-top:16px;font-size:16px}"
    + "#khr .khr-hero .khr-btn{margin-top:24px;height:52px;padding:0 26px;font-size:15px}"
    + "#khr .khr-cap{right:auto;left:max(16px,calc((100vw - 1240px)/2));bottom:24px;text-align:left}"
    + "#khr .khr-tk{margin:0}@media (prefers-reduced-motion:reduce){#khr .khr-tk{padding:0}}"
    + "#khr .khr-first{padding-top:32px}"
    + "#khr .khr-rail{grid-auto-columns:calc((1240px - 48px)/4.35);gap:16px;margin:0 -6px;padding:6px}"
    + "#khr .khr-rail{min-height:520px}#khr .khr-grid{min-height:900px}#khr .khr-ph{min-height:500px}"
    + "#khr .khr-szr{grid-auto-flow:row;grid-template-columns:repeat(10,1fr);gap:8px;margin-right:0;padding-right:0}"
    + "#khr .khr-szr a{height:64px}"
    + "#khr .khr-bl{grid-template-columns:repeat(8,1fr);gap:10px}#khr .khr-bl a{height:84px}#khr .khr-bl img{max-height:56px}"
    + "#khr .khr-two{display:grid;grid-template-columns:minmax(0,7fr) minmax(0,5fr);gap:40px;align-items:start}#khr .khr-two>*{min-width:0}"
    + "#khr .khr-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}"
    + "#khr .khr-grid>.product:nth-child(n+5){display:block}"
    + "#khr .khr-rv{grid-auto-flow:row;grid-auto-columns:auto;grid-template-columns:1fr 1fr;margin-right:0;padding-right:0;overflow:visible}"
    + "#khr .khr-rv.khr-one{grid-template-columns:1fr}"
    + "#khr .khr-rv.khr-rvall{grid-auto-flow:column;grid-template-rows:repeat(2,auto);grid-template-columns:none;grid-auto-columns:calc((100% - 8px)/2);overflow-x:auto;overflow-y:hidden}"
    + "#khr .khr-rv.khr-rvall.khr-one{grid-template-rows:auto;grid-auto-columns:100%}"
    + "#khr .khr-nav{display:grid;place-items:center;position:absolute;z-index:3;top:42%;width:44px;height:44px;border-radius:22px;border:1px solid var(--line);background:#fff;color:var(--ink);box-shadow:0 2px 10px rgba(0,0,0,.14);cursor:pointer;padding:0}"
    + "#khr .khr-nav[hidden]{display:none}"
    + "#khr .khr-nav.p{left:-14px}#khr .khr-nav.n{right:-14px}"
    + ".khr-sn{display:grid;place-items:center;position:absolute;z-index:6;top:50%;margin-top:-22px;width:44px;height:44px;border-radius:22px;border:1px solid var(--line,#E6E3DD);background:#fff;color:#171717;box-shadow:0 2px 10px rgba(0,0,0,.18);cursor:pointer;padding:0}"
    + ".khr-sn.p{left:20px}.khr-sn.n{right:20px}"
    + "}"
    + "@media (min-width:1500px){#khr .khr-rail{grid-auto-columns:calc((1240px - 48px)/4.35)}}";

  /* ---------- segédek ---------- */
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function mk(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function abs(u) { return /^https?:/.test(u) ? u : ORIGIN + u; }
  function stars(n) { var s = ""; for (var i = 0; i < n; i++) s += STAR; return '<span class="khr-stars" role="img" aria-label="' + L.starsAria(n) + '">' + s + "</span>"; }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function head(title, href, pill) {
    return '<div class="khr-sh"><h2>' + title + (pill ? ' <span class="khr-pill">' + pill + "</span>" : "") + "</h2>"
      + (href ? '<a href="' + href + '"><span>' + L.all + '</span>' + ARROW + "</a>" : "") + "</div>";
  }

  /* ---------- 1) a váz ---------- */
  function SLIDER() { return /(^|\s)khr-slider(\s|$)/.test(document.documentElement.className); }
  /* előnysáv: érintésre megáll (iOS Safari :active-ot csak touchstart figyelővel ad, ezért a kis figyelő: a sáv animációja csak CSS marad) */
  var TKB = { p: '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor"/></svg>',
    g: '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M7 5v14l12-7z" fill="currentColor"/></svg>' };
  function tickerTouch(root) {
    try { klbStart(root); } catch (e) {}
    var tk = $(".khr-tk", root); if (!tk || tk.getAttribute("data-t")) return; tk.setAttribute("data-t", "1");
    var on = function () { tk.classList.add("khr-tkp"); }, off = function () { tk.classList.remove("khr-tkp"); };
    tk.addEventListener("touchstart", on, { passive: true }); tk.addEventListener("touchend", off, { passive: true }); tk.addEventListener("touchcancel", off, { passive: true });
    /* WCAG 2.2.2 pause button (main msg 5884), HU only until the SK labels are proofread; reduced motion: hidden by CSS (the ticker stands still) */
    if (!SK) {
      var b = mk("button", "khr-tkb", TKB.p); b.type = "button"; b.setAttribute("aria-label", "Szöveg megállítása"); b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", function () { var st = tk.classList.toggle("khr-tkx"); b.setAttribute("aria-pressed", st ? "true" : "false"); b.setAttribute("aria-label", st ? "Szöveg indítása" : "Szöveg megállítása"); b.innerHTML = st ? TKB.g : TKB.p; });
      tk.appendChild(b);
    }
  }
  /* Klarna switch: off until David's yes (KL_ON); ?kbdklarna=1 / =0 forces it in one browser (the same key as the PDP preview) */
  var KL_ON = true;   /* ON for everyone: David TG 5512 (main msg 5319), 2026-11-20 */
  function klOn() { var f = null; try { var q = location.search.match(/[?&]kbdklarna=([01])(?:&|$)/); if (q) localStorage.setItem("kbdklarna", q[1]); f = localStorage.getItem("kbdklarna"); } catch (e) {} return f === "1" || (f !== "0" && KL_ON); }
  /* Klarna banner (kanban 8e29caec, David TG 5503 "Mehet fel a banner is árral", main msg 5313): Vera v4 B background (text box baked in) + the card
     flipping from the black KBD card (v4 A) to the pink Klarna card (v4 B) once it scrolls into view (CSS 3D, placement.json, -5deg); reduced motion = pink.
     The whole banner links to the sneaker category; the full credit warning + "Hogyan működik?" are real HTML under it. Lazy images, fixed aspect ratio (no CLS).
     The "-tól" price is the cheapest in-stock sneaker on 2026-11-20 (18 130 Ft / 49 EUR, /3 rounded up). Off switch: KLB_ON, ?kbdklb=0 / =1 in one browser. */
  var SL_MS = 7000;   /* HU slider autoplay floor (main msg 5884) */
  var KLB_ON = false;
  /* SALE UP (Nora msg 5882, David TG 6111, main msg 5884): HU only, during Black Friday the Akciós rail (+ Grail right under it, David TG 6041)
     goes directly below the ticker; back to the normal order automatically on 2026-12-01 00:00 Europe/Bratislava. Test switch: ?kbdsaleup=0 / =1 in one browser. */
  var SALEUP_UNTIL = Date.UTC(2026, 10, 30, 23, 0, 0);
  function saleUp() { var f = null; try { var q = location.search.match(/[?&]kbdsaleup=([01])(?:&|$)/); if (q) localStorage.setItem("kbdsaleup", q[1]); f = localStorage.getItem("kbdsaleup"); } catch (e) {} return !SK && (f === "1" || (f !== "0" && Date.now() < SALEUP_UNTIL)); }
  function klbOn() { var f = null; try { var q = location.search.match(/[?&]kbdklb=([01])(?:&|$)/); if (q) localStorage.setItem("kbdklb", q[1]); f = localStorage.getItem("kbdklb"); } catch (e) {} return f === "1" || (f !== "0" && KLB_ON); }
  function klbHtml() {
    if (!klbOn() || !L.klb) return "";
    var P = IMG + "klarna/" + (SK ? "sk" : "hu") + "_", K = L.klb;
    function face(cls, c) { return '<picture><source media="(min-width:992px)" srcset="' + P + "card_" + c + '_d.webp"><img class="' + cls + '" src="' + P + "card_" + c + '_m.webp" alt="" loading="lazy" decoding="async" width="500" height="660"></picture>'; }
    /* 2026-11-20 (David TG 5526, main msg 5334): the late-payment sentence is in Vera's B2 image (box), the 'Hogyan működik?' link is an HTML overlay
       in Vera's empty band next to the button (link_slot.json), the rest of the banner stays the sneaker link; no line under the banner any more */
    return '<section class="khr-sec khr-klb' + (SK ? ' khr-klb-sk' : '') + '" aria-label="Klarna"><div class="khr-klb-a"><a class="khr-klb-m" href="' + K.url + '"><picture>'
      + '<source media="(min-width:992px)" srcset="' + P + "bg_d_1920.webp 1920w, " + P + "bg_d_2560.webp 2560w, " + P + 'bg_d_3840.webp 3840w" sizes="(min-width:1272px) 1240px, calc(100vw - 32px)">'
      + '<img class="khr-klb-bg" src="' + P + 'bg_m_640.webp" srcset="' + P + "bg_m_640.webp 640w, " + P + "bg_m_960.webp 960w, " + P + 'bg_m_1280.webp 1280w" sizes="(max-width:632px) calc(100vw - 32px), 600px" alt="' + esc(K.alt) + '" loading="lazy" decoding="async" width="1280" height="1792"></picture>'
      + '<span class="khr-klb-card" aria-hidden="true"><span class="khr-klb-in">' + face("khr-klb-f", "black") + face("khr-klb-b", "pink") + "</span></span></a>"
      + '<a class="khr-klb-how" href="' + K.howUrl + '">' + esc(K.how) + "</a></div></section>";
  }
  function klbStart(root) {
    var s = $(".khr-klb", root || document); if (!s || s.getAttribute("data-k")) return; s.setAttribute("data-k", "1");
    var go = function () { s.classList.add("on"); };
    if ((window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) || !window.IntersectionObserver) { go(); return; }
    var io = new IntersectionObserver(function (en) { for (var i = 0; i < en.length; i++) if (en[i].isIntersecting) { io.disconnect(); setTimeout(go, 700); } }, { threshold: 0.5 });
    io.observe(s);
  }
  /* Shop the look strip (STL, Nora): ON for everyone since David's yes (TG 5540, main msg 5354/5392; live Lighthouse A/B 2026-11-20); ?kbdstl=1 / =0 forces it in one browser (localStorage "kbdstl").
     When on, only an empty placeholder section goes into the skeleton (after the size tiles, before the brands); stl.js builds the strip
     lazily, below the fold. STL_DATA: the data branch on jsDelivr (looks.json + img/, written by Nora's rotation job, hourly cache key in stl.js);
     if it is empty or the fetch fails, stl.js falls back to the snapshot in this code branch (BASE + "stl/"). Fail-open: no stl.js = the placeholder stays empty (0 px). */
  var STL_ON = true, STL_DATA = "https://cdn.jsdelivr.net/gh/vazsan/kicksbydavid-price-service@claude/kbd-stl-data/";
  function stlOn() { var f = null; try { var q = location.search.match(/[?&]kbdstl=([01])(?:&|$)/); if (q) localStorage.setItem("kbdstl", q[1]); f = localStorage.getItem("kbdstl"); } catch (e) {} return f === "1" || (f !== "0" && STL_ON); }
  function stlHtml() { return stlOn() ? '<section class="khr-sec khr-stl" data-k="stl" aria-label="' + L.stlT + '"></section>' : ""; }
  function stlStart(root) {
    var s = $('[data-k="stl"]', root); if (!s || s.getAttribute("data-k2")) return; s.setAttribute("data-k2", "1");
    function go() {
      if (document.getElementById("khr-stl-js")) return;
      window.KBD_STL = { base: BASE, data: STL_DATA || BASE + "stl/", sk: SK, sec: s };
      var j = mk("script"); j.id = "khr-stl-js"; j.async = true; j.src = BASE + "stl.js"; (document.head || document.documentElement).appendChild(j);
    }
    /* the strip must not compete with the LCP image (live Lighthouse 2026-11-20: with an 800 px margin it loaded at ~0.6-1 s, before LCP, incl. 2 model photos):
       the wide 800 px pre-load starts only after window "load"; before that only a visitor who really reaches it (200 px) triggers it */
    lazy(s, go, "200px 0px");
    function arm() { lazy(s, go, "800px 0px"); }
    if (document.readyState === "complete") arm(); else window.addEventListener("load", arm);
  }
  function skeleton(noHero) {
    var sz = "";
    for (var i = 0; i < SIZES.length; i++) sz += '<a data-s="' + SIZES[i] + '" href="' + L.base + '?filter=7723491:EU%20' + SIZES[i] + '"><small>EU</small><b>' + SIZES[i] + "</b></a>";
    sz += '<a href="' + L.base + '"><small>' + L.sizeAll + '</small><b>' + ARROW + "</b></a>";
    var br = "";
    for (var j = 0; j < BRANDS.length; j++) br += '<a data-b="' + BRANDS[j][0] + '" href="' + L.base + '?filter=8208356:' + encodeURIComponent(BRANDS[j][0]) + '"><img src="' + IMG + "brandlogo_" + BRANDS[j][1] + '.webp" alt="' + BRANDS[j][0] + '" loading="lazy" decoding="async"></a>';
    /* KLARNA (kanban 8e29caec, main msg 5246): the installment claim always with the credit warning right next to it (CCD2, min 12px); only while klOn() */
    var tk = L.ticker.filter(function (x) { return x !== "KLARNA" || klOn(); }).map(function (x) { return x === "RATE" ? '<i class="khr-rate">5,0 ' + L.rate + "</i>" : x; }), t = "";
    for (var k = 0; k < tk.length; k++) t += tk[k] === "KLARNA" ? '<span class="khr-kl"><b class="khr-klp">Klarna.</b>' + L.kl[0] + '<em>' + L.kl[1] + "</em></span>" : "<span>" + CHECK + tk[k] + "</span>";
    var tkh = ""; for (var c = 0; c < 4; c++) tkh += '<div class="khr-tkh"' + (c ? ' aria-hidden="true"' : "") + ">" + t + "</div>";
    var ph = '<div class="khr-ph" style="width:100%"></div>';
    var up = saleUp(), sg = '<section class="khr-sec' + (up ? " khr-first" : "") + '" data-k="sale" aria-label="' + L.saleT + '">' + head(L.saleT, L.saleUrl) + '<div class="khr-railbox"><div class="khr-rail type--1 list-type--1">' + ph + "</div></div></section>"
      + '<section class="khr-sec" data-k="grail" aria-label="' + L.grailT + '">' + head(L.grailT, L.grailUrl) + '<div class="khr-railbox"><div class="khr-rail type--1 list-type--1">' + ph + "</div></div></section>";
    return (noHero || SLIDER() ? '' : ''
      + '<a class="khr-hero" href="' + L.base + '?filter=8908281:4"><picture><source media="(min-width:992px)" srcset="' + IMG + 'hero_klassz_desk_1440.webp 1440w, ' + IMG + 'hero_klassz_desk_1920.webp 1920w, ' + IMG + 'hero_klassz_desk_2560.webp 2560w" sizes="100vw" width="1440" height="600">'
      + '<img src="' + IMG + 'hero_klassz_mob_780.webp" width="780" height="1040" fetchpriority="high" decoding="async" alt="' + L.alt + '"></picture>'
      + '<div class="khr-ht"><h1>' + L.h1 + '</h1><p>' + L.sub + '</p><span class="khr-btn">' + L.btn + ' ' + ARROW + "</span></div>"
      + '<span class="khr-cap">ASICS GEL-NYC<br>OYSTER GREY</span></a>')
      + '<div class="khr-w"><div class="khr-tk"><div class="khr-tkin" style="--tkd:' + L.tkdur + 's">' + tkh + "</div></div>"
      + (SLIDER() ? '<h1 class="khr-sr">' + L.h1.replace(/<br>/g, " ") + "</h1>" : "")
      + (up ? sg : "")
      + '<section class="khr-sec' + (up ? "" : " khr-first") + '" data-k="new" aria-label="' + L.newT + '">' + head(L.newT, L.newUrl) + '<div class="khr-railbox"><div class="khr-rail type--1 list-type--1">' + ph + "</div></div></section>"
      + klbHtml()
      + '<section class="khr-sec" aria-label="' + L.sizeT + '"><div class="khr-sh"><h2>' + L.sizeT + '</h2></div><div class="khr-szr">' + sz + '</div><p class="khr-szn">' + L.sizeNote + '</p></section>'
      + stlHtml()
      + '<section class="khr-sec" aria-label="' + L.brandsT + '"><div class="khr-sh"><h2>' + L.brandsT + '</h2></div><div class="khr-bl">' + br + "</div></section>"
      + '<section class="khr-sec khr-two"><div data-k="top">' + head(L.topT, L.base) + '<div class="khr-grid type--1 list-type--1">' + ph + "</div></div>"
      + '<div data-k="rev"><div class="khr-sh"><h2>' + L.revT + '</h2></div><div class="khr-revbox"><div class="khr-rvph"></div></div></div></section>'
      + (up ? "" : sg)
      + "</div>";
  }

  /* ---------- 2) kártyák: a natív csomópontok áthelyezése ---------- */
  function clean(card) {
    card.className = card.className.replace(/\bcol-[a-z0-9-]+\b/g, "").replace(/\b(carousel-cell|is-selected|is-draggable)\b/g, "").replace(/\s+/g, " ").trim();
    card.removeAttribute("aria-hidden"); card.removeAttribute("tabindex");
    card.style.position = ""; card.style.left = ""; card.style.top = ""; card.style.transform = ""; card.style.width = "";
    if (card.getAttribute("style") === "") card.removeAttribute("style");
    return card;
  }
  var APPAREL = /jacket|hoodie|pants|shorts|t-shirt|\btee\b|\bcap\b|\bbag\b|track|sweat|crew|fleece|póló|pulóver|nadrág|sapka|táska|kabát|dzseki|zokni|kapucnis|mellény|felső|mikina|tričko|nohavice|bunda|šiltovka|taška|ponožky|čiapka|vesta|košeľa/i;
  function isShoe(c) {
    var a = c.querySelector("a.product__name-link") || c.querySelector("a.product_link_normal");
    return !!a && !!a.getAttribute("href") && !APPAREL.test(a.textContent || "");
  }
  function fill(sec, cards, cls, max) {
    var box = $(cls, sec); if (!box || !cards.length) return false;
    box.innerHTML = "";
    for (var i = 0; i < cards.length && i < max; i++) box.appendChild(clean(cards[i]));
    box.setAttribute("data-full", "1");
    return true;
  }
  /* natív kezdőlapi modulok (AJAX-szal érkeznek): a kártyák kinyerése, ha már vannak */
  function nativeCards(boxId) {
    var b = document.getElementById(boxId); if (!b) return [];
    return $$(".js-product", b);
  }
  var done = { sale: false, top: false, "new": false, grail: false };
  function pulls() {
    var secSale = $('[data-k="sale"]'), secTop = $('[data-k="top"]');
    if (!done.sale) {
      /* csak a ténylegesen akciós kártyák (kedvezmény-jelvény): ha az akció véget ér, a sor magától eltűnik */
      var c1 = nativeCards("page_artref_inner").filter(isShoe).filter(function (c) { return !!c.querySelector(".badge--sale"); });
      if (c1.length >= 4) {
        done.sale = fill(secSale, c1.slice(0, N_SALE), ".khr-rail", N_SALE);
        if (done.sale) salePill(secSale);
        navFor(secSale);
      }
    }
    if (!done.top) {
      var c2 = nativeCards("box_top_content").filter(isShoe);
      if (c2.length >= 4) { done.top = fill(secTop, c2.slice(0, N_TOP), ".khr-grid", N_TOP); }
    }
  }
  /* „Akciós -N%”: csak akkor, ha a megjelenített kártyák kedvezménye azonos (nem írunk ki számot, amit nem a kártya mutat) */
  function salePill(sec) {
    var v = $$(".badge--sale", sec).map(function (b) { return parseInt((b.textContent || "").replace(/[^\d]/g, ""), 10); }).filter(function (n) { return n > 0; });
    if (!v.length) return;
    var lo = Math.min.apply(null, v), hi = Math.max.apply(null, v);
    var h = $(".khr-sh h2", sec);
    if (h && lo === hi && !$(".khr-pill", h)) h.insertAdjacentHTML("beforeend", ' <span class="khr-pill">-' + lo + "%</span>");
  }

  /* Most érkezett: a natív /ujdonsagok AJAX-lista (a márkapolcok is így töltenek), csak ha a sor közel van a képernyőhöz.
     Grail (Dávid TG 6035, Főnök msg 5848): ugyanígy a rejtett /grail kategória listájából (a tagságot a napi grail_cat.py tartja karban); 4 cipő alatt a szekció eltűnik */
  function loadNew(sec) { loadList(sec, "new", L.newUrl, "khr_new1", N_NEW); }
  function loadGrail(sec) { loadList(sec, "grail", L.grailUrl, "khr_grail1", N_GRAIL); }
  function loadList(sec, dk, path, key, N) {
    if (done[dk] || sec.getAttribute("data-loading")) return;
    sec.setAttribute("data-loading", "1");
    var url = ORIGIN + path + "?ajax_filter=1&ajax_nodesign=1&filter_value_count_disabled=1";
    function render(htmlTxt) {
      var doc; try { doc = new DOMParser().parseFromString(htmlTxt, "text/html"); } catch (e) { return false; }
      var cards = $$(".js-product", doc).filter(isShoe).slice(0, N).map(function (c) { return document.importNode(c, true); });
      if (cards.length < 4) return false;
      try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), h: cards.map(function (c) { return c.outerHTML; }).join("") })); } catch (e) {}
      done[dk] = fill(sec, cards, ".khr-rail", N); navFor(sec);
      return done[dk];
    }
    try {
      var c0 = JSON.parse(sessionStorage.getItem(key) || "null");
      if (c0 && c0.t && Date.now() - c0.t < 600000 && c0.h) {
        var d0 = new DOMParser().parseFromString("<div>" + c0.h + "</div>", "text/html");
        var k0 = $$(".js-product", d0).map(function (c) { return document.importNode(c, true); });
        if (k0.length >= 4) { done[dk] = fill(sec, k0, ".khr-rail", N); navFor(sec); return; }
      }
    } catch (e) {}
    if (!window.fetch) return fail();
    function fail() { var m = $(".khr-railbox", sec); if (m && !done[dk]) m.parentNode.removeChild(m), sec.parentNode && sec.parentNode.removeChild(sec); }
    fetch(url, { credentials: "same-origin" }).then(function (r) { return r.ok ? r.text() : ""; }).then(function (t) { if (!t || !render(t)) fail(); }).catch(fail);
  }
  function lazy(sec, fn, margin) {
    if (window.IntersectionObserver) {
      var io = new IntersectionObserver(function (en) { for (var i = 0; i < en.length; i++) if (en[i].isIntersecting) { io.disconnect(); fn(sec); } }, { rootMargin: margin });
      io.observe(sec);
    } else window.addEventListener("load", function () { setTimeout(function () { fn(sec); }, 1200); });
  }

  /* nyilak (asztalon): a sín görgetése */
  function navFor(sec) {
    var box = $(".khr-railbox", sec), rail = box && ($(".khr-rail", box) || $(".khr-rv", box));
    if (!rail || $(".khr-nav", box)) return;
    var p = mk("button", "khr-nav p", CHEV.l), n = mk("button", "khr-nav n", CHEV.r);
    p.type = n.type = "button"; p.setAttribute("aria-label", L.prev); n.setAttribute("aria-label", L.next);
    function upd() { p.hidden = rail.scrollLeft < 8; n.hidden = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 8; }
    function go(d) { rail.scrollBy({ left: d * Math.max(200, rail.clientWidth * 0.8), behavior: "smooth" }); }
    p.addEventListener("click", function () { go(-1); }); n.addEventListener("click", function () { go(1); });
    rail.addEventListener("scroll", upd, { passive: true }); window.addEventListener("resize", upd);
    box.appendChild(p); box.appendChild(n); upd(); setTimeout(upd, 600);
  }

  /* ---------- 3) értékelések: a Trustindex élő adatából (content.html), R2 kártyákkal ---------- */
  function tiUrl(pid) { return "https://cdn.trustindex.io/widgets/" + pid.slice(0, 2) + "/" + pid + "/content.html"; }
  /* a dátum a widget saját nyelvi sztringjéből (data-time-locale: "formátum|ma|egyes|többes|...": nap, hét, hónap, év) */
  function ago(ts, loc) {
    var p = (loc || "%d %s|ma|napja|napja|hete|hete|hónapja|hónapja|éve|éve").split("|");
    var d = Math.max(0, Math.floor((Date.now() / 1000 - ts) / 86400)), n, u;
    if (d < 1) return p[1] || "";
    if (d < 7) { n = d; u = 0; } else if (d < 30) { n = Math.floor(d / 7); u = 1; } else if (d < 365) { n = Math.floor(d / 30); u = 2; } else { n = Math.floor(d / 365); u = 3; }
    return (p[0] || "%d %s").replace("%d", n).replace("%s", p[2 + u * 2 + (n === 1 ? 0 : 1)] || "");
  }
  function tiCount(root) {
    var a = root.querySelector(".ti-footer .ti-rating-text a") || root.querySelector(".ti-footer .ti-rating-text"), m;
    return a && (m = (a.textContent || "").match(/\d+/)) ? parseInt(m[0], 10) : 0;
  }
  function tiRating(root) {
    var e = root.querySelector(".ti-header .nowrap strong") || root.querySelector(".ti-header strong"), v;
    if (e) { v = parseFloat((e.textContent || "").replace(",", ".")); if (v > 0 && v <= 5) return v; }
    return 0;
  }
  function parse(t) { try { return new DOMParser().parseFromString(t, "text/html"); } catch (e) { return null; } }
  function getTi(pid) { return fetch(tiUrl(pid)).then(function (r) { return r.ok ? r.text() : ""; }).then(function (t) { return t ? parse(t) : null; }); }
  function setRate(r, n) {
    var es = $$(".khr-rate");
    es.forEach(function (e) { if (r > 0 && n > 0) e.textContent = r.toFixed(1).replace(".", ",") + " " + L.rate; else e.parentNode.style.display = "none"; });
  }
  /* a widget egy értékelésének eredeti szövege: ha a Trustindex lefordította (SK widget a magyar véleményeket), az eredetit a rejtett data-ti-json mező hordozza; különben a látható szöveg az eredeti */
  function tiOriginal(it) {
    var tc = $(".ti-review-content", it); if (!tc) return "";
    var js = $("[data-ti-json]", tc);
    if (js) { try { var o = JSON.parse(decodeURIComponent(js.getAttribute("data-ti-json"))); if (o && typeof o.text === "string") return o.text.replace(/\s+/g, " ").trim(); } catch (e) {} }
    var cl = tc.cloneNode(true); $$(".ti-more-image-count,.ti-review-image,.ti-read-more,script,style,[hidden]", cl).forEach(function (x) { x.parentNode.removeChild(x); });
    return (cl.textContent || "").replace(/\s+/g, " ").trim();
  }
  function tiReviews(doc, out) {
    $$(".ti-review-item", doc).forEach(function (it) {
      var id = it.getAttribute("data-id"); if (!id) return;
      var txt = tiOriginal(it), hasJson = !!$("[data-ti-json]", it), pic = $(".ti-profile-img img", it);
      var r = { id: id, t: parseInt(it.getAttribute("data-time"), 10) || 0, lang: it.getAttribute("data-language") || "", rating: Math.round(parseFloat(it.getAttribute("data-rating")) || 5), name: (($(".ti-name", it) || {}).textContent || "").replace(/\s+/g, " ").trim(), pic: pic ? pic.getAttribute("src") : "", txt: txt, url: it.getAttribute("data-platform-page-url") || "", orig: hasJson };
      if (!out[id] || (!out[id].txt && r.txt) || (r.orig && !out[id].orig)) out[id] = r;
    });
  }
  /* Minden érték, amit a két Trustindex widget adata hordoz (HU + SK widget egyesítve, azonosító szerint), a legfrissebb elöl, EREDETI nyelven (gépi fordítás nélkül), a szöveg nélküliek rövid kártyaként. Dávid TG 2455. */
  function loadReviews(sec) {
    var box = $(".khr-revbox", sec); if (!box || box.getAttribute("data-done")) return;
    box.setAttribute("data-done", "1");
    if (!window.fetch || !window.DOMParser) return setRate(0, 0);
    var rating = 0, n = 0, gUrl = "";
    try { var c = JSON.parse(sessionStorage.getItem("kbd_ti") || "null"); if (c && c.t && Date.now() - c.t < 3600000) { rating = c.r; n = c.n; } } catch (e) {}
    var OTHER = SK ? "3ba033477a0d031a5f060029c5d" : "6b883db76988873e850692b71b0";
    Promise.all([getTi(TI_BIG), rating ? Promise.resolve(null) : getTi(TI_SMALL), getTi(OTHER).catch(function () { return null; })]).then(function (res) {
      var big = res[0], small = res[1], other = res[2];
      if (!big) throw new Error("ti");
      if (!n) n = tiCount(big);
      if (!rating && small) rating = tiRating(small);
      if (n && rating) { try { sessionStorage.setItem("kbd_ti", JSON.stringify({ t: Date.now(), r: rating, n: n })); } catch (e) {} }
      var all = {}; tiReviews(big, all); if (other) tiReviews(other, all);
      var items = Object.keys(all).map(function (k) { return all[k]; }).sort(function (x, y) { return y.t - x.t; });
      /* a slider-módban (előnézet, Dávid TG 2455) MIND; a hős-módban (élő) a régi válogatás: HU csak magyar, SK elöl a szlovák, utána a legfrissebb magyarok, legfeljebb 4, 4-5 csillag, csak szöveges */
      var ALL = SLIDER();
      if (!ALL) {
        var okr = function (r) { return r.txt && r.rating >= 4; };
        var own = items.filter(function (r) { return r.lang === L.revLang && okr(r); }), oth = SK ? items.filter(function (r) { return r.lang === "hu" && okr(r); }) : [];
        items = own.concat(oth).slice(0, 4);
      }
      if (!items.length || !(rating > 0) || !(n > 0)) throw new Error("ti-empty");
      for (var g = 0; g < items.length && !gUrl; g++) gUrl = items[g].url;
      var wd = $(".ti-widget", big), loc = wd ? wd.getAttribute("data-time-locale") : "";
      setRate(rating, n);
      var cards = "";
      items.forEach(function (r) {
        var txt = r.txt; if (txt.length > 280) txt = txt.slice(0, 277).replace(/\s+\S*$/, "") + "…";
        cards += '<div class="khr-rc' + (txt ? "" : " khr-rc0") + '"><div class="hd2"><span class="av">' + (/^https:\/\/lh3\.googleusercontent\.com\//.test(r.pic || "") ? '<img src="' + esc(r.pic) + '" alt="" width="36" height="36" loading="lazy" referrerpolicy="no-referrer">' : esc(r.name.charAt(0).toUpperCase()))
          + '</span><span class="nm2"><b>' + esc(r.name) + "</b><small>" + ago(r.t, loc) + '</small></span><img class="gi" src="https://cdn.trustindex.io/assets/platform/Google/icon.svg" alt="Google" width="18" height="18" loading="lazy"></div>'
          + stars(r.rating) + (txt ? "<p>" + esc(txt) + "</p>" : "") + "</div>";
      });
      var link = /^https:\/\/www\.google\.com\/maps\//.test(gUrl) ? gUrl : "";
      box.innerHTML = '<div class="khr-rs"><span class="n">' + rating.toFixed(1).replace(".", ",") + "</span><span>" + stars(5) + "<b>" + L.revBasis(n) + '</b><img class="khr-glogo" src="' + IMG + 'ti_Google_logo.svg" alt="Google" width="74" height="23"></span></div>'
        + '<div class="khr-railbox khr-rvbox"><div class="khr-rv' + (ALL ? " khr-rvall" : "") + (items.length === 1 ? " khr-one" : "") + '">' + cards + "</div></div>"
        + (link ? '<a class="khr-gl" href="' + esc(link) + '" target="_blank" rel="noopener">' + L.gBtn + ' ' + ARROW + "</a>" : "");
      if (ALL) navFor(box);
    }).catch(function () {
      /* tartalék: az eredeti Trustindex nagy widget (a loader a script helyére teszi) */
      var sc = document.createElement("script"); sc.defer = true; sc.async = true; sc.src = "https://cdn.trustindex.io/loader.js?" + TI_BIG;
      box.innerHTML = ""; box.appendChild(sc); setRate(0, 0);
    });
  }

  /* ---------- 3b) üres méret- és márkaszűrők elrejtése: a napi 2f ellenőrzés (home_tiles_gen.py) írja a tiles.json-t; nincs fájl vagy furcsa a tartalma = minden csempe látszik ---------- */
  function tiles(root) {
    if (!window.fetch) return;
    var u = "https://cdn.jsdelivr.net/gh/vazsan/kicksbydavid-price-service@claude/kbd-home-r2/storefront/r2-home/" + L.tiles + "?v=" + Math.floor(Date.now() / 3600000);
    fetch(u).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (!d || !d.sizes || !d.brands || d.sizes.length < 12 || d.brands.length < 10) return;
      $$("a[data-s]", root).forEach(function (a) { if (d.sizes.indexOf(a.getAttribute("data-s")) < 0) a.style.display = "none"; });
      $$("a[data-b]", root).forEach(function (a) { if (d.brands.indexOf(a.getAttribute("data-b")) < 0) a.style.display = "none"; });
    }).catch(function () {});
  }

  /* ---------- 4) indítás ---------- */
  /* Hős a slide 1 képéből (Főnök msg 2099): CSAK ha az Unas adminban a start_banner_big 1. slide-képének alt-szövege "r2:" előtaggal kezdődik (a kép felirat nélküli, Dávid döntése).
     Jelölés nélkül marad a saját hős-kép, tehát feliratos kép véletlenül sem kerül ki. A slide <picture>-je az élő markup másolata (az Unas a fejből már előtölti, a time= szám a képcserével magától változik). */
  /* GA4 homepage clicks (Nora msg 5882 point 5, main msg 5884): select_item for product cards in the R2 rails (list = section), select_promotion for slider slides,
     size / brand tiles and the "Mind" links. Only gtag (the shop's own GA4 tag, consent mode applies); no personal data. Off switch: GA_ON, ?kbdga=0 / =1 in one browser. */
  var GA_ON = false;   /* off until main/David OK (point 5 was not in David TG 6111 1-4) */
  function gaOn() { var f = null; try { var q = location.search.match(/[?&]kbdga=([01])(?:&|$)/); if (q) localStorage.setItem("kbdga", q[1]); f = localStorage.getItem("kbdga"); } catch (e) {} return f === "1" || (f !== "0" && GA_ON); }
  function gaSend(ev, p) { try { if (typeof window.gtag === "function") window.gtag("event", ev, p); else (window.dataLayer = window.dataLayer || []).push({ event: ev, ecommerce: p }); } catch (e) {} }
  if (gaOn() && !window.KBD_HOME_GA) {
    window.KBD_HOME_GA = 1;
    document.addEventListener("click", function (e) {
      var a = e.target && e.target.closest ? e.target.closest("a[href]") : null; if (!a) return;
      var t = function (x) { return (x || "").replace(/\s+/g, " ").trim().slice(0, 100); };
      var cell = a.closest("#start_banner_big .carousel-cell");
      if (cell) { var m = /carousel-cell--(\d+)/.exec(cell.className), n = m ? m[1] : "?", im = cell.querySelector("img");
        return gaSend("select_promotion", { promotion_id: "home_slide_" + n, promotion_name: t(im && im.getAttribute("alt")) || a.getAttribute("href"), creative_slot: "home_slider_" + n, location_id: "home" }); }
      var sec = a.closest("#khr [data-k], #khr section"); if (!sec) return;
      var k = sec.getAttribute("data-k") || "", card = a.closest(".js-product");
      if (card && k) {
        var cards = [].slice.call(sec.querySelectorAll(".js-product")), nm = card.querySelector("a.product__name-link") || a;
        return gaSend("select_item", { item_list_id: "home_" + k, item_list_name: "home " + k, items: [{ item_id: card.getAttribute("data-sku") || "", item_name: t(nm.textContent), index: cards.indexOf(card), item_list_id: "home_" + k, item_list_name: "home " + k }] });
      }
      if (a.closest(".khr-szr")) return gaSend("select_promotion", { promotion_id: "home_size_" + (a.getAttribute("data-s") || "all"), promotion_name: "size " + (a.getAttribute("data-s") || "all"), creative_slot: "home_sizes", location_id: "home" });
      if (a.closest(".khr-bl")) return gaSend("select_promotion", { promotion_id: "home_brand_" + (a.getAttribute("data-b") || "?"), promotion_name: "brand " + (a.getAttribute("data-b") || "?"), creative_slot: "home_brands", location_id: "home" });
      if (a.closest(".khr-sh")) return gaSend("select_promotion", { promotion_id: "home_more_" + (k || "?"), promotion_name: "more " + (k || t(sec.getAttribute("aria-label"))), creative_slot: "home_section_head", location_id: "home" });
    }, true);
  }
  var T0 = Date.now();
  function slideImg() { return document.querySelector("#start_banner_big .carousel-cell--1 picture img") || document.querySelector("#start_banner_big picture img"); }
  function wantSlide(img) { return !!img && /^\s*r2:/i.test(img.getAttribute("alt") || ""); }
  function useSlide(r, img) {
    var pic = img.parentNode, tgt = $(".khr-hero picture", r);
    if (!pic || pic.tagName !== "PICTURE" || !tgt) return;
    var np = pic.cloneNode(true), ni = $("img", np); if (!ni) return;
    ni.removeAttribute("class"); ni.removeAttribute("loading"); ni.removeAttribute("style"); ni.setAttribute("fetchpriority", "high"); ni.setAttribute("decoding", "async");
    ni.setAttribute("alt", (img.getAttribute("alt") || "").replace(/^\s*r2:\s*/i, ""));
    $$("source", np).forEach(function (so) { so.removeAttribute("class"); so.removeAttribute("style"); });
    tgt.parentNode.replaceChild(np, tgt);
  }
  function afterHero(r, fn) {
    var im = $(".khr-hero img", r), done0 = false;
    function go() { if (done0) return; done0 = true; fn(); }
    if (!im || im.complete) return go();
    im.addEventListener("load", go); im.addEventListener("error", go); setTimeout(go, 3500);
  }
  /* slider-mód: a natív #start_banner_big marad a helyén (az Unas képei, linkjei, sorrendje; az 1. kép előtöltve, a 2-n lusta, a helye az első kirajzolástól foglalt), a #khr a slider ALATT épül */
  function mountSlider(main) {
    if (!document.getElementById("khr-css")) { var st = mk("style"); st.id = "khr-css"; st.textContent = CSS; (document.head || document.documentElement).appendChild(st); }
    var banner = document.getElementById("start_banner_big");
    var r = mk("section", "", skeleton(true)); r.id = "khr"; r.setAttribute("aria-label", L.aria);
    if (banner && banner.parentNode === main) main.insertBefore(r, banner.nextSibling); else main.insertBefore(r, main.firstChild);
    tickerTouch(r);
    document.documentElement.className += " khr-ready";
    var sNew = $('[data-k="new"]', r), sRev = $('[data-k="rev"]', r), sGr = $('[data-k="grail"]', r);
    afterHero(r, function () { tiles(r); lazy(sNew, loadNew, "1200px 0px"); if (sGr) lazy(sGr, loadGrail, "1200px 0px"); });
    lazy(sRev, loadReviews, "600px 0px");
    stlStart(r);
    sliderDots(banner);
    return true;
  }
  /* pöttyök a natív Flickity-n (nem ad hozzá méretet: a slider fölé fektetve) */
  function sliderDots(banner) {
    if (!banner) return;
    var n = 0;
    (function wait() {
      var car = $(".carousel", banner), f = null;
      try { f = window.Flickity && car && window.Flickity.data(car); } catch (e) {}
      if (!f || !f.cells || f.cells.length < 2) { if (++n < 60) return setTimeout(wait, 250); return; }
      if ($(".khr-dots", banner)) return;
      /* WCAG 2.2.2 (Nora msg 5882, David TG 6111, main msg 5884), HU only: autoplay at least 7 s instead of the admin's 4 s; prefers-reduced-motion = no autoplay.
         The Unas inline resize handler restarts the player from its own options object, so that one is set too. */
      if (!SK) try {
        var rm = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches, ap = f.options.autoPlay;
        if (rm) { f.options.autoPlay = false; if (f.player) f.player.autoPlay = false; f.stopPlayer(); }
        else if (typeof ap === "number" && ap > 0 && ap < SL_MS) { f.options.autoPlay = SL_MS; if (f.player) f.player.autoPlay = SL_MS; f.stopPlayer(); f.playPlayer(); }   /* Flickity v3: the player reads its own copy */
        try { if (typeof $flkty_start_banner_big_options === "object") $flkty_start_banner_big_options.autoPlay = rm ? 0 : Math.max(SL_MS, +$flkty_start_banner_big_options.autoPlay || 0); } catch (e2) {}
      } catch (e) {}
      var box = mk("div", "khr-dots"), total = f.cells.length, bs = [];
      for (var i = 0; i < total; i++) (function (k) {
        var b = mk("button"); b.type = "button"; b.setAttribute("aria-label", (k + 1) + "/" + total);
        b.addEventListener("click", function () { try { f.stopPlayer(); f.select(k); } catch (e) {} });
        box.appendChild(b); bs.push(b);
      })(i);
      function upd() { for (var j = 0; j < bs.length; j++) bs[j].setAttribute("aria-current", j === f.selectedIndex ? "true" : "false"); }
      f.on("select", upd); upd();
      banner.appendChild(box);
      /* gépen oldalsó nyilak (a natív számláló + nyíl sor rejtve van, telefonon húzás) */
      var pb = mk("button", "khr-sn p", CHEV.l), nb = mk("button", "khr-sn n", CHEV.r);
      pb.type = nb.type = "button"; pb.setAttribute("aria-label", L.prev); nb.setAttribute("aria-label", L.next);
      pb.addEventListener("click", function () { try { f.stopPlayer(); f.previous(); } catch (e) {} }); nb.addEventListener("click", function () { try { f.stopPlayer(); f.next(); } catch (e) {} });
      banner.appendChild(pb); banner.appendChild(nb);
    })();
  }
  function mount() {
    var main = document.getElementById("main");
    if (!main) return false;
    var shell = document.getElementById("khr");
    if (shell && shell.getAttribute("data-shell") !== "1") return true;   /* már felépült */
    if (SLIDER() && !shell) return mountSlider(main);
    var simg = slideImg();
    if (!shell) {
      /* a slide még nem érkezett meg a feldolgozásból: legfeljebb 1,2 mp-ig várunk rá (a helyet a fej-tag tartja) */
      if (!simg && document.readyState === "loading" && Date.now() - T0 < 1200) return false;
    }
    if (!document.getElementById("khr-css")) { var st = mk("style"); st.id = "khr-css"; st.textContent = CSS; (document.head || document.documentElement).appendChild(st); }
    var r;
    if (shell) {
      /* a hőst a fej-tag már kirajzolta (héj): csak a többit építjük alá */
      r = shell; r.insertAdjacentHTML("beforeend", skeleton(true)); r.setAttribute("data-shell", "done"); tickerTouch(r);
    } else {
      r = mk("section", "", skeleton()); r.id = "khr"; r.setAttribute("aria-label", L.aria);
      if (wantSlide(simg)) useSlide(r, simg);
      main.insertBefore(r, main.firstChild); tickerTouch(r);
    }
    document.documentElement.className += " khr-ready";
    var sNew = $('[data-k="new"]', r), sRev = $('[data-k="rev"]', r), sGr = $('[data-k="grail"]', r);
    /* a hős kép előnyt kap a lassú hálón: a Most érkezett lista (~800 KB HTML) és a tiles.json csak a hős betöltése után (legfeljebb 3,5 mp) indul */
    afterHero(r, function () { tiles(r); lazy(sNew, loadNew, "1200px 0px"); if (sGr) lazy(sGr, loadGrail, "1200px 0px"); });
    lazy(sRev, loadReviews, "600px 0px");
    stlStart(r);
    return true;
  }
  /* ami 20 mp alatt sem kapott elég natív kártyát (pl. véget ért az akció), nem marad üres keret */
  function giveUp() {
    var k, e;
    if (!done.sale) { e = $('[data-k="sale"]'); if (e && e.parentNode) e.parentNode.removeChild(e); }
    if (!done.top) { e = $('[data-k="top"]'); if (e && e.parentNode) e.parentNode.removeChild(e); }
  }
  function startMain() {
    var tries = 0;
    (function tick() {
      mount(); pulls();
      if (++tries < 80 && !(done.sale && done.top)) setTimeout(tick, tries < 20 ? 60 : 250);
      else giveUp();
    })();
  }
  /* a modul a fejből töltődik: amint a #main megjelenik a feldolgozás közben, a hős már beszúrásra kerül (nincs régi tartalom villanás, a helyét a fej-tag korai CSS-e tartja) */
  function pageReady() { return !!(document.body && document.body.id === "ud_shop_start" && document.getElementById("main")); }
  /* alsó rész (Vera csomagja, bottom.js): süti kbdbottom / ?kbdbottom=1|0; alap: DEF_BT (élesítve: true, Dávid TG 2478, Nora mérése msg 2182). Csak akkor töltődik, ha be van kapcsolva. */
  var DEF_BT = true;
  function loadBottom() {
    var q = /[?&]kbdbottom=([01])(?:&|$)/.exec(location.search), c = /(?:^|;\s*)kbdbottom=([01])/.exec(document.cookie || "");
    var on = q ? q[1] === "1" : (c ? c[1] === "1" : DEF_BT);
    if (!on || document.getElementById("khb-js")) return;
    window.KBD_R2B_DEF = DEF_BT;
    var s = mk("script"); s.id = "khb-js"; s.async = true; s.src = BASE + "bottom.js"; (document.head || document.documentElement).appendChild(s);
  }
  function boot() {
    loadBottom();
    if (pageReady()) return startMain();
    if (document.readyState !== "loading") return;
    var started = false;
    function go() { if (started) return; started = true; if (mo) mo.disconnect(); if (document.body && document.body.id === "ud_shop_start") startMain(); }
    var mo = null;
    if (window.MutationObserver) { mo = new MutationObserver(function () { if (pageReady()) go(); }); mo.observe(document.documentElement, { childList: true, subtree: true }); }
    document.addEventListener("DOMContentLoaded", go);
  }
  boot();
})();
