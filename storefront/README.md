# KicksByDavid webshop scriptek (HU + SK)

A `.sk` domainen szlovákul, máshol magyarul futnak.

- `kbd-pdp.js`: a termékoldal dizájnja és CRO-elemei.
- `kbd-home.js`: a kezdőlap. Infosáv a fejléc fölött, hero szlogennel és Férfi/Női gombbal, előnysáv, egysoros kategóriák, termékfülek (Akciós / Legnépszerűbb / Újdonságok). Az infosáv és a menüjavítás minden oldalon fut, ahol a betöltő be van illesztve, a többi csak a kezdőlapon. `?kbdoff=1` kikapcsolja.

Az Unas a fájlokat nem a kódmezőből kapja, hanem jsDelivr CDN-ről tölti be, mindig egy adott commitra rögzítve:

    https://cdn.jsdelivr.net/gh/vazsan/kicksbydavid-price-service@<commit>/storefront/kbd-pdp.js
    https://cdn.jsdelivr.net/gh/vazsan/kicksbydavid-price-service@<commit>/storefront/kbd-home.js

Frissítés: módosítsd a fájlt, commitold, és az Unas mezőben cseréld a `<commit>` részt az új commit azonosítójára.

## Termékoldal, v10 (korai elrendezés, CLS)

- `src/kbd-pdp.src.js` a forrás, ebből készül a `kbd-pdp.js`: `python3 storefront/tools/build-pdp.py storefront/src/kbd-pdp.src.js storefront/kbd-pdp.js v10`
- `kbd-pdp-head.html` az Unas head tag tartalma: kapcsoló + a teljes CSS soron belül + aszinkron JS-betöltő. Minden `kbd-pdp.js`-változás után újra kell generálni (`node storefront/tools/make-pdp-head.js storefront/kbd-pdp.js <cdn-url> storefront/kbd-pdp-head.html`, Playwright kell hozzá), mert a CSS benne van.
- Ha a fájl a lap aljáról töltődik (régi betöltő), ugyanúgy viselkedik, mint a v9.

## Termékoldal v2 (prototípus szerinti kinézet)

- `kbd-pdp2.js` a v11 fölé kerülő réteg. A `kbd-pdp.js` (v12) betöltője csak akkor tölti be, ha a böngészőben be van kapcsolva: `?kbdv2=1` bekapcsolja (a böngésző megjegyzi), `?kbdv2=0` kikapcsolja. Kapcsoló nélkül az oldal pontosan úgy működik, mint a v11.
- A beállítások (telefonszám, utánvét díja, Trustindex-azonosítók, képek száma) a `kbd-pdp2.js` elején, a `CFG` blokkban vannak. A szelektorok a `SEL` blokkban.
- A szövegek a `TXT` blokkban nyelvi kulcsok alatt állnak. Szlovák szöveg csak a v11 szótárából jön, új szlovák szöveget a lektor ad.
- A régi állapot mentése: `kbd-pdp-v11-backup` tag.
- Pipálós kiegészítő termék: a `CFG.upsell` kapcsolja (`enabled`, `pick`, `maxPrice`). A termék az Unas „Kiegészítő termékek” listájából jön (termékenként az adminban állítható), a kosárba tétel az Unas `cart_add` függvényével történik: előbb a kiegészítő, utána az eredeti gomb kattintása. Ha a terméknél nincs kiegészítő, a pipa nem jelenik meg. SK-n addig rejtett, amíg a lektor nem adja meg a szlovák szöveget (`TXT.sk.upsell`).
- A lap második fele a `kbd-pdp2-body.js` (a `kbd-pdp2.js` tölti be, `CFG.body` kapcsolja): fekete sáv, leírás + Adatok, méretsegéd, vélemények (Trustindex), összehasonlítás, GYIK, eladó, hasonló termékek (legfeljebb 4). A leírás, az Adatok és a GYIK a termék Unas-szövegeiből épül (`#pane-details`), a mérettáblázat az 1. lapfül táblázatából (EU és CM oszlop). Az összehasonlítás és az eladó szekció addig rejtett, amíg a `CFG.body.compare` és `CFG.body.seller` nincs kitöltve; a „Kinek és mihez ajánljuk?” a `CFG.body.fit` (modellcsalád -> szöveg) alapján jelenik meg.
