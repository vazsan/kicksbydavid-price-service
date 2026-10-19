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

## Élesítés (v13)

- A v2 kinézet alapból be van kapcsolva HU-n és SK-n is (`LIVE` a `kbd-pdp.src.js` 7. blokkjában és a head-generátorban). A `?kbdv2=0` az adott böngészőben visszaadja a v11-et (localStorage), a `?kbdv2=1` visszakapcsolja, a `?kbdoff=1` az egész szkriptet kikapcsolja.
- `kbd-pdp-head.unas.js` az Unas head-mező teljes tartalma (JS-only forma, a CSS soron belül, a `kbd-v2` osztály az első kirajzolás előtt kerül rá, így nincs villanás). Generálás: `NODE_PATH=<playwright node_modules> node storefront/tools/make-pdp-head-js.js <commit> storefront/kbd-pdp-head.unas.js`. Minden `kbd-pdp*.js` módosítás után újra kell generálni.
- Szlovák oldalon azok a sorok, amelyekhez még nincs lektorált szöveg, rejtve maradnak: fekete sáv, méretsegéd, összehasonlítás, eladó, pipás kiegészítő, a hero új ígéret-sorai. A szövegkulcsok a `TXT.sk` blokkokban vannak.

## v14: szállítási doboz + felugró ablak (pilot)

- `kbd-pdp2.js`: keretes doboz a KOSÁRBA gomb fölött (várható kézbesítés, ingyenes szállítás állapota, utánvét, gomb), a gombra felugró ablak (HU: Szállítás és fizetés, SK: Doprava a platba), a fizetési logók alatt 3 csempe (a megfelelő garanciakártyák lejjebb elrejtve, nincs duplikáció). A régi szürke `#kbd2-ship` doboz ott marad el, ahol az új doboz látszik.
- Kapu: `CFG.ship.pilot` (a `<html>` osztályában `page_shop_artdet_<id>*`; `"*"` = minden termékoldal; `[]` = kikapcsolva). Pilot: `1122553_MVB_` (HU UGG Tazz), `FZ0627_010_` (SK Air Force 1).
- A szövegek és díjak a `TXT.hu.ship` / `TXT.sk.ship` blokkban vannak (HU: 1 089 / 2 179 / MPL 3 800 / utánvét 1 100 Ft, ingyenes 46 250 Ft felett; SK: 4 € / 5 € / dobierka 3 €, 120 € felett ingyenes).
- A HU díjak a régi szürke dobozban és a `kbd-pdp.src.js`-ben javítva: 1 096 -> 1 089 Ft, 2 192 -> 2 179 Ft, ingyenes határ 45 657 -> 46 250 Ft. A telefonszám nyelvenként: HU +36 20 556 4258, SK +421 910 252 548 (`CFG.phone`).
- FIGYELEM, Unas head-tag: az Unas szerver ÜRES oldalt ad a termékoldalakon, ha a head-tag szövegében `[[` vagy `]]` jelsorozat van (mérve 2026-10-19). A generált `kbd-pdp-head.unas.js`-ben ez nincs; a generálás után ellenőrizd: `grep -c '\[\[\|\]\]' storefront/kbd-pdp-head.unas.js` = 0.
