"""
Ezt hívja a cPanel Cron Job, naponta egyszer, pl. reggel 7-kor:

    /usr/local/bin/python3 /home/USERNEV/sneaker_ai_agents/run_daily_pipeline.py

A heti feladatokat (trend research, customer language, competitor/tiktok
összefoglaló) csak hétfőnként futtatjuk, hogy spóroljunk az API hívásokkal.
"""
import sys
import traceback
from datetime import datetime

from campaign_manager import run_daily_pipeline
from telegram_bot import send_message

if __name__ == "__main__":
    is_monday = datetime.now().weekday() == 0
    try:
        report = run_daily_pipeline(run_weekly_tasks=is_monday)
        send_message(report)  # a send_message darabolja, ha nem fér egy üzenetbe
    except Exception:
        error_text = f"❌ Pipeline hiba:\n{traceback.format_exc()}"
        print(error_text, file=sys.stderr)
        try:
            send_message(error_text)
        except Exception:
            pass
