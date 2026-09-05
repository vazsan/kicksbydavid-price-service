"""
Account Health Agent
----------------------
A SAJÁT hirdetési fiókod Meta Marketing API adatai alapján 5 konkrét,
mérhető ellenőrzést futtat (nem 186 külön checket - egy MVP-hez ennyi
elég), Python kóddal, NEM Claude-dal (ezek egyszerű szám-összehasonlítások).
A talált problémákból a Claude fogalmaz meg egy rövid, prioritizált
akciótervet.
"""
import json
from datetime import date, timedelta

import requests

from claude_client import ask_claude
from config import META_ACCESS_TOKEN, META_GRAPH_VERSION, META_AD_ACCOUNT_ID
import db

BASE_URL = f"https://graph.facebook.com/{META_GRAPH_VERSION}/{META_AD_ACCOUNT_ID}/insights"

FIELDS = "ad_name,frequency,cpm,ctr,spend,purchase_roas,actions"
PLACEMENT_FIELDS = "ad_name,spend,actions"
PLACEMENT_BREAKDOWNS = "publisher_platform,platform_position"

# health_score = 100 - (a talált check-típusonként levont pont), 0 alá nem mehet
PENALTY_BY_CHECK = {
    "creative_fatigue": 15,
    "cpm_anomaly": 10,
    "frequency_violation": 15,
    "placement_underperformance": 10,
    "spend_concentration": 20,
}

SYSTEM = """
Meta hirdetési fiók-egészség elemző vagy. Megkapod az automatikusan
kiszámolt problémákat (creative fatigue, CPM anomália, frequency
túllépés, gyenge placement, költés-koncentráció). Ebből fogalmazz meg
MAX 5 PONTOS, konkrét, prioritizált akciótervet magyarul - minden pont
mondja meg, MIT kell tenni és MIÉRT (melyik hirdetéssel/adattal
kapcsolatban).
"""


def _time_range(start_days_ago: int, end_days_ago: int) -> str:
    today = date.today()
    since = today - timedelta(days=start_days_ago)
    until = today - timedelta(days=end_days_ago)
    return json.dumps({"since": since.isoformat(), "until": until.isoformat()})


def _fetch_insights(fields: str, time_range: str, breakdowns: str = None) -> list[dict]:
    if not META_ACCESS_TOKEN or not META_AD_ACCOUNT_ID:
        raise RuntimeError("META_ACCESS_TOKEN vagy META_AD_ACCOUNT_ID nincs beállítva.")

    params = {
        "level": "ad",
        "fields": fields,
        "time_range": time_range,
        "access_token": META_ACCESS_TOKEN,
    }
    if breakdowns:
        params["breakdowns"] = breakdowns

    try:
        resp = requests.get(BASE_URL, params=params, timeout=30)
        resp.raise_for_status()
    except requests.exceptions.RequestException as e:
        # Ne engedjük, hogy az access_token (URL query param) belekerüljön a
        # hibaüzenetbe - lásd performance_agent.py.
        raise RuntimeError(f"Meta Marketing API kérés sikertelen ({type(e).__name__}).") from e
    return resp.json().get("data", [])


def fetch_health_metrics() -> dict:
    last_7d = _time_range(7, 1)
    previous_7d = _time_range(14, 8)

    return {
        "last_7d": _fetch_insights(FIELDS, last_7d),
        "previous_7d": _fetch_insights(FIELDS, previous_7d),
        # A publisher_platform/platform_position csak breakdowns-ként kérhető
        # le, nem sima mezőként - lásd Marketing API Insights dokumentáció.
        "placements_last_7d": _fetch_insights(
            PLACEMENT_FIELDS, last_7d, breakdowns=PLACEMENT_BREAKDOWNS
        ),
    }


def _extract_roas(row: dict) -> float:
    roas_list = row.get("purchase_roas", [])
    return float(roas_list[0]["value"]) if roas_list else 0.0


def _extract_purchases(row: dict) -> int:
    for action in row.get("actions", []) or []:
        if action.get("action_type") == "purchase":
            return int(action.get("value", 0))
    return 0


def _check_creative_fatigue(last_7d: list[dict], previous_7d: list[dict]) -> list[dict]:
    """1) frequency > 3.0 ÉS a CTR csökkenő trendet mutat az előző 7 naphoz képest."""
    previous_by_name = {row.get("ad_name"): row for row in previous_7d}
    issues = []
    for row in last_7d:
        frequency = float(row.get("frequency", 0) or 0)
        if frequency <= 3.0:
            continue
        prev_row = previous_by_name.get(row.get("ad_name"))
        if prev_row is None:
            continue
        curr_ctr = float(row.get("ctr", 0) or 0)
        prev_ctr = float(prev_row.get("ctr", 0) or 0)
        if curr_ctr < prev_ctr:
            issues.append({
                "type": "creative_fatigue",
                "ad_name": row.get("ad_name", ""),
                "detail": f"frequency={frequency:.2f}, CTR {prev_ctr:.2f}% -> {curr_ctr:.2f}% (csökkenő)",
            })
    return issues


