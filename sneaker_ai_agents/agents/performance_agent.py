"""
Performance Agent
-------------------
A SAJÁT hirdetési fiókod adatait húzza le a Meta Marketing API-n keresztül
(nem versenytárs adat - ehhez ads_read jogosultság és a saját ad account ID
kell, act_ prefix-szel).
"""
import requests

from config import META_ACCESS_TOKEN, META_GRAPH_VERSION, META_AD_ACCOUNT_ID
import ad_naming
import db

UNKNOWN = "ismeretlen"

BASE_URL = f"https://graph.facebook.com/{META_GRAPH_VERSION}/{META_AD_ACCOUNT_ID}/insights"

FIELDS = "ad_name,ctr,cpc,cpm,purchase_roas,actions"


def _resolve_ad_context(ad_name: str) -> dict | None:
    """
    Előbb a névkonvencióból (ad_naming), ha az nem megy, a kézi ad_mapping
    táblából próbáljuk kiolvasni az avatárt/sablont/piacot. Ha egyik sem
    ismeri a hirdetést, None.
    """
    return ad_naming.parse_ad_name(ad_name) or db.get_ad_mapping(ad_name)


def fetch_performance(date_preset: str = "last_7d") -> dict:
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
    unmatched_ad_names = []
    for row in data:
        purchases = 0
        for action in row.get("actions", []):
            if action.get("action_type") == "purchase":
                purchases = int(action.get("value", 0))

        roas_list = row.get("purchase_roas", [])
        roas = float(roas_list[0]["value"]) if roas_list else 0.0

        ad_name = row.get("ad_name", "")
        context = _resolve_ad_context(ad_name)
        if context is None:
            context = {}
            unmatched_ad_names.append(ad_name)

        record = {
            "ad_name": ad_name,
            # A modell csak a névkonvencióból jön (az ad_mapping tábla nem
            # tárolja) - ha nincs meg, marad üresen, mint korábban.
            "model": context.get("model", ""),
            "avatar_name": context.get("avatar_name", UNKNOWN),
            "template": context.get("template", UNKNOWN),
            "market": context.get("market", UNKNOWN),
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

    return {"records": results, "unmatched_ad_names": unmatched_ad_names}


if __name__ == "__main__":
    import json
    print(json.dumps(fetch_performance(), ensure_ascii=False, indent=2))
