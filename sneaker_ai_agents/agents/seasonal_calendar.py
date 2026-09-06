"""
Seasonal Calendar Agent
-------------------------
Fix szezonális események naptára. Nem hív API-t és nem generál szöveget -
csak azt nézi meg, melyik esemény van már olyan közel, hogy el kell kezdeni
rá kampányt tervezni (eseményenként külön átfutási idővel).
"""
from datetime import date

SEASONAL_EVENTS = [
    {"name": "Iskolakezdés", "date": "08-20", "lead_days": 14, "markets": ["HU", "SK"]},
    {"name": "Mikulás", "date": "12-06", "lead_days": 21, "markets": ["HU", "SK"]},
    {"name": "Karácsony", "date": "12-24", "lead_days": 30, "markets": ["HU", "SK"]},
    {"name": "Black Friday", "date": "11-28", "lead_days": 21, "markets": ["HU", "SK"]},
]


def _next_occurrence(event_date: str, today: date) -> date:
    """Az esemény idei dátuma - ha az már elmúlt, akkor a jövő évi."""
    month, day = (int(part) for part in event_date.split("-"))
    this_year = date(today.year, month, day)
    return this_year if this_year >= today else date(today.year + 1, month, day)


def check_upcoming_events(today: date = None) -> list[str]:
    today = today or date.today()

    reminders = []
    for event in SEASONAL_EVENTS:
        days_left = (_next_occurrence(event["date"], today) - today).days
        if days_left <= event["lead_days"]:
            reminders.append(
                f"📅 {event['name']} már csak {days_left} nap - kezdj kampányt tervezni "
                f"({', '.join(event['markets'])})"
            )
    return reminders


if __name__ == "__main__":
    for line in check_upcoming_events():
        print(line)
