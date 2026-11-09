import random
import string
import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.core.deps import get_current_user
from app.models.models import User, Application, Department, FeeBreakdown, ApplicationStatusHistory
from app.schemas.schemas import Step1RegisterRequest, LoginRequest, TokenResponse
from app.services.fee_engine import calculate_fees

router = APIRouter(prefix="/auth", tags=["Authentication"])

def generate_app_id(db: Session) -> str:
    while True:
        num = random.randint(100100, 999999)
        app_id = f"IU27-DEMO-{num}"
        existing = db.query(Application).filter(Application.app_id == app_id).first()
        if not existing:
            return app_id

@router.post("/register-step1", response_model=TokenResponse)
def register_step1(req: Step1RegisterRequest, db: Session = Depends(get_db)):
    # Validate department selection
    if not req.department_id or req.department_id <= 0:
        raise HTTPException(status_code=400, detail="Please select a valid department from the dropdown list.")

    dept = db.query(Department).filter(Department.id == req.department_id).first()
    if not dept:
        raise HTTPException(status_code=400, detail="The selected department was not found in the university database.")

    # Validate user-defined password (minimum 8 characters and confirmation match)
    if not req.password or len(req.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long.")
    if req.confirm_password and req.password != req.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match. Please verify your confirm password.")

    # Check existing user by email, mobile, or roll_number
    existing_user = db.query(User).filter(
        or_(
            User.email == req.email,
            User.mobile == req.mobile,
            User.roll_number == req.roll_number
        )
    ).first()

    if existing_user:
        # If user provides valid password for the existing account, allow resuming/updating draft
        if req.password and verify_password(req.password, existing_user.password_hash):
            app = existing_user.application
            if not app:
                new_app_id = generate_app_id(db)
                is_evening = "evening" in req.degree_level.lower()
                reg_category = "Evening" if is_evening else "Regular"
                app = Application(
                    app_id=new_app_id,
                    user_id=existing_user.id,
                    full_name=req.full_name or f"Student {req.roll_number}",
                    mobile=req.mobile,
                    email=req.email,
                    department_id=req.department_id,
                    degree_level=req.degree_level,
                    registration_category=reg_category,
                    admission_session=req.admission_session,
                    roll_number=req.roll_number,
                    registration_number=f"{req.roll_number}-IU",
                    status="Account Created",
                    current_step=2
                )
                db.add(app)
                db.commit()
                db.refresh(app)
            else:
                app.department_id = req.department_id
                app.degree_level = req.degree_level
                app.admission_session = req.admission_session
                app.roll_number = req.roll_number
                if req.full_name:
                    app.full_name = req.full_name.strip()
                if (app.current_step or 1) < 2:
                    app.current_step = 2
                db.commit()

            token = create_access_token({"sub": existing_user.id, "role": existing_user.role, "app_id": app.app_id})
            return TokenResponse(
                access_token=token,
                token_type="bearer",
                role=existing_user.role,
                user_id=existing_user.id,
                app_id=app.app_id,
                student_name=app.full_name
            )

        raise HTTPException(
            status_code=400,
            detail="An account already exists with this Email, Mobile Number, or Roll Number. Please sign in with your credentials to resume your registration."
        )

    # Use provided password or generate demo password
    plain_password = req.password if req.password and len(req.password) >= 6 else "StudentIU@2027"
    hashed_pwd = hash_password(plain_password)

    # Full name fallback
    full_name = req.full_name.strip() if req.full_name else f"Student {req.roll_number}"

    # Create User
    new_user = User(
        email=req.email,
        mobile=req.mobile,
        roll_number=req.roll_number,
        password_hash=hashed_pwd,
        role="student",
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create Application
    new_app_id = generate_app_id(db)
    is_evening = "evening" in req.degree_level.lower()
    reg_category = "Evening" if is_evening else "Regular"

    new_app = Application(
        app_id=new_app_id,
        user_id=new_user.id,
        full_name=full_name,
        mobile=req.mobile,
        email=req.email,
        department_id=req.department_id,
        degree_level=req.degree_level,
        registration_category=reg_category,
        admission_session=req.admission_session,
        roll_number=req.roll_number,
        registration_number=f"{req.roll_number}-IU",
        status="Account Created",
        current_step=2,
        degrees_json=json.dumps([{
            "degree_type": req.degree_level,
            "department": dept.name,
            "session": req.admission_session,
            "exam_year": "2023",
            "roll_number": req.roll_number,
            "has_certificate": False
        }])
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)

    # Calculate initial fee breakdown
    initial_fees = calculate_fees(
        registration_category=reg_category,
        primary_degree_level=req.degree_level,
        original_certificate_held=False,
        guests=[]
    )
    fee_rec = FeeBreakdown(
        application_id=new_app.id,
        registration_category=initial_fees["registration_category"],
        registration_fee=initial_fees["registration_fee"],
        certificate_fee=initial_fees["certificate_fee"],
        guest_fee=initial_fees["guest_fee"],
        chargeable_guests=initial_fees["chargeable_guests"],
        service_charge=initial_fees["service_charge"],
        total_payable=initial_fees["total_payable"]
    )
    db.add(fee_rec)

    # History record
    history = ApplicationStatusHistory(
        application_id=new_app.id,
        previous_status=None,
        new_status="Account Created",
        admin_identifier="System",
        review_note="Account created and Step 1 registration recorded."
    )
    db.add(history)
    db.commit()

    token = create_access_token({"sub": new_user.id, "role": new_user.role, "app_id": new_app.app_id})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role=new_user.role,
        user_id=new_user.id,
        app_id=new_app.app_id,
        student_name=new_app.full_name
    )

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    ident = req.identifier.strip()
    user = db.query(User).filter(
        or_(
            User.email == ident,
            User.mobile == ident,
            User.roll_number == ident
        )
    ).first()

    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please verify your mobile number, email, or roll number and password."
        )

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Your account is deactivated.")

    app_id = None
    student_name = "Administrator" if user.role == "admin" else "Student"

    if user.application:
        app_id = user.application.app_id
        student_name = user.application.full_name

    token = create_access_token({"sub": user.id, "role": user.role, "app_id": app_id})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role=user.role,
        user_id=user.id,
        app_id=app_id,
        student_name=student_name
    )

