import json
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import (
    User, Application, Department, FeeBreakdown, 
    PaymentSimulation, ApplicationStatusHistory,
    ApplicationRevision, ConvocationCard
)
from app.schemas.schemas import (
    ApplicationUpdateRequest, PublicTrackResponse,
    PublicVerifyCardResponse, ConvocationCardResponse
)
from app.core.security import (
    generate_card_verification_token, 
    generate_card_signature, 
    verify_card_signature
)
from app.services.fee_engine import calculate_fees
from app.services.pdf_generator import generate_convocation_card_pdf
from app.api.admin import create_application_snapshot

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

    try:
        corr_cats = json.loads(app.correction_categories or "[]")
    except Exception:
        corr_cats = []

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

    status_clean = (app.status or "").strip()
    status_lower = status_clean.lower()

    # Determine state flags: strictly tied to status
    is_correction_required = (
        "correct" in status_lower 
        or status_clean in ["CORRECTION_REQUIRED", "Correction Required"]
    )
    is_approved = not is_correction_required and ("approve" in status_lower or status_clean in ["APPROVED", "Approved", "Approved (Demo)"])
    is_rejected = not is_correction_required and not is_approved and ("reject" in status_lower or status_clean in ["REJECTED", "Rejected"])
    has_paid = any(p.status == "DEMO SUCCESS" for p in app.payments)

    if has_paid and not is_correction_required:
        payment_status = "DEMO SUCCESS"
        can_pay = False
    elif is_approved:
        payment_status = "PAYMENT_DUE"
        can_pay = True
    else:
        payment_status = "DEMO SUCCESS" if has_paid else "NOT_AVAILABLE"
        can_pay = False

    # Editing permission rule: Only editable when in Draft/Form Incomplete/Correction Required
    can_edit = is_correction_required or status_lower in ["account created", "draft", "form incomplete"]

    # Active Convocation Card
    active_card = db.query(ConvocationCard).filter(
        ConvocationCard.application_id == app.id,
        ConvocationCard.status == "VALID"
    ).first()

    card_data = None
    if active_card:
        card_data = {
            "card_id": active_card.card_id,
            "version": active_card.version,
            "status": active_card.status,
            "issued_at": active_card.issued_at.strftime("%d %b %Y, %I:%M %p") if active_card.issued_at else "N/A",
            "verification_token": active_card.verification_token,
            "verification_url": f"/verify/{active_card.card_id}?token={active_card.verification_token}",
            "digital_signature": active_card.digital_signature
        }

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
        "can_edit": can_edit,
        "is_correction_required": is_correction_required,
        "correction_instructions": app.correction_instructions,
        "correction_categories": corr_cats,
        "correction_requested_at": app.correction_requested_at.strftime("%d %b %Y, %I:%M %p") if app.correction_requested_at else None,
        "resubmitted_at": app.resubmitted_at.strftime("%d %b %Y, %I:%M %p") if app.resubmitted_at else None,
        "has_paid": has_paid,
        "is_approved": is_approved,
        "is_rejected": is_rejected,
        "can_pay": can_pay,
        "payment_status": payment_status,
        "fee_breakdown": fee_data,
        "active_card": card_data,
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

    # Rule 1A & 1D: Editing locked while application is under review or approved
    status_clean = (app.status or "").strip()
    status_lower = status_clean.lower()
    is_editable = (
        "correct" in status_lower 
        or status_clean in ["CORRECTION_REQUIRED", "Correction Required"]
        or status_lower in ["account created", "draft", "form incomplete"]
    )
    if not is_editable:
        raise HTTPException(
            status_code=403,
            detail=f"Application editing is locked while status is '{app.status}'. Editing is permitted only when an administrator requests correction."
        )

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
        guests_list = [g.model_dump() for g in req.guest_details[:3]]
        app.guest_count = len(guests_list)
        app.guest_details_json = json.dumps(guests_list)
    elif req.guest_count is not None:
        app.guest_count = min(req.guest_count, 3)

    if req.status is not None and req.status in editable_statuses:
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

    # Initial revision snapshot
    rev_count = db.query(ApplicationRevision).filter(ApplicationRevision.application_id == app.id).count()
    rev = ApplicationRevision(
        application_id=app.id,
        revision_number=rev_count + 1,
        snapshot_json=create_application_snapshot(app),
        changed_by="applicant",
        change_type="INITIAL_SUBMISSION",
        notes="Candidate submitted initial application."
    )
    db.add(rev)

    db.commit()

    return {
        "message": "Application submitted successfully. Your application is now under administrative review.",
        "status": new_status,
        "payment_status": "NOT_AVAILABLE"
    }

