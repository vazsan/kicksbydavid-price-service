"""
Performance Agent
-------------------
A SAJÁT hirdetési fiókod adatait húzza le a Meta Marketing API-n keresztül
(nem versenytárs adat - ehhez ads_read jogosultság és a saját ad account ID
kell, act_ prefix-szel).
"""
import requests

from config import META_ACCESS_TOKEN, META_GRAPH_VERSION, META_AD_ACCOUNT_ID
import db

BASE_URL = f"https://graph.facebook.com/{META_GRAPH_VERSION}/{META_AD_ACCOUNT_ID}/insights"

FIELDS = "ad_name,ctr,cpc,cpm,purchase_roas,actions"


def fetch_performance(date_preset: str = "last_7d") -> list[dict]:
    if not META_ACCESS_TOKEN or not META_AD_ACCOUNT_ID:
        raise RuntimeError("META_ACCESS_TOKEN vagy META_AD_ACCOUNT_ID nincs beállítva.")

    params = {
        "level": "ad",
        "fields": FIELDS,
        "date_preset": date_preset,
        "access_token": META_ACCESS_TOKEN,
    }
    try:
        resp = requests.get(BASE_URL, params=params, timeout=30)
        resp.raise_for_status()
    except requests.exceptions.RequestException as e:
        # Ne engedjük, hogy az access_token (URL query param) belekerüljön a
        # hibaüzenetbe - az a napi jelentésen és a Telegram boton keresztül
        # simán kiszivároghatna.
        raise RuntimeError(f"Meta Marketing API kérés sikertelen ({type(e).__name__}).") from e
    data = resp.json().get("data", [])

    results = []
    for row in data:
        purchases = 0
        for action in row.get("actions", []):
            if action.get("action_type") == "purchase":
                purchases = int(action.get("value", 0))

        roas_list = row.get("purchase_roas", [])
        roas = float(roas_list[0]["value"]) if roas_list else 0.0

        record = {
            "ad_name": row.get("ad_name", ""),
            "model": "",  # ha a hirdetés nevében szerepel a modell, itt kiparse-olhatod
            "ctr": float(row.get("ctr", 0) or 0),
            "cpc": float(row.get("cpc", 0) or 0),
            "cpm": float(row.get("cpm", 0) or 0),
            "roas": roas,
            "purchases": purchases,
            "date_range": date_preset,
            "fetched_at": db.now(),
        }
        db.insert("performance", **record)
        results.append(record)

    return results


if __name__ == "__main__":
    print(fetch_performance())
