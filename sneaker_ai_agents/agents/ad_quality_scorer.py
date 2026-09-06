"""
Ad Quality Scorer Agent
-------------------------
Bármilyen hirdetésszöveget 6 dimenzió mentén pontoz 1-10 skálán, az
AD_WRITING_PRINCIPLES alapelveit használva kontextusnak.
"""
import json

from claude_client import ask_claude_json
from config import CLAUDE_MODEL_FAST
from knowledge_base import AD_WRITING_PRINCIPLES
import db

SCORE_DIMENSIONS = (
    "hook_score", "copy_score", "cta_score",
    "emotional_score", "offer_score", "visual_copy_score",
)

SYSTEM = f"""
Te egy hirdetésszöveg-minőség értékelő vagy sneaker Facebook hirdetésekhez.

{AD_WRITING_PRINCIPLES}

Pontozd a kapott hirdetést 6 dimenzió mentén, 1-10 skálán:
1. hook_score - megállítja-e a görgetést az első mondat
2. copy_score - hatékony-e a szöveg (világos, tömör, nem fluffy)
3. cta_score - egyértelmű-e és cselekvésre ösztönző-e a CTA
4. emotional_score - a valódi célközönség-motivációt szólítja-e meg
   (lehetőség, ne csak fájdalom - lásd a fenti alapelveket)
5. offer_score - világos és vonzó-e az ajánlat
6. visual_copy_score - ha van megadva kreatív terv, illeszkedik-e hozzá a
   szöveg; HA NINCS kreatív terv megadva, ez legyen 0, és a reason
   jelezze, hogy nincs elég infó az értékeléshez

Minden dimenzióhoz adj 1-10 pontszámot, 1 mondatos indoklást, és - ha a
pontszám 7 alatt van - egy konkrét javítási javaslatot (7 vagy afölötti
pontszámnál az improvement legyen null).

KIZÁRÓLAG tiszta JSON-nal válaszolj, ebben a formában:
{{"hook_score": {{"score": 1-10, "reason": "...", "improvement": "..." vagy null}},
 "copy_score": {{...}}, "cta_score": {{...}}, "emotional_score": {{...}},
 "offer_score": {{...}}, "visual_copy_score": {{...}},
 "overall_notes": "1-2 mondatos összefoglaló"}}
"""


def _format_creative_brief(creative_brief: dict | None) -> str:
    if not creative_brief:
        return "Kreatív terv: nincs megadva."
    shots = creative_brief.get("shots", [])
    shots_text = "\n".join(f"  - {shot}" for shot in shots)
    return f"Kreatív terv - formátum: {creative_brief.get('format', '')}\nShotok:\n{shots_text}"


def score_ad(primary_text: str, headline: str, description: str,
             creative_brief: dict = None, copy_draft_id: int = None,
             avatar_name: str = None) -> dict:
    user_prompt = (
        f"Célzott avatár: {avatar_name or 'nincs megadva'}\n"
        f"Primary text: {primary_text}\n"
        f"Headline: {headline}\n"
        f"Description: {description}\n"
        f"{_format_creative_brief(creative_brief)}"
    )
    result = ask_claude_json(SYSTEM, user_prompt, model=CLAUDE_MODEL_FAST)

    if copy_draft_id is not None and not result.get("_parse_error"):
        notes = {
            dimension: {
                "reason": result.get(dimension, {}).get("reason"),
                "improvement": result.get(dimension, {}).get("improvement"),
            }
            for dimension in SCORE_DIMENSIONS
        }
        notes["overall_notes"] = result.get("overall_notes")

        db.insert(
            "ad_quality_scores",
            copy_draft_id=copy_draft_id,
            avatar_name=avatar_name,
            hook_score=result.get("hook_score", {}).get("score"),
            copy_score=result.get("copy_score", {}).get("score"),
            cta_score=result.get("cta_score", {}).get("score"),
            emotional_score=result.get("emotional_score", {}).get("score"),
            offer_score=result.get("offer_score", {}).get("score"),
            visual_copy_score=result.get("visual_copy_score", {}).get("score"),
            notes=json.dumps(notes, ensure_ascii=False),
            scored_at=db.now(),
        )

    return result


if __name__ == "__main__":
    demo = score_ad(
        primary_text=(
            "Nem minden sneaker egyforma. Vannak, amiket azért vesznek meg, "
            "mert trending. És vannak, amiket azért, mert tudják, mi áll "
            "mögöttük.\n\nA Jordan 4 az utóbbi."
        ),
        headline="Tudod a különbséget. A Jordan 4 is.",
        description="OG silhouette. Igazi kultúrtörténet. Nézd meg a kínálatot.",
    )
    print(json.dumps(demo, ensure_ascii=False, indent=2))
