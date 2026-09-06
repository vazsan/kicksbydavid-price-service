"""
Campaign Manager Agent
------------------------
A "főnök": minden nyomon követett modellhez végigviszi a láncot, és
összeállítja a napi jelentést. Ezt hívja a cron job / a Telegram bot.

Megjegyzés: költség/idő-takarékosság miatt nem minden lépést futtatunk
minden nap teljes egészében:
- Meta Ad Library lekérés: naponta (gyors, olcsó)
- ICP / marketing angle: csak akkor generálunk újat, ha még nincs friss
- Hook / copy / compliance: naponta, hogy legyen friss anyag tesztelésre
- Trend research / customer language: heti 1x elég (API/token spórolás)
"""
import random
from datetime import datetime, timedelta

from config import TRACKED_MODELS, AVATARS, DEFAULT_AVATAR
import db
import telegram_bot

from agents import icp_agent, marketing_angle, hook_agent, creative_director
from agents import copywriter_agent, compliance_agent, meta_ad_library
from agents import trend_research, customer_language, competitor_intel, tiktok_creative
from agents import performance_agent, creative_learning
from agents import gap_analysis, account_health, ad_quality_scorer, seasonal_calendar

QUALITY_DIMENSION_LABELS = {
    "hook_score": "hook",
    "copy_score": "copy",
    "cta_score": "CTA",
    "emotional_score": "emotional",
    "offer_score": "offer",
    "visual_copy_score": "visual copy",
}


def _get_or_generate_icp(model: str, avatar_name: str) -> dict:
    existing = db.latest_for_model("icp", model, avatar_name=avatar_name)
    if existing:
        row = existing[0]
        return {"who": row["who"], "what": row["what"], "where": row["where_"]}
    return icp_agent.generate_icp(model, avatar_name)


