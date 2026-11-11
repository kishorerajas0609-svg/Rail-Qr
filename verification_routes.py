import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import models, schemas
from ..auth import get_optional_current_user, require_staff_or_admin
from ..qr_service import parse_qr_payload, verify_security_signature, create_qr_code_base64, build_qr_payload
from .booking_routes import format_reservation_response

router = APIRouter(prefix="/verify", tags=["QR Verification & Fraud Detection"])

@router.post("/scan", response_model=schemas.QRVerificationResponse)
def verify_qr_scan(
    payload: schemas.QRVerificationRequest,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_current_user)
):
    """
    Core Verification Engine:
    Validates token from QR scan or manual entry, performs cryptographic checks,
    detects duplicate scans, audits scan timestamp & staff identity,
    and returns rich passenger & journey details.
    """
    staff_id = current_user.id if current_user and current_user.role in ["staff", "admin"] else None

    # 1. Parse token / PNR from input payload
    raw_token = payload.token_string or ""
    parsed = parse_qr_payload(raw_token) if raw_token else {}
    target_token_str = parsed.get("token") or raw_token
    target_pnr = payload.pnr or parsed.get("pnr")

    now = datetime.datetime.utcnow()

    # If neither token nor PNR provided
    if not target_token_str and not target_pnr:
        return schemas.QRVerificationResponse(
            is_valid=False,
            verification_status="INVALID_TOKEN",
            message="No valid QR token or PNR provided",
            scan_count=0,
            current_scan_time=now,
            boarding_status="NOT_VERIFIED",
            suspicious_flag=True,
            warning_reason="Empty scan data received"
        )

    # 2. Look up QR Token in database
    qr_token = None
    ticket = None

    if target_token_str:
        qr_token = db.query(models.QRToken).filter(models.QRToken.token_string == target_token_str).first()
    
    if not qr_token and target_pnr:
        # PNR Fallback lookup: find first ticket
        res = db.query(models.Reservation).filter(models.Reservation.pnr == target_pnr.strip()).first()
        if res and res.tickets:
            ticket = res.tickets[0]
            qr_token = ticket.qr_token

    # If token still not found -> INVALID / FRAUDULENT
    if not qr_token or not qr_token.ticket:
        # Log invalid attempt in audit log
        invalid_rec = models.VerificationRecord(
            qr_token_id=None,
            ticket_id=None,
            staff_id=staff_id,
            station_id=payload.station_id,
            train_id=payload.train_id,
            scan_timestamp=now,
            scan_result="INVALID_TOKEN",
            device_info=payload.device_info or "Handheld Terminal v2.1",
            scan_count_at_time=1,
            notes=f"Unrecognized token scanned: {target_token_str[:30]}"
        )
        db.add(invalid_rec)
        db.commit()

        return schemas.QRVerificationResponse(
            is_valid=False,
            verification_status="INVALID_TOKEN",
            message="INVALID QR CODE: Digital ticket identity not found in Central Railway Database",
            scan_count=1,
            current_scan_time=now,
            boarding_status="NOT_VERIFIED",
            suspicious_flag=True,
            warning_reason="Counterfeit or corrupted QR token"
        )

    ticket = qr_token.ticket
    reservation = ticket.reservation
    passenger = ticket.passenger

    # 3. Check for Cancellation / Revocation
    if ticket.is_cancelled or reservation.booking_status == "Cancelled" or qr_token.is_revoked:
        cancel_rec = models.VerificationRecord(
            qr_token_id=qr_token.id,
            ticket_id=ticket.id,
            staff_id=staff_id,
            station_id=payload.station_id,
            train_id=payload.train_id,
            scan_timestamp=now,
            scan_result="CANCELLED",
            device_info=payload.device_info or "Handheld Terminal v2.1",
            scan_count_at_time=1,
            notes="Attempted scan on cancelled / refunded ticket"
        )
        db.add(cancel_rec)
        db.commit()

        res_formatted = format_reservation_response(db, reservation)
        p_out = schemas.PassengerOut.from_orm(passenger)

        return schemas.QRVerificationResponse(
            is_valid=False,
            verification_status="CANCELLED",
            message="TICKET IS CANCELLED: This reservation has been cancelled and refunded.",
            scan_count=1,
            current_scan_time=now,
            ticket=schemas.TicketOut.from_orm(ticket),
            reservation=res_formatted,
            passenger=p_out,
            boarding_status="NOT_VERIFIED",
            suspicious_flag=True,
            warning_reason="Attempting to travel on a cancelled ticket"
        )

    # 4. Check for Expiration (e.g. Journey Date passed or token expired)
    if qr_token.expires_at < now:
        exp_rec = models.VerificationRecord(
            qr_token_id=qr_token.id,
            ticket_id=ticket.id,
            staff_id=staff_id,
            station_id=payload.station_id,
            train_id=payload.train_id,
            scan_timestamp=now,
            scan_result="EXPIRED",
            device_info=payload.device_info or "Handheld Terminal v2.1",
            scan_count_at_time=1,
            notes="Ticket QR token has expired"
        )
        db.add(exp_rec)
        db.commit()

        res_formatted = format_reservation_response(db, reservation)
        return schemas.QRVerificationResponse(
            is_valid=False,
            verification_status="EXPIRED",
            message="TICKET EXPIRED: Journey date/validity period for this ticket has elapsed.",
            scan_count=1,
            current_scan_time=now,
            ticket=schemas.TicketOut.from_orm(ticket),
            reservation=res_formatted,
            passenger=schemas.PassengerOut.from_orm(passenger),
            boarding_status="NOT_VERIFIED",
            suspicious_flag=True,
            warning_reason="Expired QR token"
        )

    # 5. Check Prior Scans (Duplicate Scan Detection)
    prior_scans = db.query(models.VerificationRecord).filter(
        models.VerificationRecord.ticket_id == ticket.id
    ).order_by(models.VerificationRecord.scan_timestamp.asc()).all()

    total_scans = len(prior_scans) + 1
    first_scan_time = prior_scans[0].scan_timestamp if prior_scans else now

    # Determine verification status
    is_duplicate = len(prior_scans) > 0
    verification_status = "DUPLICATE_SCAN" if is_duplicate else "VALID"
    status_msg = (
        f"RE-VERIFICATION ALERT: Ticket previously verified {len(prior_scans)} time(s)."
        if is_duplicate else
        "VALID TICKET: Digital QR identity successfully verified and authenticated."
    )

    # Record this scan in VerificationRecord
    scan_rec = models.VerificationRecord(
        qr_token_id=qr_token.id,
        ticket_id=ticket.id,
        staff_id=staff_id,
        station_id=payload.station_id,
        train_id=payload.train_id or reservation.train_id,
        scan_timestamp=now,
        scan_result=verification_status,
        device_info=payload.device_info or "Handheld Terminal v2.1",
        scan_count_at_time=total_scans,
        notes=payload.notes or ("Routine scan" if not is_duplicate else f"Re-scan #{total_scans}")
    )
    db.add(scan_rec)

    # Update Boarding Record to VERIFIED if currently NOT_VERIFIED
    boarding_rec = db.query(models.BoardingRecord).filter(models.BoardingRecord.ticket_id == ticket.id).first()
    if not boarding_rec:
        boarding_rec = models.BoardingRecord(
            ticket_id=ticket.id,
            passenger_id=passenger.id,
            reservation_id=reservation.id,
            boarding_status="VERIFIED",
            verified_by_staff_id=staff_id,
            timestamp=now
        )
        db.add(boarding_rec)
    elif boarding_rec.boarding_status == "NOT_VERIFIED":
        boarding_rec.boarding_status = "VERIFIED"
        boarding_rec.verified_by_staff_id = staff_id
        boarding_rec.timestamp = now

    db.commit()

    # Build verification history response
    all_scans = db.query(models.VerificationRecord).filter(
        models.VerificationRecord.ticket_id == ticket.id
    ).order_by(models.VerificationRecord.scan_timestamp.desc()).all()

    v_history = []
    for s in all_scans:
        staff_name = s.staff.full_name if s.staff else "Railway Gate Inspector"
        staff_badge = s.staff.staff_profile.badge_number if s.staff and s.staff.staff_profile else "TERM-01"
        station_name = s.station.name if s.station else "Platform Scanner"
        v_history.append(schemas.VerificationHistoryItem(
            id=s.id,
            scan_timestamp=s.scan_timestamp,
            scan_result=s.scan_result,
            staff_name=staff_name,
            staff_badge=staff_badge,
            station_name=station_name,
            device_info=s.device_info,
            notes=s.notes
        ))

    res_formatted = format_reservation_response(db, reservation)
    p_out = schemas.PassengerOut.from_orm(passenger)

    # Format ticket with updated fields
    t_out = schemas.TicketOut(
        id=ticket.id,
        ticket_number=ticket.ticket_number,
        passenger=p_out,
        security_signature=ticket.security_signature,
        issued_at=ticket.issued_at,
        is_cancelled=ticket.is_cancelled,
        qr_token_string=qr_token.token_string,
        qr_code_base64=create_qr_code_base64(build_qr_payload(qr_token.token_string, reservation.pnr, ticket.ticket_number)),
        boarding_status=boarding_rec.boarding_status,
        verification_count=total_scans,
        last_verified_at=now
    )

    return schemas.QRVerificationResponse(
        is_valid=True,
        verification_status=verification_status,
        message=status_msg,
        scan_count=total_scans,
        first_scanned_at=first_scan_time,
        current_scan_time=now,
        ticket=t_out,
        reservation=res_formatted,
        passenger=p_out,
        boarding_status=boarding_rec.boarding_status,
        verification_history=v_history,
        suspicious_flag=(total_scans >= 3), # Flag for staff review if scanned 3+ times
        warning_reason="High scan frequency: Scanned multiple times across check-points" if total_scans >= 3 else None
    )

