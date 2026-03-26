from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from .database import get_db
from .security import decode_access_token

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(creds: HTTPAuthorizationCredentials = Security(bearer_scheme)):
    if not creds:
        raise HTTPException(status_code=401, detail="Missing token")
    payload = decode_access_token(creds.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload


def require_role(*roles: str):
    def _checker(user: dict = Depends(get_current_user)) -> dict:
        role = user.get("role")
        if not roles:
            return user
        if role in roles:
            return user
        # Fallback to realm roles from IdP
        realm_roles = set((user.get("realm_access") or {}).get("roles", []) or [])
        if any(r in realm_roles for r in roles):
            return user
        raise HTTPException(status_code=403, detail="Insufficient role")
    return _checker
