import re


# Matches any HTML/script tag e.g. <script>, </div>, <img src=...>
_HTML_TAG_RE = re.compile(r"<[^>]+>")

# Matches javascript: and data: URI schemes used in XSS attacks
_DANGEROUS_PROTO_RE = re.compile(r"(javascript|data|vbscript):", re.IGNORECASE)


def strip_html(value: str) -> str:
    """
    Remove all HTML tags and dangerous URI schemes from a string.
    Used on all free-text input fields (names, descriptions, notes, addresses).

    Examples:
        strip_html('<script>alert(1)</script>hello') -> 'hello'
        strip_html('<b>bold</b>')                    -> 'bold'
        strip_html('javascript:alert(1)')            -> 'alert(1)'
    """
    if not value:
        return value

    # Remove HTML tags
    cleaned = _HTML_TAG_RE.sub("", value)

    # Remove dangerous URI schemes
    cleaned = _DANGEROUS_PROTO_RE.sub("", cleaned)

    # Collapse excess whitespace left behind by removed tags
    cleaned = " ".join(cleaned.split())

    return cleaned.strip()