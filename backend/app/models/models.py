from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True) # Exact supplied ID (1 to 41)
    name = Column(String(255), nullable=False)
    faculty = Column(String(255), nullable=False)

    applications = relationship("Application", back_populates="department")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=True)
    mobile = Column(String(50), unique=True, index=True, nullable=True)
    roll_number = Column(String(50), unique=True, index=True, nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="student") # "student" or "admin"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)

    application = relationship("Application", back_populates="user", uselist=False)

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    app_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. IU27-DEMO-000101
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Personal Information
    full_name = Column(String(255), nullable=False)
    father_name = Column(String(255), nullable=True)
    mother_name = Column(String(255), nullable=True)
    date_of_birth = Column(String(50), nullable=True)
    gender = Column(String(20), nullable=True)
    mobile = Column(String(50), nullable=False)
    email = Column(String(255), nullable=False)
    present_address = Column(Text, nullable=True)
    permanent_address = Column(Text, nullable=True)

    # Academic info
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    degree_level = Column(String(100), nullable=False) # Honours, Masters, M.Phil, PhD, Masters (Professional/Evening)
    registration_category = Column(String(50), default="Regular") # "Regular" or "Evening"
    admission_session = Column(String(50), nullable=False)
    roll_number = Column(String(50), nullable=False)
    registration_number = Column(String(50), nullable=True)

    # Multi-degree json: [{"degree_type": "Honours", "department": "...", "session": "...", "exam_year": "...", "roll_number": "...", "has_certificate": true}]
    degrees_json = Column(Text, default="[]")
    original_certificate_held = Column(Boolean, default=False)

    # Gown & Guest Info
    gown_size = Column(String(20), default="L")
    guest_count = Column(Integer, default=0) # 0 to 3
    guest_details_json = Column(Text, default="[]") # [{"name": "...", "relation": "...", "age": 25, "under_five": false}]

    # Photograph
    photo_url = Column(String(500), nullable=True)

    # Application Status
    # Possible: "Account Created", "Draft", "Form Incomplete", "Submitted", "Awaiting Payment", "Payment Simulated", "Under Review", "Approved (Demo)", "Rejected (Demo)", "Correction Required"
    status = Column(String(50), default="Account Created")
    current_step = Column(Integer, default=1) # 1 to 8
    review_note = Column(Text, nullable=True)

    # Correction workflow fields
    correction_instructions = Column(Text, nullable=True)
    correction_categories = Column(Text, default="[]") # JSON list of string categories
    correction_requested_at = Column(DateTime, nullable=True)
    resubmitted_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="application")
    department = relationship("Department", back_populates="applications")
    fee_breakdown = relationship("FeeBreakdown", back_populates="application", uselist=False, cascade="all, delete-orphan")
    payments = relationship("PaymentSimulation", back_populates="application", cascade="all, delete-orphan")
    status_history = relationship("ApplicationStatusHistory", back_populates="application", cascade="all, delete-orphan")
    revisions = relationship("ApplicationRevision", back_populates="application", cascade="all, delete-orphan")
    convocation_cards = relationship("ConvocationCard", back_populates="application", cascade="all, delete-orphan")

class FeeBreakdown(Base):
    __tablename__ = "fee_breakdowns"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), unique=True, nullable=False)
    registration_category = Column(String(50), default="Regular")
    registration_fee = Column(Float, default=4500.0)
    certificate_fee = Column(Float, default=0.0)
    guest_fee = Column(Float, default=0.0)
    chargeable_guests = Column(Integer, default=0)
    service_charge = Column(Float, default=32.50)
    total_payable = Column(Float, default=4532.50)
    calculated_at = Column(DateTime, default=utc_now)

    application = relationship("Application", back_populates="fee_breakdown")

class PaymentSimulation(Base):
    __tablename__ = "payment_simulations"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    reference_id = Column(String(100), unique=True, index=True, nullable=False) # e.g. DEMO-IU-2027-104928
    payment_method = Column(String(50), nullable=False) # "bKash" or "Rocket"
    amount = Column(Float, nullable=False)
    status = Column(String(50), default="NOT PAID") # "NOT PAID", "DEMO SUCCESS", "CANCELLED"
    transaction_type = Column(String(100), default="DEMONSTRATION ONLY")
    simulated_at = Column(DateTime, default=utc_now)

    application = relationship("Application", back_populates="payments")

class ApplicationStatusHistory(Base):
    __tablename__ = "application_status_history"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    previous_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    admin_identifier = Column(String(100), default="System")
    review_note = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=utc_now)

    application = relationship("Application", back_populates="status_history")

class Notice(Base):
    __tablename__ = "notices"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    category = Column(String(100), default="General") # Registration, Eligibility, Schedule, Payment
    description = Column(Text, nullable=False)
    date = Column(String(50), nullable=False) # "09 Nov 2026"
    is_published = Column(Boolean, default=True)
    is_new = Column(Boolean, default=False)
    pdf_link = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=utc_now)

class ApplicationRevision(Base):
    __tablename__ = "application_revisions"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False, index=True)
    revision_number = Column(Integer, default=1)
    snapshot_json = Column(Text, nullable=False)
    changed_by = Column(String(100), default="applicant")
    change_type = Column(String(50), default="UPDATE") # INITIAL_SUBMISSION, CORRECTION_REQUEST, RESUBMISSION, ADMIN_APPROVAL, ADMIN_REOPEN
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    application = relationship("Application", back_populates="revisions")

class ConvocationCard(Base):
    __tablename__ = "convocation_cards"

    id = Column(Integer, primary_key=True, index=True)
    card_id = Column(String(100), unique=True, index=True, nullable=False) # e.g. IU27-CARD-000101-V1
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False, index=True)
    verification_token = Column(String(128), unique=True, index=True, nullable=False)
    digital_signature = Column(String(255), nullable=False)
    status = Column(String(50), default="VALID") # VALID, REVOKED, SUSPENDED
    version = Column(Integer, default=1)
    issued_at = Column(DateTime, default=utc_now)
    revoked_at = Column(DateTime, nullable=True)
    revocation_reason = Column(Text, nullable=True)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    application = relationship("Application", back_populates="convocation_cards")
