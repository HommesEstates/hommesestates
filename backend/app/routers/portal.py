"""Customer Portal API endpoints - Full implementation matching Odoo portal functionality."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import date

from ..database import get_db
from ..models import Offer, Payment, Document, Invoice, PaymentSchedule, Suite, Property
from .. import schemas
from .auth import get_current_user

router = APIRouter(prefix="/portal", tags=["portal"])


# ============ Pydantic Schemas ============

class PortalOfferResponse(BaseModel):
    id: int
    code: Optional[str]
    name: Optional[str]
    state: str
    validity_date: Optional[date]
    price_total: float
    currency: str
    suite_name: Optional[str]
    suite_number: Optional[str]
    property_name: Optional[str]
    payment_status: str
    payment_percentage: float

    class Config:
        from_attributes = True


class PortalInvoiceResponse(BaseModel):
    id: int
    amount_total: float
    residual: float
    currency: str
    state: str

    class Config:
        from_attributes = True


class PortalPaymentResponse(BaseModel):
    id: int
    amount: float
    currency: str
    date: date
    state: str

    class Config:
        from_attributes = True


class PortalDocumentResponse(BaseModel):
    id: int
    name: str
    content_type: str
    doc_type: str
    size: int
    created_at: str

    class Config:
        from_attributes = True


class PortalPaymentScheduleResponse(BaseModel):
    id: int
    description: Optional[str]
    due_date: date
    amount: float
    paid_amount: float
    outstanding_amount: float
    status: str

    class Config:
        from_attributes = True


# ============ Dashboard ============

@router.get("/dashboard")
def portal_dashboard(user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Get customer dashboard summary."""
    if not user.partner_id:
        return {"offers": 0, "payments": 0, "documents": 0, "balance": 0.0}
    
    # Count offers
    offers_count = db.query(Offer).filter(Offer.partner_id == user.partner_id).count()
    
    # Count payments
    payments_count = db.query(Payment).filter(
        Payment.partner_id == user.partner_id,
        Payment.state == "posted"
    ).count()
    
    # Count documents
    documents_count = db.query(Document).filter(
        Document.partner_id == user.partner_id
    ).count()
    
    # Calculate balance (outstanding payments)
    outstanding = db.query(PaymentSchedule).join(Offer).filter(
        Offer.partner_id == user.partner_id,
        PaymentSchedule.status.in_(["pending", "partial", "overdue"])
    ).all()
    
    balance = sum(s.outstanding_amount for s in outstanding)
    
    return {
        "offers": offers_count,
        "payments": payments_count,
        "documents": documents_count,
        "balance": balance,
    }


# ============ Offers ============

