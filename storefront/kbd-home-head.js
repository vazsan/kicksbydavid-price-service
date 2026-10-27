/* KBD kezdőlap R2 kapu (Unas head-tag, csak a kezdőoldalon; a sablon tokenjeit a scripts/pdp/home_head_tag.py tölti ki: __R2_COMMIT__, __DEF_HU__, __DEF_SK__, __OWN_PRELOAD__, __DEF_SLIDER__).
   Feladata: (1) a kapcsoló (süti kbdhome, ?kbdhome=1 be / ?kbdhome=0 ki, ?kbdoff=1 minden ki), (2) KORAI CSS: a régi kezdőlap-felső elrejtése, a hős helye és stílusa az első kirajzolás előtt,
   (3) a HŐS (kép + cím + gomb) azonnal a fejből épül be, amint a #main megjelenik: nem vár a modulra és a kbd-home.js-re (Nora msg 2102, Főnök msg 2103), (4) az R2 modul (home.js) a többit építi,
   (5) 7 mp-es biztonsági időzítő: ha az R2 nem épült fel, a régi kezdőlap visszajön (fail-open).
   A hős szövegei (T) a modul L blokkjával egyeznek (storefront/r2-home/home.js): ha ott változik, itt is át kell írni.
   FIGYELEM: Unas tag-szövegben tilos a dupla szögletes zárójel (a két nyitó vagy két záró jel egymás után). */
