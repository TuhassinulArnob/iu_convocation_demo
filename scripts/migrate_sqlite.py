import os
import sqlite3
import sys

# Ensure backend path
backend_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
sys.path.insert(0, backend_path)

from app.core.database import engine, Base
from app.models.models import Application, ApplicationRevision, ConvocationCard

Base.metadata.create_all(bind=engine)

db_path = os.path.join(backend_path, "convocation.db")
con = sqlite3.connect(db_path)
cur = con.cursor()
cur.execute("PRAGMA table_info(applications)")
cols = [c[1] for c in cur.fetchall()]

new_cols = [
    ("correction_instructions", "TEXT"),
    ("correction_categories", "TEXT DEFAULT '[]'"),
    ("correction_requested_at", "DATETIME"),
    ("resubmitted_at", "DATETIME"),
]

for col, ctype in new_cols:
    if col not in cols:
        cur.execute(f"ALTER TABLE applications ADD COLUMN {col} {ctype}")
        print(f"Added column {col} to applications table")

con.commit()
con.close()
print("SQLite migration successfully executed!")
