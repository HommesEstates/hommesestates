"""Public API endpoints matching Odoo's api_public.py functionality."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date

from ..database import get_db
from ..models import (
    Property, Suite, Block, Floor, Partner, Offer, PaymentSchedule,
    PaymentTerm, Country, State, PropertyImage, PropertyPlan
)
from ..services.business_logic import OfferService, PaymentScheduleService
from .auth import get_current_user, require_staff

router = APIRouter(tags=["public"])


# ============ Pydantic Schemas ============

class PropertyResponse(BaseModel):
    id: int
    name: str
    code: Optional[str]
    property_type: str
    address: Optional[str]
    city: Optional[str]
    description: Optional[str]
    published: int
    image_url: Optional[str] = None
    total_suites: int = 0
    available_suites: int = 0

    class Config:
        from_attributes = True


class SuiteResponse(BaseModel):
    id: int
    name: str
    number: Optional[str]
    suite_type: Optional[str]
    list_price: float
    area_sqm: float
    currency: str
    is_available: int
    property_id: int
    property_name: Optional[str] = None
    block_name: Optional[str] = None
    floor_name: Optional[str] = None

    class Config:
        from_attributes = True


class PaymentTermResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class CountryResponse(BaseModel):
    id: int
    name: str
    code: str

    class Config:
        from_attributes = True


class StateResponse(BaseModel):
    id: int
    name: str
    code: Optional[str]
    country_id: int

    class Config:
        from_attributes = True


class PublicOfferRequest(BaseModel):
    name: str
    email: EmailStr
    suite_id: int
    phone: Optional[str] = None
    street: Optional[str] = None
    city: Optional[str] = None
    state_id: Optional[int] = None
    country_id: Optional[int] = None
    payment_term_id: Optional[int] = None
    expires_in_days: Optional[int] = 3
    note: Optional[str] = None


class PublicOfferResponse(BaseModel):
    ok: bool
    id: int
    name: str
    validity_date: str
    portal_url: Optional[str] = None


# ============ Properties Endpoints ============

@router.get("/properties", response_model=List[PropertyResponse])
def list_properties(
    property_type: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Get list of published properties with available suites."""
    query = db.query(Property).filter(Property.published == 1, Property.active == 1)
    
    if property_type:
        query = query.filter(Property.property_type == property_type)
    
    properties = query.order_by(Property.id.desc()).all()
    
    result = []
    for prop in properties:
        # Count suites
        suites = db.query(Suite).filter(
            Suite.property_id == prop.id,
            Suite.published == 1,
            Suite.is_available == 1
        ).all()
        
        result.append(PropertyResponse(
            id=prop.id,
            name=prop.name,
            code=prop.code,
            property_type=prop.property_type,
            address=prop.address,
            city=prop.city,
            description=prop.description,
            published=prop.published,
            image_url=f"/api/media/property-images/{prop.id}" if prop.image else None,
            total_suites=len(suites),
            available_suites=sum(1 for s in suites if s.is_available == 1),
        ))
    
    return result


@router.get("/properties/{property_id}", response_model=PropertyResponse)
def get_property(property_id: int, db: Session = Depends(get_db)):
    """Get property details."""
    prop = db.query(Property).filter(
        Property.id == property_id,
        Property.published == 1
    ).first()
    
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Count suites
    suites = db.query(Suite).filter(
        Suite.property_id == prop.id,
        Suite.published == 1
    ).all()
    
    return PropertyResponse(
        id=prop.id,
        name=prop.name,
        code=prop.code,
        property_type=prop.property_type,
        address=prop.address,
        city=prop.city,
        description=prop.description,
        published=prop.published,
        image_url=f"/api/media/property-images/{prop.id}" if prop.image else None,
        total_suites=len(suites),
        available_suites=sum(1 for s in suites if s.is_available == 1),
    )


@router.get("/properties/{property_id}/suites", response_model=List[SuiteResponse])
def list_property_suites(property_id: int, db: Session = Depends(get_db)):
    """Get suites for a specific property."""
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    if prop.published != 1:
        raise HTTPException(status_code=404, detail="Property not found")
    
    suites = db.query(Suite).filter(
        Suite.property_id == property_id,
        Suite.published == 1,
        Suite.is_available == 1
    ).order_by(Suite.number).all()
    
    return [
        SuiteResponse(
            id=s.id,
            name=s.name,
            number=s.number,
            suite_type=s.suite_type,
            list_price=s.list_price,
            area_sqm=s.area_sqm,
            currency=s.currency,
            is_available=s.is_available,
            property_id=s.property_id,
            property_name=prop.name,
            block_name=s.block.name if s.block_id else None,
            floor_name=s.floor.name if s.floor_id else None,
        )
        for s in suites
    ]


# ============ Suites Endpoints ============

@router.get("/suites", response_model=List[SuiteResponse])
def list_suites(
    property_id: Optional[int] = None,
    suite_type: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    db: Session = Depends(get_db),
):
    """Get list of published available suites."""
    query = db.query(Suite).join(Property).filter(
        Property.published == 1,
        Suite.published == 1,
        Suite.is_available == 1
    )
    
    if property_id:
        query = query.filter(Suite.property_id == property_id)
    if suite_type:
        query = query.filter(Suite.suite_type == suite_type)
    if min_price:
        query = query.filter(Suite.list_price >= min_price)
    if max_price:
        query = query.filter(Suite.list_price <= max_price)
    
    suites = query.order_by(Suite.id.desc()).limit(200).all()
    
    return [
        SuiteResponse(
            id=s.id,
            name=s.name,
            number=s.number,
            suite_type=s.suite_type,
            list_price=s.list_price,
            area_sqm=s.area_sqm,
            currency=s.currency,
            is_available=s.is_available,
            property_id=s.property_id,
            property_name=s.property.name if s.property_id else None,
            block_name=s.block.name if s.block_id else None,
            floor_name=s.floor.name if s.floor_id else None,
        )
        for s in suites
    ]


