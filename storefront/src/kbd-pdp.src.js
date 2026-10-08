/* ============================================================================
   KicksByDavid – termékoldal v9 (HU + SK egyben) – 2026-10
   Egy mezőbe, ebben a sorrendben. Domain alapján vált nyelvet:
   a .sk végződésű domain szlovákul, minden más magyarul fut.
   Blokkok: 0) nyelv+szótár  1) v1 CSS  2) v2 CSS  3) DOM-rendező
            4) SK lapfül-fordítás (csak SK)  5) v3 CRO-bővítés
   ============================================================================
   v10: <head>-ből, async töltődik. A CSS azonnal, a DOM-átrendezés a termékblokk beolvasásakor fut
   (MutationObserver), a html.kbd-ready osztályig a mozgatandó blokkok rejtve vannak (CLS).
*/

/* ========================= 0) NYELV + SZÓTÁR ========================= */
(function(){
  var host=(location.hostname||"").split(":")[0].toLowerCase();
  var lang=(document.documentElement.getAttribute("lang")||"").toLowerCase();
  var SK=/\.sk$/.test(host) || lang.indexOf("sk")===0;
  var hu={
    skuLabel:"Gyári cikkszám", copy:"Másolás", copied:"Másolva",
    skuHint:"Másold be a keresőbe, és nézd meg, ugyanez a modell jön-e vissza.",
    trust:[
      {ic:"shield",b:"Dupla pénz vissza, ha hamis",s:"A független vizsgálatot mi fizetjük"},
      {ic:"swap",b:"30 nap ingyenes csere",s:"A cserét és a visszaküldést mi fizetjük"},
      {ic:"ruler",b:"Méretgarancia",s:"Írd meg, mit hordasz, megmondjuk a méreted"},
      {ic:"bell",b:"Szólunk, hol tart",s:"2 munkanap csend után 1 000 Club-pont jár"},
      {ic:"box",b:"Eredeti doboz",s:"Új állapotban érkezik."},
      {ic:"cash",b:"Utánvét",s:"Nem kötelező előre fizetned."}
    ],
    contactQ:"Kérdésed van?", contactCall:"Hívj minket:", phone:"+36 20 556 4258", tel:"+36205564258",
    shipLabel:"Szállítás:", shipOpts:[["Packeta pont / automata","1 096 Ft"],["Packeta házhoz","2 192 Ft"]], cod:"Utánvét +1 100 Ft",
    freeFrom:"Ingyenes szállítás 45 657 Ft-tól", missing:"ehhez a párhoz még <b>%X%</b> hiányzik",
    zoom:"Kép nagyítása",
    sizePick:"Méret (EU)",
    sizeHint:"Nem vagy biztos a méretben? A csere 30 napig ingyenes.",
    sizeChart:"Mérettáblázat",
    cartPrefix:"Kosárba", cartNoSize:" teszem",
    delivery:"5–10 munkanapos szállítás · nyomkövetéssel",
    delLabel:"Várható kézbesítés:", delTrack:"nyomkövetéssel", delMin:5, delMax:10,
    freeship:"Ehhez a párhoz ingyenes a szállítás",
    fixedNoSize:"Kosárba teszem", fixedPrefix:"Kosárba · ",
    oosWord:"elfogyott", oosTitle:"Ez a méret elfogyott",
    benefits:["100% eredeti termék, ellenőrzött európai forrásból","Ingyenes csere 30 napig, ha nem jó a méret","Utánvéttel is fizethetsz, nem kell előre utalnod"],
    more:"Részletes leírás és méretek →",
    payments:["VISA","Mastercard","Utánvét"],
    clarity:"Biztonságos fizetés, utánvéttel is"
  };
  var sk={
    skuLabel:"Kód výrobcu", copy:"Kopírovať", copied:"Skopírované",
    skuHint:"Vlož ho do vyhľadávača a over si, či ti vyhodí ten istý model.",
    trust:[
      {ic:"shield",b:"100 % originálny produkt",s:"Z overených európskych zdrojov"},
      {ic:"swap",b:"Výmena a vrátenie zdarma",s:"Do 30 dní od prevzatia, platíme my"},
      {ic:"lock",b:"Bezpečná platba",s:"Chránená platba kartou"},
      {ic:"chat",b:"Rýchla zákaznícka podpora",s:"Radi vám pomôžeme"},
      {ic:"box",b:"Originálna krabica",s:"Príde v novom stave."},
      {ic:"cash",b:"Dobierka",s:"Nemusíš platiť vopred."}
    ],
    contactQ:"Máš otázku?", contactCall:"Zavolaj nám:", phone:"+421 910 252 548", tel:"+421910252548",
    shipLabel:"Doprava:", shipOpts:[["DPD výdajné miesto / box","4 €"],["DPD na adresu","5 €"]], cod:"Dobierka +3 €",
    freeFrom:"Doprava zdarma od 120 €", missing:"k tomuto páru chýba ešte <b>%X%</b>",
    zoom:"Zväčšiť obrázok",
    sizePick:"Veľkosť (EU)",
    sizeHint:"Nie si si istý veľkosťou? Výmena je 30 dní zdarma.",
    sizeChart:"Tabuľka veľkostí",
    cartPrefix:"Do košíka", cartNoSize:"",
    delivery:"Doručenie za 3-5 pracovných dní · so sledovaním zásielky",
    delLabel:"Predpokladané doručenie:", delTrack:"so sledovaním zásielky", delMin:3, delMax:5,
    freeship:"Pri tomto páre je doprava zdarma",
    fixedNoSize:"Pridám do košíka", fixedPrefix:"Do košíka · ",
    oosWord:"vypredané", oosTitle:"Táto veľkosť je vypredaná",
    benefits:["100 % originál z overených európskych zdrojov","Výmena zdarma do 30 dní, ak nesedí veľkosť","Môžeš platiť na dobierku, nič vopred"],
    more:"Podrobný popis a veľkosti →",
    payments:["VISA","Mastercard","Dobierka"],
    clarity:"Bezpečná platba, aj na dobierku"
  };
  window.KBD={ sk:SK, lang:SK?"sk":"hu", t:SK?sk:hu, FREE_SHIP:SK?120:45657 };
})();

