import os
import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_
from typing import List, Optional, Any
from ..database import get_db
from .. import models, schemas
from ..auth import require_admin, get_password_hash
from .booking_routes import format_reservation_response
from ..seed_data import seed_database

router = APIRouter(prefix="/admin", tags=["Admin Operations & Executive Analytics"])

@router.get("/analytics", response_model=schemas.AdminAnalyticsSummary)
def get_admin_analytics(db: Session = Depends(get_db), current_user: Any = Depends(require_admin)):
    """Computes high-level KPIs and security verification metrics"""
    total_passengers = db.query(models.Passenger).count()
    total_reservations = db.query(models.Reservation).count()
    
    today_str = datetime.date.today().strftime("%Y-%m-%d")
    active_journeys = db.query(models.Reservation).filter(
        models.Reservation.journey_date >= today_str,
        models.Reservation.booking_status != "Cancelled"
    ).count()

    cancelled_tickets = db.query(models.Reservation).filter(
        models.Reservation.booking_status == "Cancelled"
    ).count()

    verified_tickets = db.query(models.BoardingRecord).filter(
        models.BoardingRecord.boarding_status.in_(["VERIFIED", "BOARDED"])
    ).count()

    unverified_tickets = db.query(models.BoardingRecord).filter(
        models.BoardingRecord.boarding_status == "NOT_VERIFIED"
    ).count()

    total_revenue = db.query(func.sum(models.Reservation.total_fare)).filter(
        models.Reservation.booking_status != "Cancelled"
    ).scalar() or 0.0

    # Scans today
    # pyrefly: ignore [deprecated]
    today_start = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    scans_today = db.query(models.VerificationRecord).filter(
        models.VerificationRecord.scan_timestamp >= today_start
    ).count()

    duplicate_alerts = db.query(models.VerificationRecord).filter(
        models.VerificationRecord.scan_result == "DUPLICATE_SCAN"
    ).count()

    suspicious = db.query(models.VerificationRecord).filter(
        models.VerificationRecord.scan_result.in_(["INVALID_TOKEN", "CANCELLED", "EXPIRED", "WRONG_TRAIN"])
    ).count()

    return schemas.AdminAnalyticsSummary(
        total_passengers=total_passengers,
        total_reservations=total_reservations,
        active_journeys=active_journeys,
        verified_tickets=verified_tickets,
        unverified_tickets=unverified_tickets,
        cancelled_tickets=cancelled_tickets,
        total_revenue=round(total_revenue, 2),
        total_scans_today=scans_today,
        duplicate_scan_alerts=duplicate_alerts,
        suspicious_attempts=suspicious
    )

@router.get("/audit-logs", response_model=List[schemas.VerificationAuditLogOut])
def get_verification_audit_logs(
    limit: int = 100,
    result_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Any = Depends(require_admin)
):
    """Returns chronologically ordered QR verification scan records with full audit trail"""
    query = db.query(models.VerificationRecord)

    if result_filter:
        query = query.filter(models.VerificationRecord.scan_result == result_filter)

    records: List[Any] = query.order_by(models.VerificationRecord.scan_timestamp.desc()).limit(limit).all()

    logs: List[schemas.VerificationAuditLogOut] = []
    for r in records:
        pnr = r.ticket.reservation.pnr if r.ticket and r.ticket.reservation else None
        tkt_num = r.ticket.ticket_number if r.ticket else None
        p_name = r.ticket.passenger.full_name if r.ticket and r.ticket.passenger else None
        t_num = r.train.train_number if r.train else (r.ticket.reservation.train.train_number if r.ticket and r.ticket.reservation else None)
        badge = r.staff.staff_profile.badge_number if r.staff and r.staff.staff_profile else ("Admin" if r.staff and r.staff.role == "admin" else "Scanner")
        st_code = r.station.code if r.station else "GATE"

        logs.append(schemas.VerificationAuditLogOut(
            id=int(r.id),
            scan_timestamp=r.scan_timestamp,
            scan_result=str(r.scan_result),
            pnr=pnr,
            ticket_number=tkt_num,
            passenger_name=p_name,
            train_number=t_num,
            staff_badge=badge,
            station_code=st_code,
            device_info=str(r.device_info) if r.device_info else None,
            scan_count=int(r.scan_count_at_time or 1),
            notes=str(r.notes) if r.notes else None
        ))

    return logs

