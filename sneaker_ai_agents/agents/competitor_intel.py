"""
Competitor Intelligence Agent
-------------------------------
FONTOS: nincs hivatalos API, ami versenytárs (Footshop, Sizeer, stb.)
Instagram/Facebook tartalmát/kommentjeit adná. Az automatikus tömeges
scraping sérti ezen platformok szolgáltatási feltételeit és fiók-/IP-tiltás
kockázatával jár.

Ezért ez az agent egyelőre BEMENETI FELÜLET: te (vagy egy VA) rögzíted heti
szinten, mit láttál a versenytársaknál, és ebből a Claude ugyanúgy tud
összefoglalót/insightot generálni.

Ha később mégis automatizálni akarod: nézz meg egy ToS-t betartó, managed
scraping szolgáltatást (pl. Apify), ne saját scriptet írj közvetlenül
Instagram/TikTok ellen.
"""
from claude_client import ask_claude
import db

SYSTEM = """
Sneaker piaci verseny-elemző vagy. Megkapod a versenytársaktól manuálisan
gyűjtött megfigyeléseket (mit promóznak, milyen akciót, szöveget,
kreatívot használnak). Készíts belőle egy rövid, tömör összefoglalót
magyarul, kiemelve a mintázatokat (pl. "a versenytársak X%-a most Y
kreatívtípust használ Z modellnél").
"""


def log_observation(competitor: str, model: str, promo_type: str, text_used: str,
                     creative_type: str, notes: str = "") -> int:
    return db.insert(
        "competitor_ads",
        competitor=competitor, model=model, promo_type=promo_type,
        text_used=text_used, creative_type=creative_type, notes=notes,
        logged_at=db.now(),
    )


def summarize_last_n_days(days: int = 7) -> str:
    rows = db.query(
        "SELECT * FROM competitor_ads WHERE logged_at >= datetime('now', ?)",
        (f"-{days} days",),
    )
    if not rows:
        return "Nincs rögzített versenytárs-megfigyelés az elmúlt időszakban."
    formatted = "\n".join(
        f"- {r['competitor']} | {r['model']} | promo: {r['promo_type']} | "
        f"kreatív: {r['creative_type']} | szöveg: {r['text_used']}"
        for r in rows
    )
    return ask_claude(SYSTEM, formatted)
