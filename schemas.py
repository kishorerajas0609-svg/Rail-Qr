from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Any
from datetime import datetime

# --- Auth Schemas ---
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str
    phone: Optional[str] = None
    role: Optional[str] = "passenger" # 'passenger', 'staff', 'admin'
    badge_number: Optional[str] = None
    designation: Optional[str] = None
    assigned_train_id: Optional[int] = None
    assigned_station_id: Optional[int] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfile(BaseModel):
    id: int
    email: str
    full_name: str
    phone: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime
    badge_number: Optional[str] = None
    designation: Optional[str] = None
    assigned_train_id: Optional[int] = None
    assigned_station_id: Optional[int] = None

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile

# --- Station Schemas ---
class StationBase(BaseModel):
    code: str
    name: str
    city: str
    state: str
    zone: str = "NR"
    platform_count: int = 10

class StationOut(StationBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Schedule & Coach Schemas ---
class ScheduleOut(BaseModel):
    id: int
    station_id: int
    station_code: str
    station_name: str
    city: str
    stop_number: int
    arrival_time: str
    departure_time: str
    day_offset: int
    platform_number: int
    distance_from_source_km: float

    class Config:
        from_attributes = True

class CoachOut(BaseModel):
    id: int
    coach_code: str
    coach_type: str
    total_berths: int

    class Config:
        from_attributes = True

# --- Train Schemas ---
class TrainSearchRequest(BaseModel):
    source_code: str
    destination_code: str
    journey_date: str # YYYY-MM-DD
    travel_class: Optional[str] = None
    quota: Optional[str] = "General"

class TrainAvailability(BaseModel):
    coach_type: str
    class_name: str
    available_seats: int
    total_capacity: int
    fare: float
    status_label: str # "AVAILABLE 42", "RAC 04", "WL 12"

class TrainSearchResult(BaseModel):
    id: int
    train_number: str
    name: str
    train_type: str
    source_code: str
    source_name: str
    destination_code: str
    destination_name: str
    departure_time: str
    arrival_time: str
    duration_str: str
    total_distance_km: float
    runs_on_days: str
    classes: List[TrainAvailability]

class TrainDetailOut(BaseModel):
    id: int
    train_number: str
    name: str
    train_type: str
    source_station: StationOut
    destination_station: StationOut
    total_distance_km: float
    runs_on_days: str
    schedules: List[ScheduleOut]
    coaches: List[CoachOut]

# --- Reservation & Passenger Booking Schemas ---
class PassengerInput(BaseModel):
    full_name: str
    age: int
    gender: str
    berth_preference: Optional[str] = "No Preference"
    id_proof_type: Optional[str] = "Aadhaar"
    id_proof_number: Optional[str] = None

class BookingRequest(BaseModel):
    train_id: int
    source_station_id: int
    destination_station_id: int
    journey_date: str # YYYY-MM-DD
    travel_class: str
    quota: Optional[str] = "General"
    passengers: List[PassengerInput]
    payment_method: Optional[str] = "UPI / Simulated Gateway"

class PassengerOut(BaseModel):
    id: int
    full_name: str
    age: int
    gender: str
    berth_preference: Optional[str]
    allotted_coach: Optional[str]
    allotted_berth_number: Optional[int]
    allotted_berth_type: Optional[str]
    current_status: str
    id_proof_type: Optional[str]
    id_proof_number: Optional[str]

    class Config:
        from_attributes = True

class TicketOut(BaseModel):
    id: int
    ticket_number: str
    passenger: PassengerOut
    security_signature: str
    issued_at: datetime
    is_cancelled: bool
    qr_token_string: Optional[str] = None
    qr_code_base64: Optional[str] = None
    boarding_status: Optional[str] = "NOT_VERIFIED"
    verification_count: int = 0
    last_verified_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ReservationDetailOut(BaseModel):
    id: int
    pnr: str
    user_id: int
    train_id: int
    train_number: str
    train_name: str
    train_type: str
    source_station_code: str
    source_station_name: str
    destination_station_code: str
    destination_station_name: str
    departure_time: str
    arrival_time: str
    journey_date: str
    travel_class: str
    quota: str
    total_fare: float
    booking_status: str
    payment_status: str
    booked_at: datetime
    cancelled_at: Optional[datetime] = None
    passengers: List[PassengerOut]
    tickets: List[TicketOut]

# --- QR Verification Schemas ---
class QRVerificationRequest(BaseModel):
    token_string: Optional[str] = None
    pnr: Optional[str] = None
    station_id: Optional[int] = None
    train_id: Optional[int] = None
    device_info: Optional[str] = "Smart Rail Scanner v2.1"
    notes: Optional[str] = None

class VerificationHistoryItem(BaseModel):
    id: int
    scan_timestamp: datetime
    scan_result: str
    staff_name: Optional[str] = "Staff Inspector"
    staff_badge: Optional[str] = None
    station_name: Optional[str] = None
    device_info: Optional[str] = None
    notes: Optional[str] = None

class QRVerificationResponse(BaseModel):
    is_valid: bool
    verification_status: str # 'VALID', 'DUPLICATE_SCAN', 'EXPIRED', 'CANCELLED', 'WRONG_TRAIN', 'INVALID_TOKEN'
    message: str
    scan_count: int
    first_scanned_at: Optional[datetime] = None
    current_scan_time: datetime
    ticket: Optional[TicketOut] = None
    reservation: Optional[ReservationDetailOut] = None
    passenger: Optional[PassengerOut] = None
    boarding_status: str
    verification_history: List[VerificationHistoryItem] = []
    suspicious_flag: bool = False
    warning_reason: Optional[str] = None

# --- Boarding Status Update Schemas ---
class BoardingStatusUpdate(BaseModel):
    ticket_id: int
    boarding_status: str # 'NOT_VERIFIED', 'VERIFIED', 'BOARDED', 'NO_SHOW'
    station_id: Optional[int] = None
    notes: Optional[str] = None

# --- Admin Analytics Schemas ---
class AdminAnalyticsSummary(BaseModel):
    total_passengers: int
    total_reservations: int
    active_journeys: int
    verified_tickets: int
    unverified_tickets: int
    cancelled_tickets: int
    total_revenue: float
    total_scans_today: int
    duplicate_scan_alerts: int
    suspicious_attempts: int

class VerificationAuditLogOut(BaseModel):
    id: int
    scan_timestamp: datetime
    scan_result: str
    pnr: Optional[str] = None
    ticket_number: Optional[str] = None
    passenger_name: Optional[str] = None
    train_number: Optional[str] = None
    staff_badge: Optional[str] = None
    station_code: Optional[str] = None
    device_info: Optional[str] = None
    scan_count: int
    notes: Optional[str] = None

# --- Admin Management Schemas ---
class StaffUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    designation: Optional[str] = None
    badge_number: Optional[str] = None
    assigned_train_id: Optional[int] = None
    assigned_station_id: Optional[int] = None
    is_active: Optional[bool] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class PassengerManageOut(BaseModel):
    id: int
    email: str
    full_name: str
    phone: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime
    total_bookings: int
    confirmed_tickets: int
    cancelled_tickets: int
    total_spent: float

    class Config:
        from_attributes = True

class DatabaseOverviewOut(BaseModel):
    database_file: str
    size_kb: float
    total_records: int
    table_counts: dict
    engine: str = "SQLite 3"
    status: str = "Healthy"
    checked_at: datetime

