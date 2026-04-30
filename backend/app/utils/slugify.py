"""
utils/slugify.py
────────────────
Converts a string to a URL-safe slug.

Examples:
    slugify("Engine Components")      → "engine-components"
    slugify("Cooling & Air System")   → "cooling-air-system"
    slugify("Wheels & Tyres")         → "wheels-tyres"
"""

import re


def slugify(text: str) -> str:
    # Lowercase
    text = text.lower().strip()

    # Replace & and other special chars with space
    text = re.sub(r"[&/\\]", " ", text)

    # Replace any non-alphanumeric character with hyphen
    text = re.sub(r"[^a-z0-9]+", "-", text)

    # Strip leading/trailing hyphens
    text = text.strip("-")

    return text