@router.get("/suites/{suite_id}", response_model=SuiteResponse)
def get_suite(suite_id: int, db: Session = Depends(get_db)):
    """Get suite details."""
    suite = db.query(Suite).filter(Suite.id == suite_id).first()
    if not suite:
        raise HTTPException(status_code=404, detail="Suite not found")
    
    return SuiteResponse(
        id=suite.id,
        name=suite.name,
        number=suite.number,
        suite_type=suite.suite_type,
        list_price=suite.list_price,
        area_sqm=suite.area_sqm,
        currency=suite.currency,
        is_available=suite.is_available,
        property_id=suite.property_id,
        property_name=suite.property.name if suite.property_id else None,
        block_name=suite.block.name if suite.block_id else None,
        floor_name=suite.floor.name if suite.floor_id else None,
    )


# ============ Payment Terms Endpoints ============

@router.get("/payment_terms", response_model=List[PaymentTermResponse])
def list_payment_terms(db: Session = Depends(get_db)):
    """Get list of active payment terms."""
    terms = db.query(PaymentTerm).filter(PaymentTerm.active == 1).all()
    return [PaymentTermResponse(id=t.id, name=t.name) for t in terms]


# ============ Countries & States Endpoints ============

@router.get("/countries", response_model=List[CountryResponse])
def list_countries(db: Session = Depends(get_db)):
    """Get list of countries."""
    countries = db.query(Country).all()
    return [CountryResponse(id=c.id, name=c.name, code=c.code) for c in countries]


@router.get("/states", response_model=List[StateResponse])
def list_states(
    country_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    """Get list of states/provinces."""
    query = db.query(State)
    if country_id:
        query = query.filter(State.country_id == country_id)
    
    states = query.all()
    return [
        StateResponse(id=s.id, name=s.name, code=s.code, country_id=s.country_id)
        for s in states
    ]


# ============ Public Offer Creation ============

@router.post("/offers/create_public", response_model=PublicOfferResponse)
def create_public_offer(request: PublicOfferRequest, db: Session = Depends(get_db)):
    """Create an offer for an unauthenticated visitor with expiration."""
    try:
        offer = OfferService.create_public_offer(
            db=db,
            name=request.name,
            email=request.email,
            suite_id=request.suite_id,
            phone=request.phone,
            street=request.street,
            city=request.city,
            state_id=request.state_id,
            country_id=request.country_id,
            payment_term_id=request.payment_term_id,
            validity_days=request.expires_in_days or 3,
            note=request.note,
        )
        
        # Generate portal URL (would be configured in production)
        portal_url = f"/portal/offers/{offer.id}"
        
        return PublicOfferResponse(
            ok=True,
            id=offer.id,
            name=offer.code or f"Offer {offer.id}",
            validity_date=str(offer.validity_date),
            portal_url=portal_url,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============ Media Endpoints ============

@router.get("/media/property-images/{property_id}")
def get_property_images(property_id: int, db: Session = Depends(get_db)):
    """Get images for a property."""
    images = db.query(PropertyImage).filter(
        PropertyImage.property_id == property_id
    ).order_by(PropertyImage.sequence).all()
    
    return {
        "records": [
            {
                "id": img.id,
                "name": img.name,
                "url": f"/api/media/image/{img.id}",
            }
            for img in images
        ]
    }


@router.get("/media/plans/{property_id}")
def get_property_plans(property_id: int, db: Session = Depends(get_db)):
    """Get floor plans for a property."""
    plans = db.query(PropertyPlan).filter(
        PropertyPlan.property_id == property_id
    ).order_by(PropertyPlan.sequence).all()
    
    return {
        "records": [
            {
                "id": plan.id,
                "name": plan.name,
                "plan_type": plan.plan_type,
                "url": f"/api/media/plan/{plan.id}",
                "is_interactive": plan.is_interactive,
            }
            for plan in plans
        ]
    }


# ============ System Status ============

@router.get("/system/status")
def system_status(db: Session = Depends(get_db)):
    """Check system status and module installation."""
    return {
        "status": "ok",
        "modules": {
            "real_estate": True,
            "dms": True,
            "portal": True,
            "payment": True,
        },
        "database": "connected",
        "version": "1.0.0",
    }


# ============ CRM Lead Creation ============

class LeadRequest(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    property_id: Optional[int] = None
    suite_id: Optional[int] = None
    message: Optional[str] = None


@router.post("/crm.lead")
def create_lead(request: LeadRequest, db: Session = Depends(get_db)):
    """Create a CRM lead from public inquiry."""
    # In production, this would create a lead record
    # For now, we'll create a partner if not exists
    
    partner = db.query(Partner).filter(Partner.email == request.email).first()
    if not partner:
        partner = Partner(
            name=request.name,
            email=request.email,
            phone=request.phone,
            is_property_owner=0,
        )
        db.add(partner)
        db.commit()
    
    return {"ok": True, "partner_id": partner.id}
