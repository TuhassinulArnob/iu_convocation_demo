import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User, Application, Department, FeeBreakdown, PaymentSimulation, ApplicationStatusHistory
from app.schemas.schemas import ApplicationUpdateRequest, PublicTrackResponse
from app.services.fee_engine import calculate_fees

router = APIRouter(prefix="/applications", tags=["Applications"])

@router.get("/my")
def get_my_application(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.user_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="No application record found for this user.")

    dept = db.query(Department).filter(Department.id == app.department_id).first()

    # Parse JSON fields
    try:
        degrees = json.loads(app.degrees_json or "[]")
    except Exception:
        degrees = []

    try:
        guests = json.loads(app.guest_details_json or "[]")
    except Exception:
        guests = []

    # Fee details
    fee = app.fee_breakdown
    fee_data = None
    if fee:
        fee_data = {
            "registration_category": fee.registration_category,
            "registration_fee": fee.registration_fee,
            "certificate_fee": fee.certificate_fee,
            "guest_fee": fee.guest_fee,
            "chargeable_guests": fee.chargeable_guests,
            "service_charge": fee.service_charge,
            "total_payable": fee.total_payable,
            "formatted_total": f"৳{fee.total_payable:,.2f}"
        }

    # Payment simulation records
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

    # Status history
    history = [
        {
            "previous_status": h.previous_status,
            "new_status": h.new_status,
            "admin_identifier": h.admin_identifier,
            "review_note": h.review_note,
            "timestamp": h.timestamp
        }
        for h in sorted(app.status_history, key=lambda x: x.timestamp or x.id)
    ]

    has_paid = any(p.status == "DEMO SUCCESS" for p in app.payments)
    is_approved = app.status in ["APPROVED", "Approved", "Approved (Demo)"]
    is_rejected = "Rejected" in app.status or app.status == "REJECTED"

    if has_paid:
        payment_status = "DEMO SUCCESS"
        can_pay = False
    elif is_approved:
        payment_status = "PAYMENT_DUE"
        can_pay = True
    else:
        payment_status = "NOT_AVAILABLE"
        can_pay = False

    return {
        "id": app.id,
        "app_id": app.app_id,
        "full_name": app.full_name,
        "father_name": app.father_name,
        "mother_name": app.mother_name,
        "date_of_birth": app.date_of_birth,
        "gender": app.gender,
        "mobile": app.mobile,
        "email": app.email,
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
        "guest_details": guests,
        "original_certificate_held": app.original_certificate_held,
        "degrees": degrees,
        "photo_url": app.photo_url,
        "status": app.status,
        "current_step": app.current_step or 1,
        "review_note": app.review_note,
        "has_paid": has_paid,
        "is_approved": is_approved,
        "is_rejected": is_rejected,
        "can_pay": can_pay,
        "payment_status": payment_status,
        "fee_breakdown": fee_data,
        "payments": payments,
        "status_history": history,
        "created_at": app.created_at,
        "updated_at": app.updated_at
    }

@router.put("/my")
def update_my_application(
    req: ApplicationUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.user_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="No application record found.")

    # Update personal fields
    if req.full_name is not None:
        app.full_name = req.full_name.strip()
    if req.father_name is not None:
        app.father_name = req.father_name.strip()
    if req.mother_name is not None:
        app.mother_name = req.mother_name.strip()
    if req.date_of_birth is not None:
        app.date_of_birth = req.date_of_birth
    if req.gender is not None:
        app.gender = req.gender
    if req.mobile is not None:
        app.mobile = req.mobile.strip()
    if req.email is not None:
        app.email = req.email.strip()
    if req.present_address is not None:
        app.present_address = req.present_address
    if req.permanent_address is not None:
        app.permanent_address = req.permanent_address
    if req.department_id is not None:
        dept = db.query(Department).filter(Department.id == req.department_id).first()
        if dept:
            app.department_id = req.department_id
    if req.degree_level is not None:
        app.degree_level = req.degree_level
    if req.registration_category is not None:
        app.registration_category = req.registration_category
    if req.admission_session is not None:
        app.admission_session = req.admission_session
    if req.roll_number is not None:
        app.roll_number = req.roll_number
    if req.registration_number is not None:
        app.registration_number = req.registration_number
    if req.gown_size is not None:
        app.gown_size = req.gown_size
    if req.photo_url is not None:
        app.photo_url = req.photo_url
    if req.original_certificate_held is not None:
        app.original_certificate_held = req.original_certificate_held

    # Degrees JSON
    degrees_list = []
    if req.degrees is not None:
        degrees_list = [d.model_dump() for d in req.degrees]
        app.degrees_json = json.dumps(degrees_list)
    else:
        try:
            degrees_list = json.loads(app.degrees_json or "[]")
        except Exception:
            degrees_list = []

    # Guest details JSON
    guests_list = []
    if req.guest_details is not None:
        # Enforce max 3 guests
        guests_list = [g.model_dump() for g in req.guest_details[:3]]
        app.guest_count = len(guests_list)
        app.guest_details_json = json.dumps(guests_list)
    elif req.guest_count is not None:
        app.guest_count = min(req.guest_count, 3)

    if req.status is not None:
        app.status = req.status
    if req.current_step is not None:
        app.current_step = req.current_step

    # Recalculate Fees dynamically
    calc_res = calculate_fees(
        registration_category=app.registration_category or "Regular",
        selected_degrees=degrees_list,
        original_certificate_held=app.original_certificate_held,
        guests=guests_list,
        primary_degree_level=app.degree_level
    )

    fee = app.fee_breakdown
    if not fee:
        fee = FeeBreakdown(application_id=app.id)
        db.add(fee)

    fee.registration_category = calc_res["registration_category"]
    fee.registration_fee = calc_res["registration_fee"]
    fee.certificate_fee = calc_res["certificate_fee"]
    fee.guest_fee = calc_res["guest_fee"]
    fee.chargeable_guests = calc_res["chargeable_guests"]
    fee.service_charge = calc_res["service_charge"]
    fee.total_payable = calc_res["total_payable"]

    db.commit()
    db.refresh(app)

    return {"message": "Application updated successfully", "app_id": app.app_id}