@router.get("/staff-list")
def list_staff_members(db: Session = Depends(get_db), current_user: Any = Depends(require_admin)):
    """List all staff accounts and assigned duties"""
    staff_users = db.query(models.User).filter(models.User.role.in_(["staff", "admin"])).all()
    results = []
    for u in staff_users:
        sp = u.staff_profile
        results.append({
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "phone": u.phone,
            "role": u.role,
            "is_active": u.is_active,
            "badge_number": sp.badge_number if sp else "ADMIN-MASTER",
            "designation": sp.designation if sp else "System Administrator",
            "assigned_train": sp.assigned_train.train_number if sp and sp.assigned_train else None,
            "assigned_station": sp.assigned_station.code if sp and sp.assigned_station else None,
            "created_at": u.created_at
        })
    return results

@router.post("/create-staff")
def create_staff_account(
    payload: schemas.UserRegister,
    db: Session = Depends(get_db),
    current_user: Any = Depends(require_admin)
):
    """Admin endpoint to provision new railway TTE or inspector accounts"""
    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    user = models.User(
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name,
        phone=payload.phone,
        role=payload.role or "staff",
        is_active=True
    )
    db.add(user)
    db.flush()

    if payload.badge_number:
        sp = models.StaffProfile(
            user_id=user.id,
            badge_number=payload.badge_number,
            designation=payload.designation or "TTE",
            assigned_train_id=payload.assigned_train_id,
            assigned_station_id=payload.assigned_station_id
        )
        db.add(sp)

    db.commit()
    db.refresh(user)

    return {"success": True, "message": "Staff member created successfully", "user_id": user.id}

@router.get("/all-trains")
def list_all_trains_admin(db: Session = Depends(get_db), current_user: Any = Depends(require_admin)):
    """Admin view for all trains with full coach details and total reservations"""
    trains = db.query(models.Train).all()
    results = []
    for t in trains:
        res_count = db.query(models.Reservation).filter(models.Reservation.train_id == t.id).count()
        results.append({
            "id": t.id,
            "train_number": t.train_number,
            "name": t.name,
            "train_type": t.train_type,
            "source": t.source_station.code,
            "destination": t.destination_station.code,
            "distance_km": t.total_distance_km,
            "runs_on_days": t.runs_on_days,
            "is_active": t.is_active,
            # pyrefly: ignore [bad-argument-type]
            "coach_count": len(t.coaches),
            "reservations_count": res_count
        })
    return results

@router.post("/toggle-train/{train_id}")
def toggle_train_status(train_id: int, db: Session = Depends(get_db), current_user: Any = Depends(require_admin)):
    """Enable or disable train operations"""
    train: Any = db.query(models.Train).filter(models.Train.id == train_id).first()
    if not train:
        raise HTTPException(status_code=404, detail="Train not found")
    
    train.is_active = not bool(train.is_active)
    db.commit()
    return {"success": True, "train_id": train.id, "is_active": train.is_active}

# =========================================================================
# 1. STAFF & TTR MANAGEMENT
# =========================================================================

@router.put("/staff/{user_id}")
def update_staff_account(
    user_id: int,
    payload: schemas.StaffUpdate,
    db: Session = Depends(get_db),
    current_user: Any = Depends(require_admin)
):
    """Admin endpoint to update staff/TTE profile details, duties, and train assignment"""
    user: Any = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Staff user not found")
    
    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.phone is not None:
        user.phone = payload.phone
    if payload.is_active is not None:
        user.is_active = payload.is_active

    sp: Any = user.staff_profile
    if not sp:
        sp = models.StaffProfile(
            user_id=user.id,
            badge_number=payload.badge_number or f"TTE-{user.id:03d}",
            designation=payload.designation or "TTE"
        )
        db.add(sp)
    else:
        if payload.badge_number:
            sp.badge_number = payload.badge_number
        if payload.designation:
            sp.designation = payload.designation
        if payload.assigned_train_id is not None:
            sp.assigned_train_id = payload.assigned_train_id if payload.assigned_train_id > 0 else None
        if payload.assigned_station_id is not None:
            sp.assigned_station_id = payload.assigned_station_id if payload.assigned_station_id > 0 else None

    db.commit()
    db.refresh(user)
    return {"success": True, "message": "Staff member updated successfully", "user_id": user.id}

