/* KicksByDavid home R2: "Shop the look" strip (STL). Loaded lazily by home.js (stlStart) only while stlOn(); the placeholder is
   <section class="khr-sec khr-stl" data-k="stl"> after the size tiles. Data: looks.json (Nora's rotation job, EUR per size) + img/<model>-540/-1080.webp
   from the data branch (home.js STL_DATA, hourly cache key); if that is empty or fails, the snapshot in this code branch (BASE + "stl/").
   Prices: EUR x UNAS.shop.currency_rate (HU: Ft, SK: EUR), never hardcoded. Stale data (generated older than 48 h) = no strip.
   Stock: the shop's own per-variant tooltip (shop_artdet.php?ajax_tooltip=1, the same source kbd-pdp.js uses for "elfogyott") is asked only on
   interaction: 1 request when a size is chosen, 2 on the button (cached 60 s); a size that sold out is disabled. The cart result is the final
   judge: add shoe first, then the apparel; both are claimed only when both succeeded (cart_success == 1 and qty_add >= 1).
   Fail-open: any error = the section stays empty (0 px), nothing else changes. Nora, 2026-11-20. Switch: home.js STL_ON / ?kbdstl=1|0. */
(function () {
  "use strict";
  if (window.KBD_STL_JS) return;
  window.KBD_STL_JS = 1;
  var C = window.KBD_STL || {};
  var SK = C.sk != null ? !!C.sk : /\.sk$/i.test(location.hostname);
  var SEC = C.sec || document.querySelector('#khr [data-k="stl"]');
  var SNAP = C.base ? C.base + "stl/" : "";          /* snapshot in the code branch */
  var DATA = C.data && C.data !== SNAP ? C.data : "";  /* data branch (may be empty) */
  var SRC = "";                                        /* the source that answered: images come from here */
  var THUMB = "248x248,r,";   /* the size variant the shop's own product cards use (img/<id>/<sku>/248x248,r,<ts>/<sku>.webp) */
  var LIST_ID = "kbd_look", MAX_AGE = 48 * 3600000, STK_TTL = 60000;
  var LANG = SK ? "sk" : "hu";

  /* ---------- texts (SK: the header + labels from the approved preview; the lines marked (SK?) still need proofreading) ---------- */
  var T = SK ? {
    h: "Kompletné outfity",
    p: "Jedny tenisky a jeden kúsok oblečenia, ktoré sme dali dokopy my. Vyber obe veľkosti a jedným tlačidlom vložíš oboje do košíka.",
    shoe: "Veľkosť topánok", wear: "Veľkosť oblečenia", btn: "Oboje do košíka", tot: "Spolu", hint: "Vyber veľkosť pre oba produkty",
    prev: "Predchádzajúce", next: "Ďalšie", from: function (s) { return "od " + s; },
    busy: "Vkladám do košíka…",                                                                             /* (SK?) */
    ok: "Oboje je v košíku.", cart: "Zobraziť košík",                                                        /* (SK?) */
    soldShoe: "Táto veľkosť tenisiek sa medzitým vypredala. Vyber inú.",                                     /* (SK?) */
    soldWear: "Táto veľkosť oblečenia sa medzitým vypredala. Vyber inú.",                                    /* (SK?) */
    fail1: "Tenisky sa nepodarilo vložiť do košíka (táto veľkosť sa vypredala). Oblečenie nebolo pridané.",  /* (SK?) */
    fail2: "Tenisky sú v košíku. Oblečenie v tejto veľkosti už nie je dostupné, vyber inú.",                 /* (SK?) */
    err1: "Tenisky sa nepodarilo vložiť do košíka. Skús to znova.",                                          /* (SK?) */
    err2: "Tenisky sú v košíku, oblečenie sa nepodarilo vložiť. Skús to znova.",                             /* (SK?) */
    alt: function (a, b) { return a + " + " + b; }
  } : {
    h: "Összeillő párok",
    p: "Egy cipő és egy ruhadarab, amit mi raktunk össze. Válaszd ki a két méretet, és egy gombbal mindkettő a kosárba kerül.",
    shoe: "Cipő mérete", wear: "Ruha mérete", btn: "Mindkettőt a kosárba", tot: "Együtt", hint: "Válassz méretet mindkét termékhez",
    prev: "Előző", next: "Következő", from: function (s) { return s + "-tól"; },
    busy: "Kosárba tesszük…",
    ok: "Mindkettő a kosárban van.", cart: "Kosár megtekintése",
    soldShoe: "Ez a cipőméret időközben elfogyott. Válassz másikat.",
    soldWear: "Ez a ruhaméret időközben elfogyott. Válassz másikat.",
    fail1: "A cipőt nem sikerült a kosárba tenni (ez a méret elfogyott). A ruha nem került a kosárba.",
    fail2: "A cipő a kosárban van. A ruha ebben a méretben már nem elérhető, válassz másikat.",
    err1: "A cipőt nem sikerült a kosárba tenni. Próbáld újra.",
    err2: "A cipő a kosárban van, a ruhát nem sikerült hozzáadni. Próbáld újra.",
    alt: function (a, b) { return a + " + " + b; }
  };

  var CHEV = {
    l: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg>',
    r: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>'
  };

  /* ---------- CSS: all under #khr .khr-stl (tokens and the header style of home.js) ---------- */
  var CSS = ""
    + "#khr .khr-stl{--stl-bg:#F6F3ED;letter-spacing:normal}"   /* the shop body letter-spacing leaks in otherwise (Nora, live mock) */
    + "#khr .khr-stl .khr-sh{align-items:flex-end}"
    + "#khr .khr-stl .khr-sh>div{min-width:0}"
    + "#khr .khr-stl .khr-stl-p{margin:8px 0 0;font-size:13px;line-height:1.45;font-weight:500;color:var(--soft);max-width:52ch}"
    + "#khr .khr-stl-track{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;margin:0 -16px;padding:4px 16px 8px;scroll-padding:0 16px;scrollbar-width:none;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain;scroll-behavior:smooth}"
    + "#khr .khr-stl-track::-webkit-scrollbar{display:none}"
    + "#khr .khr-stl-card{flex:0 0 86%;max-width:420px;scroll-snap-align:start;display:flex;flex-direction:column;background:#fff;border:1px solid var(--line);border-radius:18px;overflow:hidden;font-size:13px;line-height:1.3}"
    + "#khr .khr-stl-look{display:block;position:relative;aspect-ratio:4/5;overflow:hidden;background:var(--stl-bg)}"
    + "#khr .khr-stl-look>img{display:block;width:100%;height:100%;object-fit:cover;object-position:50% 50%}"
    + "#khr .khr-stl-two{position:absolute;inset:0;display:grid;grid-template-columns:1fr 1fr;gap:4px;align-items:center;padding:12px 6px}"
    + "#khr .khr-stl-two img{display:block;width:100%;height:auto;aspect-ratio:1;object-fit:contain;mix-blend-mode:multiply}"
    + "#khr .khr-stl-body{display:flex;flex-direction:column;gap:10px;flex:1;padding:12px 14px 14px}"
    + "#khr .khr-stl-it{display:grid;grid-template-columns:56px minmax(0,1fr) auto;gap:6px 10px;align-items:center}"
    + "#khr .khr-stl-it .th{display:block;width:56px;height:56px;border-radius:10px;background:var(--grey);object-fit:contain;mix-blend-mode:multiply}"
    + "#khr .khr-stl-it .nm{font-size:13px;font-weight:700;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}"
    + "#khr .khr-stl-it .pr{font-size:13px;font-weight:700;white-space:nowrap;text-align:right}"
    + "#khr .khr-stl-it .pr s{display:block;font-weight:500;color:var(--soft);font-size:11px}"
    + "#khr .khr-stl-it select{grid-column:1/-1;width:100%;height:44px;margin:0;border:1px solid var(--line);border-radius:12px;padding:0 36px 0 12px;font:500 14px/44px Montserrat,sans-serif;color:var(--ink);background:#fff;-webkit-appearance:none;appearance:none;"
    + "background-image:linear-gradient(45deg,transparent 50%,var(--ink) 50%),linear-gradient(135deg,var(--ink) 50%,transparent 50%);background-position:calc(100% - 18px) 19px,calc(100% - 13px) 19px;background-size:5px 5px;background-repeat:no-repeat;cursor:pointer}"
    + "#khr .khr-stl-it select.on{border-color:var(--ink)}"
    + "#khr .khr-stl-it select:focus-visible,#khr .khr-stl-btn:focus-visible,#khr .khr-stl-look:focus-visible,#khr .khr-stl-it a:focus-visible,#khr .khr-stl-msg a:focus-visible{outline:2px solid var(--rust);outline-offset:2px}"
    + "#khr .khr-stl-foot{margin-top:auto;display:flex;flex-direction:column;gap:8px;padding-top:4px;border-top:1px solid var(--line)}"
    + "#khr .khr-stl-tot{display:flex;justify-content:space-between;align-items:baseline;gap:8px;padding-top:10px;font-size:14px;font-weight:500}"
    + "#khr .khr-stl-tot b{font-size:18px;font-weight:800;white-space:nowrap}"
    + "#khr .khr-stl-btn{height:48px;border:0;border-radius:24px;background:var(--ink);color:#fff;font:700 14px Montserrat,sans-serif;letter-spacing:.02em;cursor:pointer;padding:0 12px}"
    + "#khr .khr-stl-btn:disabled{background:#BDB8AF;cursor:default}"
    + "#khr .khr-stl-btn.busy{background:#5E5A53}"
    + "#khr .khr-stl-msg{font-size:12px;line-height:1.4;font-weight:500;color:var(--soft);text-align:center;min-height:16px}"
    + "#khr .khr-stl-msg.ok{color:var(--ink);font-weight:700}#khr .khr-stl-msg.err{color:var(--rust);font-weight:700}"
    + "#khr .khr-stl-msg a{text-decoration:underline;font-weight:700}"
    + "#khr .khr-stl-box{position:relative}"
    + "#khr .khr-stl .khr-nav{top:36%}"
    + "@media (min-width:992px){"
    + "#khr .khr-stl .khr-stl-p{font-size:14px}"
    + "#khr .khr-stl-track{gap:16px;margin:0 -6px;padding:6px;scroll-padding:0 6px}"
    + "#khr .khr-stl-card{flex:0 0 calc((100% - 48px)/4);max-width:none}"
    + "}"
    + "@media (prefers-reduced-motion:reduce){#khr .khr-stl-track{scroll-behavior:auto}}";

  /* ---------- helpers ---------- */
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function short(n) { return String(n || "").replace(/\s*\((Women's|W)\)/g, "").replace(/\s+/g, " ").trim(); }
  function fail() { try { if (SEC && SEC.parentNode) SEC.innerHTML = ""; } catch (e) {} }
  function ga(name, params) { try { if (typeof window.gtag === "function") window.gtag("event", name, params); } catch (e) {} }

  /* currency from the shop's own page config (UNAS.shop): HU = Ft at currency_rate, SK = EUR at rate 1; anything else = no strip */
  var RATE = 0, CUR = "";
  function money() {
    var sh = window.UNAS && window.UNAS.shop; if (!sh) return false;
    var r = parseFloat(sh.currency_rate), code = String(sh.currency_code || "");
    if (!(r > 0)) return false;
    if (code === "HUF" && !SK) { RATE = r; CUR = "HUF"; return true; }
    if (code === "EUR" && SK && r === 1) { RATE = 1; CUR = "EUR"; return true; }
    return false;
  }
  function num(eur) { return CUR === "HUF" ? Math.round(eur * RATE) : Math.round(eur * 100) / 100; }
  function fmt(eur) {
    if (CUR === "HUF") { var t = String(num(eur)), o = ""; while (t.length > 3) { o = " " + t.slice(-3) + o; t = t.slice(0, -3); } return t + o + " Ft"; }
    var r = num(eur); return (r % 1 ? r.toFixed(2).replace(".", ",") : String(r)) + " €";
  }
  /* the shop's own small image variant for the thumbs, on the current domain (the data holds the HU full-size URL) */
  function thumb(u) {
    u = String(u || "");
    if (!/^https?:\/\/[^/]+\/img\/\d+\/[^/]+\/0x0,\d+\/[^/]+\.(jpe?g|png|webp)$/i.test(u)) return u;
    return u.replace(/^https?:\/\/[^/]+/, location.protocol + "//" + location.host).replace(/\/0x0,(\d+)\//, "/" + THUMB + "$1/").replace(/\.(jpe?g|png)$/i, ".webp");
  }
  function pick(it, v) {
    for (var i = 0; i < it.sizes.length; i++) if (it.sizes[i].v === v) return it.sizes[i];
    for (var j = 0; j < it.sizes.length; j++) if (it.sizes[j].eur === it.eur_min) return it.sizes[j];
    return it.sizes[0];
  }
  function priceHtml(it, z) {
    var sel = !!z, s = z || pick(it), old = s.eur_old != null && s.eur_old > s.eur ? "<s>" + esc(fmt(s.eur_old)) + "</s>" : "";
    var p = fmt(s.eur); if (!sel && it.eur_min !== it.eur_max) p = T.from(p);
    return old + esc(p);
  }
  function okItem(it) {
    return it && typeof it.sku === "string" && it.name && typeof it.path === "string" && /^\//.test(it.path) && it.img && it.sizes && it.sizes.length
      && it.sizes.every(function (z) { return z && typeof z.v === "string" && /^[\w.-]+$/.test(z.v) && z.l != null && z.eur > 0; }) && it.eur_min > 0 && it.eur_max >= it.eur_min;
  }
  function fresh(d) {
    var t = d && typeof d.generated === "string" ? Date.parse(d.generated.length === 19 ? d.generated + "Z" : d.generated) : NaN;   /* "YYYY-MM-DDTHH:MM:SS" (Bratislava wall clock) or ISO with zone */
    if (!(t > 0)) return false;
    var age = Date.now() - t;
    return age < MAX_AGE + 3 * 3600000 && age > -3 * 3600000;   /* 48 h + the 3 h the zone-less stamp can be off */
  }
  function gaItem(it, z, idx, setId) {
    var o = { item_id: z ? z.v : it.sku, item_name: short(it.name), price: num(z ? z.eur : it.eur_min), quantity: 1, index: idx, item_list_id: LIST_ID, item_list_name: "look_" + setId };
    if (z) o.item_variant = String(z.l);
    return o;
  }
  function cartHref() {
    var a = $('a[href*="shop_cart.php"]'); var h = a && a.getAttribute("href");
    return h || "/shop_cart.php";
  }
  /* live stock of one variant from the shop's own tooltip HTML (.artdet__stock on-stock / no-stock): 1 = in stock, 0 = sold out, null = unknown */
  var STK = {};
  function stock(v) {
    var c = STK[v]; if (c && Date.now() - c.t < STK_TTL) return Promise.resolve(c.s);
    if (!window.fetch || !window.DOMParser) return Promise.resolve(null);
    return fetch("/shop_artdet.php?ajax_tooltip=1&get_ajax=1&ajax_nodesign=1&cikk=" + encodeURIComponent(v) + "&change_lang=" + LANG, { credentials: "same-origin" })
      .then(function (r) { return r.ok ? r.text() : ""; })
      .then(function (html) {
        var st = html ? new DOMParser().parseFromString(html, "text/html").querySelector(".artdet__stock") : null, s = null;
        if (st && st.classList.contains("no-stock")) s = 0; else if (st && st.classList.contains("on-stock")) s = 1;
        if (s !== null) STK[v] = { t: Date.now(), s: s };
        return s;
      }).catch(function () { return null; });
  }
  /* the shop's own cart_add: async, resolves with the ajax_cart.php JSON; success = cart_success == 1 and (if given) qty_add >= 1 */
  function addOne(v) {
    return new Promise(function (res, rej) {
      var p; try { p = window.cart_add(String(v).replace(/-/g, "__unas__"), "", 1, 0); } catch (e) { return rej(e); }
      Promise.resolve(p).then(function (r) {
        var ok = r && (r.cart_success == 1) && (r.qty_add == null || r.qty_add === "" || Number(r.qty_add) >= 1);
        if (ok) res(r); else rej(r || new Error("cart"));
      }, rej);
    });
  }

  /* ---------- one card ---------- */
  function cardHtml(set, i) {
    var sh = set.shoe, we = set.wear, name = T.alt(short(sh.name), short(we.name));
    var look;
    if (set.model) {
      var m = SRC + "img/" + encodeURIComponent(set.model);
      look = '<img src="' + m + '-540.webp" srcset="' + m + '-540.webp 540w, ' + m + '-1080.webp 1080w" sizes="(min-width:992px) 298px, 86vw" width="1080" height="1350" loading="lazy" decoding="async" alt="' + esc(name) + '">';
    } else {
      look = '<span class="khr-stl-two"><img src="' + esc(thumb(sh.img)) + '" width="248" height="248" loading="lazy" decoding="async" alt="' + esc(short(sh.name)) + '"><img src="' + esc(thumb(we.img)) + '" width="248" height="248" loading="lazy" decoding="async" alt="' + esc(short(we.name)) + '"></span>';
    }
    function item(k, it, lab) {
      var opts = '<option value="">' + esc(lab) + "</option>";
      for (var j = 0; j < it.sizes.length; j++) opts += '<option value="' + esc(it.sizes[j].v) + '">' + (k === "shoe" ? "EU " : "") + esc(it.sizes[j].l) + "</option>";
      return '<div class="khr-stl-it" data-k="' + k + '"><a href="' + esc(it.path) + '" data-l="' + k + '" tabindex="-1" aria-hidden="true"><img class="th" src="' + esc(thumb(it.img)) + '" alt="" width="56" height="56" loading="lazy" decoding="async"></a>'
        + '<a class="nm" href="' + esc(it.path) + '" data-l="' + k + '">' + esc(short(it.name)) + '</a><div class="pr" data-p="' + k + '">' + priceHtml(it) + "</div>"
        + '<select data-s="' + k + '" aria-label="' + esc(lab + ": " + short(it.name)) + '">' + opts + "</select></div>";
    }
    return '<article class="khr-stl-card" data-set="' + esc(set.id) + '" data-i="' + i + '"><a class="khr-stl-look" href="' + esc(sh.path) + '" data-l="shoe">' + look + "</a>"
      + '<div class="khr-stl-body">' + item("shoe", sh, T.shoe) + item("wear", we, T.wear)
      + '<div class="khr-stl-foot"><div class="khr-stl-tot" aria-live="polite"><span>' + esc(T.tot) + '</span><b data-t>' + esc(totalText(set, null, null)) + "</b></div>"
      + '<button class="khr-stl-btn" type="button" disabled>' + esc(T.btn) + '</button><div class="khr-stl-msg" role="status" aria-live="polite">' + esc(T.hint) + "</div></div></div></article>";
  }
  function totalText(set, zs, zw) {
    var s = zs || pick(set.shoe), w = zw || pick(set.wear);
    var sum = CUR === "HUF" ? fmt((num(s.eur) + num(w.eur)) / RATE) : fmt(s.eur + w.eur);
    var open = (!zs && set.shoe.eur_min !== set.shoe.eur_max) || (!zw && set.wear.eur_min !== set.wear.eur_max);
    return open ? T.from(sum) : sum;
  }

  function wire(card, set) {
    var ss = $('select[data-s="shoe"]', card), sw = $('select[data-s="wear"]', card), btn = $(".khr-stl-btn", card), msg = $(".khr-stl-msg", card), tot = $("[data-t]", card);
    var ps = $('[data-p="shoe"]', card), pw = $('[data-p="wear"]', card), busy = false, seen = false, gen = 0;
    function zs() { return ss.value ? pick(set.shoe, ss.value) : null; }
    function zw() { return sw.value ? pick(set.wear, sw.value) : null; }
    function setMsg(cls, html) { msg.className = "khr-stl-msg" + (cls ? " " + cls : ""); msg.innerHTML = html; }
    function upd() {
      var a = zs(), b = zw();
      ps.innerHTML = priceHtml(set.shoe, a); pw.innerHTML = priceHtml(set.wear, b);
      tot.textContent = totalText(set, a, b);
      ss.classList.toggle("on", !!a); sw.classList.toggle("on", !!b);
      btn.disabled = busy || !(a && b);
      if (!busy && !/ok|err/.test(msg.className)) msg.textContent = a && b ? "" : T.hint;
    }
    /* a size that is sold out now: the option is disabled, the choice cleared, the visitor told */
    function soldOut(k, v) {
      var sel = k === "shoe" ? ss : sw, o = $('option[value="' + v.replace(/"/g, "") + '"]', sel);
      if (o) o.disabled = true;
      if (sel.value === v) sel.value = "";
      setMsg("err", esc(k === "shoe" ? T.soldShoe : T.soldWear));
      upd();
    }
    function selEv(k) {
      var it = k === "shoe" ? set.shoe : set.wear, z = k === "shoe" ? zs() : zw();
      ga("select_item", { item_list_id: LIST_ID, item_list_name: "look_" + set.id, items: [gaItem(it, z, k === "shoe" ? 0 : 1, set.id)] });
    }
    function onChange(k) {
      var sel = k === "shoe" ? ss : sw, v = sel.value, g = ++gen;
      setMsg("", ""); upd();
      if (!v) return;
      selEv(k);
      stock(v).then(function (s) { if (s === 0 && g === gen && !busy && sel.value === v) soldOut(k, v); });
    }
    ss.addEventListener("change", function () { onChange("shoe"); });
    sw.addEventListener("change", function () { onChange("wear"); });
    $$("a[data-l]", card).forEach(function (a) { a.addEventListener("click", function () { selEv(a.getAttribute("data-l")); }); });
    btn.addEventListener("click", function () {
      var a = zs(), b = zw(); if (busy || !a || !b || typeof window.cart_add !== "function") return;
      busy = true; gen++; btn.disabled = true; btn.classList.add("busy"); btn.textContent = T.busy; setMsg("", "");
      var ended = false, timer = setTimeout(function () { finish("err1"); }, 25000);
      function finish(code) {
        if (ended) return; ended = true; clearTimeout(timer);
        busy = false; btn.classList.remove("busy"); btn.textContent = T.btn;
        if (code === "ok") {
          setMsg("ok", esc(T.ok) + ' <a href="' + esc(cartHref()) + '">' + esc(T.cart) + "</a>");
          ga("add_to_cart", { currency: CUR, value: num(a.eur) + num(b.eur), items: [gaItem(set.shoe, a, 0, set.id), gaItem(set.wear, b, 1, set.id)] });
          upd();
        } else if (code === "soldShoe") soldOut("shoe", a.v);
        else if (code === "soldWear") soldOut("wear", b.v);
        else if (code === "fail1") { setMsg("err", esc(T.fail1)); soldOutKeep("shoe", a.v); }
        else if (code === "fail2") { setMsg("err", esc(T.fail2)); soldOutKeep("wear", b.v); }
        else { setMsg("err", esc(code === "err2" ? T.err2 : T.err1)); upd(); }
      }
      function soldOutKeep(k, v) { var sel = k === "shoe" ? ss : sw, o = $('option[value="' + v.replace(/"/g, "") + '"]', sel); if (o) o.disabled = true; if (sel.value === v) sel.value = ""; upd(); }
      /* 1) both chosen variants re-checked at the shop (2 small requests), 2) shoe, 3) apparel; the cart answer decides */
      Promise.all([stock(a.v), stock(b.v)]).then(function (st) {
        if (st[0] === 0) return finish("soldShoe");
        if (st[1] === 0) return finish("soldWear");
        return addOne(a.v).then(function () {
          return addOne(b.v).then(function () { finish("ok"); }, function (r) { finish(r && r.cart_success != null ? "fail2" : "err2"); });
        }, function (r) { finish(r && r.cart_success != null ? "fail1" : "err1"); });
      }).catch(function () { finish("err1"); });
    });
    /* impression: the card at least half visible, once */
    function imp() { if (seen) return; seen = true; ga("view_item_list", { item_list_id: LIST_ID, item_list_name: "look_" + set.id, items: [gaItem(set.shoe, null, 0, set.id), gaItem(set.wear, null, 1, set.id)] }); }
    if (window.IntersectionObserver) { var io = new IntersectionObserver(function (en) { for (var i = 0; i < en.length; i++) if (en[i].isIntersecting && en[i].intersectionRatio >= 0.5) { io.disconnect(); imp(); } }, { threshold: [0.5] }); io.observe(card); }
    upd();
  }

  function nav(box, track) {
    var p = document.createElement("button"), n = document.createElement("button");
    p.className = "khr-nav p"; n.className = "khr-nav n"; p.type = n.type = "button"; p.innerHTML = CHEV.l; n.innerHTML = CHEV.r;
    p.setAttribute("aria-label", T.prev); n.setAttribute("aria-label", T.next);
    function upd() { p.hidden = track.scrollLeft < 8; n.hidden = track.scrollLeft + track.clientWidth >= track.scrollWidth - 8; }
    function step() { var c = $(".khr-stl-card", track); return c ? c.getBoundingClientRect().width + 16 : 300; }
    p.addEventListener("click", function () { track.scrollBy({ left: -step(), behavior: "smooth" }); });
    n.addEventListener("click", function () { track.scrollBy({ left: step(), behavior: "smooth" }); });
    track.addEventListener("scroll", upd, { passive: true }); window.addEventListener("resize", upd);
    box.appendChild(p); box.appendChild(n); upd(); setTimeout(upd, 600);
  }

  /* ---------- build ---------- */
  function render(d) {
    if (!SEC || !SEC.parentNode) return;
    if (!d || d.currency !== "EUR" || !fresh(d)) return fail();
    var sets = (d.sets || []).filter(function (s) { return s && s.id != null && okItem(s.shoe) && okItem(s.wear) && (s.model == null || /^[\w.-]+$/.test(String(s.model))); });
    if (!sets.length) return fail();
    if (!document.getElementById("khr-stl-css")) { var st = document.createElement("style"); st.id = "khr-stl-css"; st.textContent = CSS; (document.head || document.documentElement).appendChild(st); }
    var h = '<div class="khr-sh"><div><h2>' + esc(T.h) + '</h2><p class="khr-stl-p">' + esc(T.p) + "</p></div></div>"
      + '<div class="khr-railbox khr-stl-box"><div class="khr-stl-track">';
    for (var i = 0; i < sets.length; i++) h += cardHtml(sets[i], i);
    SEC.innerHTML = h + "</div></div>";
    var cards = $$(".khr-stl-card", SEC);
    for (var j = 0; j < cards.length; j++) wire(cards[j], sets[j]);
    nav($(".khr-stl-box", SEC), $(".khr-stl-track", SEC));
  }
  function load(base, bust) {
    return fetch(base + "looks.json" + (bust ? "?v=" + Math.floor(Date.now() / 3600000) : "")).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (!d || !d.sets) throw new Error("data"); SRC = base; return d; });
  }
  function boot() {
    if (!SEC || !(DATA || SNAP) || !window.fetch || !window.Promise || typeof window.cart_add !== "function" || !money()) return fail();
    var p = DATA ? load(DATA, true) : Promise.reject(new Error("no data branch"));
    p.catch(function () { if (!SNAP) throw new Error("no snapshot"); return load(SNAP, false); })
      .then(function (d) { try { render(d); } catch (e) { fail(); } }).catch(fail);
  }
  try { boot(); } catch (e) { fail(); }
})();