/* ========================= 1) v1 CSS ========================= */
(function(){var LIVE=true,on=LIVE;try{var q=location.search;
if(/[?&]kbdnew=1/.test(q))localStorage.setItem("kbdnew","1");
if(/[?&]kbdnew=0/.test(q))localStorage.removeItem("kbdnew");
if(localStorage.getItem("kbdnew")==="1")on=true;
if(/[?&]kbdoff=1/.test(q))on=false;}catch(e){}
if(!on)return;var d=document,h=d.documentElement;h.classList.add("kbd-pdp");
if(d.getElementById("kbd-pdp-css"))return;
var s=d.createElement("style");s.id="kbd-pdp-css";s.textContent="html.kbd-pdp{--kbd-cream:#F6F3ED;--kbd-white:#FFFFFF;--kbd-ink:#171717;--kbd-brown:#A3481F;--kbd-brown-h:#7F3517;--kbd-muted:#6B6963;--kbd-line:#D8D2C8;--kbd-border:#8C857A;--kbd-ok:#247A52}html.kbd-pdp #artdet__main-block,html.kbd-pdp #artdet__fixed-cart{font-family:Montserrat,Montserrat-fallback,fallback,sans-serif;color:var(--kbd-ink)}html.kbd-pdp #artdet__main-block .artdet__name-wrap,html.kbd-pdp #artdet__main-block .artdet__block-name,html.kbd-pdp #kbd-product-trust-widget,html.kbd-pdp #kbd-packeta-info,html.kbd-pdp #artdet__main-block .artdet__price-discount-period,html.kbd-pdp #artdet__main-block .product-type__title,html.kbd-pdp #artdet__main-block .artdet__cart-btn-input-col,html.kbd-pdp #artdet__main-block .artdet__cart-btn svg,html.kbd-pdp #artdet__main-block .artdet__quick-order-btn svg{display:none!important}html.kbd-pdp body,html.kbd-pdp #ud_shop_artdet,html.kbd-pdp #artdet__main-block,html.kbd-pdp .artdet__sections{background:var(--kbd-white)!important}html.kbd-pdp .artdet__block-left-right-container{padding-top:8px!important;padding-bottom:56px!important}html.kbd-pdp .artdet__block-image{flex:0 0 100%!important;max-width:100%!important}html.kbd-pdp .artdet__block-image-inner{display:block!important;width:100%}html.kbd-pdp .artdet__img-inner{overflow:hidden;width:100%!important;max-width:100%!important;position:relative}html.kbd-pdp .artdet__img-inner .artdet__alts{width:100%!important;max-width:100%!important}html.kbd-pdp .artdet__img-inner picture.artdet__alt-img-outer{display:block;width:100%}html.kbd-pdp .artdet__img-inner img.artdet__alt-img{width:100%!important;max-width:640px;height:auto!important;margin:0 auto;display:block}html.kbd-pdp .artdet__img-inner .stickers-wrap{position:absolute!important;top:16px!important;left:16px!important;right:auto!important;bottom:auto!important;width:auto!important;height:auto!important;z-index:3;transform:none!important}html.kbd-pdp .artdet__img-inner .stickers{display:flex!important;gap:6px;position:static!important}html.kbd-pdp .artdet__img-inner .sticker{width:auto!important;min-width:0!important;white-space:nowrap;border:0!important;color:var(--kbd-ink)!important;font:700 11px/1 Montserrat,Montserrat-fallback,sans-serif!important;text-transform:uppercase}@media (max-width:767.98px){html.kbd-pdp .artdet__img-inner{padding:16px}}html.kbd-pdp .artdet__block-cart,html.kbd-pdp .artdet__block-cart-inner{background:transparent!important;border:0!important;box-shadow:none!important;padding:0!important}html.kbd-pdp .artdet__block-cart-inner{display:flex;flex-direction:column}html.kbd-pdp .artdet__block-cart-inner>.d-flex:empty{display:none!important}html.kbd-pdp .kbd-eyebrow{text-transform:uppercase;color:var(--kbd-muted)}html.kbd-pdp .kbd-title{color:var(--kbd-ink);margin:0 0 10px}html.kbd-pdp .kbd-sub{line-height:1.4}html.kbd-pdp .kbd-skuline{display:flex;flex-wrap:wrap;align-items:center;color:var(--kbd-muted)}html.kbd-pdp .kbd-skuline b{color:var(--kbd-ink)}html.kbd-pdp .kbd-copy{display:inline-flex;align-items:center;gap:5px;border-radius:2px;font:600 12px/1.2 Montserrat,Montserrat-fallback,sans-serif;cursor:pointer}html.kbd-pdp .kbd-copy:hover{border-color:var(--kbd-ink)}html.kbd-pdp .kbd-copy svg{width:13px;height:13px}html.kbd-pdp .kbd-skuhint{flex-basis:100%;color:var(--kbd-muted)}@media (max-width:767.98px){html.kbd-pdp #kbd-pdp-head{padding-top:4px}}html.kbd-pdp #artdet__main-block .artdet__price-and-countdown{margin:14px 0 0!important;row-gap:0!important}html.kbd-pdp #artdet__main-block .artdet__price-and-countdown>div{padding-left:0!important;padding-right:0!important}html.kbd-pdp #artdet__main-block .artdet__prices{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 14px;text-align:left!important;justify-content:flex-start!important}html.kbd-pdp #artdet__main-block .artdet__price-discount,html.kbd-pdp #artdet__main-block .artdet__prices>.product-price--base:only-child,html.kbd-pdp #artdet__main-block .artdet__prices:not(.has-price-sale) .price-gross-format{line-height:1.1;color:var(--kbd-ink)!important;order:1}html.kbd-pdp #artdet__main-block .artdet__price-base{order:2;color:var(--kbd-muted)!important}html.kbd-pdp #artdet__main-block .artdet__sale{order:3;font:700 12px/1 Montserrat,Montserrat-fallback,sans-serif;margin:0!important;align-self:center}html.kbd-pdp #artdet__main-block .artdet__discount-texts{color:var(--kbd-muted)}html.kbd-pdp #artdet__main-block .artdet__discount-saving__value{color:var(--kbd-ink);font-weight:600}@media (max-width:767.98px){html.kbd-pdp #artdet__main-block .artdet__price-discount,html.kbd-pdp #artdet__main-block .artdet__prices:not(.has-price-sale) .price-gross-format{font-size:28px!important}}html.kbd-pdp .kbd-trust{display:flex;align-items:flex-start}html.kbd-pdp .kbd-trust svg{margin-top:1px}html.kbd-pdp .kbd-trust b{display:block;line-height:1.3}html.kbd-pdp .kbd-trust span{display:block;line-height:1.35}@media (max-width:767.98px){html.kbd-pdp #kbd-pdp-trust{gap:14px 12px;padding:16px 0}html.kbd-pdp .kbd-trust b{font-size:13px}html.kbd-pdp .kbd-trust span{font-size:12px}}html.kbd-pdp #kbd-size-head{display:flex;justify-content:space-between;align-items:center;gap:10px}html.kbd-pdp #artdet__main-block #artdet__type{margin:0!important;padding:0!important;border:0!important;background:transparent!important}html.kbd-pdp #artdet__main-block .product-type__item{margin:0!important;padding:0!important}html.kbd-pdp #artdet__main-block .product-type__values--text{display:grid!important;margin:0!important}html.kbd-pdp #artdet__main-block .product-type__value--text{margin:0!important;min-width:0!important;width:auto!important;padding:0!important;display:flex!important;align-items:center;justify-content:center;background:var(--kbd-white)!important;box-shadow:none!important;cursor:pointer;transition:border-color .15s,background .15s}html.kbd-pdp #artdet__main-block .product-type__value--text .product-type__value-link{display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:var(--kbd-ink)!important;font:600 15px/1 Montserrat,Montserrat-fallback,sans-serif!important;text-decoration:none!important;padding:0!important;background:transparent!important;border:0!important}html.kbd-pdp #artdet__main-block .product-type__value--text.is-active{background:var(--kbd-brown)!important;border-color:var(--kbd-brown)!important}html.kbd-pdp #artdet__main-block .product-type__value--text.is-active .product-type__value-link{color:#fff!important}html.kbd-pdp #artdet__main-block .product-type__value--text.is-disabled,html.kbd-pdp #artdet__main-block .product-type__value--text.is-inactive{background:transparent!important;border-color:var(--kbd-line)!important}html.kbd-pdp #artdet__main-block .product-type__value--text.is-disabled .product-type__value-link,html.kbd-pdp #artdet__main-block .product-type__value--text.is-inactive .product-type__value-link{color:var(--kbd-muted)!important;text-decoration:line-through!important}html.kbd-pdp #artdet__main-block .product-type__value--text::before,html.kbd-pdp #artdet__main-block .product-type__value--text::after{display:none!important}html.kbd-pdp #kbd-size-help{display:flex;flex-wrap:wrap;align-items:center;gap:6px 14px;color:var(--kbd-muted)}html.kbd-pdp #kbd-size-help .kbd-size-modal__open-btn{display:inline-flex!important;align-items:center;gap:6px;margin:0!important;padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important;font:600 14px/1.3 Montserrat,Montserrat-fallback,sans-serif!important;text-decoration:underline;text-underline-offset:3px;cursor:pointer;width:auto!important;height:auto!important}html.kbd-pdp #kbd-size-help .kbd-ruler{width:16px;height:16px}html.kbd-pdp #artdet__main-block #artdet__cart{margin:0!important;margin-left:0!important;margin-right:0!important;row-gap:12px}html.kbd-pdp #artdet__main-block #artdet__cart>div{flex:0 0 100%!important;max-width:100%!important;padding-left:0!important;padding-right:0!important}html.kbd-pdp #artdet__main-block .artdet__cart-btn{width:100%;background:var(--kbd-brown)!important;border:0!important;color:#fff!important;box-shadow:none!important;transition:background .15s}html.kbd-pdp #artdet__main-block .artdet__cart-btn:hover,html.kbd-pdp #artdet__main-block .artdet__cart-btn:focus-visible{background:var(--kbd-brown-h)!important}html.kbd-pdp #artdet__main-block .artdet__cart-btn:focus-visible{outline:2px solid var(--kbd-ink);outline-offset:2px}html.kbd-pdp #artdet__main-block .artdet__quick-order-btn{height:auto!important;padding:4px 0!important;background:transparent!important;border:0!important;box-shadow:none!important;color:var(--kbd-ink)!important;text-decoration:underline;text-underline-offset:3px;text-transform:none!important;letter-spacing:0}html.kbd-pdp #artdet__main-block .artdet__quick-order-btn:hover{color:var(--kbd-brown)!important}html.kbd-pdp #kbd-pdp-delivery{display:flex;align-items:center;gap:8px}html.kbd-pdp #artdet__main-block #shipping_progress .title{font-size:13px!important;margin-bottom:14px!important;color:var(--kbd-ink)}html.kbd-pdp #artdet__main-block #shipping_progress .progress-bar{background-color:var(--kbd-brown)!important}html.kbd-pdp #artdet__main-block .artdet__virtual-point-highlighted{font-size:12px;color:var(--kbd-muted);text-align:center;margin:6px 0 0;background:transparent!important;padding:0!important}html.kbd-pdp #artdet__main-block #artdet__functions{gap:8px}html.kbd-pdp #artdet__main-block #artdet__short-descrition{margin-top:18px;font-size:13px;color:var(--kbd-muted)}html.kbd-pdp #kbd-visitor-widget{font-size:13px!important;margin:8px 0 0!important}html.kbd-pdp #artdet__fixed-cart{background:var(--kbd-white)!important;border-top:1px solid var(--kbd-line);box-shadow:0 -4px 16px rgba(23,23,23,.06)!important}html.kbd-pdp #artdet__fixed-cart .fixed-cart__name{font-weight:600;color:var(--kbd-ink)}html.kbd-pdp #artdet__fixed-cart .fixed-cart__btn{background:var(--kbd-brown)!important;border:0!important;color:#fff!important;font:700 14px/1 Montserrat,Montserrat-fallback,sans-serif!important;padding:0 22px!important;min-height:48px}html.kbd-pdp #artdet__fixed-cart .fixed-cart__btn:hover{background:var(--kbd-brown-h)!important}html.kbd-pdp #artdet__main-block .artdet__cart-btn .kbd-btn-price{text-transform:none}@media (max-width:575.98px){html.kbd-pdp #artdet__fixed-cart .fixed-cart__prices .badge,html.kbd-pdp #artdet__fixed-cart .product-price--base{display:none!important}html.kbd-pdp #artdet__fixed-cart .fixed-cart__name{font-size:13px}}html.kbd-pdp #kbd-size-help .kbd-size-modal__open-btn::before,html.kbd-pdp #kbd-size-help .kbd-size-modal__open-btn::after{display:none!important;content:none!important}html.kbd-pdp #kbd-pdp-reviews{width:100%;margin:12px 0 0;display:flex;justify-content:flex-start}html.kbd-pdp #kbd-pdp-reviews .ti-widget{margin:0!important}html.kbd-pdp #kbd-pdp-reviews .ti-widget,html.kbd-pdp #kbd-pdp-reviews .ti-widget-container{width:auto!important;margin-left:0!important;text-align:left!important}html.kbd-pdp #kbd-pdp-reviews .ti-header{justify-content:flex-start!important;margin-left:0!important;padding-left:0!important}@media (max-width:767.98px){html.kbd-pdp #kbd-pdp-reviews{min-height:60px}}html.kbd-pdp #artdet__main-block,html.kbd-pdp #artdet__fixed-cart{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}@media (min-width:992px){html.kbd-pdp .artdet__block-left-col{flex:0 0 58%!important;max-width:58%!important;padding-right:48px}html.kbd-pdp .artdet__block-right-col{flex:0 0 42%!important;max-width:42%!important;padding-left:8px}html.kbd-pdp .artdet__block-cart-inner{max-width:460px}}html.kbd-pdp .artdet__img-inner{padding:24px}html.kbd-pdp .artdet__img-inner .sticker{border-radius:999px!important;padding:6px 11px!important;font-weight:600!important;letter-spacing:.06em}html.kbd-pdp .artdet__block-image img:not(.artdet__alt-img){border-radius:8px}html.kbd-pdp #kbd-pdp-head{padding-top:4px}html.kbd-pdp .kbd-eyebrow{font-size:11px;font-weight:600;letter-spacing:.16em;margin-bottom:12px}html.kbd-pdp .kbd-title{font-size:clamp(24px,2vw,30px);line-height:1.18;font-weight:600;letter-spacing:-.015em;margin-bottom:6px}html.kbd-pdp .kbd-sub{font-size:15px;color:var(--kbd-muted);margin-bottom:14px}html.kbd-pdp .kbd-skuline{font-size:13px;gap:4px 8px}html.kbd-pdp .kbd-skuline b{font-weight:500;letter-spacing:.04em}html.kbd-pdp .kbd-copy{border:0;background:transparent;padding:0;font-weight:500;font-size:13px;color:var(--kbd-ink);text-decoration:underline;text-underline-offset:3px;text-decoration-color:var(--kbd-line)}html.kbd-pdp .kbd-copy:hover{text-decoration-color:var(--kbd-ink)}html.kbd-pdp .kbd-copy svg{display:none}html.kbd-pdp .kbd-skuhint{font-size:12px;line-height:1.45}html.kbd-pdp #artdet__main-block .artdet__price-and-countdown{margin-top:18px!important}html.kbd-pdp #artdet__main-block .artdet__price-base{font-weight:400}html.kbd-pdp #artdet__main-block .artdet__discount-texts{font-size:12px}html.kbd-pdp #kbd-pdp-trust{border:0;margin-top:26px}html.kbd-pdp .kbd-trust svg{flex-basis:17px;stroke-width:1.5}html.kbd-pdp #artdet__main-block .product-type__values--text{gap:8px;grid-template-columns:repeat(auto-fill,minmax(72px,1fr))}html.kbd-pdp #artdet__main-block .product-type__value--text{height:48px;border:1px solid var(--kbd-line)!important}html.kbd-pdp #artdet__main-block .product-type__value--text .product-type__value-link{font-weight:500!important;font-size:14px!important}html.kbd-pdp #artdet__main-block .product-type__value--text:hover{border-color:var(--kbd-ink)!important}html.kbd-pdp #artdet__main-block .product-type__value--text.is-active{box-shadow:none!important}@media (max-width:767.98px){html.kbd-pdp #artdet__main-block .product-type__values--text{grid-template-columns:repeat(auto-fill,minmax(58px,1fr));gap:6px}html.kbd-pdp #artdet__main-block .product-type__value--text{height:46px}}html.kbd-pdp #kbd-size-help{font-size:12.5px}html.kbd-pdp #kbd-size-help .kbd-size-modal__open-btn{font-size:13px!important;font-weight:500!important;color:var(--kbd-ink)!important;text-decoration-color:var(--kbd-line)}html.kbd-pdp #kbd-size-help .kbd-size-modal__open-btn:hover{color:var(--kbd-ink)!important;text-decoration-color:var(--kbd-ink)}html.kbd-pdp #kbd-size-help .kbd-ruler{color:var(--kbd-ink)}html.kbd-pdp #artdet__main-block .artdet__cart-btn{height:56px;border-radius:999px!important;font:600 15px/1 Montserrat,Montserrat-fallback,sans-serif!important;letter-spacing:.005em;text-transform:none}html.kbd-pdp #artdet__main-block .artdet__cart-btn .kbd-btn-price{font-weight:500;opacity:.9;letter-spacing:0}html.kbd-pdp #artdet__main-block .artdet__quick-order-btn{font-size:13px!important;font-weight:500!important;text-decoration-color:var(--kbd-line)}html.kbd-pdp #kbd-pdp-delivery{margin-top:6px}html.kbd-pdp #kbd-pdp-delivery svg{width:16px;height:16px;stroke-width:1.5}html.kbd-pdp #artdet__main-block #shipping_progress{border-top:0;margin-top:22px;background:var(--kbd-cream)!important;border-radius:12px;box-shadow:none!important}html.kbd-pdp #artdet__main-block #shipping_progress>*{box-shadow:none!important;background:transparent!important;border:0!important}html.kbd-pdp #artdet__main-block #shipping_progress .progress{height:4px!important;border-radius:999px;background:var(--kbd-line)!important;overflow:visible}html.kbd-pdp #artdet__main-block #artdet__functions{border-top:0;margin-top:10px;padding-top:0}html.kbd-pdp #artdet__fixed-cart .fixed-cart__btn{border-radius:999px!important;text-transform:none;letter-spacing:0;font-weight:600!important;font-size:14px!important}html.kbd-pdp #artdet__main-block #shipping_progress{padding:18px 22px 46px!important}html.kbd-pdp #kbd-pdp-reviews{min-height:44px!important;margin-top:8px}@media (max-width:767.98px){html.kbd-pdp .kbd-title{font-size:22px}}html.kbd-pdp #artdet__main-block .product-type__value--text.kbd-oos{background:var(--kbd-white)!important;border-color:var(--kbd-line)!important;border-style:dashed!important}html.kbd-pdp #artdet__main-block .product-type__value--text.kbd-oos .product-type__value-link{color:var(--kbd-muted)!important;opacity:.75;text-decoration:line-through!important;text-decoration-thickness:1px!important}html.kbd-pdp #artdet__main-block .product-type__value--text.kbd-oos:hover{border-color:var(--kbd-border)!important}html.kbd-pdp #artdet__main-block .product-type__value--text.kbd-oos.is-active{border:1.5px solid var(--kbd-brown)!important;border-style:solid!important}html.kbd-pdp #artdet__main-block .product-type__value--text.kbd-oos.is-active .product-type__value-link{color:var(--kbd-brown)!important}html.kbd-pdp .artdet__sections{font-family:Montserrat,Montserrat-fallback,sans-serif;color:var(--kbd-ink)}html.kbd-pdp .artdet__sections .nav-tabs-outer{border-bottom:1px solid var(--kbd-line)!important;background:transparent!important}html.kbd-pdp .artdet__sections .artdet-tabs{justify-content:center;gap:4px 28px;border:0!important}html.kbd-pdp .artdet__sections .artdet-tabs .nav-link{font-size:14px!important;font-weight:500!important;color:var(--kbd-muted)!important;background:transparent!important;border:0!important;border-bottom:2px solid transparent!important;border-radius:0!important;padding:16px 2px 14px!important;letter-spacing:.01em}html.kbd-pdp .artdet__sections .artdet-tabs .nav-link:hover{color:var(--kbd-ink)!important}html.kbd-pdp .artdet__sections .artdet-tabs .nav-link.active{color:var(--kbd-ink)!important;font-weight:600!important;border-bottom-color:var(--kbd-brown)!important}html.kbd-pdp .artdet__sections .pane-header-btn{font-size:15px!important;font-weight:600!important;color:var(--kbd-ink)!important}html.kbd-pdp .artdet__sections .pane-header-btn.active{color:var(--kbd-ink)!important}html.kbd-pdp .artdet__sections .tab-pane__container{max-width:760px!important;margin:0 auto;padding-top:36px;padding-bottom:36px;text-align:left!important}html.kbd-pdp .artdet__sections .tab-pane__container>div,html.kbd-pdp .artdet__sections .long-description__content>div{font-size:15px!important;line-height:1.75!important}html.kbd-pdp .artdet__sections .tab-pane p{font-size:15px;line-height:1.75;color:var(--kbd-ink);margin:0 0 12px}html.kbd-pdp .artdet__sections .tab-pane strong{color:var(--kbd-ink);font-weight:600}html.kbd-pdp .artdet__sections .tab-pane h2{font-size:18px!important;line-height:1.35!important;font-weight:600!important;letter-spacing:-.005em;color:var(--kbd-ink)!important;margin:34px 0 10px!important}html.kbd-pdp .artdet__sections .tab-pane h2:first-child{margin-top:0!important}html.kbd-pdp .artdet__sections .tab-pane h3{font-size:15px!important;line-height:1.45!important;font-weight:600!important;color:var(--kbd-ink)!important;margin:22px 0 6px!important}html.kbd-pdp .artdet__sections .tab-pane h2+h3{margin-top:12px!important}@media (max-width:767.98px){html.kbd-pdp .artdet__sections .tab-pane h2{font-size:17px!important;margin-top:28px!important}html.kbd-pdp .artdet__sections .tab-pane__container{padding-top:24px;padding-bottom:24px}}html.kbd-pdp .artdet__sections .tab-pane hr{border:0;border-top:1px solid var(--kbd-line);margin:36px 0}html.kbd-pdp .artdet__sections .tab-pane table{width:100%;border-collapse:collapse!important;font-size:14px!important;margin:6px 0 8px;border:0!important}html.kbd-pdp .artdet__sections .tab-pane table td,html.kbd-pdp .artdet__sections .tab-pane table th{border:0!important;border-bottom:1px solid var(--kbd-line)!important;padding:11px 0!important;vertical-align:top;text-align:left}html.kbd-pdp .artdet__sections .tab-pane table tr td:first-child{color:var(--kbd-muted);width:42%!important;padding-right:16px!important}html.kbd-pdp .artdet__sections .tab-pane table tr:first-child td{border-top:1px solid var(--kbd-line)!important}html.kbd-pdp .artdet__sections .tab-pane table strong{font-weight:500}html.kbd-pdp #pane-data .data__item{border-bottom:1px solid var(--kbd-line);padding:11px 0;font-size:14px}html.kbd-pdp .artdet__sections .tab-pane h2,html.kbd-pdp .artdet__sections .tab-pane h3,html.kbd-pdp .artdet__sections .pane-header-btn{text-transform:none!important}";(d.head||h).appendChild(s);})();