@router.post("/staff/{user_id}/toggle-status")
def toggle_staff_status(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Any = Depends(require_admin)
):
    """Admin endpoint to activate or deactivate a staff member"""
    if int(current_user.id) == user_id:
        raise HTTPException(status_code=400, detail="Cannot disable your own admin account")

    user: Any = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Staff user not found")

    user.is_active = not bool(user.is_active)
    db.commit()
    return {"success": True, "user_id": user.id, "is_active": user.is_active}

@router.delete("/staff/{user_id}")
def delete_staff_member(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Any = Depends(require_admin)
):
    """Admin endpoint to remove a staff member"""
    if int(current_user.id) == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")

    user: Any = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Staff user not found")

    db.delete(user)
    db.commit()
    return {"success": True, "message": f"Staff user {user.email} removed successfully"}

# =========================================================================
# 2. PASSENGER & USER MANAGEMENT
# =========================================================================

@router.get("/passengers", response_model=List[schemas.PassengerManageOut])
def list_passengers_admin(
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Any = Depends(require_admin)
):
    """Admin endpoint to view all registered passengers with booking metrics"""
    query = db.query(models.User).filter(models.User.role == "passenger")

    if search:
        s = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(models.User.full_name).like(s),
                func.lower(models.User.email).like(s),
                func.lower(models.User.phone).like(s)
            )
        )

    if status_filter == "active":
        query = query.filter(models.User.is_active == True)
    elif status_filter == "inactive":
        query = query.filter(models.User.is_active == False)

    users: List[Any] = query.order_by(models.User.created_at.desc()).all()

    results: List[schemas.PassengerManageOut] = []
    for u in users:
        reservations: List[Any] = db.query(models.Reservation).filter(models.Reservation.user_id == u.id).all()
        total_bookings = len(reservations)
        confirmed_count = sum(1 for r in reservations if str(r.booking_status) == "Confirmed")
        cancelled_count = sum(1 for r in reservations if str(r.booking_status) == "Cancelled")
        total_spent = sum(float(r.total_fare or 0.0) for r in reservations if str(r.booking_status) != "Cancelled")

        results.append(schemas.PassengerManageOut(
            id=int(u.id),
            email=str(u.email),
            full_name=str(u.full_name),
            phone=str(u.phone) if u.phone else None,
            role=str(u.role),
            is_active=bool(u.is_active),
            created_at=u.created_at,
            total_bookings=total_bookings,
            confirmed_tickets=confirmed_count,
            cancelled_tickets=cancelled_count,
            total_spent=round(float(total_spent), 2)
        ))

    return results

