import hmac
import hashlib
import uuid
import io
import base64
import json
import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers import RoundedModuleDrawer
from qrcode.image.styles.colormasks import RadialGradiantColorMask, SolidFillColorMask
from .config import settings

def generate_security_signature(data_str: str) -> str:
    """Generate HMAC-SHA256 signature for ticket or token validation"""
    return hmac.new(
        settings.QR_SECRET_KEY.encode('utf-8'),
        data_str.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

def verify_security_signature(data_str: str, signature: str) -> bool:
    """Verify HMAC signature match in constant time"""
    expected_sig = generate_security_signature(data_str)
    return hmac.compare_digest(expected_sig, signature)

def generate_qr_token_string(pnr: str, ticket_number: str) -> str:
    """Create a high-entropy, collision-free token string"""
    unique_entropy = uuid.uuid4().hex[:16]
    return f"SRQR-{pnr}-{ticket_number}-{unique_entropy}"

def hash_token(token_string: str) -> str:
    """SHA-256 hash for internal indexing"""
    return hashlib.sha256(token_string.encode('utf-8')).hexdigest()

def create_qr_code_base64(payload_text: str) -> str:
    """
    Generate high-quality QR code image with rounded modules and dark railway styling,
    returned as base64 data URI string.
    """
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=3,
    )
    qr.add_data(payload_text)
    qr.make(fit=True)

    # Use clean, crisp styling
    img = qr.make_image(fill_color="#0f172a", back_color="#ffffff")

    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    
    img_b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{img_b64}"

def build_qr_payload(token_string: str, pnr: str, ticket_number: str) -> str:
    """
    Construct the verifiable QR payload.
    Does NOT include private personal info; only cryptographic identifier, PNR, and HMAC signature.
    """
    signature = generate_security_signature(f"{token_string}:{pnr}:{ticket_number}")
    payload = {
        "app": "SmartRailQR",
        "ver": "1.0",
        "token": token_string,
        "pnr": pnr,
        "tkt": ticket_number,
        "sig": signature
    }
    return json.dumps(payload, separators=(',', ':'))

def parse_qr_payload(raw_scan: str) -> dict:
    """
    Parse scanned QR text which can be:
    1. JSON object with 'token', 'pnr', 'sig'
    2. Direct token string starting with 'SRQR-'
    3. URL format 'https://smartrail.in/verify?token=...'
    """
    raw_scan = raw_scan.strip()
    
    # Try parsing as JSON
    if raw_scan.startswith("{") and raw_scan.endswith("}"):
        try:
            return json.loads(raw_scan)
        except Exception:
            pass

    # Try parsing URL
    if "token=" in raw_scan:
        from urllib.parse import urlparse, parse_qs
        parsed = urlparse(raw_scan)
        qs = parse_qs(parsed.query)
        token = qs.get("token", [None])[0]
        pnr = qs.get("pnr", [None])[0]
        return {"token": token, "pnr": pnr}

    # Direct token string
    return {"token": raw_scan}
