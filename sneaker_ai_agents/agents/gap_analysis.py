"""
Gap Analysis Agent
--------------------
A Meta Ad Library-ból lekéri a config.COMPETITORS versenytársak jelenleg
futó hirdetéseit egy adott modellre, majd a Claude-dal azonosítja, milyen
hook/ajánlat/CTA mintázatokat használnak - és milyen szögeket NEM használ
egyikük sem (ez a kihasználható "gap").
"""
import json

import requests

from claude_client import ask_claude_json
from config import META_ACCESS_TOKEN, META_GRAPH_VERSION, META_AD_REACHED_COUNTRIES
from config import COMPETITORS, CLAUDE_MODEL_SMART
import db

BASE_URL = f"https://graph.facebook.com/{META_GRAPH_VERSION}/ads_archive"

FIELDS = "page_name,ad_creative_bodies"

SYSTEM = """
Sneaker piaci verseny-elemző vagy. Megkapod versenytársanként csoportosítva
a jelenleg futó Meta hirdetéseik szövegét egy adott termékre.

Ez alapján:
- rangsorold a leggyakoribb hookokat / nyitó mondatokat
- azonosítsd az ajánlat-struktúra mintázatokat (kedvezmény, garancia,
  ingyenes szállítás, stb.)
- azonosítsd a CTA (call-to-action) mintázatokat
- adj 3-5 konkrét, azonnal használható marketing szöget, amit A VERSENYTÁRSAK
  EGYIKE SEM használ - ez a kihasználható hézag (gap)

KIZÁRÓLAG tiszta JSON-nal válaszolj, ebben a formában:
{"top_hooks": ["...", ...], "offer_patterns": ["...", ...],
 "cta_patterns": ["...", ...], "gaps": ["...", ...]}
"""


def fetch_competitor_ads(model_name: str, competitor_page_names: list[str],
                          limit: int = 50) -> dict[str, list[str]]:
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
        # hibaüzenetbe - lásd meta_ad_library.py.
        raise RuntimeError(f"Meta Ad Library kérés sikertelen ({type(e).__name__}).") from e
    data = resp.json().get("data", [])

    ads_by_competitor: dict[str, list[str]] = {name: [] for name in competitor_page_names}
    for ad in data:
        page_name = ad.get("page_name", "")
        for competitor in competitor_page_names:
            if competitor.lower() in page_name.lower():
                bodies = ad.get("ad_creative_bodies") or []
                if bodies:
                    ads_by_competitor[competitor].append(bodies[0])
                break

    return ads_by_competitor


def analyze_gaps(model_name: str, ads_by_competitor: dict) -> dict:
    sections = []
    for competitor, texts in ads_by_competitor.items():
        if not texts:
            continue
        sections.append(
            f"--- {competitor} ---\n" + "\n".join(f"- {text}" for text in texts)
        )
    formatted = "\n\n".join(sections) if sections else "Nincs elérhető versenytárs hirdetésszöveg."

    user_prompt = f"Termék: {model_name}\n\n{formatted}"
    result = ask_claude_json(SYSTEM, user_prompt, model=CLAUDE_MODEL_SMART)
    if not result.get("_parse_error"):
        db.insert(
            "gap_analysis",
            model=model_name,
            top_hooks=json.dumps(result.get("top_hooks", []), ensure_ascii=False),
            offer_patterns=json.dumps(result.get("offer_patterns", []), ensure_ascii=False),
            cta_patterns=json.dumps(result.get("cta_patterns", []), ensure_ascii=False),
            gaps=json.dumps(result.get("gaps", []), ensure_ascii=False),
            generated_at=db.now(),
        )
    return result


def run_gap_analysis(model_name: str) -> dict:
    ads_by_competitor = fetch_competitor_ads(model_name, COMPETITORS)
    return analyze_gaps(model_name, ads_by_competitor)


if __name__ == "__main__":
    print(json.dumps(run_gap_analysis("Jordan 4"), ensure_ascii=False, indent=2))
