import random
import string
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User, Application, PaymentSimulation, FeeBreakdown, ApplicationStatusHistory
from app.schemas.schemas import PaymentInitiateRequest, PaymentSimulateRequest

router = APIRouter(prefix="/payments", tags=["Payment Simulation"])

def generate_reference_id(method: str) -> str:
    prefix = "BK" if method.lower() == "bkash" else "RC"
    random_str = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"DEMO-IU-2027-{prefix}{random_str}"

@router.post("/initiate")
def initiate_payment(
    req: PaymentInitiateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.user_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application record not found.")

    # 1. Enforce Payment Security: User cannot initiate payment unless application is approved
    is_approved = app.status in ["APPROVED", "Approved", "Approved (Demo)"]
    if not is_approved:
        raise HTTPException(
            status_code=403,
            detail="Payment is locked. Your application is currently under administrative review and must be approved before fee payment can be initiated."
        )

    method = req.payment_method.strip()
    if method not in ["bKash", "Rocket"]:
        raise HTTPException(status_code=400, detail="Invalid payment method. Choose 'bKash' or 'Rocket'.")

    fee = app.fee_breakdown
    amount = fee.total_payable if fee else 4532.50

    # Create a new simulation record with status NOT PAID
    ref_id = generate_reference_id(method)
    payment = PaymentSimulation(
        application_id=app.id,
        reference_id=ref_id,
        payment_method=method,
        amount=amount,
        status="NOT PAID",
        transaction_type="DEMONSTRATION ONLY"
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    qr_asset_path = "/assets/payment/BKash.jpg" if method == "bKash" else "/assets/payment/Rocket.jpg"

    return {
        "payment_id": payment.id,
        "reference_id": payment.reference_id,
        "application_id": app.app_id,
        "payment_method": method,
        "amount": amount,
        "formatted_amount": f"৳{amount:,.2f}",
        "status": payment.status,
        "transaction_type": payment.transaction_type,
        "qr_image": qr_asset_path,
        "warning_english": "DO NOT PAY — FOR TESTING / DEMONSTRATION PURPOSES ONLY. NO REAL PAYMENT GATEWAY IS CONNECTED.",
        "warning_bangla": "এই QR কোড শুধুমাত্র ওয়েবসাইটের Demo প্রদর্শনের জন্য। অনুগ্রহ করে কোনো টাকা পাঠাবেন না।"
    }

@router.post("/simulate")
def simulate_payment_action(
    req: PaymentSimulateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.user_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")

    payment = db.query(PaymentSimulation).filter(
        PaymentSimulation.reference_id == req.reference_id,
        PaymentSimulation.application_id == app.id
    ).first()

    if not payment:
        raise HTTPException(status_code=404, detail="Payment reference record not found.")

    if req.action.upper() == "SUCCESS":
        payment.status = "DEMO SUCCESS"
        payment.simulated_at = datetime.now(timezone.utc)
        
        # Application remains approved with fee recorded
        prev_status = app.status
        new_status = "APPROVED" if prev_status in ["APPROVED", "Approved", "Approved (Demo)"] else prev_status
        app.status = new_status

        history = ApplicationStatusHistory(
            application_id=app.id,
            previous_status=prev_status,
            new_status=new_status,
            admin_identifier="Demo Payment Gateway",
            review_note=f"Simulated payment success via {payment.payment_method}. Ref: {payment.reference_id}. Convocation card entry unlocked."
        )
        db.add(history)
        db.commit()

        return {
            "status": "DEMO SUCCESS",
            "message": "DEMO PAYMENT SUCCESSFUL — NO REAL MONEY WAS TRANSFERRED.",
            "reference_id": payment.reference_id,
            "application_id": app.app_id,
            "amount": payment.amount,
            "simulated_at": payment.simulated_at,
            "application_status": app.status
        }
    else:
        payment.status = "CANCELLED"
        db.commit()
        return {
            "status": "CANCELLED",
            "message": "Payment simulation was cancelled by user.",
            "reference_id": payment.reference_id
        }

@router.get("/history")
def get_payment_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.user_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")

    payments = db.query(PaymentSimulation).filter(
        PaymentSimulation.application_id == app.id
    ).order_by(PaymentSimulation.id.desc()).all()

    return [
        {
            "id": p.id,
            "reference_id": p.reference_id,
            "payment_method": p.payment_method,
            "amount": p.amount,
            "formatted_amount": f"৳{p.amount:,.2f}",
            "status": p.status,
            "transaction_type": p.transaction_type,
            "simulated_at": p.simulated_at
        }
        for p in payments
    ]

@router.get("/receipt/{reference_id}")
def get_payment_receipt(
    reference_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    payment = db.query(PaymentSimulation).filter(
        PaymentSimulation.reference_id == reference_id
    ).first()

    if not payment:
        raise HTTPException(status_code=404, detail="Receipt reference not found.")

    app = payment.application
    if app.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized access to this receipt.")

    fee = app.fee_breakdown
    return {
        "institution": "Islamic University Bangladesh",
        "event": "5th Convocation 2027",
        "receipt_type": "DEMONSTRATION PAYMENT RECEIPT",
        "watermark": "DEMO ONLY — NOT A VALID PAYMENT RECEIPT.",
        "reference_id": payment.reference_id,
        "application_id": app.app_id,
        "student_name": app.full_name,
        "roll_number": app.roll_number,
        "payment_method": payment.payment_method,
        "amount": payment.amount,
        "formatted_amount": f"৳{payment.amount:,.2f}",
        "status": payment.status,
        "transaction_type": payment.transaction_type,
        "timestamp": payment.simulated_at,
        "fee_breakdown": {
            "registration_fee": fee.registration_fee if fee else 4500.0,
            "certificate_fee": fee.certificate_fee if fee else 0.0,
            "guest_fee": fee.guest_fee if fee else 0.0,
            "service_charge": fee.service_charge if fee else 32.50,
            "total_payable": fee.total_payable if fee else 4532.50
        },
        "disclaimer": "This is a demonstration receipt for testing and educational purposes. No real money was transferred or received by Islamic University Bangladesh."
    }
