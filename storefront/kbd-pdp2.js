/* ============================================================================
   KicksByDavid – termékoldal v2 (HU + SK): a prototípus szerinti réteg a v11 (kbd-pdp.js) fölött.
   Csak akkor töltődik, ha a v11 betöltője bekapcsolta: ?kbdv2=1 (a böngésző megjegyzi), ?kbdv2=0 kikapcsolja.
   Minden beállítás és szelektor a CFG / SEL blokkban van. A szövegek nyelvi kulcsok alatt állnak:
   az SK szövegek a TXT.sk blokkban vannak (gépi fordítás, anyanyelvi átnézés javasolt), egyébként a v11 szlovák szótárát használja.
   ============================================================================ */
(function () {
  "use strict";
  var d = document, h = d.documentElement;
  if (!h.classList.contains("kbd-pdp") || !h.classList.contains("kbd-v2")) return;
  if (window.__kbdPdp2) return;
  window.__kbdPdp2 = true;

  /* ========================= KONFIGURÁCIÓ ========================= */
  var CFG = {
    maxImages: 6,                                   /* a galéria legfeljebb ennyi képet mutat */
    phone: (window.KBD && window.KBD.sk) ? { tel: "+421910252548", label: "+421 910 252 548" } : { tel: "+36205564258", label: "+36 20 556 4258" },   /* nyelvenként: SK +421, HU +36 */
    /* szállítási doboz a KOSÁRBA gomb fölött + felugró ablak (minta: store/pdp-minta). Pilot: a <html> osztályában page_shop_artdet_<id>* szerepel; "*" = minden termékoldal; üres lista = ki */
    ship: { pilot: ["*"] },
    /* modell-sáv a cím és az ár között (minta: store/pdp-minta/adonio-modellsav*.jpg). A pilot lista, az adat helye és a letöltés a kbd-pdp.js-ben van (window.KBD_FAM): ott indul a letöltés az első kirajzolás előtt. */
    fam: { minCards: 3 },
    /* kuponblokk az ár alatt (kbd-pdp2-coupon.js; akciós terméken nincs) + elfogyott-méret értesítő (csak a ?kbdnotify=1 süti-kapu mögött, nem küld sehova) */
    coupon: { enabled: true },
    cod: { hu: "1 100 Ft" },                        /* utánvét felára, HU; az SK érték a v11 szótárából jön */
    /* Trustindex: kis jelvény (a hero-ban) és nagy vélemény-widget (a lap alján, a 6. lépésben) */
    trustindex: {
      hu: { small: "0d3908782f85181dd586d19e174", big: "3ba033477a0d031a5f060029c5d" },
      sk: { small: "f2ddae483a2767044106f3718af", big: "6b883db76988873e850692b71b0" }
    },
    reviewsAnchor: "#velemenyek",                   /* a jelvény erre görget, ha az oldalon van ilyen szekció */
    /* a lap második fele (kbd-pdp2-body.js). Ahol az adat még hiányzik, az érintett szekció nem jelenik meg. */
    body: {
      enabled: true,                                /* be/ki */
      nativeTabs: "policy",                         /* az Unas lapfülei: "policy" (csak Szállítás és Eredetiség), "all" (mind), "none" (egyik sem) */
      similarMax: 4,                                /* a „Hasonló termékek” sorban legfeljebb ennyi termék */
      /* „Kinek és mihez ajánljuk?”: modellcsalád (kisbetűvel) -> szöveg. Egy szöveg a modellcsalád minden termékén megjelenik. */
      fit: {},                                      /* szöveg: sima érték (csak HU) vagy { hu: "...", sk: "..." } */
      /* hangulatfotó a leírásban: modellcsalád (kisbetűvel) -> kép URL-je */
      moodPhoto: {},
      /* eladó bemutatása: a szekció csak akkor jelenik meg, ha a bemutatkozás szövege ki van töltve */
      seller: { photo: "", text: "" },              /* text: sima érték (csak HU) vagy { hu: "...", sk: "..." } */
      /* összehasonlító táblázat: a szekció csak akkor jelenik meg, ha minden versenytárs-cella ki van töltve.
         others: a három sor (Eredetiség ellenőrzése, Csere és visszaküldés, Fizetés) sorrendjében [resell webshopok, nagy webshopok] */
      compare: { others: [] },                      /* others: tömb (csak HU) vagy { hu: [...], sk: [...] } */
      /* videós vélemény: YouTube/Vimeo beágyazási URL; üresen a hely nem jelenik meg */
      videoReview: ""
    }
  };

  var SEL = {
    inner: "#artdet__main-block .artdet__block-cart-inner",
    alts: ".artdet__alts", thumbs: ".artdet__thumb-images",
    sticker: ".artdet__img-inner .sticker",
    saleBadge: ".artdet__badges .badge--sale span",
    sizeLabel: "#kbd-size-head .kbd-size-label", sizeActive: "#artdet__type .product-type__value.is-active .product-type__option-name",
    sizeHint: "#kbd-size-help .kbd-size-hint",
    sku: ".kbd-skuline b",
    points: ".artdet__virtual-point-highlighted",
    saving: ".artdet__discount-texts .artdet__discount-saving",
    periodStart: ".artdet__price-discount-period-start", periodEnd: ".artdet__price-discount-period-end",
    benefits: "#kbd3-benefits", trust: "#kbd-pdp-trust", reviews: "#kbd-pdp-reviews",
    addList: "#artdet__additional-products .product[data-sku]",
    cartBtns: ".artdet__cart-btn, #artdet__fixed-cart .fixed-cart__btn, .artdet__quick-order-btn"
  };

  /* ========================= SZÖVEGEK ========================= */
  var K = window.KBD || { sk: false, t: {} };
  var SK = !!K.sk, T1 = K.t || {};
  var TXT = {
    hu: {
      benefits: [
        "Új, eredeti dobozban, ellenőrzött európai nagykereskedőtől",
        "Gyári cikkszám kiírva (%SKU%), a keresőben ellenőrizheted",
        "30 nap ingyenes csere, utánvéttel is fizethetsz"
      ],
      sizeHint: "Nem vagy biztos a méretben? A csere 30 napig ingyenes, és ha megírod, mit hordasz, megmondjuk a méreted.",
      last1: "Ebből a méretből ez az utolsó pár",
      saving: { d: "akció kezdete: ", end: "a készlet erejéig", re: /készlet/i },
      cod: "Utánvét felára:",
      upsell: { prev: "Előző", next: "Következő" },
      ship: {
        eta: "Várható kézbesítés:", free: "✓ Ehhez a párhoz ingyenes a szállítás", miss: "Még <b>%X%</b> hiányzik az ingyenes szállításhoz",
        cod: "Utánvéttel is fizethetsz (+1 100 Ft)", btn: "Szállítási díjak és információk", title: "Szállítás és fizetés", close: "Bezárás",
        banner: ["46 250 Ft felett minden szállítás", "INGYENES"],
        s1: "Szállítási módok", ship: [["Packeta csomagpont / automata", "1 089 Ft", "automatánál csak bankkártya"], ["Packeta házhozszállítás", "2 179 Ft"], ["MPL", "3 800 Ft"]],
        s2: "Fizetés", pay: [["Bankkártya (Visa, Mastercard)", "0 Ft"], ["Utánvét", "+1 100 Ft", "átvételkor fizetsz"]],
        warn: "Utánvéttel fizetnél? Válassz csomagpontot vagy házhozszállítást. Csomagautomatánál csak bankkártyával fizethetsz.",
        foot: ["Kiszállítás nyomkövetéssel. E-mailben szólunk, hol tart a csomagod.", "↺ 30 napig ingyenes csere és visszaküldés.", "☎ Kérdésed van? %PHONE%"],
        checks: ["Utánvét", "30 nap ingyenes csere", "Nyomkövetés"],
        cards: [["truck", "Ingyenes szállítás", "46 250 Ft felett. Utánvét +1 100 Ft."], ["shield", "100% eredeti", "Eredeti dobozban, új állapotban. Dupla pénz vissza, ha hamis."], ["swap", "30 nap csere", "A cserét és a visszaküldést mi fizetjük."], ["ruler", "Méretgarancia", "Írd meg, mit hordasz, megmondjuk a méreted."]]
      }
    },
    /* Szlovák szövegek. Gépi fordítás a meglévő szlovák kifejezések (dobierka, výmena, kód výrobcu) alapján; anyanyelvi átnézés javasolt. */
    sk: {
      benefits: [
        "Nové, v originálnej krabici, od overeného európskeho veľkoobchodníka",
        "Výrobný kód je uvedený (%SKU%), vo vyhľadávači si ho môžeš overiť",
        "Platiť môžeš aj na dobierku"
      ],
      sizeHint: "Nie si si istý veľkosťou? Ak nám napíšeš, aké topánky nosíš, povieme ti tvoju veľkosť.",
      last1: "Posledný pár v tejto veľkosti",
      saving: { d: "začiatok akcie: ", end: "kým sú zásoby", re: /zásob|vypred/i },
      cod: null,
      upsell: { prev: "Predchádzajúce", next: "Ďalšie" },
      ship: {
        eta: "Predpokladané doručenie:", free: "✓ Pri tomto páre je doprava zdarma", miss: "Do dopravy zdarma chýba ešte <b>%X%</b>",
        cod: "Dobierka +3 €", btn: "Doprava a platba", title: "Doprava a platba", close: "Zavrieť",
        banner: ["Nad 120 € je doprava", "ZADARMO"],
        s1: "Spôsoby dopravy", ship: [["DPD Pickup / AlzaBox", "4 €"], ["DPD kuriér na adresu", "5 €"]],
        s2: "Platba", pay: [["Platba kartou (Visa, Mastercard)", "0 €"], ["Dobierka", "+3 €"]],
        warn: null,
        foot: ["↺ 30 dní výmena a vrátenie zadarmo.", "☎ Máte otázku? %PHONE%"],
        checks: null, cards: null   /* az SK pipás sor és kártyák a meglévő SK szövegekből készülnek (nincs új SK szöveg), lásd skShip() */
      }
    }
  };
  var TX = SK ? TXT.sk : TXT.hu;

  /* ========================= SEGÉD ========================= */
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function txt(el) { return el ? (el.textContent || "").replace(/\s+/g, " ").trim() : ""; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function ico(n) { return (window.KBDI || {})[n] || ""; }
  function mk(id, cls) { var e = d.getElementById(id); if (e) return e; e = d.createElement("div"); e.id = id; if (cls) e.className = cls; return e; }
  function setHtml(el, html) { if (el.getAttribute("data-k") !== html) { el.innerHTML = html; el.setAttribute("data-k", html); } }
  function after(node, ref) { if (node && ref && ref.parentNode && ref.nextElementSibling !== node) ref.parentNode.insertBefore(node, ref.nextSibling); }

  /* ========================= CSS ========================= */
  function css() {
    if (d.getElementById("kbd-pdp-v2css")) return;
    var S = "html.kbd-pdp.kbd-v2 ", M = S + "#artdet__main-block ";
    var MQ = "@media (max-width:767.98px){", EQ = "}";
    var r = [];
    /* színek: a v11 változóit írjuk át; a fő gombok barnája (--kbd-brown, --kbd-brown-h) a v11-ből marad */
    r.push("html.kbd-pdp.kbd-v2{--kbd-cream:#F5F5F2;--kbd-ink:#0E0E0E;--kbd-muted:#55554F;--kbd-line:#E4E4DF;--kbd-border:#CFCFC9;--kbd-ok:#17714A;--kbd-accent:#D6361F}");
    /* a jobb oszlop elemeinek sorrendje: CSS order, így a v11 átrendezései nem írják felül */
    r.push(M + ".artdet__block-cart-inner{max-width:none}");
    r.push(M + ".artdet__block-cart-inner>*{order:20}");
    var ord = ["#kbd-pdp-head", "#kbd5-fam", ".artdet__price-and-countdown", "#kbd-stock-line", "#kbd-size-head", "#artdet__type", "#kbd-size-help", "#kbd2-upsell", "#artdet__cart", "#kbd4-ship", "#kbd2-pay", "#kbd4-checks", "#kbd4-cards", "#kbd2-ship", "#kbd-pdp-trust", "#kbd2-meta"];
    ord.forEach(function (s, i) { r.push(M + ".artdet__block-cart-inner>" + s + "{order:" + (i + 1) + "}"); });
    /* a v11 elemei, amiket a prototípus szerinti sorok váltanak ki */
    r.push(M + "#kbd3-benefits," + M + "#kbd-pdp-delivery," + M + "#kbd-pdp-freeship," + M + "#kbd3-shipinfo," + M + "#kbd3-contact," + M + "#kbd3-pay," + M + "#kbd3-clar," + M + ".kbd-skuline," + M + ".artdet__virtual-point-highlighted," + M + ".kbd3-more," + M + ".kbd-skuhint," + M + ".artdet__price-base .info-icon," + M + ".artdet__prices .artdet__sale{display:none!important}");

    /* fejléc: márka, cím, alcím */
    r.push(M + "#kbd-pdp-head{padding-top:0}");
    r.push(M + ".kbd-eyebrow{font-size:13px;font-weight:700;letter-spacing:.1em;margin-bottom:22px}");
    r.push(M + ".kbd-title{font-size:34px;line-height:1.15;font-weight:800;letter-spacing:-.01em;margin:0}");
    r.push(M + ".kbd-sub{font-size:16px;color:var(--kbd-muted);margin:8px 0 22px}");
    r.push(MQ + M + ".kbd-eyebrow{font-size:12px;margin-bottom:18px}" + M + ".kbd-title{font-size:25px}" + M + ".kbd-sub{font-size:14px;margin:6px 0 18px}" + EQ);
    /* csillagozás */
    r.push(M + "#kbd-pdp-reviews{margin:0 0 14px;min-height:44px;align-items:center}");
    r.push(M + "#kbd-pdp-reviews .ti-header{font-size:14px;font-weight:600;min-height:44px;align-items:center}");
    r.push(MQ + M + "#kbd-pdp-reviews{margin-bottom:10px}" + EQ);
    /* három ígéret */
    r.push(M + ".kbd3-benefits{border:0;padding:0;margin:0;gap:10px}");
    r.push(M + ".kbd3-benefits li{font-size:15px;gap:12px;line-height:1.5}");
    r.push(M + ".kbd3-benefits li svg{width:20px;height:20px;stroke-width:2.2}");
    r.push(MQ + M + ".kbd3-benefits li{font-size:14px}" + M + ".kbd3-benefits li svg{width:18px;height:18px}" + EQ);

    /* ár és megtakarítás */
    r.push(M + ".artdet__price-and-countdown{margin:0!important;padding-top:0;border-top:0!important;row-gap:0!important}");
    r.push(S + "#artdet__main-block .artdet__price-discount," + M + ".artdet__prices>.product-price--base:only-child," + M + ".artdet__prices:not(.has-price-sale) .price-gross-format{font-size:38px!important;font-weight:800!important;letter-spacing:-.01em;line-height:1.1}");
    r.push(M + ".artdet__prices.has-price-sale .artdet__price-discount{color:var(--kbd-accent)!important}");
    r.push(M + ".artdet__price-base{font-size:18px!important;font-weight:400}");
    r.push(M + ".artdet__prices{gap:6px 14px}");
    r.push(M + ".artdet__discount-texts{margin-top:8px!important;font-size:14px}");
    r.push(M + ".artdet__discount-saving,"+ M + ".artdet__discount-saving__title," + M + ".artdet__discount-saving__value{color:var(--kbd-ink)!important;font-size:14px!important;font-weight:600!important}");
    r.push(M + ".kbd2-period{color:var(--kbd-muted);font-weight:500;font-size:14px}");
    r.push(MQ + M + ".artdet__price-discount," + M + ".artdet__prices>.product-price--base:only-child," + M + ".artdet__prices:not(.has-price-sale) .price-gross-format{font-size:30px!important}" + M + ".artdet__price-base{font-size:16px!important}" + M + ".artdet__discount-texts,"+ M + ".artdet__discount-saving__title," + M + ".artdet__discount-saving__value,"+ M + ".kbd2-period{font-size:13px!important}" + M + ".kbd2-period .kbd2-d{display:none}" + EQ);
    r.push(M + "#kbd-stock-line{margin:4px 0 0}");
    r.push(M + ".artdet__discount-saving__title::after{content:none!important}");
    r.push(M + "#kbd-stock-line .stock{font-size:14px!important;font-weight:700!important}");

    /* méretválasztó */
    r.push(M + "#kbd-size-head{margin:14px 0 2px!important;align-items:center}");
    r.push(M + ".kbd-size-label{font-size:14px!important;font-weight:700!important}" + M + ".kbd-size-label b{font-weight:800}");
    r.push(M + "#kbd-size-head .kbd-size-modal__open-btn{font-size:13px!important;font-weight:600!important;min-height:44px;text-decoration-color:currentColor}");
    r.push(M + ".product-type__values--text{display:flex!important;flex-wrap:wrap;grid-template-columns:none!important;gap:8px!important}");
    r.push(M + ".product-type__value--text{width:auto!important;min-width:52px!important;height:37px!important;border-width:1px!important;border-radius:8px!important;box-sizing:border-box}");
    r.push(M + ".product-type__value--text:not(.kbd-oos):not(.is-active){border-color:#ccc!important}");
    r.push(M + ".product-type__value--text:not(.kbd-oos):not(.is-active):hover{border-color:var(--kbd-ink)!important}");
    r.push(M + ".product-type__value--text .product-type__value-link{font-size:14px!important;font-weight:700!important;padding:0 8px!important;margin:-1px!important;width:calc(100% + 2px)!important;height:calc(100% + 2px)!important;min-height:0!important;white-space:nowrap}");
    r.push(M + ".product-type__value--text.is-active{border-color:var(--kbd-brown)!important}");
    r.push(M + "#kbd-size-help{margin:12px 0 0!important;font-size:13px;line-height:1.5;color:var(--kbd-muted)}");
    r.push(MQ + M + "#kbd-size-help{font-size:12px}" + EQ);

    /* kosárgomb, gyorsrendelés, fizetés */
    r.push(M + "#artdet__cart{margin:18px 0 0!important;row-gap:10px}");
    r.push(M + ".artdet__cart-btn{height:62px;border-radius:4px!important;background:var(--kbd-brown)!important;font:800 16px/1 Montserrat,Montserrat-fallback,sans-serif!important;letter-spacing:.05em;text-transform:uppercase}");
    r.push(M + ".artdet__cart-btn:hover," + M + ".artdet__cart-btn:focus-visible{background:var(--kbd-brown-h)!important}");
    r.push(M + ".artdet__cart-btn svg.kbd3-cart{display:none!important}");
    r.push(M + ".artdet__cart-btn .kbd-btn-price{font-weight:800;opacity:1;text-transform:none}");
    r.push(M + ".artdet__quick-order-btn{height:48px!important;min-height:48px!important;border:1.5px solid var(--kbd-ink)!important;border-radius:4px!important;background:#fff!important;font:700 14px/1 Montserrat,Montserrat-fallback,sans-serif!important;text-transform:none!important}");
    r.push(M + ".artdet__quick-order-btn:hover{background:var(--kbd-ink)!important;color:#fff!important}");
    r.push(MQ + M + ".artdet__cart-btn{height:58px;font-size:15px!important}" + M + ".artdet__cart-btn .kbd-btn-price{display:none}" + EQ);
    r.push(M + "#kbd2-pay{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:13px;color:var(--kbd-muted);margin-top:12px}");
    r.push(M + "#kbd2-pay b{font-weight:600;color:var(--kbd-ink)}");
    r.push(M + "#kbd2-pay .pm{border:1px solid var(--kbd-border);border-radius:3px;padding:2px 8px;font-size:11px;font-weight:700;color:var(--kbd-ink);background:#fff}");
    r.push(MQ + M + "#kbd2-pay{gap:8px;font-size:12px}" + M + "#kbd2-pay .pm{font-size:10.5px;padding:1px 7px}" + EQ);

    /* szállítási doboz */
    r.push(M + "#kbd2-ship{background:var(--kbd-cream);border-radius:6px;padding:18px 20px;margin-top:22px;display:flex;flex-direction:column;gap:14px}");
    r.push(M + "#kbd2-ship .kbd2-row{display:flex;gap:14px;align-items:flex-start;font-size:14px;line-height:1.5;color:var(--kbd-ink)}");
    r.push(M + "#kbd2-ship .kbd2-row>svg{width:22px;height:22px;flex:none;margin-top:1px;stroke-width:1.8}");
    r.push(M + "#kbd2-ship .kbd2-row b{font-weight:700}");
    r.push(M + "#kbd2-ship .kbd2-row a{color:var(--kbd-ink);text-decoration:none}");
    r.push(M + "#kbd2-ship .kbd3-shipinfo{margin:0;font-size:14px;color:var(--kbd-ink)}");
    r.push(MQ + M + "#kbd2-ship{padding:16px;gap:12px}" + M + "#kbd2-ship .kbd2-row{font-size:13px;gap:12px}" + M + "#kbd2-ship .kbd2-row>svg{width:20px;height:20px}" + EQ);


    /* szállítási doboz a KOSÁRBA gomb fölött, csempék a gomb alatt, felugró ablak (minta: store/pdp-minta/minta.html) */
    r.push(M + "#kbd4-ship{border:1px solid var(--kbd-line);border-radius:12px;padding:11px 12px;margin:12px 0 0;font-size:13px;line-height:1.5;color:var(--kbd-ink);background:#fff;letter-spacing:normal;text-transform:none}");
    r.push(M + "#kbd4-ship .k4-d{min-height:19px}" + M + "#kbd4-ship .k4-f{color:var(--kbd-ok);font-weight:700}" + M + "#kbd4-ship .k4-c{color:var(--kbd-muted)}");
    r.push(M + "#kbd4-ship .k4-b{display:flex;align-items:center;justify-content:space-between;width:100%;margin-top:8px;border:1.5px solid var(--kbd-ink);border-radius:8px;padding:8px 10px;font:700 13px/1.3 Montserrat,Montserrat-fallback,sans-serif;background:#fff;color:var(--kbd-ink);cursor:pointer;text-align:left;text-transform:none;letter-spacing:normal}");
    r.push(M + "#kbd4-ship .k4-b:hover{background:var(--kbd-ink);color:#fff}");
    /* KOSÁRBA alatt (adonio szerkezet): színes fizetési logók, pipás sor, 2x2 kártyarács; a régi garanciakártyák (#kbd-pdp-trust) ilyenkor rejtve */
    var K4 = "html.kbd4t.kbd-pdp.kbd-v2 #artdet__main-block ";
    r.push(K4 + "#kbd-pdp-trust{display:none!important}");
    r.push(K4 + "#kbd2-pay{display:flex;justify-content:center;align-items:center;gap:8px;margin-top:-8px}");
    r.push(K4 + "#kbd2-pay .k4-chip{width:40px;height:26px;border:1px solid #e6e6e6;border-radius:6px;background:#fff;display:inline-flex;align-items:center;justify-content:center;padding:0;box-sizing:border-box}");
    r.push(K4 + "#kbd2-pay .k4-chip svg{width:38px;height:24px;display:block}");
    r.push(M + "#kbd4-checks{display:flex;flex-wrap:wrap;justify-content:center;gap:4px 14px;margin-top:-10px;font-size:12.5px;line-height:1.3;font-weight:600;color:var(--kbd-muted);letter-spacing:normal}");
    r.push(M + "#kbd4-checks span{display:inline-flex;align-items:center;gap:5px}" + M + "#kbd4-checks svg{width:12px;height:12px;flex:none;color:#1f7a4d;stroke-width:2.4}");
    r.push(M + "#kbd4-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:10px}");
    r.push(M + "#kbd4-cards .k4-card{background:#fff;border:1px solid #e6e6e6;border-radius:12px;padding:16px;box-sizing:border-box;min-width:0}");
    r.push(M + "#kbd4-cards .k4-card svg{width:24px;height:24px;display:block;margin:0 0 12px;color:#111;stroke-width:1.6}");
    r.push(M + "#kbd4-cards .k4-card b{display:block;font-size:15px;font-weight:700;line-height:1.3;margin:0 0 4px;color:#111;letter-spacing:normal}");
    r.push(M + "#kbd4-cards .k4-card span{display:block;font-size:13px;line-height:1.45;color:#666;letter-spacing:normal}");
    r.push("html.kbd4 #kbd2-ship{display:none!important}");
    r.push("#kbd4-ov{position:fixed;left:0;top:0;right:0;bottom:0;z-index:100000;background:rgba(0,0,0,.45);display:none;overflow-y:auto;-webkit-overflow-scrolling:touch;letter-spacing:normal;text-transform:none}#kbd4-ov.k4-on{display:block}");
    r.push("#kbd4-mo{position:relative;margin:70px 12px 24px;max-width:440px;background:#fff;border-radius:18px;padding:18px 18px 14px;color:#111;font-size:13.5px;line-height:1.4}");
    r.push("@media (min-width:576px){#kbd4-mo{margin:8vh auto 24px}}");
    r.push("#kbd4-mo h3{display:flex;justify-content:space-between;align-items:center;margin:0 0 12px;font-size:21px;font-weight:800;line-height:1.2;text-transform:none;letter-spacing:normal}");
    r.push("#kbd4-mo .k4-x{border:0;background:none;font-size:26px;line-height:1;padding:4px 6px;cursor:pointer;color:#111;min-width:44px;min-height:44px}");
    r.push("#kbd4-mo .k4-free{display:flex;justify-content:space-between;gap:8px;background:#eaf6ef;border:1px solid #bfe3cd;color:var(--kbd-ok);border-radius:10px;padding:9px 11px;font-weight:700;font-size:13px;margin-bottom:6px}");
    r.push("#kbd4-mo .k4-sec{font-size:11px;letter-spacing:1.5px;font-weight:800;color:var(--kbd-muted);margin:12px 0 2px;text-transform:uppercase}");
    r.push("#kbd4-mo .k4-li{display:flex;justify-content:space-between;gap:8px;padding:9px 0;border-bottom:1px solid var(--kbd-line)}#kbd4-mo .k4-li span:last-child{font-weight:700;white-space:nowrap}");
    r.push("#kbd4-mo .k4-li em{display:block;font-style:normal;font-size:11.5px;color:var(--kbd-muted);font-weight:500}");
    r.push("#kbd4-mo .k4-warn{background:#fff6e5;border:1px solid #f2d39b;border-radius:10px;padding:8px 10px;font-size:12px;margin-top:10px;line-height:1.4}");
    r.push("#kbd4-mo .k4-foot{font-size:12px;color:var(--kbd-muted);margin-top:10px;line-height:1.5}");
    r.push("html.kbd4-lock,html.kbd4-lock body{overflow:hidden!important}");

    /* pipálós kiegészítő termék */

    /* garanciakártyák */
    r.push(M + "#kbd-pdp-trust{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:14px 20px!important;margin:22px 0 0!important;padding:0!important;border:0!important}");
    r.push(S + ".kbd-trust{gap:12px!important;align-items:flex-start}");
    r.push(S + ".kbd-trust svg{width:40px!important;height:40px!important;flex:0 0 40px!important;padding:10px;box-sizing:border-box;border-radius:50%;background:var(--kbd-ink);color:#fff!important;stroke-width:1.8;margin:0!important}");
    r.push(S + ".kbd-trust b{font-size:14px!important;font-weight:700!important;line-height:1.35}");
    r.push(S + ".kbd-trust span{font-size:13px!important;line-height:1.4;color:var(--kbd-muted)!important}");
    r.push(MQ + M + "#kbd-pdp-trust{grid-template-columns:1fr!important;gap:12px!important}" + S + ".kbd-trust{align-items:center}" + S + ".kbd-trust span{font-size:12.5px!important}" + EQ);

    /* pontok és cikkszám */
    r.push(M + "#kbd2-meta{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;border-top:1px solid var(--kbd-line);margin-top:22px;padding-top:18px;font-size:13px;color:var(--kbd-muted)}");
    r.push(M + "#kbd2-meta strong{color:var(--kbd-ink);font-weight:700}");
    r.push(M + "#kbd2-meta .kbd2-sku{display:flex;align-items:center;gap:10px;flex-wrap:wrap}");
    r.push(M + "#kbd2-meta button{height:32px;padding:0 12px;border:1px solid var(--kbd-border);border-radius:3px;background:#fff;font:600 12px/1 Montserrat,Montserrat-fallback,sans-serif;color:var(--kbd-ink);cursor:pointer}");
    r.push(MQ + M + "#kbd2-meta{flex-direction:column;align-items:flex-start;gap:8px;font-size:12px}" + M + "#kbd2-meta button{height:44px;padding:0 14px}" + EQ);
    r.push(M + "#artdet__functions{margin-top:14px}");

    /* galéria */
    r.push(S + ".artdet__img-inner{background:var(--kbd-cream)!important;border-radius:6px!important;padding:0!important}");
    r.push(S + ".artdet__img-inner img.artdet__alt-img{max-width:100%!important}");
    r.push(S + ".artdet__img-inner .stickers-wrap{top:16px!important;left:16px!important}");
    r.push(S + ".artdet__img-inner .sticker{background:var(--kbd-accent)!important;color:#fff!important;border-radius:3px!important;font:800 13px/1 Montserrat,Montserrat-fallback,sans-serif!important;letter-spacing:.06em!important;padding:6px 12px!important;text-transform:uppercase}");
    r.push(S + ".artdet__thumb-images{margin-top:12px}");
    r.push(S + ".artdet__thumb-img-outer{width:88px!important;margin-right:10px!important}");
    r.push(S + ".artdet__thumb-img-wrap{padding:0!important;border-radius:4px!important;border:2px solid transparent!important;background:var(--kbd-cream)!important;overflow:hidden}");
    r.push(S + ".artdet__thumb-img-wrap img{width:100%!important;height:auto!important;display:block}");
    r.push(S + ".artdet__thumb-img-outer.is-nav-selected .artdet__thumb-img-wrap{border-color:var(--kbd-ink)!important}");
    r.push("@media (min-width:992px){" + S + ".artdet__block-left-outer{position:sticky;top:24px}" + EQ);
    r.push(MQ + S + ".artdet__img-inner .stickers-wrap{top:12px!important;left:12px!important}" + S + ".artdet__img-inner .sticker{font-size:12px!important;padding:5px 10px!important}"
      + S + ".artdet__img-inner img.artdet__alt-img{max-height:none!important;width:100%!important}" + S + ".artdet__img-inner .flickity-viewport{height:auto}"
      + S + ".artdet__thumb-images{padding:0 16px}" + S + ".artdet__thumb-img-outer{width:64px!important;margin-right:8px!important}" + EQ);

    /* lebegő sáv: a színeket a változók adják, a gomb sarka és betűje a prototípus szerint */
    r.push(S + "#artdet__fixed-cart .fixed-cart__btn{border-radius:4px!important;text-transform:uppercase;letter-spacing:.04em;font-weight:800!important}");

    /* az Unas a jobb oszlop elemei közé 20 px rést tesz (.artdet__block-cart-inner{gap:20px}); a felső blokk (értékelés, ár, Raktáron, Méret) összehúzása negatív felső margóval.
       Mért célok (látható pixelek között): értékelés-ár ~16, ár-Raktáron ~8, Raktáron-Méret ~16. A fejléc a negatív margó alatt is kattintható marad (z-index). */
    r.push(M + "#kbd-pdp-head{position:relative;z-index:1}");
    r.push(M + ".artdet__price-and-countdown{margin-top:-45px!important}");
    r.push(M + "#kbd-stock-line{margin-top:-24px}");
    r.push(M + "#kbd-size-head{margin-top:-14px!important}");
    r.push(M + "#kbd-size-head:has(.kbd-size-modal__open-btn){margin-top:-25px!important}");
    /* a méretválasztó alatti mondat ("Nem vagy biztos a méretben?" / "Nie si si istý veľkosťou?") kikerül a körülötte lévő hellyel együtt; a Méretgarancia kártya marad */
    r.push(M + "#kbd-size-help{display:none!important}");
    r.push(MQ + M + ".artdet__price-and-countdown{margin-top:-31px!important}" + M + "#kbd-stock-line{margin-top:-23px}" + EQ);

    /* vizszintes tulcsordulas elleni vedelem (David, msg 790: iOS Safarin egy kilogó elem kiszelesiti az oldalt, a ragados kosar-sav jobbra kilog). A fo ok javitva (.kbd2-rev-widget, kbd-pdp2-body.js); ez a biztonsagi halo.
       A ragados sav a nezetablakhoz kot (left/right 0, nem 100vw), a tartalom nem szelesitheti. overflow-x:clip nem hoz letre gorgetesi kontenert, a sticky/fixed elemek nem torik. */
    r.push("html.kbd-pdp,html.kbd-pdp body{overflow-x:clip;max-width:100%}");
    r.push(S + "#artdet__fixed-cart{left:0;right:0;width:auto;max-width:100%;box-sizing:border-box}");
    /* modell-sáv (K5): felirat + "Összes" link, alatta oldalra görgethető 64x64-es képkártyák; az aktuális fekete 2 px kerettel. A -37 px a fejléc alatti üres sávba nyúlik (mint az ár fent). */
    var K5 = "html.kbd5.kbd-pdp.kbd-v2 #artdet__main-block ";
    r.push(M + "#kbd5-fam{position:relative;z-index:2;margin-top:-37px;width:100%;max-width:100%;min-width:0;box-sizing:border-box}");
    r.push(K5 + ".artdet__price-and-countdown{margin-top:-5px!important}");
    r.push(M + "#kbd5-fam .k5-h{display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin:0 0 8px;font-size:13px;line-height:1.3}");
    r.push(M + "#kbd5-fam .k5-m{font-weight:700;color:var(--kbd-muted);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}");
    r.push(M + "#kbd5-fam .k5-all{flex:0 0 auto;font-weight:500;color:var(--kbd-ink)!important;text-decoration:underline;text-underline-offset:3px;padding:4px 0}");
    /* a sor a sajat oszlopaban marad (max-width:100%, a tulcsordulas a soron belul gorgetheto); a kartyameretet a JS igazitja (--k5), hogy csak egesz kartya latszodjon */
    r.push(M + "#kbd5-fam .k5-w{position:relative;width:100%;max-width:100%;min-width:0;overflow:hidden}");
    r.push(M + "#kbd5-fam .k5-r{display:flex;gap:8px;width:100%;max-width:100%;box-sizing:border-box;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;scroll-padding:0 3px;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain;scrollbar-width:none;padding:3px}");
    r.push(M + "#kbd5-fam .k5-r::-webkit-scrollbar{display:none}");
    r.push(M + "#kbd5-fam .k5-c{flex:0 0 var(--k5,64px);width:var(--k5,64px);height:var(--k5,64px);box-sizing:border-box;border:1px solid #e6e6e6;border-radius:10px;background:#fff;overflow:hidden;display:block;scroll-snap-align:start;padding:3px}");
    r.push(M + "#kbd5-fam .k5-c img{display:block;width:100%;height:100%;object-fit:contain}");
    r.push(M + "#kbd5-fam .k5-c:hover{border-color:#bdbdb6}");
    r.push(M + "#kbd5-fam .k5-c:focus-visible,#kbd5-fam .k5-all:focus-visible,#kbd5-fam .k5-a:focus-visible{outline:2px solid var(--kbd-ink);outline-offset:-2px}");
    r.push(M + "#kbd5-fam .k5-c.k5-cur{border:2px solid #111;padding:2px}");
    /* nyilak (asztalin) es halvany atmenet a sor vegen (mobilon): csak ha van meg kartya abba az iranyba */
    r.push(M + "#kbd5-fam .k5-a{display:none;position:absolute;top:50%;transform:translateY(-50%);width:32px;height:32px;margin:0;padding:0;border:1px solid #d6d6d0;border-radius:50%;background:#fff;color:#111;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,.15);align-items:center;justify-content:center;z-index:3}");
    r.push(M + "#kbd5-fam .k5-a svg{width:16px;height:16px;display:block}");
    r.push(M + "#kbd5-fam .k5-prev{left:4px}" + M + "#kbd5-fam .k5-next{right:4px}");
    r.push(M + "#kbd5-fam .k5-w.k5-bk .k5-prev," + M + "#kbd5-fam .k5-w.k5-fw .k5-next{display:flex}");
    r.push(M + "#kbd5-fam .k5-w.k5-fw::after{content:'';position:absolute;top:0;right:0;bottom:0;width:28px;pointer-events:none;background:linear-gradient(to right,rgba(255,255,255,0),#fff)}");
    r.push("@media (min-width:768px){" + M + "#kbd5-fam .k5-w.k5-fw::after{display:none}}");
    r.push(MQ + M + "#kbd5-fam{margin-top:-33px}" + M + "#kbd5-fam .k5-a{display:none!important}" + EQ);

    var st = d.createElement("style");
    st.id = "kbd-pdp-v2css";
    st.textContent = r.join("");
    (d.head || h).appendChild(st);
  }
  css();

  /* ========================= DOM ========================= */
  function fixSticker() {
    var st = $(SEL.sticker);
    if (!st || st.getAttribute("data-kbd2") || !/^sale$/i.test(txt(st))) return;
    var p = parseInt(txt($(SEL.saleBadge)), 10);
    if (p > 0) { st.textContent = "SALE -" + p + "%"; st.setAttribute("data-kbd2", "1"); }
  }

  function selectedSize() { return txt($(SEL.sizeActive)).replace(/^EU\s+/i, ""); }
  function fixSizeBlock() {
    var lab = $(SEL.sizeLabel);
    if (lab && !lab.querySelector(".kbd2-sel")) {
      var v = selectedSize();
      if (v) lab.insertAdjacentHTML("beforeend", ': <b class="kbd2-sel">' + esc(v) + "</b>");
    }
    var hint = $(SEL.sizeHint);
    if (hint && TX.sizeHint && !hint.getAttribute("data-kbd2")) { hint.textContent = TX.sizeHint; hint.setAttribute("data-kbd2", "1"); }
  }

  function factorySku() { return txt($(SEL.sku)); }
  function fixBenefits() {
    var b = $(SEL.benefits);
    if (!b || !TX.benefits || b.getAttribute("data-kbd2")) return;
    var sku = factorySku();
    if (!sku) return;
    var lis = $$("li span", b);
    if (lis.length < TX.benefits.length) return;
    TX.benefits.forEach(function (s, i) { lis[i].textContent = s.replace("%SKU%", sku); });
    b.setAttribute("data-kbd2", "1");
  }

  function savingLine() {
    if (!TX.saving) return;
    var box = $(SEL.saving);
    if (!box || $(".kbd2-period", box)) return;
    var st = txt($(SEL.periodStart)), end = txt($(SEL.periodEnd));
    var start = st.match(/\d{4}\.\s?\d{1,2}\.\s?\d{1,2}/) || st.match(/\d{1,2}\.\s?\d{1,2}\.\s?\d{4}/);
    if (!start || !TX.saving.re.test(end)) return;
    box.insertAdjacentHTML("beforeend", ' <span class="kbd2-period">· <span class="kbd2-d">' + esc(TX.saving.d) + esc(start[0]) + ", </span>" + esc(TX.saving.end) + "</span>");
  }

  function payRow() {
    var e = mk("kbd2-pay"), t = T1.payments || [];
    if (shipOn()) { h.classList.add("kbd4t"); setHtml(e, payChips()); return e; }
    if (!T1.clarity) return null;
    setHtml(e, "<b>" + esc(T1.clarity) + "</b>" + t.map(function (p) { return '<span class="pm">' + esc(p) + "</span>"; }).join(""));
    return e;
  }

  var TAG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12l9-9h8v8l-9 9z"/><path d="M16 8h.01"/></svg>';
  var PHONE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>';

  function shipBox() {
    var e = mk("kbd2-ship"), rows = [];
    var dv = $("#kbd-pdp-delivery span");
    if (dv) rows.push([ico("truck"), dv.innerHTML.replace(/\s·\s/, ", ")]);
    var free = $("#kbd-pdp-freeship span"), si = $("#kbd3-shipinfo");
    if (free) rows.push([TAG, esc(txt(free))]);
    else if (si) { var c = si.cloneNode(true), r3 = $(".row3", c); if (r3) r3.parentNode.removeChild(r3); if (txt(c)) rows.push([ico("truck"), '<div class="kbd3-shipinfo">' + c.innerHTML + "</div>"]); }
    var cod = SK ? (T1.cod || "") : (TX.cod + " <b>" + CFG.cod.hu + "</b>");
    if (cod) rows.push([ico("cash"), cod]);
    rows.push([PHONE, esc(T1.contactQ || "") + " " + esc(T1.contactCall || "") + ' <b><a href="tel:' + CFG.phone.tel + '">' + CFG.phone.label + "</a></b>"]);
    setHtml(e, rows.map(function (r) { return '<div class="kbd2-row">' + r[0] + "<span>" + r[1] + "</span></div>"; }).join(""));
    return e;
  }
  function metaRow() {
    var e = mk("kbd2-meta"), pts = $(SEL.points), sku = factorySku();
    var html = "";
    if (pts) html += "<span>" + esc(txt($(".artdet__virtual-point-highlighted__title", pts))) + " <strong>" + esc(txt($(".artdet__virtual-point-highlighted__content", pts))) + "</strong></span>";
    if (sku) html += '<span class="kbd2-sku">' + esc(T1.skuLabel || "") + ": <strong>" + esc(sku) + '</strong><button type="button" data-sku="' + esc(sku) + '">' + esc(T1.copy || "") + "</button></span>";
    if (!html) return null;
    setHtml(e, html);
    return e;
  }
  d.addEventListener("click", function (ev) {
    var b = ev.target.closest && ev.target.closest("#kbd2-meta button");
    if (!b) return;
    var s = b.getAttribute("data-sku"), done = function () { b.textContent = T1.copied || ""; setTimeout(function () { b.textContent = T1.copy || ""; }, 2000); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(s).then(done, done);
    else { var ta = d.createElement("textarea"); ta.value = s; d.body.appendChild(ta); ta.select(); try { d.execCommand("copy"); } catch (e) {} ta.remove(); done(); }
  });

  function trustTexts() {
    $$(SEL.trust + " .kbd-trust span").forEach(function (s) { if (!s.getAttribute("data-kbd2")) { s.textContent = txt(s).replace(/\.$/, ""); s.setAttribute("data-kbd2", "1"); } });
  }

  /* Trustindex: a kis jelvény nyelvenként más azonosítóval töltődik; a v11 mindkét nyelven a HU azonosítót tette be */
  function reviewsWidget() {
    var box = $(SEL.reviews);
    if (!box || box.getAttribute("data-kbd2")) return;
    var want = CFG.trustindex[SK ? "sk" : "hu"].small, sc = $("script[src*='trustindex.io/loader.js']", box);
    if (sc && sc.src.indexOf(want) < 0) {
      box.innerHTML = "";
      var n = d.createElement("script");
      n.defer = true; n.async = true; n.src = "https://cdn.trustindex.io/loader.js?" + want;
      box.appendChild(n);
    }
    box.setAttribute("data-kbd2", "1");
  }
  d.addEventListener("click", function (ev) {
    var a = ev.target.closest && ev.target.closest("#kbd-pdp-reviews a");
    var tgt = d.querySelector(CFG.reviewsAnchor);
    if (!a || !tgt) return;
    ev.preventDefault();
    tgt.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  /* galéria: legfeljebb CFG.maxImages kép a nagy sávban és az indexképek között is */
  function limitGallery() {
    var alts = $(SEL.alts), th = $(SEL.thumbs);
    if (!alts || !window.Flickity || !alts.classList.contains("flickity-enabled") || alts.getAttribute("data-kbd2")) return;
    var f = Flickity.data(alts);
    if (!f) return;
    alts.setAttribute("data-kbd2", "1");
    function cut(fl) {
      if (fl && fl.cells.length > CFG.maxImages) fl.remove(fl.cells.slice(CFG.maxImages).map(function (c) { return c.element; }));
      if (fl) fl.resize();
    }
    cut(f);
    if (th && th.classList.contains("flickity-enabled")) cut(Flickity.data(th));
    var all = $(".carousel__num-all");
    if (all && f.cells.length) all.textContent = f.cells.length;
    if (f.cells.length <= 1) { var nav = $(".carousel__nav--artdet-alt-images"); if (nav) nav.style.display = "none"; }
  }


  /* ========================= SZÁLLÍTÁSI DOBOZ + FELUGRÓ ABLAK (pilot) ========================= */
  function shipOn() {
    var l = CFG.ship && CFG.ship.pilot, S = TX.ship;
    if (!l || !l.length || !S) return false;
    return l.some(function (id) { return id === "*" ? /(^|\s)page_shop_artdet_/.test(h.className) : h.className.indexOf("page_shop_artdet_" + id) > -1; });
  }
  function moneyFmt(v) {
    if (SK) { var r = Math.round(v * 100) / 100; return (r % 1 ? r.toFixed(2).replace(".", ",") : String(r)) + " €"; }
    var t = String(Math.ceil(v)), o = "";
    while (t.length > 3) { o = " " + t.slice(-3) + o; t = t.slice(0, -3); }
    return t + o + " Ft";
  }
  function priceNum() {
    var p = $("#artdet__main-block .artdet__price-discount .price-gross-format") || $("#artdet__main-block .artdet__prices .price-gross-format");
    var t = p ? (p.textContent || "") : "";
    if (SK) { var f = parseFloat(t.replace(/[^\d,.]/g, "").replace(",", ".")); return isNaN(f) ? 0 : f; }
    var n = parseInt(t.replace(/[^\d]/g, ""), 10); return isNaN(n) ? 0 : n;
  }
  function shipCard() {
    var S = TX.ship, cart = d.getElementById("artdet__cart");
    if (!cart || !$(".artdet__cart-btn", cart)) return null;
    var e = mk("kbd4-ship"), p = priceNum(), lim = K.FREE_SHIP || 0, dv = $("#kbd-pdp-delivery b"), html = "";
    html += '<div class="k4-d">' + (dv ? esc(S.eta) + " <b>" + esc(txt(dv)) + "</b>" : "") + "</div>";
    if (p > 0 && lim) html += '<div class="k4-f">' + (p >= lim ? esc(S.free) : S.miss.replace("%X%", esc(moneyFmt(lim - p)))) + "</div>";
    html += '<div class="k4-c">' + esc(S.cod) + '</div><button type="button" class="k4-b" aria-haspopup="dialog"><span>' + esc(S.btn) + '</span><span aria-hidden="true">›</span></button>';
    setHtml(e, html);
    return e;
  }
  var PAYSVG = {
    cash: '<svg viewBox="0 0 40 26" aria-hidden="true"><rect x="8" y="6.5" width="24" height="13" rx="2" fill="none" stroke="#1f7a4d" stroke-width="1.6"/><circle cx="20" cy="13" r="3.2" fill="none" stroke="#1f7a4d" stroke-width="1.6"/><circle cx="12" cy="13" r="1" fill="#1f7a4d"/><circle cx="28" cy="13" r="1" fill="#1f7a4d"/></svg>',
    visa: '<svg viewBox="0 0 40 26" aria-hidden="true"><text x="20" y="17.5" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="13" font-weight="900" font-style="italic" fill="#1A1F71">VISA</text></svg>',
    mc: '<svg viewBox="0 0 40 26" aria-hidden="true"><circle cx="15" cy="13" r="7" fill="#EB001B"/><circle cx="25" cy="13" r="7" fill="#F79E1B"/><path d="M20 8.1A7 7 0 0 1 20 17.9A7 7 0 0 1 20 8.1z" fill="#FF5F00"/></svg>'
  };
  var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  function payChips() {
    var cod = (T1.payments || [])[2] || (SK ? "Dobierka" : "Utánvét");
    function chip(svg, label) { return '<span class="k4-chip" role="img" aria-label="' + esc(label) + '">' + svg + "</span>"; }
    return chip(PAYSVG.cash, cod) + chip(PAYSVG.visa, "VISA") + chip(PAYSVG.mc, "Mastercard");
  }
  /* SK: a pipás sor és a kártyák kizárólag a meglévő SK szövegekből (a v11 szótár és a lap szövegei) állnak össze */
  function skShip() {
    var tr = T1.trust || [];
    return {
      checks: [(T1.payments || [])[2] || "Dobierka", (tr[1] || {}).b || "", T1.delTrack || ""],
      cards: [["truck", "Doprava zadarmo nad 120 €", T1.cod || ""], ["shield", (tr[0] || {}).b || "", (tr[0] || {}).s || ""], ["swap", (tr[1] || {}).b || "", (tr[1] || {}).s || ""], ["chat", (tr[3] || {}).b || "", (tr[3] || {}).s || ""]]
    };
  }
  function checksRow() {
    var S = TX.ship, src = S.checks || skShip().checks;
    var e = mk("kbd4-checks");
    setHtml(e, src.filter(Boolean).map(function (x) { return "<span>" + CHECK + esc(x) + "</span>"; }).join(""));
    return e;
  }
  function cardsGrid() {
    var S = TX.ship, src = S.cards || skShip().cards;
    var e = mk("kbd4-cards");
    setHtml(e, src.filter(function (c) { return c[1]; }).map(function (c) { return '<div class="k4-card">' + ico(c[0]) + "<b>" + esc(c[1]) + "</b>" + (c[2] ? "<span>" + esc(c[2]) + "</span>" : "") + "</div>"; }).join(""));
    return e;
  }
  var lastFocus = null;
  function modalHtml() {
    var S = TX.ship;
    function li(r) { return '<div class="k4-li"><span>' + esc(r[0]) + (r[2] ? "<em>" + esc(r[2]) + "</em>" : "") + "</span><span>" + esc(r[1]) + "</span></div>"; }
    return '<div id="kbd4-mo"><h3 id="kbd4-h"><span>' + esc(S.title) + '</span><button type="button" class="k4-x" aria-label="' + esc(S.close) + '">✕</button></h3>' +
      '<div class="k4-free"><span>' + esc(S.banner[0]) + "</span><span>" + esc(S.banner[1]) + "</span></div>" +
      '<div class="k4-sec">' + esc(S.s1) + "</div>" + S.ship.map(li).join("") +
      '<div class="k4-sec">' + esc(S.s2) + "</div>" + S.pay.map(li).join("") +
      (S.warn ? '<div class="k4-warn">' + S.warn + "</div>" : "") +
      '<div class="k4-foot">' + S.foot.map(function (x) { return esc(x).replace("%PHONE%", '<a href="tel:' + CFG.phone.tel + '">' + esc(CFG.phone.label) + "</a>"); }).join("<br>") + "</div></div>";
  }
  function openShip() {
    var ov = d.getElementById("kbd4-ov");
    if (!ov) {
      ov = d.createElement("div"); ov.id = "kbd4-ov"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); ov.setAttribute("aria-labelledby", "kbd4-h");
      ov.innerHTML = modalHtml(); d.body.appendChild(ov);
    }
    lastFocus = d.activeElement; ov.classList.add("k4-on"); h.classList.add("kbd4-lock");
    var x = $(".k4-x", ov); if (x) x.focus();
  }
  function closeShip() {
    var ov = d.getElementById("kbd4-ov"); if (!ov) return;
    ov.classList.remove("k4-on"); h.classList.remove("kbd4-lock");
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
  }
  d.addEventListener("click", function (ev) {
    var t = ev.target;
    if (t.closest && t.closest("#kbd4-ship .k4-b")) { openShip(); return; }
    var ov = d.getElementById("kbd4-ov");
    if (ov && ov.classList.contains("k4-on") && (t === ov || (t.closest && t.closest("#kbd4-mo .k4-x")))) closeShip();
  });
  d.addEventListener("keydown", function (ev) { if ((ev.key === "Escape" || ev.keyCode === 27) && d.getElementById("kbd4-ov") && d.getElementById("kbd4-ov").classList.contains("k4-on")) closeShip(); });

  /* ========================= MODELL-SÁV ========================= */
  var FAMT = SK ? { all: "Zobraziť všetko", nav: "Model" } : { all: "Összes", nav: "Modell" };
  var famData, famReq = false;
  function famDone() { var F = window.KBD_FAM; if (!F) return; if (lpSet === undefined) return; /* az utolsó pár adata még úton (max. LP.wait): a kirajzolás vár */ F.done = true; if (F.release) F.release(); }
  function famKey() {
    var c = $('link[rel="canonical"]'), u = c && c.getAttribute("href"), m = u && u.match(/^https?:\/\/[^\/]+\/([^?#]+)/);
    return m ? m[1].replace(/\/$/, "") : "";
  }
  /* a "Összes" link: a legutolsó nem-főoldali, nem-termék breadcrumb (a modell családi kategóriája) */
  function famAllUrl() {
    /* 2026-10-25 (David TG 1874/1897): a family-level list when the strip data carries the Unas filter value id ("f": Modellcsalád filter 8908776); otherwise the category link below */
    if (famData && typeof famData.f === "number") return location.protocol + "//" + location.host + (SK ? "/vsetky-produkty" : "/osszes-termek") + "?filter=8908776:" + famData.f;
    var best = "";
    $$('script[type="application/ld+json"]').forEach(function (s) {
      try {
        var j = JSON.parse(s.textContent);
        (Array.isArray(j) ? j : [j]).forEach(function (o) {
          if (o && o["@type"] === "BreadcrumbList" && o.itemListElement) o.itemListElement.forEach(function (it) {
            var u = it && it.item ? (typeof it.item === "string" ? it.item : it.item["@id"]) : "";
            if (u && it.position > 1 && u.split("/").pop() !== famKey()) best = u;
          });
        });
      } catch (e) {}
    });
    return best;
  }
  function famImg(c) { return location.protocol + "//" + location.host + "/img/26121/" + c[1] + "/160x160/" + c[1] + ".webp"; }
  /* csak egesz kartya latszik: n = ami kifer, a kartyameret ugy igazodik (64-76 px), hogy n kartya + koz pontosan kitoltse a sort; ha nincs tobb kartya mint n, marad 64 px */
  function famLayout() {
    var r = $("#kbd5-fam .k5-r"); if (!r) return;
    var IW = r.clientWidth - 6, g = 8, cnt = r.children.length, n = Math.max(1, Math.floor((IW + g) / (64 + g)));
    var size = cnt <= n ? 64 : Math.floor((IW - g * (n - 1)) / n * 10) / 10;
    if (size < 64) size = 64;
    r.style.setProperty("--k5", size + "px");
    famState();
  }
  function famState() {
    var w = $("#kbd5-fam .k5-w"), r = w && $(".k5-r", w); if (!r) return;
    var max = r.scrollWidth - r.clientWidth;
    w.classList.toggle("k5-bk", r.scrollLeft > 2);
    w.classList.toggle("k5-fw", max > 2 && r.scrollLeft < max - 2);
  }
  function famRun(inner) {
    var F = window.KBD_FAM;
    if (!F || !F.on || F.done) return;
    if (d.getElementById("kbd5-fam")) { famDone(); return; }
    if (famData === undefined) {
      if (F.p && !famReq) { famReq = true; F.p.then(function (x) { famData = x || false; safe(); }); }
      return;
    }
    if (!famData || !famData.c || famData.c.length < (F.minCards || CFG.fam.minCards)) { famDone(); return; }
    var head = d.getElementById("kbd-pdp-head");
    if (!head) return;
    var all = famAllUrl(), e = d.createElement("div");
    e.id = "kbd5-fam";
    e.setAttribute("role", "navigation");
    e.setAttribute("aria-label", FAMT.nav + ": " + famData.m);
    var chev = function (dir) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + (dir ? "M9 5l7 7-7 7" : "M15 5l-7 7 7 7") + '"/></svg>'; };
    e.innerHTML = '<div class="k5-h"><span class="k5-m">' + esc(famData.m) + "</span>" + (all ? '<a class="k5-all" href="' + esc(all) + '">' + esc(FAMT.all) + "</a>" : "") + "</div>" +
      '<div class="k5-w"><div class="k5-r">' + famData.c.map(function (c, i) {
        var lab = String(c[2] || famData.m).slice(0, 60), im = '<img src="' + esc(famImg(c)) + '" width="64" height="64" alt="' + esc(lab) + '"' + (i > 5 ? ' loading="lazy"' : "") + ">";
        return i === 0 ? '<span class="k5-c k5-cur" aria-current="page" title="' + esc(lab) + '">' + im + "</span>" : '<a class="k5-c" href="/' + esc(c[0]) + '" title="' + esc(lab) + '">' + im + "</a>";
      }).join("") + '</div><button type="button" class="k5-a k5-prev" aria-label="' + esc(TX.upsell.prev) + '">' + chev(0) + '</button><button type="button" class="k5-a k5-next" aria-label="' + esc(TX.upsell.next) + '">' + chev(1) + "</button></div>";
    inner.appendChild(e);
    h.classList.add("kbd5");
    famLayout();
    var rw = e.querySelector(".k5-r");
    rw.addEventListener("scroll", famState, { passive: true });
    e.addEventListener("click", function (ev) {
      var b = ev.target.closest && ev.target.closest(".k5-a");
      if (!b) return;
      var st = parseFloat(rw.style.getPropertyValue("--k5")) || 64, step = Math.max(1, Math.floor((rw.clientWidth - 6 + 8) / (st + 8))) * (st + 8);
      rw.scrollBy({ left: b.classList.contains("k5-next") ? step : -step, behavior: "smooth" });
    });
    if (window.ResizeObserver) new ResizeObserver(famLayout).observe(e); else window.addEventListener("resize", famLayout);
    famDone();
  }

  /* ========================= UTOLSÓ PÁR ========================= */
  /* Óránként frissülő lista (scripts/pdp/last1_publish.py, Samu): azok az aktív lábbeli-sorok (Unas cikkszám), ahol az Unas készlete pontosan 1.
     Fájl: /shop_ordered/26121/pic/kbd/last1_<ÉÉÉÉHHNNÓÓ>.json (UTC óra) = {"v":1,"t":<epoch mp>,"n":<db>,"s":[cikkszám,...]}, ugyanazon a HU és SK domainen. Óránként új fájlnév, mert a bolt-domainek a régi nevű fájl régi másolatát órákig kiszolgálták.
     Sorrend: az (most - 53 perc) órájának fájlja (a job :50-kor fut, ~:52-re van fent), ha az nincs meg vagy régi: az előző óra, végül a régi fix nevű last1.json (átmeneti).
     Ha a fájl hiányzik, hibás, vagy 2 óránál régebbi, vagy a méret most nincs raktáron: NEM jelenik meg semmi (inkább hiányzó jelzés, mint téves "utolsó pár").
     A méretváltás új oldalbetöltés (a méretek linkek), ezért nincs dinamikus követés. A jobb oszlop kirajzolása legfeljebb LP.wait ms-ig vár az adatra (a modell-sáv várakozásával együtt). */
  var LP = { url: "/shop_ordered/26121/pic/kbd/last1.json", pre: "/shop_ordered/26121/pic/kbd/last1_", lag: 3180000, maxAge: 7200, wait: 900 };
  var lpSet, lpReq = false;   /* undefined = az adat úton van, false = nincs jelzés, objektum = a cikkszámok halmaza */
  function lpFail() { if (lpSet === undefined) { lpSet = false; safe(); } }
  function lpName(ms) {
    var t = new Date(ms), p = function (n) { return (n < 10 ? "0" : "") + n; };
    return LP.pre + t.getUTCFullYear() + p(t.getUTCMonth() + 1) + p(t.getUTCDate()) + p(t.getUTCHours()) + ".json";
  }
  function lpTry(urls, i) {
    if (lpSet !== undefined) return;
    if (i >= urls.length) { lpFail(); return; }
    try {
      window.fetch(urls[i], { credentials: "omit" }).then(function (r) {
        if (!r.ok) throw 0;
        var sd = Date.parse(r.headers.get("date") || "");
        return r.json().then(function (j) { return [j, isNaN(sd) ? Date.now() : sd]; });
      }).then(function (a) {
        var j = a[0], age = a[1] / 1000 - (j && j.t);
        if (!j || j.v !== 1 || typeof j.t !== "number" || !Array.isArray(j.s) || !j.s.length || !(age >= -600 && age <= LP.maxAge)) throw 0;
        var o = Object.create(null);
        j.s.forEach(function (k) { o[k] = 1; });
        if (lpSet === undefined) { lpSet = o; safe(); }
      }).catch(function () { lpTry(urls, i + 1); });
    } catch (e) { lpTry(urls, i + 1); }
  }
  function lpStart() {
    if (lpReq) return;
    lpReq = true;
    if (!window.fetch || !(TX && TX.last1)) { lpSet = false; return; }
    setTimeout(lpFail, LP.wait);
    var n = Date.now();
    lpTry([lpName(n - LP.lag), lpName(n - LP.lag - 3600000), LP.url + "?c=" + Math.floor(n / 300000)], 0);
  }
  function lpSku() {
    var e = $$(".artdet__sku-value"), i, t;
    for (i = 0; i < e.length; i++) { t = (e[i].textContent || "").replace(/\s+/g, ""); if (t) return t; }
    return "";
  }
  /* a saját stílus külön <style>: a head-tagbe beégetett v2 CSS (kbd-pdp-v2css) mellett a css() nem fut le, ezért ez nem függ tőle (így a head-tag újragenerálása nélkül is élesíthető) */
  function lpCss() {
    if (d.getElementById("kbd-last1-css")) return;
    var M = "html.kbd-pdp.kbd-v2 #artdet__main-block ", st = d.createElement("style");
    st.id = "kbd-last1-css";
    st.textContent = M + ".artdet__block-cart-inner>#kbd-last1{order:4}" +
      M + "#kbd-last1{display:flex;align-items:center;gap:7px;margin:-14px 0 0;font-size:14px;font-weight:700;line-height:1.3;color:var(--kbd-brown,#A3481F)}" +
      M + "#kbd-last1::before{content:'';flex:none;width:8px;height:8px;border-radius:50%;background:currentColor}";
    (d.head || h).appendChild(st);
  }
  function lastPair() {
    var sl = d.getElementById("kbd-stock-line"), cur = d.getElementById("kbd-last1"), st = sl && sl.querySelector(".artdet__stock");
    var sku = lpSet ? lpSku() : "";
    if (!(sl && st && st.classList.contains("on-stock") && sku && lpSet[sku] === 1)) { if (cur && cur.parentNode) cur.parentNode.removeChild(cur); return; }
    lpCss();
    if (!cur) { cur = d.createElement("div"); cur.id = "kbd-last1"; cur.textContent = TX.last1; }
    after(cur, sl);
  }

  function run() {
    var inner = $(SEL.inner);
    if (!inner) return;
    if (window.KBD2 && window.KBD2.coupon) window.KBD2.coupon();
    lastPair();
    famRun(inner);
    fixSticker();
    fixSizeBlock();
    fixBenefits();
    savingLine();
    trustTexts();
    reviewsWidget();
    var cart = d.getElementById("artdet__cart");
    var pay = payRow(); if (pay && !inner.contains(pay)) inner.appendChild(pay);
    var card = shipOn() ? shipCard() : null;
    if (card) {
      h.classList.add("kbd4");
      if (!inner.contains(card)) inner.appendChild(card);
      var gb = d.getElementById("kbd2-ship"); if (gb && gb.parentNode) gb.parentNode.removeChild(gb);
    } else {
      var ship = shipBox(); if (!inner.contains(ship)) inner.appendChild(ship);
    }
    if (shipOn()) {
      var chk = checksRow(); if (!inner.contains(chk)) inner.appendChild(chk);
      var crd = cardsGrid(); if (!inner.contains(crd)) inner.appendChild(crd);
    }
    var meta = metaRow(); if (meta && !inner.contains(meta)) inner.appendChild(meta);
    limitGallery();
  }
  function safe() { try { run(); } catch (e) { if (window.console) console.warn("[kbd-pdp2]", e); } }

  /* >>> kuponblokk + értesítő (korábban kbd-pdp2-coupon.js; beépítve, hogy a kbd-ready előtt jelenjen meg, nincs elrendezés-ugrás) */
  window.KBD2 = { CFG: CFG, TX: TX, SK: SK, T1: T1, esc: esc, txt: txt, $: $, $$: $$, ico: ico };
  if (CFG.coupon && CFG.coupon.enabled) {
/* KBD PDP: kuponblokk (ELES) + elfogyott-méret értesítő (CSAK a ?kbdnotify=1 süti-kapu mögött, küldés nélkül).
   Betölti a kbd-pdp2.js ugyanabból a könyvtárból (CFG.coupon.enabled). Dizájn: Vera (agents/vera/scripts/pdp_kupon_design.mjs), illesztés: Nora, szövegek: Zara (SK: lektorálásra vár).
   Kapcsolók: ?kbdcoupon=0 az adott böngészőben kikapcsolja a kuponblokkot (localStorage), ?kbdcoupon=1 visszakapcsolja; ?kbdnotify=1 / =0 az értesítő előnézetét ki-be (süti kbdnf, 30 nap).
   Az értesítő űrlapja SEHOVA nem küld (a beküldés háttere még nincs meg). */
(function () {
  "use strict";
  var d = document, h = d.documentElement, K2 = window.KBD2;
  if (!K2 || !K2.CFG) return;
  var SK = !!K2.SK, esc = K2.esc, $ = K2.$, $$ = K2.$$, txt = K2.txt;
  try { var qs = location.search.match(/[?&]kbdcoupon=([01])(?:&|$)/); if (qs) localStorage.setItem("kbdcoupon", qs[1]); if (localStorage.getItem("kbdcoupon") === "0") return; } catch (e) {}

  /* ---- kapu az értesítőhöz ---- */
  var NF = false;
  try {
    var m = location.search.match(/[?&]kbdnotify=([01])(?:&|$)/);
    if (m) d.cookie = m[1] === "0" ? "kbdnf=;path=/;max-age=0;SameSite=Lax" : "kbdnf=1;path=/;max-age=2592000;SameSite=Lax";
    NF = /(?:^|; )kbdnf=1(?:;|$)/.test(d.cookie);
  } catch (e) {}

  /* ---- szövegek ---- */
  var C = SK
    ? { code: "KBD10", type: "abs", val: 10, tag: "Kupón", save: "Zľava s kódom", amt: "10 €", withCode: "", codeLbl: "Kód", copy: "Kopírovať", copied: "Skopírované", how: "", info: "Nedá sa kombinovať s vernostnými bodmi ani s iným zľavovým kódom.", infoLabel: "Informácie o kupóne" }
    : { code: "KBD5", type: "pct", val: 5, tag: "Kupon", save: "Kedvezmény kóddal", amt: "5%", withCode: "", codeLbl: "Kód", copy: "Másolás", copied: "Kimásolva", how: "", info: "Pontokkal és más kuponkóddal nem vonható össze.", infoLabel: "Tudnivaló a kuponról" };
  var N = SK
    ? { tileA: "Je tvoja veľkosť vypredaná?", tileB: "Napíšeme ti, keď sa vráti", title: "Napíšeme ti, keď sa vráti", text: "Napíšeme ti len o veľkosti, newsletter neposielame.", pick: "Akú veľkosť potrebuješ?", email: "Tvoj e-mail", ph: "meno@priklad.sk",
        consent: "Súhlasím s upozornením e-mailom, súhlas môžem kedykoľvek odvolať.", priv: "Ochrana údajov", btn: "Chcem upozornenie",
        ok: "Hotovo. Keď sa tvoja veľkosť vráti, napíšeme ti.", errC: "Na upozornenie potrebujeme tvoj súhlas.", errE: "Toto nevyzerá ako e-mailová adresa.", errS: "Vyber aspoň jednu veľkosť.", close: "Zavrieť", dev: "Náhľad: nič sa neodosiela." }
    : { tileA: "Elfogyott a méreted?", tileB: "Írunk, ha visszajön", title: "Írunk, ha visszajön", text: "Csak a méretről írunk, hírlevelet nem küldünk.", pick: "Melyik méret kell?", email: "E-mail címed", ph: "nev@pelda.hu",
        consent: "Hozzájárulok az értesítő e-mailhez, bármikor visszavonhatom.", priv: "Adatkezelés", btn: "Kérem az értesítést",
        ok: "Megvan. Ha visszajön a méreted, írunk.", errC: "Ehhez be kell jelölnöd a hozzájárulást.", errE: "Ez nem tűnik e-mail címnek.", errS: "Válassz legalább egy méretet.", close: "Bezár", dev: "Előnézet: nem küld semmit." };

  /* Vera kompakt kupon modulja (agents/vera/scripts/pdp_kupon_design.mjs, KBDC_CSS), 2026-10-26 */
  var KBDC_CSS = "\n.kbdc,.kbdc *{box-sizing:border-box;font-family:Montserrat,Montserrat-fallback,sans-serif;text-transform:none}\n.kbdc{--r:7px;--page:#fff;position:relative;width:100%;margin:10px 0 14px;border-radius:6px;background:#F6F3ED;color:#171717;\n  box-shadow:inset 0 0 0 1px #E4DCCD}\n.kbdc-tag{position:absolute;left:0;top:0;padding:4px 8px 4px 9px;border-radius:6px 0 6px 0;background:#A3481F;color:#fff;font-size:9.5px;font-weight:800;line-height:1;letter-spacing:.14em;text-transform:uppercase!important}\n.kbdc-row{display:flex;align-items:baseline;justify-content:space-between;gap:10px;padding:24px 14px 10px}\n.kbdc-off{display:flex;align-items:baseline;gap:7px;min-width:0}\n.kbdc-off b{font-size:22px;font-weight:800;line-height:1;letter-spacing:-.4px;color:#A3481F;white-space:nowrap}\n.kbdc-off .kbdc-lbl{font-size:12.5px;font-weight:600;color:#3A3A36;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.kbdc-pr{flex:0 0 auto;font-size:12px;font-weight:600;color:#55554F;white-space:nowrap}\n.kbdc-ar{vertical-align:1px}\n.kbdc-pr b{margin-left:6px;font-size:17px;font-weight:800;letter-spacing:-.3px;color:#0E0E0E}\n.kbdc-perf{position:relative;height:0;margin:0 12px;border-top:1.5px dashed #CDBFA8}\n.kbdc-perf::before,.kbdc-perf::after{content:\"\";position:absolute;top:calc(-1 * var(--r));width:calc(2 * var(--r));height:calc(2 * var(--r));border-radius:50%;background:var(--page);box-shadow:inset 0 0 0 1px #E4DCCD}\n.kbdc-perf::before{left:calc(-12px - var(--r))}.kbdc-perf::after{right:calc(-12px - var(--r))}\n.kbdc-stub{display:flex;align-items:center;gap:8px;padding:9px 14px 10px}\n.kbdc-code{flex:1 1 auto;display:flex;align-items:center;justify-content:center;height:34px;padding:0 10px;border:1.5px dashed #A3481F;border-radius:5px;background:#fff;font-size:15px;font-weight:800;letter-spacing:.16em}\n.kbdc-cp{opacity:1!important;flex:0 0 auto;display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 12px;border:0;border-radius:4px;background:#171717;color:#fff;font-size:12px;font-weight:800;letter-spacing:.05em;text-transform:uppercase!important;cursor:pointer}\n.kbdc-cp.ok{background:#17714A}\n/* 34px visual, 46px tap target (Nora msg 1781: keep touch areas >= 44px) */\n.kbdc-cp,.kbdc-code{position:relative}.kbdc-cp::after{content:\"\";position:absolute;inset:-6px -4px}\n.kbdc-how{padding:0 14px 9px;margin-top:-3px;font-size:11px;color:#6A645A}\n/* (i) info: 16px icon, 32px hit area, tiny popover above it (Dávid TG 2129). Absolute, so the card does not grow.\n   Opens on hover and keyboard focus by CSS alone, and on tap via KBDC_JS (aria-expanded). */\n.kbdc-info{position:relative;flex:0 0 auto;align-self:center;display:inline-flex}\n.kbdc-i{opacity:1!important;flex:none;max-width:none;position:relative;display:inline-grid;place-items:center;width:18px;height:18px;margin:0 0 0 -2px;padding:0;border:0;border-radius:50%;background:none;color:#8A8276;cursor:pointer}\n.kbdc-i::after{content:\"\";position:absolute;inset:-13px}\n.kbdc-i:hover,.kbdc-i[aria-expanded=true]{color:#A3481F}\n.kbdc-i:focus-visible{outline:2px solid #171717;outline-offset:2px}\n.kbdc-pop{position:absolute;z-index:20;left:50%;bottom:calc(100% + 9px);width:max-content;max-width:min(232px,calc(100vw - 32px));transform:translateX(-50%);\n  padding:8px 11px;border-radius:5px;background:#171717;color:#fff;font-size:12px;font-weight:600;line-height:1.35;letter-spacing:.01em;text-align:left;white-space:normal;\n  box-shadow:0 6px 16px -6px rgba(0,0,0,.45);visibility:hidden;opacity:0;transition:opacity .12s,visibility .12s}\n.kbdc-pop::after{content:\"\";position:absolute;left:50%;top:100%;margin-left:-6px;border:6px solid transparent;border-top-color:#171717}\n.kbdc-i[aria-expanded=true]+.kbdc-pop{visibility:visible;opacity:1}\n@media (hover:hover){.kbdc-info:hover .kbdc-pop,.kbdc-i:focus-visible+.kbdc-pop{visibility:visible;opacity:1}}\n";
  /* Vera D Matricak (pdp_kupon_redesign2.mjs RD_CSS + KR2_SHARED), 2026-10-26 (David TG 2176) */
  var RD_CSS = "\n.krd,.krd *{box-sizing:border-box;font-family:Montserrat,Montserrat-fallback,sans-serif;text-transform:none}\n/* grid, not absolute: the price block and the lower label live in different rows, so they can never collide */\n.krd{position:relative;display:grid;grid-template-columns:auto minmax(0,1fr);grid-template-rows:minmax(50px,auto) 46px;column-gap:14px;margin:12px 0 16px;color:#171717;letter-spacing:0}\n.krd-t1{grid-area:1/1;align-self:end;display:flex;align-items:center;gap:9px;height:50px;padding:0 14px 0 12px;background:#171717;color:#fff}\n.krd-t1 small{display:flex;align-items:center;gap:6px;font-size:10px;font-weight:800;letter-spacing:.2em;text-transform:uppercase!important;color:#fff}\n.krd-t1 small::before{content:\"\";width:7px;height:7px;background:#A3481F}\n.krd-t1 b{font-size:36px;font-weight:900;line-height:1;letter-spacing:-1.4px;color:#fff;white-space:nowrap}\n.krd-t2{opacity:1!important;grid-area:2/1/3/3;justify-self:start;margin-left:28px;display:flex;align-items:stretch;height:46px;padding:0;border:1.5px solid #171717;border-top:0;border-radius:0;background:#fff;cursor:pointer}\n/* code in the shop's own Montserrat (no extra webfont): wide tracking gives the stamped-label look */\n.krd-t2 b{display:flex;align-items:center;padding:0 13px 0 14px;font-size:16px;font-weight:800;letter-spacing:.16em;color:#171717;white-space:nowrap}\n.krd-t2 span{display:flex;align-items:center;gap:7px;padding:0 13px;white-space:nowrap;background:#A3481F;color:#fff;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase!important}\n.krd-t2.ok span{background:#17714A}\n.krd-t2:focus-visible{outline:2px solid #A3481F;outline-offset:2px}\n.krd-r{grid-area:1/2;align-self:center;justify-self:end;min-width:0;display:flex;flex-direction:column;align-items:flex-end;gap:5px}\n/* wraps instead of colliding on screens narrower than 360px */\n.krd-l{display:flex;align-items:center;justify-content:flex-end;gap:5px;font-size:12px;font-weight:700;line-height:1.2;text-align:right}\n.krd-p{font-size:18px;font-weight:800;letter-spacing:-.3px;white-space:nowrap}\n";
  var KR2_SHARED = "\n.kr2-left .kbdc-pop{left:auto;right:-10px;transform:none}.kr2-left .kbdc-pop::after{left:auto;right:11px;margin-left:0}\n.kr2-sr{position:absolute!important;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}\n";
  var COPY_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>';
  var CHECK_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  var BELL_SVG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 21h4"/></svg>';
  var CHEV_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';

  /* ---- CSS (Vera modulja, a kbdv- előtagos osztályokkal; a rendezés a kbd-pdp2 order-rendszerébe illeszkedik) ---- */
  var M = "html.kbd-pdp.kbd-v2 #artdet__main-block .artdet__block-cart-inner>";
  var CSS = ".kbdv-tile,.kbdv-tile *,.kbdv-sh,.kbdv-sh *{box-sizing:border-box;font-family:Montserrat,Montserrat-fallback,sans-serif;text-transform:none}" +
    ".kbdv-tile,.kbdv-sh button{opacity:1!important;filter:none!important}" +
    M + "#kbd-coupon{order:3}" + M + "#kbd-notify-tile{order:6;margin:0}" +
    ".kbdv-tile{display:flex;align-items:center;gap:12px;width:100%;min-height:52px;margin:10px 0 2px;padding:8px 14px;border:1.5px dashed #BDB6A8;border-radius:5px;background:#fff;color:#171717;text-align:left;cursor:pointer}" +
    ".kbdv-tile .ic{flex:0 0 34px;height:34px;display:grid;place-items:center;border-radius:50%;background:#F6F3ED;color:#A3481F}.kbdv-tile .tx{flex:1 1 auto;display:flex;flex-direction:column;gap:3px}.kbdv-tile .tx b{font-size:14px;font-weight:800}.kbdv-tile .tx span{font-size:12.5px;color:#55554F}.kbdv-tile .ch{color:#171717}" +
    ".kbdv-ov{position:fixed;inset:0;z-index:99998;background:rgba(14,14,14,.48)}.kbdv-sh{position:fixed;z-index:99999;background:#fff;color:#171717}" +
    ".kbdv-sh.m{left:0;right:0;bottom:0;border-radius:14px 14px 0 0;padding:10px 16px calc(18px + env(safe-area-inset-bottom));max-height:90vh;overflow:auto}" +
    ".kbdv-sh.d{left:50%;top:50%;transform:translate(-50%,-50%);width:460px;max-height:92vh;overflow:auto;border-radius:8px;padding:26px 26px 24px}" +
    ".kbdv-sh .grab{width:40px;height:4px;margin:0 auto 14px;border-radius:2px;background:#D9D3C7}" +
    ".kbdv-sh .x{position:absolute;right:8px;top:8px;width:44px;height:44px;border:0;background:none;color:#171717;font-size:24px;line-height:44px;cursor:pointer}" +
    ".kbdv-sh h3{margin:0 40px 12px 0;font-size:19px;line-height:1.25;font-weight:800;letter-spacing:-.2px;text-transform:none}" +
    ".kbdv-sh .tx2{margin:0 0 12px;font-size:13px;line-height:1.45;color:#3A3A36}" +
    ".kbdv-sh .prod{display:flex;align-items:center;gap:12px;padding:10px;border-radius:8px;background:#F6F3ED}.kbdv-sh .prod img{width:58px;height:58px;object-fit:contain;border-radius:5px;background:#fff}" +
    ".kbdv-sh .prod .nm{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:13.5px;font-weight:700;line-height:1.3;color:#171717}.kbdv-sh .prod span.sz{display:block;font-size:12px;color:#55554F}" +
    ".kbdv-sh .lb{margin:16px 0 8px;font-size:13px;font-weight:700}.kbdv-sh .chips{display:flex;flex-wrap:wrap;gap:8px}" +
    ".kbdv-sh .chips button{min-width:52px;height:37px;padding:0 10px;display:inline-grid;place-items:center;border:1.5px dashed #BDB6A8;border-radius:5px;background:#fff;font-size:14px;font-weight:700;color:#55554F;cursor:pointer}.kbdv-sh .chips button.on{border:0;background:#A3481F;color:#fff}" +
    ".kbdv-sh input[type=email]{width:100%;height:50px;padding:0 14px;border:1.5px solid #CFC8BB;border-radius:5px;font-size:16px;color:#171717;background:#fff}.kbdv-sh input.bad{border-color:#B3261E}" +
    ".kbdv-sh .er{margin:6px 0 0;font-size:12.5px;font-weight:600;color:#B3261E}" +
    ".kbdv-sh label.c{display:flex;gap:10px;align-items:flex-start;margin:14px 0 4px;font-size:12px;line-height:1.4;color:#3A3A36;cursor:pointer}.kbdv-sh label.c input{flex:0 0 20px;width:20px;height:20px;margin:1px 0 0;accent-color:#171717}" +
    ".kbdv-sh label.c a.pl{color:#171717;font-weight:700;text-decoration:underline;white-space:nowrap}" +
    ".kbdv-sh .go{width:100%;height:56px;margin-top:14px;border:0;border-radius:4px;background:#A3481F;color:#fff;font-size:15px;font-weight:800;letter-spacing:.75px;text-transform:uppercase;cursor:pointer}" +
    ".kbdv-sh .note{margin:10px 0 0;text-align:center;font-size:12px;color:#55554F}" +
    ".kbdv-sh .okc{width:46px;height:46px;margin:4px 0 12px;display:grid;place-items:center;border-radius:50%;background:#17714A;color:#fff}.kbdv-sh .okc svg{width:24px;height:24px}.kbdv-sh p.ok{margin:0 0 6px;font-size:15px;line-height:1.45;font-weight:600}" +
    "html.kbdv-lock,html.kbdv-lock body{overflow:hidden!important}";
  function css() {
    if (d.getElementById("kbdv-css")) return;
    var s = d.createElement("style"); s.id = "kbdv-css"; s.textContent = KBDC_CSS + RD_CSS + KR2_SHARED + CSS; (d.head || h).appendChild(s);
  }

  /* ---- kuponblokk ---- */
  function priceBlock() { return $("#artdet__main-block .artdet__price-and-countdown"); }
  function isSale() { return !!$("#artdet__main-block .artdet__prices.has-price-sale") || !!$("#artdet__main-block .artdet__price-discount"); }
  function priceNow() {
    var p = $("#artdet__main-block .artdet__price-base-value .price-gross-format");
    var t = p ? (p.textContent || "") : "";
    if (SK) { var f = parseFloat(t.replace(/[^\d,.]/g, "").replace(",", ".")); return isNaN(f) ? 0 : f; }
    var n = parseInt(t.replace(/[^\d]/g, ""), 10); return isNaN(n) ? 0 : n;
  }
  function money(v) {
    if (SK) { var r = Math.round(v * 100) / 100; return (r % 1 ? r.toFixed(2).replace(".", ",") : String(r)) + " €"; }
    var t = String(Math.round(v)), o = "";
    while (t.length > 3) { o = " " + t.slice(-3) + o; t = t.slice(0, -3); }
    return t + o + " Ft";
  }
  function withCode(p) { return C.type === "pct" ? Math.round(p * (100 - C.val) / 100) : Math.round((p - C.val) * 100) / 100; }
  var INFO_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M12 11v6"/><circle cx="12" cy="7.6" r=".6" fill="currentColor"/></svg>';
  var ARROW = '<svg class="kbdc-ar" width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="#A3481F" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 6h13M9.5 1.5L14 6l-4.5 4.5"/></svg>';
  var OK_SVG = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  var COPY_ARROW = '<svg width="14" height="11" viewBox="0 0 16 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 6h13M9.5 1.5L14 6l-4.5 4.5"/></svg>';
  function couponHtml(calc, copied) {
    var info = C.info ? '<span class="kbdc-info kr2-left"><button type="button" class="kbdc-i" aria-label="' + esc(C.infoLabel) + '" aria-expanded="false" aria-controls="kbdc-pop-1" aria-describedby="kbdc-pop-1">' + INFO_SVG + '</button><span class="kbdc-pop" id="kbdc-pop-1" role="tooltip">' + esc(C.info) + '</span></span>' : "";
    return '<span class="krd-t1"><small>' + esc(C.tag) + '</small><b>\u2212' + esc(C.amt) + '</b></span>' +
      '<span class="krd-r"><span class="krd-l">' + esc(C.save) + info + '</span><span class="krd-p">' + esc(calc).replace(/ /g, "\u00a0") + '</span></span>' +
      '<button type="button" class="krd-t2' + (copied ? " ok" : "") + '" aria-label="' + esc((copied ? C.copied : C.copy) + ": " + C.code) + '"><b>' + esc(C.code) + '</b><span>' + (copied ? OK_SVG + esc(C.copied) : esc(C.copy) + COPY_ARROW) + '</span></button>';
  }
  /* (i) felugró: koppintásra nyit/zár, kívülre koppintva és Esc-re zár (Vera KBDC_JS) */
  d.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".kbdc-i");
    $$(".kbdc-i[aria-expanded=true]").forEach(function (x) { if (x !== b) x.setAttribute("aria-expanded", "false"); });
    if (b) b.setAttribute("aria-expanded", b.getAttribute("aria-expanded") === "true" ? "false" : "true");
  });
  d.addEventListener("keydown", function (e) { if (e.key === "Escape") $$(".kbdc-i[aria-expanded=true]").forEach(function (x) { x.setAttribute("aria-expanded", "false"); x.focus(); }); });
  var copiedUntil = 0;
  function coupon() {
    var inner = $("#artdet__main-block .artdet__block-cart-inner"), pb = priceBlock(), e = d.getElementById("kbd-coupon");
    var p = pb ? priceNow() : 0, ok = !!(inner && pb) && !isSale() && p > 0 && withCode(p) > 0;
    if (!ok) { if (e && e.parentNode) e.parentNode.removeChild(e); return; }
    css();
    if (!e) { e = d.createElement("div"); e.id = "kbd-coupon"; e.className = "krd"; }
    var html = couponHtml(money(withCode(p)), Date.now() < copiedUntil);
    if (e.getAttribute("data-k") !== html) { e.innerHTML = html; e.setAttribute("data-k", html); }
    if (e.previousElementSibling !== pb || e.parentNode !== pb.parentNode) pb.parentNode.insertBefore(e, pb.nextSibling);
  }
  d.addEventListener("click", function (ev) {
    var b = ev.target.closest && ev.target.closest("#kbd-coupon .krd-t2");
    if (!b) return;
    var done = function () { copiedUntil = Date.now() + 2200; coupon(); setTimeout(coupon, 2300); try { (window.dataLayer = window.dataLayer || []).push({ event: "kbd_coupon_copy", coupon_code: C.code }); } catch (e) {} };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(C.code).then(done, function () { fallbackCopy(); done(); });
    else { fallbackCopy(); done(); }
  });
  function fallbackCopy() {
    try { var t = d.createElement("textarea"); t.value = C.code; t.setAttribute("readonly", ""); t.style.cssText = "position:fixed;left:-9999px;top:0"; d.body.appendChild(t); t.select(); d.execCommand("copy"); d.body.removeChild(t); } catch (e) {}
  }

  /* ---- értesítő (csak NF) ---- */
  function oosSizes() {
    return $$("#artdet__type .product-type__value.kbd-oos").map(function (el) { return txt($(".product-type__option-name", el)); }).filter(Boolean);
  }
  function tile() {
    var inner = $("#artdet__main-block .artdet__block-cart-inner"), ty = d.getElementById("artdet__type"), e = d.getElementById("kbd-notify-tile");
    var ok = NF && inner && ty && oosSizes().length;
    if (!ok) { if (e && e.parentNode) e.parentNode.removeChild(e); return; }
    css();
    /* div role=button, nem <button>: a téma a gombokat halványítja, amíg a saját JS-e nem fut (Vera) */
    if (!e) { e = d.createElement("div"); e.id = "kbd-notify-tile"; e.className = "kbdv-tile"; e.setAttribute("role", "button"); e.tabIndex = 0; e.setAttribute("aria-haspopup", "dialog"); e.innerHTML = '<span class="ic">' + BELL_SVG + '</span><span class="tx"><b>' + esc(N.tileA) + '</b><span>' + esc(N.tileB) + '</span></span><span class="ch">' + CHEV_SVG + '</span>'; }
    if (e.previousElementSibling !== ty || e.parentNode !== ty.parentNode) ty.parentNode.insertBefore(e, ty.nextSibling);
  }
  var S = { sel: {}, state: "form", err: "", errC: false, errS: false, email: "", consent: false, last: null };
  function productInfo() {
    var im = $('meta[property="og:image"]'), nm = $("#kbd-pdp-head h1") || $("h1");
    return { img: im ? im.getAttribute("content") : "", name: nm ? txt(nm) : (d.title || "").split("|")[0].trim() };
  }
  function chosen() { return oosSizes().filter(function (z) { return S.sel[z]; }); }
  function sheetBody() {
    var sizes = oosSizes(), pi = productInfo(), cs = chosen(), x = '<button type="button" class="x" aria-label="' + esc(N.close) + '">\u00d7</button>';
    var mob = window.innerWidth < 768, head = (mob ? '<div class="grab"></div>' : "") + x;
    if (S.state === "ok") return head + '<div class="okc">' + CHECK_SVG + '</div><p class="ok">' + esc(N.ok) + '</p><p class="note">' + esc(N.dev) + '</p>';
    return head + '<h3 id="kbdv-h">' + esc(N.title) + '</h3><p class="tx2">' + esc(N.text) + '</p>' +
      '<div class="prod">' + (pi.img ? '<img src="' + esc(pi.img) + '" alt="">' : "") + '<div><span class="nm">' + esc(pi.name) + '</span><span class="sz">' + (cs.length ? "EU " + esc(cs.join(", ")) : "") + '</span></div></div>' +
      '<div class="lb">' + esc(N.pick) + '</div><div class="chips">' + sizes.map(function (z) { return '<button type="button" data-s="' + esc(z) + '" aria-pressed="' + (S.sel[z] ? "true" : "false") + '" class="' + (S.sel[z] ? "on" : "") + '">' + esc(z) + '</button>'; }).join("") + '</div>' + (S.errS ? '<div class="er" role="alert">' + esc(N.errS) + '</div>' : "") +
      '<div class="lb">' + esc(N.email) + '</div><input type="email" autocomplete="email" inputmode="email" placeholder="' + esc(N.ph) + '" value="' + esc(S.email) + '" class="' + (S.err ? "bad" : "") + '">' + (S.err ? '<div class="er" role="alert">' + esc(S.err) + '</div>' : "") +
      '<label class="c"><input type="checkbox"' + (S.consent ? " checked" : "") + '><span>' + esc(N.consent) + ' <a href="#" class="pl">' + esc(N.priv) + '</a></span></label>' + (S.errC ? '<div class="er" role="alert">' + esc(N.errC) + '</div>' : "") +
      '<button type="button" class="go">' + esc(N.btn) + '</button><p class="note">' + esc(N.dev) + '</p>';
  }
  function openSheet(size) {
    S.sel = {}; if (size) S.sel[size] = true; S.state = "form"; S.err = ""; S.errC = false; S.errS = false; S.last = d.activeElement; css();
    var ov = d.getElementById("kbdv-ov"), sh = d.getElementById("kbdv-sh");
    if (!ov) { ov = d.createElement("div"); ov.id = "kbdv-ov"; ov.className = "kbdv-ov"; d.body.appendChild(ov); }
    if (!sh) { sh = d.createElement("div"); sh.id = "kbdv-sh"; sh.setAttribute("role", "dialog"); sh.setAttribute("aria-modal", "true"); sh.setAttribute("aria-labelledby", "kbdv-h"); d.body.appendChild(sh); }
    sh.className = "kbdv-sh " + (window.innerWidth < 768 ? "m" : "d"); sh.innerHTML = sheetBody(); ov.style.display = ""; sh.style.display = "";
    h.classList.add("kbdv-lock"); var x = $(".x", sh); if (x) x.focus();
  }
  function closeSheet() {
    var ov = d.getElementById("kbdv-ov"), sh = d.getElementById("kbdv-sh");
    if (ov) ov.style.display = "none"; if (sh) sh.style.display = "none";
    h.classList.remove("kbdv-lock"); if (S.last && S.last.focus) { try { S.last.focus(); } catch (e) {} }
  }
  function rerender() { var sh = d.getElementById("kbdv-sh"); if (sh) { sh.innerHTML = sheetBody(); } }
  function sheetOpen() { var sh = d.getElementById("kbdv-sh"); return !!(sh && sh.style.display !== "none"); }
  d.addEventListener("click", function (ev) {
    if (!NF) return;
    var t = ev.target; if (!t || !t.closest) return;
    var oos = t.closest("#artdet__type .product-type__value.kbd-oos");
    if (oos) { ev.preventDefault(); ev.stopImmediatePropagation(); openSheet(txt($(".product-type__option-name", oos))); return; }
    if (t.closest("#kbd-notify-tile")) { ev.preventDefault(); openSheet(null); return; }
    if (!sheetOpen()) return;
    if (t.closest("#kbdv-sh a.pl")) { ev.preventDefault(); return; }       /* az adatkezelési link célja még nincs: {ADATVEDELMI_LINK} */
    if (t.id === "kbdv-ov" || t.closest("#kbdv-sh .x")) { closeSheet(); return; }
    var chip = t.closest("#kbdv-sh .chips button");
    if (chip) { saveFields(); var z = chip.getAttribute("data-s"); S.sel[z] = !S.sel[z]; S.errS = false; rerender(); return; }
    if (t.closest("#kbdv-sh .go")) {
      saveFields(); S.err = ""; S.errC = false; S.errS = !chosen().length;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(S.email.trim())) S.err = N.errE;
      if (!S.consent) S.errC = true;
      if (!S.err && !S.errC && !S.errS) S.state = "ok";
      rerender(); return;
    }
  }, true);
  function saveFields() { var sh = d.getElementById("kbdv-sh"); if (!sh) return; var i = $("input[type=email]", sh), c = $("input[type=checkbox]", sh); if (i) S.email = i.value; if (c) S.consent = c.checked; }
  d.addEventListener("keydown", function (ev) {
    if ((ev.key === "Escape" || ev.keyCode === 27) && sheetOpen()) closeSheet();
    var t = ev.target; if ((ev.key === "Enter" || ev.key === " ") && t && t.id === "kbd-notify-tile") { ev.preventDefault(); openSheet(null); }
  });

  /* ---- futtatás ---- */
  function run() { try { coupon(); tile(); } catch (e) { if (window.console) console.warn("[kbd-pdp2-coupon]", e); } }
  var pb0 = null, mo = null;
  function watch() {
    var pb = priceBlock(); if (!pb || pb === pb0 || !window.MutationObserver) return;
    pb0 = pb; if (mo) mo.disconnect(); var t = 0; mo = new MutationObserver(function () { clearTimeout(t); t = setTimeout(run, 120); }); mo.observe(pb, { childList: true, subtree: true, characterData: true, attributes: true });
  }
  function go() { run(); watch(); }
  K2.coupon = go;
  if (d.readyState !== "loading") go(); else d.addEventListener("DOMContentLoaded", go);
  window.addEventListener("load", function () { go(); setTimeout(go, 400); });
  if (window.jQuery) window.jQuery(d).on("ajaxComplete", function () { setTimeout(go, 60); });
  var n = 0, iv = setInterval(function () { go(); if (++n > 24) clearInterval(iv); }, 500);
  d.addEventListener("click", function (e) { if (e.target.closest && e.target.closest(".product-type__value--text")) { setTimeout(go, 400); setTimeout(go, 1200); } });
})();

  }
  /* <<< kuponblokk */

  lpStart();
  if (d.readyState !== "loading") safe(); else d.addEventListener("DOMContentLoaded", safe);
  if (d.readyState === "complete") setTimeout(safe, 300); else window.addEventListener("load", function () { safe(); setTimeout(safe, 400); });
  if (window.jQuery) window.jQuery(d).on("ajaxComplete", function () { setTimeout(safe, 50); });
  var n = 0, iv = setInterval(function () { safe(); if (++n > 20) clearInterval(iv); }, 500);
  d.addEventListener("click", function (e) { if (e.target.closest && e.target.closest(".product-type__value--text")) setTimeout(safe, 400); });

  /* a második fél (kbd-pdp2-body.js) ugyanabból a könyvtárból töltődik, ahonnan ez a fájl */
  if (CFG.body && CFG.body.enabled) {
    var cs = d.currentScript, src = (cs && cs.src) || "";
    if (/kbd-pdp2\.js/.test(src)) {
      var bs = d.createElement("script");
      bs.async = true; bs.src = src.replace(/kbd-pdp2\.js/, "kbd-pdp2-body.js");
      (d.head || h).appendChild(bs);
    }
  }
})();
