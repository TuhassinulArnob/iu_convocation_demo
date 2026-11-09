"""
Comprehensive End-to-End Workflow & Verification Script for IU Convocation 2027 Portal.
Tests:
1. Photo upload validation (invalid mime, oversized >2MB, valid upload)
2. Student registration Step 1 -> Update draft with photo -> Submit (Status: PENDING_REVIEW)
3. Payment initiation BLOCKED before admin approval (403 Forbidden)
4. Admin login with manual credentials
5. Admin review actions: filter, detail fetch, Approve Application
6. Payment initiation ALLOWED after approval
7. Simulated bKash payment execution
8. Post-payment status check (DEMO SUCCESS) & Convocation card retrieval
"""

import sys
import io
import requests

# Set stdout to UTF-8 or use plain text markers
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://127.0.0.1:8000/api"

def run_tests():
    print("=" * 60)
    print("Starting E2E Workflow Verification on IU Convocation 2027")
    print("=" * 60)

    # 1. Register a fresh new candidate
    import random
    roll = f"181{random.randint(2000, 9999)}"
    email = f"graduate_{roll}@test.iu.ac.bd"
    mobile = f"017{random.randint(10000000, 99999999)}"
    password = "StrongPassword@2027"

    print("\n[Step 1] Creating new graduate candidate account...")
    reg_res = requests.post(f"{BASE_URL}/auth/register-step1", json={
        "department_id": 1,
        "degree_level": "Honours",
        "roll_number": roll,
        "admission_session": "2018-19",
        "mobile": mobile,
        "email": email,
        "full_name": "Md. Test Candidate",
        "password": password,
        "confirm_password": password
    })
    assert reg_res.status_code == 200, f"Register failed: {reg_res.text}"
    candidate_data = reg_res.json()
    token = candidate_data["access_token"]
    app_id = candidate_data["app_id"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"✓ Candidate registered: {candidate_data['student_name']} (App ID: {app_id})")

    # 2. Test Photo Upload Edge Cases
    print("\n[Step 2] Testing Photo Upload Validation...")
    # 2a. Invalid format (e.g. text file or gif)
    fake_txt = io.BytesIO(b"not an image")
    bad_upload = requests.post(
        f"{BASE_URL}/upload/photo",
        headers=headers,
        files={"file": ("test.txt", fake_txt, "text/plain")}
    )
    assert bad_upload.status_code in (400, 422), f"Expected 400 for text file, got {bad_upload.status_code}"
    print(f"✓ Plain text upload rejected with status {bad_upload.status_code}: {bad_upload.json().get('detail')}")

    # 2b. Oversized file (> 2MB)
    huge_bytes = io.BytesIO(b"x" * (2 * 1024 * 1024 + 100))
    huge_upload = requests.post(
        f"{BASE_URL}/upload/photo",
        headers=headers,
        files={"file": ("huge.jpg", huge_bytes, "image/jpeg")}
    )
    assert huge_upload.status_code in (400, 413), f"Expected 400 or 413 for oversized file, got {huge_upload.status_code}"
    print(f"✓ Oversized file (>2MB) rejected with status {huge_upload.status_code}: {huge_upload.json().get('detail')}")

    # 2c. Valid 50KB JPEG upload
    # minimal 1x1 JPEG bytes
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
    valid_upload = requests.post(
        f"{BASE_URL}/upload/photo",
        headers=headers,
        files={"file": ("passport_photo.jpg", io.BytesIO(valid_jpeg), "image/jpeg")}
    )
    assert valid_upload.status_code == 200, f"Valid photo upload failed: {valid_upload.text}"
    photo_res = valid_upload.json()
    assert photo_res["status"] == "success"
    assert "photo_url" in photo_res
    photo_url = photo_res["photo_url"]
    print(f"✓ Valid photo uploaded successfully: {photo_url}")

    # 3. Update application and Submit
    print("\n[Step 3] Submitting application...")
    update_res = requests.put(
        f"{BASE_URL}/applications/my",
        headers=headers,
        json={
            "full_name": "Md. Test Candidate",
            "father_name": "Father Name",
            "mother_name": "Mother Name",
            "gown_size": "XL",
            "guest_count": 1,
            "guest_details": [{"name": "Guest 1", "relation": "Father", "age": 55, "under_five": False}],
            "photo_url": photo_url,
            "original_certificate_held": False,
            "current_step": 8
        }
    )
    assert update_res.status_code == 200

    sub_res = requests.post(f"{BASE_URL}/applications/my/submit", headers=headers)
    assert sub_res.status_code == 200, f"Submit failed: {sub_res.text}"
    print(f"✓ Application submitted. Status: {sub_res.json()['status']}")

    # 4. Verify candidate dashboard state
    my_app = requests.get(f"{BASE_URL}/applications/my", headers=headers).json()
    assert my_app["status"] in ("PENDING_REVIEW", "Under Review")
    assert my_app["is_approved"] is False
    assert my_app["can_pay"] is False
    assert my_app["payment_status"] == "NOT_AVAILABLE"
    print(f"✓ Student dashboard verified: is_approved={my_app['is_approved']}, can_pay={my_app['can_pay']}, payment_status={my_app['payment_status']}")

    # 5. Verify Payment Initiation is strictly BLOCKED (403 Forbidden)
    print("\n[Step 4] Testing payment security (Payment initiation before approval)...")
    blocked_pay = requests.post(
        f"{BASE_URL}/payments/initiate",
        headers=headers,
        json={"payment_method": "bKash"}
    )
    assert blocked_pay.status_code == 403, f"Expected 403 Forbidden, got {blocked_pay.status_code}: {blocked_pay.text}"
    print(f"✓ Payment correctly blocked with 403 Forbidden: {blocked_pay.json()['detail']}")

    # 6. Admin Login
    print("\n[Step 5] Admin Login & Review...")
    admin_login = requests.post(f"{BASE_URL}/auth/login", json={
        "identifier": "admin@convocation.iu.ac.bd",
        "password": "AdminIU@2027"
    })
    assert admin_login.status_code == 200, f"Admin login failed: {admin_login.text}"
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("✓ Admin successfully authenticated")

    # 7. Admin filters and views application
    filtered = requests.get(f"{BASE_URL}/admin/applications?status=Pending Review", headers=admin_headers).json()
    found = any(a["app_id"] == app_id for a in filtered["items"])
    assert found, f"App ID {app_id} not found in Pending Review filter"
    print(f"✓ App {app_id} located in Admin 'Pending Review' filter")

    # 8. Admin approves application
    print("\n[Step 6] Admin Approves Application...")
    approve_res = requests.put(
        f"{BASE_URL}/admin/applications/{app_id}/status",
        headers=admin_headers,
        json={"new_status": "APPROVED", "review_note": "Verified by Department Convocation Committee."}
    )
    assert approve_res.status_code == 200, f"Approve failed: {approve_res.text}"
    approved_json = approve_res.json()
    print(f"✓ Application approved in database: {approved_json.get('new_status') or approved_json.get('status')}")

    # 9. Verify candidate dashboard is now UNLOCKED for payment
    print("\n[Step 7] Checking student status after approval...")
    approved_app = requests.get(f"{BASE_URL}/applications/my", headers=headers).json()
    assert approved_app["is_approved"] is True
    assert approved_app["can_pay"] is True
    assert approved_app["payment_status"] == "PAYMENT_DUE"
    print(f"✓ Student Dashboard unlocked! is_approved={approved_app['is_approved']}, can_pay={approved_app['can_pay']}, payment_status={approved_app['payment_status']}")

    # 10. Student initiates payment
    print("\n[Step 8] Student initiates bKash payment...")
    init_res = requests.post(
        f"{BASE_URL}/payments/initiate",
        headers=headers,
        json={"payment_method": "bKash"}
    )
    assert init_res.status_code == 200, f"Payment initiate failed: {init_res.text}"
    pay_data = init_res.json()
    ref_id = pay_data["reference_id"]
    print(f"✓ Payment initialized: Reference {ref_id}, Amount {pay_data['formatted_amount']}")

    # 11. Student simulates payment success
    print("\n[Step 9] Simulating payment success...")
    sim_res = requests.post(
        f"{BASE_URL}/payments/simulate",
        headers=headers,
        json={"reference_id": ref_id, "action": "SUCCESS"}
    )
    assert sim_res.status_code == 200, f"Simulate failed: {sim_res.text}"
    assert sim_res.json()["status"] == "DEMO SUCCESS"
    print(f"✓ Payment simulation complete: {sim_res.json()['message']}")

    # 12. Student Dashboard Post-Payment
    print("\n[Step 10] Verifying post-payment status & Convocation Card access...")
    final_app = requests.get(f"{BASE_URL}/applications/my", headers=headers).json()
    assert final_app["has_paid"] is True
    assert final_app["payment_status"] == "DEMO SUCCESS"
    print(f"✓ Application final state: has_paid={final_app['has_paid']}, payment_status={final_app['payment_status']}")

    card_res = requests.get(f"{BASE_URL}/applications/my/card", headers=headers)
    assert card_res.status_code == 200, f"Convocation card locked or failed: {card_res.text}"
    card = card_res.json()
    assert card["app_id"] == app_id
    assert card["student_name"] == "Md. Test Candidate"
    print(f"✓ Convocation card unlocked and generated: Pass ID {card['app_id']} for {card['student_name']}")

    print("\n" + "=" * 60)
    print("ALL 12 WORKFLOW & VERIFICATION STEPS PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
