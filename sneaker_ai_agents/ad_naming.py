"""
Hirdetés-névkonvenció
-----------------------
Közös segédmodul (nem agent): a Meta hirdetésnevekbe kódoljuk a piacot, az
avatárt, a modellt, a sablont és a verziót, hogy a Marketing API insights
válaszából - ahol nincs ilyen dimenzió - vissza tudjuk fejteni őket.

Minta:  {market}_{avatar_code}_{model}_{template}_v{version}
Példa:  HU_SNEAKERHEA_Jordan4_video_v1
"""
from config import AVATAR_CODES, AVATAR_CODES_REVERSE, MARKETS

SEPARATOR = "_"
EXPECTED_PARTS = 5


def _clean(value: str) -> str:
    """
    Szóköz és aláhúzás nélküli darab - az aláhúzás a mezőelválasztó, ezért
    nem maradhat egy összetevőn belül (pl. a "single_image" formátumból
    "singleimage" lesz), különben a parse_ad_name nem 5 részre esne szét.
    """
    return str(value).replace(" ", "").replace(SEPARATOR, "")


def build_ad_name(model: str, avatar_name: str, template: str, market: str,
                  version: int = 1) -> str:
    if avatar_name not in AVATAR_CODES:
        raise ValueError(
            f"Ismeretlen avatár: {avatar_name!r}. Csak a config.AVATARS-ban "
            f"szereplő avatárokhoz tudunk visszafejthető kódot adni."
        )

    return SEPARATOR.join([
        _clean(market),
        AVATAR_CODES[avatar_name],
        _clean(model),
        _clean(template),
        f"v{version}",
    ])


def parse_ad_name(ad_name: str) -> dict | None:
    """
    A hirdetésnév visszafejtése. Ha bármi nem illeszkedik a mintára, None-t
    ad vissza - sosem dob kivételt, mert a hirdetésneveket kézzel is lehet
    írni, és a hívó (performance_agent) a None-ra a mapping táblával vagy
    "ismeretlen" értékkel kezeli le a helyzetet.
    """
    parts = str(ad_name or "").split(SEPARATOR)
    if len(parts) != EXPECTED_PARTS:
        return None

    market, avatar_code, model, template, version_part = parts

    if market not in MARKETS:
        return None

    avatar_name = AVATAR_CODES_REVERSE.get(avatar_code)
    if avatar_name is None:
        return None

    if not model or not template:
        return None

    if not version_part.startswith("v") or not version_part[1:].isdigit():
        return None

    return {
        "market": market,
        "avatar_name": avatar_name,
        "model": model,
        "template": template,
        "version": int(version_part[1:]),
    }


if __name__ == "__main__":
    name = build_ad_name("Jordan 4", "Sneakerhead fiatal felnőtt", "video", "HU")
    print(name)
    print(parse_ad_name(name))
