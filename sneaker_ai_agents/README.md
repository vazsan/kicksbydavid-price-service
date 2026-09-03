# Sneaker AI Ad-Agent Rendszer

Ez egy futtatható vázlat (nem teljesen kész termék) a sneaker Facebook-hirdetés
pipeline-hoz. A cél, hogy legyen egy működő gerinc, amit fokozatosan bővítesz.

## Mi működik "dobozból", és mi igényel beállítást

| Agent | Állapot |
|---|---|
| ICP, Marketing Angle, Hook, Creative Director, Copywriter, Compliance | ✅ Kész, csak OPENAI_API_KEY kell |
| Meta Ad Library | ✅ Kész kód, de Meta identitás-ellenőrzés + token kell |
| Performance Agent | ✅ Kész kód, de saját ad account + token kell |
| Trend Research | ✅ Kész kód (Google Trends + RSS), de a pytrends nem hivatalos, időnként instabil lehet |
| Customer Language | ✅ Kész kód, de Reddit API app regisztráció kell |
| Competitor Intelligence, TikTok Creative | ⚠️ Szándékosan FÉL-MANUÁLIS — lásd lentebb miért |
| Creative Learning | ✅ Kész, de csak akkor ad értelmes eredményt, ha már van performance adat |
| Telegram bot | ✅ Kész, webhook alapú |

## Miért manuális a Competitor Intelligence és a TikTok Creative Agent?

Nincs hivatalos API, ami versenytársak Instagram/TikTok tartalmát vagy
kommentjeit adná. Az automatikus scraping ezeken a platformokon sérti a
szolgáltatási feltételeket, és fiók-/IP-tiltás kockázatával jár. Ezért
egyelőre `log_observation()` függvényekkel rögzíted a megfigyeléseidet
(akár a Telegram boton keresztül is bővíthető egy `/log` paranccsal),
az LLM pedig ebből von le mintázatokat. Ha később mégis automatizálni
akarod, egy ToS-t betartó managed scraping szolgáltatás (pl. Apify) a
biztonságosabb út, nem saját közvetlen scraper.

## 1. Telepítés lokálisan (teszteléshez)

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # töltsd ki
python db.py           # létrehozza az adatbázist
python campaign_manager.py   # egyszeri teszt-futtatás, konzolra írja a jelentést
```

## 2. API kulcsok beszerzése

**OpenAI API kulcs:** platform.openai.com -> API Keys.

**Meta Ad Library + Marketing API:**
1. Identitás-ellenőrzés: facebook.com/ID (kb. pár nap átfutás, egyszeri).
2. Meta for Developers -> hozz létre egy "Business" típusú appot.
3. Graph API Explorer -> generálj egy user access tokent (`ads_read`,
   `ads_management`, `business_management` jogosultságokkal).
4. Ez a token csak 1-2 óráig él -> cseréld le long-lived tokenre
   (~60 nap). Éles rendszerhez érdemes System User tokent használni,
   ami nincs egy emberi munkamenethez kötve.
5. **Fontos:** a token kb. 60 naponta lejár -> tegyél be egy naptári
   emlékeztetőt a frissítésére, különben a cron job néma csendben leáll.
6. A `META_GRAPH_VERSION`-t (config.py) kb. negyedévente frissítsd a
   developers.facebook.com/docs/graph-api/changelog alapján.

**Reddit API:** reddit.com/prefs/apps -> "create app" -> típus: "script".

**Telegram bot:**
1. Írj a @BotFather-nek, `/newbot`, mentsd el a tokent.
2. Töltsd fel az appot a cPanelre (lásd 3. pont).
3. Állítsd be a webhookot:
   ```
   curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://TE_DOMAINED.hu/webhook/<TOKEN>"
   ```
4. Küldj `/start`-ot a botnak, majd nézd meg a chat_id-t (pl. a
   `https://api.telegram.org/bot<TOKEN>/getUpdates` válaszból), és
   írd be a `.env`-be `TELEGRAM_CHAT_ID`-ként.

## 3. Telepítés cPanelre

**A) Telegram webhook (folyamatos web app)**
1. cPanel -> "Setup Python App" -> hozz létre egy új appot (Python 3.10+).
2. Töltsd fel ezt a projektet a mappájába (FTP/File Manager).
3. A cPanel-generált virtualenv-ben: `pip install -r requirements.txt`.
4. Application startup file: `passenger_wsgi.py`, Entry point: `application`.
5. Állítsd be a `.env`-et (a cPanel Python App felületén environment
   variable-ként is megadhatod, nem csak fájlból).
6. Indítsd újra az appot -> a domained (vagy aldomained) mostantól fogadja
   a Telegram webhookot.

**B) Napi pipeline (Cron Job)**
1. cPanel -> "Cron Jobs".
2. Napi 1x, pl. reggel 7-kor:
   ```
   /home/USERNEV/virtualenv/sneaker_ai_agents/3.10/bin/python /home/USERNEV/sneaker_ai_agents/run_daily_pipeline.py
   ```
   (a pontos virtualenv-útvonalat a "Setup Python App" felület mutatja).

## 4. Bővítési sorrend, ha ezt a vázat viszed tovább

1. Teszteld végig lokálisan `python campaign_manager.py`-jal, API kulcsok nélkül
   is látod, hol dobna hibát (minden lépés try/except-be van csomagolva, a
   pipeline nem áll le egy-egy hibás agenttől).
2. Kösd be az OpenAI + Meta Ad Library kulcsokat -> ez már önmagában
   használható napi jelentést ad.
3. Kösd be a Reddit + Telegramot.
4. Állítsd be a cron jobot és a webhookot cPanelen.
5. Csak ezután foglalkozz a Competitor Intelligence / TikTok Creative
   automatizálásával (ha egyáltalán szükséges - a manuális bevitel heti
   pár perc, sokszor megéri úgy hagyni).
