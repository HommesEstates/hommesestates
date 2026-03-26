from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Partner
from .. import schemas

router = APIRouter(prefix="/partners", tags=["partners"])


@router.post("", response_model=schemas.PartnerRead)
def create_partner(payload: schemas.PartnerCreate, db: Session = Depends(get_db)):
    p = Partner(name=payload.name, email=payload.email)
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@router.get("", response_model=list[schemas.PartnerRead])
def list_partners(db: Session = Depends(get_db)):
    items = db.query(Partner).order_by(Partner.id.desc()).limit(100).all()
    return items


@router.get("/{partner_id}", response_model=schemas.PartnerRead)
def get_partner(partner_id: int, db: Session = Depends(get_db)):
    p = db.query(Partner).filter(Partner.id == partner_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Partner not found")
    return p


@router.post("/{partner_id}/signature")
async def upload_partner_signature(partner_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    p = db.query(Partner).filter(Partner.id == partner_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Partner not found")
    content = await file.read()
    p.signature = content
    db.add(p)
    db.commit()
    return {"id": p.id, "has_signature": True}
