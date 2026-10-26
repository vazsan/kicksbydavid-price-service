/* KBD PDP preview (Nora 2026-10-26 layout on the NATIVE Unas product page). Loaded only for browsers with the kbdpv cookie. No jQuery, no classic kbd-pdp scripts.
   It rewrites NOTHING in the cart logic: size values stay the native links, the Add-to-cart button stays the native one. All texts below: HU from Nora's mock; SK texts are marked PROOFREAD in PV_SK and wait for Zara + David. */
(function () {
  var d = document, h = d.documentElement; if (window.__kbdPvLoaded) return; window.__kbdPvLoaded = 1;
  h.classList.add("kbd-pv");
  var SK = /kicksbydavid\.sk$/i.test(location.hostname), $ = function (s, r) { return (r || d).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || d).querySelectorAll(s)); };
  /* Trustindex: ONE pair of ids per language (small rating badge + review carousel); the v11 bug put the HU id on both languages */
  var CFG = SK ? {
    top: "Doprava zadarmo od 120 € · Výmena zadarmo do 30 dní", free: 120, cur: "€", fmt: function (n) { return Math.round(n) + " €"; },
    ti: { small: "f2ddae483a2767044106f3718af", big: "6b883db76988873e850692b71b0" },
    deltaMiss: "Do dopravy zdarma chýba ešte <b>%X%</b>", deltaOk: "✓ Pri tomto páre je doprava zdarma",
    stockFallback: "Na sklade", deliv: "Doručenie: <b>3–5 pracovných dní</b>", cod: "Dobierka +3 € (len s DPD kuriérom)", track: "Sledovanie zásielky po odoslaní", pay: ["Visa", "Mastercard", "Dobierka"],
    tiles: [["100 % originál", "Dvojnásobok peňazí späť, ak je falošný"], ["Výmena zadarmo do 30 dní", "Výmenu aj vrátenie platíme my"], ["Dáme ti vedieť", "E-mailom ťa informujeme do odoslania"], ["Garancia veľkosti", "Napíš, aké nosíš, poradíme veľkosť"]],
    whyH: "Prečo KicksByDavid?", why: [["Overiteľná firma", "KICKSBYDAVID s.r.o., uvedená adresa, telefón aj e-mail. Na správy odpovedáme do 1 pracovného dňa."], ["Riziko berieme na seba", "Môžeš platiť na dobierku, výmenu aj vrátenie do 30 dní platíme my."], ["Jasný termín", "3–5 pracovných dní. O oneskorení ťa informujeme my."]],
    revH: "Názory našich zákazníkov", relH: "Odporúčame", seller: ["Predajca", "nezávislý predajca, nie sme oficiálnym partnerom značiek"],
    disc: "KicksByDavid je nezávislý predajca, nie sme oficiálnym partnerom značiek. Názvy značiek sú ochranné známky ich vlastníkov.",
    gender: /\s(?=pánske|dámske|detské|unisex)/i, brandKeys: /^(Značka)$/i, famKeys: /^(Rodina modelov|Modelový rad)$/i,
    omniWarn: "NÁHĽAD: chýba údaj o najnižšej cene za 30 dní", omni: "Najnižšia cena za posledných 30 dní: %P%"
  } : {
    top: "Ingyenes szállítás 46 250 Ft felett · 30 nap ingyenes csere", free: 46250, cur: "Ft", fmt: function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " Ft"; },
    ti: { small: "0d3908782f85181dd586d19e174", big: "3ba033477a0d031a5f060029c5d" },
    deltaMiss: "Még <b>%X%</b> hiányzik az ingyenes szállításhoz", deltaOk: "✓ Ehhez a párhoz ingyenes a szállítás",
    stockFallback: "Raktáron", deliv: "Szállítási idő: <b>5–10 munkanap</b>", cod: "Utánvéttel is fizethetsz (+1 100 Ft)", track: "Nyomkövetés + e-mail, ha feladtuk", pay: ["Visa", "Mastercard", "Utánvét"],
    tiles: [["100% eredeti", "Dupla pénz vissza, ha hamis"], ["30 nap ingyenes csere", "A cserét és a visszaküldést mi fizetjük"], ["Szólunk, hol tart", "E-mailben jelentkezünk a feladásig"], ["Méretgarancia", "Írd meg, mit hordasz, megmondjuk a méreted"]],
    whyH: "Miért a KicksByDavid?", why: [["Ellenőrizhető cég", "KICKSBYDAVID s.r.o., adószám 2121629928, kiírt cím, felvett telefon és e-mail. Az üzenetekre 1 munkanapon belül válaszolunk."], ["A kockázatot mi viseljük", "Utánvéttel fizethetsz, a csere és a visszaküldés pedig 30 napig a mi költségünk."], ["Egy kiírt szállítási idő", "5–10 munkanap. Csúszásról magunktól értesítünk, nem neked kell utánajárnod."]],
    revH: "Vásárlóink véleménye", relH: "Neked ajánljuk", seller: ["Eladó", "független viszonteladó, nem vagyunk a márkák hivatalos partnerei"],
    disc: "A KicksByDavid független viszonteladó, nem vagyunk a márkák hivatalos partnerei. A márkanevek a tulajdonosaik védjegyei.",
    gender: /\s(?=férfi|női|gyerek|uniszex|unisex)/i, brandKeys: /^(Márka)$/i, famKeys: /^(Modellcsalád)$/i,
    omniWarn: "ELŐNÉZET: hiányzik a 30 napos legalacsonyabb ár adata", omni: "Az elmúlt 30 nap legalacsonyabb ára: %P%"
  };
  function el(tag, cls, html) { var e = d.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function money(t) { var m = (t || "").replace(/ /g, " ").match(/\d[\d ]*(?:[.,]\d+)?/); return m ? parseFloat(m[0].replace(/ /g, "").replace(",", ".")) : 0; }
  function badge() { var b = el("div"); b.id = "kbd-pv-badge"; b.textContent = SK ? "NÁHĽAD" : "ELŐNÉZET"; d.body.appendChild(b); }
  function tiLoad(id, host) { var s = d.createElement("script"); s.async = true; s.src = "https://cdn.trustindex.io/loader.js?" + id; host.appendChild(s); }
  function idle(f, t) { if (window.requestIdleCallback) requestIdleCallback(f, { timeout: t || 4000 }); else setTimeout(f, 2500); }
  function build() {
    badge();
    if (!$("#ud_shop_artdet, .artdet")) return;                              // not a product page
    var hd = $("#header"); if (hd && !$(".pv-top")) hd.parentNode.insertBefore(el("div", "pv-top", CFG.top), hd);
    var inner = $(".artdet__block-cart-inner"), nameEl = $(".artdet__name");
    if (nameEl && inner && !$(".pv-head")) {
      var rows = {}; $$(".long-description__content table tr").forEach(function (tr) { var c = tr.children; if (c.length > 1) rows[(c[0].textContent || "").trim()] = (c[1].textContent || "").trim(); });
      var brand = "", fam = ""; Object.keys(rows).forEach(function (k) { if (CFG.brandKeys.test(k)) brand = rows[k]; if (CFG.famKeys.test(k)) fam = rows[k]; });
      var full = nameEl.textContent.trim(), parts = full.split(CFG.gender), sk = $(".artdet__sku-value"), hd2 = el("div", "pv-head");
      if (brand) hd2.appendChild(el("div", "pv-brand", (brand + (fam ? " · " + fam : "")).toUpperCase()));
      hd2.appendChild(el("div", "pv-name", parts[0]));
      if (parts.length > 1) hd2.appendChild(el("div", "pv-sub", parts.slice(1).join(" ").replace(/^./, function (c) { return c.toUpperCase(); })));
      if (sk) hd2.appendChild(el("div", "pv-sku", (SK ? "Kód: " : "Cikkszám: ") + sk.textContent.trim()));
      inner.insertBefore(hd2, inner.firstChild);
      // seller row in the native "Adatok" table
      var tb = $(".long-description__content table tbody") || $(".long-description__content table");
      if (tb && tb.lastElementChild) { var tr = tb.lastElementChild.cloneNode(true), tds = tr.children; if (tds.length > 1) { tds[0].textContent = CFG.seller[0]; tds[1].innerHTML = "<strong>" + CFG.seller[1] + "</strong>"; tb.appendChild(tr); } }
    }
    if (inner) {
      var pe = $(".artdet__prices .price-gross-format", inner) || $(".price-gross-format", inner), price = pe ? money(pe.textContent) : 0, sale = !!$(".artdet__prices.has-price-sale", inner);
      var rtg = el("div", "pv-rating"), hh = $(".pv-head", inner); inner.insertBefore(rtg, hh ? hh.nextSibling : inner.firstChild);
      var pb = $(".artdet__price-and-countdown", inner);
      if (price) { var dl = el("div", "pv-delta", price >= CFG.free ? CFG.deltaOk : CFG.deltaMiss.replace("%X%", CFG.fmt(CFG.free - price))); (pb || inner).insertAdjacentElement(pb ? "afterend" : "beforeend", dl); }
      if (sale) { var om = el("div", "pv-omni pv-warn", CFG.omniWarn); (pb || inner).insertAdjacentElement(pb ? "afterend" : "beforeend", om); }
      var st = $(".stock__text", inner), stock = st ? st.textContent.trim() : CFG.stockFallback;
      inner.appendChild(el("div", "pv-meta", "<div><span class=\"st\">✓ " + stock + "</span> · " + CFG.deliv + "</div><div>" + CFG.cod + "</div><div>" + CFG.track + "</div>"));
      inner.appendChild(el("div", "pv-pays", CFG.pay.map(function (x) { return "<i>" + x + "</i>"; }).join("")));
      inner.appendChild(el("div", "pv-tiles", CFG.tiles.map(function (t) { return "<div class=\"pv-tile\"><b>" + t[0] + "</b><span>" + t[1] + "</span></div>"; }).join("")));
    }
    // blocks below the native accordions: why us, reviews, related heading, reseller disclaimer
    var sim = $("#artdet__similar-products"), host = sim ? sim.parentNode : $(".artdet__sections") || $("main");
    var why = el("section", "pv-blk", "<h2>" + CFG.whyH + "</h2><div class=\"pv-whys\">" + CFG.why.map(function (w) { return "<div class=\"pv-why\"><b>" + w[0] + "</b><p>" + w[1] + "</p></div>"; }).join("") + "</div>");
    var rev = el("section", "pv-blk", "<h2>" + CFG.revH + "</h2><div id=\"kbd-pdp-reviews\"></div>");
    if (host) { host.insertBefore(why, sim || null); host.insertBefore(rev, sim || null); }
    var mn = $("main") || d.body; mn.appendChild(el("p", "pv-disc", CFG.disc));
    // Trustindex only after the first paint: small badge at idle, review carousel when it scrolls near
    var rt = $(".pv-rating");
    idle(function () { if (rt) tiLoad(CFG.ti.small, rt); }, 5000);
    var rc = $("#kbd-pdp-reviews");
    if (rc && "IntersectionObserver" in window) { var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); tiLoad(CFG.ti.big, rc); } }, { rootMargin: "700px" }); io.observe(rc); } else if (rc) idle(function () { tiLoad(CFG.ti.big, rc); }, 6000);
  }
  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", build); else build();
})();
