import random
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user
from ..qr_service import (
    generate_security_signature,
    generate_qr_token_string,
    hash_token,
    create_qr_code_base64,
    build_qr_payload
)

router = APIRouter(prefix="/bookings", tags=["Passenger Bookings & Digital Tickets"])

def generate_pnr():
    """Generates 10-digit Indian Railways standard formatted PNR, e.g. 842-9182301"""
    first_part = random.randint(100, 999)
    second_part = random.randint(1000000, 9999999)
    return f"{first_part}-{second_part}"

def allocate_seats(db: Session, train_id: int, travel_class: str, journey_date: str, passengers_count: int, preferences: list):
    """
    Intelligent seat allocation algorithm:
    Finds available coach matching travel_class, determines next available berth numbers,
    and assigns matching berth types (Lower, Middle, Upper, Window, Aisle).
    """
    coaches = db.query(models.Coach).filter(
        models.Coach.train_id == train_id,
        models.Coach.coach_type == travel_class
    ).all()

    if not coaches:
        # Fallback to any coach if specific class coach not configured
        coaches = db.query(models.Coach).filter(models.Coach.train_id == train_id).all()

    # Find already occupied berths on this train & date
    occupied_berths = db.query(models.Passenger.allotted_coach, models.Passenger.allotted_berth_number).join(models.Reservation).filter(
        models.Reservation.train_id == train_id,
        models.Reservation.journey_date == journey_date,
        models.Reservation.booking_status != "Cancelled"
    ).all()
    occupied_set = set(occupied_berths)

    allocations = []
    berth_types_map = {
        "EC": ["Window", "Aisle", "Aisle", "Window"],
        "CC": ["Window", "Middle", "Aisle", "Aisle", "Middle", "Window"],
        "3A": ["Lower", "Middle", "Upper", "Lower", "Middle", "Upper", "Side Lower", "Side Upper"],
        "2A": ["Lower", "Upper", "Lower", "Upper", "Side Lower", "Side Upper"],
        "1A": ["Cabin Lower", "Cabin Upper", "Coupe Lower", "Coupe Upper"],
        "SL": ["Lower", "Middle", "Upper", "Lower", "Middle", "Upper", "Side Lower", "Side Upper"],
    }
    b_types = berth_types_map.get(travel_class, ["Lower", "Middle", "Upper", "Window", "Aisle"])

    for p_idx in range(passengers_count):
        pref = preferences[p_idx] if p_idx < len(preferences) else "No Preference"
        assigned = False

        for coach in coaches:
            for b_num in range(1, coach.total_berths + 1):
                if (coach.coach_code, b_num) not in occupied_set:
                    b_type = b_types[(b_num - 1) % len(b_types)]
                    
                    # If preference matches or no preference, grab it
                    if pref == "No Preference" or pref.lower() in b_type.lower() or not assigned:
                        allocations.append({
                            "coach": coach.coach_code,
                            "berth_number": b_num,
                            "berth_type": b_type,
                            "status": "CNF"
                        })
                        occupied_set.add((coach.coach_code, b_num))
                        assigned = True
                        break
            if assigned:
                break

        if not assigned:
            # RAC or WL fallback
            allocations.append({
                "coach": coaches[0].coach_code if coaches else "WL",
                "berth_number": None,
                "berth_type": None,
                "status": "RAC" if len(occupied_set) < 150 else "WL"
            })

    return allocations

