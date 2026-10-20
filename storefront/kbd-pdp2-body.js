/* ============================================================================
   KicksByDavid – termékoldal v2, második fél (kbd-pdp2-body.js). A kbd-pdp2.js tölti be.
   Szekciók: fekete sáv, leírás + Adatok, méretsegéd, vélemények, összehasonlítás, GYIK, eladó, hasonló termékek.
   A leírás, az Adatok és a GYIK a termék saját Unas-szövegeiből épül (#pane-details), a mérettáblázat az
   1. lapfül táblázatából. A beállítások a kbd-pdp2.js CFG.body blokkjában vannak. Ahol az adat hiányzik,
   az érintett szekció nem jelenik meg. A szlovák szövegek a TXT.sk blokkban vannak (gépi fordítás, anyanyelvi átnézés javasolt).
   ============================================================================ */
(function () {
  "use strict";
  var X = window.KBD2, d = document, h = d.documentElement;
  if (!X || window.__kbdBody2 || !h.classList.contains("kbd-v2")) return;
  window.__kbdBody2 = true;
  var CFG = X.CFG, B = CFG.body || {}, SK = X.SK, esc = X.esc, txt = X.txt, $ = X.$, $$ = X.$$;
  if (!B.enabled) return;

  /* ========================= SZÖVEGEK ========================= */
  var TXT = {
    hu: {
      diff: [
        { ic: "M3 12l9-9h8v8l-9 9z M16 8h.01", t: "Resell ár alatt", s: "A pár ellenőrzött európai nagykereskedelmi partnertől érkezik, új állapotban, eredeti dobozban. Ezért adhatjuk resell ár alatt." },
        { ic: "M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z M9 12l2 2 4-4", t: "Az eredetiség ellenőrizhető", s: "A gyári cikkszám ki van írva. Másold be a keresőbe, és nézd meg, ugyanez a modell jön-e vissza." },
        { ic: "M3 21V7l9-4 9 4v14z M9 21v-6h6v6", t: "A cég nevesítve van", s: "KICKSBYDAVID s.r.o., adószám 2121629928, kiírt cím, felvett telefon és e-mail. Az üzenetekre 1 munkanapon belül válaszolunk." },
        { ic: "M4 12a8 8 0 0 1 13.5-5.8L20 8 M20 4v4h-4 M20 12a8 8 0 0 1-13.5 5.8L4 16 M4 20v-4h4", t: "A kockázatot mi viseljük", s: "Utánvéttel fizethetsz, a csere és a visszaküldés pedig 30 napig a mi költségünk." }
      ],
      fitTitle: "Kinek és mihez ajánljuk?",
      sizeTitle: "Jó lesz a méreted?",
      sizeText: "A mérettáblázat a belső talphossz alapján segít választani. Ha mégsem talál, a csere és a visszaküldés 30 napon belül a mi költségünk. Írd meg, milyen cipőt hordasz, és megmondjuk a méreted.",
      sizeAsk: "Méretkérdésem van", sizeEu: "EU méret", sizeCm: "Belső talphossz (cm)",
      reviewsTitle: "Vásárlóink véleménye",
      compareTitle: "Miben más a KicksByDavid?", compareBrand: "KicksByDavid", compareCols: ["Resell webshopok", "Nagy webshopok"],
      compareRows: [
        ["Ár", "Resell ár alatt"],
        ["Eredetiség ellenőrzése", "Gyári cikkszám kiírva, cégadatok nyilvánosak"],
        ["Csere és visszaküldés", "A mi költségünk, 30 napig"],
        ["Fizetés", "Utánvéttel is, a pénz átvételig nálad marad"]
      ],
      faqTitle: "Gyakori kérdések", faqText: "Ami a vásárlás előtt eszedbe juthat. Ha mégsem találsz választ, 1 munkanapon belül válaszolunk.",
      sellerTitle: "Ki áll a bolt mögött?",
      sellerList: ["KICKSBYDAVID s.r.o., adószám 2121629928", "Ügyfélszolgálati válaszidő: 1 munkanap", "Minden rendelésről elektronikus számlát küldünk"],
      sellerCall: "Hívj minket:", sellerMail: "Írj nekünk", mail: "info@kicksbydavid.com"
    },
    /* Szlovák szövegek. Gépi fordítás a meglévő szlovák kifejezések (výmena, vrátenie, dobierka, kód výrobcu, DIČ) alapján; anyanyelvi átnézés javasolt. */
    sk: {
      diff: [
        { ic: "M3 12l9-9h8v8l-9 9z M16 8h.01", t: "Pod resellovou cenou", s: "Pár prichádza od overeného európskeho veľkoobchodného partnera, nový, v originálnej krabici. Preto ho môžeme predávať pod resellovou cenou." },
        { ic: "M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z M9 12l2 2 4-4", t: "Originalitu si môžeš overiť", s: "Kód výrobcu je uvedený. Vlož ho do vyhľadávača a over si, či ti vyhodí ten istý model." },
        { ic: "M3 21V7l9-4 9 4v14z M9 21v-6h6v6", t: "Firma vystupuje pod svojím menom", s: "KICKSBYDAVID s.r.o., DIČ 2121629928, uvedená adresa, telefón, ktorý niekto zdvihne, a e-mail. Na správy odpovedáme do 1 pracovného dňa." },
        { ic: "M4 12a8 8 0 0 1 13.5-5.8L20 8 M20 4v4h-4 M20 12a8 8 0 0 1-13.5 5.8L4 16 M4 20v-4h4", t: "Riziko nesieme my", s: "Môžeš platiť na dobierku, výmenu aj vrátenie do 30 dní platíme my." }
      ],
      fitTitle: "Komu a k čomu ich odporúčame?",
      sizeTitle: "Bude ti veľkosť sedieť?",
      sizeText: "Tabuľka veľkostí ti pomôže podľa vnútornej dĺžky chodidla. Ak veľkosť predsa nesedí, výmenu aj vrátenie do 30 dní platíme my. Napíš nám, aké topánky nosíš, a povieme ti tvoju veľkosť.",
      sizeAsk: "Mám otázku k veľkosti", sizeEu: "Veľkosť EU", sizeCm: "Vnútorná dĺžka chodidla (cm)",
      reviewsTitle: "Názory našich zákazníkov",
      compareTitle: "Čím sa líši KicksByDavid?", compareBrand: "KicksByDavid", compareCols: ["Resellové e-shopy", "Veľké e-shopy"],
      compareRows: [
        ["Cena", "Pod resellovou cenou"],
        ["Overenie originality", "Kód výrobcu je uvedený, údaje o firme sú verejné"],
        ["Výmena a vrátenie", "Platíme my, 30 dní"],
        ["Platba", "Aj na dobierku, peniaze máš u seba až do prevzatia"]
      ],
      faqTitle: "Časté otázky", faqText: "Čo ti môže pred nákupom napadnúť. Ak odpoveď nenájdeš, odpovieme ti do 1 pracovného dňa.",
      sellerTitle: "Kto stojí za obchodom?",
      sellerList: ["KICKSBYDAVID s.r.o., DIČ 2121629928", "Odpoveď zákazníckej podpory: do 1 pracovného dňa", "Ku každej objednávke posielame elektronickú faktúru"],
      sellerCall: "Zavolaj nám:", sellerMail: "Napíš nám", mail: "info@kicksbydavid.com"
    }
  };
  var TX = SK ? TXT.sk : TXT.hu;
  /* nyelvfüggő beállítások: sima érték (csak HU) vagy { hu: ..., sk: ... } */
  function L(v) { return v && typeof v === "object" && !Array.isArray(v) ? v[SK ? "sk" : "hu"] : (SK ? "" : v); }

  /* ========================= SEGÉD ========================= */
  function svg(path, size, stroke, w) {
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + stroke + '" stroke-width="' + (w || 1.8) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + path + '"/></svg>';
  }
  function el(tag, id, cls, html) {
    var e = d.createElement(tag);
    if (id) e.id = id; if (cls) e.className = cls; if (html != null) e.innerHTML = html;
    return e;
  }
  function wrap(inner) { return '<div class="kbd2-w">' + inner + "</div>"; }
  function num(s) { return parseFloat(String(s).replace(/½/g, ".5").replace(",", ".").replace(/[^\d.]/g, "")); }
  function fmt(n) { return String(n).replace(".", ","); }

  /* ========================= CSS ========================= */
  function css() {
    if (d.getElementById("kbd-pdp-v2body-css")) return;
    var S = "html.kbd-pdp.kbd-v2 #kbd2-body ", MQ = "@media (max-width:767.98px){", EQ = "}", r = [];
    r.push(S + "{font-family:Montserrat,Montserrat-fallback,sans-serif;color:var(--kbd-ink);background:#fff}");
    r.push(S + ".kbd2-w{max-width:1240px;margin:0 auto;padding:0 40px;box-sizing:border-box}");
    r.push(S + "h2{margin:0;font-size:30px;font-weight:800;letter-spacing:-.01em;line-height:1.2;color:var(--kbd-ink);text-transform:none}");
    r.push(S + "h3{margin:0;font-weight:800;color:var(--kbd-ink);text-transform:none}");
    r.push(S + "p{margin:0}");
    r.push(MQ + S + ".kbd2-w{padding:0 16px}" + S + "h2{font-size:24px}" + EQ);
    /* fekete sáv */
    r.push(S + ".kbd2-diff{background:#0E0E0E;color:#fff}");
    r.push(S + ".kbd2-diff .kbd2-w{padding-top:56px;padding-bottom:56px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:36px}");
    r.push(S + ".kbd2-diff h3{margin:14px 0 8px;font-size:18px;color:#fff}");
    r.push(S + ".kbd2-diff p{font-size:14px;line-height:1.6;color:#D6D6D0}");
    r.push(MQ + S + ".kbd2-diff .kbd2-w{grid-template-columns:1fr;gap:28px;padding-top:36px;padding-bottom:36px}" + S + ".kbd2-diff .kbd2-i{display:flex;gap:16px;align-items:flex-start}" + S + ".kbd2-diff .kbd2-i svg{flex:none;width:28px;height:28px}" + S + ".kbd2-diff h3{margin:0 0 6px;font-size:16px}" + S + ".kbd2-diff p{font-size:13.5px}" + EQ);
    /* leírás */
    r.push(S + ".kbd2-desc .kbd2-w{padding-top:72px;padding-bottom:72px;display:flex;flex-wrap:wrap;gap:64px}");
    r.push(S + ".kbd2-desc-main{flex:1 1 620px;min-width:0;display:flex;flex-direction:column;gap:20px}");
    r.push(S + ".kbd2-desc-main h3{margin-top:12px;font-size:20px}");
    r.push(S + ".kbd2-desc-main p{font-size:16px;line-height:1.7}");
    r.push(S + ".kbd2-desc-main p.kbd2-muted{color:var(--kbd-muted)}");
    r.push(S + ".kbd2-mood{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:6px;display:block;background:var(--kbd-cream)}");
    r.push(S + ".kbd2-specs{flex:1 1 360px;min-width:0;align-self:flex-start;border:1px solid var(--kbd-line);border-radius:6px;padding:28px}");
    r.push(S + ".kbd2-specs h3{margin:0 0 16px;font-size:18px}");
    r.push(S + ".kbd2-specs dl{margin:0;display:grid;grid-template-columns:auto 1fr;gap:12px 24px;font-size:14px}");
    r.push(S + ".kbd2-specs dt{color:var(--kbd-muted)}" + S + ".kbd2-specs dd{margin:0;font-weight:700;text-align:right}");
    r.push(MQ + S + ".kbd2-desc .kbd2-w{padding-top:44px;padding-bottom:44px;gap:16px}" + S + ".kbd2-desc-main{gap:16px}" + S + ".kbd2-desc-main h3{font-size:18px;margin-top:8px}" + S + ".kbd2-desc-main p{font-size:15px}" + S + ".kbd2-mood{aspect-ratio:4/3}" + S + ".kbd2-specs{padding:20px;margin-top:8px;flex-basis:100%}" + S + ".kbd2-specs h3{font-size:16px;margin-bottom:12px}" + S + ".kbd2-specs dl{font-size:13.5px;gap:10px 16px}" + EQ);
    /* méretsegéd */
    r.push(S + ".kbd2-size{background:var(--kbd-cream)}");
    r.push(S + ".kbd2-size .kbd2-w{padding-top:56px;padding-bottom:56px;display:flex;flex-wrap:wrap;gap:48px;align-items:center}");
    r.push(S + ".kbd2-size-l{flex:1 1 380px;min-width:0}");
    r.push(S + ".kbd2-size-l h2{margin-bottom:12px}" + S + ".kbd2-size-l p{font-size:16px;line-height:1.7;margin-bottom:20px}");
    r.push(S + ".kbd2-ask{display:inline-flex;align-items:center;justify-content:center;height:48px;padding:0 24px;border:1.5px solid var(--kbd-ink);border-radius:4px;background:#fff;color:var(--kbd-ink);font:700 14px/1 Montserrat,Montserrat-fallback,sans-serif;cursor:pointer;text-decoration:none}");
    r.push(S + ".kbd2-ask:hover{background:var(--kbd-ink);color:#fff}");
    r.push(S + ".kbd2-size-r{flex:1 1 560px;min-width:0;overflow-x:auto}");
    r.push(S + ".kbd2-size-r table{width:100%;border-collapse:collapse;font-size:14px;background:#fff;border-radius:6px}");
    r.push(S + ".kbd2-size-r th,.kbd2-size-r td{padding:12px 8px;text-align:center;border-bottom:1px solid var(--kbd-line)}");
    r.push(S + ".kbd2-size-r thead th{border-bottom:2px solid var(--kbd-ink);font-weight:800}");
    r.push(S + ".kbd2-size-r th[scope=row]{text-align:left;padding-left:14px;font-weight:600;color:var(--kbd-muted);white-space:nowrap}");
    r.push(S + ".kbd2-size-r td{color:var(--kbd-muted)}" + S + ".kbd2-size-r .kbd2-cur{background:var(--kbd-cream);color:var(--kbd-ink);font-weight:800}");
    r.push(MQ + S + ".kbd2-size .kbd2-w{padding-top:40px;padding-bottom:40px;gap:14px}" + S + ".kbd2-size-l p{font-size:14.5px;margin-bottom:14px}" + S + ".kbd2-ask{display:flex;height:52px;width:100%}" + S + ".kbd2-size-r table{min-width:520px;font-size:13px}" + EQ);
    /* vélemények */
    r.push(S + ".kbd2-rev .kbd2-w{padding-top:72px;padding-bottom:72px}");
    r.push(S + ".kbd2-rev h2{margin-bottom:28px}");
    r.push(S + ".kbd2-rev-widget{min-height:220px;max-width:100%;overflow:hidden}");   /* a Trustindex-csuszka vezerlosora (.ti-controls-line, 150 px) 430 px szelessegnel kilogott a 113 px-es tartalombol, az iOS Safari kiszelesitette az oldalt (msg 790) */
    r.push(S + ".kbd2-video{margin-top:28px;position:relative;aspect-ratio:16/9;border-radius:6px;overflow:hidden;background:var(--kbd-cream)}");
    r.push(S + ".kbd2-video iframe{position:absolute;inset:0;width:100%;height:100%;border:0}");
    r.push(MQ + S + ".kbd2-rev .kbd2-w{padding-top:44px;padding-bottom:44px}" + S + ".kbd2-rev h2{margin-bottom:16px}" + EQ);
    /* összehasonlítás */
    r.push(S + ".kbd2-cmp{background:var(--kbd-cream)}");
    r.push(S + ".kbd2-cmp .kbd2-w{padding-top:64px;padding-bottom:64px}");
    r.push(S + ".kbd2-cmp h2{margin-bottom:28px}");
    r.push(S + ".kbd2-cmp-t{overflow-x:auto}");
    r.push(S + ".kbd2-cmp table{width:100%;border-collapse:collapse;font-size:15px;background:#fff;min-width:720px}");
    r.push(S + ".kbd2-cmp th,.kbd2-cmp td{text-align:left;padding:16px 20px;border-bottom:1px solid var(--kbd-line)}");
    r.push(S + ".kbd2-cmp thead th{color:var(--kbd-muted);font-weight:700}");
    r.push(S + ".kbd2-cmp thead th.kbd2-us{background:#0E0E0E;color:#fff;font-weight:800}");
    r.push(S + ".kbd2-cmp td.kbd2-us{background:#F7F7F4;font-weight:600;color:var(--kbd-ink)}" + S + ".kbd2-cmp td{color:var(--kbd-muted)}" + S + ".kbd2-cmp tbody th{font-weight:700;color:var(--kbd-ink)}");
    r.push(MQ + S + ".kbd2-cmp .kbd2-w{padding-top:40px;padding-bottom:40px}" + S + ".kbd2-cmp h2{margin-bottom:14px}" + EQ);
    /* GYIK */
    r.push(S + ".kbd2-faq .kbd2-w{padding-top:72px;padding-bottom:72px;display:flex;flex-wrap:wrap;gap:56px}");
    r.push(S + ".kbd2-faq-l{flex:1 1 280px;min-width:0}" + S + ".kbd2-faq-l h2{margin-bottom:12px}" + S + ".kbd2-faq-l p{font-size:15px;line-height:1.7;color:var(--kbd-muted)}");
    r.push(S + ".kbd2-faq-r{flex:2 1 600px;min-width:0;border-top:1px solid var(--kbd-line)}");
    r.push(S + ".kbd2-fq{border-bottom:1px solid var(--kbd-line)}");
    r.push(S + ".kbd2-fq button{width:100%;min-height:64px;display:flex;align-items:center;justify-content:space-between;gap:16px;background:transparent;border:0;padding:12px 0;text-align:left;font:700 17px/1.35 Montserrat,Montserrat-fallback,sans-serif;color:var(--kbd-ink);cursor:pointer}");
    r.push(S + ".kbd2-fq svg{flex:none}" + S + ".kbd2-fq .kbd2-a{margin:0 0 20px;font-size:15px;line-height:1.7;color:var(--kbd-muted);max-width:680px}");
    r.push(MQ + S + ".kbd2-faq .kbd2-w{padding-top:44px;padding-bottom:44px;gap:8px}" + S + ".kbd2-faq-l h2{margin-bottom:8px}" + S + ".kbd2-faq-l p{display:none}" + S + ".kbd2-fq button{min-height:60px;font-size:15px}" + S + ".kbd2-fq .kbd2-a{font-size:14px;margin-bottom:18px}" + EQ);
    /* eladó */
    r.push(S + ".kbd2-sel{background:var(--kbd-cream)}");
    r.push(S + ".kbd2-sel .kbd2-w{padding-top:64px;padding-bottom:64px;display:flex;flex-wrap:wrap;gap:56px;align-items:center}");
    r.push(S + ".kbd2-sel-p{flex:0 1 380px;min-width:260px;aspect-ratio:4/5;border-radius:6px;object-fit:cover;width:100%;background:var(--kbd-line)}");
    r.push(S + ".kbd2-sel-t{flex:1 1 480px;min-width:0;display:flex;flex-direction:column;gap:18px}");
    r.push(S + ".kbd2-sel-t p{font-size:16px;line-height:1.7}");
    r.push(S + ".kbd2-sel-t ul{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:10px;font-size:15px}");
    r.push(S + ".kbd2-btns{display:flex;gap:12px;flex-wrap:wrap}");
    r.push(S + ".kbd2-btn{display:inline-flex;align-items:center;justify-content:center;height:52px;padding:0 28px;border-radius:4px;font:700 14px/1 Montserrat,Montserrat-fallback,sans-serif;text-decoration:none;border:1.5px solid var(--kbd-ink);background:#fff;color:var(--kbd-ink)}");
    r.push(S + ".kbd2-btn.kbd2-pri{background:var(--kbd-ink);color:#fff}");
    r.push(MQ + S + ".kbd2-sel .kbd2-w{padding-top:40px;padding-bottom:40px;gap:16px}" + S + ".kbd2-sel-p{aspect-ratio:4/3;flex-basis:100%}" + S + ".kbd2-sel-t p{font-size:15px}" + S + ".kbd2-sel-t ul{font-size:14px;gap:8px}" + S + ".kbd2-btns{flex-direction:column}" + S + ".kbd2-btn{width:100%;box-sizing:border-box}" + EQ);

    /* az Unas saját lapfülei: a duplikált Leírás és Adatok elrejtve */
    var N = "html.kbd-pdp.kbd-v2 ";
    r.push(N + ".kbd2-off{display:none!important}");
    r.push(N + ".artdet__sections{background:#fff}");
    /* Hasonló termékek: a gombok és a kártyák a prototípus szerint */
    r.push(N + "#artdet__similar-products,#artdet__additional-products{font-family:Montserrat,Montserrat-fallback,sans-serif}");
    r.push(N + "#artdet__additional-products .product__main-btn{border-radius:4px!important;height:46px;border:1.5px solid var(--kbd-ink)!important;background:#fff!important;color:var(--kbd-ink)!important;font-weight:700;box-shadow:none!important}");
    r.push(N + "#artdet__similar-products .product__name{font-size:15px;line-height:1.35;font-weight:700}");
    r.push(N + "#artdet__similar-products .product__price-base,#artdet__similar-products .product__price-discount{font-weight:800}");
    r.push(N + "#artdet__similar-products .product__main-btn{border-radius:4px!important;height:46px;border:1.5px solid var(--kbd-ink)!important;background:#fff!important;color:var(--kbd-ink)!important;font-weight:700;box-shadow:none!important}");
    r.push(N + "#artdet__similar-products .product__main-btn:hover{background:var(--kbd-ink)!important;color:#fff!important}");
    /* lebegő kosársáv */
    r.push(N + "#artdet__fixed-cart{box-shadow:0 -6px 20px rgba(14,14,14,.08)!important}");
    r.push(N + "#artdet__fixed-cart .fixed-cart__btn{min-height:50px}");
    r.push(N + "#artdet__fixed-cart .product-price--base{display:inline!important}");
    var st = d.createElement("style");
    st.id = "kbd-pdp-v2body-css";
    st.textContent = r.join("");
    (d.head || h).appendChild(st);
  }
  css();

  /* ========================= ADAT ========================= */
  function parseDetails() {
    var pane = $("#pane-details");
    if (!pane) return null;
    var secs = [], cur = null;
    $$("h2,h3,p,table", pane).forEach(function (n) {
      var t = n.tagName;
      if (t === "H2") { cur = { title: txt(n), p: [], faq: [], rows: [] }; secs.push(cur); return; }
      if (!cur) return;
      if (t === "H3") cur.faq.push({ q: txt(n), a: "" });
      else if (t === "P") { if (cur.faq.length) cur.faq[cur.faq.length - 1].a += (cur.faq[cur.faq.length - 1].a ? " " : "") + txt(n); else cur.p.push(txt(n)); }
      else if (t === "TABLE") $$("tr", n).forEach(function (tr) { var c = $$("td,th", tr); if (c.length >= 2) cur.rows.push([txt(c[0]), txt(c[1])]); });
    });
    var out = { desc: null, why: null, rows: null, rowsTitle: "", faq: null, faqTitle: "" };
    var text = [];
    secs.forEach(function (s) {
      if (s.rows.length) { out.rows = s.rows; out.rowsTitle = s.title; }
      else if (s.faq.length) { out.faq = s.faq; out.faqTitle = s.title; }
      else if (s.p.length) text.push(s);
    });
    out.desc = text[0] || null;
    out.why = text.filter(function (s) { return /miért|prečo|why/i.test(s.title); })[0] || null;
    return out;
  }
  function modelFamily(rows) {
    var m = "";
    (rows || []).forEach(function (r) { if (/^(modellcsalád|modelový rad)$/i.test(r[0])) m = r[1]; });
    return m.toLowerCase();
  }

  /* ========================= SZEKCIÓK ========================= */
  function secDiff() {
    if (!TX) return null;
    return el("section", "kbd2-diff", "kbd2-diff", wrap(TX.diff.map(function (x) {
      return '<div class="kbd2-i">' + svg(x.ic, 30, "#fff", 1.6) + "<div><h3>" + esc(x.t) + "</h3><p>" + esc(x.s) + "</p></div></div>";
    }).join("")));
  }

  var SPEC_KEYS = [/^(márka|značka)$/i, /^(modellcsalád|modelový rad)$/i, /^(gyári cikkszám|kód výrobcu)$/i, /^(szín|farba)$/i, /^(kinek|pre koho)$/i, /^(szárhossz|výška topánky)$/i];
  function secDesc(D) {
    if (!D || !D.desc) return null;
    var fam = modelFamily(D.rows), main = "<h2>" + esc(D.desc.title) + "</h2><p>" + esc(D.desc.p.join(" ")) + "</p>";
    if (B.moodPhoto && B.moodPhoto[fam]) main += '<img class="kbd2-mood" src="' + esc(B.moodPhoto[fam]) + '" alt="" loading="lazy">';
    var fit = B.fit ? L(B.fit[fam]) : ""; if (TX && fit) main += "<h3>" + esc(TX.fitTitle) + '</h3><p class="kbd2-muted">' + esc(fit) + "</p>";
    if (D.why) main += "<h3>" + esc(D.why.title) + "</h3><p>" + esc(D.why.p.join(" ")) + "</p>";
    var side = "";
    if (D.rows && D.rows.length) {
      var rows = D.rows.filter(function (r) { return SPEC_KEYS.some(function (k) { return k.test(r[0]); }); });
      if (rows.length < 3) rows = D.rows;
      side = '<aside class="kbd2-specs"><h3>' + esc(D.rowsTitle) + "</h3><dl>" + rows.map(function (r) { return "<dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd>"; }).join("") + "</dl></aside>";
    }
    return el("section", "kbd2-desc", "kbd2-desc", wrap('<div class="kbd2-desc-main">' + main + "</div>" + side));
  }

  /* méretsegéd: a mérettáblázatot az oldal saját HTML-jéből (1. lapfül) olvassuk, mert a mérettáblázat-script elviszi a DOM-ból */
  function pageSizes() {
    return $$("#artdet__type .product-type__value--text").map(function (v) {
      var n = $(".product-type__option-name", v), t = txt(n).replace(/^EU\s+/i, "");
      return { label: t, n: num(t), cur: v.classList.contains("is-active"), order: parseInt(v.style.order, 10) || 0 };
    }).filter(function (s) { return !isNaN(s.n); }).sort(function (a, b) { return a.order - b.order || a.n - b.n; });
  }
  function chartMap(html) {
    var doc = new DOMParser().parseFromString(html, "text/html"), t = doc.querySelector("#custom-section-1 table");
    if (!t) return null;
    var ths = $$("thead th", t).map(txt);
    if (!ths.length) ths = $$("tr:first-child th, tr:first-child td", t).map(txt);
    var iEu = -1, iCm = -1;
    ths.forEach(function (x, i) { if (/^eu$/i.test(x)) iEu = i; if (/^cm$/i.test(x)) iCm = i; });
    if (iEu < 0 || iCm < 0) return null;
    var map = {};
    $$("tbody tr", t).forEach(function (tr) {
      var c = $$("td", tr);
      if (c.length <= Math.max(iEu, iCm)) return;
      var eu = num(txt(c[iEu])), cm = num(txt(c[iCm]));
      if (!isNaN(eu) && !isNaN(cm)) map[eu] = cm;
    });
    return map;
  }
  function secSize(done) {
    if (!TX || !window.fetch || !window.DOMParser) return;
    var sizes = pageSizes();
    if (!sizes.length) return;
    fetch(location.origin + location.pathname, { credentials: "same-origin", cache: "force-cache" })
      .then(function (r) { if (!r.ok) throw 0; return r.text(); })
      .then(function (html) {
        var map = chartMap(html);
        if (!map) return;
        var have = sizes;
        if (sizes.filter(function (s) { return map[s.n] != null; }).length < 2) return;
        var head = "<tr><th scope=\"col\" style=\"text-align:left;padding-left:14px\">" + esc(TX.sizeEu) + "</th>" + have.map(function (s) { return '<th scope="col">' + esc(s.label) + "</th>"; }).join("") + "</tr>";
        var row = '<tr><th scope="row">' + esc(TX.sizeCm) + "</th>" + have.map(function (s) { return "<td" + (s.cur ? ' class="kbd2-cur"' : "") + ">" + (map[s.n] != null ? esc(fmt(map[s.n])) : "–") + "</td>"; }).join("") + "</tr>";
        var ask = el("button", "", "kbd2-ask", esc(TX.sizeAsk));
        ask.type = "button";
        ask.addEventListener("click", function () { var q = $("#page_artdet_func_question"); if (q) q.click(); else location.href = "mailto:" + TXT.hu.mail; });
        var sec = el("section", "merettablazat-v2", "kbd2-size", wrap('<div class="kbd2-size-l"><h2>' + esc(TX.sizeTitle) + "</h2><p>" + esc(TX.sizeText) + '</p></div><div class="kbd2-size-r"><table><thead>' + head + "</thead><tbody>" + row + "</tbody></table></div>"));
        $(".kbd2-size-l", sec).appendChild(ask);
        done(sec);
      })
      .catch(function () {});
  }

  function secReviews() {
    var id = CFG.trustindex[SK ? "sk" : "hu"].big;
    if (!id) return null;
    var sec = el("section", "velemenyek", "kbd2-rev", wrap((TX ? "<h2>" + esc(TX.reviewsTitle) + "</h2>" : "") + '<div class="kbd2-rev-widget"></div>'));
    var sc = d.createElement("script");
    sc.defer = true; sc.async = true; sc.src = "https://cdn.trustindex.io/loader.js?" + id;
    $(".kbd2-rev-widget", sec).appendChild(sc);
    if (B.videoReview) $(".kbd2-w", sec).insertAdjacentHTML("beforeend", '<div class="kbd2-video"><iframe src="' + esc(B.videoReview) + '" title="" loading="lazy" allow="encrypted-media; picture-in-picture" allowfullscreen></iframe></div>');
    return sec;
  }

  function secCompare() {
    var others = B.compare ? B.compare.others : null;
    if (others && !Array.isArray(others)) others = others[SK ? "sk" : "hu"];
    if (!TX || !others || others.length < TX.compareRows.length) return null;
    var ok = others.every(function (o) { return o && o.length >= 2 && o[0] && o[1]; });
    if (!ok) return null;
    var head = '<tr><th scope="col"></th><th scope="col" class="kbd2-us">' + esc(TX.compareBrand) + "</th>" + TX.compareCols.map(function (c) { return '<th scope="col">' + esc(c) + "</th>"; }).join("") + "</tr>";
    var rows = TX.compareRows.map(function (r, i) {
      var o = others[i];
      return '<tr><th scope="row">' + esc(r[0]) + '</th><td class="kbd2-us">' + esc(r[1]) + "</td><td>" + esc(o[0]) + "</td><td>" + esc(o[1]) + "</td></tr>";
    }).join("");
    return el("section", "kbd2-cmp", "kbd2-cmp", wrap("<h2>" + esc(TX.compareTitle) + '</h2><div class="kbd2-cmp-t"><table><thead>' + head + "</thead><tbody>" + rows + "</tbody></table></div>"));
  }

  var PLUS = "M12 5v14M5 12h14", MINUS = "M5 12h14";
  function secFaq(D) {
    if (!D || !D.faq || !D.faq.length) return null;
    var items = D.faq.map(function (f, i) {
      var open = i === 0;
      return '<div class="kbd2-fq"><button type="button" aria-expanded="' + open + '" aria-controls="kbd2-fa-' + i + '"><span>' + esc(f.q) + "</span>" + svg(open ? MINUS : PLUS, 22, "#0E0E0E", 2) + '</button><p class="kbd2-a" id="kbd2-fa-' + i + '"' + (open ? "" : " hidden") + ">" + esc(f.a) + "</p></div>";
    }).join("");
    var sec = el("section", "kbd2-faq", "kbd2-faq", wrap('<div class="kbd2-faq-l"><h2>' + esc(D.faqTitle) + "</h2>" + (TX ? "<p>" + esc(TX.faqText) + "</p>" : "") + '</div><div class="kbd2-faq-r">' + items + "</div>"));
    sec.addEventListener("click", function (ev) {
      var b = ev.target.closest && ev.target.closest(".kbd2-fq button");
      if (!b) return;
      var open = b.getAttribute("aria-expanded") === "true", p = d.getElementById(b.getAttribute("aria-controls"));
      b.setAttribute("aria-expanded", String(!open));
      if (p) p.hidden = open;
      var path = $("path", b); if (path) path.setAttribute("d", open ? PLUS : MINUS);
    });
    return sec;
  }

  function secSeller() {
    var sellerText = B.seller ? L(B.seller.text) : "";
    if (!TX || !sellerText) return null;
    return el("section", "kbd2-seller", "kbd2-sel", wrap(
      (B.seller.photo ? '<img class="kbd2-sel-p" src="' + esc(B.seller.photo) + '" alt="" loading="lazy">' : "") +
      '<div class="kbd2-sel-t"><h2>' + esc(TX.sellerTitle) + "</h2><p>" + esc(sellerText) + "</p><ul>" + TX.sellerList.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" +
      '<div class="kbd2-btns"><a class="kbd2-btn kbd2-pri" href="tel:' + CFG.phone.tel + '">' + esc(TX.sellerCall) + " " + esc(CFG.phone.label) + '</a><a class="kbd2-btn" href="mailto:' + TXT.hu.mail + '">' + esc(TX.sellerMail) + "</a></div></div>"));
  }

  /* ========================= ÖSSZEÁLLÍTÁS ========================= */
  var built = false;
  function nativeTabs() {
    if (B.nativeTabs === "all") return;
    var hide = B.nativeTabs === "none" ? ["details", "data", "custom-section-2", "custom-section-3"] : ["details", "data"];
    hide.forEach(function (k) {
      [d.getElementById("tab-" + k), d.getElementById("pane-header-" + k), d.getElementById("pane-" + k)].forEach(function (n) {
        if (!n) return;
        var li = n.tagName === "A" ? n.closest("li") : n;
        li.classList.add("kbd2-off");
      });
    });
    if (B.nativeTabs === "none") { var s = $(".artdet__sections"); if (s) s.classList.add("kbd2-off"); tabsOk = true; }
  }
  /* a rejtett Leírás helyett az első megmaradó lapfül legyen aktív; az Unas kezelője később kötődik, ezért addig próbáljuk */
  var tabsOk = false;
  function activateTab() {
    if (tabsOk || !built || B.nativeTabs === "all") return;
    var cur = d.getElementById("tab-details"), next = d.getElementById("tab-custom-section-2") || d.getElementById("tab-custom-section-3");
    if (!next) { tabsOk = true; return; }
    if (next.classList.contains("active")) { tabsOk = true; return; }
    if (cur && cur.classList.contains("kbd2-off") || (cur && cur.closest("li") && cur.closest("li").classList.contains("kbd2-off"))) next.click();
  }
  function build() {
    if (built) return;
    var anchor = $(".artdet__sections");
    var pane = $("#pane-details");
    if (!anchor || !pane) return;
    if (!pane.getAttribute("data-kbd-fix") && d.readyState !== "complete") return;
    built = true;
    var D = parseDetails(), box = el("div", "kbd2-body");
    anchor.parentNode.insertBefore(box, anchor);
    var order = [secDiff(), secDesc(D), null, secReviews(), secCompare(), secFaq(D), secSeller()];
    var slotSize = null;
    order.forEach(function (s, i) {
      if (i === 2) { slotSize = d.createComment("kbd2-size"); box.appendChild(slotSize); return; }
      if (s) box.appendChild(s);
    });
    secSize(function (sec) { slotSize.parentNode.insertBefore(sec, slotSize); });
    if (D && (D.desc || D.faq)) nativeTabs();
    limitSimilar();
  }

  /* Hasonló termékek: legfeljebb B.similarMax kártya (az Unas AJAX-szal tölti, ezért többször próbáljuk) */
  var simDone = false;
  function limitSimilar() {
    if (simDone || !window.Flickity) return;
    var list = $("#artdet__similar-products .carousel.flickity-enabled");
    if (!list) return;
    var f = Flickity.data(list);
    if (!f) return;
    simDone = true;
    var max = B.similarMax || 4;
    if (f.cells.length > max) f.remove(f.cells.slice(max).map(function (c) { return c.element; }));
    f.resize();
    var all = $("#artdet__similar-products .js-carousel-num-all");
    if (all) all.textContent = f.cells.length;
  }

  function safe() { try { build(); limitSimilar(); activateTab(); } catch (e) { if (window.console) console.warn("[kbd-pdp2-body]", e); } }
  if (d.readyState !== "loading") safe(); else d.addEventListener("DOMContentLoaded", safe);
  if (d.readyState === "complete") setTimeout(safe, 300); else window.addEventListener("load", function () { safe(); setTimeout(safe, 500); });
  var n = 0, iv = setInterval(function () { safe(); if (++n > 30) clearInterval(iv); }, 500);
  if (window.jQuery) window.jQuery(d).on("ajaxComplete", function () { setTimeout(safe, 50); });
})();
