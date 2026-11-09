import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from app.core.deps import get_current_user
from app.models.models import User

router = APIRouter(prefix="/upload", tags=["File Upload"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}
MAX_FILE_SIZE = 2 * 1024 * 1024  # 2MB

@router.post("/photo")
async def upload_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Invalid image format. Only JPG, JPEG, and PNG files are accepted."
        )

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File size exceeds the 2MB limit. Please upload a smaller passport-size photo."
        )

    unique_filename = f"photo_{current_user.id}_{uuid.uuid4().hex[:8]}{ext}"
    filepath = os.path.join(UPLOAD_DIR, unique_filename)

    with open(filepath, "wb") as f:
        f.write(contents)

    photo_url = f"/uploads/{unique_filename}"
    return {
        "status": "success",
        "photo_url": photo_url,
        "filename": unique_filename,
        "size_bytes": len(contents)
    }
