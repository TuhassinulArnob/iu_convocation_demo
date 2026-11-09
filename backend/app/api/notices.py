from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from app.core.database import get_db
from app.models.models import Notice

router = APIRouter(prefix="/notices", tags=["Notices"])

@router.get("")
def list_notices(
    search: Optional[str] = Query(None, description="Search term in title or description"),
    category: Optional[str] = Query(None, description="Filter by category"),
    db: Session = Depends(get_db)
):
    query = db.query(Notice).filter(Notice.is_published == True)
    
    if category and category.lower() != "all":
        query = query.filter(Notice.category.ilike(f"%{category}%"))
        
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(or_(Notice.title.ilike(s), Notice.description.ilike(s)))
        
    notices = query.order_by(Notice.id.desc()).all()
    return [
        {
            "id": n.id,
            "title": n.title,
            "category": n.category,
            "description": n.description,
            "date": n.date,
            "is_new": n.is_new,
            "pdf_link": n.pdf_link,
            "created_at": n.created_at
        }
        for n in notices
    ]

@router.get("/{notice_id}")
def get_notice(notice_id: int, db: Session = Depends(get_db)):
    n = db.query(Notice).filter(Notice.id == notice_id, Notice.is_published == True).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notice not found.")
    return {
        "id": n.id,
        "title": n.title,
        "category": n.category,
        "description": n.description,
        "date": n.date,
        "is_new": n.is_new,
        "pdf_link": n.pdf_link,
        "created_at": n.created_at
    }
