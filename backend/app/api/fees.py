from fastapi import APIRouter
from app.schemas.schemas import FeeCalculationRequest, FeeCalculationResponse
from app.services.fee_engine import calculate_fees
from app.core.config import settings

router = APIRouter(prefix="/fees", tags=["Fees"])

@router.post("/calculate", response_model=FeeCalculationResponse)
def calculate_fee_endpoint(req: FeeCalculationRequest):
    result = calculate_fees(
        registration_category=req.registration_category,
        selected_degrees=[d.model_dump() for d in req.degrees] if req.degrees else [],
        original_certificate_held=req.original_certificate_held,
        guests=[g.model_dump() for g in req.guests] if req.guests else [],
        primary_degree_level=req.primary_degree_level
    )
    return FeeCalculationResponse(**result)

@router.get("/structure")
def get_fee_structure():
    return {
        "registration_fees": {
            "Regular": settings.REGISTRATION_FEE_REGULAR,
            "Evening": settings.REGISTRATION_FEE_EVENING
        },
        "certificate_fees": settings.CERTIFICATE_FEES,
        "guest_fee_per_person": settings.GUEST_FEE_PER_PERSON,
        "max_guests": settings.MAX_GUESTS,
        "child_under_five_exemption": True,
        "service_charge": settings.SERVICE_CHARGE,
        "disclaimer": "DEMONSTRATION ONLY: Fee rates are displayed to demonstrate online fee calculation logic. No real financial payments are accepted."
    }
