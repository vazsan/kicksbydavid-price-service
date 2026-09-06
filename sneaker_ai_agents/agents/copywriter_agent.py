from claude_client import ask_claude_json
from config import CLAUDE_MODEL_SMART
from knowledge_base import AD_WRITING_PRINCIPLES
import db

SYSTEM = f"""
Te egy Facebook hirdetés copywriter vagy sneaker termékekhez.
Csak akkor írsz, ha megkaptad az avatárt (vásárlói perszónát), az ICP-t, a
marketing szöget, a hookot és a kreatív tervet - ezeket mindig felhasználod,
nem találsz ki mást. A szöveget mindig a KONKRÉT avatárhoz beszélve írd.

{AD_WRITING_PRINCIPLES}

KIZÁRÓLAG tiszta JSON-nal válaszolj:
{{"primary_text": "...", "headline": "...", "description": "..."}}
"""


def write_copy(model_name: str, avatar_name: str, icp: dict, angle: str, hook: str,
               creative_brief: dict) -> dict:
    user_prompt = (
        f"Termék: {model_name}\n"
        f"Avatár: {avatar_name}\n"
        f"ICP - WHO: {icp.get('who', '')} | WHAT: {icp.get('what', '')} | WHERE: {icp.get('where', '')}\n"
        f"Marketing szög: {angle}\n"
        f"Hook: {hook}\n"
        f"Kreatív formátum: {creative_brief.get('format', '')}\n"
    )
    result = ask_claude_json(SYSTEM, user_prompt, model=CLAUDE_MODEL_SMART)
    if not result.get("_parse_error"):
        db.insert(
            "copy_drafts",
            model=model_name,
            avatar_name=avatar_name,
            primary_text=result.get("primary_text", ""),
            headline=result.get("headline", ""),
            description=result.get("description", ""),
            # A template egyelőre a kreatív brief formátuma (pl. "carousel").
            template=creative_brief.get("format", ""),
            hook_id=None,
            angle_id=None,
            generated_at=db.now(),
        )
    return result
