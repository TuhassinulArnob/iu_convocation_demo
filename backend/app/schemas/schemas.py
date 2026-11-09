from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List, Any
from datetime import datetime

# --- Department ---
class DepartmentBase(BaseModel):
    id: int
    name: str
    faculty: str

    model_config = ConfigDict(from_attributes=True)

# --- User & Auth ---
class Step1RegisterRequest(BaseModel):
    department_id: int = Field(..., gt=0, description="Department ID must be a positive integer")
    degree_level: str # Honours, Masters, M.Phil, PhD, Masters (Professional/Evening)
    roll_number: str
    admission_session: str
    mobile: str
    email: EmailStr
    full_name: Optional[str] = None
    password: str = Field(..., min_length=8, description="User-defined password with minimum 8 characters")
    confirm_password: Optional[str] = None

class LoginRequest(BaseModel):
    identifier: str # mobile, email or roll_number
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    app_id: Optional[str] = None
    student_name: Optional[str] = None

# --- Fee Calculation ---
class DegreeItem(BaseModel):
    degree_type: str
    department: Optional[str] = None
    session: Optional[str] = None
    exam_year: Optional[str] = None
    roll_number: Optional[str] = None
    has_certificate: bool = False

class GuestItem(BaseModel):
    name: str
    relation: Optional[str] = ""
    age: Optional[int] = None
    under_five: bool = False

class FeeCalculationRequest(BaseModel):
    registration_category: str = "Regular"
    primary_degree_level: Optional[str] = None
    original_certificate_held: bool = False
    degrees: Optional[List[DegreeItem]] = []
    guests: Optional[List[GuestItem]] = []

class FeeCalculationResponse(BaseModel):
    registration_category: str
    registration_fee: float
    certificate_fee: float
    certificate_breakdown: List[Any] = []
    original_certificate_held: bool
    guest_fee: float
    chargeable_guests: int
    exempt_guests: int
    guest_breakdown: List[Any] = []
    service_charge: float
    total_payable: float
    formatted_total: str

# --- Application ---
class ApplicationUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    father_name: Optional[str] = None
    mother_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[EmailStr] = None
    present_address: Optional[str] = None
    permanent_address: Optional[str] = None
    department_id: Optional[int] = None
    degree_level: Optional[str] = None
    registration_category: Optional[str] = None
    admission_session: Optional[str] = None
    roll_number: Optional[str] = None
    registration_number: Optional[str] = None
    gown_size: Optional[str] = None
    guest_count: Optional[int] = None
    guest_details: Optional[List[GuestItem]] = None
    original_certificate_held: Optional[bool] = None
    degrees: Optional[List[DegreeItem]] = None
    photo_url: Optional[str] = None
    status: Optional[str] = None
    current_step: Optional[int] = None

class ApplicationSummaryResponse(BaseModel):
    id: int
    app_id: str
    student_name: str
    department_name: str
    degree_level: str
    roll_number: str
    session: str
    status: str
    payment_status: str
    total_amount: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PublicTrackResponse(BaseModel):
    app_id: str
    status: str
    submission_date: str
    department: str
    degree_level: str
    payment_status: str
    last_status_update: str
    timeline: List[dict]
    disclaimer: str = "This is a public tracking feature for an unofficial demonstration project. It does not represent official university registration or verification."

# --- Payment ---
class PaymentInitiateRequest(BaseModel):
    payment_method: str # "bKash" or "Rocket"

class PaymentSimulateRequest(BaseModel):
    reference_id: str
    action: str = "SUCCESS" # "SUCCESS" or "CANCEL"

# --- Admin ---
class AdminStatusChangeRequest(BaseModel):
    new_status: str # "Under Review", "Approved (Demo)", "Rejected (Demo)", "Correction Required", "Submitted"
    review_note: Optional[str] = None

# --- Notice ---
class NoticeCreate(BaseModel):
    title: str
    category: str = "General"
    description: str
    date: str
    is_published: bool = True
    is_new: bool = False
    pdf_link: Optional[str] = None

class NoticeUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None
    is_published: Optional[bool] = None
    is_new: Optional[bool] = None
    pdf_link: Optional[str] = None
