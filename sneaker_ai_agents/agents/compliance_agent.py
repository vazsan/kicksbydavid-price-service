from claude_client import ask_claude_json
from config import CLAUDE_MODEL_FAST
from knowledge_base import COMPLIANCE_RULES
import db

SYSTEM = f"""
Te egy Meta hirdetés compliance ellenőr vagy.

{COMPLIANCE_RULES}

Vizsgáld meg a kapott hirdetésszöveget, és mondd meg, megfelel-e a fenti
szabályoknak.

KIZÁRÓLAG tiszta JSON-nal válaszolj:
{{"passed": true|false, "issues": ["...", ...]}}
Ha nincs probléma, az "issues" legyen üres tömb.
"""


def check_compliance(copy_draft_id: int, primary_text: str, headline: str, description: str) -> dict:
    user_prompt = f"Primary text: {primary_text}\nHeadline: {headline}\nDescription: {description}"
    result = ask_claude_json(SYSTEM, user_prompt, model=CLAUDE_MODEL_FAST)
    if not result.get("_parse_error"):
        import json
        db.insert(
            "compliance_checks",
            copy_draft_id=copy_draft_id,
            passed=1 if result.get("passed") else 0,
            issues=json.dumps(result.get("issues", []), ensure_ascii=False),
            checked_at=db.now(),
        )
    return result
