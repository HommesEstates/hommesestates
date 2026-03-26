from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Site
from ..schemas import SiteCreate, SiteRead

router = APIRouter(prefix="/sites", tags=["sites"])


@router.post("", response_model=SiteRead)
def create_site(payload: SiteCreate, db: Session = Depends(get_db)):
    site = Site(name=payload.name, domain=payload.domain)
    db.add(site)
    db.commit()
    db.refresh(site)
    return site


@router.get("", response_model=list[SiteRead])
def list_sites(db: Session = Depends(get_db)):
    items = db.query(Site).order_by(Site.id.desc()).all()
    return items


@router.get("/{site_id}", response_model=SiteRead)
def get_site(site_id: int, db: Session = Depends(get_db)):
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    return site
