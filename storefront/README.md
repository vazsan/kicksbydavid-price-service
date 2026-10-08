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