@router.get("/offers", response_model=List[PortalOfferResponse])
def list_my_offers(
    state: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get customer's offers."""
    if not user.partner_id:
        return []
    
    query = db.query(Offer).filter(Offer.partner_id == user.partner_id)
    
    if state:
        query = query.filter(Offer.state == state)
    
    offers = query.order_by(Offer.id.desc()).offset(offset).limit(limit).all()
    
    result = []
    for offer in offers:
        # Get property name
        property_name = None
        if offer.property_id:
            prop = db.query(Property).filter(Property.id == offer.property_id).first()
            property_name = prop.name if prop else None
        
        result.append(PortalOfferResponse(
            id=offer.id,
            code=offer.code,
            name=offer.name,
            state=offer.state,
            validity_date=offer.validity_date,
            price_total=offer.price_total or offer.amount_total or 0,
            currency=offer.currency or "NGN",
            suite_name=offer.suite_name,
            suite_number=offer.suite_number,
            property_name=property_name,
            payment_status=offer.payment_status or "pending",
            payment_percentage=offer.payment_percentage or 0.0,
        ))
    
    return result


@router.get("/offers/{offer_id}", response_model=PortalOfferResponse)
def get_my_offer(offer_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Get specific offer details."""
    offer = db.query(Offer).filter(
        Offer.id == offer_id,
        Offer.partner_id == user.partner_id
    ).first()
    
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    property_name = None
    if offer.property_id:
        prop = db.query(Property).filter(Property.id == offer.property_id).first()
        property_name = prop.name if prop else None
    
    return PortalOfferResponse(
        id=offer.id,
        code=offer.code,
        name=offer.name,
        state=offer.state,
        validity_date=offer.validity_date,
        price_total=offer.price_total or offer.amount_total or 0,
        currency=offer.currency or "NGN",
        suite_name=offer.suite_name,
        suite_number=offer.suite_number,
        property_name=property_name,
        payment_status=offer.payment_status or "pending",
        payment_percentage=offer.payment_percentage or 0.0,
    )


@router.get("/offers/{offer_id}/payment-schedules", response_model=List[PortalPaymentScheduleResponse])
def get_offer_payment_schedules(
    offer_id: int,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get payment schedules for an offer."""
    offer = db.query(Offer).filter(
        Offer.id == offer_id,
        Offer.partner_id == user.partner_id
    ).first()
    
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    schedules = db.query(PaymentSchedule).filter(
        PaymentSchedule.offer_id == offer_id
    ).order_by(PaymentSchedule.due_date).all()
    
    return [
        PortalPaymentScheduleResponse(
            id=s.id,
            description=s.description,
            due_date=s.due_date,
            amount=s.amount,
            paid_amount=s.paid_amount,
            outstanding_amount=s.outstanding_amount,
            status=s.status,
        )
        for s in schedules
    ]


@router.post("/offers/{offer_id}/sign")
def sign_offer(
    offer_id: int,
    signature_data: str,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Sign an offer digitally."""
    offer = db.query(Offer).filter(
        Offer.id == offer_id,
        Offer.partner_id == user.partner_id
    ).first()
    
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    if offer.state not in ["draft", "sent"]:
        raise HTTPException(status_code=400, detail="Offer cannot be signed in current state")
    
    # Store signature on partner
    partner = db.query(Partner).filter(Partner.id == user.partner_id).first()
    if partner:
        partner.signature = signature_data.encode() if isinstance(signature_data, str) else signature_data
        db.add(partner)
    
    # Confirm offer
    from ..services.business_logic import OfferService
    OfferService.confirm_offer(db, offer_id)
    
    return {"ok": True, "message": "Offer signed successfully"}


# ============ Invoices ============

@router.get("/invoices", response_model=List[PortalInvoiceResponse])
def list_my_invoices(
    limit: int = 50,
    offset: int = 0,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get customer's invoices."""
    if not user.partner_id:
        return []
    
    invoices = db.query(Invoice).filter(
        Invoice.partner_id == user.partner_id
    ).order_by(Invoice.id.desc()).offset(offset).limit(limit).all()
    
    return [
        PortalInvoiceResponse(
            id=inv.id,
            amount_total=inv.amount_total,
            residual=inv.residual,
            currency=inv.currency,
            state="paid" if inv.residual == 0 else "open",
        )
        for inv in invoices
    ]


# ============ Payments ============

@router.get("/payments", response_model=List[PortalPaymentResponse])
def list_my_payments(
    limit: int = 50,
    offset: int = 0,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get customer's payments."""
    if not user.partner_id:
        return []
    
    payments = db.query(Payment).filter(
        Payment.partner_id == user.partner_id,
        Payment.state == "posted"
    ).order_by(Payment.id.desc()).offset(offset).limit(limit).all()
    
    return [
        PortalPaymentResponse(
            id=p.id,
            amount=p.amount,
            currency=p.currency,
            date=p.date,
            state=p.state,
        )
        for p in payments
    ]


# ============ Documents ============

@router.get("/documents", response_model=List[PortalDocumentResponse])
def list_my_documents(
    doc_type: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get customer's documents."""
    if not user.partner_id:
        return []
    
    query = db.query(Document).filter(Document.partner_id == user.partner_id)
    
    if doc_type:
        query = query.filter(Document.doc_type == doc_type)
    
    documents = query.order_by(Document.id.desc()).offset(offset).limit(limit).all()
    
    return [
        PortalDocumentResponse(
            id=d.id,
            name=d.name,
            content_type=d.content_type,
            doc_type=d.doc_type,
            size=d.size,
            created_at=str(d.created_at),
        )
        for d in documents
    ]


@router.get("/documents/{document_id}/download")
def download_document(
    document_id: int,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Download a document."""
    if not user.partner_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.partner_id == user.partner_id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Return file download URL
    return {
        "download_url": f"/api/documents/{document_id}/download",
        "name": document.name,
        "content_type": document.content_type,
        "size": document.size,
    }


# ============ Profile ============

@router.get("/profile")
def get_profile(user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Get customer profile."""
    if not user.partner_id:
        return {"error": "No partner associated"}
    
    partner = db.query(Partner).filter(Partner.id == user.partner_id).first()
    if not partner:
        return {"error": "Partner not found"}
    
    return {
        "id": partner.id,
        "name": partner.name,
        "email": partner.email,
        "phone": partner.phone,
        "street": partner.street,
        "city": partner.city,
        "state_id": partner.state_id,
        "country_id": partner.country_id,
    }


@router.put("/profile")
def update_profile(
    name: Optional[str] = None,
    phone: Optional[str] = None,
    street: Optional[str] = None,
    city: Optional[str] = None,
    state_id: Optional[int] = None,
    country_id: Optional[int] = None,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update customer profile."""
    if not user.partner_id:
        raise HTTPException(status_code=400, detail="No partner associated")
    
    partner = db.query(Partner).filter(Partner.id == user.partner_id).first()
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    if name:
        partner.name = name
    if phone:
        partner.phone = phone
    if street:
        partner.street = street
    if city:
        partner.city = city
    if state_id:
        partner.state_id = state_id
    if country_id:
        partner.country_id = country_id
    
    db.add(partner)
    db.commit()
    
    return {"ok": True, "message": "Profile updated successfully"}