/* ========================= 2) v2 CSS ========================= */
(function(){var d=document,h=d.documentElement;if(!h.classList.contains("kbd-pdp"))return;
if(!d.getElementById("kbd-pdp-css2")){
var s=d.createElement("style");s.id="kbd-pdp-css2";s.textContent="html.kbd-pdp .artdet__pagination{display:none!important}html.kbd-pdp #page_artdet_product_param_spec_8949406{display:none!important}html.kbd-pdp #ak-widget{display:none!important}html.kbd-pdp #artdet__short-descrition{display:none!important}html.kbd-pdp #kbd-pdp-freeship{display:flex;align-items:center;gap:8px;margin:10px 0 2px;color:var(--kbd-ok);font:600 14px/1.35 Montserrat,Montserrat-fallback,sans-serif}html.kbd-pdp #kbd-pdp-freeship svg{width:18px;height:18px;flex:none}html.kbd-pdp #artdet__main-block .artdet__quick-order-btn{min-height:48px!important;padding:0 16px!important;border:1.5px solid var(--kbd-ink)!important;border-radius:4px!important;background:transparent!important;font:700 14px/1 Montserrat,Montserrat-fallback,sans-serif!important;text-decoration:none!important;display:flex!important;align-items:center;justify-content:center;width:100%}html.kbd-pdp #artdet__main-block .artdet__quick-order-btn:hover{background:var(--kbd-ink)!important;color:#fff!important}html.kbd-pdp.fixed-cart-on-artdet-visible #fb_header_box{bottom:calc(var(--fixed-cart-height-on-artdet,64px) + 10px)!important;transition:bottom .25s ease}@media (max-width:767.98px){html.kbd-pdp .artdet__img-inner{padding:8px 16px!important}html.kbd-pdp .artdet__img-inner img.artdet__alt-img{max-height:24vh;width:auto!important;max-width:100%!important}html.kbd-pdp .artdet__img-inner .flickity-viewport{height:calc(24vh + 8px)!important}html.kbd-pdp .artdet__thumb-images{display:none!important}html.kbd-pdp #kbd-pdp-reviews .ti-header{padding:6px 0!important}html.kbd-pdp #kbd-size-head{padding-top:14px!important;margin-top:12px!important}html.kbd-pdp #artdet__main-block .artdet__price-and-countdown{margin-top:8px!important}html.kbd-pdp #fb_header_box,html.kbd-pdp #fb_content_box{display:none!important}}";(d.head||h).appendChild(s);}
try{var T=window.Tawk_API=window.Tawk_API||{};T.customStyle=T.customStyle||{visibility:{desktop:{position:"br",xOffset:20,yOffset:90},mobile:{position:"br",xOffset:10,yOffset:80}}};}catch(e){}})();

