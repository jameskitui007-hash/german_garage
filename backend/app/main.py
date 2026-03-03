from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

# Import routers
from app.routers import auth, products

app = FastAPI(
    title="German Garage API",
    description="Backend API for Mercedes & BMW Specialist Garage",
    version="1.0.0"
)

# ── CORS ─────────────────────────────────────────────────────
# Allows the frontend to call the API from a different port
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://127.0.0.1:5500")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(products.router)



# ── Health Check ─────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "German Garage API is running 🚗"}