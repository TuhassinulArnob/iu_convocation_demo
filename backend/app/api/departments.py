from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.core.database import get_db
from app.models.models import Department

router = APIRouter(prefix="/departments", tags=["Departments"])

@router.get("")
def get_departments(db: Session = Depends(get_db)):
    depts = db.query(Department).all()
    # Group by faculty and sort alphabetically by name within each faculty
    faculties: Dict[str, List[Dict[str, Any]]] = {}
    dept_list = []
    for d in depts:
        item = {"id": d.id, "name": d.name, "faculty": d.faculty}
        dept_list.append(item)
        if d.faculty not in faculties:
            faculties[d.faculty] = []
        faculties[d.faculty].append(item)

    for fac in faculties:
        faculties[fac].sort(key=lambda x: x["name"])

    # Maintain global list sorted by faculty and name
    dept_list.sort(key=lambda x: (x["faculty"], x["name"]))

    return {
        "departments": dept_list,
        "by_faculty": faculties,
        "total": len(dept_list)
    }