@router.post("/forgot-password-demo")
def forgot_password_demo(req: dict):
    identifier = req.get("identifier", "").strip()
    if not identifier:
        raise HTTPException(status_code=400, detail="Mobile number, Email or Roll number is required.")
    
    return {
        "status": "success",
        "demo_mode": True,
        "message": "DEVELOPMENT DEMO SIMULATION: No real SMS/Email is transmitted.",
        "simulated_reset_code": "IU2027-RESET-8899",
        "instructions": "In this demonstration environment, default demo passwords are: Student: 'StudentIU@2027', Admin: 'AdminIU@2027'."
    }

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    app_info = None
    if current_user.application:
        app = current_user.application
        dept = db.query(Department).filter(Department.id == app.department_id).first()
        app_info = {
            "app_id": app.app_id,
            "full_name": app.full_name,
            "department": dept.name if dept else "N/A",
            "degree_level": app.degree_level,
            "roll_number": app.roll_number,
            "status": app.status,
            "photo_url": app.photo_url
        }

    return {
        "user_id": current_user.id,
        "email": current_user.email,
        "mobile": current_user.mobile,
        "roll_number": current_user.roll_number,
        "role": current_user.role,
        "application": app_info
    }

@router.get("/draft")
def get_draft(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    app = current_user.application
    if not app:
        return {"has_draft": False}

    dept = db.query(Department).filter(Department.id == app.department_id).first()
    try:
        degrees = json.loads(app.degrees_json or "[]")
    except Exception:
        degrees = []
    try:
        guests = json.loads(app.guest_details_json or "[]")
    except Exception:
        guests = []

    has_paid = any(p.status == "DEMO SUCCESS" for p in app.payments)

    return {
        "has_draft": True,
        "app_id": app.app_id,
        "current_step": app.current_step or 1,
        "status": app.status,
        "department_id": app.department_id,
        "department_name": dept.name if dept else "",
        "faculty": dept.faculty if dept else "",
        "degree_level": app.degree_level,
        "roll_number": app.roll_number,
        "admission_session": app.admission_session,
        "mobile": app.mobile,
        "email": app.email,
        "full_name": app.full_name,
        "father_name": app.father_name or "",
        "mother_name": app.mother_name or "",
        "date_of_birth": app.date_of_birth or "",
        "gender": app.gender or "Male",
        "present_address": app.present_address or "",
        "permanent_address": app.permanent_address or "",
        "registration_number": app.registration_number or "",
        "gown_size": app.gown_size or "L",
        "original_certificate_held": app.original_certificate_held or False,
        "degrees": degrees,
        "photo_url": app.photo_url or "",
        "guest_count": app.guest_count or 0,
        "guests": guests,
        "has_paid": has_paid
    }
