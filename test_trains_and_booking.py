import pytest
import datetime
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def get_auth_headers(email="kishore@example.com", password="Passenger@123"):
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_list_stations():
    res = client.get("/api/trains/stations")
    assert res.status_code == 200
    stations = res.json()
    assert len(stations) >= 5
    codes = [s["code"] for s in stations]
    assert "NDLS" in codes
    assert "BPL" in codes

def test_search_trains():
    today_str = datetime.date.today().strftime("%Y-%m-%d")
    res = client.get(f"/api/trains/search?source_code=NDLS&destination_code=BPL&journey_date={today_str}")
    assert res.status_code == 200
    trains = res.json()
    assert len(trains) >= 1
    t = trains[0]
    assert t["train_number"] == "12002"
    assert len(t["classes"]) >= 1

def test_create_booking_and_qr_generation():
    headers = get_auth_headers("kishore@example.com", "Passenger@123")
    today_str = datetime.date.today().strftime("%Y-%m-%d")

    # Get train ID for 12002
    search_res = client.get(f"/api/trains/search?source_code=NDLS&destination_code=BPL&journey_date={today_str}")
    train_id = search_res.json()[0]["id"]

    # Get station IDs
    stations_res = client.get("/api/trains/stations")
    stations = {s["code"]: s["id"] for s in stations_res.json()}

    payload = {
        "train_id": train_id,
        "source_station_id": stations["NDLS"],
        "destination_station_id": stations["BPL"],
        "journey_date": today_str,
        "travel_class": "CC",
        "quota": "General",
        "passengers": [
            {
                "full_name": "Test Passenger 1",
                "age": 30,
                "gender": "Male",
                "berth_preference": "Window",
                "id_proof_type": "Aadhaar",
                "id_proof_number": "1234-5678-9012"
            }
        ],
        "payment_method": "UPI Sim"
    }

    res = client.post("/api/bookings/create", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "pnr" in data
    assert data["booking_status"] == "Confirmed"
    assert len(data["tickets"]) == 1
    assert data["tickets"][0]["qr_code_base64"] is not None
    assert data["tickets"][0]["qr_token_string"].startswith("SRQR-")
