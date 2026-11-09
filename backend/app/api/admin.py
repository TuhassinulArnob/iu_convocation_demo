import io
import csv
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status, Response
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.core.database import get_db
from app.core.deps import get_current_admin
from app.models.models import (
    User, Application, Department, FeeBreakdown, 
    PaymentSimulation, Notice, ApplicationStatusHistory
)
from app.schemas.schemas import AdminStatusChangeRequest, NoticeCreate, NoticeUpdate

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])

@router.get("/stats")
def get_admin_stats(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    total_apps = db.query(Application).count()
    approved_apps = db.query(Application).filter(Application.status == "Approved (Demo)").count()
    rejected_apps = db.query(Application).filter(Application.status == "Rejected (Demo)").count()
    under_review = db.query(Application).filter(Application.status == "Under Review").count()
    awaiting_payment = db.query(Application).filter(Application.status.in_(["Awaiting Payment", "Account Created", "Form Incomplete"])).count()
    submitted_apps = db.query(Application).filter(Application.status.in_(["Submitted", "Under Review", "Approved (Demo)"])).count()

    # Payments stats
    simulated_payments = db.query(PaymentSimulation).filter(PaymentSimulation.status == "DEMO SUCCESS").all()
    total_payment_amount = sum(p.amount for p in simulated_payments)
    successful_payments_count = len(simulated_payments)

    # Department distribution
    dept_counts = (
        db.query(Department.name, func.count(Application.id))
        .join(Application, Department.id == Application.department_id, isouter=True)
        .group_by(Department.name)
        .all()
    )
    # Filter to departments that have at least 1 or top 10
    dept_distribution = [
        {"department": name, "count": count}
        for name, count in dept_counts if count > 0
    ]
    if not dept_distribution:
        # Fallback to sample department counts
        dept_distribution = [
            {"department": "Information and Communication Technology", "count": 1},
            {"department": "Computer Science and Engineering", "count": 1}
        ]

    # Degree distribution
    degree_counts = (
        db.query(Application.degree_level, func.count(Application.id))
        .group_by(Application.degree_level)
        .all()
    )
    degree_distribution = [
        {"degree": deg or "Honours", "count": count}
        for deg, count in degree_counts
    ]

    return {
        "panel_title": "DEMO ADMIN PANEL — UNOFFICIAL PROJECT",
        "total_applications": total_apps,
        "submitted_applications": submitted_apps,
        "pending_review": under_review,
        "awaiting_payment": awaiting_payment,
        "approved_demo": approved_apps,
        "rejected_demo": rejected_apps,
        "simulated_payments_count": successful_payments_count,
        "total_simulated_amount": total_payment_amount,
        "formatted_simulated_amount": f"৳{total_payment_amount:,.2f}",
        "department_distribution": dept_distribution,
        "degree_distribution": degree_distribution,
        "generated_at": datetime.now(timezone.utc)
    }

@router.get("/applications")
def list_applications(
    search: str = Query(None, description="Search by App ID, Roll No, or Name"),
    department_id: int = Query(None),
    degree_level: str = Query(None),
    status_filter: str = Query(None, alias="status"),
    payment_status: str = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Application)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Application.app_id.ilike(s),
                Application.roll_number.ilike(s),
                Application.full_name.ilike(s)
            )
        )

    if department_id:
        query = query.filter(Application.department_id == department_id)

    if degree_level and degree_level.lower() != "all":
        query = query.filter(Application.degree_level.ilike(f"%{degree_level}%"))

    if status_filter and status_filter.lower() != "all":
        sf = status_filter.strip().lower()
        if "pending" in sf or "review" in sf:
            query = query.filter(Application.status.in_(["PENDING_REVIEW", "Pending Review", "Under Review", "Submitted"]))
        elif "approve" in sf:
            query = query.filter(Application.status.in_(["APPROVED", "Approved", "Approved (Demo)"]))
        elif "reject" in sf:
            query = query.filter(Application.status.in_(["REJECTED", "Rejected", "Rejected (Demo)"]))
        elif "correction" in sf:
            query = query.filter(Application.status.in_(["CORRECTION_REQUIRED", "Correction Required"]))
        elif "payment due" in sf:
            query = query.filter(
                Application.status.in_(["APPROVED", "Approved", "Approved (Demo)"]),
                ~Application.payments.any(PaymentSimulation.status == "DEMO SUCCESS")
            )
        elif "completed" in sf or "demo success" in sf:
            query = query.filter(Application.payments.any(PaymentSimulation.status == "DEMO SUCCESS"))
        else:
            query = query.filter(Application.status == status_filter)

    if payment_status and payment_status.lower() != "all":
        ps = payment_status.strip().lower()
        if "demo success" in ps or "completed" in ps or "paid" == ps:
            query = query.filter(Application.payments.any(PaymentSimulation.status == "DEMO SUCCESS"))
        elif "due" in ps:
            query = query.filter(
                Application.status.in_(["APPROVED", "Approved", "Approved (Demo)"]),
                ~Application.payments.any(PaymentSimulation.status == "DEMO SUCCESS")
            )
        elif "not paid" in ps or "not available" in ps:
            query = query.filter(~Application.payments.any(PaymentSimulation.status == "DEMO SUCCESS"))

    total_count = query.count()
    apps = query.order_by(Application.id.desc()).offset((page - 1) * page_size).limit(page_size).all()

    items = []
    for a in apps:
        dept = db.query(Department).filter(Department.id == a.department_id).first()
        has_paid = any(p.status == "DEMO SUCCESS" for p in a.payments)
        fee = a.fee_breakdown
        
        is_app_approved = a.status in ["APPROVED", "Approved", "Approved (Demo)"]
        if has_paid:
            p_status = "DEMO SUCCESS"
        elif is_app_approved:
            p_status = "PAYMENT_DUE"
        else:
            p_status = "NOT PAID"

        items.append({
            "id": a.id,
            "app_id": a.app_id,
            "student_name": a.full_name,
            "department": dept.name if dept else "N/A",
            "degree_level": a.degree_level,
            "roll_number": a.roll_number,
            "session": a.admission_session,
            "status": a.status,
            "payment_status": p_status,
            "total_amount": fee.total_payable if fee else 0.0,
            "formatted_amount": f"৳{fee.total_payable:,.2f}" if fee else "৳0.00",
            "created_at": a.created_at.strftime("%d %b %Y, %I:%M %p")
        })

    return {
        "items": items,
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": (total_count + page_size - 1) // page_size if total_count > 0 else 1
    }

