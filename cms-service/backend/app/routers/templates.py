from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Template, Site
from ..schemas import TemplateCreate, TemplateRead

router = APIRouter(prefix="/templates", tags=["templates"])


@router.post("", response_model=TemplateRead)
def create_template(payload: TemplateCreate, db: Session = Depends(get_db)):
    site = db.query(Site).filter(Site.id == payload.site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    t = Template(site_id=payload.site_id, name=payload.name, content=payload.content)
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


@router.get("", response_model=list[TemplateRead])
def list_templates(site_id: int | None = None, db: Session = Depends(get_db)):
    q = db.query(Template)
    if site_id:
        q = q.filter(Template.site_id == site_id)
    return q.order_by(Template.id.desc()).all()


@router.get("/{template_id}", response_model=TemplateRead)
def get_template(template_id: int, db: Session = Depends(get_db)):
    t = db.query(Template).filter(Template.id == template_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    return t
