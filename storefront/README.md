# KicksByDavid webshop scriptek (HU + SK)

A `.sk` domainen szlovákul, máshol magyarul futnak.

- `kbd-pdp.js`: a termékoldal dizájnja és CRO-elemei.
- `kbd-home.js`: a kezdőlap. Infosáv a fejléc fölött, hero szlogennel és Férfi/Női gombbal, előnysáv, egysoros kategóriák, termékfülek (Akciós / Legnépszerűbb / Újdonságok). Az infosáv és a menüjavítás minden oldalon fut, ahol a betöltő be van illesztve, a többi csak a kezdőlapon. `?kbdoff=1` kikapcsolja.

Az Unas a fájlokat nem a kódmezőből kapja, hanem jsDelivr CDN-ről tölti be, mindig egy adott commitra rögzítve:

    https://cdn.jsdelivr.net/gh/vazsan/kicksbydavid-price-service@<commit>/storefront/kbd-pdp.js
    https://cdn.jsdelivr.net/gh/vazsan/kicksbydavid-price-service@<commit>/storefront/kbd-home.js

Frissítés: módosítsd a fájlt, commitold, és az Unas mezőben cseréld a `<commit>` részt az új commit azonosítójára.