def mask_mobile(val: str = None) -> str:
    if not val:
        return "N/A"
    clean = str(val).strip()
    if len(clean) >= 7:
        return f"{clean[:3]}••••{clean[-4:]}"
    return "•••••••"

def mask_email(val: str = None) -> str:
    if not val or "@" not in str(val):
        return "N/A"
    parts = str(val).strip().split("@")
    user, domain = parts[0], parts[1]
    if len(user) <= 2:
        return f"{user[0]}••@{domain}"
    return f"{user[:2]}••••@{domain}"

@router.get("/applications/{app_id_or_int}")
def get_application_detail(
    app_id_or_int: str,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Application)
    if app_id_or_int.isdigit():
        app = query.filter(Application.id == int(app_id_or_int)).first()
    else:
        app = query.filter(Application.app_id == app_id_or_int.strip()).first()

    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")

    dept = db.query(Department).filter(Department.id == app.department_id).first()
    has_paid = any(p.status == "DEMO SUCCESS" for p in app.payments)

    fee = app.fee_breakdown
    payments = [
        {
            "id": p.id,
            "reference_id": p.reference_id,
            "payment_method": p.payment_method,
            "amount": p.amount,
            "status": p.status,
            "transaction_type": p.transaction_type,
            "simulated_at": p.simulated_at
        }
        for p in app.payments
    ]

    history = [
        {
            "previous_status": h.previous_status,
            "new_status": h.new_status,
            "admin_identifier": h.admin_identifier,
            "review_note": h.review_note,
            "timestamp": h.timestamp.strftime("%d %b %Y, %I:%M %p") if h.timestamp else "N/A"
        }
        for h in sorted(app.status_history, key=lambda x: x.id)
    ]

    return {
        "id": app.id,
        "app_id": app.app_id,
        "full_name": app.full_name,
        "father_name": app.father_name,
        "mother_name": app.mother_name,
        "date_of_birth": app.date_of_birth,
        "gender": app.gender,
        "mobile": mask_mobile(app.mobile),
        "email": mask_email(app.email),
        "mobile_masked": mask_mobile(app.mobile),
        "email_masked": mask_email(app.email),
        "present_address": app.present_address,
        "permanent_address": app.permanent_address,
        "department_id": app.department_id,
        "department_name": dept.name if dept else "N/A",
        "faculty": dept.faculty if dept else "N/A",
        "degree_level": app.degree_level,
        "registration_category": app.registration_category,
        "admission_session": app.admission_session,
        "roll_number": app.roll_number,
        "registration_number": app.registration_number,
        "gown_size": app.gown_size,
        "guest_count": app.guest_count,
        "guest_details": app.guest_details_json,
        "original_certificate_held": app.original_certificate_held,
        "degrees": app.degrees_json,
        "photo_url": app.photo_url,
        "status": app.status,
        "review_note": app.review_note,
        "payment_status": "DEMO SUCCESS" if has_paid else ("PAYMENT_DUE" if (app.status in ["APPROVED", "Approved", "Approved (Demo)"]) else "NOT_AVAILABLE"),
        "payment_unlocked": (app.status in ["APPROVED", "Approved", "Approved (Demo)"] and not has_paid),
        "fee_breakdown": {
            "registration_fee": fee.registration_fee if fee else 4500.0,
            "certificate_fee": fee.certificate_fee if fee else 0.0,
            "guest_fee": fee.guest_fee if fee else 0.0,
            "service_charge": fee.service_charge if fee else 32.50,
            "total_payable": fee.total_payable if fee else 4532.50
        },
        "payments": payments,
        "status_history": history,
        "created_at": app.created_at.strftime("%d %b %Y, %I:%M %p")
    }

