import os
import shutil
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Database engine configuration with Vercel serverless support
IS_VERCEL = bool(os.getenv("VERCEL"))
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    if IS_VERCEL:
        # On Vercel serverless functions, the root filesystem is read-only; use /tmp
        tmp_db = "/tmp/convocation.db"
        deployed_db = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "convocation.db")
        if os.path.exists(deployed_db) and not os.path.exists(tmp_db):
            try:
                shutil.copyfile(deployed_db, tmp_db)
            except Exception:
                pass
        SQLALCHEMY_DATABASE_URL = f"sqlite:///{tmp_db}"
    else:
        DB_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "convocation.db")
        SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_FILE}"
else:
    SQLALCHEMY_DATABASE_URL = DATABASE_URL

if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
