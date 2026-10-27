/* KBD kezdőlap R2 kapu (Unas head-tag, csak a kezdőoldalon; a sablon tokenjeit a scripts/pdp/home_head_tag.py tölti ki: __R2_COMMIT__, __DEF_HU__, __DEF_SK__, __OWN_PRELOAD__).
   Feladata: (1) a kapcsoló (süti kbdhome, ?kbdhome=1 be / ?kbdhome=0 ki, ?kbdoff=1 minden ki), (2) KORAI CSS: a régi kezdőlap-felső elrejtése és a hős helyének lefoglalása az első kirajzolás előtt (nincs villanás, nincs elrendezés-ugrás),
   (3) a hős kép és az R2 modul előbetöltése a fejből, (4) 7 mp-es biztonsági időzítő: ha az R2 nem épült fel, a régi kezdőlap visszajön (fail-open).
   FIGYELEM: Unas tag-szövegben tilos a dupla szögletes zárójel (a két nyitó vagy két záró jel egymás után). */
(function () {
  try {
    var L = location, d = document, de = d.documentElement;
    if (window.KBD_R2H_HEAD || /[?&]kbdoff=1/.test(L.search)) return;
    window.KBD_R2H_HEAD = 1;
    var SK = /\.sk$/i.test(L.hostname), DEF_HU = __DEF_HU__, DEF_SK = __DEF_SK__, OWN = __OWN_PRELOAD__, C = "__R2_COMMIT__";
    var q = /[?&]kbdhome=([01])(?:&|$)/.exec(L.search), ck = /(?:^|;\s*)kbdhome=([01])/.exec(d.cookie || "");
    if (q) { try { d.cookie = "kbdhome=" + q[1] + ";path=/;max-age=7776000;SameSite=Lax"; } catch (e) {} ck = { 1: q[1] }; }
    var on = ck ? ck[1] === "1" : (SK ? DEF_SK : DEF_HU);
    if (!on || L.pathname !== "/") return;
    de.className += " khr-on";
    var B = "https://cdn.jsdelivr.net/gh/vazsan/kicksbydavid-price-service@" + C + "/storefront/r2-home/";
    window.KBD_R2H_BASE = B;
    var s = d.createElement("style"); s.id = "khr-early";
    s.textContent = "html.khr-on #start_banner_big,html.khr-on #start_category_offer,html.khr-on #page_artref_inner,html.khr-on #box_top_content,html.khr-on #start_brand_slider,html.khr-on #kbd-home-trust-marquee{display:none!important}"
      + "html.khr-on:not(.khr-ready) #main::before{content:'';display:block;height:520px;background:#CFC6B8}"
      + "@media (min-width:992px){html.khr-on:not(.khr-ready) #main::before{height:600px}}"
      + "html.khr-on:not(.khr-ready) #main>*{visibility:hidden}"
      + "#khr .khr-hero{position:relative;display:block;height:520px;overflow:hidden;background:#CFC6B8}#khr .khr-hero picture,#khr .khr-hero img{display:block;width:100%;height:100%}#khr .khr-hero img{object-fit:cover;object-position:50% 60%}#khr .khr-ht{position:absolute;z-index:1;left:0;right:0;top:0}"
      + "@media (min-width:992px){#khr .khr-hero{height:600px}}"
      + "@supports selector(:has(a)){html.khr-on body#ud_shop_start{padding-top:34px}@media(max-width:767.98px){html.khr-on body#ud_shop_start{padding-top:30px}}html.khr-on body#ud_shop_start:has(>#kbd-bar){padding-top:0!important}}";
    d.head.appendChild(s);
    function pl(href, srcset, media) {
      var l = d.createElement("link"); l.rel = "preload"; l.as = "image"; l.href = href; l.setAttribute("imagesrcset", srcset); l.setAttribute("imagesizes", "100vw"); l.setAttribute("fetchpriority", "high"); l.media = media; d.head.appendChild(l);
    }
    if (OWN) pl(B + "img/hero_klassz_mob_780.webp", B + "img/hero_klassz_mob_780.webp 780w", "(max-width:991.98px)");
    if (OWN) pl(B + "img/hero_klassz_desk_1440.webp", B + "img/hero_klassz_desk_1440.webp 1440w, " + B + "img/hero_klassz_desk_1920.webp 1920w, " + B + "img/hero_klassz_desk_2560.webp 2560w", "(min-width:992px)");
    var j = d.createElement("script"); j.async = true; j.id = "khr-js"; j.src = B + "home.js"; d.head.appendChild(j);
    setTimeout(function () {
      if (!/(^|\s)khr-ready(\s|$)/.test(de.className)) {
        de.className = de.className.replace(/(^|\s)khr-on(?=\s|$)/, "");
        if (window.KBD_HOME_RERUN) window.KBD_HOME_RERUN();
      }
    }, 7000);
  } catch (e) {}
})();
