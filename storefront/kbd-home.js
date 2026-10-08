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
    prev: "Predchádzajúce", next: "Ďalšie", uspLabel: "Výhody nákupu", tabsLabel: "Produkty",
    cQ: "Máš otázku?", cA: "Odpovieme do jedného pracovného dňa.", cMail: "E-mail", cTel: "Telefón",
    fEy: "Kto stojí za obchodom", fH: "Ahoj, som Dávid",
    fP: "Topánky som mal rád odjakživa. KicksByDavid vznikol v januári 2026, úplne v malom: najprv som kúpil a predal päť párov teniesok, potom desať, neskôr dvadsať. Keď už v malej dedinskej miestnosti stálo 250 párov, bolo jasné, že z toho bude e-shop.",
    fL: ["Na každej stránke produktu je výrobný kód, pred platbou si ho môžeš overiť.", "Sme nezávislý predajca: nové, originálne produkty z overených obchodných zdrojov.", "KICKSBYDAVID s.r.o. · 943 42 Šarkan 115, Slovensko · DIČ 2121629928"],
    fMore: "Celý príbeh", fUrl: "/o-nas",
    club: "5 € za registráciu<br>a z každej objednávky 5 % späť",
    rv: "Nedávno si si pozrel", rvSub: "Pokračuj tam, kde si skončil",
    rate: "4,8 / 5 · 18 hodnotení zákazníkov",
    revH: "Čo o nás hovoria zákazníci", revCnt: "18 hodnotení", revSrc: "Na základe hodnotení z Googlu, Árukereső a Trustindexu", revAll: "Všetky hodnotenia",
    reviews: []
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
    prev: "Előző", next: "Következő", uspLabel: "Vásárlási előnyök", tabsLabel: "Termékek",
    cQ: "Kérdésed van?", cA: "Egy munkanapon belül válaszolunk.", cMail: "E-mail", cTel: "Telefon",
    fEy: "Ki áll a bolt mögött", fH: "Szia, Dávid vagyok",
    fP: "Mindig is szerettem a cipőket. A KicksByDavid 2026 januárjában indult, egészen kicsiben: először öt pár sneakert vettem és adtam el, aztán tízet, később húszat. Amikor már 250 pár állt egy kis falusi helyiségben, világos lett, hogy ebből webshop lesz.",
    fL: ["Minden terméklapon ott a gyári cikkszám, fizetés előtt le tudod ellenőrizni.", "Független viszonteladók vagyunk: új, eredeti termékek, ellenőrzött kereskedelmi forrásból.", "KICKSBYDAVID s.r.o. · 94342 Sarkan 115, Szlovákia · adószám 2121629928"],
    fMore: "A teljes történet", fUrl: "/rolunk",
    club: "1800 Ft a regisztrációért,<br>és minden rendelésből 5% vissza",
    rv: "Nemrég megnézted", rvSub: "Folytasd ott, ahol abbahagytad",
    rate: "4,8 / 5 · 18 vásárlói értékelés",
    revH: "Mit mondanak rólunk", revCnt: "18 értékelés", revSrc: "Google, Árukereső és Trustindex értékelések alapján", revAll: "Összes értékelés",
    /* valós vélemények a Trustindex összesítő oldaláról (2026. október), szó szerint */
    reviews: [
      ["Tamás N.", "2026. szeptember", "Minden rendben zajlott, korrekt kommunikáció, hibátlan termék. Ajánlom mindenkinek!"],
      ["Arnold A.", "2026. április", "Csak ajánlani tudom, gyors szállitás, eredeti,nagyon jó áron van minden termék ,minden tökéletes!! Nagyon elégedett vagyok!!"],
      ["Dzsesszika Sz.", "2026. szeptember", "Minden rendben ment. Nagyon meg vagyok elégedve."],
      ["Ádiii.", "2026. április", "Gyors szállítás, megbízható, csak eredeti cipők jó áron! Csak ajánlani tudom!"],
      ["Csaba Sz.", "2026. június", "Profi szolgáltatás, gyors kiszállítás."],
      ["Robert K.", "2026. április", "A legjobb sneakerek. Megbízható forrásból"],
      ["Jennifer K.", "2026. április", "Gyors szállítás, tökéletes minőség 👌"],
      ["Gergő B.", "2026. április", "Csak ajánlani tudom teljesen megvagyok elégedve a termékkel!!"]
    ]
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
    + "#kbd-bar .kbd-bar__msg span{position:absolute;left:0;right:0;top:0;line-height:30px;text-align:center;opacity:0;transition:none}"
    + "#kbd-bar .kbd-bar__msg span.on{opacity:1;transition:opacity .45s}#kbd-bar .kbd-bar__msg span+span:before{display:none}}"
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
    + "@media(max-width:767.98px){" + H + ".kbd-hero__txt{padding:18px 16px 18px;gap:8px}" + H + ".kbd-hero__ey{display:none}"
    + H + "#kbd-hero h1{font-size:25px}" + H + ".kbd-hero__p{font-size:13.5px;line-height:1.45}"
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
    /* értékelések */
    + H + ".kbd-hero__rate{display:inline-flex;align-items:center;gap:8px;font-size:13.5px;font-weight:600;color:" + INK + "!important;text-decoration:none!important}"
    + H + ".kbd-hero__rate span{color:#E7A614;letter-spacing:1px;font-size:15px}"
    + H + "#kbd-reviews{background:#fff;padding:40px 0 36px;scroll-margin-top:90px}"
    + H + ".kbd-rev__in{max-width:1320px;margin:0 auto;padding:0 24px}"
    + H + ".kbd-rev__head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:18px}"
    + H + ".kbd-rev__head h2{margin:0 0 8px;font-size:22px;font-weight:800;text-transform:uppercase;color:" + INK + "}"
    + H + ".kbd-rev__score{display:flex;align-items:center;gap:10px;flex-wrap:wrap;color:" + INK + "}"
    + H + ".kbd-rev__score b{font-size:30px;font-weight:800;line-height:1}"
    + H + ".kbd-rev__score .st{color:#E7A614;font-size:19px;letter-spacing:2px}"
    + H + ".kbd-rev__score small{font-size:13px;color:#666}"
    + H + ".kbd-rev__all{font-size:14px;font-weight:700;color:" + INK + "!important;text-decoration:underline!important;text-underline-offset:3px;white-space:nowrap}"
    + H + ".kbd-rev__list{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}"
    + H + ".kbd-rev__it{background:#F9F9F9;border-radius:12px;padding:16px 18px;display:flex;flex-direction:column;gap:10px;margin:0}"
    + H + ".kbd-rev__it blockquote{margin:0;font-size:14.5px;line-height:1.5;color:#222}"
    + H + ".kbd-rev__it figcaption{margin-top:auto;font-size:12.5px;color:#777}"
    + H + ".kbd-rev__it figcaption b{color:" + INK + ";font-weight:700;margin-right:6px}"
    + "@media(max-width:991.98px){" + H + ".kbd-rev__list{grid-template-columns:repeat(2,minmax(0,1fr))}}"
    + "@media(max-width:767.98px){" + H + "#kbd-reviews{padding:28px 0 24px}" + H + ".kbd-rev__in{padding:0}" + H + ".kbd-rev__head{padding:0 16px;margin-bottom:12px}" + H + ".kbd-rev__head h2{font-size:19px}"
    + H + ".kbd-rev__list{display:flex;overflow-x:auto;gap:10px;padding:2px 16px 8px;scroll-snap-type:x mandatory;scroll-padding:0 16px;scrollbar-width:none}"
    + H + ".kbd-rev__list::-webkit-scrollbar{display:none}" + H + ".kbd-rev__it{flex:0 0 78%;scroll-snap-align:start}" + H + ".kbd-hero__rate{font-size:12.5px}}"
    /* kapcsolati kártya a GYIK-ben */
    + H + ".kbd-faq__contact.kbd-hid{display:none!important}"
    + H + ".kbd-contact{margin-top:22px;background:" + INK + ";color:#fff;border-radius:14px;padding:18px 20px;display:flex;flex-direction:column;gap:10px;max-width:420px}"
    + H + ".kbd-contact b{font-size:17px;font-weight:800}"
    + H + ".kbd-contact span{font-size:13.5px;opacity:.8}"
    + H + ".kbd-contact a{display:flex;justify-content:space-between;gap:12px;border-top:1px solid rgba(255,255,255,.14);padding-top:10px;color:#fff!important;text-decoration:none!important;font-size:14px}"
    + H + ".kbd-contact a em{font-style:normal;opacity:.7}"
    + H + ".kbd-contact a strong{font-weight:700;word-break:break-all;text-align:right}"
    /* nemrég megnézted */
    + H + "#kbd-rv{padding:36px 0 8px;background:#fff}"
    + H + ".kbd-rv__in{max-width:1320px;margin:0 auto;padding:0 24px}"
    + H + ".kbd-rv__h{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;margin:0 0 14px}"
    + H + ".kbd-rv__h h2{margin:0;font-size:22px;font-weight:800;text-transform:uppercase;color:" + INK + "}"
    + H + ".kbd-rv__h span{font-size:13.5px;color:#777}"
    + H + ".kbd-rv__list{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px}"
    + H + ".kbd-rv__it{display:flex;flex-direction:column;gap:6px;background:#fff;border-radius:10px;box-shadow:0 0 5px 0 rgba(0,0,0,.1);padding:10px;color:" + INK + "!important;text-decoration:none!important;transition:box-shadow .2s}"
    + H + ".kbd-rv__it:hover{box-shadow:0 0 14px 0 rgba(0,0,0,.14)}"
    + H + ".kbd-rv__it img{width:100%;aspect-ratio:1;object-fit:contain;background:#fafafa;border-radius:6px}"
    + H + ".kbd-rv__it span{display:block!important;font-size:12.5px;line-height:1.3;height:3.9em;overflow:hidden}"
    + H + ".kbd-rv__it b{font-size:14px;font-weight:800}"
    + "@media(max-width:991.98px){" + H + ".kbd-rv__list{grid-template-columns:repeat(4,minmax(0,1fr))}}"
    + "@media(max-width:767.98px){" + H + "#kbd-rv{padding:26px 0 4px}" + H + ".kbd-rv__in{padding:0}" + H + ".kbd-rv__h{padding:0 16px}" + H + ".kbd-rv__h h2{font-size:19px}"
    + H + ".kbd-rv__list{display:flex;overflow-x:auto;gap:10px;padding:4px 16px 10px;scroll-snap-type:x mandatory;scroll-padding:0 16px;scrollbar-width:none}"
    + H + ".kbd-rv__list::-webkit-scrollbar{display:none}" + H + ".kbd-rv__it{flex:0 0 140px;scroll-snap-align:start}}"
    /* alapítói blokk */
    + H + "#kbd-founder{background:" + CREAM + ";padding:56px 0}"
    + H + ".kbd-fd__in{max-width:1180px;margin:0 auto;padding:0 24px;display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:48px;align-items:center;color:" + INK + "}"
    + H + ".kbd-fd__ey{font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:" + BR + "}"
    + H + ".kbd-fd__in h2{margin:8px 0 14px;font-size:clamp(26px,2.6vw,36px);line-height:1.05;font-weight:800;text-transform:uppercase;color:" + INK + "}"
    + H + ".kbd-fd__in p{margin:0;font-size:15.5px;line-height:1.65;color:#333;max-width:58ch}"
    + H + ".kbd-fd__box{background:#fff;border-radius:14px;padding:22px 24px;box-shadow:0 0 5px 0 rgba(0,0,0,.08)}"
    + H + ".kbd-fd__box ul{list-style:none;margin:0 0 16px;padding:0;display:flex;flex-direction:column;gap:12px}"
    + H + ".kbd-fd__box li{display:flex;gap:10px;font-size:14px;line-height:1.45;color:#333}"
    + H + ".kbd-fd__box li svg{flex:none;width:20px;height:20px;color:" + BR + ";margin-top:1px}"
    + H + ".kbd-fd__box a{font-size:14px;font-weight:700;color:" + INK + "!important;text-decoration:underline!important;text-underline-offset:3px}"
    + "@media(max-width:767.98px){" + H + "#kbd-founder{padding:36px 0}" + H + ".kbd-fd__in{grid-template-columns:minmax(0,1fr);gap:20px;padding:0 16px}" + H + ".kbd-fd__in p{font-size:14.5px}}"
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
      + '<a class="kbd-hero__link" href="' + catHref(/\/(akcios-termekek|akcie)$/i, T.saleUrl) + '">' + T.sale + "</a></div>"
      + '<a class="kbd-hero__rate" href="#kbd-reviews"><span aria-hidden="true">★★★★★</span>' + T.rate + "</a></div>"
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

  /* ---------- 5) kategóriák: sorrend (a rácsot a lenti, beépített v2 blokk készíti) ---------- */
  var ORDER = [/\/(ferfi|panske)$/i, /\/(noi|damske)$/i, /\/(gyermek|deti)$/i];
  function orderCats() {
    var cells = document.querySelectorAll("#start_category_offer .carousel-cell");
    for (var i = 0; i < cells.length; i++) {
      var a = cells[i].querySelector("h4 a"), href = a ? a.getAttribute("href") || "" : "", o = 10 + i;
      for (var j = 0; j < ORDER.length; j++) if (ORDER[j].test(href)) o = j + 1;
      cells[i].style.order = o;
    }
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

  /* ---------- 6a) vásárlói értékelések ---------- */
  function buildReviews() {
    var ref = $id("kbd-ptabs");
    if (!ref || $id("kbd-reviews")) return;
    var r = document.createElement("section");
    r.id = "kbd-reviews";
    r.setAttribute("aria-label", T.revH);
    r.innerHTML = '<div class="kbd-rev__in"><div class="kbd-rev__head"><div><h2>' + T.revH + '</h2><div class="kbd-rev__score"><b>4,8</b><span class="st" aria-hidden="true">★★★★★</span><small>' + T.revCnt + " · " + T.revSrc + "</small></div></div>"
      + '<a class="kbd-rev__all" href="https://www.trustindex.io/reviews/www.kicksbydavid.sk" target="_blank" rel="noopener">' + T.revAll + ' →</a></div><div class="kbd-rev__list"></div></div>';
    var list = r.querySelector(".kbd-rev__list");
    for (var i = 0; i < T.reviews.length; i++) {
      var f = document.createElement("figure"), q = document.createElement("blockquote"), c = document.createElement("figcaption"), b = document.createElement("b");
      f.className = "kbd-rev__it";
      q.textContent = "„" + T.reviews[i][2] + "”";
      b.textContent = T.reviews[i][0];
      c.appendChild(b);
      c.appendChild(document.createTextNode(T.reviews[i][1]));
      f.appendChild(q); f.appendChild(c); list.appendChild(f);
    }
    if (!T.reviews.length) list.style.display = "none";
    after(r, ref);
  }

  /* ---------- 6b) kapcsolati kártya a GYIK bal oszlopában ---------- */
  function buildContact() {
    var p = document.querySelector("#kbd-faq .kbd-faq__contact");
    if (!p || $id("kbd-contact")) return;
    var c = document.createElement("div");
    c.id = "kbd-contact";
    c.className = "kbd-contact";
    c.innerHTML = "<b>" + T.cQ + "</b><span>" + T.cA + "</span>"
      + '<a href="tel:' + T.phone.replace(/\s/g, "") + '"><em>' + T.cTel + "</em><strong>" + T.phone + "</strong></a>"
      + '<a href="mailto:info@kicksbydavid.com"><em>' + T.cMail + "</em><strong>info@kicksbydavid.com</strong></a>";
    after(c, p);
    p.classList.add("kbd-hid");
  }

  /* ---------- 6c) Club-sáv: konkrét ajánlat a Hűségprogram oldalról ---------- */
  /* a régi 11–14.jpg képek helyett az Unas fájlkezelőbe feltöltött kbdc-11–14.webp (mindkét domainen elérhetők) */
  var CLUB_IMG = { "11": [600, 900], "12": [600, 742], "13": [600, 750], "14": [600, 750] };
  function fixClub() {
    var im = document.querySelectorAll(".kbdc-hero-img");
    for (var i = 0; i < im.length; i++) {
      var m = (im[i].getAttribute("src") || "").match(/\/shop_ordered\/26121\/pic\/(1[1-4])\.jpg/);
      if (!m) continue;
      im[i].setAttribute("width", CLUB_IMG[m[1]][0]);
      im[i].setAttribute("height", CLUB_IMG[m[1]][1]);
      im[i].setAttribute("decoding", "async");
      im[i].src = location.protocol + "//" + location.host + "/shop_ordered/26121/pic/kbdc-" + m[1] + ".webp";
    }
    var t = document.querySelector(".kbdc-hero-title");
    if (t && !t.getAttribute("data-kbd")) { t.innerHTML = T.club; t.setAttribute("data-kbd", "1"); }
  }

  /* ---------- 6d) nemrég megnézett termékek (a terméklapi script menti a böngészőbe) ---------- */
  function money(v, cur) {
    var n = Math.round(parseFloat(v));
    if (isNaN(n)) return "";
    var s = String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
    return cur === "EUR" ? s + "\u00a0€" : s + "\u00a0Ft";
  }
  function buildRecent() {
    if ($id("kbd-rv")) return;
    var list = [];
    try { list = JSON.parse(localStorage.getItem("kbd_rv") || "[]"); } catch (e) { list = []; }
    if (!list || list.length < 2) return;
    var h = "";
    for (var i = 0; i < list.length && i < 6; i++) {
      var it = list[i];
      if (!it || !it.u || !it.n) continue;
      h += '<a class="kbd-rv__it" href="' + it.u + '"><img src="' + (it.i || "") + '" alt="" loading="lazy"><span></span><b>' + money(it.p, it.c) + "</b></a>";
    }
    var s = document.createElement("section");
    s.id = "kbd-rv";
    s.innerHTML = '<div class="kbd-rv__in"><div class="kbd-rv__h"><h2>' + T.rv + "</h2><span>" + T.rvSub + '</span></div><div class="kbd-rv__list">' + h + "</div></div>";
    /* a terméknév szövegként kerül be, nem HTML-ként */
    var spans = s.querySelectorAll(".kbd-rv__it span"), k = 0;
    for (var j = 0; j < list.length && j < 6; j++) if (list[j] && list[j].u && list[j].n) spans[k++].textContent = list[j].n;
    var ref = $id("kbd-ptabs");
    if (ref) after(s, ref);
  }

  /* ---------- 6e) alapítói blokk (szöveg a Rólunk oldalról) ---------- */
  function buildFounder() {
    if ($id("kbd-founder")) return;
    var ref = document.querySelector("#main > .kbd-home-extra") || $id("kbd-ptabs");
    if (!ref) return;
    var li = "";
    for (var i = 0; i < T.fL.length; i++) li += "<li>" + svg("shield") + "<span>" + T.fL[i] + "</span></li>";
    var f = document.createElement("section");
    f.id = "kbd-founder";
    f.innerHTML = '<div class="kbd-fd__in"><div><span class="kbd-fd__ey">' + T.fEy + "</span><h2>" + T.fH + "</h2><p>" + T.fP + "</p></div>"
      + '<div class="kbd-fd__box"><ul>' + li + '</ul><a href="' + abs(T.fUrl) + '">' + T.fMore + " →</a></div></div>";
    after(f, ref);
  }

  /* ---------- 7) sorrend: [mobilon banner], hero, előnyök, kategóriák, fülek, méretek, UGG/márkák, nemrég nézett, alapító ---------- */
  var lastMob = null;
  function arrange() {
    var main = $id("main"), cat = $id("start_category_offer");
    if (!main || !cat) return;
    var hero = $id("kbd-hero"), usp = $id("kbd-usp"), tabs = $id("kbd-ptabs"), bn = $id("start_banner_big");
    var bs = $id("start_brand_slider"), ex = document.querySelector("#main > .kbd-home-extra");
    var mob = MQ.matches, seq = [];
    /* mobilon a banner marad a lap tetején, közvetlenül alatta a szlogen és a gombok */
    if (mob && bn && hero) {
      if (bn.parentNode !== hero.parentNode || bn.nextElementSibling !== hero) hero.parentNode.insertBefore(bn, hero);
    }
    seq.push(hero, usp, cat, tabs, $id("kbd-reviews"), bs, ex, $id("kbd-rv"), $id("kbd-founder"));
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
        buildHero(); buildUsp(); orderCats(); buildTabs(); buildReviews(); buildContact(); fixClub(); buildRecent(); buildFounder(); arrange();
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

/* ---------- A korábbi, külön Unas-scriptként futó kezdőlapi blokkok, ide beépítve ----------
   (kategóriakártyák, méretsor, UGG ajánló, márkák + márkalogók). Ha a régi script is bent maradna,
   az ID-ellenőrzések miatt nem duplázódnak. */
if (!/[?&]kbdoff=1/.test(location.search)) {
/* KBD főoldal v2 – kategória kártyák, méretsor, UGG ajánló, márkák (HU+SK), az Unas alap termékkártya-dizájnjához igazítva. FIGYELEM: Unas szkriptben tilos a dupla szögletes zárójel. */
(function(){
var SK=/\.sk$/.test(location.hostname);
var BASE=SK?'/vsetky-produkty':'/osszes-termek';
function bf(v){return BASE+'?filter=8208356:'+encodeURIComponent(v)}
var T=SK?{f:'UGG',r:'sezóna',p:'Papuče Tazz a Lowmel na chladnejšie dni. Z každej veľkosti len pár kusov.',b:'Pozrieť ponuku',bl:'Značky'}
        :{f:'UGG',r:'szezon',p:'Tazz és Lowmel papucsok hidegebb napokra. Kevés darab méretenként.',b:'Megnézem a kínálatot',bl:'Márkák'};
var BR='Nike|Air Jordan|Adidas|New Balance|ASICS|UGG|ON|Puma|Converse|Vans|Salomon|Saucony|Crocs|Birkenstock|Timberland|Supreme'.split('|');
var CARD='background:#fff;border-radius:10px;box-shadow:0 0 5px 0 rgba(0,0,0,.1);';
var G='.carousel--start_category_offer.kbd-grid';
var css=''
/* kategória kártyák – mint a termékkártya */
+'.start_category_offer.kbd-on{padding-bottom:80px}'
+G+'{display:grid!important;grid-template-columns:repeat(4,1fr);gap:20px}'
+G+' .carousel-cell{position:static!important;transform:none!important;width:auto!important;left:auto!important;margin:0!important;padding:0!important;height:auto!important}'
+G+' .start_categories__slide-inner{'+CARD+'padding:20px;height:100%;display:flex;flex-direction:column-reverse;gap:14px;transition:box-shadow .2s}'
+G+' .start_categories__slide-inner:hover{box-shadow:0 0 14px 0 rgba(0,0,0,.14)}'
+G+' .start_categories__element-texts{margin:0!important;padding:0!important;text-align:center}'
+G+' .start_categories__element-texts h4{margin:0!important;font-size:16px;font-weight:700}'
+G+' .start_categories__element-texts h4:after{display:none!important}'
+G+' .img-outer,'+G+' .img-outer a,'+G+' picture,'+G+' img{display:block;width:100%!important;height:auto!important;margin:0!important}'
+G+' img{transition:transform .3s}'+G+' .start_categories__slide-inner:hover img{transform:scale(1.04)}'
+'.carousel__nav--start_category_offer.kbd-hide{display:none!important}'
/* méretsor */
+'.start_brand_slider.kbd-on{background-image:linear-gradient(#F9F9F9,#F9F9F9)!important}'
+'.start_brand_slider.kbd-on .carousel-cell{margin-right:20px!important}'
+'.start_brand_slider.kbd-on .carousel-cell img{'+CARD+'transition:box-shadow .2s}'
+'.start_brand_slider.kbd-on .carousel-cell a:hover img{box-shadow:0 0 12px 0 rgba(0,0,0,.16)}'
/* UGG ajánló + márkák */
+'.kbd-home-extra{background:#fff;padding:80px 0}'
+'.kbd-promo{'+CARD+'display:grid;grid-template-columns:1fr 1fr;align-items:center;overflow:hidden;text-decoration:none!important;color:#171717!important;transition:box-shadow .2s}'
+'.kbd-promo:hover{box-shadow:0 0 14px 0 rgba(0,0,0,.14)}'
+'.kbd-promo .pt{padding:40px 48px;display:flex;flex-direction:column;align-items:flex-start;gap:6px}'
+'.kbd-promo .t1{font-size:20px;font-weight:500;text-transform:uppercase;line-height:1.2}'
+'.kbd-promo .t2{font-size:28px;font-weight:700;text-transform:uppercase;line-height:1.2}'
+'.kbd-promo .ln{width:40px;height:1px;background:#171717;margin:14px 0 10px}'
+'.kbd-promo .pd{font-size:14px;line-height:1.6;max-width:42ch}'
+'.kbd-promo .bt{margin-top:16px;display:inline-flex;align-items:center;height:40px;padding:10px 20px;border-radius:10px;background:#A3481F;color:#fff;font-size:12px;font-weight:700}'
+'.kbd-promo .pi{display:flex;align-items:center;justify-content:center;padding:24px}'
+'.kbd-promo .pi img{width:70%;max-width:300px;height:auto;transition:transform .3s}.kbd-promo:hover .pi img{transform:scale(1.04)}'
+'.kbd-brands{margin-top:80px}'
+'.kbd-brands .kbd-bl{display:flex;flex-wrap:wrap;justify-content:center;gap:14px}'
+'.kbd-brands .kbd-bl a{'+CARD+'padding:14px 22px;font-size:14px;font-weight:700;color:#171717!important;text-decoration:none!important;white-space:nowrap;transition:box-shadow .2s,color .2s}'
+'.kbd-brands .kbd-bl a:hover{box-shadow:0 0 12px 0 rgba(0,0,0,.16);color:#A3481F!important}'
+'@media(max-width:991px){'+G+'{grid-template-columns:repeat(2,1fr);gap:14px}'+G+' .start_categories__slide-inner{padding:12px;gap:10px}'+G+' .start_categories__element-texts h4{font-size:14px}}'
+'@media(max-width:760px){.start_category_offer.kbd-on{padding-bottom:50px}.kbd-home-extra{padding:50px 0}.kbd-promo{grid-template-columns:1fr}.kbd-promo .pi{order:-1;padding:16px 16px 0}.kbd-promo .pi img{width:60%}.kbd-promo .pt{padding:20px 20px 24px}.kbd-promo .t2{font-size:24px}.kbd-brands{margin-top:50px}.kbd-brands .kbd-bl{flex-wrap:nowrap;justify-content:flex-start;overflow-x:auto;padding:6px 4px 10px;gap:10px}}';
if(!document.getElementById('kbd-home-css')){var s=document.createElement('style');s.id='kbd-home-css';s.textContent=css;(document.head||document.documentElement).appendChild(s);}
function el(q){return document.querySelector(q)}
function build(){
  var cat=el('.start_category_offer'),bs=el('.start_brand_slider');
  if(cat)cat.classList.add('kbd-on');
  if(bs)bs.classList.add('kbd-on');
  var anchor=cat;
  if(cat&&bs&&cat.nextElementSibling!==bs){cat.parentNode.insertBefore(bs,cat.nextSibling)}
  if(bs)anchor=bs;
  if(!anchor||el('.kbd-home-extra'))return;
  var w=document.createElement('div');w.className='kbd-home-extra';
  w.innerHTML='<div class="container">'
   +'<a class="kbd-promo" href="'+bf('UGG')+'"><span class="pt"><span class="t1">'+T.f+'</span><span class="t2">'+T.r+'</span><span class="ln"></span><span class="pd">'+T.p+'</span><span class="bt">'+T.b+'</span></span>'
   +'<span class="pi"><img src="/img/26121/1174471-MBRS-10/496x496,r,1782222667/1174471-MBRS-10.webp" alt="UGG Tazz" loading="lazy"></span></a>'
   +'<div class="kbd-brands"><div class="main-title__wrap"><div class="main-title">'+T.bl+'</div></div><div class="kbd-bl">'
   +BR.map(function(b){return '<a href="'+bf(b)+'">'+b+'</a>'}).join('')+'</div></div></div>';
  anchor.parentNode.insertBefore(w,anchor.nextSibling);
}
function grid(n){var c=el('.carousel--start_category_offer');if(!c)return;if(!c.classList.contains('flickity-enabled')&&n<40)return setTimeout(function(){grid(n+1)},150);
  try{var f=window.Flickity&&Flickity.data(c);if(f)f.destroy();else if(window.jQuery&&jQuery(c).data('flickity'))jQuery(c).flickity('destroy')}catch(e){}
  c.classList.add('kbd-grid');var nav=el('.carousel__nav--start_category_offer');if(nav)nav.classList.add('kbd-hide');
  try{var b=el('.start_brand_slider .flickity-enabled');var fb=b&&window.Flickity&&Flickity.data(b);if(fb)fb.resize()}catch(e){}}
function go(){build();grid(0)}
if(document.readyState=='loading')document.addEventListener('DOMContentLoaded',go);else go();
})();

/* KBD márkalogók v1 – a főoldali Márkák/Značky blokkban a nevek helyett logók (HU+SK). Csak a főoldalon fut. */
(function(){
function add(){if(document.getElementById('kbd-brand-logos'))return;var s=document.createElement('style');s.id='kbd-brand-logos';s.textContent=".kbd-brands .kbd-bl{display:grid!important;grid-template-columns:repeat(8,1fr);gap:14px;max-width:1240px;margin:0 auto}\n.kbd-brands .kbd-bl a{display:block!important;height:84px;padding:0!important;font-size:0!important;line-height:0;color:transparent!important;background-color:#fff!important;background-repeat:no-repeat!important;background-position:center!important;background-size:132px 50px!important;border-radius:10px;box-shadow:0 0 5px 0 rgba(0,0,0,.1);transition:box-shadow .2s,transform .2s}\n.kbd-brands .kbd-bl a:hover{box-shadow:0 0 14px 0 rgba(0,0,0,.18);transform:translateY(-2px)}\n@media(max-width:1199px){.kbd-brands .kbd-bl{grid-template-columns:repeat(4,1fr)}}\n@media(max-width:760px){.kbd-brands .kbd-bl{grid-template-columns:repeat(4,1fr)!important;gap:8px;overflow:visible!important;padding:0!important}.kbd-brands .kbd-bl a{height:58px;border-radius:8px;background-size:80px 30px!important}}\n@media(max-width:380px){.kbd-brands .kbd-bl a{height:52px;background-size:70px 26px!important}}\n.kbd-brands .kbd-bl a[href$=\":Nike\"]{background-image:url(data:image/webp;base64,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)!important}\n.kbd-brands .kbd-bl a[href$=\":Air%20Jordan\"]{background-image:url(data:image/webp;base64,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)!important}\n.kbd-brands .kbd-bl a[href$=\":Adidas\"]{background-image:url(data:image/webp;base64,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)!important}\n.kbd-brands .kbd-bl a[href$=\":New%20Balance\"]{background-image:url(data:image/webp;base64,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)!important}\n.kbd-brands .kbd-bl a[href$=\":ASICS\"]{background-image:url(data:image/webp;base64,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)!important}\n.kbd-brands .kbd-bl a[href$=\":UGG\"]{background-image:url(data:image/webp;base64,UklGRgIKAABXRUJQVlA4WAoAAAAQAAAABwEAYgAAQUxQSAwIAAARsEb+/3zV1seXH4tFIhKJOFMkNokzz/NmsUXEFu0HZz5nS+TM84nudOYhEhGJM9yILdYdIraI2DaJyGYRkcTix9eHz4P1n1YP/t35RsQE4P/+/xdBszxmFzELSLZQqVQqwZBowS5WwQB03vvQ2PsLG7uHjaM7tze+n7pyf38VQAgXpwBgcPLzelO5j397e6wPQMhnIbNdHFB9ZelAkjy6M9XdKUm7C5NVlPKQJZwLAzpndyXF6FRuenRJu/ODefpHP1mpb25tbW7WV7+fqfUlmJWLcPv4KPVkvReWI2Ci0ThKbBz/XAFgqFxvSHSqcDql051alyEMdwNdz60cnUZljieN5ed7DLBgCFYW0Lem1Jt9MOQ1u+pK/rkHMMOj2yKpNpOSzhZfWlUN08eSmFeS4lKtH6UyYKRJSmJzBIb8hhW5RB4NwQyYllznki5JtzqH5U4VSJe0/3mtM1x9AlYODEMNteikF0WazSZotw8BnYsidW79VFP4K11Fe5S0taHLJaSvGMyJLbf6gN5NRSozSaawNQe13z9IKpUZkyRGSn+FoVzt9qN3R67M7pLiyVGj0Wgcn7okRs/i+h7rSqJTGenOFklRj6IsnhfXrZ7OTbmyMkoH9S9HB7sqIVR6hq9+s7HblBiZouOhe4+VGCXtbW38vLD4W31rL0qMbCG3QslivIIlUVldqs8MIGdHbe6GRE+g1rEgl0Sq8f1EH1L7Rmd/PpNcUtRllCkXNYfrjMpK7Y13ACGYJZmFAKD61FxTpCT5wOAhKVF6fwiAhUQDYPdPHYpybXXCShSpvXB/k8xA6stuIBhyWggA7pqnKOomZhQl184wEIIh1UIA0DNzpqhrMJQp1/22qqh0snkNMEOhAcDzB5Lr/p4DUq7lDpghrxkwfMDt7nLV1CqeU1Q6vXkFhrb271O7dlVRruUKDAU/obcRUKYiH8IOmUU1GNpqeEoaxSFJbXeZoejezS6UyPNArVfvF5Xueh0B7eq6s9d5WS6e3QVD4aEXZWsKdWZwLSCg3T2YmsY+Rc3AUJLPwawOB6onSicbA7A2Gb55FHgukjqqGtppZWsDrzvTXG8joG17zYXJW2LUNMrzufge60qj9nvN2oVwR4nUCOziMOej2Mm0gIC29zYUI0Xd6kF5Pgd/OOkeaGQ5fRTWLsPwiVqj5pE3BCtxXzZwlVQydWhou6HWZNJHsBzXZhGs0HL0bQMfyTPUYedgkinTuV4/GkZpPQfz+/hSMcP7aH/AS2lTuSbUWFvPv1ZftVK0sInv5SmuWiHVSjbDRHSSbGom1zVRRS6PlKPFn7GomMbhAgzTNxCyVsL4aWzGGM/ibAghWJZJRc8dfbsLZaO/oKVlLMkzDBTykp5AzqFLrUMjXcg7KVdu13rFUCp4OlDQ6iKWM5B3FbT7/tXxzGOjrWOjY+PjoxP3Zmsya8pGB0rC4J2ks0uwQupLWMp0byGviJKYUZmpSViWAl0b1bIwcJDUfKqg20tYUExxDhbUdBbsuj1SNaRf89fvGhxIHrxrTSwX/beS+HpBh6v4Xp6mpwqKKpong8g8vYbM35eNjrq8RasIBaB6tIEvFTO8cs50B5aptxeWZlgoFwCWU/Z7zHIFvMJtfCRPoZZh54k6RDvLRsA3CSLnYJYjoHtH+5ggU6Q95E9g3pJ2XWyR8zqAYJZgIQAdq+Qhhu6Iacf9sCKaKrjFCgv4PqWjJBgGDsQWUd8MoNXMAKDy1Jao4wHbyUB9glAAm7ubOZtZYFaIVVDdTlqvWjlAwEaKqJM/TFzqMgCV3qdeX5Uo+uu4kWm7WsCkZpF3U0yrACGfBWBoTZREHvTCyoHhOU+RS2rcvPHbz2v13abklFwrmPI0MU4g5JppVFAJmSsZjjC50oMiB+YORbVS9csojfOKSWJ0pbtLErUVuk+U7truMssGXHoIhuwh04wOVh4N2SqD0zfvSK4k156VhuqG3BMkkd5KKpHxbAybZIqi3kfIU2C266TiyY2Z2v3DwyNPjM0s3jprSnIqMUrz3SiP1XkqRibkjVF6BZflaXLVYOdpSpFUTpJKdlfjOsrleF2SRzIL6ZHS1iRQ2SPTxJNh2LlySfTo7h6jO5VOl1YvwUpFQMf4fFOJTFbiykQXDBhTzKLD+2HtsXq+Qklp6woQUC4DYP1Pvb3e8NTox/VPnr+3AgQA1Q15mqjjy0AoygIQdjKxyXykU+JOrRMwlM6A1tDR3X/v0KXBu3o6K2g1A2B4zp1povR2JxAsn4UAVEZuiEqblkSP0d2d7h5jpKTm4cqIAYaybEgO+ISeQZQ2rwQgBMtgIQQAvaMrynpc7f/+xh6V96C+NFpBSQ8ddXkGyaW11/uRu3v8yx3JmUYuGnDX6Mzs96s36je3t+s/z8+9PTYIAFbSDH2H8iyiS/v1P1zuryZUe+9/ZeGvtym5Kyv9Vi2gNXR09vT0dFaQGAyl3TB4Ks8iOSU1j48aicdnlESnstKlwxGEEIIhPYRgKPWG4YZiJokklc5WZXfp8BNkNTNcCA2DO4rZ2uzUyXw/LqSGnkWJ58QpfvkQYBcSGMJLZxLZLpKSz10CguGCakDf6pnk3ga6S/Hw7V4AhovtyMaR5NFZAGOkpP31GgAYLr4jf9iUJLo7yRbS3SlJu4tTfbggWwC6alMrDeW/vTBV6wMQ7GIEWABQ6RupTS3UbzfOmqeNnbW5l54b6jEAFgwXaAuGRAuV1mBItGC4eJshr+H//v9XQFZQOCDQAQAA0BIAnQEqCAFjAD5hLpRHpCIiISSR6dCADAlpANjJLhAHTcunP8dkREREQ6XPCwzehhrAFuc6f5c7YYpeNVVVJhfzCMfGWsUR80dsH7Oy8knjpfJXd3cGJmx8qYHtt69XEVYScc1HYZSRBTEN/FTCtXXDoDyCvmLVGWSAeAvPGfQwOhIuXsoe+sPnUaqqqttpExZkdVVVVVVVVVVVVU0AAP78XNABH9AJk/q51vn/Yb6dD+PGb4LCCPPwvW/G18xxr4kDEkDW+2PK4XfSFt7pBCySl7LVFe4MfI9ud0lHQaSy7BnNPj3Yfhsk4iu+Qa4keSAKQzWjCI5KeqWGNHLhPzcYh/SIQpkUkCqQfQGaiIqjVZgBE4W61isu3xdicM20XfPFpZFANw5dwyIMDI5a8gfaVSrj6d1nkzP+PbxXdzc/dX477eddVpHGsGGi1CeCJ+AaYVlmMHkD/tGFe1xXm7ze56pA7VsqFpU7gA1Yd+hWquubwTbrrACSjTj9vFqXlj63yk4mAIeInTXiFGsEqC40x9uu2qviX8L/2afSvaHP2KL7s+mHmwOzyK9bU3tXJoJsRD0woBJMg1GSP7gBQIPVi+yHB/ySPIAAAAAAAAA=)!important}\n.kbd-brands .kbd-bl a[href$=\":ON\"]{background-image:url(data:image/webp;base64,UklGRrYFAABXRUJQVlA4WAoAAAAQAAAABwEAYgAAQUxQSGsEAAARoIVa2/LYeeDhqx23urvbwLFA3d3d3d175e42x9uB+lzV3TVQb2Cot8NAqIb6x8sLz0W+P8m5eutExATgP2D5p8GfhMSqNTBgZEqJZBUxaai1MRgsJqKSiW3EMu9JI1PBSJEAVthyvyMO22P6kgBIECu8J3MNTwUDBWzd/9gHLUnefPvha/oAYIUPZJJpeCrinE5stCTJzV2SvqnvhpWGZJLkak6NEYGdhyS5uUuSu5nk9RG5iq6f+sD4EGNvlNzVpbs6zBocj/gSyz8sd/XQq0z3IMDECi8ra6Ga7iLjQ4x6TFllN29z845MAwkhullZZZPUGhlpSbIO3AcAIsB7K6voppEHzt1s7bW3vHjwG1mF60nEOH3uXnDp5j5U1mZJXvEyI0ScL1e7K+8MpESSKQGHqNJ1HBgfYKgq10CiksTO5l56mfEh9vjJ1Z7zHiA6Jo7KuU3e2hmMTsJdKmQNJKJLpodlbVnXIAWHWPzFgvs3NXSHnVveZhpMCM+GXxVMj5HomnxbLsnVWAmMzt5ySXLdiNQD3FPyPD06CSfKCnYI2IvTC3JtH58zSvpp+94cZAXTzvE5veS/7tGbozxOR8gLOh+pF9ep4NosOsRmLXnhHrAXLxZczfXiM75e0Vge7IZcdbhgem5sdEA8IJMk0xk9wFVyScrqBxHchJOzt7mNrAF2ljD1OyuYTkSKDjD+KxVdL45F6iRhybpMklxDy4DhIe5xb5Pp4SVBlhKx/NMytZvPQkKAV7KSXG9vD4AkAezWkKvorZXACOEqWUEmGzhoLABMOuJ+yVQ0XQgixKPelhXkLmvU33ijPuQyV9H0KokQE7XsVpDMVXRT2fTTeggSiP2yWUnyoirNft0eRJSJvX+SVXRp+mk3EHEmau/JvTt3DdVARJpYsl+Su1e5u6RZy4CINYGpb7QkmeWcs2VJrZdrABHxze6pf6fKVn2ghqgTGLX1GVfd3D/rtmvO33pxgFEDEzpOROSZUiKZEhF7pkQAZEqMHIn2lNBOxg1Y/rAb5w8+9tjg/OsOWwZBJ4D9nvvYVelDT+8YMoI7N0xyq3Qp12sAg0Usc4/k7urQ3aXrxoOhIvrek7m6dtfTq4KBIjZrytTTrA/WA8NEbPi5sjp070BZ9RXAKGHUk8qqNHPJzSqUNYAok5crq+wu/dpsZsm8pKwTo4T1zFR2afDi3aZO3++ShyUryX9dMkoPy0um+tZEMe3YkFdoFhiitd1VND0wCUgkmYAln5YXpOYkBJi4SyXXkwBRSYx9W15wPxcMUPq45D4yCUSHxNrfmBf0dICIvm9UzDoORMfEJcqlt8cjQCe6t7maa3c3/Rv3wjc1MDoJN6qQdQ/RdXpMJkmuI5DiM19WuhzshrirZLo4QgMl04XdJcyquipC98jbss5Fit39VWdE74GF0q/clnXNfy3N+huC/T3BdFWE7pctvByjQVWe34v5qrwmQjc2Gx9//PHHje+O6sU13w03m83m8HcXx+d/bQIAVlA4ICQBAAAQEACdASoIAWMAPmEwlEgkIyIhITv5iIAMCWlu4W/RG0A1B2fJijx7Y6gfhohbh2fHwNRWcb7AGTGCNnbe9fdaiD4Nq0wBhD0dds+aN4GobZdIeFyZ293wnOnnxLmvMfg2y6Q8LeMKSMC+QtHBHm0gZncfC5NaiD4Y9WdHnRC3Ds+VKARjZDwt2AD+/zBaHqWnEDevDGbVAl6oQwQm2I9rSQ10OAbnh82WkiVbNDCunwfLAOtiOmKUu2J88OberHGFLFWbkUFAZcfFxeyMBPhRQSVeLI9mpqI3TtPsv1HubNRFQBE2KNwD32CNd3yUNoQX8BlQGa1xnMpQ2aywT7p6YFLZEhDNFjB8gcYRBdw/OA6qrzwynoQWO10lfAg9wzFkAAAA)!important}\n.kbd-brands .kbd-bl a[href$=\":Puma\"]{background-image:url(data:image/webp;base64,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)!important}\n.kbd-brands .kbd-bl a[href$=\":Converse\"]{background-image:url(data:image/webp;base64,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)!important}\n.kbd-brands .kbd-bl a[href$=\":Vans\"]{background-image:url(data:image/webp;base64,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)!important}\n.kbd-brands .kbd-bl a[href$=\":Salomon\"]{background-image:url(data:image/webp;base64,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)!important}\n.kbd-brands .kbd-bl a[href$=\":Saucony\"]{background-image:url(data:image/webp;base64,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)!important}\n.kbd-brands .kbd-bl a[href$=\":Crocs\"]{background-image:url(data:image/webp;base64,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)!important}\n.kbd-brands .kbd-bl a[href$=\":Birkenstock\"]{background-image:url(data:image/webp;base64,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)!important}\n.kbd-brands .kbd-bl a[href$=\":Timberland\"]{background-image:url(data:image/webp;base64,UklGRuYNAABXRUJQVlA4WAoAAAAQAAAABwEAYgAAQUxQSD4LAAARsEbs//i13ou3Lz8iP34kZsSMiImRETGRQ0QiEpEYMZExZsQxYkZEIhIRiZjIGBkxMiKHiIlEDzKR+PHh48394PP5frd//c7/6YmICdB//v8PiGYPxB6WtRxT7/5QBTOzoiiKttGzAdl9MZM6ntw/K0wqHowVkrobrUW2RFj6e3Fx8ePS8srq+sbm9vbO1lfnm4r7YZK6Js+Zl92vQtKzxe1u2UOwQmr/a5kFWQsxdRwT+YOR4zbdS5ONfzrF+a7ifqk+ufwL3j4MqTH3FXxFrdTUG91DCM2QjzGEEKNzNyS7Dxo7dAiBL/esY+UHcOtzD+LR0LtjCHesW2v5i8DvO0QWVPzvTGMRD47z7T6ZXv4EDx54c/9Mje93ECOxxUhvCTgXO1c553LzAieyLrsPgyE4EO/bFsGBwLv7J7MdggOh1dhX3Lnq0WtiEhjXozPcOWzI/mcyzcUHINkuuQU9yCVyG62l0QSP07JxLzMN3br73Yv7UT/BH4Ael3x4GDrHk82ipTzD4aeZJsomVSv2iJGJ+yDT4cPoJA0sPozaUW6rtUzjkWmZxsumVOivOwJv7sn33OE9a9ziyceHUfzI7dRaiOkz7rd1mcaqmOnIAxume3GY+L1rv3hQ9j2J7LaWW7/lvWQacc/NJKPcxpNGC6tftYTPbS1lDS66ZNJQrJDuwMeatSpT+8XDOszttxKpNrv4TOlg2avE2ifGC5VbxipYpW8lptT+nFWS2s4qWZlZFatif+xLe0upOFDNCkmNJ+2JmVQ8akiyxz1PGonaOjvbJat0oMeDwz1tspxJ9Z7h4d5GxgpJ9ZeTj5LG0+6O4kcFk1S01+ttNUmWs0IqnnUXakwtjrWras/C7nqfvua+1lueFZJ65y45kJlJjaEdznv1ZAu4/tAwDR66n8w1VOmfkUvgaECWmGrT5wA3b2oyk9Q7ew7fZTZ1CWHhJLckU9vQ/NbxxfmPvU+TncoWUvvQZ+hr/wc465NlzOYc4MMZtLL+KlJ9eu0WOJdJ/QvfIPDSTnF350DdgfRbp5npIEn9LkaaI5JkamwBMUTYrJnqMxtNCH6k4gO4kw8sS717pA5w/CKjR3NfILC9TdMDNy+VmsZiDN6MZP8FXqt94QcQnDNpcO8GYnS+HRAAD3w9IYLfsSArKgSA6L+6krYtmpzcgjdZ0tAReHDnWLMEB2LJqp5eEsJdgBhD4OcjmeofTiBEAAeiX3ZIMj29ig4QvbW9KJvXBMTgwLl6r/AQqe7gAB6aXargfJtoQuRAJk1yx7uOV+4Q6F+gGRycfwabHpN8YMWOCDR7nz5bBAisqVAfhAgQnTSwKkm2SYDbNyeUHLSovlChfbkZSX+qeHfn5K93TjNErt2BwFgF95s+vSfgzSGpfu1+2ybt4zjnxWJ0UnciOMSY+9Tmjvu6pGMc58hkNn7rZK88wZt1ST0EItt6ck3usNW9kbRLzJnmcMD9V5/qBzg4W12bRIisy0oCm1IPkci2NEKTw8I02HSITBTfiQlETg5x9r/hyVI9ADSHTGNEnOs+mWmBCM5hx4p7EqdlWiPiYUxaJ+YaLe6talqrYM+JQOBvFVoigDfr6r5yx7ksyjzOSh0XuPOjoQOarEumY8A51H5J5EujOI3h01ZutXbn7uFmWOomQuS1ikKvcIi8U+MYB2dPVtwAXDWk53jmqNW9V6GN3LlM/SVTqmmNgPOrw7RDBGJDOefiiWQrBDyM6JbAsmT2Ecc50V7O/aDdbAaGS7ZtHuCyYerGIbAoK3EWpM3cidR75zg/ZWprkvnR0eIWVGi9Sl/JtGpazdx0SGuJx74KP2SmWQKBufYmgdVkmpjZzbhfv1ChYnCo9oWYKTR3cbXRK2mSmKwm07kP0mTInNU158meTMV3PDnpbHF/VzLpeclMhduG9BYH5530NXeowjSeeT8QPbJfqKZlnBgrsKtCaVGyU5OsJrU9n/+FQ2S3UKEpL2tckl73aZ3krUxaIoDzz7/BWpXePzTSJNmvsJsMEYlsvHWcqzbp6S88OEf6nIsTstx+JdWm9sEhOeqsZjpJPM7oECcyKkmzudNHspa3UlJIPZVWch1Sz1XmLInJRtIX3OHiBHAe6/WZB7j51F/CVafylUwvv0Ik61x0q5aLLMq0gkPkk04S70/Gcz//DZZyF7XEKyxXqP/EgfM2fan07Bqn/PQHwPFMj6Sd3IWV7VXQ9A0hsDR8ieM0+6p8kmnEMxs6zfQlw7nzxy1uUYU+lbRJT//AXYdM/2SuurSf20x6fyXuGfBf68/bJSvKzmV/YMY9RH8jbRJwZ0A1TcbMkkyPY2ZLZ5n+f4HnZR9V6CP+Z5aqnGRuBrSPJ1+SAXen3E9n2yXJZDnn5+9E9qwPd2dfso8EiAyrpvHcqkxtTZK9tgyjyWhr6y1bUqEPf+JVhWaHCn1PPExon5gcykwjRABPvNmnrNkf+ZzbbftGJPJJNb1NAmOqaSw4OOsy2Q+cyOGTxPkgk179SyzL9PefmP2dzxl/oy+5HybTDAG4OQhJfGuWpCXnZbab2+x0wHmtQq+SyIRqGmlmNmXSOhHn9PlJ5ihZISYXXS1u9XeeVPpEgMS0mmFR+3hy2S3Vtgg4Z2PXCYcqTKapdx05uPi9jf7gyawKTSWBKdU0fJfZSd4RcK4Hf+DAhUnFOZ5ctqhnZWtWpb3K6wqhU6YPuTXtJTizKrrcIfKj4xLAw7isVnSeclrfLCst2xyLJTVN5GZUaOiWClMZHzlM/G5IRZc7yXWL6slFNirVpa6SOdX0scpcEtnS50xk37RETD7bZ3dwTl5ImmwG5td+bye3VTJvNY3l5lRo8AYvGyNAZGI7w0Ghj8Tc0xa3Zab3ucvG/2DGM9vazeB8micNLGmICDi3m+/nT3FmSy6L39oeCA6RZdVspKyml7nd5K8kMDPpDrgvT96ROrePW1N3hcK0UOVRyfzvjMXMrnZw3Ek9ibxW/QwH3Mk2+1dLaiXFdm73aQCcs8fSZBLZq0sDuc/JUG6+LSSVnVm1YFNP2a5q+khMrh7JukpmVdNixjvMbNIze9rGHRw8AjjnT6RxmgAeYnTnp9Zz58qbdnNHjWsA53T2/a8YAfxyUePBwfmSvM4t6ghP3MtiOJK1HGmJDIRe2RcccJ+X3hCByIbU9o0IzqBM2zg4R1omcvOTSL7JigoVmzSdfGCl8xhPbvpzenZH6gyM0HTKY8KZbRABv+qU2o/dwf30cXcMThqTGBzfbzmmx4t3oTRevNqiGWOMIVxPTt2FNDZZfbrhzZCeDWnkOmTj4l5o3vXpjBjdPUYO65Kp65AY3N1D5Gz6ykOMMYbAtAqZ+i9CiGm4erlDiI43AyffiNGD87XpMcYY+NllB8QsJ7V5YnA8cuvB4e7LpFquqfucqt+uKf/7K+XHg5Qv6ZLyAAuy3j3yn59IkqlzhdKvz/qd0l8jMplmqDhWXwccWOm0JQB/t08+HHTbHvlw2K65G3B4Pwd8/zgkWcuR9Gjs1ezU5NTk1PREv7pGR8fGxsZGR/tVH52cnJyamZoYaej5zNz05OTMzLDpxdz8/Nv379+/HehZmmwzU21k6eTqbHO8pqxJA4vHlxcHH4bbZS9GhoeHR0ZHR58pP72yvLK6tra+Nl2TBpd+8Wt1UJJGd45XB2X9L/8aHh4e7KtL7QMvh4aHhwf62iU9+/sn13Pq2nk32CGZ6f9Qk1RvNEyyjExSvdFok2T602ZmkknqeNwhySQVdVOhiqbqJjUed8iskGSm1mxmslJZRckqykyWlazMTKbUlJoqmrImySpWS02SKTVJMkkmWakkWakkmcrN9J///wsgVlA4IIICAABwFwCdASoIAWMAPmEsk0ekIiGhIxLq0IAMCWluumBlgKlPzyp+eVPzyp5P0VGxdQ95jWZK84SlU5bx4xarDTKX7vA2/qzlmKQTw6ZisEWxvx+Db+kmLDlCvCQLJOWWUOMy8/TVPoZXWK7E0xpdf9r8N+eHuZB4DauJDhXg9yftIynvwLLB+Hk7xZzrWG9eFWSHwn6Gy5F2Fzu/lG/zsTmNa7mczkIRfAy5vyfQP+92VfnlT88qfnlT88qfnlT88qfnlQQAAP78XNABLFfT5RpoAY7/Was47kPqdwj2I/tesdLvHqf6rL5qo1YJrjhlZxo5lxgMhQPdTAEzrf0G/2lhNLNv0DERz9sVJlD8H3UH0K842Ul56FmncRNAsQYhyLj0uqAaJpj/WP11DWHLze897deqWGo4+ZnWgMu8KEoVJAYDj/WMCANfjYFKfp2Xe0ykr3SKpFVI5sy7OipiABjn26n3Ffsqh3hXxWWwTMme4lZ+JEFadl52smMF+PKZKXU1olOjQzcKiwtu0SyfPtevxf6ILcBDNvOSGcXGVnbsjeT9KThW4gQHfjXqF0HMw7DLw79adX+V1Nwq+0DmaQiHBYJojWVAXvx943xjvqUBRMUQQ8oSAc8lPbQN7aovcz1vofI0eY3yHAb6ohTgeRUlAEDgSrdLk9crvTFJ/hgf79a08Y15xgIFyzx7Fp47LA34s637Hd2ktuXHkC2X41kh97jJb7hSMR/cBDiiDiEB9ywY+DQC/MlQ+n2JaMUYBI/w7E8lUj2y0lkZkpXn0xJfxikLiQxPzpyCs4FNYwW4cf1NN1IZrNlBJlv3n7LSibZMoP+4cA6xex4DgAAAAAAAAAA=)!important}\n.kbd-brands .kbd-bl a[href$=\":Supreme\"]{background-image:url(data:image/webp;base64,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)!important}";document.head.appendChild(s);}
function go(){if(document.body&&document.body.id==='ud_shop_start'){add();}}
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',go);}else{go();}
})();
}