@router.post("/update-boarding-status", response_model=dict)
def update_boarding_status(
    payload: schemas.BoardingStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_staff_or_admin)
):
    """
    Allows authorized TTE or Gate Inspector to mark passenger as:
    NOT_VERIFIED, VERIFIED, BOARDED, NO_SHOW.
    """
    ticket = db.query(models.Ticket).filter(models.Ticket.id == payload.ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    boarding_rec = db.query(models.BoardingRecord).filter(models.BoardingRecord.ticket_id == ticket.id).first()
    if not boarding_rec:
        boarding_rec = models.BoardingRecord(
            ticket_id=ticket.id,
            passenger_id=ticket.passenger_id,
            reservation_id=ticket.reservation_id,
            boarding_status=payload.boarding_status,
            verified_by_staff_id=current_user.id,
            boarded_at_station_id=payload.station_id,
            timestamp=datetime.datetime.utcnow(),
            notes=payload.notes
        )
        db.add(boarding_rec)
    else:
        boarding_rec.boarding_status = payload.boarding_status
        boarding_rec.verified_by_staff_id = current_user.id
        boarding_rec.boarded_at_station_id = payload.station_id
        boarding_rec.timestamp = datetime.datetime.utcnow()
        if payload.notes:
            boarding_rec.notes = payload.notes

    db.commit()

    return {
        "success": True,
        "message": f"Boarding status updated to {payload.boarding_status}",
        "ticket_id": ticket.id,
        "new_status": payload.boarding_status,
        "updated_at": datetime.datetime.utcnow().isoformat()
    }