@router.put("/applications/{app_id}/status")
def update_application_status(
    app_id: str,
    req: AdminStatusChangeRequest,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Application)
    if app_id.isdigit():
        app = query.filter(Application.id == int(app_id)).first()
    else:
        app = query.filter(Application.app_id == app_id.strip()).first()

    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")

    raw_status = req.new_status.strip()
    status_lower = raw_status.lower()
    
    if raw_status in ["Submitted", "Under Review", "Approved (Demo)", "Rejected (Demo)", "Correction Required", "PENDING_REVIEW", "APPROVED", "REJECTED", "CORRECTION_REQUIRED", "Approved", "Rejected"]:
        canonical_status = raw_status
    elif "approve" in status_lower:
        canonical_status = "APPROVED"
    elif "reject" in status_lower:
        canonical_status = "REJECTED"
    elif "correction" in status_lower:
        canonical_status = "CORRECTION_REQUIRED"
    elif "review" in status_lower or "pending" in status_lower:
        canonical_status = "PENDING_REVIEW"
    else:
        raise HTTPException(status_code=400, detail=f"Invalid status: {raw_status}")

    prev_status = app.status
    app.status = canonical_status
    if req.review_note:
        app.review_note = req.review_note

    # Record history
    history = ApplicationStatusHistory(
        application_id=app.id,
        previous_status=prev_status,
        new_status=canonical_status,
        admin_identifier=admin.email or "Admin",
        review_note=req.review_note or f"Status transitioned to {canonical_status} by Administrative Review."
    )
    db.add(history)
    db.commit()

    has_paid = any(p.status == "DEMO SUCCESS" for p in app.payments)
    payment_status = "DEMO SUCCESS" if has_paid else ("PAYMENT_DUE" if canonical_status == "APPROVED" else "NOT_AVAILABLE")

    return {
        "message": f"Application status successfully changed to {canonical_status}",
        "app_id": app.app_id,
        "previous_status": prev_status,
        "new_status": canonical_status,
        "payment_status": payment_status,
        "payment_unlocked": (canonical_status == "APPROVED" and not has_paid)
    }

