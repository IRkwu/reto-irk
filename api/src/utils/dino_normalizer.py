import re
import unicodedata

DINO_ALIASES = {
    "spinosaurus": "spinosaur",
    "paraceratherium": "paracer",
    "dire bear": "direbear",
    "direbear": "direbear",
    "rock drake": "rockdrake",
    "rockdrake": "rockdrake",
    "dung beetle": "dungbeetle",
    "dungbeetle": "dungbeetle",
    "giant bee": "giantbee",
    "giantbee": "giantbee",
    "sabertooth salmon": "sabertoothsalmon",
    "sabertoothsalmon": "sabertoothsalmon",
    "woolly rhino": "woollyrhino",
    "woollyrhino": "woollyrhino",
    "thorny dragon": "thornydragon",
    "thornydragon": "thornydragon",
    "crystal wyvern": "crystalwyvern",
    "crystalwyvern": "crystalwyvern",
}

def normalize_text(value: str) -> str:
    clean_value = " ".join(value.strip().lower().split())

    without_accents = unicodedata.normalize("NFKD", clean_value)
    without_accents = without_accents.encode("ascii", "ignore").decode("ascii")

    return without_accents

def normalize_dino_slug(name: str) -> str:
    clean_name = normalize_text(name)

    if clean_name in DINO_ALIASES:
        return DINO_ALIASES[clean_name]

    slug = re.sub(r"[^a-z0-9]+", "", clean_name)

    return DINO_ALIASES.get(slug, slug)

def normalize_map_slug(name: str) -> str:
    clean_name = normalize_text(name)
    return re.sub(r"[^a-z0-9]+", "", clean_name)
