/* KicksByDavid kezdőlap v1 – infosáv, hero (szlogen + Férfi/Női gomb), előnysáv, tömör kategóriák,
   termékfülek (Akciós / Legnépszerűbb / Újdonságok). HU + SK, domain alapján.
   Az infosáv és a menüjavítás minden oldalon fut, ahol a betöltő van; a többi csak a kezdőlapon (body#ud_shop_start).
   Kikapcsolás teszteléshez: ?kbdoff=1 */
(function () {
  "use strict";
  if (window.KBD_HOME) return;
  window.KBD_HOME = 1;
  if (/[?&]kbdoff=1/.test(location.search)) return;

  var SK = /\.sk$/i.test(location.hostname);

  /* ---------- 0) szövegek ---------- */
  var T = SK ? {
    bar: ["Doprava zdarma nad 120 €", "Platba aj na dobierku", "Z mnohých modelov máme len 1–2 páry"],
    phone: "+421 910 252 548",
    ey: "Originálne tenisky z európskych skladov",
    h1: "Originálne tenisky za výhodnejšie ceny",
    p: "Nedržíme veľké zásoby, preto v cene nie sú náklady na skladovanie. Dvojnásobok peňazí späť, ak je falzifikát. Môžeš platiť aj na dobierku.",
    men: "Pánske tenisky", women: "Dámske tenisky", sale: "Zľavy",
    menUrl: "/Panske", womenUrl: "/Damske", saleUrl: "/akcie", newUrl: "/novinky", allUrl: "/vsetky-produkty",
    usp: [
      ["shield", "Dvojnásobok peňazí späť, ak je falzifikát", "Nové originálne produkty z overených zdrojov"],
      ["swap", "Výmena a vrátenie zdarma", "Do 30 dní, poštovné platíme my"],
      ["cash", "Dobierka", "Peniaze ostávajú u teba, kým nepríde balík"],
      ["truck", "Dáme ti vedieť, kde je balík", "Informujeme ťa až do odoslania"]
    ],
    tSale: "Zľavy", tTop: "Najobľúbenejšie", tNew: "Novinky", all: "Zobraziť všetko",
    prev: "Predchádzajúce", next: "Ďalšie", uspLabel: "Výhody nákupu", tabsLabel: "Produkty"
  } : {
    bar: ["Ingyenes szállítás 50 000 Ft felett", "Utánvéttel is fizethetsz", "Sok modellből csak 1–2 pár van"],
    phone: "+36 20 556 4258",
    ey: "Eredeti sneakerek európai raktárakból",
    h1: "Eredeti sneakerek, kedvezőbb áron",
    p: "Nem tartunk nagy készletet, így az árban nincs raktározási költség. Dupla pénz vissza, ha hamis. Utánvéttel is fizethetsz.",
    men: "Férfi cipők", women: "Női cipők", sale: "Akciók",
    menUrl: "/Ferfi", womenUrl: "/Noi", saleUrl: "/akcios-termekek", newUrl: "/ujdonsagok", allUrl: "/osszes-termek",
    usp: [
      ["shield", "Dupla pénz vissza, ha hamis", "Új, eredeti termékek, ellenőrzött forrásból"],
      ["swap", "30 nap ingyenes csere", "A cserét és a visszaküldést mi fizetjük"],
      ["cash", "Utánvét", "A pénzed nálad marad, amíg megjön a csomag"],
      ["truck", "Szólunk, hol tart", "Feladásig értesítünk a csomagodról"]
    ],
    tSale: "Akciós", tTop: "Legnépszerűbb", tNew: "Újdonságok", all: "Mutasd mindet",
    prev: "Előző", next: "Következő", uspLabel: "Vásárlási előnyök", tabsLabel: "Termékek"
  };

  var ICON = {
    shield: '<path d="M12 3l8 3v5.5c0 4.8-3.2 8.7-8 10-4.8-1.3-8-5.2-8-10V6z"/><path d="M8.5 12l2.2 2.2 5-5"/>',
    swap: '<path d="M4 9h13l-3.5-3.5"/><path d="M20 15H7l3.5 3.5"/>',
    cash: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/>',
    truck: '<path d="M3 6h11v10H3zM14 9.5h4l3 3V16h-7"/><circle cx="7" cy="17.5" r="1.7"/><circle cx="17.5" cy="17.5" r="1.7"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    left: '<path d="M15 5l-7 7 7 7"/>',
    right: '<path d="M9 5l7 7-7 7"/>'
  };
  function svg(k) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[k] + "</svg>";
  }

  /* ---------- 1) CSS ---------- */
  var BR = "#A3481F", INK = "#171717", CREAM = "#F5F2EC";
  var H = "#ud_shop_start ";
  var css = ""
    /* infosáv – minden oldalon */
    + "#kbd-bar{background:" + INK + ";color:#fff;font-size:12.5px;line-height:1;font-weight:600;letter-spacing:.01em}"
    + "#kbd-bar .kbd-bar__in{max-width:1440px;margin:0 auto;padding:0 20px;height:34px;display:flex;align-items:center;justify-content:center;gap:18px;position:relative}"
    + "#kbd-bar .kbd-bar__msg{display:flex;align-items:center;gap:18px}"
    + "#kbd-bar .kbd-bar__msg span+span:before{content:'•';opacity:.45;margin-right:18px}"
    + "#kbd-bar .kbd-bar__ph{position:absolute;right:20px;color:#fff!important;text-decoration:none!important;opacity:.9}"
    + "@media(max-width:1100px){#kbd-bar .kbd-bar__ph{display:none}}"
    + "@media(max-width:767.98px){#kbd-bar{font-size:11.5px}#kbd-bar .kbd-bar__in{height:30px;padding:0 12px}"
    + "#kbd-bar .kbd-bar__msg{position:relative;width:100%;height:30px;display:block}"
    + "#kbd-bar .kbd-bar__msg span{position:absolute;left:0;right:0;top:0;line-height:30px;text-align:center;opacity:0;transition:opacity .5s}"
    + "#kbd-bar .kbd-bar__msg span.on{opacity:1}#kbd-bar .kbd-bar__msg span+span:before{display:none}}"
    /* menü: 1200 px felett ne törjön két sorba */
    + "@media(min-width:1200px){#navbar--main{flex-wrap:nowrap!important}#navbar--main>.nav-item--menu>.nav-link{padding-left:10px!important;padding-right:10px!important}}"

    /* hero */
    + H + "#kbd-hero{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);background:" + CREAM + ";align-items:stretch}"
    + H + ".kbd-hero__txt{padding:44px 48px 44px max(24px,calc((100vw - 1320px)/2));display:flex;flex-direction:column;justify-content:center;align-items:flex-start;gap:14px;color:" + INK + "}"
    + H + ".kbd-hero__ey{font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:" + BR + "}"
    + H + "#kbd-hero h1{margin:0;font-size:clamp(30px,3.1vw,46px);line-height:1.02;font-weight:800;letter-spacing:-.02em;text-transform:uppercase;color:" + INK + ";text-wrap:balance}"
    + H + ".kbd-hero__p{margin:0;font-size:15px;line-height:1.55;color:#3b3b3b;max-width:44ch}"
    + H + ".kbd-hero__cta{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-top:4px}"
    + H + ".kbd-btn{display:inline-flex;align-items:center;gap:8px;height:46px;padding:0 20px;border-radius:10px;background:" + BR + ";color:#fff!important;font-size:14px;font-weight:700;text-decoration:none!important;transition:filter .2s,transform .2s}"
    + H + ".kbd-btn svg{width:18px;height:18px}"
    + H + ".kbd-btn:hover{filter:brightness(1.08);transform:translateY(-1px)}"
    + H + ".kbd-btn--dark{background:" + INK + "}"
    + H + ".kbd-hero__link{font-size:14px;font-weight:700;color:" + INK + "!important;text-decoration:underline!important;text-underline-offset:3px;margin-left:6px}"
    + H + ".kbd-hero__media{min-width:0;display:flex;align-items:center;background:#efefef}"
    + H + ".kbd-hero__media #start_banner_big{width:100%}"
    + H + ".kbd-hero__media .start_banner_big__container{padding:0!important}"
    + H + ".kbd-hero__media .carousel__nav--start_banner_big{display:none!important}"
    + "@media(max-width:991.98px){" + H + "#kbd-hero{grid-template-columns:minmax(0,1fr)}" + H + ".kbd-hero__txt{padding:32px 24px}}"
    + "@media(max-width:767.98px){" + H + ".kbd-hero__txt{padding:24px 16px 22px;gap:10px}" + H + ".kbd-hero__ey{font-size:10.5px}"
    + H + "#kbd-hero h1{font-size:30px}" + H + ".kbd-hero__p{font-size:14px}"
    + H + ".kbd-hero__cta{display:grid;grid-template-columns:1fr 1fr;width:100%;gap:8px}" + H + ".kbd-btn{justify-content:center;height:46px;padding:0 10px;font-size:14px}"
    + H + ".kbd-hero__link{grid-column:1/-1;justify-self:start;margin:4px 0 0}}"

    /* előnysáv (a futószalag helyett) */
    + H + "#kbd-home-trust-marquee{display:none!important}"
    + H + "#kbd-usp{background:#fff;border-bottom:1px solid #ececec}"
    + H + "#kbd-usp .kbd-usp__in{max-width:1320px;margin:0 auto;padding:18px 24px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px}"
    + H + ".kbd-usp__it{display:flex;gap:12px;align-items:flex-start;color:" + INK + "}"
    + H + ".kbd-usp__it svg{flex:none;width:26px;height:26px;color:" + BR + "}"
    + H + ".kbd-usp__it b{display:block;font-size:14px;line-height:1.25;font-weight:700}"
    + H + ".kbd-usp__it span{display:block;font-size:12.5px;line-height:1.35;color:#666;margin-top:2px}"
    + "@media(max-width:991.98px){" + H + "#kbd-usp .kbd-usp__in{grid-template-columns:repeat(2,minmax(0,1fr))}}"
    + "@media(max-width:767.98px){" + H + "#kbd-usp .kbd-usp__in{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scroll-padding:0 16px;gap:8px;padding:10px 16px;scrollbar-width:none}"
    + H + "#kbd-usp .kbd-usp__in::-webkit-scrollbar{display:none}"
    + H + ".kbd-usp__it{flex:none;scroll-snap-align:start;align-items:center;gap:7px;background:#f6f6f6;border-radius:999px;padding:7px 12px 7px 9px}"
    + H + ".kbd-usp__it svg{width:18px;height:18px}" + H + ".kbd-usp__it b{font-size:12px;white-space:nowrap}" + H + ".kbd-usp__it span{display:none}}"

    /* kategóriák: egy sor asztalon, kör ikonok mobilon */
    + H + "#start_category_offer{padding-top:28px!important;padding-bottom:28px!important}"
    + H + "#start_category_offer .main-title__wrap{display:none!important}"
    + H + "#start_category_offer .carousel-block," + H + ".kbd-pane .carousel-block{padding-bottom:0!important}"
    + H + ".carousel--start_category_offer.kbd-grid{grid-template-columns:repeat(8,minmax(0,1fr))!important;gap:12px!important}"
    + H + ".carousel--start_category_offer.kbd-grid .start_categories__slide-inner{padding:8px!important;gap:8px!important}"
    + H + ".carousel--start_category_offer.kbd-grid .start_categories__element-texts h4{font-size:13.5px!important}"
    + "@media(max-width:991.98px){" + H + ".carousel--start_category_offer.kbd-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important}}"
    + "@media(max-width:767.98px){" + H + "#start_category_offer{padding-top:14px!important;padding-bottom:6px!important}"
    + H + "#start_category_offer .container,#start_category_offer [class*=container]{padding-left:0!important;padding-right:0!important}"
    + H + ".carousel--start_category_offer.kbd-grid{display:flex!important;overflow-x:auto;gap:12px!important;padding:2px 16px 8px;scroll-snap-type:x mandatory;scroll-padding:0 16px;scrollbar-width:none}"
    + H + ".carousel--start_category_offer.kbd-grid::-webkit-scrollbar{display:none}"
    + H + ".carousel--start_category_offer.kbd-grid .carousel-cell{flex:0 0 74px!important;scroll-snap-align:start}"
    + H + ".carousel--start_category_offer.kbd-grid .start_categories__slide-inner{background:none!important;box-shadow:none!important;padding:0!important;gap:6px!important}"
    + H + ".carousel--start_category_offer.kbd-grid img{width:74px!important;height:74px!important;object-fit:cover;border-radius:50%!important}"
    + H + ".carousel--start_category_offer.kbd-grid .start_categories__slide-inner:hover img{transform:none}"
    + H + ".carousel--start_category_offer.kbd-grid .start_categories__element-texts h4{font-size:11.5px!important;line-height:1.2;white-space:nowrap}}"

    /* termékfülek */
    + H + "#kbd-ptabs{background:#F9F9F9;padding:30px 0 34px}"
    + H + ".kbd-pt__head{max-width:1320px;margin:0 auto 14px;padding:0 24px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}"
    + H + ".kbd-pt__tab{appearance:none;border:1.5px solid #e2e2e2;background:#fff;color:" + INK + ";border-radius:999px;height:40px;padding:0 18px;font:inherit;font-size:14px;font-weight:700;cursor:pointer;transition:background .2s,border-color .2s,color .2s}"
    + H + ".kbd-pt__tab:hover{border-color:" + INK + "}"
    + H + ".kbd-pt__tab[aria-selected=true]{background:" + INK + ";border-color:" + INK + ";color:#fff}"
    + H + ".kbd-pt__tab:focus-visible,.kbd-pt__nav:focus-visible{outline:2px solid " + BR + ";outline-offset:2px}"
    + H + ".kbd-pt__side{margin-left:auto;display:flex;align-items:center;gap:8px}"
    + H + ".kbd-pt__all{font-size:14px;font-weight:700;color:" + INK + "!important;text-decoration:underline!important;text-underline-offset:3px;margin-right:6px;white-space:nowrap}"
    + H + ".kbd-pt__nav{appearance:none;width:40px;height:40px;border-radius:50%;border:1.5px solid #e2e2e2;background:#fff;color:" + INK + ";display:inline-flex;align-items:center;justify-content:center;cursor:pointer}"
    + H + ".kbd-pt__nav svg{width:18px;height:18px}"
    + H + ".kbd-pt__body{position:relative}"
    + H + ".kbd-pane:not(.on){position:absolute!important;left:0!important;right:0!important;top:0!important;visibility:hidden!important;pointer-events:none!important}"
    + H + ".kbd-pane .padding-block{padding-top:0!important;padding-bottom:0!important}"
    + H + ".kbd-pane .element-bg{display:none!important}"
    + H + ".kbd-pane .carousel__title-outer{display:none!important}"
    + H + ".kbd-pane .carousel__products{flex:0 0 100%!important;max-width:100%!important;width:100%!important}"
    + "@media(max-width:767.98px){" + H + "#kbd-ptabs{padding:18px 0 22px}" + H + ".kbd-pt__head{padding:0 16px;gap:6px}"
    + H + ".kbd-pt__tab{height:34px;padding:0 13px;font-size:13px}" + H + ".kbd-pt__nav{display:none}"
    + H + ".kbd-pt__side{margin-left:0;width:100%;order:3}" + H + ".kbd-pt__all{font-size:13px;margin:4px 0 0}}"
    + "@media(prefers-reduced-motion:reduce){#kbd-bar .kbd-bar__msg span{transition:none}" + H + ".kbd-btn{transition:none}}";

  function addCss() {
    if (document.getElementById("kbd-home-v1-css")) return;
    var s = document.createElement("style");
    s.id = "kbd-home-v1-css";
    s.textContent = css;
    (document.head || document.documentElement).appendChild(s);
  }
  addCss();

  /* ---------- segédek ---------- */
  function $id(i) { return document.getElementById(i); }
  function after(node, ref) { ref.parentNode.insertBefore(node, ref.nextSibling); }
  var MQ = window.matchMedia ? window.matchMedia("(max-width: 767.98px)") : { matches: false };
  function abs(u) { return /^https?:/.test(u) ? u : location.protocol + "//" + location.host + u; }
  function catHref(re, fb) {
    var a = document.querySelectorAll("#start_category_offer h4 a");
    for (var i = 0; i < a.length; i++) if (re.test(a[i].getAttribute("href") || "")) return a[i].href;
    return abs(fb);
  }
  function flkResize(scope) {
    try {
      if (!window.jQuery || !scope) return;
      var $f = window.jQuery(scope).find(".flickity-enabled");
      $f.each(function () { try { window.jQuery(this).flickity("resize"); } catch (e) {} });
    } catch (e) {}
  }

  /* ---------- 2) infosáv ---------- */
  function buildBar() {
    var hd = $id("header");
    if (!hd || $id("kbd-bar")) return;
    var b = document.createElement("div");
    b.id = "kbd-bar";
    b.setAttribute("role", "region");
    b.setAttribute("aria-label", T.uspLabel);
    var msg = "";
    for (var i = 0; i < T.bar.length; i++) msg += "<span" + (i ? "" : ' class="on"') + ">" + T.bar[i] + "</span>";
    b.innerHTML = '<div class="kbd-bar__in"><div class="kbd-bar__msg">' + msg + '</div><a class="kbd-bar__ph" href="tel:' + T.phone.replace(/\s/g, "") + '">' + T.phone + "</a></div>";
    hd.parentNode.insertBefore(b, hd);
    /* mobilon egyszerre egy üzenet, 4 mp-enként váltva */
    var k = 0, sp = b.querySelectorAll(".kbd-bar__msg span");
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setInterval(function () {
      if (!MQ.matches) return;
      sp[k].className = "";
      k = (k + 1) % sp.length;
      sp[k].className = "on";
    }, 4000);
  }

  /* ---------- 3) hero ---------- */
  function buildHero() {
    var bn = $id("start_banner_big"), cat = $id("start_category_offer");
    var anchor = bn || cat;
    if (!anchor || $id("kbd-hero")) return;
    var h = document.createElement("section");
    h.id = "kbd-hero";
    h.innerHTML = '<div class="kbd-hero__txt"><span class="kbd-hero__ey">' + T.ey + "</span><h1>" + T.h1 + '</h1><p class="kbd-hero__p">' + T.p + "</p>"
      + '<div class="kbd-hero__cta"><a class="kbd-btn" href="' + catHref(/\/(ferfi|panske)$/i, T.menUrl) + '">' + T.men + svg("arrow") + "</a>"
      + '<a class="kbd-btn kbd-btn--dark" href="' + catHref(/\/(noi|damske)$/i, T.womenUrl) + '">' + T.women + svg("arrow") + "</a>"
      + '<a class="kbd-hero__link" href="' + catHref(/\/(akcios-termekek|akcie)$/i, T.saleUrl) + '">' + T.sale + "</a></div></div>"
      + '<div class="kbd-hero__media"></div>';
    anchor.parentNode.insertBefore(h, anchor);
  }

  /* ---------- 4) előnysáv ---------- */
  function buildUsp() {
    var hero = $id("kbd-hero");
    if (!hero || $id("kbd-usp")) return;
    var u = document.createElement("section");
    u.id = "kbd-usp";
    u.setAttribute("aria-label", T.uspLabel);
    var s = "";
    for (var i = 0; i < T.usp.length; i++) s += '<div class="kbd-usp__it">' + svg(T.usp[i][0]) + "<p style=\"margin:0\"><b>" + T.usp[i][1] + "</b><span>" + T.usp[i][2] + "</span></p></div>";
    u.innerHTML = '<div class="kbd-usp__in">' + s + "</div>";
    after(u, hero);
  }

  /* ---------- 5) kategóriák: sorrend + rács (ha a régi v2 szkript nem tette rácsba) ---------- */
  var ORDER = [/\/(ferfi|panske)$/i, /\/(noi|damske)$/i, /\/(gyermek|deti)$/i];
  function orderCats() {
    var cells = document.querySelectorAll("#start_category_offer .carousel-cell");
    for (var i = 0; i < cells.length; i++) {
      var a = cells[i].querySelector("h4 a"), href = a ? a.getAttribute("href") || "" : "", o = 10 + i;
      for (var j = 0; j < ORDER.length; j++) if (ORDER[j].test(href)) o = j + 1;
      cells[i].style.order = o;
    }
  }
  var gridTries = 0;
  function ensureGrid() {
    var c = document.querySelector(".carousel--start_category_offer");
    if (!c || c.classList.contains("kbd-grid")) return;
    if (++gridTries < 25) return; /* a régi v2 szkript ~4 mp-en belül megcsinálja */
    try {
      if (window.jQuery && window.jQuery(c).data("flickity")) window.jQuery(c).flickity("destroy");
    } catch (e) {}
    c.classList.add("kbd-grid");
    c.style.display = "grid";
    var nav = document.querySelector(".carousel__nav--start_category_offer");
    if (nav) nav.style.display = "none";
  }

  /* ---------- 6) termékfülek ---------- */
  var KNOWN = { page_artref_inner: "sale", box_top_content: "top" };
  var LABEL = { sale: T.tSale, top: T.tTop, "new": T.tNew };
  var RANK = { sale: 1, top: 2, "new": 3 };
  function paneKey(box) {
    if (KNOWN[box.id]) return KNOWN[box.id];
    return /new|uj|novink/i.test(box.id + " " + box.className) ? "new" : "x-" + (box.id || "box");
  }
  function paneLabel(key, box) {
    if (LABEL[key]) return LABEL[key];
    var t = box.querySelector(".title-box__title");
    return t ? t.textContent.replace(/\s+/g, " ").trim() : T.tNew;
  }
  function paneAll(key, box) {
    var a = box.querySelector(".title-box__content a[href]");
    if (a) return a.href;
    if (key === "sale") return catHref(/\/(akcios-termekek|akcie)$/i, T.saleUrl);
    if (key === "new") return catHref(/\/(ujdonsagok|novinky)$/i, T.newUrl);
    return abs(T.allUrl);
  }
  /* a #main közvetlen gyerekei közül azok, amelyekben termékcsúszka van */
  function productBoxes(main) {
    var out = [], seen = {};
    for (var id in KNOWN) { var k = $id(id); if (k) { out.push(k); seen[id] = 1; } }
    var lists = main.querySelectorAll(".carousel-block .products.js-products");
    for (var i = 0; i < lists.length; i++) {
      var n = lists[i];
      while (n && n.parentNode && n.parentNode !== main && !(n.parentNode.classList && n.parentNode.classList.contains("kbd-pt__body"))) n = n.parentNode;
      if (!n || !n.parentNode || seen[n.id] || out.indexOf(n) > -1) continue;
      if (n.id === "kbd-ptabs" || n.id === "box_page_content" || n.id === "custom-content-top" || (n.classList && n.classList.contains("kbd-home-extra"))) continue;
      out.push(n);
    }
    return out;
  }
  function activate(wrap, key) {
    var tabs = wrap.querySelectorAll(".kbd-pt__tab"), panes = wrap.querySelectorAll(".kbd-pane"), all = wrap.querySelector(".kbd-pt__all");
    for (var i = 0; i < tabs.length; i++) {
      var on = tabs[i].getAttribute("data-k") === key;
      tabs[i].setAttribute("aria-selected", on ? "true" : "false");
      tabs[i].tabIndex = on ? 0 : -1;
    }
    for (var j = 0; j < panes.length; j++) {
      var p = panes[j], isOn = p.getAttribute("data-k") === key;
      p.classList.toggle("on", isOn);
      if (isOn) { all.href = p.getAttribute("data-all"); flkResize(p); }
    }
    wrap.setAttribute("data-on", key);
  }
  function buildTabs() {
    var main = $id("main"), cat = $id("start_category_offer");
    if (!main || !cat) return;
    var w = $id("kbd-ptabs");
    if (!w) {
      w = document.createElement("section");
      w.id = "kbd-ptabs";
      w.setAttribute("aria-label", T.tabsLabel);
      w.innerHTML = '<div class="kbd-pt__head"><div class="kbd-pt__tabs" role="tablist" style="display:flex;gap:8px;flex-wrap:wrap"></div>'
        + '<div class="kbd-pt__side"><a class="kbd-pt__all" href="#">' + T.all + " →</a>"
        + '<button type="button" class="kbd-pt__nav" data-d="-1" aria-label="' + T.prev + '">' + svg("left") + "</button>"
        + '<button type="button" class="kbd-pt__nav" data-d="1" aria-label="' + T.next + '">' + svg("right") + "</button></div></div>"
        + '<div class="kbd-pt__body"></div>';
      after(w, cat);
      w.addEventListener("click", function (e) {
        var t = e.target.closest ? e.target.closest(".kbd-pt__tab,.kbd-pt__nav") : null;
        if (!t) return;
        if (t.classList.contains("kbd-pt__tab")) { w.setAttribute("data-picked", "1"); return activate(w, t.getAttribute("data-k")); }
        var p = w.querySelector(".kbd-pane.on .flickity-enabled");
        try { if (p && window.jQuery) window.jQuery(p).flickity(t.getAttribute("data-d") === "1" ? "next" : "previous", true); } catch (er) {}
      });
      w.addEventListener("keydown", function (e) {
        if (!e.target.classList || !e.target.classList.contains("kbd-pt__tab")) return;
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        var ts = w.querySelectorAll(".kbd-pt__tab"), i = Array.prototype.indexOf.call(ts, e.target);
        var n = ts[(i + (e.key === "ArrowRight" ? 1 : ts.length - 1)) % ts.length];
        n.focus(); w.setAttribute("data-picked", "1"); activate(w, n.getAttribute("data-k"));
      });
    }
    var body = w.querySelector(".kbd-pt__body"), list = w.querySelector(".kbd-pt__tabs");
    var boxes = productBoxes(main), added = false;
    for (var i = 0; i < boxes.length; i++) {
      var b = boxes[i];
      if (b.parentNode === body) continue;
      var key = paneKey(b);
      b.classList.add("kbd-pane");
      b.setAttribute("data-k", key);
      b.setAttribute("data-all", paneAll(key, b));
      body.appendChild(b);
      var tb = document.createElement("button");
      tb.type = "button";
      tb.className = "kbd-pt__tab";
      tb.setAttribute("role", "tab");
      tb.setAttribute("data-k", key);
      tb.setAttribute("data-r", RANK[key] || 9);
      tb.textContent = paneLabel(key, b);
      list.appendChild(tb);
      added = true;
    }
    if (added) {
      /* fülsorrend: Akciós, Legnépszerűbb, Újdonságok, többi */
      var arr = Array.prototype.slice.call(list.children).sort(function (x, y) { return x.getAttribute("data-r") - y.getAttribute("data-r"); });
      for (var j = 0; j < arr.length; j++) list.appendChild(arr[j]);
      activate(w, w.getAttribute("data-on") || arr[0].getAttribute("data-k"));
    } else {
      /* az AJAX-tartalom később érkezik: a link és a méret frissítése */
      var on = w.querySelector(".kbd-pane.on");
      if (on) {
        var key2 = on.getAttribute("data-k"), al = paneAll(key2, on);
        if (al !== on.getAttribute("data-all")) { on.setAttribute("data-all", al); w.querySelector(".kbd-pt__all").href = al; }
      }
    }
    /* üres modul (még tölt, vagy ki van kapcsolva) füle rejtve; ha az aktív üres, az első teli lesz aktív */
    var ts = list.children, first = null, cur = w.getAttribute("data-on"), curFull = false, grown = false;
    for (var m = 0; m < ts.length; m++) {
      var k = ts[m].getAttribute("data-k"), pn = body.querySelector('.kbd-pane[data-k="' + k + '"]');
      var full = !!(pn && pn.querySelector(".products"));
      ts[m].hidden = !full;
      if (full && pn.getAttribute("data-full") !== "1") { pn.setAttribute("data-full", "1"); grown = true; }
      if (full && !first) first = k;
      if (full && k === cur) curFull = true;
    }
    w.style.display = first ? "" : "none";
    /* amíg a látogató nem választott, mindig a sorrendben első teli fül az aktív (Akciós) */
    if (first && (!curFull || (first !== cur && !w.getAttribute("data-picked")))) activate(w, first);
    else if (grown) flkResize(body.querySelector(".kbd-pane.on"));
  }

  /* ---------- 7) sorrend: hero, előnyök, kategóriák, fülek, [mobilon banner], méretek, UGG/márkák ---------- */
  var lastMob = null;
  function arrange() {
    var main = $id("main"), cat = $id("start_category_offer");
    if (!main || !cat) return;
    var hero = $id("kbd-hero"), usp = $id("kbd-usp"), tabs = $id("kbd-ptabs"), bn = $id("start_banner_big");
    var bs = $id("start_brand_slider"), ex = document.querySelector("#main > .kbd-home-extra");
    var mob = MQ.matches, seq = [hero, usp, cat, tabs];
    if (mob && bn) seq.push(bn);
    seq.push(bs, ex);
    seq = seq.filter(function (x) { return x && x.parentNode; });
    for (var i = 1; i < seq.length; i++) if (seq[i - 1].nextElementSibling !== seq[i]) after(seq[i], seq[i - 1]);
    var media = hero && hero.querySelector(".kbd-hero__media");
    if (!mob && bn && media && bn.parentNode !== media) media.appendChild(bn);
    if (media) media.style.display = mob || !bn ? "none" : "";
    if (lastMob !== mob) { lastMob = mob; flkResize(bn); flkResize(tabs); }
  }

  /* ---------- indítás ---------- */
  var busy = false;
  function run() {
    if (busy) return;
    busy = true;
    try {
      buildBar();
      if (document.body && document.body.id === "ud_shop_start") {
        buildHero(); buildUsp(); orderCats(); ensureGrid(); buildTabs(); arrange();
      }
    } catch (e) { if (window.console) console.warn("kbd-home", e); }
    busy = false;
  }
  function start() {
    run();
    var main = $id("main");
    if (main && window.MutationObserver && document.body.id === "ud_shop_start") {
      var t = null, mo = new MutationObserver(function () { if (busy) return; clearTimeout(t); t = setTimeout(run, 60); });
      mo.observe(main, { childList: true, subtree: true });
      setTimeout(function () { mo.disconnect(); run(); }, 20000);
    }
    var n = 0, iv = setInterval(function () { run(); if (++n > 30) clearInterval(iv); }, 200);
    window.addEventListener("load", function () { run(); flkResize($id("start_banner_big")); flkResize($id("kbd-ptabs")); });
    if (MQ.addEventListener) MQ.addEventListener("change", run); else if (MQ.addListener) MQ.addListener(run);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
