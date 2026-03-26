from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Company

router = APIRouter(prefix="/company", tags=["company"])


@router.get("")
def get_company(db: Session = Depends(get_db)):
    comp = db.query(Company).first()
    if not comp:
        return {"exists": False}
    return {
        "id": comp.id,
        "name": comp.name,
        "ops_manager_name": comp.ops_manager_name,
        "ops_manager_title": comp.ops_manager_title,
        "has_ops_manager_signature": bool(comp.ops_manager_signature),
        "director_name": comp.director_name,
        "director_title": comp.director_title,
        "has_director_signature": bool(comp.director_signature),
    }


@router.post("/signatures")
async def upload_company_signatures(
    name: str | None = Form(None),
    ops_manager_name: str | None = Form(None),
    ops_manager_title: str | None = Form(None),
    director_name: str | None = Form(None),
    director_title: str | None = Form(None),
    ops_manager_signature: UploadFile | None = File(None),
    director_signature: UploadFile | None = File(None),
    db: Session = Depends(get_db),
):
    comp = db.query(Company).first()
    if not comp:
        comp = Company(name=name or "Hommes Estates")

    if name is not None:
        comp.name = name
    if ops_manager_name is not None:
        comp.ops_manager_name = ops_manager_name
    if ops_manager_title is not None:
        comp.ops_manager_title = ops_manager_title
    if director_name is not None:
        comp.director_name = director_name
    if director_title is not None:
        comp.director_title = director_title

    if ops_manager_signature is not None:
        comp.ops_manager_signature = await ops_manager_signature.read()
    if director_signature is not None:
        comp.director_signature = await director_signature.read()

    db.add(comp)
    db.commit()
    db.refresh(comp)
    return {
        "id": comp.id,
        "name": comp.name,
        "has_ops_manager_signature": bool(comp.ops_manager_signature),
        "has_director_signature": bool(comp.director_signature),
    }
