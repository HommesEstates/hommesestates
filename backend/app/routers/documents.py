from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os

from ..database import get_db
from ..models import Document, DocumentAccessLog
from ..deps import require_role, get_current_user
from ..config import settings

router = APIRouter(prefix="/documents", tags=["documents"])


@router.get("/{doc_id}/download")
def download_document(doc_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    # ACL: staff can download anything; portal can download if owns the doc via partner_id
    if user.role != "staff":
        if not user.partner_id or (doc.partner_id and doc.partner_id != user.partner_id):
            raise HTTPException(status_code=403, detail="Forbidden")
    abs_path = os.path.abspath(os.path.join(settings.dms_storage_path, doc.file_path))
    if not abs_path.startswith(os.path.abspath(settings.dms_storage_path)):
        raise HTTPException(status_code=400, detail="Invalid path")
    if not os.path.exists(abs_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
    return FileResponse(
        abs_path,
        media_type=doc.content_type or "application/octet-stream",
        filename=doc.name,
    )

from datetime import datetime, timedelta, timezone
from secrets import token_urlsafe
from passlib.context import CryptContext
from ..models import DocumentShare
from ..security import verify_password, get_password_hash


@router.post("/{doc_id}/share")
def create_share_link(
    doc_id: int,
    expire_minutes: int | None = 1440,
    password: str | None = None,
    user=Depends(require_role("staff")),
    db: Session = Depends(get_db),
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    token = token_urlsafe(24)
    expires_at = None
    if expire_minutes and expire_minutes > 0:
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=expire_minutes)
    share = DocumentShare(
        document_id=doc.id,
        access_token=token,
        password_hash=(get_password_hash(password) if password else None),
        expires_at=expires_at,
    )
    db.add(share)
    db.commit()
    db.refresh(share)
    return {"token": token, "download_url": f"/documents/share/{token}/download"}


# naive in-memory rate limiter per token
RATE_LIMIT_WINDOW_SECONDS = 60
RATE_LIMIT_MAX_REQUESTS = 10
_rate_hits: dict[str, list[float]] = {}


@router.get("/share/{token}/download")
def public_download(token: str, password: str | None = None, request: Request = None, db: Session = Depends(get_db)):
    share = db.query(DocumentShare).filter(DocumentShare.access_token == token).first()
    if not share:
        # log not found
        _log_access(db, None, None, 404, request)
        raise HTTPException(status_code=404, detail="Share not found")
    # Rate limiting
    _enforce_rate_limit(token)
    # Normalize comparison to avoid naive/aware mismatch from DB backends
    if share.expires_at:
        now = datetime.utcnow()
        expires = share.expires_at
        if getattr(expires, "tzinfo", None) is not None:
            expires = expires.replace(tzinfo=None)
        if now > expires:
            _log_access(db, share.document_id, share.id, 410, request)
            raise HTTPException(status_code=410, detail="Share expired")
    if share.password_hash:
        if not password or not verify_password(password, share.password_hash):
            _log_access(db, share.document_id, share.id, 401, request)
            raise HTTPException(status_code=401, detail="Invalid password")
    doc = db.query(Document).filter(Document.id == share.document_id).first()
    if not doc:
        _log_access(db, share.document_id, share.id, 404, request)
        raise HTTPException(status_code=404, detail="Document not found")
    abs_path = os.path.abspath(os.path.join(settings.dms_storage_path, doc.file_path))
    if not abs_path.startswith(os.path.abspath(settings.dms_storage_path)):
        _log_access(db, share.document_id, share.id, 400, request)
        raise HTTPException(status_code=400, detail="Invalid path")
    if not os.path.exists(abs_path):
        _log_access(db, share.document_id, share.id, 404, request)
        raise HTTPException(status_code=404, detail="File not found on disk")
    _log_access(db, share.document_id, share.id, 200, request)
    return FileResponse(
        abs_path,
        media_type=doc.content_type or "application/octet-stream",
        filename=doc.name,
    )


def _log_access(db: Session, document_id: int | None, share_id: int | None, status: int, request: Request | None):
    try:
        ip = None
        ua = None
        if request is not None:
            ip = request.client.host if request.client else None
            ua = request.headers.get("user-agent")
        log = DocumentAccessLog(document_id=document_id or 0, share_id=share_id, ip_address=ip, user_agent=ua, status_code=status)
        db.add(log)
        db.commit()
    except Exception:
        try:
            db.rollback()
        except Exception:
            pass


def _enforce_rate_limit(token: str):
    import time
    now = time.time()
    hits = _rate_hits.get(token, [])
    # remove hits outside window
    hits = [t for t in hits if now - t <= RATE_LIMIT_WINDOW_SECONDS]
    if len(hits) >= RATE_LIMIT_MAX_REQUESTS:
        # still update and raise
        hits.append(now)
        _rate_hits[token] = hits
        raise HTTPException(status_code=429, detail="Too many requests")
    hits.append(now)
    _rate_hits[token] = hits
