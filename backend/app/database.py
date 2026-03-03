from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Build the MySQL connection URL
# Format: mysql+pymysql://user:password@host:port/database
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")

DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Create the SQLAlchemy engine
# pool_pre_ping=True checks connection health before using it
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    echo=True  # Set to False in production — logs all SQL queries
)

# Session factory — each request gets its own session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class all models will inherit from
Base = declarative_base()

# Dependency — used in routers to get a DB session per request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()