@router.post("/create", response_model=schemas.ReservationDetailOut)
def create_booking(
    payload: schemas.BookingRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Creates a full railway reservation, assigns coach & berths,
    generates individual verifiable tickets with cryptographic QR tokens.
    """
    train = db.query(models.Train).filter(models.Train.id == payload.train_id).first()
    if not train:
        raise HTTPException(status_code=404, detail="Train not found")

    src_station = db.query(models.Station).filter(models.Station.id == payload.source_station_id).first()
    dest_station = db.query(models.Station).filter(models.Station.id == payload.destination_station_id).first()
    if not src_station or not dest_station:
        raise HTTPException(status_code=404, detail="Station not found")

    if not payload.passengers or len(payload.passengers) == 0:
        raise HTTPException(status_code=400, detail="At least one passenger is required")

    # Fare calculation
    fare_rule = db.query(models.FareRule).filter(models.FareRule.coach_type == payload.travel_class).first()
    distance = train.total_distance_km
    if fare_rule:
        base = distance * fare_rule.base_fare_per_km
        single_fare = round(base + fare_rule.reservation_charge + fare_rule.superfast_charge + (base * fare_rule.gst_percent / 100.0), 2)
    else:
        single_fare = round(distance * 1.5 + 50.0, 2)

    if payload.quota == "Tatkal":
        single_fare = round(single_fare * 1.3, 2)

    total_fare = round(single_fare * len(payload.passengers), 2)

    # Generate unique PNR
    pnr = generate_pnr()
    while db.query(models.Reservation).filter(models.Reservation.pnr == pnr).first():
        pnr = generate_pnr()

    # Create Reservation
    reservation = models.Reservation(
        pnr=pnr,
        user_id=current_user.id,
        train_id=train.id,
        source_station_id=src_station.id,
        destination_station_id=dest_station.id,
        journey_date=payload.journey_date,
        travel_class=payload.travel_class,
        quota=payload.quota or "General",
        total_fare=total_fare,
        booking_status="Confirmed",
        payment_status="Paid",
        payment_id=f"PAY_SIM_{pnr.replace('-', '')}"
    )
    db.add(reservation)
    db.flush()

    # Allocate seats
    seat_preferences = [p.berth_preference for p in payload.passengers]
    allocated_seats = allocate_seats(db, train.id, payload.travel_class, payload.journey_date, len(payload.passengers), seat_preferences)

    # Create Passengers, Tickets, and QR Tokens
    for idx, p_input in enumerate(payload.passengers):
        seat_info = allocated_seats[idx]
        passenger = models.Passenger(
            reservation_id=reservation.id,
            full_name=p_input.full_name,
            age=p_input.age,
            gender=p_input.gender,
            berth_preference=p_input.berth_preference,
            allotted_coach=seat_info["coach"],
            allotted_berth_number=seat_info["berth_number"],
            allotted_berth_type=seat_info["berth_type"],
            current_status=seat_info["status"],
            id_proof_type=p_input.id_proof_type or "Aadhaar",
            id_proof_number=p_input.id_proof_number or f"XXXX-XXXX-{random.randint(1000, 9999)}"
        )
        db.add(passenger)
        db.flush()

        ticket_number = f"TKT-{pnr.replace('-', '')[:6]}-{idx+1:02d}"
        security_sig = generate_security_signature(f"{pnr}:{ticket_number}:{passenger.id}")

        ticket = models.Ticket(
            reservation_id=reservation.id,
            passenger_id=passenger.id,
            ticket_number=ticket_number,
            security_signature=security_sig,
            is_cancelled=False
        )
        db.add(ticket)
        db.flush()

        token_str = generate_qr_token_string(pnr, ticket_number)
        qr_token = models.QRToken(
            ticket_id=ticket.id,
            reservation_id=reservation.id,
            token_string=token_str,
            token_hash=hash_token(token_str),
            expires_at=datetime.datetime.utcnow() + datetime.timedelta(days=7),
            is_revoked=False
        )
        db.add(qr_token)

        # Initialize Boarding Record
        boarding_rec = models.BoardingRecord(
            ticket_id=ticket.id,
            passenger_id=passenger.id,
            reservation_id=reservation.id,
            boarding_status="NOT_VERIFIED"
        )
        db.add(boarding_rec)

    db.commit()
    db.refresh(reservation)

    return format_reservation_response(db, reservation)

def format_reservation_response(db: Session, res: models.Reservation) -> schemas.ReservationDetailOut:
    """Helper to convert reservation model with passengers, tickets, and QR base64 images"""
    # Schedules for departure / arrival
    src_sch = db.query(models.Schedule).filter(
        models.Schedule.train_id == res.train_id,
        models.Schedule.station_id == res.source_station_id
    ).first()
    dest_sch = db.query(models.Schedule).filter(
        models.Schedule.train_id == res.train_id,
        models.Schedule.station_id == res.destination_station_id
    ).first()

    dep_time = src_sch.departure_time if src_sch else "06:00"
    arr_time = dest_sch.arrival_time if dest_sch else "14:00"

    passengers_out = []
    tickets_out = []

    for p in res.passengers:
        p_out = schemas.PassengerOut.from_orm(p)
        passengers_out.append(p_out)

        t = p.ticket
        if t:
            token_string = t.qr_token.token_string if t.qr_token else ""
            qr_payload = build_qr_payload(token_string, res.pnr, t.ticket_number)
            qr_b64 = create_qr_code_base64(qr_payload)

            # Get boarding status and verification count
            boarding_rec = db.query(models.BoardingRecord).filter(models.BoardingRecord.ticket_id == t.id).first()
            b_status = boarding_rec.boarding_status if boarding_rec else "NOT_VERIFIED"
            
            verifications = db.query(models.VerificationRecord).filter(models.VerificationRecord.ticket_id == t.id).all()
            v_count = len(verifications)
            last_v = verifications[-1].scan_timestamp if verifications else None

            tickets_out.append(schemas.TicketOut(
                id=t.id,
                ticket_number=t.ticket_number,
                passenger=p_out,
                security_signature=t.security_signature,
                issued_at=t.issued_at,
                is_cancelled=t.is_cancelled,
                qr_token_string=token_string,
                qr_code_base64=qr_b64,
                boarding_status=b_status,
                verification_count=v_count,
                last_verified_at=last_v
            ))

    return schemas.ReservationDetailOut(
        id=res.id,
        pnr=res.pnr,
        user_id=res.user_id,
        train_id=res.train_id,
        train_number=res.train.train_number,
        train_name=res.train.name,
        train_type=res.train.train_type,
        source_station_code=res.source_station.code,
        source_station_name=res.source_station.name,
        destination_station_code=res.destination_station.code,
        destination_station_name=res.destination_station.name,
        departure_time=dep_time,
        arrival_time=arr_time,
        journey_date=res.journey_date,
        travel_class=res.travel_class,
        quota=res.quota,
        total_fare=res.total_fare,
        booking_status=res.booking_status,
        payment_status=res.payment_status,
        booked_at=res.booked_at,
        cancelled_at=res.cancelled_at,
        passengers=passengers_out,
        tickets=tickets_out
    )

@router.get("/my-journeys", response_model=List[schemas.ReservationDetailOut])
def get_my_journeys(
    category: Optional[str] = "all", # 'upcoming', 'past', 'cancelled', 'all'
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """List current user's reservations with status filters and active QR tickets"""
    query = db.query(models.Reservation).filter(models.Reservation.user_id == current_user.id)
    
    today_str = datetime.date.today().strftime("%Y-%m-%d")

    if category == "upcoming":
        query = query.filter(
            models.Reservation.journey_date >= today_str,
            models.Reservation.booking_status != "Cancelled"
        )
    elif category == "past":
        query = query.filter(
            models.Reservation.journey_date < today_str,
            models.Reservation.booking_status != "Cancelled"
        )
    elif category == "cancelled":
        query = query.filter(models.Reservation.booking_status == "Cancelled")

    reservations = query.order_by(models.Reservation.booked_at.desc()).all()
    return [format_reservation_response(db, r) for r in reservations]

@router.get("/pnr/{pnr}", response_model=schemas.ReservationDetailOut)
def get_reservation_by_pnr(pnr: str, db: Session = Depends(get_db)):
    """Lookup reservation and active digital QR tickets by PNR"""
    res = db.query(models.Reservation).filter(models.Reservation.pnr == pnr.strip()).first()
    if not res:
        raise HTTPException(status_code=404, detail="PNR record not found")
    return format_reservation_response(db, res)

@router.get("/ticket/{ticket_number}", response_model=schemas.ReservationDetailOut)
def get_ticket_by_number(ticket_number: str, db: Session = Depends(get_db)):
    """Lookup reservation via single ticket number"""
    ticket = db.query(models.Ticket).filter(models.Ticket.ticket_number == ticket_number.strip()).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return format_reservation_response(db, ticket.reservation)

@router.post("/cancel/{reservation_id}", response_model=schemas.ReservationDetailOut)
def cancel_reservation(
    reservation_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Cancel a booking, revoke its QR verification tokens, and update status"""
    res = db.query(models.Reservation).filter(models.Reservation.id == reservation_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Reservation not found")

    if res.user_id != current_user.id and current_user.role not in ["staff", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this booking")

    if res.booking_status == "Cancelled":
        raise HTTPException(status_code=400, detail="Reservation is already cancelled")

    res.booking_status = "Cancelled"
    res.payment_status = "Refund Initiated"
    res.cancelled_at = datetime.datetime.utcnow()

    # Cancel individual tickets and revoke QR tokens
    for t in res.tickets:
        t.is_cancelled = True
        if t.qr_token:
            t.qr_token.is_revoked = True
        if t.passenger:
            t.passenger.current_status = "CAN"

    db.commit()
    db.refresh(res)

    return format_reservation_response(db, res)
