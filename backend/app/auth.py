"""Authentication and authorization module for HommesEstates backend."""
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import jwt
from passlib.context import CryptContext

from .database import get_db
from .models import User, Partner
from .config import settings

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Bearer token scheme
security = HTTPBearer()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generate password hash."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=settings.jwt_expire_hours)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """Create JWT refresh token (7 days expiry)."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    """Decode and validate JWT token."""
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    """Authenticate user by username and password."""
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """Get current authenticated user from JWT token."""
    token = credentials.credentials
    payload = decode_token(token)
    
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Get current active user."""
    # Add any active status checks here if needed
    return current_user


def require_role(role: str):
    """Dependency to require specific role."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role != role and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation requires {role} role"
            )
        return current_user
    return role_checker


def require_staff(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to require staff or admin role."""
    if current_user.role not in ["staff", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation requires staff privileges"
        )
    return current_user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to require admin role."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation requires admin privileges"
        )
    return current_user


def get_current_partner(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Optional[Partner]:
    """Get partner associated with current user."""
    if current_user.partner_id:
        return db.query(Partner).filter(Partner.id == current_user.partner_id).first()
    return None


def create_user(
    db: Session,
    username: str,
    password: str,
    role: str = "staff",
    partner_id: Optional[int] = None,
) -> User:
    """Create a new user."""
    hashed_password = get_password_hash(password)
    user = User(
        username=username,
        hashed_password=hashed_password,
        role=role,
        partner_id=partner_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def create_partner_user(
    db: Session,
    partner: Partner,
    password: str,
) -> User:
    """Create user account for a partner (portal user)."""
    username = partner.email or f"partner_{partner.id}"
    return create_user(
        db=db,
        username=username,
        password=password,
        role="portal",
        partner_id=partner.id,
    )
