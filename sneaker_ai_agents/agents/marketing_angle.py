from claude_client import ask_claude_json
from config import CLAUDE_MODEL_SMART
from knowledge_base import AD_WRITING_PRINCIPLES
import db

SYSTEM = f"""
Te egy marketing-szög (angle) generáló vagy sneaker hirdetésekhez.

{AD_WRITING_PRINCIPLES}

Egy adott termékhez és ICP-hez generálj 5-8 különböző marketing szöget.
Minden szög egy rövid, ütős mondat legyen, ami egy adott motivációra épít.

KIZÁRÓLAG tiszta JSON tömbbel válaszolj:
{{"angles": ["...", "...", ...]}}
"""


def generate_angles(model_name: str, icp: dict) -> list[str]:
    user_prompt = (
        f"Termék: {model_name}\n"
        f"WHO: {icp.get('who', '')}\n"
        f"WHAT: {icp.get('what', '')}\n"
        f"WHERE: {icp.get('where', '')}\n"
    )
    result = ask_claude_json(SYSTEM, user_prompt, model=CLAUDE_MODEL_SMART)
    angles = result.get("angles", [])
    for angle in angles:
        db.insert("marketing_angles", model=model_name, angle_text=angle, generated_at=db.now())
    return angles


if __name__ == "__main__":
    demo_icp = {"who": "18-35 éves férfi", "what": "státusz, önkifejezés", "where": "Instagram, TikTok"}
    print(generate_angles("Jordan 4", demo_icp))