def run_daily_pipeline(run_weekly_tasks: bool = False) -> str:
    db.init_db()
    report_sections = [f"📋 Napi jelentés - {datetime.now().strftime('%Y-%m-%d')}\n"]

    # Szezonális figyelmeztetések a riport legelejére (reversed + insert(0),
    # hogy több találat esetén megmaradjon az eredeti sorrendjük).
    try:
        for reminder in reversed(seasonal_calendar.check_upcoming_events()):
            report_sections.insert(0, reminder)
    except Exception as e:
        report_sections.append(f"⚠️ Seasonal Calendar hiba: {e}")

    if run_weekly_tasks:
        try:
            trend_result = trend_research.run_trend_research()
            report_sections.append(
                "🔥 Felfutó modellek: " + ", ".join(trend_result.get("rising", [])[:5])
            )
            report_sections.append(
                "📉 Lecsengő modellek: " + ", ".join(trend_result.get("falling", [])[:5])
            )
        except Exception as e:
            report_sections.append(f"⚠️ Trend Research hiba: {e}")

        for model in TRACKED_MODELS:
            try:
                gap_result = gap_analysis.run_gap_analysis(model)
                gaps = gap_result.get("gaps", [])
                report_sections.append(f"\n🎯 Gap analysis - {model}: {gaps}")
            except Exception as e:
                report_sections.append(f"⚠️ Gap Analysis hiba ({model}): {e}")

    for model in TRACKED_MODELS:
        # A Meta Ad Library lekérés termékszintű (nem avatáronkénti), ezért
        # avatáronként nem ismételjük meg - egyszer fut modellenként.
        ad_library_line = None
        try:
            top_ads = meta_ad_library.fetch_ads_for_model(model, limit=10)
            if top_ads:
                longest = top_ads[0]
                ad_library_line = (
                    f"Legrégebb óta futó hirdetés: {longest['page_name']} "
                    f"({longest['days_running']} napja fut)"
                )
        except Exception as e:
            ad_library_line = f"⚠️ Meta Ad Library hiba: {e}"

        for avatar_name in AVATARS.get(model, [DEFAULT_AVATAR]):
            section = [f"\n--- {model} | {avatar_name} ---"]
            if ad_library_line:
                section.append(ad_library_line)

            # 2) ICP (cache-elt, csak szükség esetén generál újat)
            try:
                icp = _get_or_generate_icp(model, avatar_name)
            except Exception as e:
                section.append(f"⚠️ ICP Agent hiba: {e}")
                report_sections.append("\n".join(section))
                continue

            # 3) Marketing angle
            try:
                angles = marketing_angle.generate_angles(model, avatar_name, icp)
                # Random rotáció a pool-ból, hogy ne mindig ugyanaz a (modell által
                # elsőnek generált) szög fusson be minden termékre.
                chosen_angle = random.choice(angles) if angles else "Nincs generált szög."
            except Exception as e:
                section.append(f"⚠️ Marketing Angle Agent hiba: {e}")
                report_sections.append("\n".join(section))
                continue

            # 4) Hook
            try:
                hooks = hook_agent.generate_hooks(model, avatar_name, chosen_angle)
                chosen_hook = random.choice(hooks) if hooks else "Nincs generált hook."
            except Exception as e:
                section.append(f"⚠️ Hook Agent hiba: {e}")
                report_sections.append("\n".join(section))
                continue

            # 5) Creative brief
            try:
                brief = creative_director.generate_brief(model, avatar_name, chosen_angle)
            except Exception as e:
                section.append(f"⚠️ Creative Director hiba: {e}")
                brief = {}

            # 6) Copywriter
            try:
                copy = copywriter_agent.write_copy(
                    model, avatar_name, icp, chosen_angle, chosen_hook, brief
                )
            except Exception as e:
                section.append(f"⚠️ Copywriter Agent hiba: {e}")
                report_sections.append("\n".join(section))
                continue

            # 7) Ad Quality Scorer
            try:
                latest_draft = db.latest_for_model("copy_drafts", model, avatar_name=avatar_name)
                draft_id = latest_draft[0]["id"] if latest_draft else None
                quality = ad_quality_scorer.score_ad(
                    copy.get("primary_text", ""), copy.get("headline", ""), copy.get("description", ""),
                    creative_brief=brief, copy_draft_id=draft_id, avatar_name=avatar_name,
                )
                if quality.get("_parse_error"):
                    # Enélkül "Hook score: None/10" jelenne meg, ami pontszámnak
                    # látszik, holott a pontozás meg sem történt.
                    section.append("⚠️ Ad Quality Scorer: a válasz nem volt értelmezhető JSON, pontszám nincs.")
                else:
                    section.append(f"Hook score: {quality.get('hook_score', {}).get('score')}/10")
                    section.append(f"Copy score: {quality.get('copy_score', {}).get('score')}/10")
                    for dimension, label in QUALITY_DIMENSION_LABELS.items():
                        dim_result = quality.get(dimension, {})
                        dim_score = dim_result.get("score")
                        if dim_score is not None and dim_score < 7:
                            section.append(
                                f"⚠️ Alacsony pontszám: {label} ({dim_score}/10) - {dim_result.get('improvement')}"
                            )
            except Exception as e:
                section.append(f"⚠️ Ad Quality Scorer hiba: {e}")

            # 8) Compliance
            try:
                latest_draft = db.latest_for_model("copy_drafts", model, avatar_name=avatar_name)
                draft_id = latest_draft[0]["id"] if latest_draft else None
                compliance = compliance_agent.check_compliance(
                    draft_id, copy.get("primary_text", ""), copy.get("headline", ""),
                    copy.get("description", ""), avatar_name=avatar_name,
                )
                status = "✅ megfelel" if compliance.get("passed") else f"❌ NEM felel meg: {compliance.get('issues')}"
            except Exception as e:
                status = f"⚠️ Compliance hiba: {e}"

            section.append(f"Angle: {chosen_angle}")
            section.append(f"Hook: {chosen_hook}")
            section.append(f"Primary text: {copy.get('primary_text', '')}")
            section.append(f"Compliance: {status}")

            report_sections.append("\n".join(section))

    if run_weekly_tasks:
        try:
            customer_language_summary = customer_language.summarize_last_n_days()
            report_sections.append(f"\n🗣️ Customer language összefoglaló:\n{customer_language_summary}")
        except Exception as e:
            report_sections.append(f"⚠️ Customer Language hiba: {e}")

        try:
            competitor_summary = competitor_intel.summarize_last_n_days()
            report_sections.append(f"\n🕵️ Versenytárs összefoglaló:\n{competitor_summary}")
        except Exception as e:
            report_sections.append(f"⚠️ Competitor Intel hiba: {e}")

        try:
            tiktok_summary = tiktok_creative.summarize_last_n_days()
            report_sections.append(f"\n🎵 TikTok kreatív összefoglaló:\n{tiktok_summary}")
        except Exception as e:
            report_sections.append(f"⚠️ TikTok Creative hiba: {e}")

    try:
        performance_result = performance_agent.fetch_performance()
        unmatched = performance_result.get("unmatched_ad_names", [])
        if unmatched:
            report_sections.append(
                f"⚠️ {len(unmatched)} hirdetés nem volt beazonosítható avatárra - küldd el: "
                f"/map_ad <hirdetésnév> | <avatár> | <sablon> | <piac>\n"
                f"Érintett: {', '.join(unmatched[:5])}"
            )
        learnings = creative_learning.generate_learnings()
        report_sections.append(f"\n🧠 Tanulságok:\n{learnings}")
    except Exception as e:
        report_sections.append(f"⚠️ Performance/Learning hiba: {e}")

    try:
        health_result = account_health.run_health_check()
        report_sections.append(
            f"\n🏥 Fiók egészség: {health_result.get('health_score')}/100\n{health_result.get('actions', '')}"
        )

        # A kill/scale javaslatokat a pipeline SOHA nem hajtja végre: minden
        # javaslatról külön jóváhagyási kérés megy ki, és a tényleges lépés
        # (büdzsé módosítás, hirdetés leállítása) kézi marad - lásd a TODO-t a
        # telegram_bot._resolve_approval()-ban.
        for suggestion in health_result.get("kill_scale_suggestions", []):
            try:
                request_id = telegram_bot.request_approval(
                    request_type="kill_scale",
                    description=suggestion,
                    payload={"suggestion": suggestion},
                )
                report_sections.append(f"⏳ Jóváhagyásra vár (#{request_id}): {suggestion}")
            except Exception as e:
                report_sections.append(f"⚠️ Jóváhagyási kérés hiba ({suggestion}): {e}")
    except Exception as e:
        report_sections.append(f"⚠️ Account Health hiba: {e}")

    final_report = "\n".join(report_sections)
    db.insert("daily_reports", report_text=final_report, created_at=db.now())
    return final_report


if __name__ == "__main__":
    print(run_daily_pipeline(run_weekly_tasks=True))
