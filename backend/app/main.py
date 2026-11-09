import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.services.seeder import seed_database
from app.api import auth, departments, notices, fees, applications, payments, admin, upload

# Create tables
Base.metadata.create_all(bind=engine)

# Seed database
db = SessionLocal()
try:
    seed_database(db)
finally:
    db.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Educational demonstration portal inspired by Islamic University 5th Convocation 2027.",
    version="1.0.0"
)

# Enable CORS for frontend Vite development & local builds
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads directory exists (use shared settings.UPLOAD_DIR)
UPLOAD_DIR = settings.UPLOAD_DIR
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Mount assets directory (Logo, Payment, refereceSS)
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LOGO_DIR = os.path.join(PROJECT_ROOT, "Logo")
PAYMENT_DIR = os.path.join(PROJECT_ROOT, "Payment")
REF_DIR = os.path.join(PROJECT_ROOT, "refereceSS")

if os.path.exists(LOGO_DIR):
    app.mount("/assets/logo", StaticFiles(directory=LOGO_DIR), name="logo")
if os.path.exists(PAYMENT_DIR):
    app.mount("/assets/payment", StaticFiles(directory=PAYMENT_DIR), name="payment")
if os.path.exists(REF_DIR):
    app.mount("/assets/reference", StaticFiles(directory=REF_DIR), name="reference")

# Include Routers
app.include_router(auth.router, prefix="/api")
app.include_router(departments.router, prefix="/api")
app.include_router(notices.router, prefix="/api")
app.include_router(fees.router, prefix="/api")
app.include_router(applications.router, prefix="/api")
app.include_router(payments.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(upload.router, prefix="/api")

@app.get("/")
def root():
    return {
        "project": "Islamic University Bangladesh — 5th Convocation 2027 Demonstration Portal",
        "status": "online",
        "demo_mode": True,
        "disclaimer": (
            "UNOFFICIAL DEMONSTRATION PROJECT: This API is for educational UI/UX testing only. "
            "No real payments or registrations are processed."
        ),
        "docs_url": "/docs"
    }

@app.get("/api/config")
def get_public_config():
    reg_status, is_open = settings.get_registration_status()
    return {
        "event_name": "5th Convocation 2027",
        "bangla_name": "৫ম সমাবর্তন ২০২৭",
        "institution": "Islamic University Bangladesh",
        "location": "Kushtia, Bangladesh",
        "ceremony_datetime": settings.CEREMONY_DATETIME,
        "ceremony_date_formatted": "Tuesday, 02 February 2027",
        "ceremony_time_formatted": "09:00 AM BST",
        "ceremony_venue": settings.CEREMONY_VENUE,
        "registration_start": settings.REGISTRATION_START,
        "registration_end": settings.REGISTRATION_END,
        "registration_deadline": "25 November 2026",
        "registration_period": "10 Nov – 25 Nov 2026",
        "registration_status": reg_status,
        "is_registration_open": is_open,
        "timezone": settings.TIMEZONE,
        "official_url": "https://convocation.iu.ac.bd/",
        "university_url": "https://iu.ac.bd/"
    }
