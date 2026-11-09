import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_status():
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "online"
    assert "Islamic University" in data["project"]

def test_public_config():
    res = client.get("/api/config")
    assert res.status_code == 200
    data = res.json()
    assert "2027" in data["ceremony_datetime"]
    assert "Islamic University Bangladesh" in data["institution"]

def test_departments_list():
    res = client.get("/api/departments")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 36
    # Verify exact ID 12 is Information and Communication Technology
    ict = next((d for d in data["departments"] if d["id"] == 12), None)
    assert ict is not None
    assert ict["name"] == "Information and Communication Technology"

def test_notices_list():
    res = client.get("/api/notices")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1

def test_login_student():
    # Login with seeded demo student
    res = client.post("/api/auth/login", json={
        "identifier": "01811860339",
        "password": "StudentIU@2027"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["role"] == "student"
    assert data["app_id"] == "IU27-DEMO-000101"

def test_login_admin():
    # Login with seeded admin
    res = client.post("/api/auth/login", json={
        "identifier": "admin@convocation.iu.ac.bd",
        "password": "AdminIU@2027"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["role"] == "admin"

def test_public_application_tracking():
    # Public tracking endpoint for IU27-DEMO-000101
    res = client.get("/api/applications/track/IU27-DEMO-000101")
    assert res.status_code == 200
    data = res.json()
    assert data["app_id"] == "IU27-DEMO-000101"
    assert data["payment_status"] == "DEMO SUCCESS"
    assert "timeline" in data
    # Privacy verification: sensitive fields must not be present
    assert "password" not in data
    assert "mobile" not in data
    assert "email" not in data
    assert "father_name" not in data

def test_public_application_tracking_not_found():
    res = client.get("/api/applications/track/NON-EXISTENT-ID")
    assert res.status_code == 404

def test_full_payment_simulation_flow():
    # Login as student 1
    login_res = client.post("/api/auth/login", json={
        "identifier": "01811860339",
        "password": "StudentIU@2027"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Initiate payment via bKash
    init_res = client.post("/api/payments/initiate", json={"payment_method": "bKash"}, headers=headers)
    assert init_res.status_code == 200
    pay_data = init_res.json()
    assert pay_data["payment_method"] == "bKash"
    assert "DEMO-IU-2027-BK" in pay_data["reference_id"]
    ref_id = pay_data["reference_id"]

    # Simulate success
    sim_res = client.post("/api/payments/simulate", json={"reference_id": ref_id, "action": "SUCCESS"}, headers=headers)
    assert sim_res.status_code == 200
    sim_data = sim_res.json()
    assert sim_data["status"] == "DEMO SUCCESS"
    assert "NO REAL MONEY WAS TRANSFERRED" in sim_data["message"]

    # Check payment history
    hist_res = client.get("/api/payments/history", headers=headers)
    assert hist_res.status_code == 200
    assert any(p["reference_id"] == ref_id and p["status"] == "DEMO SUCCESS" for p in hist_res.json())

def test_admin_dashboard_and_status_transition():
    # Login as admin
    login_res = client.post("/api/auth/login", json={
        "identifier": "admin@convocation.iu.ac.bd",
        "password": "AdminIU@2027"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Get stats
    stats_res = client.get("/api/admin/stats", headers=headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total_applications"] >= 2
    assert "department_distribution" in stats

    # Get applications list
    apps_res = client.get("/api/admin/applications", headers=headers)
    assert apps_res.status_code == 200
    apps = apps_res.json()
    assert len(apps["items"]) >= 2

    # Update application status
    status_update_res = client.put(
        "/api/admin/applications/IU27-DEMO-000102/status",
        json={"new_status": "Approved (Demo)", "review_note": "Verified during automated testing."},
        headers=headers
    )
    assert status_update_res.status_code == 200
    assert status_update_res.json()["new_status"] == "Approved (Demo)"

    # Verify public tracking picked up the change
    track_res = client.get("/api/applications/track/IU27-DEMO-000102")
    assert track_res.status_code == 200
    assert track_res.json()["status"] == "Approved (Demo)"

def test_register_step1_validation_and_draft():
    import time
    uid = str(int(time.time() * 1000))[-6:]

    # 1. Reject invalid department
    res_bad_dept = client.post("/api/auth/register-step1", json={
        "department_id": 0,
        "degree_level": "Honours",
        "roll_number": f"991{uid}",
        "admission_session": "2018-19",
        "mobile": f"0171{uid}1",
        "email": f"test1.{uid}@example.com",
        "password": "Password@123",
        "confirm_password": "Password@123"
    })
    assert res_bad_dept.status_code == 422 or res_bad_dept.status_code == 400

    # 2. Reject password mismatch
    res_bad_pwd = client.post("/api/auth/register-step1", json={
        "department_id": 12,
        "degree_level": "Honours",
        "roll_number": f"992{uid}",
        "admission_session": "2018-19",
        "mobile": f"0171{uid}2",
        "email": f"test2.{uid}@example.com",
        "password": "Password@123",
        "confirm_password": "DifferentPassword@456"
    })
    assert res_bad_pwd.status_code == 400

    # 3. Successful Step 1 registration
    res_ok = client.post("/api/auth/register-step1", json={
        "department_id": 12,
        "degree_level": "Honours",
        "roll_number": f"993{uid}",
        "admission_session": "2018-19",
        "mobile": f"0171{uid}3",
        "email": f"test3.{uid}@example.com",
        "password": "Password@123",
        "confirm_password": "Password@123",
        "full_name": "Test Candidate Three"
    })
    assert res_ok.status_code == 200
    token = res_ok.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 4. Fetch draft
    draft_res = client.get("/api/auth/draft", headers=headers)
    assert draft_res.status_code == 200
    draft = draft_res.json()
    assert draft["has_draft"] is True
    assert draft["roll_number"] == f"993{uid}"
    assert draft["current_step"] == 2

    # 5. Update draft step
    update_res = client.put("/api/applications/my", json={
        "current_step": 3,
        "father_name": "Father Name Test"
    }, headers=headers)
    assert update_res.status_code == 200

    my_app = client.get("/api/applications/my", headers=headers).json()
    assert my_app["current_step"] == 3
    assert my_app["father_name"] == "Father Name Test"

