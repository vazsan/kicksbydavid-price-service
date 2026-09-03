"""
Központi beállítások. Minden érzékeny adat a .env fájlból jön - soha ne írj
API kulcsot közvetlenül ebbe a fájlba.
"""
import os
from dotenv import load_dotenv

load_dotenv()

# --- OpenAI (Chat Completions API) ---
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
# A "CLAUDE_MODEL_*" elnevezés a korábbi Anthropic-integrációból maradt -
# ezeket most a claude_client.py OpenAI modellekhez használja, hogy az
# agents/*.py fájlokban ne kelljen semmit átírni.
CLAUDE_MODEL_SMART = "gpt-4o"        # kreatív / döntési feladatokhoz (copy, hook, angle)
CLAUDE_MODEL_FAST = "gpt-4o-mini"    # egyszerű, nagy volumenű feladatokhoz (compliance, kategorizálás)

# --- Meta Ad Library API (ingyenes, de identitás-ellenőrzés kell: facebook.com/ID) ---
META_ACCESS_TOKEN = os.environ.get("META_ACCESS_TOKEN", "")
META_GRAPH_VERSION = "v26.0"  # ellenőrizd: developers.facebook.com/docs/graph-api/changelog - kb. negyedévente változik
# FONTOS: az Ad Library API globálisan csak politikai/issue hirdetéseket fed le teljeskörűen.
# Nem politikai hirdetéseknél csak az EU-ba/UK-ba érkező hirdetések vannak lefedve.
# Mivel HU/EU piacra dolgozol, ez rád nézve jó hír - de mindig EU-s ország kódot használj.
META_AD_REACHED_COUNTRIES = ["HU"]  # állítsd a saját célpiacodra, pl. ["HU","RO","SK"]

# --- Meta Marketing API (a SAJÁT hirdetési fiókod teljesítmény adatai) ---
META_AD_ACCOUNT_ID = os.environ.get("META_AD_ACCOUNT_ID", "")  # formátum: act_1234567890

# --- Reddit API (hivatalos, ingyenes) ---
REDDIT_CLIENT_ID = os.environ.get("REDDIT_CLIENT_ID", "")
REDDIT_CLIENT_SECRET = os.environ.get("REDDIT_CLIENT_SECRET", "")
REDDIT_USER_AGENT = "sneaker-ai-agents/0.1"

# --- Telegram ---
TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID", "")  # ide megy a napi jelentés

# --- Termékek amiket követünk ---
TRACKED_MODELS = [
    "Jordan 4",
    "Jordan 1",
    "Nike Dunk Low",
    "New Balance 550",
    "Adidas Samba",
    "Asics Gel-Kayano 14",
]

# --- Versenytársak (Competitor Intelligence Agent - egyelőre fél-manuális) ---
COMPETITORS = [
    "Footshop", "Sizeer", "Restocks", "Wethenew", "Snipes", "JD Sports", "Foot Locker",
]

# --- Sneaker hír RSS források a Trend Research Agenthez ---
TREND_RSS_FEEDS = [
    "https://sneakernews.com/feed/",
    "https://www.solecollector.com/feed",
]

DB_PATH = os.environ.get("DB_PATH", os.path.join(os.path.dirname(__file__), "sneaker_agents.db"))
