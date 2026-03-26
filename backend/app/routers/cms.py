from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional

from ..database import get_db
from ..deps import require_role
from .. import schemas
from ..models import (
    CmsSite,
    CmsPage,
    CmsPageVersion,
    CmsThemeToken,
    CmsPublishJob,
)

router = APIRouter(prefix="/cms", tags=["cms"])


@router.get("/sites", response_model=list[schemas.CmsSiteRead], dependencies=[Depends(require_role("staff"))])
def list_sites(limit: int = 100, offset: int = 0, db: Session = Depends(get_db)):
    q = db.query(CmsSite).order_by(CmsSite.id.desc())
    items = q.offset(offset).limit(limit).all()
    return items


@router.post("/sites", response_model=schemas.CmsSiteRead, dependencies=[Depends(require_role("staff"))])
def create_site(payload: schemas.CmsSiteCreate, db: Session = Depends(get_db)):
    s = CmsSite(name=payload.name, domain=payload.domain, status=payload.status or "dev")
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


@router.get("/sites/{site_id}/pages", response_model=list[schemas.CmsPageRead], dependencies=[Depends(require_role("staff"))])
def list_pages(site_id: int, query: Optional[str] = None, status: Optional[str] = None, limit: int = 100, offset: int = 0, db: Session = Depends(get_db)):
    site = db.query(CmsSite).filter(CmsSite.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    q = db.query(CmsPage).filter(CmsPage.site_id == site_id)
    if status:
        q = q.filter(CmsPage.status == status)
    if query:
        pat = f"%{query}%"
        q = q.filter((CmsPage.title.ilike(pat)) | (CmsPage.path.ilike(pat)))
    items = q.order_by(CmsPage.updated_at.desc(), CmsPage.id.desc()).offset(offset).limit(limit).all()
    return items


@router.post("/sites/{site_id}/pages", response_model=schemas.CmsPageRead, dependencies=[Depends(require_role("staff"))])
def create_page(site_id: int, payload: schemas.CmsPageCreate, db: Session = Depends(get_db)):
    site = db.query(CmsSite).filter(CmsSite.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    p = CmsPage(site_id=site_id, path=payload.path, title=payload.title, status=payload.status or "draft", content=payload.content)
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@router.put("/pages/{page_id}", response_model=schemas.CmsPageRead, dependencies=[Depends(require_role("staff"))])
def update_page(page_id: int, payload: schemas.CmsPageUpdate, db: Session = Depends(get_db)):
    p = db.query(CmsPage).filter(CmsPage.id == page_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Page not found")
    if payload.path is not None:
        p.path = payload.path
    if payload.title is not None:
        p.title = payload.title
    if payload.status is not None:
        p.status = payload.status
    if payload.content is not None:
        p.content = payload.content
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@router.get("/pages/{page_id}/versions", response_model=list[schemas.CmsPageVersionRead], dependencies=[Depends(require_role("staff"))])
def list_versions(page_id: int, db: Session = Depends(get_db)):
    p = db.query(CmsPage).filter(CmsPage.id == page_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Page not found")
    items = db.query(CmsPageVersion).filter(CmsPageVersion.page_id == page_id).order_by(CmsPageVersion.version_no.desc()).limit(200).all()
    return items


@router.post("/pages/{page_id}/versions", response_model=schemas.CmsPageVersionRead, dependencies=[Depends(require_role("staff"))])
def create_version(page_id: int, db: Session = Depends(get_db)):
    p = db.query(CmsPage).filter(CmsPage.id == page_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Page not found")
    max_ver = db.query(func.coalesce(func.max(CmsPageVersion.version_no), 0)).filter(CmsPageVersion.page_id == page_id).scalar()
    v = CmsPageVersion(page_id=page_id, version_no=int(max_ver) + 1, content=p.content)
    db.add(v)
    db.commit()
    db.refresh(v)
    return v


@router.post("/pages/{page_id}/versions/{version_id}/restore", response_model=schemas.CmsPageRead, dependencies=[Depends(require_role("staff"))])
def restore_version(page_id: int, version_id: int, db: Session = Depends(get_db)):
    p = db.query(CmsPage).filter(CmsPage.id == page_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Page not found")
    v = db.query(CmsPageVersion).filter(CmsPageVersion.id == version_id, CmsPageVersion.page_id == page_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Version not found")
    p.content = v.content
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@router.get("/sites/{site_id}/theme", response_model=schemas.CmsThemeTokensRead, dependencies=[Depends(require_role("staff"))])
def get_theme_tokens(site_id: int, db: Session = Depends(get_db)):
    site = db.query(CmsSite).filter(CmsSite.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    items = db.query(CmsThemeToken).filter(CmsThemeToken.site_id == site_id).all()
    tokens: dict[str, Optional[str]] = {x.key: x.value for x in items}
    return {"tokens": tokens}


@router.post("/sites/{site_id}/theme", response_model=schemas.CmsThemeTokensRead, dependencies=[Depends(require_role("staff"))])
def upsert_theme_tokens(site_id: int, payload: schemas.CmsThemeTokensUpsert, db: Session = Depends(get_db)):
    site = db.query(CmsSite).filter(CmsSite.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    existing = {x.key: x for x in db.query(CmsThemeToken).filter(CmsThemeToken.site_id == site_id).all()}
    for k, v in (payload.tokens or {}).items():
        row = existing.get(k)
        if row:
            row.value = v
            db.add(row)
        else:
            db.add(CmsThemeToken(site_id=site_id, key=k, value=v))
    db.commit()
    items = db.query(CmsThemeToken).filter(CmsThemeToken.site_id == site_id).all()
    tokens: dict[str, Optional[str]] = {x.key: x.value for x in items}
    return {"tokens": tokens}


@router.post("/pages/{page_id}/publish", response_model=schemas.CmsPublishJobRead, dependencies=[Depends(require_role("staff"))])
def publish_page(page_id: int, db: Session = Depends(get_db)):
    p = db.query(CmsPage).filter(CmsPage.id == page_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Page not found")
    j = CmsPublishJob(site_id=p.site_id, page_id=p.id, action="publish", status="pending")
    db.add(j)
    db.commit()
    db.refresh(j)
    return j


@router.post("/pages/{page_id}/unpublish", response_model=schemas.CmsPublishJobRead, dependencies=[Depends(require_role("staff"))])
def unpublish_page(page_id: int, db: Session = Depends(get_db)):
    p = db.query(CmsPage).filter(CmsPage.id == page_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Page not found")
    j = CmsPublishJob(site_id=p.site_id, page_id=p.id, action="unpublish", status="pending")
    db.add(j)
    db.commit()
    db.refresh(j)
    return j


@router.get("/publish-jobs", response_model=list[schemas.CmsPublishJobRead], dependencies=[Depends(require_role("staff"))])
def list_publish_jobs(site_id: Optional[int] = None, limit: int = 100, offset: int = 0, db: Session = Depends(get_db)):
    q = db.query(CmsPublishJob)
    if site_id:
        q = q.filter(CmsPublishJob.site_id == site_id)
    items = q.order_by(CmsPublishJob.id.desc()).offset(offset).limit(limit).all()
    return items
