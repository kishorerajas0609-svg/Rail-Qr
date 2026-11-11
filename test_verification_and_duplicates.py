import pytest
import datetime
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def get_staff_headers():
    res = client.post("/api/auth/login", json={"email": "tte@smartrail.in", "password": "Staff@123"})
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_qr_verification_valid_and_duplicate_flow():
    staff_headers = get_staff_headers()
    
    # 1. Fetch pre-seeded active reservation for Kishore Raj (PNR: 842-9182301)
    res = client.get("/api/bookings/pnr/842-9182301")
    assert res.status_code == 200
    res_data = res.json()
    token_string = res_data["tickets"][0]["qr_token_string"]
    assert token_string is not None

    # 2. First Scan: Should be VALID
    scan_1 = client.post("/api/verify/scan", json={
        "token_string": token_string,
        "device_info": "Test TTE Handheld #1"
    }, headers=staff_headers)

    assert scan_1.status_code == 200
    data_1 = scan_1.json()
    assert data_1["is_valid"] is True
    assert data_1["verification_status"] in ["VALID", "DUPLICATE_SCAN"]
    assert data_1["passenger"]["full_name"] == "Kishore Raj"
    assert data_1["ticket"]["passenger"]["allotted_coach"] == "C2"
    assert data_1["ticket"]["passenger"]["allotted_berth_number"] == 36

    # 3. Second Scan (Duplicate): Should detect DUPLICATE_SCAN
    scan_2 = client.post("/api/verify/scan", json={
        "token_string": token_string,
        "device_info": "Test TTE Handheld #2"
    }, headers=staff_headers)

    assert scan_2.status_code == 200
    data_2 = scan_2.json()
    assert data_2["is_valid"] is True
    assert data_2["verification_status"] == "DUPLICATE_SCAN"
    assert data_2["scan_count"] >= 2
    assert len(data_2["verification_history"]) >= 2
    assert "previously verified" in data_2["message"].lower() or "re-verification" in data_2["message"].lower()

def test_invalid_qr_scan():
    staff_headers = get_staff_headers()
    res = client.post("/api/verify/scan", json={
        "token_string": "SRQR-FAKE-INVALID-TOKEN-999999",
        "device_info": "Test Terminal"
    }, headers=staff_headers)

    assert res.status_code == 200
    data = res.json()
    assert data["is_valid"] is False
    assert data["verification_status"] == "INVALID_TOKEN"
    assert data["suspicious_flag"] is True

def test_cancelled_ticket_scan():
    staff_headers = get_staff_headers()
    # PNR 312-8924018 was pre-seeded as Cancelled
    res_info = client.get("/api/bookings/pnr/312-8924018")
    assert res_info.status_code == 200
    token_string = res_info.json()["tickets"][0]["qr_token_string"]

    res = client.post("/api/verify/scan", json={
        "token_string": token_string,
        "device_info": "Test Terminal"
    }, headers=staff_headers)

    assert res.status_code == 200
    data = res.json()
    assert data["is_valid"] is False
    assert data["verification_status"] == "CANCELLED"

def test_boarding_status_update():
    staff_headers = get_staff_headers()
    res_info = client.get("/api/bookings/pnr/842-9182301")
    ticket_id = res_info.json()["tickets"][0]["id"]

    res = client.post("/api/verify/update-boarding-status", json={
        "ticket_id": ticket_id,
        "boarding_status": "BOARDED",
        "notes": "Passenger seated in Coach C2"
    }, headers=staff_headers)

    assert res.status_code == 200
    assert res.json()["new_status"] == "BOARDED"
