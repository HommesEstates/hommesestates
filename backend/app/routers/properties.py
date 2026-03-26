from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date

from ..database import get_db
from .. import schemas
from ..models import Property, Suite
from ..deps import require_role
from ..services.cache_service import (
    cached,
    get_query_cache,
    QueryCache
)

router = APIRouter(prefix="/properties", tags=["properties"])


@router.post("", response_model=schemas.PropertyRead)
def create_property(payload: schemas.PropertyCreate, db: Session = Depends(get_db), query_cache: QueryCache = Depends(get_query_cache)):
    prop = Property(
        name=payload.name,
        code=payload.code,
        property_type=payload.property_type,
        address=payload.address,
        description=payload.description,
    )
    db.add(prop)
    db.commit()
    db.refresh(prop)
    
    # Invalidate cache
    query_cache.invalidate_property(prop.id)
    
    return prop


@router.get("", response_model=list[schemas.PropertyRead])
@cached(ttl=600, key_prefix="properties")  # Cache for 10 minutes
def list_properties(db: Session = Depends(get_db)):
    # Public read-only list: restrict to properties that have at least one available suite
    items = (
        db.query(Property)
        .join(Suite, Suite.property_id == Property.id)
        .filter(Property.published == 1, Suite.is_available == 1, Suite.published == 1)
        .distinct()
        .order_by(Property.id.desc())
        .all()
    )
    return items


@router.get("/{property_id}", response_model=schemas.PropertyRead)
@cached(ttl=1800, key_prefix="properties")  # Cache for 30 minutes
def get_property(property_id: int, db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.id == property_id, Property.published == 1).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return prop


# Suites endpoints
@router.post("/{property_id}/suites", response_model=schemas.SuiteRead)
def create_suite(property_id: int, payload: schemas.SuiteCreate, db: Session = Depends(get_db)):
    if property_id != payload.property_id:
        raise HTTPException(status_code=400, detail="property_id mismatch")
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    suite = Suite(
        property_id=payload.property_id,
        block_id=payload.block_id,
        floor_id=payload.floor_id,
        name=payload.name,
        number=payload.number,
        currency=payload.currency,
        list_price=payload.list_price,
        area_sqm=payload.area_sqm,
    )
    db.add(suite)
    db.commit()
    db.refresh(suite)
    return suite


@router.get("/{property_id}/suites", response_model=list[schemas.SuiteRead])
def list_property_suites(property_id: int, db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    if prop.published != 1:
        raise HTTPException(status_code=404, detail="Property not found")
    items = (
        db.query(Suite)
        .filter(Suite.property_id == property_id, Suite.is_available == 1, Suite.published == 1)
        .order_by(Suite.id.desc())
        .all()
    )
    return items


# Flat suites listing (optional)
@router.get("/suites", response_model=list[schemas.SuiteRead])
def list_suites(db: Session = Depends(get_db)):
    items = (
        db.query(Suite)
        .join(Property, Property.id == Suite.property_id)
        .filter(Property.published == 1, Suite.published == 1, Suite.is_available == 1)
        .order_by(Suite.id.desc())
        .limit(200)
        .all()
    )
    return items


def _gen_numbers(req: schemas.NumberingPreviewRequest) -> list[str]:
    out: list[str] = []
    pattern = (req.pattern or "simple").lower()
    if pattern == "simple":
        n = req.start
        for _ in range(req.count):
            out.append(str(n).zfill(req.width))
            n += 1
    elif pattern == "floor_based":
        idx = req.floor_index if req.floor_index is not None else 1
        floor_num = idx if req.zero_based_ground else idx + 0
        n = req.start
        for _ in range(req.count):
            num = floor_num * req.floor_multiplier + n
            out.append(str(num).zfill(req.width))
            n += 1
    elif pattern == "alphanumeric":
        base = (req.floor_index if req.floor_index is not None else 1)
        start_c = ord((req.alpha_start or "A").upper()[:1])
        for i in range(req.count):
            out.append(f"{base}{chr(start_c + i)}")
    else:
        n = req.start
        for _ in range(req.count):
            out.append(str(n))
            n += 1
    return out


@router.post("/{property_id}/numbering/preview", response_model=schemas.NumberingPreviewResponse)
def numbering_preview(property_id: int, payload: schemas.NumberingPreviewRequest, db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    numbers = _gen_numbers(payload)
    return {"numbers": numbers}


@router.post("/{property_id}/suites/generate", response_model=list[schemas.SuiteRead])
def generate_suites(property_id: int, payload: schemas.SuitesGenerateRequest, db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    nums = _gen_numbers(payload)
    created = []
    for suite_num in nums:
        name = payload.name_template.replace("{suite_num}", suite_num)
        s = Suite(
            property_id=property_id,
            block_id=payload.block_id,
            floor_id=payload.floor_id,
            name=name,
            number=suite_num,
            currency=payload.currency,
            list_price=payload.list_price,
            area_sqm=payload.area_sqm,
        )
        db.add(s)
        db.flush()
        created.append(s)
    db.commit()
    for s in created:
        db.refresh(s)
    return created

 
@router.post("/{property_id}/publish", dependencies=[Depends(require_role("staff"))])
def publish_property(property_id: int, db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    prop.published = 1
    db.add(prop)
    db.commit()
    db.refresh(prop)
    return {"id": prop.id, "published": prop.published}


@router.post("/{property_id}/unpublish", dependencies=[Depends(require_role("staff"))])
def unpublish_property(property_id: int, db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    prop.published = 0
    db.add(prop)
    db.commit()
    db.refresh(prop)
    return {"id": prop.id, "published": prop.published}


@router.post("/{property_id}/suites/{suite_id}/publish", dependencies=[Depends(require_role("staff"))])
def publish_suite(property_id: int, suite_id: int, db: Session = Depends(get_db)):
    suite = (
        db.query(Suite)
        .filter(Suite.id == suite_id, Suite.property_id == property_id)
        .first()
    )
    if not suite:
        raise HTTPException(status_code=404, detail="Suite not found")
    suite.published = 1
    db.add(suite)
    db.commit()
    db.refresh(suite)
    return {"id": suite.id, "published": suite.published}


@router.post("/{property_id}/suites/{suite_id}/unpublish", dependencies=[Depends(require_role("staff"))])
def unpublish_suite(property_id: int, suite_id: int, db: Session = Depends(get_db)):
    suite = (
        db.query(Suite)
        .filter(Suite.id == suite_id, Suite.property_id == property_id)
        .first()
    )
    if not suite:
        raise HTTPException(status_code=404, detail="Suite not found")
    suite.published = 0
    db.add(suite)
    db.commit()
    db.refresh(suite)
    return {"id": suite.id, "published": suite.published}
