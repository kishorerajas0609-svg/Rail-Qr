import os
import sys
import csv
import datetime

# Add backend directory to sys.path
backend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'backend')
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

try:
    from backend.app.database import SessionLocal
    from backend.app import models
except (ImportError, ModuleNotFoundError):
    from app.database import SessionLocal  # type: ignore
    from app import models  # type: ignore

def generate_all_routes():
    db = SessionLocal()
    try:
        stations = db.query(models.Station).all()
        print(f"Total stations found: {len(stations)}")
        
        templates = [
            {"suffix": "Superfast Express", "type": "Superfast", "dep": "06:15", "speed": 78.0, "days": "Mon,Tue,Wed,Thu,Fri,Sat,Sun"},
            {"suffix": "Vande Bharat Express", "type": "Vande Bharat", "dep": "11:30", "speed": 95.0, "days": "Tue,Wed,Thu,Fri,Sat,Sun"},
            {"suffix": "Intercity SF Express", "type": "Express", "dep": "16:45", "speed": 72.0, "days": "Mon,Tue,Wed,Thu,Fri,Sat,Sun"},
            {"suffix": "Jan Shatabdi Express", "type": "Shatabdi", "dep": "20:30", "speed": 82.0, "days": "Mon,Tue,Wed,Thu,Fri,Sat"}
        ]

        csv_rows = []
        created_trains_count = 0

        for src in stations:
            for dest in stations:
                if src.id == dest.id:
                    continue

                # Check existing trains connecting src -> dest in proper stop order
                existing_schedules = db.query(models.Schedule).filter(models.Schedule.station_id == src.id).all()
                existing_train_ids = set()
                for s in existing_schedules:
                    dest_s = db.query(models.Schedule).filter(
                        models.Schedule.train_id == s.train_id,
                        models.Schedule.station_id == dest.id,
                        models.Schedule.stop_number > s.stop_number
                    ).first()
                    if dest_s:
                        existing_train_ids.add(s.train_id)

                existing_count = len(existing_train_ids)

                # Desired count: between 2 and 4 (deterministic for consistency)
                pair_hash = abs(hash(f"{src.code}_{dest.code}"))
                desired_count = min(4, max(2, (pair_hash % 3) + 2))
                needed = desired_count - existing_count

                if needed > 0:
                    base_dist = 220.0 + (pair_hash % 750)

                    for idx in range(needed):
                        tpl_idx = (existing_count + idx) % len(templates)
                        tpl = templates[tpl_idx]

                        # Unique 5-digit train number
                        train_num = f"{13000 + (pair_hash + idx * 37) % 16000:05d}"
                        while db.query(models.Train).filter(models.Train.train_number == train_num).first():
                            pair_hash += 101
                            train_num = f"{20000 + (pair_hash + idx * 43) % 40000:05d}"

                        train_name = f"{src.city} - {dest.city} {tpl['suffix']}"

                        # Calculate arrival time
                        # pyrefly: ignore [unsupported-operation]
                        hours = base_dist / tpl["speed"]
                        # pyrefly: ignore [bad-argument-type]
                        dep_dt = datetime.datetime.strptime(tpl["dep"], "%H:%M")
                        arr_dt = dep_dt + datetime.timedelta(hours=hours)
                        day_offset = int(hours // 24)
                        arr_str = arr_dt.strftime("%H:%M")

                        new_train = models.Train(
                            train_number=train_num,
                            name=train_name,
                            train_type=tpl["type"],
                            source_station_id=src.id,
                            destination_station_id=dest.id,
                            total_distance_km=round(base_dist, 1),
                            runs_on_days=tpl["days"],
                            is_active=True
                        )
                        db.add(new_train)
                        db.flush()
                        created_trains_count += 1

                        # Schedules
                        sch1 = models.Schedule(
                            train_id=new_train.id,
                            station_id=src.id,
                            stop_number=1,
                            arrival_time=tpl["dep"],
                            departure_time=tpl["dep"],
                            day_offset=0,
                            platform_number=(pair_hash % 8) + 1,
                            distance_from_source_km=0.0
                        )
                        sch2 = models.Schedule(
                            train_id=new_train.id,
                            station_id=dest.id,
                            stop_number=2,
                            arrival_time=arr_str,
                            departure_time=arr_str,
                            day_offset=day_offset,
                            platform_number=((pair_hash + 1) % 8) + 1,
                            distance_from_source_km=round(base_dist, 1)
                        )
                        db.add(sch1)
                        db.add(sch2)

                        # Standard Coaches
                        coaches_spec = [
                            ("EC1", "EC", 52),
                            ("C1", "CC", 78),
                            ("C2", "CC", 78),
                            ("A1", "2A", 48),
                            ("B1", "3A", 64),
                            ("B2", "3A", 64),
                            ("S1", "SL", 72),
                            ("S2", "SL", 72),
                        ]
                        for c_code, c_type, c_berths in coaches_spec:
                            db.add(models.Coach(
                                train_id=new_train.id,
                                coach_code=c_code,
                                coach_type=c_type,
                                total_berths=c_berths
                            ))

        db.commit()
        print(f"Successfully generated and committed {created_trains_count} new direct trains!")

        # Export complete trains and schedules CSV
        data_dir = os.path.join(backend_dir, 'data')
        os.makedirs(data_dir, exist_ok=True)
        csv_file_path = os.path.join(data_dir, 'train_routes_matrix.csv')

        all_trains = db.query(models.Train).filter(models.Train.is_active == True).all()
        with open(csv_file_path, mode='w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow([
                "TrainNumber",
                "TrainName",
                "TrainType",
                "SourceStationCode",
                "SourceStationName",
                "SourceCity",
                "DestinationStationCode",
                "DestinationStationName",
                "DestinationCity",
                "TotalDistanceKm",
                "OperatingDays"
            ])
            for t in all_trains:
                writer.writerow([
                    t.train_number,
                    t.name,
                    t.train_type,
                    t.source_station.code if t.source_station else "N/A",
                    t.source_station.name if t.source_station else "N/A",
                    t.source_station.city if t.source_station else "N/A",
                    t.destination_station.code if t.destination_station else "N/A",
                    t.destination_station.name if t.destination_station else "N/A",
                    t.destination_station.city if t.destination_station else "N/A",
                    t.total_distance_km,
                    t.runs_on_days
                ])

        # Also place a copy at backend/trains.csv for easy access
        backend_csv_path = os.path.join(backend_dir, 'trains.csv')
        with open(backend_csv_path, mode='w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow([
                "TrainNumber",
                "TrainName",
                "TrainType",
                "SourceCode",
                "SourceCity",
                "DestCode",
                "DestCity",
                "DistanceKm",
                "RunsOnDays"
            ])
            for t in all_trains:
                writer.writerow([
                    t.train_number,
                    t.name,
                    t.train_type,
                    t.source_station.code if t.source_station else "N/A",
                    t.source_station.city if t.source_station else "N/A",
                    t.destination_station.code if t.destination_station else "N/A",
                    t.destination_station.city if t.destination_station else "N/A",
                    t.total_distance_km,
                    t.runs_on_days
                ])

        print(f"Generated CSV matrix at: {csv_file_path} and {backend_csv_path} with {len(all_trains)} total trains!")

    finally:
        db.close()

if __name__ == "__main__":
    generate_all_routes()
