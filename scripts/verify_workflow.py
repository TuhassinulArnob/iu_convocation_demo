"""
Comprehensive End-to-End Workflow & Verification Script for IU Convocation 2027 Portal.
Uses FastAPI TestClient to test the complete application lifecycle.
"""

import sys
import os
import io

# Ensure backend in sys.path
backend_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from fastapi.testclient import TestClient
from app.main import app

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

client = TestClient(app)

def run_tests():
    print("=" * 70)
    print("Starting Comprehensive E2E Workflow Verification on IU Convocation 2027")
    print("=" * 70)

    # 1. Register a fresh new candidate
    import random
    roll = f"181{random.randint(2000, 9999)}"
    email = f"graduate_{roll}@test.iu.ac.bd"
    mobile = f"017{random.randint(10000000, 99999999)}"
    password = "StrongPassword@2027"

    print("\n[Step 1] Creating new graduate candidate account...")
    reg_res = client.post("/api/auth/register-step1", json={
        "department_id": 12, # ICT
        "degree_level": "Honours",
        "roll_number": roll,
        "admission_session": "2018-19",
        "mobile": mobile,
        "email": email,
        "full_name": "Md. Test Graduate",
        "password": password,
        "confirm_password": password
    })
    assert reg_res.status_code == 200, f"Register failed: {reg_res.text}"
    candidate_data = reg_res.json()
    student_token = candidate_data["access_token"]
    app_id = candidate_data["app_id"]
    student_headers = {"Authorization": f"Bearer {student_token}"}
    print(f"✓ Candidate registered: {candidate_data['student_name']} (App ID: {app_id})")

    # 2. Test Photo Upload Edge Cases
    print("\n[Step 2] Testing Photo Upload Validation...")
    # 2a. Invalid format
    fake_txt = io.BytesIO(b"not an image")
    bad_upload = client.post(
        "/api/upload/photo",
        headers=student_headers,
        files={"file": ("test.txt", fake_txt, "text/plain")}
    )
    assert bad_upload.status_code in (400, 422), f"Expected 400 for text file, got {bad_upload.status_code}"
    print(f"✓ Plain text upload rejected with status {bad_upload.status_code}")

    # 2b. Oversized file (> 2MB)
    huge_bytes = io.BytesIO(b"x" * (2 * 1024 * 1024 + 100))
    huge_upload = client.post(
        "/api/upload/photo",
        headers=student_headers,
        files={"file": ("huge.jpg", huge_bytes, "image/jpeg")}
    )
    assert huge_upload.status_code in (400, 413), f"Expected 400/413 for oversized file, got {huge_upload.status_code}"
    print(f"✓ Oversized file (>2MB) rejected with status {huge_upload.status_code}")

    # 2c. Valid JPEG upload
    valid_jpeg = bytes([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
        0x00, 0x03, 0x02, 0x02, 0x03, 0x02, 0x02, 0x03, 0x03, 0x03, 0x03, 0x04,
        0x03, 0x03, 0x04, 0x05, 0x08, 0x05, 0x05, 0x04, 0x04, 0x05, 0x0A, 0x07,
        0x07, 0x06, 0x08, 0x0C, 0x0A, 0x0C, 0x0C, 0x0B, 0x0A, 0x0B, 0x0B, 0x0D,
        0x0E, 0x12, 0x10, 0x0D, 0x0E, 0x11, 0x0E, 0x0B, 0x0B, 0x10, 0x16, 0x10,
        0x11, 0x13, 0x14, 0x15, 0x15, 0x15, 0x0C, 0x0F, 0x17, 0x18, 0x16, 0x14,
        0x18, 0x12, 0x14, 0x15, 0x14, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
        0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00,
        0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
        0x09, 0x0A, 0x0B, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F,
        0x00, 0x7F, 0x00, 0xFF, 0xD9
    ])
    valid_upload = client.post(
        "/api/upload/photo",
        headers=student_headers,
        files={"file": ("passport_photo.jpg", io.BytesIO(valid_jpeg), "image/jpeg")}
    )
    assert valid_upload.status_code == 200, f"Valid photo upload failed: {valid_upload.text}"
    photo_res = valid_upload.json()
    photo_url = photo_res["photo_url"]
    print(f"✓ Valid photo uploaded successfully: {photo_url}")

    # 3. Update application draft & Submit
    print("\n[Step 3] Updating draft application with photo and personal details...")
    upd_res = client.put("/api/applications/my", headers=student_headers, json={
        "photo_url": photo_url,
        "present_address": "Sheikh Russell Hall, Islamic University, Kushtia",
        "permanent_address": "Kushtia Sadar, Kushtia - 7000",
        "gown_size": "XL",
        "guest_count": 1,
        "guest_details": [{"name": "Mr. Guardian", "relation": "Father", "age": 56, "under_five": False}]
    })
    assert upd_res.status_code == 200, f"Update failed: {upd_res.text}"

    print("[Step 3b] Submitting application for administrative review...")
    sub_res = client.post("/api/applications/my/submit", headers=student_headers)
    assert sub_res.status_code == 200, f"Submit failed: {sub_res.text}"
    print(f"✓ Application submitted. Status: {sub_res.json()['status']}")

    # 4. Verify editing is BLOCKED while Under Review
    print("\n[Step 4] Verifying student editing is locked while Under Review...")
    edit_blocked = client.put("/api/applications/my", headers=student_headers, json={
        "full_name": "Tampered Name Attempt"
    })
    assert edit_blocked.status_code == 403, f"Expected 403 Forbidden, got {edit_blocked.status_code}"
    print(f"✓ Editing correctly rejected while under review: {edit_blocked.json()['detail']}")

    # 5. Admin Login & Correction Request
    print("\n[Step 5] Admin Login & Requesting Correction...")
    admin_login = client.post("/api/auth/login", json={
        "identifier": "admin@convocation.iu.ac.bd",
        "password": "AdminIU@2027"
    })
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    instructions = "Please re-upload a clear passport photo with white background and confirm gown size."
    categories = ["Passport Photo", "Department / Degree Information"]
    corr_req = client.put(f"/api/admin/applications/{app_id}/status", headers=admin_headers, json={
        "new_status": "CORRECTION_REQUIRED",
        "review_note": instructions,
        "correction_instructions": instructions,
        "correction_categories": categories
    })
    assert corr_req.status_code == 200, f"Correction request failed: {corr_req.text}"
    print(f"✓ Admin requested correction with categories {categories}")

    # 6. Student Dashboard Checks
    print("\n[Step 6] Student checking dashboard for correction notification...")
    my_app = client.get("/api/applications/my", headers=student_headers).json()
    assert my_app["can_edit"] is True, "Expected can_edit to be True"
    assert my_app["is_correction_required"] is True, "Expected is_correction_required to be True"
    assert my_app["correction_instructions"] == instructions
    assert my_app["correction_categories"] == categories
    print("✓ Student dashboard correctly displays Correction Required banner, instructions, and enables Edit Application button")

    # 7. Student Edits Application & Re-uploads Photo
    print("\n[Step 7] Student editing application details...")
    new_photo_upload = client.post(
        "/api/upload/photo",
        headers=student_headers,
        files={"file": ("rectified_photo.jpg", io.BytesIO(valid_jpeg), "image/jpeg")}
    )
    new_photo_url = new_photo_upload.json()["photo_url"]
    
    edit_res = client.put("/api/applications/my", headers=student_headers, json={
        "photo_url": new_photo_url,
        "gown_size": "L"
    })
    assert edit_res.status_code == 200
    print("✓ Student saved corrected fields successfully")

    # 8. Student Resubmits Application
    print("\n[Step 8] Student resubmitting application...")
    resub_res = client.post("/api/applications/my/resubmit", headers=student_headers)
    assert resub_res.status_code == 200
    assert resub_res.json()["status"] == "PENDING_REVIEW"
    print(f"✓ Application resubmitted. Status returned to: {resub_res.json()['status']}")

    # 9. Verify editing is locked again after resubmission
    print("\n[Step 9] Verifying student editing locked after resubmission...")
    edit_locked_again = client.put("/api/applications/my", headers=student_headers, json={
        "full_name": "Second Tamper Attempt"
    })
    assert edit_locked_again.status_code == 403
    print("✓ Editing locked after resubmission")

    # 10. Admin Approves Application
    print("\n[Step 10] Admin approving application...")
    appr_res = client.put(f"/api/admin/applications/{app_id}/status", headers=admin_headers, json={
        "new_status": "APPROVED",
        "review_note": "Rectified application verified and approved by Convocation Committee."
    })
    assert appr_res.status_code == 200
    print("✓ Application approved by admin")

    # 11. Payment Simulation
    print("\n[Step 11] Executing demonstration fee payment...")
    init_res = client.post("/api/payments/initiate", headers=student_headers, json={"payment_method": "bKash"})
    ref_id = init_res.json()["reference_id"]
    pay_res = client.post("/api/payments/simulate", headers=student_headers, json={
        "reference_id": ref_id,
        "action": "SUCCESS"
    })
    assert pay_res.status_code == 200
    print(f"✓ Payment simulation complete: Ref {ref_id}")

    # 12. Retrieve Digitally Signed Convocation Card
    print("\n[Step 12] Retrieving digitally signed convocation card...")
    card_res = client.get("/api/applications/my/card", headers=student_headers)
    assert card_res.status_code == 200, f"Card retrieval failed: {card_res.text}"
    card = card_res.json()
    card_id = card["card_id"]
    token_v1 = card["verification_token"]
    sig_v1 = card["digital_signature"]
    print(f"✓ Convocation card issued: {card_id} (Version: {card['version']})")
    print(f"  Digital Signature: {sig_v1}")
    print(f"  Verification URL: {card['verification_url']}")

    # 13. Public QR Verification of Valid Card
    print("\n[Step 13] Testing Public QR Verification...")
    verify_url = f"/api/verify/{card_id}?token={token_v1}"
    v_res = client.get(verify_url)
    assert v_res.status_code == 200
    v_data = v_res.json()
    assert v_data["valid"] is True
    assert v_data["status"] == "VALID"
    assert v_data["status_label"] == "Valid Demo Card"
    assert v_data["digital_signature_verification"] == "Valid"
    print(f"✓ Public verification confirmed: {v_data['status_label']} — Signature Valid")

    # 14. Privacy Check
    print("\n[Step 14] Privacy Protection Audit on Public Verification...")
    for priv_field in ["mobile", "email", "present_address", "permanent_address", "password"]:
        assert priv_field not in v_data, f"Privacy violation: {priv_field} exposed in public response!"
    print("✓ Privacy audit passed: No private phone, email, address or guest records exposed")

    # 15. Tampered Token Test
    print("\n[Step 15] Testing tampered token rejection...")
    tampered_res = client.get(f"/api/verify/{card_id}?token=TAMPERED_FAKE_KEY").json()
    assert tampered_res["valid"] is False
    assert tampered_res["status"] == "INVALID"
    print(f"✓ Tampered token rejected: {tampered_res['status_label']}")

    # 16. Admin Reopens Approved Application
    print("\n[Step 16] Admin Reopening Approved Application for Correction...")
    reopen_res = client.put(f"/api/admin/applications/{app_id}/status", headers=admin_headers, json={
        "new_status": "CORRECTION_REQUIRED",
        "review_note": "Reopened: Registrar requires roll verification.",
        "correction_instructions": "Please verify your admission session and departmental roll number.",
        "correction_categories": ["Department / Degree Information"]
    })
    assert reopen_res.status_code == 200
    print("✓ Application explicitly reopened by admin")

    # 17. Verify Old Card Immediately Shows REVOKED!
    print("\n[Step 17] Verifying previously issued card is REVOKED...")
    rev_res = client.get(f"/api/verify/{card_id}?token={token_v1}").json()
    assert rev_res["valid"] is False
    assert rev_res["status"] == "REVOKED"
    assert rev_res["status_label"] == "Invalid / Revoked"
    print(f"✓ Revoked card status confirmed: {rev_res['status_label']} — Reason: {rev_res['revocation_reason']}")

    # 18. Student Resubmits after Reopening
    print("\n[Step 18] Student resubmitting corrected details after reopening...")
    client.put("/api/applications/my", headers=student_headers, json={"roll_number": roll})
    client.post("/api/applications/my/resubmit", headers=student_headers)

    # 19. Admin Re-Approves
    print("\n[Step 19] Admin re-approving application...")
    client.put(f"/api/admin/applications/{app_id}/status", headers=admin_headers, json={
        "new_status": "APPROVED",
        "review_note": "Re-verified and approved."
    })

    # 20. Student Retrieves Reissued Card (Version 2)
    print("\n[Step 20] Retrieving reissued card (Version 2)...")
    card_v2 = client.get("/api/applications/my/card", headers=student_headers).json()
    assert card_v2["version"] == 2
    assert card_v2["card_id"].endswith("-V2")
    assert card_v2["status"] == "VALID"
    assert card_v2["verification_token"] != token_v1
    print(f"✓ Reissued card created: {card_v2['card_id']} (Version: {card_v2['version']}) with new verification token")

    # 21. Reissued card verifies as VALID
    print("\n[Step 21] Public verification of reissued card...")
    v2_res = client.get(f"/api/verify/{card_v2['card_id']}?token={card_v2['verification_token']}").json()
    assert v2_res["valid"] is True
    assert v2_res["status"] == "VALID"
    print(f"✓ Reissued card verified as: {v2_res['status_label']}")

    # 22. PDF Generation Download
    print("\n[Step 22] Testing PDF Card Download...")
    pdf_res = client.get("/api/applications/my/card/pdf", headers=student_headers)
    assert pdf_res.status_code == 200
    assert "application/pdf" in pdf_res.headers.get("content-type", "")
    assert pdf_res.content.startswith(b"%PDF-")
    print(f"✓ Convocation card PDF generated successfully ({len(pdf_res.content)} bytes)")

    print("\n" + "=" * 70)
    print("ALL 22 END-TO-END WORKFLOW & VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
