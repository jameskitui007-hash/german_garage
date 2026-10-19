from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

# Use DATABASE_URL directly if set (Azure, Railway, local .env)
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # Fallback: build from individual variables (Railway legacy)
    DB_USER     = os.getenv("MYSQLUSER")     or os.getenv("DB_USER")
    DB_PASSWORD = os.getenv("MYSQLPASSWORD") or os.getenv("DB_PASSWORD")
    DB_HOST     = os.getenv("MYSQLHOST")     or os.getenv("DB_HOST")
    DB_PORT     = os.getenv("MYSQLPORT")     or os.getenv("DB_PORT")
    DB_NAME     = os.getenv("MYSQLDATABASE") or os.getenv("DB_NAME")
    DATABASE_URL = (
        f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}"
        f"@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    )

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    echo=False,
    connect_args={"ssl": {"verify_cert": False}}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()