@router.post("/my/submit")
def submit_my_application(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.user_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="No application record found.")

    if not app.photo_url:
        raise HTTPException(
            status_code=400,
            detail="A passport-size photograph is required before submitting your application."
        )

    prev = app.status
    new_status = "PENDING_REVIEW"
    app.status = new_status
    app.current_step = 8
    
    history = ApplicationStatusHistory(
        application_id=app.id,
        previous_status=prev,
        new_status=new_status,
        admin_identifier="Applicant",
        review_note="Application submitted by applicant for demonstration administrative review."
    )
    db.add(history)
    db.commit()

    return {
        "message": "Application submitted successfully. Your application is now under administrative review.",
        "status": new_status,
        "payment_status": "NOT_AVAILABLE"
    }

@router.get("/my/card")
def get_convocation_card(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.user_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")

    has_paid = any(p.status == "DEMO SUCCESS" for p in app.payments)
    is_approved = app.status in ["APPROVED", "Approved", "Approved (Demo)"]

    if not is_approved or not has_paid:
        raise HTTPException(
            status_code=400,
            detail="Convocation card is only generated after administrative approval and completed demonstration fee payment."
        )

    dept = db.query(Department).filter(Department.id == app.department_id).first()
    
    try:
        guests = json.loads(app.guest_details_json or "[]")
    except Exception:
        guests = []

    return {
        "event_name": "5th Convocation 2027",
        "bangla_event_name": "৫ম সমাবর্তন ২০২৭",
        "institution": "Islamic University Bangladesh",
        "location": "Kushtia, Bangladesh",
        "ceremony_date": "Tuesday, 02 February 2027",
        "ceremony_time": "09:00 AM BST",
        "venue": "Central Playground, Islamic University Campus, Kushtia",
        "app_id": app.app_id,
        "student_name": app.full_name,
        "department": dept.name if dept else "N/A",
        "faculty": dept.faculty if dept else "N/A",
        "degree": app.degree_level,
        "roll_number": app.roll_number,
        "registration_number": app.registration_number,
        "session": app.admission_session,
        "gown_size": app.gown_size,
        "guest_count": app.guest_count,
        "guests": guests,
        "photo_url": app.photo_url,
        "watermark": "UNOFFICIAL DEMONSTRATION CARD — NOT VALID FOR UNIVERSITY ENTRY.",
        "qr_demo_code": f"IU2027-{app.app_id}-VERIFIED-DEMO"
    }

@router.get("/track/{app_id}", response_model=PublicTrackResponse)
def track_application_public(app_id: str, db: Session = Depends(get_db)):
    clean_id = app_id.strip().upper()
    app = db.query(Application).filter(Application.app_id == clean_id).first()
    if not app:
        raise HTTPException(
            status_code=404,
            detail="Application ID not found. Please verify the demonstration Application ID (e.g. IU27-DEMO-XXXXXX)."
        )

    dept = db.query(Department).filter(Department.id == app.department_id).first()
    has_paid = any(p.status == "DEMO SUCCESS" for p in app.payments)
    is_approved = app.status in ["APPROVED", "Approved", "Approved (Demo)"]
    is_rejected = "Rejected" in app.status or app.status == "REJECTED"

    if has_paid:
        payment_status = "DEMO SUCCESS"
    elif is_approved:
        payment_status = "PAYMENT_DUE"
    else:
        payment_status = "NOT_AVAILABLE"

    # Timeline construction:
    # 1. Registration Recorded
    # 2. Application Submitted
    # 3. Administrative Review & Approval
    # 4. Fee Payment
    # 5. Final Convocation Status
    timeline = [
        {
            "step": 1,
            "title": "Account & Draft",
            "desc": "Initial demonstration registration recorded",
            "status": "completed"
        },
        {
            "step": 2,
            "title": "Application Submitted",
            "desc": "Personal, academic, and degree details entered",
            "status": "completed" if app.status != "Account Created" and app.status != "Form Incomplete" else "active"
        },
        {
            "step": 3,
            "title": "Administrative Review",
            "desc": "Verification by Convocation Administrative Cell",
            "status": "completed" if is_approved else ("failed" if is_rejected else ("active" if app.status in ["PENDING_REVIEW", "Pending Review", "Under Review", "Submitted"] else "pending"))
        },
        {
            "step": 4,
            "title": "Fee Payment",
            "desc": "Simulated bKash/Rocket QR payment gateway",
            "status": "completed" if has_paid else ("active" if is_approved else "pending")
        },
        {
            "step": 5,
            "title": "Card Activation",
            "desc": "Printable Convocation Entry Pass issued",
            "status": "completed" if (is_approved and has_paid) else ("failed" if is_rejected else "pending")
        }
    ]

    last_update = app.updated_at.strftime("%d %b %Y, %I:%M %p") if app.updated_at else app.created_at.strftime("%d %b %Y, %I:%M %p")

    # Privacy Protection: do NOT expose full name, mobile, email, photo, password, father, address!
    return PublicTrackResponse(
        app_id=app.app_id,
        status=app.status,
        submission_date=app.created_at.strftime("%d %b %Y"),
        department=dept.name if dept else "N/A",
        degree_level=app.degree_level,
        payment_status=payment_status,
        last_status_update=last_update,
        timeline=timeline,
        disclaimer="This is a public tracking feature for an unofficial demonstration project. It does not represent official university registration or verification."
    )
