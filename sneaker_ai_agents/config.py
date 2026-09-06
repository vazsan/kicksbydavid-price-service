"""
Központi beállítások. Minden érzékeny adat a .env fájlból jön - soha ne írj
API kulcsot közvetlenül ebbe a fájlba.
"""
import os
import unicodedata

from dotenv import load_dotenv

# Explicit útvonal, ne a cwd-től függjön: a cPanel Cron Job a szkriptet
# abszolút útvonalon, a projekt mappájától eltérő munkakönyvtárból indítja,
# ahol a paraméter nélküli load_dotenv() nem találná meg a .env fájlt.
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

# --- Anthropic (Claude API) ---
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
# Csak identitáshoz kötött (identity-linked) API kulcsoknál kell: a console.anthropic.com
# Settings -> Workspaces alatt található workspace ID. Hagyományos, egy workspace-hez
# rendelt kulcsnál üresen hagyható.
ANTHROPIC_WORKSPACE_ID = os.environ.get("ANTHROPIC_WORKSPACE_ID", "")
CLAUDE_MODEL_SMART = "claude-sonnet-4-6"          # kreatív / döntési feladatokhoz (copy, hook, angle)
CLAUDE_MODEL_FAST = "claude-haiku-4-5-20251001"   # egyszerű, nagy volumenű feladatokhoz (compliance, kategorizálás)

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

# --- Piacok, amikre hirdetünk ---
MARKETS = ["HU", "SK"]

# --- Termékek amiket követünk ---
TRACKED_MODELS = [
    "Jordan 4",
    "Jordan 1",
    "Nike Dunk Low",
    "New Balance 550",
    "Adidas Samba",
    "Asics Gel-Kayano 14",
]

# --- Avatárok (perszónák) modellenként ---
# Egy modellhez több avatár is tartozhat, és mindegyikre külön ICP / copy
# készül. Ha egy modell nincs itt felsorolva, a DEFAULT_AVATAR az alapértelmezett.
DEFAULT_AVATAR = "Általános vásárló"

AVATARS = {
    "Jordan 4": ["Sneakerhead fiatal felnőtt", "Szülő aki gyereknek vesz"],
    "Jordan 1": ["Sneakerhead fiatal felnőtt"],
    # Az alábbiakhoz még nincs kialakult perszónánk - ahogy jönnek a
    # tapasztalatok (performance, customer language), írd át konkrétabbra.
    "Nike Dunk Low": [DEFAULT_AVATAR],
    "New Balance 550": [DEFAULT_AVATAR],
    "Adidas Samba": [DEFAULT_AVATAR],
    "Asics Gel-Kayano 14": [DEFAULT_AVATAR],
}


def _to_avatar_code(avatar_name: str) -> str:
    """Nagybetűs, ékezet és szóköz nélküli kód, max 10 karakter."""
    decomposed = unicodedata.normalize("NFKD", avatar_name)
    without_accents = "".join(ch for ch in decomposed if not unicodedata.combining(ch))
    letters_only = "".join(ch for ch in without_accents if ch.isalnum())
    return letters_only.upper()[:10]


def _build_avatar_codes(avatars: dict) -> dict:
    """
    Az AVATARS összes egyedi avatár-nevéhez kódot generál (nem kézzel karban
    tartott lista). Ütközés esetén számozunk, a 10 karakteres hosszt tartva:
    pl. SNEAKERHEA -> SNEAKERHE2.
    """
    unique_names = dict.fromkeys(name for names in avatars.values() for name in names)

    codes = {}
    used = set()
    for name in unique_names:
        base = _to_avatar_code(name)
        code = base
        counter = 2
        while code in used:
            suffix = str(counter)
            code = base[:10 - len(suffix)] + suffix
            counter += 1
        used.add(code)
        codes[name] = code
    return codes


# Hirdetésnevekben ezek a kódok jelölik az avatárt (lásd ad_naming.py).
AVATAR_CODES = _build_avatar_codes(AVATARS)
AVATAR_CODES_REVERSE = {code: name for name, code in AVATAR_CODES.items()}

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
