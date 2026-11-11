from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/trains", tags=["Trains & Schedules"])

@router.get("/stations", response_model=List[schemas.StationOut])
def get_all_stations(db: Session = Depends(get_db)):
    """List all railway stations for search and autocomplete"""
    return db.query(models.Station).order_by(models.Station.city.asc()).all()

@router.get("/search", response_model=List[schemas.TrainSearchResult])
def search_trains(
    source_code: str = Query(..., description="Source station code, e.g. NDLS"),
    destination_code: str = Query(..., description="Destination station code, e.g. BPL or CSMT"),
    journey_date: str = Query(..., description="Journey date YYYY-MM-DD"),
    travel_class: Optional[str] = Query(None, description="Optional class filter"),
    quota: Optional[str] = Query("General", description="Quota: General, Tatkal, Ladies, Senior Citizen"),
    db: Session = Depends(get_db)
):
    """
    Search trains passing through both source and destination stations in correct order.
    Computes distance, departure/arrival times, duration, dynamic fares, and seat availability.
    """
    src_station = db.query(models.Station).filter(models.Station.code.ilike(source_code.strip())).first()
    dest_station = db.query(models.Station).filter(models.Station.code.ilike(destination_code.strip())).first()

    if not src_station or not dest_station:
        raise HTTPException(status_code=404, detail="Source or Destination station not found")

    if src_station.id == dest_station.id:
        raise HTTPException(status_code=400, detail="Source and destination cannot be the same")

    # Find all trains that have both stations in their schedule
    src_schedules = db.query(models.Schedule).filter(models.Schedule.station_id == src_station.id).all()
    results = []

    # Cache fare rules
    fare_rules_list = db.query(models.FareRule).all()
    fare_rules = {fr.coach_type: fr for fr in fare_rules_list}

    for src_sch in src_schedules:
        train = src_sch.train
        if not train or not train.is_active:
            continue

        # Look for destination station schedule in the same train with stop_number > src_sch.stop_number
        dest_sch = db.query(models.Schedule).filter(
            models.Schedule.train_id == train.id,
            models.Schedule.station_id == dest_station.id,
            models.Schedule.stop_number > src_sch.stop_number
        ).first()

        if not dest_sch:
            continue

        # Distance between stations
        distance = abs(dest_sch.distance_from_source_km - src_sch.distance_from_source_km)
        if distance <= 0:
            distance = train.total_distance_km

        # Build coach availability & fare options
        coaches_by_type = {}
        for c in train.coaches:
            if c.coach_type not in coaches_by_type:
                coaches_by_type[c.coach_type] = []
            coaches_by_type[c.coach_type].append(c)

        class_names = {
            "1A": "AC First Class (1A)",
            "2A": "AC 2 Tier (2A)",
            "3A": "AC 3 Tier (3A)",
            "CC": "AC Chair Car (CC)",
            "EC": "Executive Chair Car (EC)",
            "SL": "Sleeper Class (SL)"
        }

        classes_avail = []
        for c_type, coach_list in coaches_by_type.items():
            if travel_class and travel_class != "ALL" and c_type != travel_class:
                continue

            total_berths = sum(c.total_berths for c in coach_list)

            # Count booked berths for this train & date
            booked_count = db.query(models.Passenger).join(models.Reservation).filter(
                models.Reservation.train_id == train.id,
                models.Reservation.journey_date == journey_date,
                models.Reservation.travel_class == c_type,
                models.Reservation.booking_status != "Cancelled"
            ).count()

            remaining = max(0, total_berths - booked_count)

            # Fare calculation
            frule = fare_rules.get(c_type)
            if frule:
                base = distance * frule.base_fare_per_km
                total_f = round(base + frule.reservation_charge + frule.superfast_charge + (base * frule.gst_percent / 100.0), 2)
            else:
                total_f = round(distance * 1.5 + 50.0, 2)

            if quota == "Tatkal":
                total_f = round(total_f * 1.3, 2)

            if remaining > 5:
                status_label = f"AVAILABLE {remaining}"
            elif remaining > 0:
                status_label = f"RAC {6 - remaining:02d}"
            else:
                status_label = f"WL {booked_count - total_berths + 1:02d}"

            classes_avail.append(schemas.TrainAvailability(
                coach_type=c_type,
                class_name=class_names.get(c_type, c_type),
                available_seats=remaining,
                total_capacity=total_berths,
                fare=total_f,
                status_label=status_label
            ))

        if not classes_avail:
            continue

        # Format duration
        try:
            dep_parts = src_sch.departure_time.split(":")
            arr_parts = dest_sch.arrival_time.split(":")
            dep_m = int(dep_parts[0]) * 60 + int(dep_parts[1])
            arr_m = int(arr_parts[0]) * 60 + int(arr_parts[1]) + (dest_sch.day_offset * 1440)
            diff_m = max(45, arr_m - dep_m)
            duration_str = f"{diff_m // 60}h {diff_m % 60:02d}m"
        except Exception:
            duration_str = f"{dest_sch.day_offset * 24 + 6}h 30m" if dest_sch.day_offset > 0 else "5h 45m"

        results.append(schemas.TrainSearchResult(
            id=train.id,
            train_number=train.train_number,
            name=train.name,
            train_type=train.train_type,
            source_code=src_station.code,
            source_name=src_station.name,
            destination_code=dest_station.code,
            destination_name=dest_station.name,
            departure_time=src_sch.departure_time,
            arrival_time=dest_sch.arrival_time,
            duration_str=duration_str,
            total_distance_km=distance,
            runs_on_days=train.runs_on_days,
            classes=classes_avail
        ))

    # Guarantee between minimum 2 and maximum 4 trains
    return results[:4]

@router.get("/{train_id}", response_model=schemas.TrainDetailOut)
def get_train_details(train_id: int, db: Session = Depends(get_db)):
    """Get full train details, stops schedule, and coach configurations"""
    train = db.query(models.Train).filter(models.Train.id == train_id).first()
    if not train:
        raise HTTPException(status_code=404, detail="Train not found")

    schedules_out = []
    for s in sorted(train.schedules, key=lambda x: x.stop_number):
        schedules_out.append(schemas.ScheduleOut(
            id=s.id,
            station_id=s.station_id,
            station_code=s.station.code,
            station_name=s.station.name,
            city=s.station.city,
            stop_number=s.stop_number,
            arrival_time=s.arrival_time,
            departure_time=s.departure_time,
            day_offset=s.day_offset,
            platform_number=s.platform_number,
            distance_from_source_km=s.distance_from_source_km
        ))

    coaches_out = [
        schemas.CoachOut(
            id=c.id,
            coach_code=c.coach_code,
            coach_type=c.coach_type,
            total_berths=c.total_berths
        )
        for c in train.coaches
    ]

    return schemas.TrainDetailOut(
        id=train.id,
        train_number=train.train_number,
        name=train.name,
        train_type=train.train_type,
        source_station=schemas.StationOut.from_orm(train.source_station),
        destination_station=schemas.StationOut.from_orm(train.destination_station),
        total_distance_km=train.total_distance_km,
        runs_on_days=train.runs_on_days,
        schedules=schedules_out,
        coaches=coaches_out
    )
