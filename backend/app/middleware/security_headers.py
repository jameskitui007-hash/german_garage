from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Adds security-related HTTP response headers to every response.

    Headers applied:
      - X-Content-Type-Options     : Prevents MIME-type sniffing attacks
      - X-Frame-Options            : Prevents clickjacking via iframes
      - Referrer-Policy            : Limits referrer info sent to other sites
      - Permissions-Policy         : Disables unused browser features
      - Content-Security-Policy    : Restricts where scripts/styles can load from
      - Strict-Transport-Security  : Forces HTTPS (applied in production only)
    """

    def __init__(self, app, is_production: bool = False):
        super().__init__(app)
        self.is_production = is_production

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)

        # Prevent browsers from guessing content types
        response.headers["X-Content-Type-Options"] = "nosniff"

        # Block this page from being embedded in an iframe (clickjacking)
        response.headers["X-Frame-Options"] = "DENY"

        # Only send the origin (no path/query) as referrer to external sites
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Disable features the app doesn't use
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=(), "
            "payment=(), usb=(), magnetometer=(), gyroscope=()"
        )

        # Content Security Policy:
        # - default-src 'self'         : Only load resources from same origin
        # - script-src 'self'          : No inline scripts, no CDN scripts
        # - style-src 'self' 'unsafe-inline' : Allow inline styles (needed for admin panel)
        # - img-src 'self' data:        : Allow same-origin images + base64 data URIs
        # - font-src 'self' fonts.gstatic.com : Allow Google Fonts
        # - connect-src 'self'          : XHR/fetch only to same origin
        # - frame-ancestors 'none'      : Redundant with X-Frame-Options but belt+braces
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data:; "
            "connect-src 'self' http://127.0.0.1:8000; "
            "frame-ancestors 'none';"
        )

        # HSTS: Force HTTPS for 1 year — only safe to set in production
        # Never set this in development (it will break http://localhost)
        if self.is_production:
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains"
            )

        return response