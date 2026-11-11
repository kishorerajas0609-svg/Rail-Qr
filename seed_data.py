import datetime
from sqlalchemy.orm import Session
from . import models
from .auth import get_password_hash
from .qr_service import generate_security_signature, generate_qr_token_string, hash_token

def seed_database(db: Session):
    # Check if data already exists
    if db.query(models.Station).first() is not None:
        return

    print("[*] Seeding database with realistic Indian Railways stations, trains, coaches, users and tickets...")

    # 1. Stations
    stations_data = [
        {"code": "NDLS", "name": "New Delhi Railway Station", "city": "New Delhi", "state": "Delhi", "zone": "NR", "platform_count": 16},
        {"code": "CSMT", "name": "Chhatrapati Shivaji Maharaj Terminus", "city": "Mumbai", "state": "Maharashtra", "zone": "CR", "platform_count": 18},
        {"code": "HWH", "name": "Howrah Junction", "city": "Kolkata", "state": "West Bengal", "zone": "ER", "platform_count": 23},
        {"code": "MAS", "name": "Chennai Central", "city": "Chennai", "state": "Tamil Nadu", "zone": "SR", "platform_count": 12},
        {"code": "SBC", "name": "KSR Bengaluru City Junction", "city": "Bengaluru", "state": "Karnataka", "zone": "SWR", "platform_count": 10},
        {"code": "ADI", "name": "Ahmedabad Junction", "city": "Ahmedabad", "state": "Gujarat", "zone": "WR", "platform_count": 12},
        {"code": "BPL", "name": "Bhopal Junction", "city": "Bhopal", "state": "Madhya Pradesh", "zone": "WCR", "platform_count": 6},
        {"code": "AGC", "name": "Agra Cantt", "city": "Agra", "state": "Uttar Pradesh", "zone": "NCR", "platform_count": 6},
        {"code": "GWL", "name": "Gwalior Junction", "city": "Gwalior", "state": "Madhya Pradesh", "zone": "NCR", "platform_count": 5},
        {"code": "VGLJ", "name": "Virangana Lakshmibai Jhansi", "city": "Jhansi", "state": "Uttar Pradesh", "zone": "NCR", "platform_count": 7},
        {"code": "CNB", "name": "Kanpur Central", "city": "Kanpur", "state": "Uttar Pradesh", "zone": "NCR", "platform_count": 10},
        {"code": "PRYJ", "name": "Prayagraj Junction", "city": "Prayagraj", "state": "Uttar Pradesh", "zone": "NCR", "platform_count": 10},
        {"code": "BSB", "name": "Varanasi Junction", "city": "Varanasi", "state": "Uttar Pradesh", "zone": "NR", "platform_count": 9},
        {"code": "PNBE", "name": "Patna Junction", "city": "Patna", "state": "Bihar", "zone": "ECR", "platform_count": 10},
        {"code": "HYB", "name": "Hyderabad Deccan", "city": "Hyderabad", "state": "Telangana", "zone": "SCR", "platform_count": 6},
        {"code": "PUNE", "name": "Pune Junction", "city": "Pune", "state": "Maharashtra", "zone": "CR", "platform_count": 6},
        {"code": "ST", "name": "Surat", "city": "Surat", "state": "Gujarat", "zone": "WR", "platform_count": 4},
        {"code": "BRC", "name": "Vadodara Junction", "city": "Vadodara", "state": "Gujarat", "zone": "WR", "platform_count": 7},
    ]

    station_objects = {}
    for s in stations_data:
        obj = models.Station(**s)
        db.add(obj)
        db.flush()
        station_objects[s["code"]] = obj

    # 2. Fare Rules
    fare_rules_data = [
        {"coach_type": "1A", "base_fare_per_km": 3.8, "reservation_charge": 60.0, "superfast_charge": 75.0, "gst_percent": 5.0},
        {"coach_type": "2A", "base_fare_per_km": 2.4, "reservation_charge": 50.0, "superfast_charge": 45.0, "gst_percent": 5.0},
        {"coach_type": "3A", "base_fare_per_km": 1.6, "reservation_charge": 40.0, "superfast_charge": 45.0, "gst_percent": 5.0},
        {"coach_type": "CC", "base_fare_per_km": 1.4, "reservation_charge": 40.0, "superfast_charge": 45.0, "gst_percent": 5.0},
        {"coach_type": "EC", "base_fare_per_km": 2.8, "reservation_charge": 60.0, "superfast_charge": 75.0, "gst_percent": 5.0},
        {"coach_type": "SL", "base_fare_per_km": 0.65, "reservation_charge": 20.0, "superfast_charge": 30.0, "gst_percent": 0.0},
    ]
    for fr in fare_rules_data:
        db.add(models.FareRule(**fr))
    db.flush()

    # 3. Trains & Schedules
    trains_spec = [
        {
            "train_number": "12002",
            "name": "Bhopal Shatabdi Express",
            "train_type": "Shatabdi",
            "source": "NDLS",
            "destination": "BPL",
            "total_distance_km": 707.0,
            "runs_on_days": "Mon,Tue,Wed,Thu,Fri,Sat,Sun",
            "schedules": [
                {"station": "NDLS", "stop": 1, "arr": "06:00", "dep": "06:00", "day": 0, "pf": 1, "dist": 0.0},
                {"station": "AGC", "stop": 2, "arr": "07:50", "dep": "07:55", "day": 0, "pf": 1, "dist": 195.0},
                {"station": "GWL", "stop": 3, "arr": "09:23", "dep": "09:28", "day": 0, "pf": 2, "dist": 313.0},
                {"station": "VGLJ", "stop": 4, "arr": "10:45", "dep": "10:53", "day": 0, "pf": 1, "dist": 410.0},
                {"station": "BPL", "stop": 5, "arr": "14:40", "dep": "14:40", "day": 0, "pf": 1, "dist": 707.0},
            ],
            "coaches": [
                {"code": "E1", "type": "EC", "berths": 52},
                {"code": "C1", "type": "CC", "berths": 78},
                {"code": "C2", "type": "CC", "berths": 78},
                {"code": "C3", "type": "CC", "berths": 78},
                {"code": "C4", "type": "CC", "berths": 78},
            ]
        },
        {
            "train_number": "22436",
            "name": "Vande Bharat Express",
            "train_type": "Vande Bharat",
            "source": "NDLS",
            "destination": "BSB",
            "total_distance_km": 759.0,
            "runs_on_days": "Tue,Wed,Fri,Sat,Sun",
            "schedules": [
                {"station": "NDLS", "stop": 1, "arr": "06:00", "dep": "06:00", "day": 0, "pf": 16, "dist": 0.0},
                {"station": "CNB", "stop": 2, "arr": "10:08", "dep": "10:10", "day": 0, "pf": 1, "dist": 440.0},
                {"station": "PRYJ", "stop": 3, "arr": "12:08", "dep": "12:10", "day": 0, "pf": 6, "dist": 635.0},
                {"station": "BSB", "stop": 4, "arr": "14:00", "dep": "14:00", "day": 0, "pf": 1, "dist": 759.0},
            ],
            "coaches": [
                {"code": "EC1", "type": "EC", "berths": 52},
                {"code": "C1", "type": "CC", "berths": 78},
                {"code": "C2", "type": "CC", "berths": 78},
                {"code": "C3", "type": "CC", "berths": 78},
                {"code": "C4", "type": "CC", "berths": 78},
            ]
        },
        {
            "train_number": "12952",
            "name": "Mumbai Rajdhani Express",
            "train_type": "Rajdhani",
            "source": "NDLS",
            "destination": "CSMT",
            "total_distance_km": 1384.0,
            "runs_on_days": "Mon,Tue,Wed,Thu,Fri,Sat,Sun",
            "schedules": [
                {"station": "NDLS", "stop": 1, "arr": "16:55", "dep": "16:55", "day": 0, "pf": 3, "dist": 0.0},
                {"station": "BRC", "stop": 2, "arr": "03:14", "dep": "03:24", "day": 1, "pf": 2, "dist": 992.0},
                {"station": "ST", "stop": 3, "arr": "05:10", "dep": "05:15", "day": 1, "pf": 1, "dist": 1122.0},
                {"station": "CSMT", "stop": 4, "arr": "08:35", "dep": "08:35", "day": 1, "pf": 18, "dist": 1384.0},
            ],
            "coaches": [
                {"code": "H1", "type": "1A", "berths": 24},
                {"code": "A1", "type": "2A", "berths": 48},
                {"code": "A2", "type": "2A", "berths": 48},
                {"code": "B1", "type": "3A", "berths": 64},
                {"code": "B2", "type": "3A", "berths": 64},
                {"code": "B3", "type": "3A", "berths": 64},
            ]
        },
        {
            "train_number": "12009",
            "name": "Mumbai - Ahmedabad Shatabdi",
            "train_type": "Shatabdi",
            "source": "CSMT",
            "destination": "ADI",
            "total_distance_km": 493.0,
            "runs_on_days": "Mon,Tue,Wed,Thu,Fri,Sat",
            "schedules": [
                {"station": "CSMT", "stop": 1, "arr": "06:20", "dep": "06:20", "day": 0, "pf": 5, "dist": 0.0},
                {"station": "ST", "stop": 2, "arr": "09:30", "dep": "09:33", "day": 0, "pf": 1, "dist": 263.0},
                {"station": "BRC", "stop": 3, "arr": "11:00", "dep": "11:04", "day": 0, "pf": 2, "dist": 393.0},
                {"station": "ADI", "stop": 4, "arr": "12:45", "dep": "12:45", "day": 0, "pf": 1, "dist": 493.0},
            ],
            "coaches": [
                {"code": "E1", "type": "EC", "berths": 52},
                {"code": "C1", "type": "CC", "berths": 78},
                {"code": "C2", "type": "CC", "berths": 78},
                {"code": "C3", "type": "CC", "berths": 78},
            ]
        },
        {
            "train_number": "20608",
            "name": "Mysuru - Chennai Vande Bharat",
            "train_type": "Vande Bharat",
            "source": "SBC",
            "destination": "MAS",
            "total_distance_km": 359.0,
            "runs_on_days": "Mon,Tue,Wed,Fri,Sat,Sun",
            "schedules": [
                {"station": "SBC", "stop": 1, "arr": "14:45", "dep": "14:50", "day": 0, "pf": 7, "dist": 0.0},
                {"station": "MAS", "stop": 2, "arr": "19:20", "dep": "19:20", "day": 0, "pf": 2, "dist": 359.0},
            ],
            "coaches": [
                {"code": "EC1", "type": "EC", "berths": 52},
                {"code": "C1", "type": "CC", "berths": 78},
                {"code": "C2", "type": "CC", "berths": 78},
                {"code": "C3", "type": "CC", "berths": 78},
            ]
        }
    ]

    train_objects = {}
    for tdata in trains_spec:
        train_obj = models.Train(
            train_number=tdata["train_number"],
            name=tdata["name"],
            train_type=tdata["train_type"],
            source_station_id=station_objects[tdata["source"]].id,
            destination_station_id=station_objects[tdata["destination"]].id,
            total_distance_km=tdata["total_distance_km"],
            runs_on_days=tdata["runs_on_days"],
            is_active=True
        )
        db.add(train_obj)
        db.flush()
        train_objects[tdata["train_number"]] = train_obj

        # Add Schedules
        # pyrefly: ignore [not-iterable]
        for s in tdata["schedules"]:
            sch = models.Schedule(
                train_id=train_obj.id,
                station_id=station_objects[s["station"]].id,
                stop_number=s["stop"],
                arrival_time=s["arr"],
                departure_time=s["dep"],
                day_offset=s["day"],
                platform_number=s["pf"],
                distance_from_source_km=s["dist"]
            )
            db.add(sch)

        # Add Coaches and Berths
        # pyrefly: ignore [not-iterable]
        for c in tdata["coaches"]:
            coach_obj = models.Coach(
                train_id=train_obj.id,
                coach_code=c["code"],
                coach_type=c["type"],
                total_berths=c["berths"]
            )
            db.add(coach_obj)
            db.flush()

            # Generate individual berths
            # pyrefly: ignore [bad-index]
            berth_types = ["Lower", "Middle", "Upper", "Side Lower", "Side Upper"] if c["type"] in ["3A", "2A", "SL"] else ["Window", "Aisle", "Middle"]
            # pyrefly: ignore [bad-argument-type, bad-index, unsupported-operation]
            for b_num in range(1, c["berths"] + 1):
                b_type = berth_types[(b_num - 1) % len(berth_types)]
                berth_obj = models.Berth(
                    coach_id=coach_obj.id,
                    berth_number=b_num,
                    berth_type=b_type
                )
                db.add(berth_obj)

    db.flush()

    # 4. Users (Admin, Staff, Passengers)
    users_data = [
        {
            "email": "admin@smartrail.in",
            "password": "Admin@123",
            "full_name": "Chief Railway Controller (Admin)",
            "phone": "9800000001",
            "role": "admin"
        },
        {
            "email": "tte@smartrail.in",
            "password": "Staff@123",
            "full_name": "Rajesh Kumar (TTE)",
            "phone": "9811111111",
            "role": "staff",
            "badge": "TTE-NDLS-901",
            "designation": "Senior Travelling Ticket Examiner",
            "train_num": "12002",
            "station_code": "NDLS"
        },
        {
            "email": "inspector@smartrail.in",
            "password": "Staff@123",
            "full_name": "Suresh Patil (Gate Inspector)",
            "phone": "9822222222",
            "role": "staff",
            "badge": "GATE-CSMT-402",
            "designation": "Station Gate Inspector",
            "train_num": None,
            "station_code": "CSMT"
        },
        {
            "email": "kishore@example.com",
            "password": "Passenger@123",
            "full_name": "Kishore Raj",
            "phone": "9876543210",
            "role": "passenger"
        },
        {
            "email": "deepika@example.com",
            "password": "Passenger@123",
            "full_name": "Deepika Sharma",
            "phone": "9845012345",
            "role": "passenger"
        },
        {
            "email": "rahul@example.com",
            "password": "Passenger@123",
            "full_name": "Rahul Verma",
            "phone": "9123456780",
            "role": "passenger"
        }
    ]

    user_objects = {}
    for u in users_data:
        u_obj = models.User(
            email=u["email"],
            hashed_password=get_password_hash(u["password"]),
            full_name=u["full_name"],
            phone=u.get("phone"),
            role=u["role"],
            is_active=True
        )
        db.add(u_obj)
        db.flush()
        user_objects[u["email"]] = u_obj

        if u["role"] == "staff":
            assigned_train_id = train_objects[u["train_num"]].id if u.get("train_num") else None
            assigned_station_id = station_objects[u["station_code"]].id if u.get("station_code") else None
            sp = models.StaffProfile(
                user_id=u_obj.id,
                badge_number=u["badge"],
                designation=u["designation"],
                assigned_train_id=assigned_train_id,
                assigned_station_id=assigned_station_id
            )
            db.add(sp)

    db.flush()

    # 5. Pre-booked Reservations with Digital Smart QR Tickets
    # Reservation 1: Kishore Raj on Train 12002 (Bhopal Shatabdi)
    train_12002 = train_objects["12002"]
    today_str = datetime.date.today().strftime("%Y-%m-%d")
    tomorrow_str = (datetime.date.today() + datetime.timedelta(days=1)).strftime("%Y-%m-%d")

    res1 = models.Reservation(
        pnr="842-9182301",
        user_id=user_objects["kishore@example.com"].id,
        train_id=train_12002.id,
        source_station_id=station_objects["NDLS"].id,
        destination_station_id=station_objects["BPL"].id,
        journey_date=today_str,
        travel_class="CC",
        quota="General",
        total_fare=1075.0,
        booking_status="Confirmed",
        payment_status="Paid",
        payment_id="PAY_SIM_842918"
    )
    db.add(res1)
    db.flush()

    p1 = models.Passenger(
        reservation_id=res1.id,
        full_name="Kishore Raj",
        age=28,
        gender="Male",
        berth_preference="Window",
        allotted_coach="C2",
        allotted_berth_number=36,
        allotted_berth_type="Window",
        current_status="CNF",
        id_proof_type="Aadhaar",
        id_proof_number="XXXX-XXXX-4892"
    )
    db.add(p1)
    db.flush()

    tkt1 = models.Ticket(
        reservation_id=res1.id,
        passenger_id=p1.id,
        ticket_number="TKT-842918-01",
        security_signature=generate_security_signature(f"842-9182301:TKT-842918-01:{p1.id}"),
        is_cancelled=False
    )
    db.add(tkt1)
    db.flush()

    token_str1 = generate_qr_token_string("842-9182301", "TKT-842918-01")
    qr1 = models.QRToken(
        ticket_id=tkt1.id,
        reservation_id=res1.id,
        token_string=token_str1,
        token_hash=hash_token(token_str1),
        expires_at=datetime.datetime.utcnow() + datetime.timedelta(days=2),
        is_revoked=False
    )
    db.add(qr1)

    # Boarding record initialized to NOT_VERIFIED
    br1 = models.BoardingRecord(
        ticket_id=tkt1.id,
        passenger_id=p1.id,
        reservation_id=res1.id,
        boarding_status="NOT_VERIFIED"
    )
    db.add(br1)

    # Reservation 2: Deepika Sharma on Train 22436 (Vande Bharat Express)
    train_vande = train_objects["22436"]
    res2 = models.Reservation(
        pnr="714-4829103",
        user_id=user_objects["deepika@example.com"].id,
        train_id=train_vande.id,
        source_station_id=station_objects["NDLS"].id,
        destination_station_id=station_objects["BSB"].id,
        journey_date=today_str,
        travel_class="EC",
        quota="General",
        total_fare=2250.0,
        booking_status="Confirmed",
        payment_status="Paid",
        payment_id="PAY_SIM_714482"
    )
    db.add(res2)
    db.flush()

    p2 = models.Passenger(
        reservation_id=res2.id,
        full_name="Deepika Sharma",
        age=26,
        gender="Female",
        berth_preference="Window",
        allotted_coach="EC1",
        allotted_berth_number=18,
        allotted_berth_type="Window",
        current_status="CNF",
        id_proof_type="Passport",
        id_proof_number="P9823412"
    )
    db.add(p2)
    db.flush()

    tkt2 = models.Ticket(
        reservation_id=res2.id,
        passenger_id=p2.id,
        ticket_number="TKT-714482-01",
        security_signature=generate_security_signature(f"714-4829103:TKT-714482-01:{p2.id}"),
        is_cancelled=False
    )
    db.add(tkt2)
    db.flush()

    token_str2 = generate_qr_token_string("714-4829103", "TKT-714482-01")
    qr2 = models.QRToken(
        ticket_id=tkt2.id,
        reservation_id=res2.id,
        token_string=token_str2,
        token_hash=hash_token(token_str2),
        expires_at=datetime.datetime.utcnow() + datetime.timedelta(days=2),
        is_revoked=False
    )
    db.add(qr2)

    br2 = models.BoardingRecord(
        ticket_id=tkt2.id,
        passenger_id=p2.id,
        reservation_id=res2.id,
        boarding_status="NOT_VERIFIED"
    )
    db.add(br2)

    # Reservation 3: Multi-Passenger Booking (Rahul Verma + Priya Verma) on Mumbai Rajdhani (12952)
    train_rajdhani = train_objects["12952"]
    res3 = models.Reservation(
        pnr="592-3847291",
        user_id=user_objects["rahul@example.com"].id,
        train_id=train_rajdhani.id,
        source_station_id=station_objects["NDLS"].id,
        destination_station_id=station_objects["CSMT"].id,
        journey_date=tomorrow_str,
        travel_class="3A",
        quota="General",
        total_fare=4620.0,
        booking_status="Confirmed",
        payment_status="Paid",
        payment_id="PAY_SIM_592384"
    )
    db.add(res3)
    db.flush()

    passengers_r3 = [
        {"name": "Rahul Verma", "age": 31, "gender": "Male", "coach": "B1", "berth": 21, "type": "Lower"},
        {"name": "Priya Verma", "age": 29, "gender": "Female", "coach": "B1", "berth": 22, "type": "Middle"}
    ]
    for idx, p_item in enumerate(passengers_r3, start=1):
        p_obj = models.Passenger(
            reservation_id=res3.id,
            full_name=p_item["name"],
            age=p_item["age"],
            gender=p_item["gender"],
            berth_preference=p_item["type"],
            allotted_coach=p_item["coach"],
            allotted_berth_number=p_item["berth"],
            allotted_berth_type=p_item["type"],
            current_status="CNF",
            id_proof_type="Aadhaar",
            id_proof_number=f"XXXX-XXXX-98{idx}4"
        )
        db.add(p_obj)
        db.flush()

        tkt_obj = models.Ticket(
            reservation_id=res3.id,
            passenger_id=p_obj.id,
            ticket_number=f"TKT-592384-0{idx}",
            security_signature=generate_security_signature(f"592-3847291:TKT-592384-0{idx}:{p_obj.id}"),
            is_cancelled=False
        )
        db.add(tkt_obj)
        db.flush()

        t_str = generate_qr_token_string("592-3847291", f"TKT-592384-0{idx}")
        qr_obj = models.QRToken(
            ticket_id=tkt_obj.id,
            reservation_id=res3.id,
            token_string=t_str,
            token_hash=hash_token(t_str),
            expires_at=datetime.datetime.utcnow() + datetime.timedelta(days=2),
            is_revoked=False
        )
        db.add(qr_obj)

        br_obj = models.BoardingRecord(
            ticket_id=tkt_obj.id,
            passenger_id=p_obj.id,
            reservation_id=res3.id,
            boarding_status="NOT_VERIFIED"
        )
        db.add(br_obj)

    # Reservation 4: Cancelled ticket sample
    res4 = models.Reservation(
        pnr="312-8924018",
        user_id=user_objects["kishore@example.com"].id,
        train_id=train_12002.id,
        source_station_id=station_objects["NDLS"].id,
        destination_station_id=station_objects["AGC"].id,
        journey_date=today_str,
        travel_class="CC",
        quota="General",
        total_fare=520.0,
        booking_status="Cancelled",
        payment_status="Refunded",
        payment_id="PAY_SIM_CANCELLED",
        cancelled_at=datetime.datetime.utcnow()
    )
    db.add(res4)
    db.flush()

    p4 = models.Passenger(
        reservation_id=res4.id,
        full_name="Amit Kumar",
        age=34,
        gender="Male",
        berth_preference="Aisle",
        allotted_coach="C3",
        allotted_berth_number=12,
        allotted_berth_type="Aisle",
        current_status="CAN",
        id_proof_type="PAN Card",
        id_proof_number="ABCDE1234F"
    )
    db.add(p4)
    db.flush()

    tkt4 = models.Ticket(
        reservation_id=res4.id,
        passenger_id=p4.id,
        ticket_number="TKT-312892-01",
        security_signature=generate_security_signature(f"312-8924018:TKT-312892-01:{p4.id}"),
        is_cancelled=True
    )
    db.add(tkt4)
    db.flush()

    token_str4 = generate_qr_token_string("312-8924018", "TKT-312892-01")
    qr4 = models.QRToken(
        ticket_id=tkt4.id,
        reservation_id=res4.id,
        token_string=token_str4,
        token_hash=hash_token(token_str4),
        expires_at=datetime.datetime.utcnow() + datetime.timedelta(days=2),
        is_revoked=True
    )
    db.add(qr4)

    db.commit()
    print("[+] Database successfully initialized and seeded with all initial data.")
