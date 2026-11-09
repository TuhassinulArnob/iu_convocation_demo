from typing import List, Dict, Any, Optional
from app.core.config import settings

def calculate_fees(
    registration_category: str = "Regular",
    selected_degrees: Optional[List[Dict[str, Any]]] = None,
    original_certificate_held: bool = False,
    guests: Optional[List[Dict[str, Any]]] = None,
    primary_degree_level: Optional[str] = None
) -> Dict[str, Any]:
    """
    Calculates convocation registration fees based on Islamic University Bangladesh guidelines:
    - Registration fee: Regular ৳4,500 / Evening ৳5,500
    - Certificate fees (only if original certificate NOT already held):
        - Bachelor / Honours: ৳500
        - Masters: ৳700
        - M.Phil: ৳1,500
        - PhD: ৳2,000
        - Masters (Professional/Evening): ৳1,000
    - Guest fees: ৳1,000 per guest (max 3, children under 5 exempt/free)
    - Service charge: ৳32.50
    """
    selected_degrees = selected_degrees or []
    guests = guests or []
    
    # 1. Base Registration Fee
    is_evening = (
        registration_category.lower() == "evening" 
        or (primary_degree_level and "evening" in primary_degree_level.lower())
    )
    reg_fee = settings.REGISTRATION_FEE_EVENING if is_evening else settings.REGISTRATION_FEE_REGULAR

    # 2. Certificate Fees
    cert_fee_total = 0.0
    cert_breakdown = []

    if not original_certificate_held:
        # Check if degrees were passed as list
        if selected_degrees:
            for deg in selected_degrees:
                # If degree has has_certificate=True, skip
                if deg.get("has_certificate", False):
                    continue
                deg_type = deg.get("degree_type", "")
                fee = settings.CERTIFICATE_FEES.get(deg_type, 0.0)
                if fee > 0:
                    cert_fee_total += fee
                    cert_breakdown.append({
                        "degree_type": deg_type,
                        "fee": fee
                    })
        elif primary_degree_level:
            # Fallback to primary degree level
            fee = settings.CERTIFICATE_FEES.get(primary_degree_level, 0.0)
            if fee > 0:
                cert_fee_total += fee
                cert_breakdown.append({
                    "degree_type": primary_degree_level,
                    "fee": fee
                })

    # 3. Guest Fees (Max 3, under 5 are free)
    chargeable_guests = 0
    exempt_guests = 0
    guest_breakdown = []

    # Enforce maximum 3 guests
    considered_guests = guests[:settings.MAX_GUESTS]

    for g in considered_guests:
        # check age or under_five flag
        age = g.get("age", None)
        under_five = g.get("under_five", False)
        if age is not None:
            try:
                if int(age) < 5:
                    under_five = True
            except (ValueError, TypeError):
                pass
        
        if under_five:
            exempt_guests += 1
            guest_breakdown.append({
                "name": g.get("name", "Guest"),
                "relation": g.get("relation", ""),
                "age": age,
                "is_exempt": True,
                "fee": 0.0
            })
        else:
            chargeable_guests += 1
            guest_breakdown.append({
                "name": g.get("name", "Guest"),
                "relation": g.get("relation", ""),
                "age": age,
                "is_exempt": False,
                "fee": settings.GUEST_FEE_PER_PERSON
            })

    guest_fee_total = chargeable_guests * settings.GUEST_FEE_PER_PERSON

    # 4. Service charge
    service_charge = settings.SERVICE_CHARGE

    # 5. Total
    total_payable = reg_fee + cert_fee_total + guest_fee_total + service_charge

    return {
        "registration_category": "Evening" if is_evening else "Regular",
        "registration_fee": reg_fee,
        "certificate_fee": cert_fee_total,
        "certificate_breakdown": cert_breakdown,
        "original_certificate_held": original_certificate_held,
        "guest_fee": guest_fee_total,
        "chargeable_guests": chargeable_guests,
        "exempt_guests": exempt_guests,
        "guest_breakdown": guest_breakdown,
        "service_charge": service_charge,
        "total_payable": round(total_payable, 2),
        "formatted_total": f"৳{total_payable:,.2f}"
    }
