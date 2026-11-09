import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User, Application

router = APIRouter(prefix="/upload", tags=["File Upload"])

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/jpg", "image/pjpeg"}
MAX_FILE_SIZE = 2 * 1024 * 1024  # 2MB

@router.post("/photo")
async def upload_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Validate file extension
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image format. Only JPG, JPEG, and PNG files are accepted."
        )

    # 2. Validate MIME type
    content_type = (file.content_type or "").lower()
    if content_type and content_type not in ALLOWED_MIME_TYPES and content_type != "application/octet-stream":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image type. Please upload a valid JPG or PNG image file."
        )

    # 3. Read and validate file size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds the 2MB limit. Please upload a smaller passport-size photo."
        )

    if len(contents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty. Please select a valid passport photo."
        )

    # 4. Folder structure: candidate-photos/{authenticated_user_id}/{unique_filename}.ext
    user_dir_rel = os.path.join("candidate-photos", str(current_user.id))
    user_dir_abs = os.path.join(settings.UPLOAD_DIR, user_dir_rel)
    os.makedirs(user_dir_abs, exist_ok=True)

    unique_filename = f"photo_{uuid.uuid4().hex[:12]}{ext}"
    filepath = os.path.join(user_dir_abs, unique_filename)

    with open(filepath, "wb") as f:
        f.write(contents)

    storage_path = f"candidate-photos/{current_user.id}/{unique_filename}"
    photo_url = f"/uploads/{storage_path}"

    # 5. Automatically record storage path in candidate's application record
    app = db.query(Application).filter(Application.user_id == current_user.id).first()
    if app:
        app.photo_url = photo_url
        db.commit()

    return {
        "status": "success",
        "photo_url": photo_url,
        "storage_path": storage_path,
        "filename": unique_filename,
        "size_bytes": len(contents)
    }
