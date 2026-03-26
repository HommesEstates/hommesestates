"""Admin Offer Management API endpoints - Full implementation matching Odoo functionality."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

from ..database import get_db
from ..models import Offer, Suite, Partner, PaymentSchedule, PaymentTerm, Document, Property
from ..services.business_logic import OfferService, PaymentScheduleService
from .auth import get_current_user, require_staff

router = APIRouter(prefix="/admin/offers", tags=["admin-offers"])


# ============ Pydantic Schemas ============

class OfferCreateRequest(BaseModel):
    partner_id: int
    suite_id: int
    payment_term_id: Optional[int] = None
    validity_days: Optional[int] = 3
    note: Optional[str] = None


class OfferUpdateRequest(BaseModel):
    payment_term_id: Optional[int] = None
    validity_date: Optional[date] = None
    note: Optional[str] = None
    state: Optional[str] = None


class OfferResponse(BaseModel):
    id: int
    code: Optional[str]
    name: Optional[str]
    partner_id: int
    partner_name: Optional[str]
    suite_id: Optional[int]
    suite_name: Optional[str]
    suite_number: Optional[str]
    property_id: Optional[int]
    property_name: Optional[str]
    state: str
    validity_date: Optional[date]
    price_total: float
    amount_total: float
    currency: str
    payment_term_id: Optional[int]
    payment_status: str
    payment_percentage: float
    created_at: datetime
    confirmation_date: Optional[datetime]

    class Config:
        from_attributes = True


class PaymentScheduleResponse(BaseModel):
    id: int
    offer_id: int
    description: Optional[str]
    due_date: date
    amount: float
    paid_amount: float
    outstanding_amount: float
    percentage: float
    status: str

    class Config:
        from_attributes = True


# ============ CRUD Operations ============

@router.get("", response_model=List[OfferResponse])
def list_offers(
    state: Optional[str] = None,
    partner_id: Optional[int] = None,
    suite_id: Optional[int] = None,
    property_id: Optional[int] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    limit: int = 50,
    offset: int = 0,
    user=Depends(require_staff),
    db: Session = Depends(get_db),
):
    """List offers with filters."""
    query = db.query(Offer).filter(Offer.is_offer == 1)
    
    if state:
        query = query.filter(Offer.state == state)
    if partner_id:
        query = query.filter(Offer.partner_id == partner_id)
    if suite_id:
        query = query.filter(Offer.suite_id == suite_id)
    if property_id:
        query = query.filter(Offer.property_id == property_id)
    if from_date:
        query = query.filter(Offer.date_order >= from_date)
    if to_date:
        query = query.filter(Offer.date_order <= to_date)
    
    offers = query.order_by(Offer.id.desc()).offset(offset).limit(limit).all()
    
    result = []
    for offer in offers:
        partner = db.query(Partner).filter(Partner.id == offer.partner_id).first()
        property_obj = db.query(Property).filter(Property.id == offer.property_id).first() if offer.property_id else None
        
        result.append(OfferResponse(
            id=offer.id,
            code=offer.code,
            name=offer.name,
            partner_id=offer.partner_id,
            partner_name=partner.name if partner else None,
            suite_id=offer.suite_id,
            suite_name=offer.suite_name,
            suite_number=offer.suite_number,
            property_id=offer.property_id,
            property_name=property_obj.name if property_obj else None,
            state=offer.state,
            validity_date=offer.validity_date,
            price_total=offer.price_total or 0,
            amount_total=offer.amount_total or 0,
            currency=offer.currency or "NGN",
            payment_term_id=offer.payment_term_id,
            payment_status=offer.payment_status or "pending",
            payment_percentage=offer.payment_percentage or 0.0,
            created_at=offer.created_at,
            confirmation_date=offer.confirmation_date,
        ))
    
    return result


@router.get("/{offer_id}", response_model=OfferResponse)
def get_offer(offer_id: int, user=Depends(require_staff), db: Session = Depends(get_db)):
    """Get offer details."""
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    partner = db.query(Partner).filter(Partner.id == offer.partner_id).first()
    property_obj = db.query(Property).filter(Property.id == offer.property_id).first() if offer.property_id else None
    
    return OfferResponse(
        id=offer.id,
        code=offer.code,
        name=offer.name,
        partner_id=offer.partner_id,
        partner_name=partner.name if partner else None,
        suite_id=offer.suite_id,
        suite_name=offer.suite_name,
        suite_number=offer.suite_number,
        property_id=offer.property_id,
        property_name=property_obj.name if property_obj else None,
        state=offer.state,
        validity_date=offer.validity_date,
        price_total=offer.price_total or 0,
        amount_total=offer.amount_total or 0,
        currency=offer.currency or "NGN",
        payment_term_id=offer.payment_term_id,
        payment_status=offer.payment_status or "pending",
        payment_percentage=offer.payment_percentage or 0.0,
        created_at=offer.created_at,
        confirmation_date=offer.confirmation_date,
    )


@router.post("", response_model=OfferResponse)
def create_offer(request: OfferCreateRequest, user=Depends(require_staff), db: Session = Depends(get_db)):
    """Create a new offer."""
    try:
        offer = OfferService.create_offer(
            db=db,
            partner_id=request.partner_id,
            suite_id=request.suite_id,
            payment_term_id=request.payment_term_id,
            validity_days=request.validity_days or 3,
            note=request.note,
        )
        
        partner = db.query(Partner).filter(Partner.id == offer.partner_id).first()
        property_obj = db.query(Property).filter(Property.id == offer.property_id).first() if offer.property_id else None
        
        return OfferResponse(
            id=offer.id,
            code=offer.code,
            name=offer.name,
            partner_id=offer.partner_id,
            partner_name=partner.name if partner else None,
            suite_id=offer.suite_id,
            suite_name=offer.suite_name,
            suite_number=offer.suite_number,
            property_id=offer.property_id,
            property_name=property_obj.name if property_obj else None,
            state=offer.state,
            validity_date=offer.validity_date,
            price_total=offer.price_total or 0,
            amount_total=offer.amount_total or 0,
            currency=offer.currency or "NGN",
            payment_term_id=offer.payment_term_id,
            payment_status=offer.payment_status or "pending",
            payment_percentage=offer.payment_percentage or 0.0,
            created_at=offer.created_at,
            confirmation_date=offer.confirmation_date,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{offer_id}", response_model=OfferResponse)
def update_offer(
    offer_id: int,
    request: OfferUpdateRequest,
    user=Depends(require_staff),
    db: Session = Depends(get_db),
):
    """Update an offer."""
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    if request.payment_term_id is not None:
        offer.payment_term_id = request.payment_term_id
        # Regenerate payment schedule
        PaymentScheduleService.create_from_payment_term(db, offer)
    
    if request.validity_date is not None:
        offer.validity_date = request.validity_date
    
    if request.note is not None:
        offer.note = request.note
    
    if request.state is not None:
        if request.state not in ["draft", "sent", "sale", "cancelled"]:
            raise HTTPException(status_code=400, detail="Invalid state")
        offer.state = request.state
    
    db.add(offer)
    db.commit()
    db.refresh(offer)
    
    partner = db.query(Partner).filter(Partner.id == offer.partner_id).first()
    property_obj = db.query(Property).filter(Property.id == offer.property_id).first() if offer.property_id else None
    
    return OfferResponse(
        id=offer.id,
        code=offer.code,
        name=offer.name,
        partner_id=offer.partner_id,
        partner_name=partner.name if partner else None,
        suite_id=offer.suite_id,
        suite_name=offer.suite_name,
        suite_number=offer.suite_number,
        property_id=offer.property_id,
        property_name=property_obj.name if property_obj else None,
        state=offer.state,
        validity_date=offer.validity_date,
        price_total=offer.price_total or 0,
        amount_total=offer.amount_total or 0,
        currency=offer.currency or "NGN",
        payment_term_id=offer.payment_term_id,
        payment_status=offer.payment_status or "pending",
        payment_percentage=offer.payment_percentage or 0.0,
        created_at=offer.created_at,
        confirmation_date=offer.confirmation_date,
    )


@router.delete("/{offer_id}")
def delete_offer(offer_id: int, user=Depends(require_staff), db: Session = Depends(get_db)):
    """Delete an offer (cancel and free suite)."""
    try:
        offer = OfferService.cancel_offer(db, offer_id, free_suite=True)
        return {"ok": True, "message": "Offer cancelled and suite freed"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============ Workflow Actions ============

@router.post("/{offer_id}/send")
def send_offer(offer_id: int, user=Depends(require_staff), db: Session = Depends(get_db)):
    """Mark offer as sent to customer."""
    try:
        offer = OfferService.send_offer(db, offer_id)
        return {"ok": True, "state": offer.state}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{offer_id}/confirm")
def confirm_offer(offer_id: int, user=Depends(require_staff), db: Session = Depends(get_db)):
    """Confirm an offer (mark as sale)."""
    try:
        offer = OfferService.confirm_offer(db, offer_id)
        return {"ok": True, "state": offer.state}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{offer_id}/cancel")
def cancel_offer(
    offer_id: int,
    free_suite: bool = True,
    user=Depends(require_staff),
    db: Session = Depends(get_db),
):
    """Cancel an offer."""
    try:
        offer = OfferService.cancel_offer(db, offer_id, free_suite=free_suite)
        return {"ok": True, "state": offer.state}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============ Payment Schedules ============

@router.get("/{offer_id}/payment-schedules", response_model=List[PaymentScheduleResponse])
def get_payment_schedules(offer_id: int, user=Depends(require_staff), db: Session = Depends(get_db)):
    """Get payment schedules for an offer."""
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    schedules = db.query(PaymentSchedule).filter(
        PaymentSchedule.offer_id == offer_id
    ).order_by(PaymentSchedule.due_date).all()
    
    return [
        PaymentScheduleResponse(
            id=s.id,
            offer_id=s.offer_id,
            description=s.description,
            due_date=s.due_date,
            amount=s.amount,
            paid_amount=s.paid_amount,
            outstanding_amount=s.outstanding_amount,
            percentage=s.percentage,
            status=s.status,
        )
        for s in schedules
    ]


@router.post("/{offer_id}/payment-schedules/generate")
def generate_payment_schedules(
    offer_id: int,
    payment_term_id: Optional[int] = None,
    user=Depends(require_staff),
    db: Session = Depends(get_db),
):
    """Generate payment schedules for an offer."""
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    if payment_term_id:
        offer.payment_term_id = payment_term_id
        db.add(offer)
        db.flush()
    
    if not offer.payment_term_id:
        raise HTTPException(status_code=400, detail="Offer must have a payment term")
    
    schedules = PaymentScheduleService.create_from_payment_term(db, offer)
    
    return {
        "ok": True,
        "count": len(schedules),
        "schedules": [
            {
                "id": s.id,
                "due_date": str(s.due_date),
                "amount": s.amount,
            }
            for s in schedules
        ]
    }


# ============ Document Generation ============

@router.post("/{offer_id}/generate-offer-letter")
def generate_offer_letter(offer_id: int, user=Depends(require_staff), db: Session = Depends(get_db)):
    """Generate offer letter PDF."""
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    # In production, this would generate a PDF using templates
    # For now, create a document record
    doc = Document(
        name=f"Offer Letter - {offer.code or offer.id}",
        content_type="application/pdf",
        doc_type="offer_letter",
        size=0,
        file_path=f"offers/{offer.id}/offer_letter.pdf",
        offer_id=offer.id,
        partner_id=offer.partner_id,
    )
    db.add(doc)
    db.flush()
    
    offer.offer_document_id = doc.id
    db.add(offer)
    db.commit()
    
    return {
        "ok": True,
        "document_id": doc.id,
        "download_url": f"/api/documents/{doc.id}/download",
    }


@router.post("/{offer_id}/generate-allocation-letter")
def generate_allocation_letter(offer_id: int, user=Depends(require_staff), db: Session = Depends(get_db)):
    """Generate allocation letter PDF (for confirmed offers)."""
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    if offer.state != "sale":
        raise HTTPException(status_code=400, detail="Offer must be confirmed to generate allocation letter")
    
    # In production, this would generate a PDF using templates
    doc = Document(
        name=f"Allocation Letter - {offer.code or offer.id}",
        content_type="application/pdf",
        doc_type="allocation_letter",
        size=0,
        file_path=f"offers/{offer.id}/allocation_letter.pdf",
        offer_id=offer.id,
        partner_id=offer.partner_id,
    )
    db.add(doc)
    db.flush()
    
    offer.allocation_document_id = doc.id
    db.add(offer)
    db.commit()
    
    return {
        "ok": True,
        "document_id": doc.id,
        "download_url": f"/api/documents/{doc.id}/download",
    }


# ============ Statistics ============

@router.get("/stats/summary")
def offer_stats_summary(user=Depends(require_staff), db: Session = Depends(get_db)):
    """Get offer statistics summary."""
    total = db.query(Offer).filter(Offer.is_offer == 1).count()
    draft = db.query(Offer).filter(Offer.is_offer == 1, Offer.state == "draft").count()
    sent = db.query(Offer).filter(Offer.is_offer == 1, Offer.state == "sent").count()
    confirmed = db.query(Offer).filter(Offer.is_offer == 1, Offer.state == "sale").count()
    cancelled = db.query(Offer).filter(Offer.is_offer == 1, Offer.state == "cancelled").count()
    
    # Calculate total value
    confirmed_offers = db.query(Offer).filter(Offer.is_offer == 1, Offer.state == "sale").all()
    total_value = sum(o.amount_total or o.price_total or 0 for o in confirmed_offers)
    
    return {
        "total": total,
        "draft": draft,
        "sent": sent,
        "confirmed": confirmed,
        "cancelled": cancelled,
        "total_value": total_value,
    }
