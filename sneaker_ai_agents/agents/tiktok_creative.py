"""
TikTok Creative Agent
------------------------
A TikTok Creative Center nem kínál nyilvános, hivatalos API-t a trendelő
videók lekérésére - csak scrapinggel lenne megoldható, ami ToS-kockázatos.

Ugyanaz a minta, mint a Competitor Intelligence Agentnél: te rögzíted
manuálisan (hetente pár perc), mit láttál a Creative Centerben / organikus
sneaker TikTokon, és a Claude ebből told le a mintázatokat.
"""
from claude_client import ask_claude
import db

SYSTEM = """
TikTok kreatív trendelemző vagy sneaker termékekhez. Megkapod a manuálisan
rögzített megfigyeléseket (mely videótípusok/hookok/első 3 másodperc
stílusok teljesítenek jól). Foglald össze tömören, mit érdemes ebből
átvenni a saját kreatívjainkba.
"""


def log_observation(model: str, video_style: str, first_3_sec: str, notes: str = "") -> int:
    return db.insert(
        "competitor_ads",  # közös táblát használunk egyszerűség kedvéért, "tiktok" jelölővel
        competitor="tiktok_observation", model=model, promo_type="",
        text_used=first_3_sec, creative_type=video_style, notes=notes,
        logged_at=db.now(),
    )


def summarize_last_n_days(days: int = 7) -> str:
    rows = db.query(
        "SELECT * FROM competitor_ads WHERE competitor = 'tiktok_observation' AND logged_at >= datetime('now', ?)",
        (f"-{days} days",),
    )
    if not rows:
        return "Nincs rögzített TikTok megfigyelés az elmúlt időszakban."
    formatted = "\n".join(
        f"- {r['model']} | stílus: {r['creative_type']} | első 3 mp: {r['text_used']}"
        for r in rows
    )
    return ask_claude(SYSTEM, formatted)
