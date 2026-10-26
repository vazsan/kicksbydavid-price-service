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
    ? { code: "KBD10", type: "abs", val: 10, tag: "Kupón", save: "Extra", amt: "10 €", withCode: "Cena s kódom", codeLbl: "Kód", copy: "Kopírovať", copied: "Skopírované", how: "Kód zadáš v košíku." }
    : { code: "KBD5", type: "pct", val: 5, tag: "Kupon", save: "Extra", amt: "5%", withCode: "Kóddal számolt ár", codeLbl: "Kód", copy: "Másolás", copied: "Kimásolva", how: "A kosárban add meg a kódot." };
  var N = SK
    ? { tileA: "Chýba tvoja veľkosť?", tileB: "Dáme vedieť, keď sa vráti", title: "Napíšeme ti, keď sa vráti EU {s}", text: "Keď bude tento produkt znova dostupný v EU {s}, pošleme ti e-mail. Iba tento jeden. Potom tvoju adresu z tohto zoznamu vymažeme. Či sa veľkosť vráti a kedy, zatiaľ nevieme povedať. Na newsletter sa tým neprihlasuješ.", pick: "Ktorú veľkosť potrebuješ?", email: "E-mail", ph: "meno@email.sk",
        consent: "Súhlasím, aby spoločnosť KICKS BY DÁVID s. r. o. použila moju e-mailovú adresu a vybraný produkt a veľkosť na to, aby mi jedným e-mailom dala vedieť, keď bude veľkosť znova dostupná. Súhlas môžem kedykoľvek odvolať. Viac o spracúvaní osobných údajov: ", priv: "{ADATVEDELMI_LINK}", btn: "Chcem upozornenie",
        ok: "Hotovo. Keď sa EU {s} vráti, pošleme ti e-mail. Ak ho nenájdeš, pozri sa aj do ostatných priečinkov a do spamu.", errC: "Na upozornenie potrebujeme tvoj súhlas.", errE: "Toto nevyzerá ako e-mailová adresa. Skontroluj ju, prosím.", close: "Zavrieť", dev: "Náhľad: nič sa neodosiela." }
    : { tileA: "Nincs meg a méreted?", tileB: "Szólunk, ha visszajön", title: "Írunk, ha visszajön az EU {s}", text: "Ha ebből a termékből újra lesz EU {s} méret, küldünk róla egy e-mailt. Csak ezt az egyet. Utána a címedet töröljük erről a listáról. Hogy visszajön-e, és mikor, azt most nem tudjuk megmondani. Ezzel nem iratkozol fel a hírlevélre.", pick: "Melyik méret kell?", email: "E-mail", ph: "nev@email.hu",
        consent: "Hozzájárulok, hogy a KICKS BY DÁVID s. r. o. az e-mail címemet, valamint a kiválasztott terméket és méretet arra használja, hogy egy e-mailben értesítsen, ha a méret újra kapható. A hozzájárulásomat bármikor visszavonhatom. Az adatkezelésről bővebben: ", priv: "{ADATVEDELMI_LINK}", btn: "Kérem az értesítést",
        ok: "Megvan. Ha az EU {s} visszajön, e-mailt kapsz tőlünk. Ha nem látod, nézd meg a Promóciók fület és a spamet is.", errC: "Az értesítéshez be kell jelölnöd a hozzájárulást.", errE: "Ez nem tűnik e-mail címnek. Nézd meg még egyszer.", close: "Bezár", dev: "Előnézet: nem küld semmit." };

  var COPY_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>';
  var CHECK_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  var BELL_SVG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 21h4"/></svg>';
  var CHEV_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';

  /* ---- CSS (Vera modulja, a kbdv- előtagos osztályokkal; a rendezés a kbd-pdp2 order-rendszerébe illeszkedik) ---- */
  var M = "html.kbd-pdp.kbd-v2 #artdet__main-block .artdet__block-cart-inner>";
  var CSS = ".kbdv-tkt,.kbdv-tkt *,.kbdv-tile,.kbdv-tile *,.kbdv-sh,.kbdv-sh *{box-sizing:border-box;font-family:Montserrat,Montserrat-fallback,sans-serif;text-transform:none}" +
    ".kbdv-tkt button,.kbdv-tile,.kbdv-sh button{opacity:1!important;filter:none!important}" +
    M + "#kbd-coupon{order:3;margin:0 0 12px}" + M + "#kbd-notify-tile{order:6;margin:0}" +
    ".kbdv-tkt{--r:9px;--perf:62%;position:relative;width:100%;margin:14px 0 16px;color:#171717;filter:drop-shadow(0 0 .6px #BFB4A0) drop-shadow(0 0 .6px #BFB4A0)}" +
    ".kbdv-tkt .bd{position:relative;background:#F6F3ED;border-radius:8px;-webkit-mask:radial-gradient(circle var(--r) at 0 var(--perf),#0000 98%,#000) left/51% 100% no-repeat,radial-gradient(circle var(--r) at 100% var(--perf),#0000 98%,#000) right/51% 100% no-repeat;mask:radial-gradient(circle var(--r) at 0 var(--perf),#0000 98%,#000) left/51% 100% no-repeat,radial-gradient(circle var(--r) at 100% var(--perf),#0000 98%,#000) right/51% 100% no-repeat}" +
    ".kbdv-tkt .top{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;padding:30px 16px 14px}" +
    ".kbdv-tkt .tag{position:absolute;left:0;top:0;padding:5px 10px 5px 12px;border-radius:8px 0 8px 0;background:#A3481F;color:#fff;font-size:10.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}" +
    ".kbdv-tkt .sv{display:flex;flex-direction:column;gap:2px}.kbdv-tkt .sv small{font-size:12px;font-weight:600;color:#55554F;letter-spacing:.02em}" +
    ".kbdv-tkt .sv b{font-size:30px;line-height:1;font-weight:800;letter-spacing:-.6px;color:#A3481F;white-space:nowrap}" +
    ".kbdv-tkt .pr{text-align:right}.kbdv-tkt .pr small{display:block;font-size:12px;font-weight:600;color:#55554F;margin-bottom:3px}.kbdv-tkt .pr b{font-size:20px;line-height:1;font-weight:800;letter-spacing:-.3px;color:#0E0E0E;white-space:nowrap}" +
    ".kbdv-tkt .perf{height:0;margin:0 14px;border-top:1.5px dashed #C9BFAE}" +
    ".kbdv-tkt .stub{display:flex;align-items:center;gap:10px;padding:12px 16px 14px}.kbdv-tkt .stub .lbl{font-size:12px;font-weight:600;color:#55554F}" +
    ".kbdv-tkt .code{flex:1 1 auto;display:flex;align-items:center;justify-content:center;height:40px;padding:0 12px;border:1.5px dashed #A3481F;border-radius:5px;background:#fff;font-size:17px;font-weight:800;letter-spacing:.16em;color:#171717}" +
    ".kbdv-tkt .cp{flex:0 0 auto;display:inline-flex;align-items:center;gap:7px;height:40px;padding:0 14px;border:0;border-radius:4px;background:#171717;color:#fff;font-size:13px;font-weight:800;letter-spacing:.4px;text-transform:uppercase;cursor:pointer}.kbdv-tkt .cp.ok{background:#17714A}" +
    ".kbdv-tkt .how{padding:0 16px 14px;margin-top:-4px;font-size:12px;color:#55554F}" +
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
    ".kbdv-sh .go{width:100%;height:56px;margin-top:14px;border:0;border-radius:4px;background:#A3481F;color:#fff;font-size:15px;font-weight:800;letter-spacing:.75px;text-transform:uppercase;cursor:pointer}" +
    ".kbdv-sh .note{margin:10px 0 0;text-align:center;font-size:12px;color:#55554F}" +
    ".kbdv-sh .okc{width:46px;height:46px;margin:4px 0 12px;display:grid;place-items:center;border-radius:50%;background:#17714A;color:#fff}.kbdv-sh .okc svg{width:24px;height:24px}.kbdv-sh p.ok{margin:0 0 6px;font-size:15px;line-height:1.45;font-weight:600}" +
    "html.kbdv-lock,html.kbdv-lock body{overflow:hidden!important}";
  function css() {
    if (d.getElementById("kbdv-css")) return;
    var s = d.createElement("style"); s.id = "kbdv-css"; s.textContent = CSS; (d.head || h).appendChild(s);
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
  function couponHtml(calc, copied) {
    return '<div class="bd"><span class="tag">' + esc(C.tag) + '</span><div class="top"><div class="sv"><small>' + esc(C.save) + '</small><b>−' + esc(C.amt) + '</b></div><div class="pr"><small>' + esc(C.withCode) + '</small><b>' + esc(calc) + '</b></div></div>' +
      '<div class="perf"></div><div class="stub"><span class="lbl">' + esc(C.codeLbl) + '</span><span class="code">' + esc(C.code) + '</span><button type="button" class="cp' + (copied ? " ok" : "") + '">' + (copied ? CHECK_SVG + esc(C.copied) : COPY_SVG + esc(C.copy)) + '</button></div><div class="how">' + esc(C.how) + '</div></div>';
  }
  var copiedUntil = 0;
  function coupon() {
    var inner = $("#artdet__main-block .artdet__block-cart-inner"), pb = priceBlock(), e = d.getElementById("kbd-coupon");
    var p = pb ? priceNow() : 0, ok = !!(inner && pb) && !isSale() && p > 0 && withCode(p) > 0;
    if (!ok) { if (e && e.parentNode) e.parentNode.removeChild(e); return; }
    css();
    if (!e) { e = d.createElement("div"); e.id = "kbd-coupon"; e.className = "kbdv-tkt"; }
    var html = couponHtml(money(withCode(p)), Date.now() < copiedUntil);
    if (e.getAttribute("data-k") !== html) { e.innerHTML = html; e.setAttribute("data-k", html); }
    if (e.previousElementSibling !== pb || e.parentNode !== pb.parentNode) pb.parentNode.insertBefore(e, pb.nextSibling);
  }
  d.addEventListener("click", function (ev) {
    var b = ev.target.closest && ev.target.closest("#kbd-coupon .cp");
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
    if (!e) { e = d.createElement("button"); e.type = "button"; e.id = "kbd-notify-tile"; e.className = "kbdv-tile"; e.setAttribute("aria-haspopup", "dialog"); e.innerHTML = '<span class="ic">' + BELL_SVG + '</span><span class="tx"><b>' + esc(N.tileA) + '</b><span>' + esc(N.tileB) + '</span></span><span class="ch">' + CHEV_SVG + '</span>'; }
    if (e.previousElementSibling !== ty || e.parentNode !== ty.parentNode) ty.parentNode.insertBefore(e, ty.nextSibling);
  }
  var S = { size: null, state: "form", err: "", errC: false, email: "", consent: false, last: null };
  function productInfo() {
    var im = $('meta[property="og:image"]'), nm = $("#kbd-pdp-head h1") || $("h1");
    return { img: im ? im.getAttribute("content") : "", name: nm ? txt(nm) : (d.title || "").split("|")[0].trim() };
  }
  function sheetBody() {
    var sizes = oosSizes(), sel = S.size || sizes[0] || "", pi = productInfo(), x = '<button type="button" class="x" aria-label="' + esc(N.close) + '">×</button>';
    var mob = window.innerWidth < 768, head = (mob ? '<div class="grab"></div>' : "") + x;
    if (S.state === "ok") return head + '<div class="okc">' + CHECK_SVG + '</div><p class="ok">' + esc(N.ok.replace(/\{s\}/g, sel)) + '</p><p class="note">' + esc(N.dev) + '</p>';
    return head + '<h3 id="kbdv-h">' + esc(N.title.replace(/\{s\}/g, sel)) + '</h3><p class="tx2">' + esc(N.text.replace(/\{s\}/g, sel)) + '</p>' +
      '<div class="prod">' + (pi.img ? '<img src="' + esc(pi.img) + '" alt="">' : "") + '<div><span class="nm">' + esc(pi.name) + '</span><span class="sz">EU ' + esc(sel) + '</span></div></div>' +
      '<div class="lb">' + esc(N.pick) + '</div><div class="chips">' + sizes.map(function (z) { return '<button type="button" data-s="' + esc(z) + '" class="' + (z === sel ? "on" : "") + '">' + esc(z) + '</button>'; }).join("") + '</div>' +
      '<div class="lb">' + esc(N.email) + '</div><input type="email" autocomplete="email" inputmode="email" placeholder="' + esc(N.ph) + '" value="' + esc(S.email) + '" class="' + (S.err ? "bad" : "") + '">' + (S.err ? '<div class="er" role="alert">' + esc(S.err) + '</div>' : "") +
      '<label class="c"><input type="checkbox"' + (S.consent ? " checked" : "") + '><span>' + esc(N.consent) + esc(N.priv) + '</span></label>' + (S.errC ? '<div class="er" role="alert">' + esc(N.errC) + '</div>' : "") +
      '<button type="button" class="go">' + esc(N.btn) + '</button><p class="note">' + esc(N.dev) + '</p>';
  }
  function openSheet(size) {
    S.size = size || S.size; S.state = "form"; S.err = ""; S.errC = false; S.last = d.activeElement; css();
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
    if (t.id === "kbdv-ov" || t.closest("#kbdv-sh .x")) { closeSheet(); return; }
    var chip = t.closest("#kbdv-sh .chips button");
    if (chip) { saveFields(); S.size = chip.getAttribute("data-s"); rerender(); return; }
    if (t.closest("#kbdv-sh .go")) {
      saveFields(); S.err = ""; S.errC = false;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(S.email.trim())) S.err = N.errE;
      if (!S.consent) S.errC = true;
      if (!S.err && !S.errC) S.state = "ok";
      rerender(); return;
    }
  }, true);
  function saveFields() { var sh = d.getElementById("kbdv-sh"); if (!sh) return; var i = $("input[type=email]", sh), c = $("input[type=checkbox]", sh); if (i) S.email = i.value; if (c) S.consent = c.checked; }
  d.addEventListener("keydown", function (ev) { if ((ev.key === "Escape" || ev.keyCode === 27) && sheetOpen()) closeSheet(); });

  /* ---- futtatás ---- */
  function run() { try { coupon(); tile(); } catch (e) { if (window.console) console.warn("[kbd-pdp2-coupon]", e); } }
  var pb0 = null, mo = null;
  function watch() {
    var pb = priceBlock(); if (!pb || pb === pb0 || !window.MutationObserver) return;
    pb0 = pb; if (mo) mo.disconnect(); var t = 0; mo = new MutationObserver(function () { clearTimeout(t); t = setTimeout(run, 120); }); mo.observe(pb, { childList: true, subtree: true, characterData: true, attributes: true });
  }
  function go() { run(); watch(); }
  if (d.readyState !== "loading") go(); else d.addEventListener("DOMContentLoaded", go);
  window.addEventListener("load", function () { go(); setTimeout(go, 400); });
  if (window.jQuery) window.jQuery(d).on("ajaxComplete", function () { setTimeout(go, 60); });
  var n = 0, iv = setInterval(function () { go(); if (++n > 24) clearInterval(iv); }, 500);
  d.addEventListener("click", function (e) { if (e.target.closest && e.target.closest(".product-type__value--text")) { setTimeout(go, 400); setTimeout(go, 1200); } });
})();
