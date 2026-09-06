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
import json

import requests
from flask import Flask, request, jsonify

from config import TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
import db

app = Flask(__name__)

TELEGRAM_API = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}"


def send_message(text: str, chat_id: str = None) -> None:
    chat_id = chat_id or TELEGRAM_CHAT_ID
    if not TELEGRAM_BOT_TOKEN or not chat_id:
        print("Telegram nincs beállítva, üzenet kihagyva.")
        return
    requests.post(f"{TELEGRAM_API}/sendMessage", json={"chat_id": chat_id, "text": text}, timeout=15)


def request_approval(request_type: str, description: str, payload: dict) -> int:
    """
    Rögzít egy jóváhagyásra váró kérést, és kiküldi Telegramon.

    A pipeline NEM vár a válaszra és nem pollozza az állapotot - csak elküldi
    a kérést, a többi a te kezedben van (/approve <id> vagy /reject <id>).
    """
    request_id = db.insert(
        "approval_requests",
        request_type=request_type,
        description=description,
        payload_json=json.dumps(payload, ensure_ascii=False),
        status="pending",
        created_at=db.now(),
    )
    send_message(
        f"⏳ Jóváhagyás szükséges (#{request_id}): {description}\n\n"
        f"Válaszolj: /approve {request_id} vagy /reject {request_id}"
    )
    return request_id


MAP_AD_USAGE = (
    "Formátum: /map_ad <hirdetésnév> | <avatár> | <sablon> | <piac>\n"
    "Példa: /map_ad Régi Jordan hirdetés 2024 | Sneakerhead fiatal felnőtt | video | HU"
)


def _handle_map_ad(argument: str, chat_id) -> None:
    parts = [part.strip().strip('"').strip("'") for part in argument.split("|")]
    if len(parts) != 4 or not all(parts):
        send_message(f"Hibás formátum.\n\n{MAP_AD_USAGE}", chat_id=chat_id)
        return

    ad_name, avatar_name, template, market = parts
    db.upsert_ad_mapping(ad_name, avatar_name, template, market)
    send_message(
        f"✅ Leképezés mentve:\n{ad_name}\n-> avatár: {avatar_name} | sablon: {template} | piac: {market}",
        chat_id=chat_id,
    )


def _resolve_approval(command: str, raw_id: str, chat_id) -> None:
    new_status = "approved" if command == "/approve" else "rejected"
    try:
        request_id = int(raw_id.strip())
    except ValueError:
        send_message(f"Érvénytelen azonosító. Használat: {command} <id>", chat_id=chat_id)
        return

    rows = db.query("SELECT * FROM approval_requests WHERE id = ?", (request_id,))
    if not rows:
        send_message(f"Nincs ilyen jóváhagyási kérés: #{request_id}", chat_id=chat_id)
        return

    row = rows[0]
    if row["status"] != "pending":
        send_message(
            f"A #{request_id} kérés már el van intézve ({row['status']}).", chat_id=chat_id
        )
        return

    db.execute(
        "UPDATE approval_requests SET status = ?, resolved_at = ? WHERE id = ?",
        (new_status, db.now(), request_id),
    )

    # TODO: A jóváhagyás itt SZÁNDÉKOSAN nem hajt végre semmit. A tényleges
    # lépés (pl. büdzsé módosítás, hirdetés leállítása/skálázása) egyelőre
    # kézi feladat a Meta Ads Managerben. Ha később automatizálod, ide jön a
    # végrehajtás - és csak akkor, ha new_status == "approved".
    label = "jóváhagyva" if new_status == "approved" else "elutasítva"
    send_message(
        f"✅ #{request_id} {label}: {row['description']}\n\n"
        f"Ne feledd: a tényleges végrehajtás egyelőre kézi lépés (Ads Manager).",
        chat_id=chat_id,
    )


@app.route(f"/webhook/{TELEGRAM_BOT_TOKEN}", methods=["POST"])
def webhook():
    update = request.get_json(force=True, silent=True) or {}
    message = update.get("message", {})
    chat_id = message.get("chat", {}).get("id")
    text = (message.get("text") or "").strip()

    if not chat_id:
        return jsonify(ok=True)

    if text == "/start":
        send_message(
            "Szia! Ez a sneaker ad-agent botod.\n"
            "Parancsok: /report, /approve <id>, /reject <id>, /map_ad",
            chat_id=chat_id,
        )
    elif text == "/report":
        send_message("Rendben, generálom a jelentést... (ez eltarthat pár percig)", chat_id=chat_id)
        from campaign_manager import run_daily_pipeline
        report = run_daily_pipeline(run_weekly_tasks=False)
        send_message(report[:4000], chat_id=chat_id)
    elif text.startswith("/approve") or text.startswith("/reject"):
        command, _, raw_id = text.partition(" ")
        _resolve_approval(command, raw_id, chat_id)
    elif text.startswith("/map_ad"):
        _, _, argument = text.partition(" ")
        _handle_map_ad(argument, chat_id)
    else:
        send_message("Nem ismert parancs. Próbáld: /report", chat_id=chat_id)

    return jsonify(ok=True)


if __name__ == "__main__":
    # helyi teszteléshez, cPanelen a passenger_wsgi.py-n keresztül fut
    app.run(port=5000, debug=True)
