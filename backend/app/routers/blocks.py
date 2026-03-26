from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from .. import schemas
from ..models import Block, Property

router = APIRouter(prefix="/blocks", tags=["blocks"])


@router.post("", response_model=schemas.BlockRead)
def create_block(payload: schemas.BlockCreate, db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.id == payload.property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    blk = Block(property_id=payload.property_id, name=payload.name, sequence=payload.sequence)
    db.add(blk)
    db.commit()
    db.refresh(blk)
    return blk


@router.get("", response_model=list[schemas.BlockRead])
def list_blocks(property_id: int | None = Query(default=None), db: Session = Depends(get_db)):
    q = db.query(Block)
    if property_id:
        q = q.filter(Block.property_id == property_id)
    items = q.order_by(Block.sequence.asc(), Block.id.desc()).all()
    return items


@router.get("/{block_id}", response_model=schemas.BlockRead)
def get_block(block_id: int, db: Session = Depends(get_db)):
    blk = db.query(Block).filter(Block.id == block_id).first()
    if not blk:
        raise HTTPException(status_code=404, detail="Block not found")
    return blk
