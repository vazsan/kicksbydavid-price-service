"""
Meta Ad Library Agent
----------------------
A legmegbízhatóbb adatforrás: hivatalos, ingyenes API, nincs App Review.
Előfeltétel: identitás-ellenőrzés a facebook.com/ID oldalon (1x, pár nap
átfutás), utána a Graph API Explorerből lekért token cserélhető long-lived
tokenre (~60 nap, azt utána rendszeresen frissíteni kell).

Lefedettség: globálisan csak politikai hirdetések, DE minden EU-ba/UK-ba
érkező hirdetés (bármilyen témában) benne van - ez fedi a HU/EU piacot.
"""
import requests
from datetime import datetime, date

from config import META_ACCESS_TOKEN, META_GRAPH_VERSION, META_AD_REACHED_COUNTRIES
import db
import meta_api

BASE_URL = f"https://graph.facebook.com/{META_GRAPH_VERSION}/ads_archive"

FIELDS = "page_name,ad_creative_bodies,ad_delivery_start_time,ad_snapshot_url"


def fetch_ads_for_model(model_name: str, limit: int = 25) -> list[dict]:
    if not META_ACCESS_TOKEN:
        raise RuntimeError("META_ACCESS_TOKEN nincs beállítva a .env fájlban.")

    params = {
        "search_terms": model_name,
        "ad_reached_countries": str(META_AD_REACHED_COUNTRIES).replace("'", '"'),
        "ad_active_status": "ACTIVE",
        "fields": FIELDS,
        "limit": limit,
        "access_token": META_ACCESS_TOKEN,
    }
    try:
        resp = requests.get(BASE_URL, params=params, timeout=30)
        resp.raise_for_status()
    except requests.exceptions.RequestException as e:
        # Ne engedjük, hogy az access_token (URL query param) belekerüljön a
        # hibaüzenetbe - az a napi jelentésen és a Telegram boton keresztül
        # simán kiszivároghatna.
        raise RuntimeError(f"Meta Ad Library kérés sikertelen ({meta_api.describe_error(e)}).") from e
    data = resp.json().get("data", [])

    results = []
    for ad in data:
        start = ad.get("ad_delivery_start_time")
        days_running = None
        if start:
            try:
                start_date = datetime.fromisoformat(start.replace("Z", "+00:00")).date()
                days_running = (date.today() - start_date).days
            except ValueError:
                pass

        bodies = ad.get("ad_creative_bodies") or []
        record = {
            "model": model_name,
            "page_name": ad.get("page_name", ""),
            "ad_text": bodies[0] if bodies else "",
            "ad_delivery_start_time": start or "",
            "days_running": days_running,
            "snapshot_url": ad.get("ad_snapshot_url", ""),
            "fetched_at": db.now(),
        }
        db.insert("meta_ads", **record)
        results.append(record)

    # a legrégebb óta futó hirdetések valószínűleg a legjobban teljesítenek
    results.sort(key=lambda r: r["days_running"] or 0, reverse=True)
    return results


if __name__ == "__main__":
    import json
    print(json.dumps(fetch_ads_for_model("Jordan 4"), ensure_ascii=False, indent=2))
