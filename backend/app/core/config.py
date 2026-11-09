import os
from datetime import datetime, timezone, timedelta
from typing import Optional

class Settings:
    PROJECT_NAME: str = "IU 5th Convocation 2027 — Demonstration Portal"
    DEMO_MODE: bool = True
    SECRET_KEY: str = os.getenv("SECRET_KEY", "iu_convocation_2027_demo_super_secret_jwt_key_987654321")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days for demo ease
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./convocation.db")
    
    # Official event reference schedule
    REGISTRATION_START: str = "2026-11-10T00:00:00+06:00"
    REGISTRATION_END: str = "2026-11-25T23:59:59+06:00"
    CEREMONY_DATETIME: str = "2027-02-02T09:00:00+06:00"
    CEREMONY_VENUE: str = "Central Playground, Islamic University Campus, Kushtia"
    TIMEZONE: str = "Asia/Dhaka"

    def get_registration_status(self, current_dt: Optional[datetime] = None) -> tuple[str, bool]:
        """
        Determines registration status based on Bangladesh time (Asia/Dhaka):
        - Registration started from 10 November 2026 through 25 November 2026 23:59:59 BST: "REGISTRATION STARTED"
        - After 25 November 2026: "REGISTRATION CLOSED"
        """
        if current_dt is None:
            try:
                import zoneinfo
                tz = zoneinfo.ZoneInfo(self.TIMEZONE)
                current_dt = datetime.now(tz)
            except Exception:
                tz = timezone(timedelta(hours=6))
                current_dt = datetime.now(tz)
        
        end_dt = datetime.fromisoformat(self.REGISTRATION_END)
        if current_dt > end_dt:
            return "REGISTRATION CLOSED", False
        
        return "REGISTRATION STARTED", True

    # Fee configurations (as specified in guidelines)
    REGISTRATION_FEE_REGULAR: float = 4500.0
    REGISTRATION_FEE_EVENING: float = 5500.0
    
    CERTIFICATE_FEES = {
        "Bachelor": 500.0,
        "Honours": 500.0,
        "Undergraduate": 500.0,
        "Masters": 700.0,
        "M.Phil": 1500.0,
        "PhD": 2000.0,
        "Masters (Professional/Evening)": 1000.0,
        "Evening Masters": 1000.0,
    }
    
    GUEST_FEE_PER_PERSON: float = 1000.0
    MAX_GUESTS: int = 3
    SERVICE_CHARGE: float = 32.50

    # Storage configurations
    @property
    def UPLOAD_DIR(self) -> str:
        if os.getenv("VERCEL"):
            path = "/tmp/uploads"
        else:
            path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
        os.makedirs(path, exist_ok=True)
        return path

settings = Settings()
