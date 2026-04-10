from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from fastapi.staticfiles import StaticFiles


# ── Config — validated on import, app refuses to start if SECRET_KEY is weak ──
from app.config import get_settings
from app.middleware.security_headers import SecurityHeadersMiddleware
settings = get_settings()

# ── Rate limiter — keyed by client IP address ─────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])

# ── Routers ───────────────────────────────────────────────────────────────────
from app.routers import (
    auth, products, orders, customers,
    suppliers, settings as settings_router,
    dashboard, reports, logs ,uploads , products
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    env_label = "🚨 PRODUCTION" if settings.is_production else "🛠️  DEVELOPMENT"
    print(f"\n{'='*55}")
    print(f"  German Garage API starting up")
    print(f"  Environment : {env_label}")
    print(f"  Docs enabled: {settings.docs_enabled}")
    print(f"  CORS origin : {settings.FRONTEND_URL}")
    print(f"  Rate limiting: ENABLED")
    print(f"  Security headers: ENABLED")
    print(f"  Token expiry: {settings.ACCESS_TOKEN_EXPIRE_MINUTES} min (access) / "
          f"{settings.REFRESH_TOKEN_EXPIRE_DAYS} days (refresh)")
    print(f"{'='*55}\n")
    yield



# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="German Garage API",
    description="Backend API for Mercedes & BMW Specialist Garage",
    version="1.0.0",
    docs_url="/docs"            if settings.docs_enabled else None,
    redoc_url="/redoc"          if settings.docs_enabled else None,
    openapi_url="/openapi.json" if settings.docs_enabled else None,
    lifespan=lifespan,
)

# ── Security headers — applied to every response ──────────────────────────────
app.add_middleware(
    SecurityHeadersMiddleware,
    is_production=settings.is_production
)

# ── Rate limiting middleware ───────────────────────────────────────────────────
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

# ── Global 429 handler — clean JSON response ──────────────────────────────────
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={
            "detail": "Too many requests. Please slow down and try again shortly.",
            "retry_after": str(exc.retry_after) if hasattr(exc, "retry_after") else "60",
        },
    )

# ── Global 422 handler — hide internal field names from error responses ───────
@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    errors = []
    for error in exc.errors():
        field = error["loc"][-1] if error["loc"] else "unknown"
        errors.append({
            "field":   str(field),
            "message": error["msg"],
        })
    return JSONResponse(
        status_code=422,
        content={"detail": "Validation failed", "errors": errors},
    )

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# ── Static Files — serve uploaded product images ──────────────────────────────
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent.parent  # resolves to backend/

app.mount(
    "/uploads",
    StaticFiles(directory=str(BASE_DIR / "uploads")),
    name="uploads"
)


# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(uploads.router)
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