/* ========================= 2b) Korai elrejtés a végleges elrendezésig (CLS) ========================= */
(function(){var d=document,h=d.documentElement;if(!h.classList.contains("kbd-pdp"))return;
setTimeout(function(){h.classList.add("kbd-ready");},4000);
/* késői futás (a termékblokk már kirajzolódott, pl. régi, lap alji betöltő): a v9-cel azonos viselkedés, nincs előzetes rejtés */
if(!d.getElementById("kbd-pdp-css0") && d.getElementById("artdet__main-block")){ window.KBD_late=true; return; }
if(d.getElementById("kbd-pdp-css0"))return;
var s=d.createElement("style");s.id="kbd-pdp-css0";
s.textContent="html.kbd-pdp:not(.kbd-ready) #artdet__main-block .artdet__block-cart-inner,html.kbd-pdp:not(.kbd-ready) #artdet__short-descrition{visibility:hidden!important}"+
/* galéria: a Flickity indulása előtt is a végleges méretet foglalja (első kép látszik, a többi rejtve) */
"html.kbd-pdp .artdet__alts.carousel:not(.flickity-enabled){opacity:1!important;min-height:var(--kbd-alts-h,0px)}"+
"html.kbd-pdp .artdet__alts.carousel:not(.flickity-enabled)>.carousel-cell:not(:first-child){display:none!important}"+
"html.kbd-pdp.kbd-alts-fix .artdet__alts .flickity-viewport{height:var(--kbd-alts-h)!important}"+
/* bélyegképek: indulás előtt is egy sorban, ne egymás alatt */
"html.kbd-pdp .artdet__thumb-images.carousel:not(.flickity-enabled){display:flex!important;flex-wrap:nowrap!important;overflow:hidden!important}"+
"html.kbd-pdp .artdet__thumb-images.carousel:not(.flickity-enabled)>.carousel-cell{flex:0 0 auto}"+
/* a mérettáblázat-script a modalba költözteti az 1. lapfület: addig se foglaljon helyet a kép alatt */
"html.kbd-pdp:not(.kbd-ready) #artdet__video,html.kbd-pdp #artdet__video.kbd-sc-pending{display:none!important}";
(d.head||h).appendChild(s);
})();