# Notice Management
@router.post("/notices")
def create_notice(
    req: NoticeCreate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    notice = Notice(
        title=req.title,
        category=req.category,
        description=req.description,
        date=req.date,
        is_published=req.is_published,
        is_new=req.is_new,
        pdf_link=req.pdf_link
    )
    db.add(notice)
    db.commit()
    db.refresh(notice)
    return {"message": "Notice created successfully", "notice": notice}

@router.put("/notices/{notice_id}")
def update_notice(
    notice_id: int,
    req: NoticeUpdate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    notice = db.query(Notice).filter(Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found.")

    if req.title is not None:
        notice.title = req.title
    if req.category is not None:
        notice.category = req.category
    if req.description is not None:
        notice.description = req.description
    if req.date is not None:
        notice.date = req.date
    if req.is_published is not None:
        notice.is_published = req.is_published
    if req.is_new is not None:
        notice.is_new = req.is_new
    if req.pdf_link is not None:
        notice.pdf_link = req.pdf_link

    db.commit()
    db.refresh(notice)
    return {"message": "Notice updated successfully", "notice": notice}

@router.delete("/notices/{notice_id}")
def delete_notice(
    notice_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    notice = db.query(Notice).filter(Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found.")
    db.delete(notice)
    db.commit()
    return {"message": "Notice deleted successfully"}

# CSV Export
@router.get("/export/csv")
def export_csv(
    data_type: str = Query("applications", description="applications | payments | departments"),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    output = io.StringIO()
    writer = csv.writer(output)

    if data_type == "applications":
        writer.writerow([
            "Application ID", "Student Name", "Department", "Degree Level", 
            "Category", "Roll Number", "Session", "Gown Size", "Guest Count", 
            "Status", "Payment Status", "Total Amount (BDT)", "Created At"
        ])
        apps = db.query(Application).order_by(Application.id.desc()).all()
        for a in apps:
            dept = db.query(Department).filter(Department.id == a.department_id).first()
            has_paid = any(p.status == "DEMO SUCCESS" for p in a.payments)
            fee = a.fee_breakdown
            writer.writerow([
                a.app_id, a.full_name, dept.name if dept else "N/A", a.degree_level,
                a.registration_category, a.roll_number, a.admission_session,
                a.gown_size, a.guest_count, a.status,
                "DEMO SUCCESS" if has_paid else "NOT PAID",
                fee.total_payable if fee else 0.0,
                a.created_at.strftime("%Y-%m-%d %H:%M:%S")
            ])
        filename = "convocation_demo_applications.csv"

    elif data_type == "payments":
        writer.writerow([
            "Reference ID", "Application ID", "Payment Method", "Amount (BDT)", 
            "Status", "Transaction Type", "Simulated At"
        ])
        payments = db.query(PaymentSimulation).order_by(PaymentSimulation.id.desc()).all()
        for p in payments:
            app = p.application
            writer.writerow([
                p.reference_id, app.app_id if app else "N/A", p.payment_method,
                p.amount, p.status, p.transaction_type,
                p.simulated_at.strftime("%Y-%m-%d %H:%M:%S") if p.simulated_at else "N/A"
            ])
        filename = "convocation_demo_payments.csv"

    else:
        writer.writerow(["Department ID", "Department Name", "Faculty", "Total Applications"])
        depts = db.query(Department).order_by(Department.id).all()
        for d in depts:
            count = db.query(Application).filter(Application.department_id == d.id).count()
            writer.writerow([d.id, d.name, d.faculty, count])
        filename = "convocation_demo_departments.csv"

    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
