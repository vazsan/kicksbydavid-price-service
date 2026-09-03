"""
Creative Learning Agent
--------------------------
Minden kampány után lefut: megnézi a legutóbbi performance adatokat és
levon belőle tanulságokat, amit a Hook/Copywriter Agent a következő
körben system prompt kiegészítésként megkap.
"""
from claude_client import ask_claude
import db

SYSTEM = """
Facebook hirdetés teljesítmény-elemző vagy. Megkapod a legutóbbi hirdetések
CTR/CPC/CPM/ROAS adatait. Vonj le 2-4 konkrét, akcióba fordítható tanulságot
(pl. "az outfit-jellegű videók CTR-je magasabb, mint a termékfotóké -
a következő körben priorizáld ezt a formátumot").

Rövid, tömör, magyar nyelvű bullet pontokban válaszolj.
"""


def generate_learnings(limit: int = 30) -> str:
    rows = db.query("SELECT * FROM performance ORDER BY fetched_at DESC LIMIT ?", (limit,))
    if not rows:
        return "Még nincs elég performance adat a tanulságokhoz."

    formatted = "\n".join(
        f"- {r['ad_name']}: CTR={r['ctr']}, CPC={r['cpc']}, ROAS={r['roas']}, vásárlás={r['purchases']}"
        for r in rows
    )
    insight_text = ask_claude(SYSTEM, formatted)
    db.insert("learnings", insight=insight_text, supporting_data=formatted, created_at=db.now())
    return insight_text


def get_latest_learnings(limit: int = 3) -> str:
    rows = db.query("SELECT * FROM learnings ORDER BY created_at DESC LIMIT ?", (limit,))
    return "\n\n".join(r["insight"] for r in rows) if rows else ""
