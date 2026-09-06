"""
Meta API hibakezelés
----------------------
Közös segédmodul (nem agent). Az access_token az URL query paraméterében
utazik, ezért a requests kivételek teljes szövegét SOHA nem szabad
továbbadni - abban benne van a teljes URL a tokennel együtt.

A HTTP státuszkód és a Meta saját hibaüzenete viszont a VÁLASZ TÖRZSÉBEN
van, nem az URL-ben, tehát biztonságosan megmutatható - és pont ez kell a
hibakereséshez (pl. hiányzó jogosultság vs. lejárt token).
"""
import requests

from config import META_ACCESS_TOKEN


def describe_error(exc: Exception) -> str:
    """
    Rövid, token nélküli leírás egy Meta API hibáról:
    - hálózati hiba (nincs válasz): a kivétel típusa, pl. "ProxyError"
    - HTTP hiba: "HTTP 400: Invalid OAuth access token"
    """
    response = getattr(exc, "response", None)
    if response is None:
        return type(exc).__name__

    detail = ""
    try:
        error = (response.json() or {}).get("error", {})
        detail = error.get("message") or error.get("type") or ""
    except (ValueError, AttributeError):
        detail = ""

    # Biztos, ami biztos: ha a Meta bármiért visszhangozná a tokent, kivesszük.
    if META_ACCESS_TOKEN and detail:
        detail = detail.replace(META_ACCESS_TOKEN, "<token>")

    return f"HTTP {response.status_code}: {detail}" if detail else f"HTTP {response.status_code}"
