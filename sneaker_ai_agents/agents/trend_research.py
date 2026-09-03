"""
Trend Research Agent
---------------------
Két, ingyenes/nem-hivatalos-de-alacsony-kockázatú forrás kombinációja:
1. Google Trends (pytrends) - relatív érdeklődési index modellenként.
2. Sneaker hír RSS feedek - miről írnak most a szaksajtóban.

A pytrends nem hivatalos Google csomag, időnként törhet - ezért try/except-be
csomagoljuk, és nem állítjuk meg tőle a teljes pipeline-t.
"""
import feedparser

from config import TRACKED_MODELS, TREND_RSS_FEEDS
from claude_client import ask_claude_json
import db

try:
    from pytrends.request import TrendReq
except ImportError:
    TrendReq = None

SYSTEM = """
Sneaker piaci trendelemző vagy. Megkapod a Google Trends relatív érdeklődési
adatokat és a legfrissebb sneaker hírcímeket. Ez alapján állíts össze két listát.

KIZÁRÓLAG tiszta JSON-nal válaszolj:
{"rising": ["modell - miért érdemes most tolni", ...],
 "falling": ["modell - miért csökken az érdeklődés", ...]}
Max 10-10 elem.
"""


def _get_trends_scores(models: list[str]) -> dict:
    if TrendReq is None:
        return {}
    scores = {}
    try:
        pytrends = TrendReq(hl="hu-HU", tz=60)
        for i in range(0, len(models), 5):  # a Trends API max 5 kulcsszót fogad egyszerre
            batch = models[i:i + 5]
            pytrends.build_payload(batch, timeframe="now 7-d")
            df = pytrends.interest_over_time()
            if not df.empty:
                for m in batch:
                    if m in df.columns:
                        scores[m] = int(df[m].mean())
    except Exception as e:  # a pytrends gyakran instabil, ne buktassa el a pipeline-t
        scores["_error"] = str(e)
    return scores


def _get_recent_headlines(limit_per_feed: int = 10) -> list[str]:
    headlines = []
    for feed_url in TREND_RSS_FEEDS:
        try:
            parsed = feedparser.parse(feed_url)
            headlines.extend(entry.title for entry in parsed.entries[:limit_per_feed])
        except Exception:
            continue
    return headlines


def run_trend_research() -> dict:
    scores = _get_trends_scores(TRACKED_MODELS)
    headlines = _get_recent_headlines()

    user_prompt = f"Google Trends pontszámok (0-100): {scores}\n\nFrissi sneaker hírcímek:\n" + "\n".join(headlines)
    result = ask_claude_json(SYSTEM, user_prompt)

    for model in result.get("rising", []):
        db.insert("trends", model=model, direction="rising", source="trend_research_agent", notes="", created_at=db.now())
    for model in result.get("falling", []):
        db.insert("trends", model=model, direction="falling", source="trend_research_agent", notes="", created_at=db.now())

    return result


if __name__ == "__main__":
    print(run_trend_research())