/* ========================= 3) DOM-rendező (HU + SK) ========================= */
(function () {
  "use strict";
  var root = document.documentElement;
  if (!root.classList.contains("kbd-pdp")) return;
  var K = window.KBD || { sk:false, t:{}, FREE_SHIP:50000 };
  var T = K.t, SK = K.sk;

  var I = {
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l7 3v6c0 4.2-3 7.6-7 9-4-1.4-7-4.8-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/></svg>',
    swap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 010 10h-3"/></svg>',
    box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>',
    cash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="6" width="19" height="12" rx="1.5"/><circle cx="12" cy="12" r="2.5"/><path d="M6 9.5v5M18 9.5v5"/></svg>',
    truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 6h11v10H2z"/><path d="M13 9h4l4 4v3h-8"/><circle cx="6" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/></svg>',
    ruler: '<svg class="kbd-ruler" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 17L17 3l4 4L7 21z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10.3 20a1.9 1.9 0 0 0 3.4 0"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 10h18M8 2.5v4M16 2.5v4"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="1.5"/><path d="M16 8V5.5A1.5 1.5 0 0014.5 4h-9A1.5 1.5 0 004 5.5v9A1.5 1.5 0 005.5 16H8"/></svg>'
  };

  window.KBDI = I;
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function txt(el) { return el ? (el.textContent || "").replace(/\s+/g, " ").trim() : ""; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function param(name) {
    var out = "";
    $$("#pane-data .data__item").forEach(function (d) {
      var t = txt(d), i = t.indexOf(":");
      if (i > 0 && t.slice(0, i).trim().toLowerCase() === name.toLowerCase()) out = t.slice(i + 1).trim();
    });
    return out;
  }

  function splitName(full) {
    var m = full.match(/^(.*?)\s+((?:dámske|pánske|unisex|detské|chlapčenské|dievčenské|női|férfi|gyerek|fiú|lány)\b.*)$/i);
    if (m && m[1].length > 3) return [m[1], m[2].charAt(0).toUpperCase() + m[2].slice(1)];
    return [full, ""];
  }

  function factorySku(unasSku) {
    var sd = txt($("#artdet__short-descrition"));
    var m = sd.match(/(?:Kód výrobcu|Gyári cikkszám|SKU)[:\s]+([A-Z0-9][A-Z0-9-]{3,})/i);
    if (m) return m[1].replace(/[-.]+$/, "");
    var mpn = param("MPN");
    if (mpn) return mpn;
    return unasSku.replace(/-\d{1,2}(?:-5)?$/, "");
  }

  function buildHead(inner) {
    if ($("#kbd-pdp-head")) return;
    var nameEl = $(".artdet__name");
    var full = nameEl ? (nameEl.getAttribute("title") || txt(nameEl)).trim() : txt($("h1"));
    var parts = splitName(full);
    var brand = param("Značka") || param("Márka"), model = param("Modelový rad") || param("Modellcsalád");
    if (!brand) {
      var bc = $$(".breadcrumb--desktop li").map(txt).filter(Boolean);
      brand = bc[1] || ""; model = model || bc[bc.length - 1] || "";
    }
    var eyebrow = [brand, model && model.toLowerCase() !== brand.toLowerCase() ? model : ""].filter(Boolean).join(" · ");
    var unasSku = (window.UNAS && UNAS.shop && UNAS.shop.sku) || txt($(".artdet__sku-value"));
    var fsku = factorySku(unasSku);

    var head = document.createElement("div");
    head.id = "kbd-pdp-head";
    head.innerHTML =
      (eyebrow ? '<div class="kbd-eyebrow">' + esc(eyebrow) + "</div>" : "") +
      '<div class="kbd-title" aria-hidden="true">' + esc(parts[0]) + "</div>" +
      (parts[1] ? '<div class="kbd-sub">' + esc(parts[1]) + "</div>" : "") +
      (fsku ? '<div class="kbd-skuline">' + T.skuLabel + ': <b>' + esc(fsku) + '</b>' +
        '<button type="button" class="kbd-copy" data-sku="' + esc(fsku) + '">' + I.copy + "<span>" + T.copy + "</span></button>" +
        '<span class="kbd-skuhint">' + T.skuHint + '</span></div>' : "");
    inner.insertBefore(head, inner.firstChild);

    var btn = $(".kbd-copy", head);
    if (btn) btn.addEventListener("click", function () {
      var s = btn.getAttribute("data-sku"), label = $("span", btn);
      function done() { label.textContent = T.copied; setTimeout(function () { label.textContent = T.copy; }, 2000); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(s).then(done, done);
      else { var ta = document.createElement("textarea"); ta.value = s; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); } catch (e) {} ta.remove(); done(); }
    });
  }

  function buildReviews(head) {
    if ($("#kbd-pdp-reviews")) return;
    var rv = document.createElement("div");
    rv.id = "kbd-pdp-reviews";
    var sc = document.createElement("script");
    sc.defer = true; sc.async = true;
    sc.src = "https://cdn.trustindex.io/loader.js?0d3908782f85181dd586d19e174";
    rv.appendChild(sc);
    head.appendChild(rv);
  }

  function buildTrust(after) {
    if ($("#kbd-pdp-trust")) return;
    var t = document.createElement("div");
    t.id = "kbd-pdp-trust";
    t.innerHTML = T.trust.map(function (x) {
      return '<div class="kbd-trust">' + I[x.ic] + "<div><b>" + x.b + "</b><span>" + x.s + "</span></div></div>";
    }).join("");
    after.parentNode.insertBefore(t, after.nextSibling);
  }

  function buildSize(type) {
    if (!$("#kbd-size-head")) {
      var hd = document.createElement("div");
      hd.id = "kbd-size-head";
      hd.innerHTML = '<span class="kbd-size-label">' + T.sizePick + '</span><span class="kbd-size-right"></span>';
      type.parentNode.insertBefore(hd, type);
      var stock = $(".artdet__stock");
      if (stock && !$("#kbd-stock-line")) {
        var sl = document.createElement("div"), oldWrap = stock.parentNode;
        sl.id = "kbd-stock-line";
        sl.appendChild(stock);
        hd.parentNode.insertBefore(sl, hd);
        if (oldWrap && !oldWrap.children.length) oldWrap.style.display = "none";
      }
    }
    $$(".product-type__value--text .product-type__option-name", type).forEach(function (s) {
      if (s.dataset.kbd) return;
      s.dataset.kbd = "1";
      s.textContent = txt(s).replace(/^EU\s+/i, "").replace(/(\d)\.(\d)/, "$1,$2");
    });
    $$(".product-type__value--text", type).forEach(function (v) {
      var m = txt($(".product-type__option-name", v)).match(/(\d+(?:[.,]\d+)?)(?:\s+(\d)\/(\d))?/);
      if (m) v.style.order = Math.round((parseFloat(m[1].replace(",", ".")) + (m[2] ? m[2] / m[3] : 0)) * 100);
    });
    if (!$("#kbd-size-help")) {
      var help = document.createElement("div");
      help.id = "kbd-size-help";
      help.innerHTML = '<span class="kbd-size-hint">' + T.sizeHint + '</span>';
      type.parentNode.insertBefore(help, type.nextSibling);
    }
    placeSizeChartBtn();
  }

  function placeSizeChartBtn() {
    var b = $(".kbd-size-modal__open-btn"), help = $("#kbd-size-head .kbd-size-right") || $("#kbd-size-help");
    if (!b || !help) return;
    if (!b.dataset.kbd) { b.dataset.kbd = "1"; b.innerHTML = I.ruler + "<span>" + esc(txt(b) || T.sizeChart) + "</span>"; }
    if (b.parentNode !== help) help.appendChild(b);
  }

  function priceText() {
    var p = $("#artdet__main-block .artdet__price-discount .price-gross-format") ||
            $("#artdet__main-block .artdet__prices .price-gross-format");
    return txt(p);
  }

  function addBiz(from, n) {
    var dt = new Date(from.getTime());
    while (n > 0) { dt.setDate(dt.getDate() + 1); var w = dt.getDay(); if (w !== 0 && w !== 6) n--; }
    return dt;
  }
  function fmtDay(dt) {
    if (SK) return dt.getDate() + ". " + (dt.getMonth() + 1) + ".";
    var M = ["jan.", "febr.", "márc.", "ápr.", "máj.", "jún.", "júl.", "aug.", "szept.", "okt.", "nov.", "dec."];
    return M[dt.getMonth()] + " " + dt.getDate() + ".";
  }
  function deliveryHTML() {
    if (!T.delMin) return T.delivery;
    var now = new Date();
    return T.delLabel + " <b>" + fmtDay(addBiz(now, T.delMin)) + " – " + fmtDay(addBiz(now, T.delMax)) + "</b> · " + T.delTrack;
  }

  function buildCart(cart) {
    var btn = $(".artdet__cart-btn", cart);
    if (btn && !btn.dataset.kbd) {
      btn.dataset.kbd = "1";
      var p = priceText(), sz = sizeLabel();
      btn.innerHTML = "<span>" + T.cartPrefix + (sz ? " · " + esc(sz) : T.cartNoSize) + "</span>" + (p ? '<span class="kbd-btn-price"> · ' + esc(p) + "</span>" : "");
    }
    if (!$("#kbd-pdp-delivery")) {
      var dv = document.createElement("div");
      dv.id = "kbd-pdp-delivery";
      dv.innerHTML = I.cal + "<span>" + deliveryHTML() + "</span>";
      cart.parentNode.insertBefore(dv, cart.nextSibling);
    }
  }

  /* Csak a kiválasztott méretet jelöljük, ha elfogyott. A többi méret oldalát NEM töltjük le:
     a sok háttér-lekérés miatt az Unas ideiglenesen letilthatja a látogatót. */
  function markSize(v) {
    v.classList.add("kbd-oos");
    var a = $(".product-type__value-link", v);
    var re = new RegExp(T.oosWord, "i");
    if (a && !re.test(a.getAttribute("aria-label") || "")) a.setAttribute("aria-label", (a.getAttribute("aria-label") || "") + " – " + T.oosWord);
    v.setAttribute("title", T.oosTitle);
  }
  function checkSizes() {
    var type = $("#artdet__type");
    if (!type || type.dataset.kbdStock) return;
    type.dataset.kbdStock = "1";
    var own = $(".artdet__stock");
    var act = $(".product-type__value--text.is-active", type);
    if (act && own && own.classList.contains("no-stock")) markSize(act);
  }

  function ensureSingle(inner) {
    if ($("#artdet__type")) return;
    var v = "";
    $$(".artdet__spec-param").forEach(function (p) {
      var n = txt($(".param-name", p) || $(".artdet__spec-param-title", p));
      if (!v && /^(Méret|Veľkosť|Velkost)/i.test(n)) v = txt(p).replace(/^[^:]*:\s*/, "");
    });
    if (!v) return;
    var dd = document.createElement("div");
    dd.id = "artdet__type";
    dd.className = "product-type product-type--button kbd-single-size";
    dd.innerHTML = '<div class="product-type__item type--text"><div class="product-type__values product-type__values--text">' +
      '<div class="product-type__value product-type__value--text is-active is-base"><a class="product-type__value-link" href="' + esc(location.href) + '" onclick="return false;" aria-current="true" aria-label="' + esc(v) + '">' +
      '<span class="product-type__option-name text-truncate">' + esc(v) + '</span></a></div></div></div>';
    var cart = $("#artdet__cart", inner);
    inner.insertBefore(dd, cart || null);
  }

  function sizeLabel() {
    var a = $("#artdet__type .product-type__value.is-active .product-type__option-name");
    var v = txt(a).replace(/^EU\s+/i, "");
    if (!v) return "";
    return /^\d/.test(v) ? "EU " + v : v;
  }
  function priceValue() {
    if (SK) { var n = parseFloat(priceText().replace(/[^\d,.]/g, "").replace(",", ".")); return isNaN(n) ? 0 : n; }
    var h = parseInt(priceText().replace(/[^\d]/g, ""), 10); return isNaN(h) ? 0 : h;
  }
  function buildFreeShip(inner) {
    if ($("#kbd-pdp-freeship") || priceValue() < K.FREE_SHIP) return;
    var cart = $("#artdet__cart", inner);
    if (!cart) return;
    var dv = document.createElement("div");
    dv.id = "kbd-pdp-freeship";
    dv.innerHTML = I.truck + "<span>" + T.freeship + "</span>";
    cart.parentNode.insertBefore(dv, cart.nextSibling);
  }

  var FIXES = [
    [/\b14 (nap(?:ig|on|od|os|ja)?)\b/g, "30 $1"],
    [/\ba Air Max\b/g, "az Air Max"],
    [/visseljük/g, "viseljük"]
  ];
  function removeSection(pane, re) {
    $$("h2,h3,h4", pane).forEach(function (hh) {
      if (!re.test(txt(hh))) return;
      var n = hh.nextElementSibling;
      while (n && !/^H[2-4]$/.test(n.tagName)) { var x = n; n = n.nextElementSibling; x.remove(); }
      hh.remove();
    });
  }
  function fixCopy() {
    if (SK) return; // a szövegjavítások magyar nyelvűek
    ["#pane-details", "#pane-custom-section-2", "#pane-custom-section-3"].forEach(function (sel) {
      var pane = $(sel);
      if (!pane || pane.dataset.kbdFix) return;
      pane.dataset.kbdFix = "1";
      var w = document.createTreeWalker(pane, NodeFilter.SHOW_TEXT, null), t;
      while ((t = w.nextNode())) {
        var v = t.nodeValue, o = v;
        FIXES.forEach(function (f) { v = v.replace(f[0], f[1]); });
        if (v !== o) t.nodeValue = v;
      }
      removeSection(pane, /^Kinek való/i);
      removeSection(pane, /^Mennyibe kerül a szállítás/i);
    });
    if (!$(".kbd-size-modal__open-btn")) {
      $$("#pane-details p").forEach(function (p) {
        if (/mérettáblázat/i.test(txt(p))) p.innerHTML = p.innerHTML.replace(/A méretválasztó mellett ott a mérettáblázat[^.]*\.\s*/i, "");
      });
    }
  }

  function run() {
    var inner = $("#artdet__main-block .artdet__block-cart-inner");
    if (!inner) return;
    buildHead(inner);
    var head = $("#kbd-pdp-head");
    buildReviews(head);
    var price = $(".artdet__price-and-countdown", inner);
    if (price && price.previousElementSibling !== head) head.parentNode.insertBefore(price, head.nextSibling);
    buildTrust(price || head);
    ensureSingle(inner);
    var type = $("#artdet__type", inner);
    var trust = $("#kbd-pdp-trust");
    if (type) {
      if (trust && trust.nextElementSibling !== type && !$("#kbd-size-head")) trust.parentNode.insertBefore(type, trust.nextSibling);
      buildSize(type);
    }
    var cart = $("#artdet__cart", inner);
    var anchor = $("#kbd-size-help") || trust;
    if (cart && anchor && anchor.nextElementSibling !== cart) anchor.parentNode.insertBefore(cart, anchor.nextSibling);
    if (cart) buildCart(cart);
    var del = $("#kbd-pdp-delivery"), tr = $("#kbd-pdp-trust"), skl = $(".kbd-skuline");
    var tAnchor = $("#kbd3-contact") || $("#kbd3-shipinfo") || del;
    if (tAnchor && tr && tAnchor.nextElementSibling !== tr) tAnchor.parentNode.insertBefore(tr, tAnchor.nextSibling);
    var pay = $("#kbd3-pay"), sAnchor = pay || tr;
    if (sAnchor && skl && sAnchor.nextElementSibling !== skl) sAnchor.parentNode.insertBefore(skl, sAnchor.nextSibling);
    var sd = $("#artdet__short-descrition");
    if (sd && sd.parentNode !== inner) inner.appendChild(sd);
    var fb = $("#artdet__fixed-cart .fixed-cart__btn");
    if (fb && !fb.dataset.kbd) { var fsz = sizeLabel(); fb.dataset.kbd = "1"; fb.textContent = fsz ? T.fixedPrefix + fsz : T.fixedNoSize; }
    buildFreeShip(inner);
    fixCopy();
  }

  var sizeMo = null;
  function safeRun() {
    try { run(); } catch (e) { if (window.console) console.warn("[kbd-pdp]", e); }
    var inner = $("#artdet__main-block .artdet__block-cart-inner");
    if (inner && !sizeMo && window.MutationObserver) {
      sizeMo = new MutationObserver(function () { try { placeSizeChartBtn(); } catch (e) {} });
      sizeMo.observe(inner, { childList: true, subtree: false });
      setTimeout(function () { sizeMo.disconnect(); }, 15000);
    }
  }
  /* a 6) blokk hívja, amint a termékblokk beolvasódott */
  window.KBD_run = safeRun;
  function onDom(f) { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", f); else setTimeout(f, 0); }
  function onLoad(f) { if (document.readyState === "complete") setTimeout(f, 0); else window.addEventListener("load", f); }
  onDom(function () {
    safeRun();
    setTimeout(function () { try { checkSizes(); } catch (e) {} }, 300);
  });
  onLoad(function () {
    safeRun();
    setTimeout(function () { try { checkSizes(); } catch (e) {} }, 200);
  });
})();

/* ========================= 4) SK lapfül-fordítás (csak SK domainen) ========================= */
(function () {
  "use strict";
  if (!(window.KBD && window.KBD.sk)) return;
  var H3 = '<h3 style="margin:18px 0 6px">', H3F = '<h3 style="margin:0 0 6px">';
  var MAP = {
    "Szállítás és átvétel": {
      title: "Doručenie a prevzatie",
      html: '<div style="font-size:15px;line-height:1.7">' +
        H3F + 'Ako dlho trvá doručenie?</h3><p><strong>3–5 pracovných dní</strong> a nemusíš sa nás na nič pýtať: e-mailom ti dáme vedieť, v akom stave je tvoj balík, a po odoslaní dostaneš číslo na sledovanie zásielky.</p>' +
        H3 + 'Prečo nie za 1–2 dni?</h3><p>Páry nakupujeme od overených európskych veľkoobchodných partnerov. Často ide o modely a veľkosti, ktoré u nás už nezoženieš. Táto cesta trvá dlhšie, zato výber aj ceny sú úplne inde.</p>' +
        H3 + 'Dá sa platiť na dobierku?</h3><p>Áno, s príplatkom <strong>3 €</strong>. Platíš pri prevzatí, v hotovosti alebo kartou, takže peniaze máš u seba, kým balík nedorazí. V DPD Pickup Boxe a AlzaBoxe sa dá platiť iba kartou. Ak chceš dobierku, vyber si výdajné miesto alebo doručenie na adresu.</p>' +
        H3 + 'Čo ak ti veľkosť nesedí?</h3><p><strong>Výmenu aj vrátenie platíme my.</strong> Máš na to 30 dní od prevzatia, bez udania dôvodu. Celý postup nájdeš na stránke <a href="/vratenie">Vrátenie tovaru</a>.</p>' +
        '<p>Do balíka prilož krátku správu so šiestimi údajmi: číslo objednávky, meno, telefónne číslo, e-mail, či ide o vrátenie alebo výmenu, a pri výmene aj novú veľkosť. Topánky pošli nenosené a čisté, v originálnej krabici a vo vonkajšom obale.</p>' +
        H3 + 'Čo ak sa moja veľkosť vypredá?</h3><p>Ozveme sa ti a vrátime ti celú kúpnu cenu. Ku každej objednávke posielame elektronickú faktúru a zákaznícka podpora odpovedá do 1 pracovného dňa.</p></div>'
    },
    "Eredetiség és ápolás": {
      title: "Originalita a starostlivosť",
      html: '<div style="font-size:15px;line-height:1.7">' +
        H3F + 'Ako zistím, že je to originál?</h3><p>Nápis „100 % originál“ nájdeš na každom e-shope, aj na podvodných. U nás preto dôkazom nie je on, ale tieto tri veci:</p>' +
        '<p><strong>1. Kód výrobcu je uvedený.</strong> Nájdeš ho na tejto stránke. Vlož ho do vyhľadávača a over si, či ti vyhodí ten istý model.</p>' +
        '<p><strong>2. Firma vystupuje pod svojím menom.</strong> KICKSBYDAVID s.r.o., DIČ 2121629928, uvedená adresa, telefón, ktorý niekto zdvihne, a e-mail, na ktorý odpovedáme do 1 pracovného dňa.</p>' +
        '<p><strong>3. Riziko nesieme my.</strong> Môžeš platiť na dobierku, takže peniaze máš u seba až do prevzatia. Ak niečo nesedí, vrátenie aj výmenu platíme my.</p>' +
        H3 + 'Odkiaľ páry pochádzajú?</h3><p>Od overených európskych veľkoobchodných partnerov, nové a v originálnej krabici. Často ide o modely a veľkosti, ktoré u nás v obchodoch už nekúpiš.</p>' +
        H3 + 'Ako ich udržať ako nové?</h3>' +
        '<p><strong>Pred prvým nosením:</strong> impregnačný sprej v dvoch tenkých vrstvách urobí viac než akékoľvek neskoršie čistenie.</p>' +
        '<p><strong>Minúta týždenne:</strong> mäkkou kefkou ich nasucho oprášiš. Čerstvý prach ide dole ľahko, zaschnutá škvrna už nie.</p>' +
        '<p><strong>Dôkladné čistenie:</strong> vlažná voda, pár kvapiek jemného saponátu, mäkká kefka a krúživé pohyby. Topánky nikdy neponáraj do vody.</p>' +
        '<p><strong>Podľa materiálu:</strong> na kožu mäkká handrička a prípravok na kožu; na semiš iba suchá kefka a guma na semiš; textil jemne vyčisti penou; na medzipodrážku je najrýchlejšia guma.</p>' +
        '<p><strong>Sušenie:</strong> pri izbovej teplote, vypchaté papierom, ďalej od radiátora a slnka.</p>' +
        '<p><strong>Čomu sa vyhni:</strong> práčka, sušička, bielidlo, horúca voda.</p>' +
        '<p><strong>Skladovanie:</strong> na chladnom a suchom mieste, s napínačmi do topánok a mimo slnka. Biele časti na svetle žltnú.</p></div>'
    }
  };
  var LABELS = { "Terméktípus": "Typ produktu", "Kinek": "Pre koho", "Szárhossz": "Výška topánky", "Márka": "Značka", "Színek": "Farby", "Modellcsalád": "Modelový rad", "Szin": "Farba", "Termék modellje": "Model produktu", "Elérhető méret": "Dostupná veľkosť" };
  function labels() {
    Array.prototype.forEach.call(document.querySelectorAll("#pane-data .data__item"), function (d) {
      var w = document.createTreeWalker(d, NodeFilter.SHOW_TEXT), n;
      while ((n = w.nextNode())) {
        var t = n.textContent, k = t.replace(/:\s*$/, "").trim();
        if (LABELS[k]) { n.textContent = t.replace(k, LABELS[k]); break; }
      }
    });
  }
  function norm(s) { return (s || "").replace(/\s+/g, " ").trim(); }
  function run() {
    Array.prototype.forEach.call(document.querySelectorAll('[id^="tab-custom-section-"],[id^="accordion-btn-custom-section-"]'), function (a) {
      var m = MAP[norm(a.textContent)];
      if (!m) return;
      a.textContent = m.title;
      var pane = document.getElementById(a.getAttribute("aria-controls") || "");
      var box = pane && pane.querySelector(".tab-pane__container");
      if (box && !box.getAttribute("data-kbd-sk")) { box.innerHTML = m.html; box.setAttribute("data-kbd-sk", "1"); }
    });
  }
  function both() { try { run(); labels(); } catch (e) {} }
  window.KBD_sk = both;
  both();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", both); else setTimeout(both, 0);
  if (document.readyState === "complete") setTimeout(both, 0); else window.addEventListener("load", both);
})();

/* ========================= 5) v3 CRO-bővítés (HU + SK) ========================= */
(function(){
  "use strict";
  var d=document, h=d.documentElement;
  if(!h.classList.contains("kbd-pdp")) return;
  var K = window.KBD || { t:{} };
  var T = K.t;

  var CFG = {
    detailsHref: "#pane-details",
    addCartIcon: true
  };

  var I = {
    check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 13l4 4L19 7"/></svg>',
    phone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
    zoom:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M11 8v6M8 11h6"/></svg>',
    cart:'<svg class="kbd3-cart" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 8h-3l-1-3H8L7 8H4a1 1 0 0 0-1 1l1 11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2l1-11a1 1 0 0 0-1-1z"/></svg>'
  };
  function ico(n){ return I[n]||(window.KBDI||{})[n]||""; }
  function $(s,c){ return (c||d).querySelector(s); }
  function byId(id){ return d.getElementById(id); }

  if(!byId("kbd-pdp-css3")){
    var css =
    "html.kbd-pdp .kbd3-benefits{list-style:none;margin:14px 0 2px;padding:14px 0;border-top:1px solid var(--kbd-line);border-bottom:1px solid var(--kbd-line);display:grid;gap:9px}"+
    "html.kbd-pdp .kbd3-benefits li{display:flex;align-items:flex-start;gap:10px;font-size:14.5px;line-height:1.4}"+
    "html.kbd-pdp .kbd3-benefits li svg{flex:none;width:18px;height:18px;color:var(--kbd-ok);margin-top:1px}"+
    "html.kbd-pdp .kbd3-more{margin-top:3px;font-size:13.5px;color:var(--kbd-brown);font-weight:600;text-decoration:underline;text-underline-offset:3px;display:inline-block}"+
    "html.kbd-pdp .kbd3-pay{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:10px 0 2px}"+
    "html.kbd-pdp .kbd3-pay .pm{height:26px;padding:0 9px;border:1px solid var(--kbd-line);border-radius:6px;display:flex;align-items:center;font-size:11px;font-weight:700;color:var(--kbd-ink);letter-spacing:.02em;background:var(--kbd-white)}"+
    "html.kbd-pdp .kbd3-clar{text-align:center;font-size:12.5px;color:var(--kbd-muted);margin:8px 0 2px}"+
    "html.kbd-pdp .kbd3-clar svg{width:13px;height:13px;vertical-align:-2px;margin-right:4px}"+
    "html.kbd-pdp #artdet__main-block .artdet__cart-btn svg.kbd3-cart{display:inline-block!important;width:20px;height:20px;margin-right:9px;vertical-align:-4px}"+
    "html.kbd-pdp #artdet__main-block .artdet__price-discount,html.kbd-pdp #artdet__main-block .artdet__prices>.product-price--base:only-child,html.kbd-pdp #artdet__main-block .artdet__prices:not(.has-price-sale) .price-gross-format{font-size:30px!important;font-weight:800!important;letter-spacing:-.01em}"+
    "html.kbd-pdp #artdet__main-block .artdet__price-base{font-size:16px!important}"+
    "html.kbd-pdp #artdet__main-block .artdet__sale{background:var(--kbd-ink)!important;color:#fff!important;border-radius:999px!important;font-size:12px!important;font-weight:700!important;padding:5px 10px!important}"+
    "html.kbd-pdp #artdet__main-block .artdet__discount-texts{margin-top:6px!important}"+
    "html.kbd-pdp #artdet__main-block .artdet__discount-saving,html.kbd-pdp #artdet__main-block .artdet__discount-saving__title,html.kbd-pdp #artdet__main-block .artdet__discount-saving__value{color:var(--kbd-ok)!important;font-size:13px!important;font-weight:600!important}"+
    "html.kbd-pdp #kbd-stock-line{margin:20px 0 0}"+
    "html.kbd-pdp #kbd-stock-line .stock{display:inline-flex!important;align-items:center;gap:7px;margin:0!important;color:var(--kbd-ok)!important;font-size:13.5px!important;font-weight:600}"+
    "html.kbd-pdp #kbd-stock-line .stock svg{display:none!important}"+
    "html.kbd-pdp #kbd-stock-line .stock::before{content:'';width:8px;height:8px;border-radius:50%;background:currentColor;display:inline-block}"+
    "html.kbd-pdp #kbd-stock-line .stock:not(.on-stock){color:var(--kbd-muted)!important}"+
    "html.kbd-pdp #kbd-size-head{margin:12px 0 10px!important;padding-top:0!important;border-top:0!important}"+
    "html.kbd-pdp .kbd-size-label{font-size:14px!important;font-weight:600!important;letter-spacing:0!important;text-transform:none!important}"+
    "html.kbd-pdp #kbd-size-head .kbd-size-modal__open-btn{display:inline-flex!important;align-items:center;gap:6px;margin:0!important;padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important;color:var(--kbd-ink)!important;font:500 13px/1.3 Montserrat,Montserrat-fallback,sans-serif!important;text-decoration:underline;text-underline-offset:3px;text-decoration-color:var(--kbd-line);cursor:pointer;width:auto!important;height:auto!important}"+
    "html.kbd-pdp #kbd-size-head .kbd-size-modal__open-btn::before,html.kbd-pdp #kbd-size-head .kbd-size-modal__open-btn::after{display:none!important;content:none!important}"+
    "html.kbd-pdp #kbd-size-head .kbd-ruler{width:15px;height:15px;color:var(--kbd-ink)}"+
    "html.kbd-pdp #kbd-size-help{margin:10px 0 18px!important}"+
    "html.kbd-pdp #artdet__main-block .product-type__value--text{border-radius:10px!important}"+
    "html.kbd-pdp #artdet__main-block .artdet__quick-order-btn{border-radius:999px!important;min-height:48px!important;font:600 14px/1 Montserrat,Montserrat-fallback,sans-serif!important}"+
    "html.kbd-pdp #kbd-pdp-freeship{margin:16px 0 2px!important;font-size:14px!important}"+
    "html.kbd-pdp #kbd-pdp-delivery{justify-content:flex-start!important;margin:8px 0 0!important;font-size:13.5px!important;color:var(--kbd-muted)}"+
    "html.kbd-pdp #kbd-pdp-delivery b{color:var(--kbd-ink);font-weight:600}"+
    "html.kbd-pdp #kbd-pdp-trust{display:grid!important;grid-template-columns:1fr 1fr!important;gap:12px 18px!important;margin:18px 0 0!important;padding:16px 0 0!important;border-top:1px solid var(--kbd-line)!important;border-bottom:0!important}"+
    "html.kbd-pdp .kbd-trust{gap:10px!important}"+
    "html.kbd-pdp .kbd-trust svg{width:18px!important;height:18px!important;flex:0 0 18px!important;color:var(--kbd-ink)!important}"+
    "html.kbd-pdp .kbd-trust b{font-size:13px!important;font-weight:600!important}"+
    "html.kbd-pdp .kbd-trust span{font-size:12px!important;color:var(--kbd-muted)!important}"+
    "html.kbd-pdp .kbd3-pay{margin:14px 0 4px!important}"+
    "html.kbd-pdp .kbd3-shipinfo{margin:8px 0 0;font-size:13px;color:var(--kbd-muted);line-height:1.45}"+
    "html.kbd-pdp .kbd3-shipinfo .row1{display:flex;gap:8px;align-items:flex-start}"+
    "html.kbd-pdp .kbd3-shipinfo .row1 svg{width:16px;height:16px;flex:none;margin-top:2px}"+
    "html.kbd-pdp .kbd3-shipinfo b{color:var(--kbd-ink);font-weight:600}"+
    "html.kbd-pdp .kbd3-shipinfo .row2{margin:6px 0 0 24px;color:var(--kbd-ok);font-weight:500}"+
    "html.kbd-pdp .kbd3-shipinfo .row2 b{color:var(--kbd-ok)}"+
    "html.kbd-pdp .kbd3-shipinfo .bar{margin:6px 0 0 24px;height:4px;border-radius:999px;background:var(--kbd-line);overflow:hidden;max-width:260px}"+
    "html.kbd-pdp .kbd3-shipinfo .bar i{display:block;height:100%;background:var(--kbd-ok);border-radius:999px}"+
    "html.kbd-pdp .kbd3-shipinfo .row3{margin:6px 0 0 24px}"+
    "html.kbd-pdp .kbd3-contact{display:flex;align-items:center;gap:8px;margin:10px 0 0;font-size:13.5px;color:var(--kbd-muted)}"+
    "html.kbd-pdp .kbd3-contact svg{width:16px;height:16px;flex:none;color:var(--kbd-ink)}"+
    "html.kbd-pdp .kbd3-contact a{color:var(--kbd-ink);font-weight:600;text-decoration:underline;text-underline-offset:3px;text-decoration-color:var(--kbd-line);white-space:nowrap}"+
    "html.kbd-pdp .kbd3-zoom{position:absolute;right:14px;bottom:14px;z-index:4;width:40px;height:40px;border:0;border-radius:999px;background:#fff;color:var(--kbd-ink);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(23,23,23,.12);cursor:pointer;padding:0}"+
    "html.kbd-pdp .kbd3-zoom svg{width:19px;height:19px}"+
    "html.kbd-pdp .kbd3-zoom:hover{background:var(--kbd-cream)}"+
    "html.kbd-pdp .kbd-skuline{margin-top:14px}"+
    "html.kbd-pdp .artdet__img-inner{background:var(--kbd-cream)!important;border-radius:16px!important}"+
    "html.kbd-pdp .artdet__img-inner img.artdet__alt-img{mix-blend-mode:multiply}"+
    "html.kbd-pdp .artdet__img-inner .carousel-cell,html.kbd-pdp .artdet__img-inner picture{background:var(--kbd-cream)!important}"+
    "html.kbd-pdp .artdet__thumb-img-wrap *{background:transparent!important}"+
    "html.kbd-pdp .artdet__thumb-images{margin-top:12px}"+
    "html.kbd-pdp .artdet__img-inner .sticker{background:#fff!important}"+
    "html.kbd-pdp .artdet__thumb-img-wrap{background:var(--kbd-cream);border-radius:10px;padding:6px;border:1.5px solid transparent}"+
    "html.kbd-pdp .artdet__thumb-img-wrap img{mix-blend-mode:multiply}"+
    "html.kbd-pdp .artdet__thumb-img-outer.is-nav-selected .artdet__thumb-img-wrap{border-color:var(--kbd-ink)}"+
    "@media (max-width:767.98px){html.kbd-pdp #artdet__main-block .artdet__price-discount,html.kbd-pdp #artdet__main-block .artdet__prices>.product-price--base:only-child,html.kbd-pdp #artdet__main-block .artdet__prices:not(.has-price-sale) .price-gross-format{font-size:28px!important}html.kbd-pdp #kbd-size-head{padding-top:0!important;margin-top:12px!important}html.kbd-pdp .artdet__img-inner{border-radius:14px!important}html.kbd-pdp .artdet__img-inner img.artdet__alt-img{max-height:40vh!important}html.kbd-pdp .artdet__img-inner .flickity-viewport{height:calc(40vh + 8px)!important}html.kbd-pdp .artdet__thumb-images{display:block!important;margin-top:10px}}";
    var stx=d.createElement("style"); stx.id="kbd-pdp-css3"; stx.textContent=css;
    (d.head||h).appendChild(stx);
  }

  function make(id, cls, html){
    var e=byId(id);
    if(e) return e;
    e=d.createElement("div"); e.id=id; if(cls) e.className=cls; e.innerHTML=html;
    return e;
  }
  function elBenefits(){
    return make("kbd3-benefits","kbd3-benefits",
      T.benefits.map(function(b){return "<li>"+ico("check")+"<span>"+b+"</span></li>";}).join("")+
      '<a class="kbd3-more" href="'+CFG.detailsHref+'">'+T.more+'</a>');
  }
  function elClar(){
    return make("kbd3-clar","kbd3-clar", ico("lock")+T.clarity);
  }
  function elPay(){
    return make("kbd3-pay","kbd3-pay",
      T.payments.map(function(p){return '<span class="pm">'+p.replace(/ /g,"&nbsp;")+'</span>';}).join(""));
  }

  function priceNow(){
    var p=$("#artdet__main-block .artdet__price-discount .price-gross-format")||$("#artdet__main-block .artdet__prices .price-gross-format");
    var t=p?(p.textContent||""):"";
    if(K.sk){ var f=parseFloat(t.replace(/[^\d,.]/g,"").replace(",",".")); return isNaN(f)?0:f; }
    var n=parseInt(t.replace(/[^\d]/g,""),10); return isNaN(n)?0:n;
  }
  function money(v){
    if(K.sk){ var r=Math.round(v*100)/100; return (r%1?r.toFixed(2).replace(".",","):String(r))+" €"; }
    var t=String(Math.ceil(v)), o="";
    while(t.length>3){ o=" "+t.slice(-3)+o; t=t.slice(0,-3); }
    return t+o+" Ft";
  }
  function elShipInfo(){
    var e=byId("kbd3-shipinfo");
    if(!e){ e=d.createElement("div"); e.id="kbd3-shipinfo"; e.className="kbd3-shipinfo"; }
    var price=priceNow(), free=price>0 && price>=K.FREE_SHIP, html="";
    if(!free){
      html+='<div class="row1">'+ico("truck")+'<span>'+T.shipLabel+' '+T.shipOpts.map(function(o){return o[0]+' <b>'+o[1]+'</b>';}).join(" · ")+'</span></div>';
      if(price>0) html+='<div class="row2">'+T.freeFrom+', '+T.missing.replace("%X%",money(K.FREE_SHIP-price))+'</div>'+
        '<div class="bar"><i style="width:'+Math.min(100,Math.round(price/K.FREE_SHIP*100))+'%"></i></div>';
    }
    html+='<div class="row3">'+T.cod+'</div>';
    if(e.getAttribute("data-k")!==html){ e.innerHTML=html; e.setAttribute("data-k",html); }
    return e;
  }
  function elContact(){
    return make("kbd3-contact","kbd3-contact", ico("phone")+'<span>'+T.contactQ+' '+T.contactCall+' <a href="tel:'+T.tel+'">'+T.phone+'</a></span>');
  }
  function placeZoom(){
    var box=$("#artdet__main-block .artdet__img-inner");
    if(!box || box.querySelector(".kbd3-zoom")) return;
    var b=d.createElement("button"); b.type="button"; b.className="kbd3-zoom"; b.setAttribute("aria-label",T.zoom); b.title=T.zoom; b.innerHTML=ico("zoom");
    b.addEventListener("click",function(ev){
      ev.preventDefault(); ev.stopPropagation();
      var cell=box.querySelector(".js-init-ps.is-selected")||box.querySelector(".js-init-ps");
      if(cell) cell.click();
    });
    box.appendChild(b);
  }

  function putIn(node, parent){ if(node&&parent&&node.parentNode!==parent) parent.appendChild(node); }
  function putBefore(node, ref){ if(node&&ref&&ref.parentNode&&ref.previousElementSibling!==node) ref.parentNode.insertBefore(node, ref); }
  function putAfter(node, ref){ if(node&&ref&&ref.parentNode&&ref.nextElementSibling!==node) ref.parentNode.insertBefore(node, ref.nextSibling); }

  function place(){
    var inner = $("#artdet__main-block .artdet__block-cart-inner");
    if(!inner) return;
    var head  = byId("kbd-pdp-head") || inner;
    var cart  = byId("artdet__cart") || $("#artdet__cart", inner);
    var del   = byId("kbd-pdp-delivery");

    putIn(elBenefits(), head);

    if(cart){
      var btn=$(".artdet__cart-btn", cart) || $(".artdet__cart-btn");
      var col=btn; while(col && col.parentNode!==cart) col=col.parentNode;
      if(col) putAfter(elClar(), col);
      if(CFG.addCartIcon){
        if(btn && !btn.querySelector(".kbd3-cart")) btn.insertAdjacentHTML("afterbegin", ico("cart"));
      }
    }

    if(del){
      putAfter(elShipInfo(), del);
      putAfter(elContact(), byId("kbd3-shipinfo"));
    }
    var base = byId("kbd-pdp-trust") || byId("kbd3-contact") || del || cart;
    if(base) putAfter(elPay(), base);
    placeZoom();
  }

  function safe(){ try{ place(); }catch(e){ if(window.console) console.warn("[kbd-pdp v3]", e); } }

  window.KBD_place = safe;
  if(d.readyState!=="loading") safe(); else d.addEventListener("DOMContentLoaded", safe);
  if(d.readyState==="complete") setTimeout(safe,400); else window.addEventListener("load", function(){ safe(); setTimeout(safe,400); });
  var n=0, iv=setInterval(function(){ safe(); if(++n>12) clearInterval(iv); }, 500);
  d.addEventListener("click", function(e){
    if(e.target.closest && e.target.closest(".product-type__value--text")) setTimeout(safe, 400);
  });
})();

/* ========================= 6) Korai elrendezés: amint a termékblokk beolvasódott ========================= */
(function(){
  "use strict";
  var d=document, h=d.documentElement;
  if(!h.classList.contains("kbd-pdp")) return;
  /* egy elem lezárt, ha a parser már túljutott rajta: van utána következő testvér (önmagánál vagy egy ősénél) */
  function closed(el){ for(var n=el; n && n!==h && n!==d.body; n=n.parentNode){ if(n.nextSibling) return true; } return false; }
  function ready(){
    if(d.readyState!=="loading") return true;
    if(!d.getElementById("artdet__cart") || !d.querySelector("#artdet__main-block .artdet__block-cart-inner")) return false;
    var pd=d.getElementById("pane-data");
    return pd ? closed(pd) : !!d.getElementById("artdet__fixed-cart");
  }
  function txt(el){ return el ? (el.textContent||"").replace(/\s+/g," ").trim() : ""; }
  function param(name){
    var out="", items=d.querySelectorAll("#pane-data .data__item");
    for(var i=0;i<items.length;i++){ var t=txt(items[i]), k=t.indexOf(":"); if(k>0 && t.slice(0,k).trim().toLowerCase()===name.toLowerCase()) out=t.slice(k+1).trim(); }
    return out;
  }
  /* a fő galéria magassága: betöltött képnél a mostani, különben a négyzetes kép várható mérete */
  function altsHeight(){
    var alts=d.querySelector(".artdet__alts"), img=d.getElementById("main_image");
    if(!alts || !img) return 0;
    var mh=parseFloat(getComputedStyle(img).maxHeight), w=alts.clientWidth;
    if(img.complete && img.naturalWidth>1) return Math.round(img.getBoundingClientRect().height);
    return Math.round(isNaN(mh) ? w : Math.min(w, mh));
  }
  function fixGallery(){
    var hgt=altsHeight();
    if(hgt>0){ h.style.setProperty("--kbd-alts-h", hgt+"px"); h.classList.add("kbd-alts-fix"); }
  }
  function markSizeChart(){
    var vid=d.getElementById("artdet__video"), cs1=d.getElementById("custom-section-1");
    if(!vid || !cs1 || !vid.contains(cs1)) return;
    var type=param("Terméktípus")||param("Typ produktu");
    if(/ruh|oble/i.test(type) && !cs1.querySelector("[data-kbd-sizechart]")) return;
    vid.classList.add("kbd-sc-pending");
  }
  var done=false, mo=null;
  function go(){
    if(done) return; done=true;
    if(mo){ mo.disconnect(); mo=null; }
    /* a 3) és 5) blokk egymás elemeihez igazít, ezért kétszer futnak: így rögtön a végleges sorrend áll elő */
    for(var i=0;i<2;i++){
      if(window.KBD_run) window.KBD_run();
      if(window.KBD_sk) window.KBD_sk();
      if(window.KBD_place) window.KBD_place();
    }
    if(window.KBD_run) window.KBD_run();
    if(!window.KBD_late){ try{ markSizeChart(); fixGallery(); }catch(e){} }
    h.classList.add("kbd-ready");
  }
  /* biztonsági háló: ha a mérettáblázat-script mégsem vitte el az 1. lapfület, újra látszik */
  function afterLoad(){
    var vid=d.getElementById("artdet__video");
    if(vid && d.getElementById("custom-section-1") && vid.contains(d.getElementById("custom-section-1"))) vid.classList.remove("kbd-sc-pending");
    var img=d.getElementById("main_image");
    if(img && !img.complete && !window.KBD_late) img.addEventListener("load", fixGallery);
  }
  if(d.readyState==="complete") setTimeout(afterLoad,0); else window.addEventListener("load", function(){ setTimeout(afterLoad,0); });
  var rt=null;
  window.addEventListener("resize", function(){ if(window.KBD_late) return; clearTimeout(rt); rt=setTimeout(function(){
    var alts=d.querySelector(".artdet__alts"), img=d.getElementById("main_image");
    if(!alts || !img) return;
    var mh=parseFloat(getComputedStyle(img).maxHeight), w=alts.clientWidth;
    h.style.setProperty("--kbd-alts-h", Math.round(isNaN(mh) ? w : Math.min(w, mh))+"px");
  }, 150); });
  if(ready()) go();
  else if(window.MutationObserver){
    mo=new MutationObserver(function(){ if(ready()) go(); });
    mo.observe(h,{childList:true,subtree:true});
  }
  if(d.readyState==="loading") d.addEventListener("DOMContentLoaded", go); else go();
})();

/* KBD – megnézett termék mentése a böngészőbe (a kezdőlap „Nemrég megnézted” sora ebből dolgozik) */
(function(){
function save(){
try{
if(document.body&&document.body.id!=="ud_shop_artdet")return;
var ld=null,ss=document.querySelectorAll('script[type="application/ld+json"]');
for(var i=0;i<ss.length&&!ld;i++){try{var o=JSON.parse(ss[i].textContent);if(o&&o["@type"]==="Product")ld=o;}catch(e){}}
if(!ld||!ld.offers)return;
var ta=document.createElement("textarea");ta.innerHTML=ld.name||"";var name=ta.value.replace(/\s+/g," ").trim();
var img=(ld.image&&ld.image.length?ld.image[0]:"").replace("/0x0,","/496x496,");
var url=(location.origin+location.pathname);
var it={u:url,n:name,i:img,p:ld.offers.price,c:ld.offers.priceCurrency,t:Date.now()};
if(!it.n||!it.p)return;
var list=[];try{list=JSON.parse(localStorage.getItem("kbd_rv")||"[]")||[];}catch(e){list=[];}
list=list.filter(function(x){return x&&x.n!==it.n;});
list.unshift(it);
localStorage.setItem("kbd_rv",JSON.stringify(list.slice(0,12)));
}catch(e){}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",save);else save();
})();