(function () {
  try {
    var L = location, d = document, de = d.documentElement;
    if (window.KBD_R2H_HEAD || /[?&]kbdoff=1/.test(L.search)) return;
    window.KBD_R2H_HEAD = 1;
    var SK = /\.sk$/i.test(L.hostname), DEF_HU = __DEF_HU__, DEF_SK = __DEF_SK__, OWN = __OWN_PRELOAD__, DEF_SL = __DEF_SLIDER__, C = "__R2_COMMIT__";
    var q = /[?&]kbdhome=([01])(?:&|$)/.exec(L.search), ck = /(?:^|;\s*)kbdhome=([01])/.exec(d.cookie || "");
    if (q) { try { d.cookie = "kbdhome=" + q[1] + ";path=/;max-age=7776000;SameSite=Lax"; } catch (e) {} ck = { 1: q[1] }; }
    var on = ck ? ck[1] === "1" : (SK ? DEF_SK : DEF_HU);
    if (!on || L.pathname !== "/") return;
    /* slider-mód (Dávid TG 2446): a hős helyén az Unas start_banner_big ÖSSZES slide-ja (az élő natív slider), a H1 alatta; süti kbdslider, ?kbdslider=1/0, alap: DEF_SL */
    var qs = /[?&]kbdslider=([01])(?:&|$)/.exec(L.search), cs = /(?:^|;\s*)kbdslider=([01])/.exec(d.cookie || "");
    if (qs) { try { d.cookie = "kbdslider=" + qs[1] + ";path=/;max-age=7776000;SameSite=Lax"; } catch (e) {} cs = { 1: qs[1] }; }
    var SL = cs ? cs[1] === "1" : DEF_SL;
    de.className += SL ? " khr-on khr-slider" : " khr-on";
    var B = "https://cdn.jsdelivr.net/gh/vazsan/kicksbydavid-price-service@" + C + "/storefront/r2-home/";
    window.KBD_R2H_BASE = B;
    var T = SK ? { h1: "Tenisky, ktoré<br>práve letia", sub: "Výrobný kód pri každom produkte", btn: "Zobraziť všetko", alt: "ASICS Gel-NYC Oyster Grey", base: "/vsetky-produkty", aria: "KicksByDavid" }
      : { h1: "Felkapott<br>sneakerek", sub: "Gyári cikkszám minden terméklapon", btn: "Mutasd az összeset", alt: "ASICS Gel-NYC Oyster Grey sneaker utcai kövön", base: "/osszes-termek", aria: "Kezdőlap" };
    var s = d.createElement("style"); s.id = "khr-early";
    s.textContent = "html.khr-on #start_category_offer,html.khr-on #page_artref_inner,html.khr-on #box_top_content,html.khr-on #start_brand_slider,html.khr-on #kbd-home-trust-marquee{display:none!important}"
      + "html.khr-on:not(.khr-slider) #start_banner_big{display:none!important}"
      + "@media(max-width:767.98px){html.khr-slider .carousel__nav--start_banner_big{display:none!important}html.khr-slider #start_banner_big .start_banner_big__container{padding-bottom:0!important;margin-bottom:0!important}html.khr-slider #start_banner_big{margin-bottom:0!important}}"
      + "html.khr-on:not(.khr-slider):not(.khr-ready):not(.khr-shell) #main::before{content:'';display:block;height:520px;background:#CFC6B8}"
      + "@media (min-width:992px){html.khr-on:not(.khr-slider):not(.khr-ready):not(.khr-shell) #main::before{height:600px}}"
      + "html.khr-on:not(.khr-ready) #main>*:not(#khr):not(#start_banner_big){visibility:hidden}"
      + "#khr{--ink:#171717;--soft:#5E5A53;--line:#E6E3DD;color:var(--ink);font:500 15px/1.5 Montserrat,sans-serif;-webkit-font-smoothing:antialiased;background:#fff;overflow-x:clip;position:relative;z-index:0}"
      + "#khr *,#khr *::before,#khr *::after{box-sizing:border-box}#khr a{color:inherit;text-decoration:none}#khr a:hover{color:inherit;text-decoration:none}#khr img{max-width:100%}"
      + "#khr .khr-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:48px;padding:0 22px;border-radius:12px;background:var(--ink);color:#fff;font-size:14px;font-weight:800}"
      + "#khr .khr-hero{position:relative;display:block;height:520px;overflow:hidden;background:#CFC6B8}#khr .khr-hero picture,#khr .khr-hero img{display:block;width:100%;height:100%}#khr .khr-hero img{object-fit:cover;object-position:50% 60%}"
      + "#khr .khr-hero::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(246,243,237,.78) 0,rgba(246,243,237,.42) 34%,rgba(246,243,237,0) 52%);pointer-events:none}"
      + "#khr .khr-ht{position:absolute;z-index:1;left:0;right:0;top:0;padding:30px 20px 0;text-align:center}"
      + "#khr .khr-hero h1{margin:0;padding:0;font:800 38px/1.02 Montserrat,sans-serif;letter-spacing:-1.6px;text-transform:uppercase;color:var(--ink)}"
      + "#khr .khr-hero p{margin:12px 0 0;font-size:15px;font-weight:800;color:#111}#khr .khr-hero .khr-btn{margin-top:16px;color:#fff}"
      + "#khr .khr-cap{position:absolute;z-index:1;right:16px;bottom:16px;color:#fff;font-size:11px;font-weight:800;letter-spacing:.1em;text-align:right;line-height:1.35;text-shadow:0 1px 6px rgba(0,0,0,.35)}"
      + "@media (min-width:992px){#khr .khr-hero{height:600px}#khr .khr-hero img{object-position:30% 50%}"
      + "#khr .khr-hero::after{background:linear-gradient(90deg,rgba(246,243,237,0) 40%,rgba(246,243,237,.5) 58%,rgba(246,243,237,.62) 100%)}"
      + "#khr .khr-ht{left:auto;right:max(16px,calc((100vw - 1240px)/2));top:50%;transform:translateY(-50%);width:520px;padding:0;text-align:left}"
      + "#khr .khr-hero h1{font-size:64px;letter-spacing:-2.6px}#khr .khr-hero p{margin-top:16px;font-size:16px}#khr .khr-hero .khr-btn{margin-top:24px;height:52px;padding:0 26px;font-size:15px}"
      + "#khr .khr-cap{right:auto;left:max(16px,calc((100vw - 1240px)/2));bottom:24px;text-align:left}}"
      + "@supports selector(:has(a)){html.khr-on body#ud_shop_start{padding-top:34px}@media(max-width:767.98px){html.khr-on body#ud_shop_start{padding-top:30px}}html.khr-on body#ud_shop_start:has(>#kbd-bar){padding-top:0!important}}";
    d.head.appendChild(s);
    function pl(href, srcset, media) {
      var l = d.createElement("link"); l.rel = "preload"; l.as = "image"; l.href = href; l.setAttribute("imagesrcset", srcset); l.setAttribute("imagesizes", "100vw"); l.setAttribute("fetchpriority", "high"); l.media = media; d.head.appendChild(l);
    }
    if (OWN && !SL) pl(B + "img/hero_klassz_mob_780.webp", B + "img/hero_klassz_mob_780.webp 780w", "(max-width:991.98px)");
    if (OWN && !SL) pl(B + "img/hero_klassz_desk_1440.webp", B + "img/hero_klassz_desk_1440.webp 1440w, " + B + "img/hero_klassz_desk_1920.webp 1920w, " + B + "img/hero_klassz_desk_2560.webp 2560w", "(min-width:992px)");
    var j = d.createElement("script"); j.async = true; j.id = "khr-js"; j.src = B + "home.js"; d.head.appendChild(j);
    /* a hős-héj: amint a #main megjelenik (és a slide képe is, hogy az "r2:" jelölést lássuk), azonnal beszúrjuk; a modul ezt a héjat egészíti ki */
    var t0 = Date.now();
    function shell() {
      if (SL) return true;   /* slider-módban nincs saját hős-héj: a natív slider látszik, a modul a többit építi alá */
      var m = d.getElementById("main");
      if (!m) return false;
      if (d.getElementById("khr")) return true;
      var si = d.querySelector("#start_banner_big .carousel-cell--1 picture img") || d.querySelector("#start_banner_big picture img");
      if (!si && d.readyState === "loading" && Date.now() - t0 < 400) return false;
      if (si && /^\s*r2:/i.test(si.getAttribute("alt") || "")) return true;   /* slide-hős: a modul építi (a slide picture-jéből) */
      var e = d.createElement("section"); e.id = "khr"; e.setAttribute("data-shell", "1"); e.setAttribute("aria-label", T.aria);
      e.innerHTML = '<a class="khr-hero" href="' + T.base + '?filter=8908281:4"><picture><source media="(min-width:992px)" srcset="' + B + 'img/hero_klassz_desk_1440.webp 1440w, ' + B + 'img/hero_klassz_desk_1920.webp 1920w, ' + B + 'img/hero_klassz_desk_2560.webp 2560w" sizes="100vw" width="1440" height="600">'
        + '<img src="' + B + 'img/hero_klassz_mob_780.webp" width="780" height="1040" fetchpriority="high" decoding="async" alt="' + T.alt + '"></picture>'
        + '<div class="khr-ht"><h1>' + T.h1 + '</h1><p>' + T.sub + '</p><span class="khr-btn">' + T.btn + ' <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span></div>'
        + '<span class="khr-cap">ASICS GEL-NYC<br>OYSTER GREY</span></a>';
      m.insertBefore(e, m.firstChild); de.className += " khr-shell";
      return true;
    }
    if (!shell()) {
      var mo = window.MutationObserver ? new MutationObserver(function () { if (shell()) mo.disconnect(); }) : null;
      if (mo) mo.observe(de, { childList: true, subtree: true });
      d.addEventListener("DOMContentLoaded", function () { if (mo) mo.disconnect(); shell(); });
      setTimeout(function () { if (mo) mo.disconnect(); shell(); }, 450);
    }
    setTimeout(function () {
      if (!/(^|\s)khr-ready(\s|$)/.test(de.className)) {
        de.className = de.className.replace(/(^|\s)khr-on(?=\s|$)/, "");
        var sh = d.getElementById("khr");
        if (sh && sh.getAttribute("data-shell") && !sh.querySelector(".khr-w") && sh.parentNode) sh.parentNode.removeChild(sh);
        if (window.KBD_HOME_RERUN) window.KBD_HOME_RERUN();
      }
    }, 7000);
  } catch (e) {}
})();
