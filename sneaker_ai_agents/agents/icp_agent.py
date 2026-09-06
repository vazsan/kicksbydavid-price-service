from claude_client import ask_claude_json
from config import CLAUDE_MODEL_SMART
import db

SYSTEM = """
Te egy Ideal Customer Profile (ICP) elemző vagy sneaker termékekhez.

Kapsz egy terméket ÉS egy konkrét avatárt (vásárlói perszónát). A
WHO/WHAT/WHERE-t KIZÁRÓLAG erre a KONKRÉT AVATÁRRA szabd, NE a termék
általános vásárlóközönségére. Ugyanahhoz a termékhez több avatár is
tartozhat (pl. "Sneakerhead fiatal felnőtt" vs. "Szülő aki gyereknek
vesz") - ezeknek gyökeresen más a motivációja, a nyelvezete és a
platformhasználata, ezért a válasz legyen élesen avatár-specifikus.

Határozd meg:
- who: ki ez az avatár (demográfia + ki akar lenni / milyen identitást keres)
- what: mit akar valójában EZ AZ AVATÁR (funkcionális ÉS érzelmi motiváció)
- where: milyen platformon / közösségben van jelen EZ AZ AVATÁR

KIZÁRÓLAG tiszta JSON-nal válaszolj, más szöveg nélkül, ebben a formában:
{"who": "...", "what": "...", "where": "..."}
"""


def generate_icp(model_name: str, avatar_name: str, context: str = "") -> dict:
    user_prompt = (
        f"Termék: {model_name}\n"
        f"Avatár: {avatar_name}\n"
        f"Kiegészítő kontextus (trend / ügyfél nyelvezet, ha van):\n{context}"
    )
    result = ask_claude_json(SYSTEM, user_prompt, model=CLAUDE_MODEL_SMART)
    if not result.get("_parse_error"):
        db.insert(
            "icp",
            model=model_name,
            avatar_name=avatar_name,
            who=result.get("who", ""),
            what=result.get("what", ""),
            where_=result.get("where", ""),
            generated_at=db.now(),
        )
    return result


if __name__ == "__main__":
    import json
    print(json.dumps(
        generate_icp("Jordan 4", "Szülő aki gyereknek vesz"),
        ensure_ascii=False, indent=2,
    ))
