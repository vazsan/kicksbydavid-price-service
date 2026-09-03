from claude_client import ask_claude_json
from config import CLAUDE_MODEL_SMART
import db

SYSTEM = """
Te egy Ideal Customer Profile (ICP) elemző vagy sneaker termékekhez.
Egy adott modellhez határozd meg:
- who: ki vásárolja (demográfia + ki akar lenni / milyen identitást keres)
- what: mit akar valójában (funkcionális ÉS érzelmi motiváció)
- where: milyen platformon / közösségben van jelen

KIZÁRÓLAG tiszta JSON-nal válaszolj, más szöveg nélkül, ebben a formában:
{"who": "...", "what": "...", "where": "..."}
"""


def generate_icp(model_name: str, context: str = "") -> dict:
    user_prompt = f"Termék: {model_name}\nKiegészítő kontextus (trend / ügyfél nyelvezet, ha van):\n{context}"
    result = ask_claude_json(SYSTEM, user_prompt, model=CLAUDE_MODEL_SMART)
    if not result.get("_parse_error"):
        db.insert(
            "icp",
            model=model_name,
            who=result.get("who", ""),
            what=result.get("what", ""),
            where_=result.get("where", ""),
            generated_at=db.now(),
        )
    return result


if __name__ == "__main__":
    import json
    print(json.dumps(generate_icp("Jordan 4"), ensure_ascii=False, indent=2))
