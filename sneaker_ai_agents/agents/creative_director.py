from claude_client import ask_claude_json
from config import CLAUDE_MODEL_SMART
import db

SYSTEM = """
Te egy Creative Director vagy sneaker hirdetésekhez. NEM írsz szöveget,
csak eldöntöd, MIT kell mutatni vizuálisan.

Adott termékhez, avatárhoz (vásárlói perszónához) és marketing szöghöz
javasolj egy hirdetés-formátumot (single_image / video / carousel), és
sorold fel pontosan, milyen felvételeket/lapokat kell elkészíteni - arra
az avatárra szabva, akit megkaptál.

KIZÁRÓLAG tiszta JSON-nal válaszolj:
{
  "format": "single_image | video | carousel",
  "shots": ["1. lap/felvétel leírása", "2. lap/felvétel leírása", ...]
}
"""


def generate_brief(model_name: str, avatar_name: str, angle: str) -> dict:
    user_prompt = (
        f"Termék: {model_name}\n"
        f"Avatár: {avatar_name}\n"
        f"Marketing szög: {angle}"
    )
    result = ask_claude_json(SYSTEM, user_prompt, model=CLAUDE_MODEL_SMART)
    if not result.get("_parse_error"):
        import json
        ad_format = result.get("format", "")
        db.insert(
            "creative_briefs",
            model=model_name,
            avatar_name=avatar_name,
            format=ad_format,
            # A template egyelőre megegyezik a formátummal (pl. "video",
            # "carousel") - ha később finomabb sablon-bontás kell, itt válik el.
            template=ad_format,
            shots_json=json.dumps(result.get("shots", []), ensure_ascii=False),
            generated_at=db.now(),
        )
    return result


if __name__ == "__main__":
    print(generate_brief("Jordan 4", "Sneakerhead fiatal felnőtt", "A sneaker amit mindenki felismer."))
