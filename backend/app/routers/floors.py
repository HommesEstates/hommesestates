from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from .. import schemas
from ..models import Floor, Block

router = APIRouter(prefix="/floors", tags=["floors"])


@router.post("", response_model=schemas.FloorRead)
def create_floor(payload: schemas.FloorCreate, db: Session = Depends(get_db)):
    blk = db.query(Block).filter(Block.id == payload.block_id).first()
    if not blk:
        raise HTTPException(status_code=404, detail="Block not found")
    fl = Floor(block_id=payload.block_id, name=payload.name, level_index=payload.level_index, sequence=payload.sequence)
    db.add(fl)
    db.commit()
    db.refresh(fl)
    return fl


@router.get("", response_model=list[schemas.FloorRead])
def list_floors(block_id: int | None = Query(default=None), db: Session = Depends(get_db)):
    q = db.query(Floor)
    if block_id:
        q = q.filter(Floor.block_id == block_id)
    items = q.order_by(Floor.level_index.asc(), Floor.sequence.asc(), Floor.id.desc()).all()
    return items


@router.get("/{floor_id}", response_model=schemas.FloorRead)
def get_floor(floor_id: int, db: Session = Depends(get_db)):
    fl = db.query(Floor).filter(Floor.id == floor_id).first()
    if not fl:
        raise HTTPException(status_code=404, detail="Floor not found")
    return fl
