import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def get_admin_headers():
    res = client.post("/api/auth/login", json={
        "email": "admin@smartrail.in",
        "password": "Admin@123"
    })
    assert res.status_code == 200
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def get_passenger_headers():
    res = client.post("/api/auth/login", json={
        "email": "kishore@example.com",
        "password": "Passenger@123"
    })
    assert res.status_code == 200
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_login_admin_success():
    res = client.post("/api/auth/login", json={
        "email": "admin@smartrail.in",
        "password": "Admin@123"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["email"] == "admin@smartrail.in"
    assert data["user"]["role"] == "admin"

def test_admin_forbidden_for_passenger():
    passenger_headers = get_passenger_headers()
    res = client.get("/api/admin/passengers", headers=passenger_headers)
    assert res.status_code == 403

def test_admin_list_passengers():
    admin_headers = get_admin_headers()
    res = client.get("/api/admin/passengers", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) > 0
    # verify schema fields
    p = data[0]
    assert "email" in p
    assert "total_bookings" in p
    assert "total_spent" in p
    assert "confirmed_tickets" in p

def test_admin_database_overview():
    admin_headers = get_admin_headers()
    res = client.get("/api/admin/database/overview", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["database_file"] == "smart_rail.db"
    assert "table_counts" in data
    assert "users" in data["table_counts"]
    assert "reservations" in data["table_counts"]
    assert "trains" in data["table_counts"]
    assert data["engine"] == "SQLite 3 (ACID Relational)"

def test_admin_database_table_inspect():
    admin_headers = get_admin_headers()
    res = client.get("/api/admin/database/table/users?limit=10", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["table_name"] == "users"
    assert "columns" in data
    assert "email" in data["columns"]
    assert "rows" in data
    assert len(data["rows"]) > 0

def test_admin_all_reservations():
    admin_headers = get_admin_headers()
    res = client.get("/api/admin/all-reservations?limit=10", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert "reservations" in data
    assert "total" in data

def test_admin_staff_management():
    admin_headers = get_admin_headers()
    # List staff
    res = client.get("/api/admin/staff-list", headers=admin_headers)
    assert res.status_code == 200
    staff_members = res.json()
    assert len(staff_members) > 0

    tte_staff = next((s for s in staff_members if s["email"] == "tte@smartrail.in"), None)
    assert tte_staff is not None

    # Update staff details
    update_res = client.put(f"/api/admin/staff/{tte_staff['id']}", json={
        "full_name": "Rajesh Kumar (Senior TTE)",
        "badge_number": "TTE-NDLS-901",
        "designation": "Senior Travelling Ticket Examiner"
    }, headers=admin_headers)
    assert update_res.status_code == 200
    assert update_res.json()["success"] is True