@router.post("/my/resubmit")
def resubmit_my_application(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.user_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="No application record found.")

    status_clean = (app.status or "").strip()
    status_lower = status_clean.lower()
    is_correction_mode = (
        "correct" in status_lower 
        or status_clean in ["CORRECTION_REQUIRED", "Correction Required"]
        or bool(app.correction_instructions)
    )
    if not is_correction_mode:
        raise HTTPException(
            status_code=400,
            detail=f"Resubmission is only valid for applications requiring correction. Current status is '{app.status}'."
        )

    # Validate essential fields
    if not app.full_name or not app.full_name.strip():
        raise HTTPException(status_code=400, detail="Full candidate name is required before resubmission.")
    if not app.department_id:
        raise HTTPException(status_code=400, detail="Department selection is required before resubmission.")
    if not app.roll_number or not app.roll_number.strip():
        raise HTTPException(status_code=400, detail="Student roll number is required before resubmission.")
    if not app.photo_url:
        raise HTTPException(status_code=400, detail="A passport photograph is required before resubmitting your application.")

    prev_status = app.status
    app.status = "PENDING_REVIEW"
    now_utc = datetime.now(timezone.utc)
    app.resubmitted_at = now_utc

    # Audit History
    history = ApplicationStatusHistory(
        application_id=app.id,
        previous_status=prev_status,
        new_status="PENDING_REVIEW",
        admin_identifier="Applicant",
        review_note="Application resubmitted by candidate following requested corrections."
    )
    db.add(history)

    # Revision snapshot
    rev_count = db.query(ApplicationRevision).filter(ApplicationRevision.application_id == app.id).count()
    resub_rev = ApplicationRevision(
        application_id=app.id,
        revision_number=rev_count + 1,
        snapshot_json=create_application_snapshot(app),
        changed_by="applicant",
        change_type="RESUBMISSION",
        notes="Candidate updated and resubmitted application for administrative review."
    )
    db.add(resub_rev)

    db.commit()
    db.refresh(app)

    return {
        "message": "Application resubmitted successfully. Your updates are now under administrative review.",
        "status": "PENDING_REVIEW",
        "resubmitted_at": app.resubmitted_at.strftime("%d %b %Y, %I:%M %p")
    }

@router.get("/my/card", response_model=ConvocationCardResponse)
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

    # Check for active valid card
    card = db.query(ConvocationCard).filter(
        ConvocationCard.application_id == app.id,
        ConvocationCard.status == "VALID"
    ).first()

    if not card:
        past_cards = db.query(ConvocationCard).filter(ConvocationCard.application_id == app.id).all()
        new_version = (max([c.version for c in past_cards]) if past_cards else 0) + 1
        clean_app_id = app.app_id.replace("IU27-DEMO-", "")
        card_id = f"IU27-CARD-{clean_app_id}-V{new_version}"
        verification_token = generate_card_verification_token()
        now_utc = datetime.now(timezone.utc)
        sig = generate_card_signature(card_id, app.app_id, app.roll_number, now_utc)
        meta = create_application_snapshot(app)

        card = ConvocationCard(
            card_id=card_id,
            application_id=app.id,
            verification_token=verification_token,
            digital_signature=sig,
            status="VALID",
            version=new_version,
            issued_at=now_utc,
            metadata_json=meta
        )
        db.add(card)
        db.commit()
        db.refresh(card)

    return ConvocationCardResponse(
        event_name="5th Convocation 2027",
        bangla_event_name="৫ম সমাবর্তন ২০২৭",
        institution="Islamic University Bangladesh",
        location="Kushtia, Bangladesh",
        ceremony_date="Tuesday, 02 February 2027",
        ceremony_time="09:00 AM BST",
        venue="Central Playground, Islamic University Campus, Kushtia",
        app_id=app.app_id,
        card_id=card.card_id,
        verification_token=card.verification_token,
        verification_url=f"/verify/{card.card_id}?token={card.verification_token}",
        digital_signature=card.digital_signature,
        digital_signature_indicator="Digitally Verified — Educational Demonstration",
        issued_at=card.issued_at.strftime("%d %b %Y, %I:%M %p"),
        student_name=app.full_name,
        department=dept.name if dept else "N/A",
        faculty=dept.faculty if dept else "N/A",
        degree=app.degree_level,
        roll_number=app.roll_number,
        registration_number=app.registration_number,
        session=app.admission_session,
        gown_size=app.gown_size or "L",
        guest_count=app.guest_count or 0,
        guests=guests,
        photo_url=app.photo_url,
        watermark="UNOFFICIAL DEMONSTRATION CARD — NOT VALID FOR UNIVERSITY ENTRY.",
        version=card.version,
        status=card.status
    )

