"""
Telegram Bot - webhook módban.
--------------------------------
Nem "hallgat" folyamatosan (long polling) - Telegram HTTP kérésben küldi
neked az üzeneteket erre az endpointra, ezért simán elfér cPanelen, mint
egy sima Python webapp (Passenger).

Beállítás (1x):
1. Hozz létre egy botot a @BotFather-nél, mentsd el a TELEGRAM_BOT_TOKEN-t.
2. Töltsd fel ezt az appot a cPanelre (lásd README).
3. Állítsd be a webhookot (a saját domained/tokened behelyettesítésével):

   curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://TE_DOMAINED.hu/webhook/<TELEGRAM_BOT_TOKEN>"

4. Írj a botnak /start-ot, majd nézd meg a chat_id-t (lásd get_updates.py
   segédscript, vagy a webhook logból), és töltsd ki a TELEGRAM_CHAT_ID-t
   a .env-ben.
"""
import requests
from flask import Flask, request, jsonify

from config import TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID

app = Flask(__name__)

TELEGRAM_API = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}"


def send_message(text: str, chat_id: str = None) -> None:
    chat_id = chat_id or TELEGRAM_CHAT_ID
    if not TELEGRAM_BOT_TOKEN or not chat_id:
        print("Telegram nincs beállítva, üzenet kihagyva.")
        return
    requests.post(f"{TELEGRAM_API}/sendMessage", json={"chat_id": chat_id, "text": text}, timeout=15)


@app.route(f"/webhook/{TELEGRAM_BOT_TOKEN}", methods=["POST"])
def webhook():
    update = request.get_json(force=True, silent=True) or {}
    message = update.get("message", {})
    chat_id = message.get("chat", {}).get("id")
    text = (message.get("text") or "").strip()

    if not chat_id:
        return jsonify(ok=True)

    if text == "/start":
        send_message("Szia! Ez a sneaker ad-agent botod. Parancsok: /report", chat_id=chat_id)
    elif text == "/report":
        send_message("Rendben, generálom a jelentést... (ez eltarthat pár percig)", chat_id=chat_id)
        from campaign_manager import run_daily_pipeline
        report = run_daily_pipeline(run_weekly_tasks=False)
        send_message(report[:4000], chat_id=chat_id)
    else:
        send_message("Nem ismert parancs. Próbáld: /report", chat_id=chat_id)

    return jsonify(ok=True)


if __name__ == "__main__":
    # helyi teszteléshez, cPanelen a passenger_wsgi.py-n keresztül fut
    app.run(port=5000, debug=True)
