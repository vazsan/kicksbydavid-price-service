/* ============================================================================
   KicksByDavid – termékoldal v2 (HU + SK): a prototípus szerinti réteg a v11 (kbd-pdp.js) fölött.
   Csak akkor töltődik, ha a v11 betöltője bekapcsolta: ?kbdv2=1 (a böngésző megjegyzi), ?kbdv2=0 kikapcsolja.
   Minden beállítás és szelektor a CFG / SEL blokkban van. A szövegek nyelvi kulcsok alatt állnak:
   az SK oldal a v11 meglévő szlovák szövegeit használja, új szlovák szöveg itt nincs (lásd TXT.sk).
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
    phone: { tel: "+421910252548", label: "+421 910 252 548" },   /* minden nyelven ez a szám */
    cod: { hu: "1 100 Ft" },                        /* utánvét felára, HU; az SK érték a v11 szótárából jön */
    /* Trustindex: kis jelvény (a hero-ban) és nagy vélemény-widget (a lap alján, a 6. lépésben) */
    trustindex: {
      hu: { small: "0d3908782f85181dd586d19e174", big: "3ba033477a0d031a5f060029c5d" },
      sk: { small: "f2ddae483a2767044106f3718af", big: "3ba033477a0d031a5f060029c5d" }
    },
    reviewsAnchor: "#velemenyek",                   /* a jelvény erre görget, ha az oldalon van ilyen szekció */
    /* pipálós kiegészítő termék: az Unas „Kiegészítő termékek” listájából (termékenként az adminban állítható) */
    upsell: {
      enabled: true,                                /* be/ki */
      count: 4,                                     /* legfeljebb ennyi kiegészítő jelenik meg, jobbra-balra lapozható sorban */
      pick: "cheapest",                             /* "cheapest": a legolcsóbbak; "first": a lista sorrendje az Unasban */
      maxPrice: 0                                   /* 0: nincs felső határ; különben ennél drágább kiegészítőt nem ajánl */
    },
    /* a lap második fele (kbd-pdp2-body.js). Ahol az adat még hiányzik, az érintett szekció nem jelenik meg. */
    body: {
      enabled: true,                                /* be/ki */
      nativeTabs: "policy",                         /* az Unas lapfülei: "policy" (csak Szállítás és Eredetiség), "all" (mind), "none" (egyik sem) */
      similarMax: 4,                                /* a „Hasonló termékek” sorban legfeljebb ennyi termék */
      /* „Kinek és mihez ajánljuk?”: modellcsalád (kisbetűvel) -> szöveg. Egy szöveg a modellcsalád minden termékén megjelenik. */
      fit: {},
      /* hangulatfotó a leírásban: modellcsalád (kisbetűvel) -> kép URL-je */
      moodPhoto: {},
      /* eladó bemutatása: a szekció csak akkor jelenik meg, ha a bemutatkozás szövege ki van töltve */
      seller: { photo: "", text: "" },
      /* összehasonlító táblázat: a szekció csak akkor jelenik meg, ha minden versenytárs-cella ki van töltve.
         others: a négy sor (Ár, Eredetiség ellenőrzése, Csere és visszaküldés, Fizetés) sorrendjében [resell webshopok, nagy webshopok] */
      compare: { others: [] },
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
      saving: "akció kezdete: %D%, a készlet erejéig",
      cod: "Utánvét felára:",
      upsell: { add: "Add hozzá:", sub: "Egy pipával a kosárba kerül a cipővel együtt.", prev: "Előző", next: "Következő" },
      points: null, sku: null
    },
    /* Az SK szöveget anyanyelvi lektor írja. Ahol nincs kulcs, a szekció az SK oldalon a v11 szövegeivel marad. */
    sk: { benefits: null, sizeHint: null, saving: null, cod: null, upsell: null }
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
    var ord = ["#kbd-pdp-head", ".artdet__price-and-countdown", "#kbd-stock-line", "#kbd-size-head", "#artdet__type", "#kbd-size-help", "#kbd2-upsell", "#artdet__cart", "#kbd2-pay", "#kbd2-ship", "#kbd-pdp-trust", "#kbd2-meta"];
    ord.forEach(function (s, i) { r.push(M + ".artdet__block-cart-inner>" + s + "{order:" + (i + 1) + "}"); });
    /* a v11 elemei, amiket a prototípus szerinti sorok váltanak ki */
    r.push(M + "#kbd-pdp-delivery," + M + "#kbd-pdp-freeship," + M + "#kbd3-shipinfo," + M + "#kbd3-contact," + M + "#kbd3-pay," + M + "#kbd3-clar," + M + ".kbd-skuline," + M + ".artdet__virtual-point-highlighted," + M + ".kbd3-more," + M + ".kbd-skuhint," + M + ".artdet__price-base .info-icon," + M + ".artdet__prices .artdet__sale{display:none!important}");

    /* fejléc: márka, cím, alcím */
    r.push(M + "#kbd-pdp-head{padding-top:0}");
    r.push(M + ".kbd-eyebrow{font-size:13px;font-weight:700;letter-spacing:.1em;margin-bottom:22px}");
    r.push(M + ".kbd-title{font-size:34px;line-height:1.15;font-weight:800;letter-spacing:-.01em;margin:0}");
    r.push(M + ".kbd-sub{font-size:16px;color:var(--kbd-muted);margin:8px 0 22px}");
    r.push(MQ + M + ".kbd-eyebrow{font-size:12px;margin-bottom:18px}" + M + ".kbd-title{font-size:25px}" + M + ".kbd-sub{font-size:14px;margin:6px 0 18px}" + EQ);
    /* csillagozás */
    r.push(M + "#kbd-pdp-reviews{margin:0 0 22px;min-height:44px;align-items:center}");
    r.push(M + "#kbd-pdp-reviews .ti-header{font-size:14px;font-weight:600;min-height:44px;align-items:center}");
    r.push(MQ + M + "#kbd-pdp-reviews{margin-bottom:18px}" + EQ);
    /* három ígéret */
    r.push(M + ".kbd3-benefits{border:0;padding:0;margin:0;gap:10px}");
    r.push(M + ".kbd3-benefits li{font-size:15px;gap:12px;line-height:1.5}");
    r.push(M + ".kbd3-benefits li svg{width:20px;height:20px;stroke-width:2.2}");
    r.push(MQ + M + ".kbd3-benefits li{font-size:14px}" + M + ".kbd3-benefits li svg{width:18px;height:18px}" + EQ);

    /* ár és megtakarítás */
    r.push(M + ".artdet__price-and-countdown{margin:18px 0 0!important;padding-top:18px;border-top:1px solid var(--kbd-line);row-gap:0!important}");
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
    r.push(M + ".product-type__values--text{grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:8px!important}");
    r.push(M + ".product-type__value--text{height:50px!important;border-width:1.5px!important;border-radius:4px!important}");
    r.push(M + ".product-type__value--text:not(.kbd-oos):not(.is-active){border-color:var(--kbd-border)!important}");
    r.push(M + ".product-type__value--text:not(.kbd-oos):not(.is-active):hover{border-color:var(--kbd-ink)!important}");
    r.push(M + ".product-type__value--text .product-type__value-link{font-size:15px!important;font-weight:700!important}");
    r.push(M + ".product-type__value--text.is-active{border-color:var(--kbd-brown)!important}");
    r.push(M + "#kbd-size-help{margin:12px 0 0!important;font-size:13px;line-height:1.5;color:var(--kbd-muted)}");
    r.push(MQ + M + ".product-type__values--text{grid-template-columns:repeat(3,minmax(0,1fr))!important}" + M + "#kbd-size-help{font-size:12px}" + EQ);

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

    /* pipálós kiegészítő termék */
    r.push(M + "#kbd2-upsell{margin-top:18px}");
    r.push(M + "#kbd2-upsell .kbd2-up-h{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-bottom:10px}");
    r.push(M + "#kbd2-upsell .kbd2-up-h b{display:block;font-size:14px;font-weight:700}");
    r.push(M + "#kbd2-upsell .kbd2-up-h>div>span{display:block;font-size:13px;color:var(--kbd-muted);line-height:1.4}");
    r.push(M + "#kbd2-upsell .kbd2-up-nav{display:flex;gap:6px;flex:none}");
    r.push(M + "#kbd2-upsell .kbd2-up-nav button{width:36px;height:36px;border-radius:50%;border:1.5px solid var(--kbd-ink);background:#fff;color:var(--kbd-ink);display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0}");
    r.push(M + "#kbd2-upsell .kbd2-up-nav button[disabled]{opacity:.35;cursor:default}");
    r.push(M + "#kbd2-upsell .kbd2-up-row{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:2px}");
    r.push(M + "#kbd2-upsell .kbd2-up-row::-webkit-scrollbar{display:none}");
    r.push(M + "#kbd2-upsell .kbd2-up-c{flex:0 0 78%;scroll-snap-align:start;display:flex;align-items:center;gap:12px;padding:12px 14px;min-height:64px;border:1.5px solid var(--kbd-line);border-radius:6px;background:#fff;cursor:pointer;box-sizing:border-box}");
    r.push(M + "#kbd2-upsell.kbd2-one .kbd2-up-c{flex-basis:100%}");
    r.push(M + "#kbd2-upsell .kbd2-up-c.on{border-color:var(--kbd-ink);background:var(--kbd-cream)}");
    r.push(M + "#kbd2-upsell input{width:22px;height:22px;flex:none;margin:0;accent-color:var(--kbd-ink)}");
    r.push(M + "#kbd2-upsell .kbd2-up-img{width:56px;height:56px;flex:none;border-radius:4px;overflow:hidden;background:var(--kbd-cream)}");
    r.push(M + "#kbd2-upsell .kbd2-up-img img{width:100%;height:100%;object-fit:cover;display:block}");
    r.push(M + "#kbd2-upsell .kbd2-up-t{flex:1;min-width:0}");
    r.push(M + "#kbd2-upsell .kbd2-up-t b{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:13px;font-weight:700;line-height:1.35}");
    r.push(M + "#kbd2-upsell .kbd2-up-p{display:block;margin-top:2px;font-weight:800;font-size:13px;white-space:nowrap}");
    r.push("@media (min-width:768px){" + M + "#kbd2-upsell .kbd2-up-c{flex-basis:calc(50% - 5px)}" + M + "#kbd2-upsell.kbd2-one .kbd2-up-c{flex-basis:100%}" + M + "#kbd2-upsell .kbd2-up-t b{font-size:14px}" + EQ);
    r.push(MQ + M + "#kbd2-upsell .kbd2-up-nav{display:none}" + M + "#kbd2-upsell input{width:24px;height:24px}" + M + "#kbd2-upsell .kbd2-up-img{width:48px;height:48px}" + M + "#kbd2-upsell .kbd2-up-h>div>span{font-size:12px}" + EQ);

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
    var start = txt($(SEL.periodStart)).match(/\d{4}\.\s?\d{2}\.\s?\d{2}/), end = txt($(SEL.periodEnd));
    if (!start || !/készlet/i.test(end)) return;
    var parts = TX.saving.split("%D%");
    box.insertAdjacentHTML("beforeend", ' <span class="kbd2-period">· <span class="kbd2-d">' + esc(parts[0]) + esc(start[0]) + esc(parts[1].replace(/a készlet erejéig/, "")) + "</span>a készlet erejéig</span>");
  }

  function payRow() {
    var e = mk("kbd2-pay"), t = T1.payments || [];
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
    if (SK) return;
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


  /* ========================= PIPÁLÓS KIEGÉSZÍTŐ TERMÉK ========================= */
  var UP = { items: null, busy: false, bypass: false, built: false };
  /* a kártyakép lusta betöltésű: az Unas a betöltésig space.gif helyőrzőt tart az src-ben, ezért minden forrást végignézünk */
  function firstUrl(ss) { return ss ? String(ss).trim().split(/\s+/)[0] : ""; }
  function cardImage(card) {
    var img = $(".product__img", card), c = [];
    if (img) c.push(img.getAttribute("data-src"), img.currentSrc, img.getAttribute("src"), firstUrl(img.getAttribute("data-srcset")), firstUrl(img.getAttribute("srcset")));
    $$("picture source", card).forEach(function (so) { c.push(firstUrl(so.getAttribute("data-srcset")), firstUrl(so.getAttribute("srcset"))); });
    for (var i = 0; i < c.length; i++) if (c[i] && !/space\.gif/.test(c[i])) return c[i];
    return "";
  }
  function cardInfo(card) {
    var link = $(".product__name-link", card);
    var pr = $(".product__price-discount .price-gross-format", card) || $(".product__price-base .price-gross-format", card);
    var num = parseInt(txt(pr).replace(/[^\d]/g, ""), 10);
    var stock = $(".product__stock", card);
    return {
      sku: card.getAttribute("data-sku"), name: txt(link), price: txt(pr), value: isNaN(num) ? 0 : num,
      img: cardImage(card),
      inStock: !stock || !stock.classList.contains("no-stock")
    };
  }
  function pickUpsells() {
    var list = $$(SEL.addList).map(cardInfo).filter(function (c) {
      return c.sku && c.name && c.value > 0 && c.inStock && (!CFG.upsell.maxPrice || c.value <= CFG.upsell.maxPrice);
    });
    var seen = {};
    list = list.filter(function (c) { if (seen[c.sku]) return false; seen[c.sku] = 1; return true; });
    if (CFG.upsell.pick === "cheapest") list.sort(function (a, b) { return a.value - b.value; });
    return list.slice(0, CFG.upsell.count || 1);
  }
  var ARR_L = "M15 5l-7 7 7 7", ARR_R = "M9 5l7 7-7 7";
  function upsellBox() {
    if (!CFG.upsell.enabled || !TX.upsell || UP.built) return;
    var inner = $(SEL.inner);
    if (!inner || !window.cart_add) return;
    var items = pickUpsells();
    if (!items.length) return;
    UP.items = items; UP.built = true;
    var u = TX.upsell, e = d.createElement("div");
    e.id = "kbd2-upsell";
    if (items.length === 1) e.className = "kbd2-one";
    var nav = items.length > 2 ? '<span class="kbd2-up-nav"><button type="button" class="kbd2-prev" aria-label="' + esc(u.prev) + '">' + ico2(ARR_L) + '</button><button type="button" class="kbd2-next" aria-label="' + esc(u.next) + '">' + ico2(ARR_R) + "</button></span>" : "";
    e.innerHTML = '<div class="kbd2-up-h"><div><b>' + esc(u.add.replace(/:\s*$/, "")) + "</b><span>" + esc(u.sub) + "</span></div>" + nav + '</div><div class="kbd2-up-row">' +
      items.map(function (it, i) {
        return '<label class="kbd2-up-c"><input type="checkbox" data-i="' + i + '" aria-label="' + esc(u.add + " " + it.name) + '">' +
          (it.img ? '<span class="kbd2-up-img"><img src="' + esc(it.img) + '" alt="" width="56" height="56"></span>' : "") +
          '<span class="kbd2-up-t"><b>' + esc(it.name) + '</b><span class="kbd2-up-p">+' + esc(it.price) + "</span></span></label>";
      }).join("") + "</div>";
    inner.appendChild(e);
    $$(".kbd2-up-img img", e).forEach(function (im) { im.addEventListener("error", function () { im.parentNode.style.display = "none"; }); });
    e.addEventListener("change", function (ev) { var c = ev.target.closest && ev.target.closest(".kbd2-up-c"); if (c) c.classList.toggle("on", ev.target.checked); });
    var row = $(".kbd2-up-row", e), prev = $(".kbd2-prev", e), next = $(".kbd2-next", e);
    if (prev && next) {
      var step = function () { var c = $(".kbd2-up-c", row); return c ? c.getBoundingClientRect().width + 10 : 240; };
      var sync = function () { prev.disabled = row.scrollLeft < 4; next.disabled = row.scrollLeft + row.clientWidth >= row.scrollWidth - 4; };
      prev.addEventListener("click", function () { row.scrollBy({ left: -step(), behavior: "smooth" }); });
      next.addEventListener("click", function () { row.scrollBy({ left: step(), behavior: "smooth" }); });
      row.addEventListener("scroll", sync, { passive: true });
      sync();
    }
  }
  function ico2(path) { return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + path + '"/></svg>'; }

  /* A fő gomb(ok) kattintásakor, ha van bepipált kiegészítő: előbb az Unas saját cart_add függvényével egymás után a kiegészítők,
     utána az eredeti kattintás. */
  d.addEventListener("click", function (ev) {
    if (UP.bypass || !UP.items) return;
    var btn = ev.target.closest && ev.target.closest(SEL.cartBtns);
    var cbs = $$("#kbd2-upsell input:checked");
    if (!btn || !cbs.length || !window.cart_add) return;
    ev.preventDefault(); ev.stopImmediatePropagation();
    if (UP.busy) return;
    UP.busy = true;
    var done = false, picked = cbs.map(function (c) { return UP.items[parseInt(c.getAttribute("data-i"), 10)]; }).filter(Boolean);
    function go() {
      if (done) return; done = true;
      $$("#kbd2-upsell input").forEach(function (c) { c.checked = false; c.closest(".kbd2-up-c").classList.remove("on"); });
      UP.bypass = true;
      try { btn.click(); } finally { UP.bypass = false; UP.busy = false; }
    }
    setTimeout(go, 3000 + 2500 * picked.length);
    var chain = Promise.resolve();
    picked.forEach(function (it) {
      chain = chain.then(function () {
        try { return Promise.resolve(window.cart_add(it.sku.replace(/-/g, "__unas__"), "additional_", 1, 0)).catch(function () {}); } catch (e) { return null; }
      });
    });
    chain.then(go, go);
  }, true);

  function run() {
    var inner = $(SEL.inner);
    if (!inner) return;
    fixSticker();
    fixSizeBlock();
    fixBenefits();
    savingLine();
    trustTexts();
    reviewsWidget();
    var cart = d.getElementById("artdet__cart");
    var pay = payRow(); if (pay && pay.parentNode !== inner) inner.appendChild(pay);
    var ship = shipBox(); if (ship.parentNode !== inner) inner.appendChild(ship);
    var meta = metaRow(); if (meta && meta.parentNode !== inner) inner.appendChild(meta);
    limitGallery();
    upsellBox();
  }
  function safe() { try { run(); } catch (e) { if (window.console) console.warn("[kbd-pdp2]", e); } }

  if (d.readyState !== "loading") safe(); else d.addEventListener("DOMContentLoaded", safe);
  if (d.readyState === "complete") setTimeout(safe, 300); else window.addEventListener("load", function () { safe(); setTimeout(safe, 400); });
  if (window.jQuery) window.jQuery(d).on("ajaxComplete", function () { setTimeout(safe, 50); });
  var n = 0, iv = setInterval(function () { safe(); if (++n > 20) clearInterval(iv); }, 500);
  d.addEventListener("click", function (e) { if (e.target.closest && e.target.closest(".product-type__value--text")) setTimeout(safe, 400); });

  /* a második fél (kbd-pdp2-body.js) ugyanabból a könyvtárból töltődik, ahonnan ez a fájl */
  window.KBD2 = { CFG: CFG, TX: TX, SK: SK, T1: T1, esc: esc, txt: txt, $: $, $$: $$, ico: ico };
  if (CFG.body && CFG.body.enabled) {
    var cs = d.currentScript, src = (cs && cs.src) || "";
    if (/kbd-pdp2\.js/.test(src)) {
      var bs = d.createElement("script");
      bs.async = true; bs.src = src.replace(/kbd-pdp2\.js/, "kbd-pdp2-body.js");
      (d.head || h).appendChild(bs);
    }
  }
})();
