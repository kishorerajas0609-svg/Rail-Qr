import os
from pydantic_settings import BaseSettings

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Rail QR System"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Secret keys
    SECRET_KEY: str = os.getenv("SECRET_KEY", "smart-rail-qr-super-secure-production-key-2026-xyz-987654321")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    
    # QR verification token signing secret
    QR_SECRET_KEY: str = os.getenv("QR_SECRET_KEY", "smart-rail-qr-hmac-verification-secret-key-4321-zyx")
    
    # Database (resolves to backend/smart_rail.db reliably)
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'smart_rail.db').replace(os.sep, '/')}")
    
    # CORS
    ALLOWED_ORIGINS: list = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]

    class Config:
        case_sensitive = True

settings = Settings()