def _check_cpm_anomaly(last_7d: list[dict]) -> list[dict]:
    """2) egy hirdetés CPM-je >30%-kal magasabb a fiók átlagos CPM-jénél."""
    cpms = [float(row.get("cpm", 0) or 0) for row in last_7d]
    avg_cpm = sum(cpms) / len(cpms) if cpms else 0.0
    if avg_cpm <= 0:
        return []
    issues = []
    for row in last_7d:
        cpm = float(row.get("cpm", 0) or 0)
        if cpm > avg_cpm * 1.3:
            issues.append({
                "type": "cpm_anomaly",
                "ad_name": row.get("ad_name", ""),
                "detail": f"CPM={cpm:.2f} (fiók átlag={avg_cpm:.2f}, +{(cpm / avg_cpm - 1) * 100:.0f}%)",
            })
    return issues


def _check_frequency_violation(last_7d: list[dict]) -> list[dict]:
    """3) frequency > 4.0."""
    issues = []
    for row in last_7d:
        frequency = float(row.get("frequency", 0) or 0)
        if frequency > 4.0:
            issues.append({
                "type": "frequency_violation",
                "ad_name": row.get("ad_name", ""),
                "detail": f"frequency={frequency:.2f} (> 4.0)",
            })
    return issues


def _check_placement_underperformance(placements: list[dict]) -> list[dict]:
    """4) ha van placement bontás, jelezd a legrosszabb CPA-jú placementet."""
    scored = []
    for row in placements:
        purchases = _extract_purchases(row)
        if purchases <= 0:
            continue
        spend = float(row.get("spend", 0) or 0)
        scored.append((spend / purchases, row))
    if not scored:
        return []
    worst_cpa, worst_row = max(scored, key=lambda pair: pair[0])
    platform = worst_row.get("publisher_platform", "?")
    position = worst_row.get("platform_position", "?")
    return [{
        "type": "placement_underperformance",
        "ad_name": worst_row.get("ad_name", ""),
        "detail": f"Legrosszabb CPA placement: {platform}/{position}, CPA={worst_cpa:.2f}",
    }]


def _check_spend_concentration(last_7d: list[dict]) -> list[dict]:
    """5) egy hirdetés viszi a napi költés >50%-át, de a ROAS-a átlag alatt van."""
    total_spend = sum(float(row.get("spend", 0) or 0) for row in last_7d)
    if total_spend <= 0:
        return []
    roas_values = [_extract_roas(row) for row in last_7d]
    avg_roas = sum(roas_values) / len(roas_values) if roas_values else 0.0

    issues = []
    for row in last_7d:
        spend = float(row.get("spend", 0) or 0)
        share = spend / total_spend
        roas = _extract_roas(row)
        if share > 0.5 and roas < avg_roas:
            issues.append({
                "type": "spend_concentration",
                "ad_name": row.get("ad_name", ""),
                "detail": f"költés részesedés={share * 100:.0f}% (ROAS={roas:.2f}, fiók átlag={avg_roas:.2f})",
            })
    return issues


def _compute_health_score(issues: list[dict]) -> int:
    triggered_types = {issue["type"] for issue in issues}
    score = 100 - sum(PENALTY_BY_CHECK[t] for t in triggered_types)
    return max(0, score)


def run_health_check() -> dict:
    metrics = fetch_health_metrics()
    last_7d = metrics["last_7d"]
    previous_7d = metrics["previous_7d"]
    placements = metrics["placements_last_7d"]

    issues = (
        _check_creative_fatigue(last_7d, previous_7d)
        + _check_cpm_anomaly(last_7d)
        + _check_frequency_violation(last_7d)
        + _check_placement_underperformance(placements)
        + _check_spend_concentration(last_7d)
    )

    health_score = _compute_health_score(issues)

    if issues:
        formatted = "\n".join(f"- [{i['type']}] {i['ad_name']}: {i['detail']}" for i in issues)
        actions = ask_claude(SYSTEM, formatted)
    else:
        actions = "Nincs észlelt probléma - a fiók egészséges állapotban van."

    db.insert(
        "account_health",
        health_score=health_score,
        issues=json.dumps(issues, ensure_ascii=False),
        actions=actions,
        checked_at=db.now(),
    )

    return {"health_score": health_score, "issues": issues, "actions": actions}


if __name__ == "__main__":
    print(json.dumps(run_health_check(), ensure_ascii=False, indent=2))
