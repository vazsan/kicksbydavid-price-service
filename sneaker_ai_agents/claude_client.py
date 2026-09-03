"""
Egyetlen belépési pont minden LLM-híváshoz (jelenleg OpenAI Chat Completions).
Ha modellt vagy hívási logikát váltasz, csak itt kell. A függvénynevek
("ask_claude*") a korábbi Anthropic-integrációból maradtak, hogy az
agents/*.py fájlokban ne kelljen semmit átírni.
"""
import json
from openai import OpenAI

from config import OPENAI_API_KEY, CLAUDE_MODEL_SMART

_client = OpenAI(api_key=OPENAI_API_KEY)


def ask_claude(system_prompt: str, user_prompt: str, model: str = CLAUDE_MODEL_SMART,
               max_tokens: int = 1500) -> str:
    """Egyszerű szöveges hívás. A hívó fél dönti el, hogyan dolgozza fel a választ."""
    response = _client.chat.completions.create(
        model=model,
        max_completion_tokens=max_tokens,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )
    return response.choices[0].message.content or ""


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
