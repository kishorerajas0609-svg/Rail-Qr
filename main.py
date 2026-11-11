from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import engine, Base, SessionLocal
from .seed_data import seed_database
from .routers import (
    auth_routes,
    train_routes,
    booking_routes,
    verification_routes,
    staff_routes,
    admin_routes,
)

# Initialize database schema
Base.metadata.create_all(bind=engine)

# Auto seed database on application startup
db = SessionLocal()
try:
    seed_database(db)
finally:
    db.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Intelligent Railway Ticket Verification, Cryptographic QR Generation & Passenger Management System",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for dev/testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth_routes.router, prefix=settings.API_PREFIX)
app.include_router(train_routes.router, prefix=settings.API_PREFIX)
app.include_router(booking_routes.router, prefix=settings.API_PREFIX)
app.include_router(verification_routes.router, prefix=settings.API_PREFIX)
app.include_router(staff_routes.router, prefix=settings.API_PREFIX)
app.include_router(admin_routes.router, prefix=settings.API_PREFIX)

@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "Online",
        "docs": "/docs",
        "message": "Welcome to Smart Rail QR API. Intelligent Ticket Verification & Passenger Management."
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "smart-rail-qr-backend"}
