import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import verify_card_signature

client = TestClient(app)

def test_full_correction_and_signed_card_workflow():
    # 1. Login as Admin
    admin_login = client.post("/api/auth/login", json={
        "identifier": "admin@convocation.iu.ac.bd",
        "password": "AdminIU@2027"
    })
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Register a new student
    import time
    unique_suffix = str(int(time.time()))[-6:]
    roll_num = f"20{unique_suffix}"
    email = f"student_{unique_suffix}@gmail.com"
    mobile = f"017{unique_suffix}12"

    reg_res = client.post("/api/auth/register-step1", json={
        "department_id": 10, # CSE
        "degree_level": "Honours",
        "roll_number": roll_num,
        "admission_session": "2019-20",
        "mobile": mobile,
        "email": email,
        "full_name": "Test Candidate",
        "password": "TestPassword@2027",
        "confirm_password": "TestPassword@2027"
    })
    assert reg_res.status_code == 200
    student_token = reg_res.json()["access_token"]
    app_id = reg_res.json()["app_id"]
    student_headers = {"Authorization": f"Bearer {student_token}"}

    # 3. Complete draft details with photo
    upd_res = client.put("/api/applications/my", json={
        "photo_url": "/uploads/test_photo.jpg",
        "present_address": "Kushtia Campus",
        "permanent_address": "Dhaka, Bangladesh",
        "gown_size": "XL",
        "guest_count": 1,
        "guest_details": [{"name": "Guest 1", "relation": "Father", "age": 55, "under_five": False}]
    }, headers=student_headers)
    assert upd_res.status_code == 200

    # 4. Submit application -> Under Review
    sub_res = client.post("/api/applications/my/submit", headers=student_headers)
    assert sub_res.status_code == 200
    assert sub_res.json()["status"] == "PENDING_REVIEW"

    # 5. Verify editing is BLOCKED while Under Review
    edit_blocked = client.put("/api/applications/my", json={
        "full_name": "Tampered Name"
    }, headers=student_headers)
    assert edit_blocked.status_code == 403
    assert "editing is locked" in edit_blocked.json()["detail"].lower()

    # 6. Admin requests correction with specific instructions and categories
    corr_req = client.put(f"/api/admin/applications/{app_id}/status", json={
        "new_status": "CORRECTION_REQUIRED",
        "review_note": "Please update passport photo and fix gown size",
        "correction_instructions": "Your passport photo is blurry. Please upload a clear photo with white background and confirm your gown size.",
        "correction_categories": ["Passport Photo", "Name / Personal Information"]
    }, headers=admin_headers)
    assert corr_req.status_code == 200
    assert corr_req.json()["new_status"] == "CORRECTION_REQUIRED"

    # 7. Student checks dashboard -> status is CORRECTION_REQUIRED, can_edit is True
    my_app = client.get("/api/applications/my", headers=student_headers)
    assert my_app.status_code == 200
    app_data = my_app.json()
    assert app_data["can_edit"] is True
    assert app_data["is_correction_required"] is True
    assert "blurry" in app_data["correction_instructions"]
    assert "Passport Photo" in app_data["correction_categories"]

    # 8. Student edits application (updates photo and gown size)
    edit_success = client.put("/api/applications/my", json={
        "photo_url": "/uploads/crisp_white_bg_photo.jpg",
        "gown_size": "L"
    }, headers=student_headers)
    assert edit_success.status_code == 200

    # 9. Student resubmits application
    resub_res = client.post("/api/applications/my/resubmit", headers=student_headers)
    assert resub_res.status_code == 200
    assert resub_res.json()["status"] == "PENDING_REVIEW"

    # 10. Verify editing is locked again after resubmission
    edit_locked_again = client.put("/api/applications/my", json={
        "full_name": "Another Edit"
    }, headers=student_headers)
    assert edit_locked_again.status_code == 403

    # 11. Admin verifies and APPROVES the application
    approve_res = client.put(f"/api/admin/applications/{app_id}/status", json={
        "new_status": "APPROVED",
        "review_note": "Resubmitted documents verified. Application approved."
    }, headers=admin_headers)
    assert approve_res.status_code == 200
    assert approve_res.json()["new_status"] == "APPROVED"

    # 12. Simulate demonstration payment to unlock convocation card
    pay_init = client.post("/api/payments/initiate", json={"payment_method": "bKash"}, headers=student_headers)
    assert pay_init.status_code == 200
    ref_id = pay_init.json()["reference_id"]
    pay_sim = client.post("/api/payments/simulate", json={"reference_id": ref_id, "action": "SUCCESS"}, headers=student_headers)
    assert pay_sim.status_code == 200

    # 13. Student retrieves digitally signed convocation card
    card_res = client.get("/api/applications/my/card", headers=student_headers)
    assert card_res.status_code == 200
    card = card_res.json()
    assert card["status"] == "VALID"
    assert card["card_id"].startswith("IU27-CARD-")
    assert card["version"] == 1
    assert "IU27-EDUSIG-" in card["digital_signature"]
    assert card["digital_signature_indicator"] == "Digitally Verified — Educational Demonstration"
    verification_token = card["verification_token"]
    card_id = card["card_id"]

    # 14. Public QR verification endpoint validates valid card
    verify_valid = client.get(f"/api/verify/{card_id}?token={verification_token}")
    assert verify_valid.status_code == 200
    ver_data = verify_valid.json()
    assert ver_data["valid"] is True
    assert ver_data["status"] == "VALID"
    assert ver_data["status_label"] == "Valid Demo Card"
    assert ver_data["digital_signature_verification"] == "Valid"
    assert ver_data["card_id"] == card_id
    # Privacy check: sensitive fields MUST NOT be present in public response
    assert not hasattr(ver_data, "mobile")
    assert not hasattr(ver_data, "email")
    assert not hasattr(ver_data, "present_address")

    # 15. Verify tampered token returns INVALID
    verify_tampered = client.get(f"/api/verify/{card_id}?token=TAMPERED_FAKE_TOKEN")
    assert verify_tampered.status_code == 200
    tampered_data = verify_tampered.json()
    assert tampered_data["valid"] is False
    assert tampered_data["status"] == "INVALID"
    assert "Cryptographic verification failed" in tampered_data["verification_message"]

    # 16. Admin REOPENS approved application by requesting correction
    reopen_res = client.put(f"/api/admin/applications/{app_id}/status", json={
        "new_status": "CORRECTION_REQUIRED",
        "review_note": "Reopened: Department requires registration number confirmation.",
        "correction_instructions": "Please update your university registration number as per registrar archives.",
        "correction_categories": ["Department / Degree Information"]
    }, headers=admin_headers)
    assert reopen_res.status_code == 200

    # 17. Verify previously issued card is now immediately REVOKED!
    verify_revoked = client.get(f"/api/verify/{card_id}?token={verification_token}")
    assert verify_revoked.status_code == 200
    rev_data = verify_revoked.json()
    assert rev_data["valid"] is False
    assert rev_data["status"] == "REVOKED"
    assert rev_data["status_label"] == "Invalid / Revoked"
    assert "reopened for correction" in rev_data["revocation_reason"].lower()

    # 18. Student resubmits after reopening
    client.put("/api/applications/my", json={"registration_number": f"{roll_num}-IU-REG"}, headers=student_headers)
    client.post("/api/applications/my/resubmit", headers=student_headers)

    # 19. Admin re-approves
    client.put(f"/api/admin/applications/{app_id}/status", json={
        "new_status": "APPROVED",
        "review_note": "Registration confirmed. Re-approved."
    }, headers=admin_headers)

    # 20. Student gets reissued card -> Version 2 with brand new Card ID and Token!
    reissued_card = client.get("/api/applications/my/card", headers=student_headers).json()
    assert reissued_card["version"] == 2
    assert reissued_card["card_id"].endswith("-V2")
    assert reissued_card["status"] == "VALID"
    assert reissued_card["verification_token"] != verification_token

    # 21. Reissued card verifies as valid, while old card remains revoked
    reissued_verify = client.get(f"/api/verify/{reissued_card['card_id']}?token={reissued_card['verification_token']}")
    assert reissued_verify.json()["valid"] is True
    assert reissued_verify.json()["status"] == "VALID"

    # 22. Download Card PDF
    pdf_res = client.get("/api/applications/my/card/pdf", headers=student_headers)
    assert pdf_res.status_code == 200
    assert "application/pdf" in pdf_res.headers["content-type"]
    assert pdf_res.content.startswith(b"%PDF-")
    assert len(pdf_res.content) > 1000
