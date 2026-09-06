"""
Egyszerű SQLite réteg. Ha később PostgreSQL-re váltasz, csak ezt a fájlt
kell lecserélni - a többi agent csak ezeken a függvényeken keresztül ér
hozzá az adatokhoz.
"""
import sqlite3
import json
from datetime import datetime, timezone
from contextlib import contextmanager

from config import DB_PATH

SCHEMA = """
CREATE TABLE IF NOT EXISTS trends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model TEXT, direction TEXT, source TEXT, notes TEXT,
    created_at TEXT
);

CREATE TABLE IF NOT EXISTS competitor_ads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    competitor TEXT, model TEXT, promo_type TEXT,
    text_used TEXT, creative_type TEXT, notes TEXT,
    logged_at TEXT
);

CREATE TABLE IF NOT EXISTS meta_ads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model TEXT, page_name TEXT, ad_text TEXT,
    ad_delivery_start_time TEXT, days_running INTEGER,
    snapshot_url TEXT, fetched_at TEXT
);

CREATE TABLE IF NOT EXISTS customer_language (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model TEXT, source TEXT, phrase TEXT, collected_at TEXT
);

CREATE TABLE IF NOT EXISTS icp (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model TEXT, who TEXT, what TEXT, where_ TEXT, generated_at TEXT
);

CREATE TABLE IF NOT EXISTS marketing_angles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model TEXT, angle_text TEXT, generated_at TEXT
);

CREATE TABLE IF NOT EXISTS hooks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model TEXT, hook_text TEXT, generated_at TEXT, used INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS creative_briefs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model TEXT, format TEXT, shots_json TEXT, generated_at TEXT
);

CREATE TABLE IF NOT EXISTS copy_drafts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model TEXT, primary_text TEXT, headline TEXT, description TEXT,
    hook_id INTEGER, angle_id INTEGER, generated_at TEXT
);

CREATE TABLE IF NOT EXISTS compliance_checks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    copy_draft_id INTEGER, passed INTEGER, issues TEXT, checked_at TEXT
);

CREATE TABLE IF NOT EXISTS performance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ad_name TEXT, model TEXT, ctr REAL, cpc REAL, cpm REAL,
    roas REAL, purchases INTEGER, date_range TEXT, fetched_at TEXT
);

CREATE TABLE IF NOT EXISTS learnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    insight TEXT, supporting_data TEXT, created_at TEXT
);

CREATE TABLE IF NOT EXISTS daily_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_text TEXT, created_at TEXT
);

CREATE TABLE IF NOT EXISTS gap_analysis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model TEXT, top_hooks TEXT, offer_patterns TEXT, cta_patterns TEXT, gaps TEXT,
    generated_at TEXT
);

CREATE TABLE IF NOT EXISTS account_health (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    health_score INTEGER, issues TEXT, actions TEXT, checked_at TEXT
);

CREATE TABLE IF NOT EXISTS ad_quality_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    copy_draft_id INTEGER,
    hook_score INTEGER, copy_score INTEGER, cta_score INTEGER,
    emotional_score INTEGER, offer_score INTEGER, visual_copy_score INTEGER,
    notes TEXT, scored_at TEXT
);

CREATE TABLE IF NOT EXISTS budget_plan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    market TEXT, avatar_name TEXT, planned_daily_spend REAL,
    valid_from TEXT
);

CREATE TABLE IF NOT EXISTS approval_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_type TEXT, description TEXT, payload_json TEXT,
    status TEXT DEFAULT 'pending', created_at TEXT, resolved_at TEXT
);
"""

# CREATE TABLE IF NOT EXISTS nem ad hozzá oszlopot már létező táblához - ezek
# az ALTER TABLE-lel utólag hozzáadott oszlopok a meglévő táblákhoz (lásd
# migrate_schema()). Új tábláknál a fenti SCHEMA-ba kell felvenni az oszlopot,
# ide csak azért kerül, mert a tábla már létezett a bevezetése előtt.
COLUMN_MIGRATIONS = {
    "icp": ["avatar_name TEXT"],
    "creative_briefs": ["avatar_name TEXT", "template TEXT", "market TEXT"],
    "copy_drafts": ["avatar_name TEXT", "template TEXT", "market TEXT"],
    "hooks": ["avatar_name TEXT"],
    "performance": ["avatar_name TEXT", "template TEXT", "market TEXT"],
    "marketing_angles": ["avatar_name TEXT"],
    "compliance_checks": ["avatar_name TEXT"],
    "ad_quality_scores": ["avatar_name TEXT"],
}


@contextmanager
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def migrate_schema():
    """
    A CREATE TABLE IF NOT EXISTS nem ad hozzá oszlopot már létező táblához -
    ezt itt, ALTER TABLE-lel pótoljuk. Az "oszlop már létezik" hibát
    figyelmen kívül hagyjuk, minden mást nem.
    """
    with get_conn() as conn:
        for table, column_defs in COLUMN_MIGRATIONS.items():
            for column_def in column_defs:
                try:
                    conn.execute(f"ALTER TABLE {table} ADD COLUMN {column_def}")
                except sqlite3.OperationalError as e:
                    if "duplicate column name" not in str(e):
                        raise


def init_db():
    with get_conn() as conn:
        conn.executescript(SCHEMA)
    migrate_schema()


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def insert(table: str, **fields) -> int:
    cols = ", ".join(fields.keys())
    placeholders = ", ".join("?" for _ in fields)
    with get_conn() as conn:
        cur = conn.execute(
            f"INSERT INTO {table} ({cols}) VALUES ({placeholders})",
            tuple(fields.values()),
        )
        return cur.lastrowid


def query(sql: str, params: tuple = ()) -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute(sql, params).fetchall()
        return [dict(r) for r in rows]


def latest_for_model(table: str, model: str, limit: int = 1,
                     avatar_name: str = None) -> list[dict]:
    order_col = "generated_at" if table in (
        "icp", "marketing_angles", "hooks", "creative_briefs", "copy_drafts"
    ) else "id"

    sql = f"SELECT * FROM {table} WHERE model = ?"
    params = [model]
    if avatar_name is not None:
        sql += " AND avatar_name = ?"
        params.append(avatar_name)
    sql += f" ORDER BY {order_col} DESC LIMIT ?"
    params.append(limit)

    return query(sql, tuple(params))


if __name__ == "__main__":
    init_db()
    print(f"Adatbázis inicializálva: {DB_PATH}")