@router.get("/passengers/{user_id}/reservations")
def get_passenger_reservations_admin(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Any = Depends(require_admin)
):
    """Admin endpoint to view all reservations and tickets for a specific passenger"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Passenger user not found")

    reservations = db.query(models.Reservation).filter(
        models.Reservation.user_id == user_id
    ).order_by(models.Reservation.booked_at.desc()).all()

    return [format_reservation_response(db, r) for r in reservations]

@router.put("/users/{user_id}")
def update_user_details(
    user_id: int,
    payload: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: Any = Depends(require_admin)
):
    """Admin endpoint to edit passenger or user details"""
    user: Any = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.email is not None:
        # Check uniqueness
        dup = db.query(models.User).filter(models.User.email == payload.email, models.User.id != user_id).first()
        if dup:
            raise HTTPException(status_code=400, detail="Email is already used by another account")
        user.email = payload.email
    if payload.phone is not None:
        user.phone = payload.phone
    if payload.role is not None and payload.role in ["passenger", "staff", "admin"]:
        user.role = payload.role
    if payload.is_active is not None:
        user.is_active = payload.is_active

    db.commit()
    return {"success": True, "message": "User updated successfully", "user_id": user.id}

@router.post("/users/{user_id}/toggle-status")
def toggle_user_status(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Any = Depends(require_admin)
):
    """Admin endpoint to suspend or activate a user account"""
    if int(current_user.id) == user_id:
        raise HTTPException(status_code=400, detail="Cannot toggle your own admin account")

    user: Any = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = not bool(user.is_active)
    db.commit()
    return {"success": True, "user_id": user.id, "is_active": user.is_active}

@router.delete("/users/{user_id}")
def delete_user_account(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Any = Depends(require_admin)
):
    """Admin endpoint to delete a user account"""
    if int(current_user.id) == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")

    user: Any = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()
    return {"success": True, "message": f"User account {user.email} deleted successfully"}

# =========================================================================
# 3. DATABASE MANAGEMENT & TABLE INSPECTOR
# =========================================================================

DATABASE_TABLE_MODELS = {
    "users": models.User,
    "staff_profiles": models.StaffProfile,
    "stations": models.Station,
    "trains": models.Train,
    "schedules": models.Schedule,
    "coaches": models.Coach,
    "berths": models.Berth,
    "fare_rules": models.FareRule,
    "reservations": models.Reservation,
    "passengers": models.Passenger,
    "tickets": models.Ticket,
    "qr_tokens": models.QRToken,
    "boarding_records": models.BoardingRecord,
    "verification_records": models.VerificationRecord,
}

@router.get("/database/overview", response_model=schemas.DatabaseOverviewOut)
def get_database_overview(
    db: Session = Depends(get_db),
    current_user: Any = Depends(require_admin)
):
    """Admin endpoint to inspect SQLite database health, table counts, and disk size"""
    counts = {}
    total_records = 0
    for tbl_name, model_cls in DATABASE_TABLE_MODELS.items():
        try:
            cnt = db.query(model_cls).count()
            counts[tbl_name] = cnt
            total_records += cnt
        except Exception:
            counts[tbl_name] = 0

    # Calculate DB file size
    db_path = "smart_rail.db"
    size_kb = 0.0
    if os.path.exists(db_path):
        size_kb = round(os.path.getsize(db_path) / 1024.0, 2)
    elif os.path.exists(os.path.join("backend", db_path)):
        size_kb = round(os.path.getsize(os.path.join("backend", db_path)) / 1024.0, 2)

    return schemas.DatabaseOverviewOut(
        database_file="smart_rail.db",
        size_kb=size_kb,
        total_records=total_records,
        table_counts=counts,
        engine="SQLite 3 (ACID Relational)",
        status="Healthy & Operational",
        # pyrefly: ignore [deprecated]
        checked_at=datetime.datetime.utcnow()
    )

@router.get("/database/table/{table_name}")
def inspect_database_table(
    table_name: str,
    limit: int = 50,
    offset: int = 0,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Any = Depends(require_admin)
):
    """Admin endpoint to inspect live raw records from any table in the schema"""
    model_cls = DATABASE_TABLE_MODELS.get(table_name.lower())
    if not model_cls:
        raise HTTPException(
            status_code=404,
            detail=f"Table '{table_name}' not found. Available tables: {list(DATABASE_TABLE_MODELS.keys())}"
        )

    query = db.query(model_cls)
    total_count = query.count()

    columns = [c.name for c in model_cls.__table__.columns]

    # Order by ID descending if table has ID
    if hasattr(model_cls, 'id'):
        query = query.order_by(desc(model_cls.id))

    records = query.offset(offset).limit(limit).all()

    rows = []
    for r in records:
        row_dict = {}
        for col in columns:
            val = getattr(r, col)
            if isinstance(val, (datetime.datetime, datetime.date)):
                row_dict[col] = val.isoformat()
            else:
                row_dict[col] = val
        rows.append(row_dict)

    return {
        "table_name": table_name,
        "total_records": total_count,
        "limit": limit,
        "offset": offset,
        "columns": columns,
        "rows": rows
    }

@router.post("/database/reset-seed")
def reset_database_seed(
    db: Session = Depends(get_db),
    current_user: Any = Depends(require_admin)
):
    """Admin endpoint to re-seed demo trains, users, and reservations if tables are empty"""
    seed_database(db)
    return {"success": True, "message": "Database seed completed successfully."}

@router.post("/database/cleanup-expired")
def cleanup_expired_tokens(
    db: Session = Depends(get_db),
    current_user: Any = Depends(require_admin)
):
    """Admin endpoint to revoke all expired QR tokens"""
    # pyrefly: ignore [deprecated]
    now = datetime.datetime.utcnow()
    expired: List[Any] = db.query(models.QRToken).filter(
        models.QRToken.expires_at < now,
        models.QRToken.is_revoked == False
    ).all()

    count = len(expired)
    for t in expired:
        t.is_revoked = True
    db.commit()

    return {"success": True, "message": f"Successfully revoked {count} expired QR tokens", "revoked_count": count}

@router.get("/database/export")
def export_database_snapshot(
    db: Session = Depends(get_db),
    current_user: Any = Depends(require_admin)
):
    """Admin endpoint to export a JSON snapshot of the system database"""
    snapshot = {
        # pyrefly: ignore [deprecated]
        "export_timestamp": datetime.datetime.utcnow().isoformat(),
        "exported_by": current_user.email,
        "stations": [
            {"code": s.code, "name": s.name, "city": s.city, "zone": s.zone}
            for s in db.query(models.Station).all()
        ],
        "trains": [
            {"train_number": t.train_number, "name": t.name, "type": t.train_type, "distance": t.total_distance_km}
            for t in db.query(models.Train).all()
        ],
        "staff": [
            {
                "email": u.email,
                "name": u.full_name,
                "badge": u.staff_profile.badge_number if u.staff_profile else None,
                "designation": u.staff_profile.designation if u.staff_profile else None
            }
            for u in db.query(models.User).filter(models.User.role.in_(["staff", "admin"])).all()
        ],
        "passengers_count": db.query(models.User).filter(models.User.role == "passenger").count(),
        "reservations_count": db.query(models.Reservation).count(),
        "tickets_count": db.query(models.Ticket).count(),
        "audit_logs_count": db.query(models.VerificationRecord).count()
    }
    return snapshot

# =========================================================================
# 4. GLOBAL RESERVATIONS & BOOKING MANAGEMENT
# =========================================================================

@router.get("/all-reservations")
def list_all_reservations_admin(
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    train_id: Optional[int] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: Any = Depends(require_admin)
):
    """Admin endpoint to view and manage all train bookings across the network"""
    query = db.query(models.Reservation)

    if search:
        s = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(models.Reservation.pnr).like(s),
                models.Reservation.passengers.any(func.lower(models.Passenger.full_name).like(s))
            )
        )

    if status_filter:
        query = query.filter(models.Reservation.booking_status == status_filter)

    if train_id:
        query = query.filter(models.Reservation.train_id == train_id)

    total_count = query.count()
    reservations = query.order_by(models.Reservation.booked_at.desc()).offset(offset).limit(limit).all()

    return {
        "total": total_count,
        "limit": limit,
        "offset": offset,
        "reservations": [format_reservation_response(db, r) for r in reservations]
    }

@router.post("/reservations/{reservation_id}/cancel")
def admin_cancel_reservation(
    reservation_id: int,
    db: Session = Depends(get_db),
    current_user: Any = Depends(require_admin)
):
    """Admin endpoint to force-cancel a reservation and revoke all associated QR codes"""
    reservation: Any = db.query(models.Reservation).filter(models.Reservation.id == reservation_id).first()
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")

    if str(reservation.booking_status) == "Cancelled":
        raise HTTPException(status_code=400, detail="Reservation is already cancelled")

    reservation.booking_status = "Cancelled"
    reservation.payment_status = "Refunded (Admin Override)"
    # pyrefly: ignore [deprecated]
    reservation.cancelled_at = datetime.datetime.utcnow()

    for ticket in reservation.tickets:
        ticket.is_cancelled = True
        if ticket.qr_token:
            ticket.qr_token.is_revoked = True

    for p in reservation.passengers:
        p.current_status = "CAN"

    db.commit()
    return {
        "success": True,
        "message": f"Reservation PNR {reservation.pnr} successfully cancelled by Admin",
        "pnr": reservation.pnr
    }

