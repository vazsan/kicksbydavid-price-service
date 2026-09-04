"""
Customer Language Agent
-------------------------
A Reddit hivatalos API-jához kereskedelmi jóváhagyás kell, ezért egyelőre
FÉL-MANUÁLIS, ugyanaz a minta, mint a Competitor Intelligence és a TikTok
Creative Agentnél: te (vagy egy VA) rögzíted, milyen kifejezésekkel
beszélnek a vásárlók/érdeklődők egy adott modellről (pl. Reddit, Facebook
csoportok, vásárlói kommentek), és ebből a Claude von le mintázatokat.
"""
from claude_client import ask_claude
import db

SYSTEM = """
Sneaker közösségi nyelvezet elemző vagy. Megkapod a manuálisan rögzített
vásárlói/érdeklődői kifejezéseket egy adott termékről. Foglald össze
tömören, milyen SAJÁT SZAVAKKAL, kifejezésekkel érdemes ezekből átvenni a
copywritingba - ne az általános marketing nyelvezetet, hanem a valódi,
hétköznapi (akár szlenges) megfogalmazásokat emeld ki.
"""


def log_observation(model: str, source: str, phrase: str, notes: str = "") -> int:
    return db.insert(
        "customer_language",
        model=model, source=source, phrase=phrase,
        collected_at=db.now(),
    )


def summarize_last_n_days(days: int = 7) -> str:
    rows = db.query(
        "SELECT * FROM customer_language WHERE collected_at >= datetime('now', ?)",
        (f"-{days} days",),
    )
    if not rows:
        return "Nincs rögzített customer language megfigyelés az elmúlt időszakban."
    formatted = "\n".join(
        f"- {r['model']} | forrás: {r['source']} | kifejezés: {r['phrase']}"
        for r in rows
    )
    return ask_claude(SYSTEM, formatted)
