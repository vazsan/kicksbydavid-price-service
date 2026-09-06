from claude_client import ask_claude_json
from config import CLAUDE_MODEL_SMART
from knowledge_base import AD_WRITING_PRINCIPLES
import db

SYSTEM = f"""
Te egy hook-generáló vagy sneaker hirdetésekhez. A hook az első 1-2 mondat,
aminek meg kell állítania a görgetést.

{AD_WRITING_PRINCIPLES}

Adott termékhez, avatárhoz (vásárlói perszónához) és marketing szöghöz
generálj 15-20 különböző hookot - arra az avatárra szabva, akit megkaptál.
Változatos stílusban: kíváncsiság, közvetlen állítás, kérdés, social proof jellegű.

KIZÁRÓLAG tiszta JSON tömbbel válaszolj:
{{"hooks": ["...", "...", ...]}}
"""


def generate_hooks(model_name: str, avatar_name: str, angle: str) -> list[str]:
    user_prompt = (
        f"Termék: {model_name}\n"
        f"Avatár: {avatar_name}\n"
        f"Marketing szög: {angle}"
    )
    result = ask_claude_json(SYSTEM, user_prompt, model=CLAUDE_MODEL_SMART, max_tokens=2000)
    hooks = result.get("hooks", [])
    for hook in hooks:
        db.insert(
            "hooks",
            model=model_name,
            avatar_name=avatar_name,
            hook_text=hook,
            generated_at=db.now(),
        )
    return hooks


if __name__ == "__main__":
    print(generate_hooks("Jordan 4", "Sneakerhead fiatal felnőtt", "A sneaker amit mindenki felismer."))
