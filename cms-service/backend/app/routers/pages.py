from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Page, Site
from ..schemas import PageCreate, PageRead

router = APIRouter(prefix="/pages", tags=["pages"])


@router.post("", response_model=PageRead)
def create_page(payload: PageCreate, db: Session = Depends(get_db)):
    site = db.query(Site).filter(Site.id == payload.site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    page = Page(
        site_id=payload.site_id,
        slug=payload.slug,
        title=payload.title,
        content=payload.content,
        status="draft",
    )
    db.add(page)
    db.commit()
    db.refresh(page)
    return page


@router.get("", response_model=list[PageRead])
def list_pages(site_id: int | None = None, db: Session = Depends(get_db)):
    q = db.query(Page)
    if site_id:
        q = q.filter(Page.site_id == site_id)
    return q.order_by(Page.id.desc()).all()


@router.get("/{page_id}", response_model=PageRead)
def get_page(page_id: int, db: Session = Depends(get_db)):
    page = db.query(Page).filter(Page.id == page_id).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page


@router.get("/by-slug/{site_id}/{slug}", response_model=PageRead)
def get_page_by_slug(site_id: int, slug: str, db: Session = Depends(get_db)):
    page = (
        db.query(Page)
        .filter(Page.site_id == site_id, Page.slug == slug, Page.status == "published")
        .first()
    )
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page


@router.post("/{page_id}/publish", response_model=PageRead)
def publish_page(page_id: int, db: Session = Depends(get_db)):
    page = db.query(Page).filter(Page.id == page_id).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    page.status = "published"
    page.published_at = datetime.utcnow()
    db.add(page)
    db.commit()
    db.refresh(page)
    return page
