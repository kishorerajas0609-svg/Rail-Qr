import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Enum
)
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    role = Column(String(50), default="passenger", nullable=False) # 'passenger', 'staff', 'admin'
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    staff_profile = relationship("StaffProfile", back_populates="user", uselist=False)
    reservations = relationship("Reservation", back_populates="user")
    verifications_performed = relationship("VerificationRecord", back_populates="staff")


class StaffProfile(Base):
    __tablename__ = "staff_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    badge_number = Column(String(100), unique=True, index=True, nullable=False)
    designation = Column(String(100), default="TTE") # 'TTE', 'Gate_Inspector', 'Station_Master', 'Admin'
    assigned_train_id = Column(Integer, ForeignKey("trains.id"), nullable=True)
    assigned_station_id = Column(Integer, ForeignKey("stations.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="staff_profile")
    assigned_train = relationship("Train")
    assigned_station = relationship("Station")


class Station(Base):
    __tablename__ = "stations"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, index=True, nullable=False) # e.g. NDLS, CSMT
    name = Column(String(255), nullable=False) # e.g. New Delhi
    city = Column(String(255), nullable=False)
    state = Column(String(255), nullable=False)
    zone = Column(String(50), default="NR") # e.g. NR, CR, WR, SR
    platform_count = Column(Integer, default=10)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    source_trains = relationship("Train", foreign_keys="Train.source_station_id", back_populates="source_station")
    destination_trains = relationship("Train", foreign_keys="Train.destination_station_id", back_populates="destination_station")
    schedules = relationship("Schedule", back_populates="station")


class Train(Base):
    __tablename__ = "trains"

    id = Column(Integer, primary_key=True, index=True)
    train_number = Column(String(50), unique=True, index=True, nullable=False) # e.g. 12002
    name = Column(String(255), nullable=False) # e.g. Bhopal Shatabdi Express
    train_type = Column(String(100), default="Superfast") # 'Vande Bharat', 'Rajdhani', 'Shatabdi', 'Superfast', 'Express', 'Tejas'
    source_station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    destination_station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    total_distance_km = Column(Float, default=500.0)
    runs_on_days = Column(String(50), default="Mon,Tue,Wed,Thu,Fri,Sat,Sun")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    source_station = relationship("Station", foreign_keys=[source_station_id], back_populates="source_trains")
    destination_station = relationship("Station", foreign_keys=[destination_station_id], back_populates="destination_trains")
    schedules = relationship("Schedule", back_populates="train", cascade="all, delete-orphan", order_by="Schedule.stop_number")
    coaches = relationship("Coach", back_populates="train", cascade="all, delete-orphan")
    reservations = relationship("Reservation", back_populates="train")


class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    train_id = Column(Integer, ForeignKey("trains.id", ondelete="CASCADE"), nullable=False)
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    stop_number = Column(Integer, nullable=False)
    arrival_time = Column(String(20), nullable=False) # e.g. "06:00"
    departure_time = Column(String(20), nullable=False) # e.g. "06:15"
    day_offset = Column(Integer, default=0) # 0 = same day, 1 = next day
    platform_number = Column(Integer, default=1)
    distance_from_source_km = Column(Float, default=0.0)

    # Relationships
    train = relationship("Train", back_populates="schedules")
    station = relationship("Station", back_populates="schedules")


class Coach(Base):
    __tablename__ = "coaches"

    id = Column(Integer, primary_key=True, index=True)
    train_id = Column(Integer, ForeignKey("trains.id", ondelete="CASCADE"), nullable=False)
    coach_code = Column(String(20), nullable=False) # e.g. C1, B1, A1, S1
    coach_type = Column(String(20), nullable=False) # 'EC', 'CC', '1A', '2A', '3A', 'SL'
    total_berths = Column(Integer, default=72)

    # Relationships
    train = relationship("Train", back_populates="coaches")
    berths = relationship("Berth", back_populates="coach", cascade="all, delete-orphan")


class Berth(Base):
    __tablename__ = "berths"

    id = Column(Integer, primary_key=True, index=True)
    coach_id = Column(Integer, ForeignKey("coaches.id", ondelete="CASCADE"), nullable=False)
    berth_number = Column(Integer, nullable=False) # e.g. 1, 2, 3...
    berth_type = Column(String(50), nullable=False) # 'Lower', 'Middle', 'Upper', 'Side Lower', 'Side Upper', 'Window', 'Aisle'
    is_active = Column(Boolean, default=True)

    # Relationships
    coach = relationship("Coach", back_populates="berths")


class FareRule(Base):
    __tablename__ = "fare_rules"

    id = Column(Integer, primary_key=True, index=True)
    coach_type = Column(String(20), unique=True, nullable=False) # '1A', '2A', '3A', 'CC', 'EC', 'SL'
    base_fare_per_km = Column(Float, nullable=False)
    reservation_charge = Column(Float, default=40.0)
    superfast_charge = Column(Float, default=45.0)
    gst_percent = Column(Float, default=5.0)


class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True, index=True)
    pnr = Column(String(50), unique=True, index=True, nullable=False) # e.g. 842-9182301
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    train_id = Column(Integer, ForeignKey("trains.id"), nullable=False)
    source_station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    destination_station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    journey_date = Column(String(30), nullable=False) # YYYY-MM-DD
    travel_class = Column(String(20), nullable=False) # '1A', '2A', '3A', 'CC', 'EC', 'SL'
    quota = Column(String(50), default="General") # 'General', 'Tatkal', 'Ladies', 'Senior Citizen'
    total_fare = Column(Float, nullable=False)
    booking_status = Column(String(50), default="Confirmed") # 'Confirmed', 'RAC', 'Waiting_List', 'Cancelled'
    payment_status = Column(String(50), default="Paid")
    payment_id = Column(String(100), nullable=True)
    booked_at = Column(DateTime, default=datetime.datetime.utcnow)
    cancelled_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="reservations")
    train = relationship("Train", back_populates="reservations")
    source_station = relationship("Station", foreign_keys=[source_station_id])
    destination_station = relationship("Station", foreign_keys=[destination_station_id])
    passengers = relationship("Passenger", back_populates="reservation", cascade="all, delete-orphan")
    tickets = relationship("Ticket", back_populates="reservation", cascade="all, delete-orphan")
    qr_tokens = relationship("QRToken", back_populates="reservation", cascade="all, delete-orphan")


