from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..auth import (
    get_password_hash, verify_password, create_access_token, get_current_user
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=schemas.TokenResponse)
def register_user(payload: schemas.UserRegister, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists"
        )
    
    role = payload.role if payload.role in ["passenger", "staff", "admin"] else "passenger"
    
    user = models.User(
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name,
        phone=payload.phone,
        role=role,
        is_active=True
    )
    db.add(user)
    db.flush()

    if role == "staff" and payload.badge_number:
        staff_profile = models.StaffProfile(
            user_id=user.id,
            badge_number=payload.badge_number,
            designation=payload.designation or "TTE",
            assigned_train_id=payload.assigned_train_id,
            assigned_station_id=payload.assigned_station_id
        )
        db.add(staff_profile)

    db.commit()
    db.refresh(user)

    access_token = create_access_token(data={"sub": user.email, "role": user.role, "id": user.id})

    user_profile = schemas.UserProfile(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at,
        badge_number=user.staff_profile.badge_number if user.staff_profile else None,
        designation=user.staff_profile.designation if user.staff_profile else None,
        assigned_train_id=user.staff_profile.assigned_train_id if user.staff_profile else None,
        assigned_station_id=user.staff_profile.assigned_station_id if user.staff_profile else None
    )

    return schemas.TokenResponse(access_token=access_token, user=user_profile)

@router.post("/login", response_model=schemas.TokenResponse)
def login_user(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is disabled")

    access_token = create_access_token(data={"sub": user.email, "role": user.role, "id": user.id})

    user_profile = schemas.UserProfile(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at,
        badge_number=user.staff_profile.badge_number if user.staff_profile else None,
        designation=user.staff_profile.designation if user.staff_profile else None,
        assigned_train_id=user.staff_profile.assigned_train_id if user.staff_profile else None,
        assigned_station_id=user.staff_profile.assigned_station_id if user.staff_profile else None
    )

    return schemas.TokenResponse(access_token=access_token, user=user_profile)

@router.get("/me", response_model=schemas.UserProfile)
def get_me(current_user: models.User = Depends(get_current_user)):
    return schemas.UserProfile(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        phone=current_user.phone,
        role=current_user.role,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        badge_number=current_user.staff_profile.badge_number if current_user.staff_profile else None,
        designation=current_user.staff_profile.designation if current_user.staff_profile else None,
        assigned_train_id=current_user.staff_profile.assigned_train_id if current_user.staff_profile else None,
        assigned_station_id=current_user.staff_profile.assigned_station_id if current_user.staff_profile else None
    )
