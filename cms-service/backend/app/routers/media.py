import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from ..config import get_settings
from ..database import get_db
from ..models import MediaAsset, Site
from ..schemas import MediaAssetRead

router = APIRouter(prefix="/media", tags=["media"])
settings = get_settings()


@router.post("/upload", response_model=MediaAssetRead)
def upload(site_id: int, f: UploadFile = File(...), db: Session = Depends(get_db)):
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    root = settings.MEDIA_STORAGE_PATH
    os.makedirs(root, exist_ok=True)
    subdir = os.path.join(root, uuid.uuid4().hex[:2])
    os.makedirs(subdir, exist_ok=True)
    name = f.filename or "file"
    basename = f"{uuid.uuid4().hex}_{name}"
    abs_path = os.path.join(subdir, basename)

    data = f.file.read()
    with open(abs_path, "wb") as out:
        out.write(data)

    rel = os.path.relpath(abs_path, root).replace("\\", "/")

    asset = MediaAsset(
        site_id=site_id,
        name=name,
        mime_type=f.content_type,
        size=len(data),
        file_path=rel,
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset


@router.get("", response_model=list[MediaAssetRead])
def list_media(site_id: int, db: Session = Depends(get_db)):
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    items = db.query(MediaAsset).filter(MediaAsset.site_id == site_id).order_by(MediaAsset.id.desc()).all()
    return items
