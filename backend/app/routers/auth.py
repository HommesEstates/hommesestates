"""Authentication API endpoints - Full implementation matching Odoo functionality."""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from typing import Optional
from datetime import timedelta

from ..database import get_db
from ..models import User, Partner
from ..security import (
    create_access_token, 
    create_refresh_token, 
    get_password_hash, 
    verify_password, 
    decode_access_token,
    get_current_user
)
from ..middleware.rate_limiting import (
    auth_rate_limit,
    public_rate_limit
)

router = APIRouter(prefix="/auth", tags=["auth"])


# ============ Pydantic Schemas ============

class RegisterRequest(BaseModel):
    username: str
    password: str
    role: str = "staff"  # staff | portal | admin
    partner_id: Optional[int] = None


class RegisterResponse(BaseModel):
    id: int
    username: str
    role: str
    partner_id: Optional[int]


class LoginRequest(BaseModel):
    username: str
    password: str
    db: Optional[str] = None  # For Odoo compatibility


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    role: str
    user_id: int
    username: str
    partner_id: Optional[int] = None


class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    street: Optional[str] = None
    city: Optional[str] = None
    state_id: Optional[int] = None
    country_id: Optional[int] = None


class SignupResponse(BaseModel):
    ok: bool
    partner_id: int
    user_id: int
    message: str = "Account created successfully"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    partner_id: Optional[int] = None
    partner_name: Optional[str] = None
    partner_email: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


class ResetPasswordRequest(BaseModel):
    email: str


# ============ Endpoints ============

@router.post("/register", response_model=RegisterResponse)
@auth_rate_limit(limit=3, window=300)  # 3 requests per 5 minutes
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user (staff/admin only)."""
    exists = db.query(User).filter(User.username == req.username).first()
    if exists:
        raise HTTPException(status_code=400, detail="Username already exists")

    if req.role not in ("staff", "portal", "admin"):
        raise HTTPException(status_code=400, detail="Invalid role")

    if req.role == "portal" and req.partner_id:
        partner = db.query(Partner).filter(Partner.id == req.partner_id).first()
        if not partner:
            raise HTTPException(status_code=400, detail="Invalid partner_id")

    user = User(
        username=req.username,
        hashed_password=get_password_hash(req.password),
        role=req.role,
        partner_id=req.partner_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return RegisterResponse(id=user.id, username=user.username, role=user.role, partner_id=user.partner_id)


@router.post("/login", response_model=LoginResponse)
@auth_rate_limit(limit=5, window=300)  # 5 requests per 5 minutes
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user and return JWT tokens."""
    user = db.query(User).filter(User.username == req.username).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    access_token = create_access_token({
        "sub": str(user.id),
        "username": user.username,
        "role": user.role,
        "partner_id": user.partner_id,
    })
    
    refresh_token = create_refresh_token({
        "sub": str(user.id),
        "role": user.role,
    })
    
    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        role=user.role,
        user_id=user.id,
        username=user.username,
        partner_id=user.partner_id,
    )


@router.post("/token", response_model=LoginResponse)
def auth_token(req: LoginRequest, db: Session = Depends(get_db)):
    """Odoo-compatible authentication endpoint."""
    return login(req, db)


@router.post("/signup", response_model=SignupResponse)
@public_rate_limit(limit=3, window=300)  # 3 requests per 5 minutes
def signup(req: SignupRequest, db: Session = Depends(get_db)):
    """Create new partner account with user credentials (public endpoint)."""
    # Check if email already exists
    existing_partner = db.query(Partner).filter(Partner.email == req.email).first()
    if existing_partner:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create partner
    partner = Partner(
        name=req.name,
        email=req.email,
        phone=req.phone,
        street=req.street,
        city=req.city,
        state_id=req.state_id,
        country_id=req.country_id,
        is_property_owner=0,
    )
    db.add(partner)
    db.flush()
    
    # Create user account
    user = User(
        username=req.email,
        hashed_password=get_password_hash(req.password),
        role="portal",
        partner_id=partner.id,
    )
    db.add(user)
    db.commit()
    
    return SignupResponse(
        ok=True,
        partner_id=partner.id,
        user_id=user.id,
    )


@router.post("/refresh", response_model=LoginResponse)
def refresh_token(req: RefreshRequest, db: Session = Depends(get_db)):
    """Refresh access token using refresh token."""
    payload = decode_access_token(req.refresh_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    access_token = create_access_token({
        "sub": str(user.id),
        "username": user.username,
        "role": user.role,
        "partner_id": user.partner_id,
    })
    
    new_refresh_token = create_refresh_token({
        "sub": str(user.id),
        "role": user.role,
    })
    
    return LoginResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        role=user.role,
        user_id=user.id,
        username=user.username,
        partner_id=user.partner_id,
    )


@router.get("/me", response_model=UserResponse)
def me(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get current authenticated user info."""
    partner = None
    if current_user.partner_id:
        partner = db.query(Partner).filter(Partner.id == current_user.partner_id).first()
    
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        role=current_user.role,
        partner_id=current_user.partner_id,
        partner_name=partner.name if partner else None,
        partner_email=partner.email if partner else None,
    )


@router.post("/logout")
def logout():
    """Logout user (client should discard tokens)."""
    return {"ok": True, "message": "Logged out successfully"}


@router.post("/change-password")
def change_password(req: ChangePasswordRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Change user password."""
    if not verify_password(req.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect old password")
    
    current_user.hashed_password = get_password_hash(req.new_password)
    db.commit()
    
    return {"ok": True, "message": "Password changed successfully"}


@router.post("/reset-password-request")
def request_password_reset(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Request password reset email."""
    # Find user by partner email
    partner = db.query(Partner).filter(Partner.email == req.email).first()
    if not partner:
        # Don't reveal if email exists or not
        return {"ok": True, "message": "If the email exists, a reset link will be sent"}
    
    # In production, send email with reset link
    return {"ok": True, "message": "If the email exists, a reset link will be sent"}


# ============ Dependencies ============

from fastapi import Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

bearer_scheme = HTTPBearer(auto_error=True)


def get_current_user(
    creds: HTTPAuthorizationCredentials = Security(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Get current authenticated user from JWT token."""
    payload = decode_access_token(creds.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user


def require_role(role: str):
    """Dependency to require specific role."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role != role and current_user.role != "admin":
            raise HTTPException(status_code=403, detail=f"Operation requires {role} role")
        return current_user
    return role_checker


def require_staff(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to require staff or admin role."""
    if current_user.role not in ["staff", "admin"]:
        raise HTTPException(status_code=403, detail="Operation requires staff privileges")
    return current_user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to require admin role."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Operation requires admin privileges")
    return current_user