@router.get("/my/card/pdf")
def download_convocation_card_pdf(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    card_resp = get_convocation_card(current_user=current_user, db=db)
    
    # Generate full verification URL
    verification_url = f"https://iu-convocation-2027.vercel.app{card_resp.verification_url}"

    pdf_bytes = generate_convocation_card_pdf(
        card_id=card_resp.card_id,
        app_id=card_resp.app_id,
        student_name=card_resp.student_name,
        department=card_resp.department,
        degree=card_resp.degree,
        roll_number=card_resp.roll_number,
        registration_number=card_resp.registration_number or "",
        session=card_resp.session,
        gown_size=card_resp.gown_size,
        guest_count=card_resp.guest_count,
        issued_at_str=card_resp.issued_at,
        digital_signature=card_resp.digital_signature,
        verification_url=verification_url,
        photo_url=card_resp.photo_url
    )

    filename = f"IU27_Convocation_Card_{card_resp.card_id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/verify/{card_id}", response_model=PublicVerifyCardResponse)
def verify_card_public(
    card_id: str,
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    clean_id = card_id.strip()
    card = db.query(ConvocationCard).filter(ConvocationCard.card_id.ilike(clean_id)).first()
    
    if not card:
        return PublicVerifyCardResponse(
            valid=False,
            status="INVALID",
            status_label="Invalid Demo Card",
            digital_signature_verification="Invalid",
            verification_message="No matching Convocation Card record found in the university demonstration registry."
        )

    app = db.query(Application).filter(Application.id == card.application_id).first()
    dept = db.query(Department).filter(Department.id == app.department_id).first() if app else None
    has_paid = any(p.status == "DEMO SUCCESS" for p in app.payments) if app else False

    # Check verification token
    token_valid = True
    if token:
        if card.verification_token != token.strip():
            token_valid = False

    # Check cryptographic signature
    sig_valid = verify_card_signature(
        card.card_id,
        app.app_id if app else "",
        app.roll_number if app else "",
        card.issued_at,
        card.digital_signature
    ) if app else False

    if not token_valid or not sig_valid:
        return PublicVerifyCardResponse(
            valid=False,
            status="INVALID",
            status_label="Invalid Demo Card",
            card_id=card.card_id,
            candidate_name=app.full_name if app else "Candidate",
            department=dept.name if dept else "N/A",
            degree_level=app.degree_level if app else "N/A",
            issued_at=card.issued_at.strftime("%d %b %Y, %I:%M %p"),
            digital_signature_verification="Invalid",
            digital_signature=card.digital_signature,
            verification_message="Cryptographic verification failed: verification token or signature does not match database record."
        )

    if card.status != "VALID":
        rev_date = card.revoked_at.strftime("%d %b %Y, %I:%M %p") if card.revoked_at else "N/A"
        return PublicVerifyCardResponse(
            valid=False,
            status="REVOKED",
            status_label="Invalid / Revoked",
            card_id=card.card_id,
            candidate_name=app.full_name if app else "Candidate",
            department=dept.name if dept else "N/A",
            degree_level=app.degree_level if app else "N/A",
            issued_at=card.issued_at.strftime("%d %b %Y, %I:%M %p"),
            revoked_at=rev_date,
            revocation_reason=card.revocation_reason or "Card was revoked or invalidated by administration.",
            payment_confirmation_status="DEMO SUCCESS (Verified)" if has_paid else "NOT PAID",
            digital_signature_verification="Valid",
            digital_signature=card.digital_signature,
            verification_message=f"This Convocation Card was REVOKED on {rev_date}. Reason: {card.revocation_reason or 'Application reopened or amended by administration.'}"
        )

    return PublicVerifyCardResponse(
        valid=True,
        status="VALID",
        status_label="Valid Demo Card",
        candidate_name=app.full_name if app else "Candidate",
        card_id=card.card_id,
        degree_level=app.degree_level if app else "N/A",
        department=dept.name if dept else "N/A",
        convocation_year="2027 (5th Convocation)",
        issued_at=card.issued_at.strftime("%d %b %Y, %I:%M %p"),
        payment_confirmation_status="DEMO SUCCESS (Verified)" if has_paid else "NOT PAID",
        digital_signature_verification="Valid",
        digital_signature=card.digital_signature,
        verification_message="Verified authentic demonstration convocation card issued by Islamic University 5th Convocation 2027 demo portal."
    )

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
