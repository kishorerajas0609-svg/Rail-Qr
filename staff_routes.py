import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import models, schemas
from ..auth import require_staff_or_admin

router = APIRouter(prefix="/staff", tags=["Railway Staff Portal & Manifest"])

@router.get("/duty-manifest")
def get_staff_duty_manifest(
    train_id: Optional[int] = None,
    journey_date: Optional[str] = None,
    coach_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_staff_or_admin)
):
    """
    Returns full digital train passenger manifest chart for TTEs.
    Lists every passenger, coach, berth, PNR, current boarding status, and scan history.
    """
    profile = current_user.staff_profile
    target_train_id = train_id or (profile.assigned_train_id if profile else None)

    if not target_train_id:
        # Default to first active train if staff not assigned to specific one
        first_train = db.query(models.Train).filter(models.Train.is_active == True).first()
        if first_train:
            target_train_id = first_train.id
        else:
            raise HTTPException(status_code=400, detail="No active trains found")

    target_date = journey_date or datetime.date.today().strftime("%Y-%m-%d")

    train = db.query(models.Train).filter(models.Train.id == target_train_id).first()
    if not train:
        raise HTTPException(status_code=404, detail="Train not found")

    # Fetch all reservations for this train and date
    reservations = db.query(models.Reservation).filter(
        models.Reservation.train_id == target_train_id,
        models.Reservation.journey_date == target_date,
        models.Reservation.booking_status != "Cancelled"
    ).all()

    manifest_rows = []
    total_confirmed = 0
    total_verified = 0
    total_boarded = 0
    total_noshow = 0

    for res in reservations:
        for p in res.passengers:
            if coach_filter and p.allotted_coach != coach_filter:
                continue

            total_confirmed += 1
            t = p.ticket
            b_status = "NOT_VERIFIED"
            last_scan = None
            scan_count = 0
            ticket_id = None
            qr_token_str = ""

            if t:
                ticket_id = t.id
                qr_token_str = t.qr_token.token_string if t.qr_token else ""
                boarding_rec = db.query(models.BoardingRecord).filter(models.BoardingRecord.ticket_id == t.id).first()
                if boarding_rec:
                    b_status = boarding_rec.boarding_status
                
                scans = db.query(models.VerificationRecord).filter(models.VerificationRecord.ticket_id == t.id).all()
                scan_count = len(scans)
                if scans:
                    last_scan = scans[-1].scan_timestamp.isoformat()

            if b_status == "VERIFIED":
                total_verified += 1
            elif b_status == "BOARDED":
                total_boarded += 1
            elif b_status == "NO_SHOW":
                total_noshow += 1

            manifest_rows.append({
                "passenger_id": p.id,
                "ticket_id": ticket_id,
                "pnr": res.pnr,
                "full_name": p.full_name,
                "age": p.age,
                "gender": p.gender,
                "coach": p.allotted_coach or "N/A",
                "berth_number": p.allotted_berth_number or 0,
                "berth_type": p.allotted_berth_type or "N/A",
                "source_station": res.source_station.code,
                "destination_station": res.destination_station.code,
                "travel_class": res.travel_class,
                "booking_status": p.current_status,
                "boarding_status": b_status,
                "scan_count": scan_count,
                "last_scan_time": last_scan,
                "qr_token_string": qr_token_str,
                "id_proof_type": p.id_proof_type,
                "id_proof_number": p.id_proof_number
            })

    # Sort manifest by Coach then Berth Number
    manifest_rows.sort(key=lambda x: (x["coach"], x["berth_number"]))

    # Get coach list for filter dropdown
    coaches_list = [
        {"code": c.coach_code, "type": c.coach_type, "total_berths": c.total_berths}
        for c in train.coaches
    ]

    return {
        "train": {
            "id": train.id,
            "train_number": train.train_number,
            "name": train.name,
            "type": train.train_type,
            "source": train.source_station.code,
            "destination": train.destination_station.code
        },
        "journey_date": target_date,
        "coaches": coaches_list,
        "summary": {
            "total_passengers": total_confirmed,
            "verified": total_verified,
            "boarded": total_boarded,
            "no_show": total_noshow,
            "unverified": total_confirmed - total_verified - total_boarded - total_noshow
        },
        "manifest": manifest_rows
    }

@router.get("/my-scans")
def get_staff_scans(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_staff_or_admin)
):
    """Returns recent verification scans performed by current staff user"""
    scans = db.query(models.VerificationRecord).filter(
        models.VerificationRecord.staff_id == current_user.id
    ).order_by(models.VerificationRecord.scan_timestamp.desc()).limit(limit).all()

    results = []
    for s in scans:
        pnr = s.ticket.reservation.pnr if s.ticket and s.ticket.reservation else None
        p_name = s.ticket.passenger.full_name if s.ticket and s.ticket.passenger else None
        t_num = s.train.train_number if s.train else None
        results.append({
            "id": s.id,
            "scan_timestamp": s.scan_timestamp,
            "scan_result": s.scan_result,
            "pnr": pnr,
            "passenger_name": p_name,
            "train_number": t_num,
            "scan_count": s.scan_count_at_time,
            "notes": s.notes
        })
    return results
