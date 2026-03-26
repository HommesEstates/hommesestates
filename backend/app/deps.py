from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from .database import get_db
from .models import User
from .security import decode_access_token, get_password_hash

bearer_scheme = HTTPBearer(auto_error=True)


def get_current_user(creds: HTTPAuthorizationCredentials = Security(bearer_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_access_token(creds.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    # Try to resolve by numeric local user id in 'sub'
    user = None
    sub = payload.get("sub")
    if sub is not None:
        try:
            user = db.query(User).filter(User.id == int(sub)).first()
        except (ValueError, TypeError):
            user = None

    # Fallback: resolve by username from Keycloak token
    if not user:
        preferred_username = (
            payload.get("preferred_username")
            or payload.get("username")
            or payload.get("email")
        )
        if preferred_username:
            user = db.query(User).filter(User.username == preferred_username).first()
            if not user:
                # Auto-provision a local user mapped to Keycloak principal
                # Derive role from realm roles, default to 'portal'
                role = payload.get("role")
                if not role:
                    roles = set((payload.get("realm_access") or {}).get("roles", []) or [])
                    if any(r in roles for r in ("admin", "staff")):
                        role = "staff"
                    else:
                        role = "portal"
                user = User(
                    username=preferred_username,
                    hashed_password=get_password_hash("external-sso"),
                    role=role,
                    partner_id=payload.get("partner_id") if payload.get("partner_id") is not None else None,
                )
                db.add(user)
                try:
                    db.commit()
                except Exception:
                    db.rollback()
                    raise
                db.refresh(user)

    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def require_role(*roles: str):
    def _checker(user: User = Depends(get_current_user)) -> User:
        if roles and user.role not in roles:
            raise HTTPException(status_code=403, detail="Insufficient role")
        return user
    return _checker
