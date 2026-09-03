"""
Egyetlen belépési pont minden Claude-híváshoz. Ha modellt vagy hívási
logikát váltasz, csak itt kell.
"""
import json
import anthropic

from config import ANTHROPIC_API_KEY, CLAUDE_MODEL_SMART

_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


def ask_claude(system_prompt: str, user_prompt: str, model: str = CLAUDE_MODEL_SMART,
               max_tokens: int = 1500) -> str:
    """Egyszerű szöveges hívás. A hívó fél dönti el, hogyan dolgozza fel a választ."""
    response = _client.messages.create(
        model=model,
        max_tokens=max_tokens,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
    )
    return "".join(block.text for block in response.content if block.type == "text")


def ask_claude_json(system_prompt: str, user_prompt: str, model: str = CLAUDE_MODEL_SMART,
                     max_tokens: int = 1500) -> dict:
    """
    Olyan hívásokhoz, ahol strukturált (JSON) választ várunk.
    A system promptban MINDIG kérj tiszta JSON-t, magyarázat/markdown nélkül.
    """
    raw = ask_claude(system_prompt, user_prompt, model=model, max_tokens=max_tokens)
    cleaned = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        return {"_parse_error": True, "raw": raw}
