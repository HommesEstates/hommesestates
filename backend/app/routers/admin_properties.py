from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import require_role
from ..models import Property, Suite
from .. import schemas

router = APIRouter(prefix="/admin/properties", tags=["properties_admin"])


@router.get("", response_model=list[schemas.PropertyRead], dependencies=[Depends(require_role("staff"))])
def admin_list_properties(db: Session = Depends(get_db)):
    items = db.query(Property).order_by(Property.id.desc()).all()
    return items


@router.get("/{property_id}/suites", response_model=list[schemas.SuiteRead], dependencies=[Depends(require_role("staff"))])
def admin_list_property_suites(property_id: int, db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    items = (
        db.query(Suite)
        .filter(Suite.property_id == property_id)
        .order_by(Suite.id.desc())
        .limit(500)
        .all()
    )
    return items
