"""
Customer Language Agent
-------------------------
Hivatalos Reddit API-t használ (PRAW). Regisztrálj egy "script" típusú
appot: reddit.com/prefs/apps -> ebből kapod a client_id / client_secret-et.
"""
import praw

from config import REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USER_AGENT
from claude_client import ask_claude_json
import db

SYSTEM = """
Sneaker közösségi nyelvezet elemző vagy. Megkapsz Reddit hozzászólásokat egy
adott termékről. Gyűjtsd ki, milyen SAJÁT SZAVAKKAL, kifejezésekkel
beszélnek róla az emberek - ne az általános marketing nyelvezetet add vissza,
hanem a valódi, hétköznapi (akár szlenges) megfogalmazásokat.

KIZÁRÓLAG tiszta JSON tömbbel válaszolj:
{"phrases": ["...", "...", ...]}
Max 15 elem.
"""


def collect_language(model_name: str, subreddit: str = "Sneakers", limit: int = 30) -> list[str]:
    reddit = praw.Reddit(
        client_id=REDDIT_CLIENT_ID,
        client_secret=REDDIT_CLIENT_SECRET,
        user_agent=REDDIT_USER_AGENT,
    )
    comments_text = []
    for submission in reddit.subreddit(subreddit).search(model_name, limit=10):
        submission.comments.replace_more(limit=0)
        for comment in submission.comments.list()[:limit]:
            comments_text.append(comment.body)

    if not comments_text:
        return []

    joined = "\n---\n".join(comments_text[:limit])
    result = ask_claude_json(SYSTEM, f"Termék: {model_name}\n\nKommentek:\n{joined}")
    phrases = result.get("phrases", [])
    for phrase in phrases:
        db.insert("customer_language", model=model_name, source=f"reddit/r/{subreddit}", phrase=phrase, collected_at=db.now())
    return phrases


if __name__ == "__main__":
    print(collect_language("Jordan 4"))
