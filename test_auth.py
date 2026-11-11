import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_login_passenger_success():
    response = client.post("/api/auth/login", json={
        "email": "kishore@example.com",
        "password": "Passenger@123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "kishore@example.com"
    assert data["user"]["role"] == "passenger"

def test_login_staff_success():
    response = client.post("/api/auth/login", json={
        "email": "tte@smartrail.in",
        "password": "Staff@123"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["role"] == "staff"
    assert data["user"]["badge_number"] == "TTE-NDLS-901"

def test_login_invalid_password():
    response = client.post("/api/auth/login", json={
        "email": "kishore@example.com",
        "password": "WrongPassword!99"
    })
    assert response.status_code == 401

def test_register_new_passenger():
    import uuid
    email = f"user_{uuid.uuid4().hex[:6]}@testrail.com"
    response = client.post("/api/auth/register", json={
        "email": email,
        "password": "Password@123",
        "full_name": "Test Passenger",
        "phone": "9998887776",
        "role": "passenger"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["email"] == email
    assert data["user"]["role"] == "passenger"
