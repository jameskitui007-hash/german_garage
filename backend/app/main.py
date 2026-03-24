from fastapi import FastAPI,request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

# ── Config — validated on import, app refuses to start if SECRET_KEY is weak ──
from app.config import get_settings
settings = get_settings()

# ── Rate limiter — keyed by client IP address ─────────────────────────────────
# Import this instance in any router that needs rate limiting:
#   from app.main import limiter
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])

# ── Routers ───────────────────────────────────────────────────────────────────
from app.routers import (
    auth, products, orders, customers,
    suppliers, settings as settings_router,
    dashboard, reports, logs
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup confirmation log.
    Config validation already ran at import time via get_settings() —
    if SECRET_KEY was weak the app would have crashed before reaching here.
    """
    env_label = "🚨 PRODUCTION" if settings.is_production else "🛠️  DEVELOPMENT"
    print(f"\n{'='*55}")
    print(f"  German Garage API starting up")
    print(f"  Environment : {env_label}")
    print(f"  Docs enabled: {settings.docs_enabled}")
    print(f"  CORS origin : {settings.FRONTEND_URL}")
    print(f"  Rate limiting: ENABLED")
    print(f"  Token expiry: {settings.ACCESS_TOKEN_EXPIRE_MINUTES} min (access) / "
          f"{settings.REFRESH_TOKEN_EXPIRE_DAYS} days (refresh)")
    print(f"{'='*55}\n")
    yield
    # Add any shutdown cleanup here if needed


# ── App — docs disabled in production ─────────────────────────────────────────
app = FastAPI(
    title="German Garage API",
    description="Backend API for Mercedes & BMW Specialist Garage",
    version="1.0.0",
    docs_url="/docs"        if settings.docs_enabled else None,
    redoc_url="/redoc"      if settings.docs_enabled else None,
    openapi_url="/openapi.json" if settings.docs_enabled else None,
    lifespan=lifespan,
)

# ── Rate limiting middleware ───────────────────────────────────────────────────
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)
 
# ── Custom 429 handler — clean JSON instead of slowapi's default plain text ───
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={
            "detail": "Too many requests. Please slow down and try again shortly.",
            "retry_after": str(exc.retry_after) if hasattr(exc, "retry_after") else "60",
        },
    )

# ── CORS ──────────────────────────────────────────────────────────────────────
# Explicit methods and headers — wildcard removed for security
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(customers.router)
app.include_router(suppliers.router)
app.include_router(settings_router.router)
app.include_router(dashboard.router)
app.include_router(reports.router)
app.include_router(logs.router)


# ── Health Check ──────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "German Garage API is running 🚗"}


# ── Custom OpenAPI schema — Bearer token button in Swagger UI ─────────────────
# Only runs in development (docs_url is None in production so this is never called)
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    schema = get_openapi(title=app.title, version=app.version, routes=app.routes)
    schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"
        }
    }
    for path in schema["paths"].values():
        for method in path.values():
            method["security"] = [{"BearerAuth": []}]
    app.openapi_schema = schema
    return app.openapi_schema


app.openapi = custom_openapi