import bcrypt
import jwt
import hmac
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from app.core.config import settings

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if "sub" in to_encode:
        to_encode["sub"] = str(to_encode["sub"])
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except Exception:
        return None

def generate_card_verification_token() -> str:
    """Generate a cryptographically secure random verification token for convocation card."""
    return secrets.token_urlsafe(32)

def generate_card_signature(card_id: str, app_id: str, roll_number: str, issued_at_val: Any) -> str:
    """Generate server-side cryptographic HMAC-SHA256 signature for educational demo card."""
    if isinstance(issued_at_val, datetime):
        time_str = issued_at_val.strftime("%Y-%m-%dT%H:%M:%S")
    else:
        # Strip microsecond and timezone if string
        time_str = str(issued_at_val).split(".")[0].replace("Z", "").replace("+00:00", "")
        
    message = f"IU2027:{card_id.strip()}:{app_id.strip()}:{str(roll_number).strip()}:{time_str.strip()}".encode("utf-8")
    key = settings.SECRET_KEY.encode("utf-8")
    sig = hmac.new(key, message, hashlib.sha256).hexdigest()
    return f"IU27-EDUSIG-{sig[:32].upper()}"

def verify_card_signature(card_id: str, app_id: str, roll_number: str, issued_at_val: Any, signature: str) -> bool:
    """Validate server-side cryptographic signature."""
    expected = generate_card_signature(card_id, app_id, roll_number, issued_at_val)
    return hmac.compare_digest(expected, signature)
