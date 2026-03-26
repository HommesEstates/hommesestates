from typing import Optional
from jose import jwt, JWTError
from .config import get_settings

settings = get_settings()


def decode_access_token(token: str) -> Optional[dict]:
    if not token:
        return None
    try:
        if settings.JWT_PUBLIC_KEY:
            pub = settings.JWT_PUBLIC_KEY.replace("\\n", "\n")
            alg = settings.JWT_ALG or "RS256"
            return jwt.decode(token, pub, algorithms=[alg, "RS256"])  # type: ignore[arg-type]
        return None
    except JWTError:
        return None