class Passenger(Base):
    __tablename__ = "passengers"

    id = Column(Integer, primary_key=True, index=True)
    reservation_id = Column(Integer, ForeignKey("reservations.id", ondelete="CASCADE"), nullable=False)
    full_name = Column(String(255), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=False) # 'Male', 'Female', 'Other'
    berth_preference = Column(String(50), default="No Preference")
    allotted_coach = Column(String(20), nullable=True) # e.g. B2, C1
    allotted_berth_number = Column(Integer, nullable=True) # e.g. 36
    allotted_berth_type = Column(String(50), nullable=True) # 'Lower', 'Upper', etc.
    current_status = Column(String(50), default="CNF") # 'CNF', 'RAC', 'WL', 'CAN'
    id_proof_type = Column(String(50), default="Aadhaar")
    id_proof_number = Column(String(100), nullable=True)

    # Relationships
    reservation = relationship("Reservation", back_populates="passengers")
    ticket = relationship("Ticket", back_populates="passenger", uselist=False, cascade="all, delete-orphan")
    boarding_records = relationship("BoardingRecord", back_populates="passenger")


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    reservation_id = Column(Integer, ForeignKey("reservations.id", ondelete="CASCADE"), nullable=False)
    passenger_id = Column(Integer, ForeignKey("passengers.id", ondelete="CASCADE"), unique=True, nullable=False)
    ticket_number = Column(String(100), unique=True, index=True, nullable=False) # e.g. TKT-842918-01
    security_signature = Column(String(255), nullable=False) # HMAC signature
    issued_at = Column(DateTime, default=datetime.datetime.utcnow)
    is_cancelled = Column(Boolean, default=False)

    # Relationships
    reservation = relationship("Reservation", back_populates="tickets")
    passenger = relationship("Passenger", back_populates="ticket")
    qr_token = relationship("QRToken", back_populates="ticket", uselist=False, cascade="all, delete-orphan")
    verification_records = relationship("VerificationRecord", back_populates="ticket")
    boarding_records = relationship("BoardingRecord", back_populates="ticket")


class QRToken(Base):
    __tablename__ = "qr_tokens"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id", ondelete="CASCADE"), unique=True, nullable=False)
    reservation_id = Column(Integer, ForeignKey("reservations.id", ondelete="CASCADE"), nullable=False)
    token_string = Column(String(255), unique=True, index=True, nullable=False) # Verifiable high-entropy token / UUID
    token_hash = Column(String(255), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_revoked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    ticket = relationship("Ticket", back_populates="qr_token")
    reservation = relationship("Reservation", back_populates="qr_tokens")
    verifications = relationship("VerificationRecord", back_populates="qr_token")


class VerificationRecord(Base):
    __tablename__ = "verification_records"

    id = Column(Integer, primary_key=True, index=True)
    qr_token_id = Column(Integer, ForeignKey("qr_tokens.id", ondelete="SET NULL"), nullable=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id", ondelete="SET NULL"), nullable=True)
    staff_id = Column(Integer, ForeignKey("users.id"), nullable=True) # User who performed scan
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=True)
    train_id = Column(Integer, ForeignKey("trains.id"), nullable=True)
    scan_timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    scan_result = Column(String(50), nullable=False) # 'VALID', 'DUPLICATE_SCAN', 'EXPIRED', 'CANCELLED', 'INVALID_TOKEN', 'WRONG_TRAIN'
    device_info = Column(String(255), default="Handheld TTE Scanner Terminal v2.1")
    scan_count_at_time = Column(Integer, default=1)
    notes = Column(Text, nullable=True)

    # Relationships
    qr_token = relationship("QRToken", back_populates="verifications")
    ticket = relationship("Ticket", back_populates="verification_records")
    staff = relationship("User", back_populates="verifications_performed")
    station = relationship("Station")
    train = relationship("Train")


class BoardingRecord(Base):
    __tablename__ = "boarding_records"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False)
    passenger_id = Column(Integer, ForeignKey("passengers.id", ondelete="CASCADE"), nullable=False)
    reservation_id = Column(Integer, ForeignKey("reservations.id", ondelete="CASCADE"), nullable=False)
    verified_by_staff_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    boarding_status = Column(String(50), default="NOT_VERIFIED") # 'NOT_VERIFIED', 'VERIFIED', 'BOARDED', 'NO_SHOW'
    boarded_at_station_id = Column(Integer, ForeignKey("stations.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    notes = Column(Text, nullable=True)

    # Relationships
    ticket = relationship("Ticket", back_populates="boarding_records")
    passenger = relationship("Passenger", back_populates="boarding_records")
    reservation = relationship("Reservation")
    verified_by_staff = relationship("User")
    boarded_at_station = relationship("Station")
