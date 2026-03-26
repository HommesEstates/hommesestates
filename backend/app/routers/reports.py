"""Reporting and Analytics API endpoints."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime, timedelta
from decimal import Decimal

from ..database import get_db
from ..models import (
    Offer, Payment, Invoice, PaymentSchedule, Property, Suite,
    Partner, Block, Floor
)
from .auth import require_staff

router = APIRouter(prefix="/reports", tags=["reports"])


# ============ Pydantic Schemas ============

class SalesSummary(BaseModel):
    total_offers: int
    confirmed_offers: int
    pending_offers: int
    cancelled_offers: int
    total_value: float
    confirmed_value: float
    average_offer_value: float


class PropertyStats(BaseModel):
    property_id: int
    property_name: str
    total_suites: int
    available_suites: int
    sold_suites: int
    availability_rate: float
    total_value: float
    sold_value: float


class PaymentStats(BaseModel):
    total_payments: int
    total_amount: float
    pending_schedules: int
    overdue_schedules: int
    pending_amount: float
    overdue_amount: float
    collection_rate: float


class CustomerStats(BaseModel):
    total_customers: int
    customers_with_offers: int
    customers_with_payments: int
    top_customers: List[dict]


class MonthlyTrend(BaseModel):
    month: str
    offers: int
    value: float
    payments: float


# ============ Sales Reports ============

@router.get("/sales/summary", response_model=SalesSummary)
def get_sales_summary(
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    property_id: Optional[int] = None,
    user=Depends(require_staff),
    db: Session = Depends(get_db),
):
    """Get sales summary statistics."""
    query = db.query(Offer).filter(Offer.is_offer == 1)
    
    if from_date:
        query = query.filter(Offer.date_order >= from_date)
    if to_date:
        query = query.filter(Offer.date_order <= to_date)
    if property_id:
        query = query.filter(Offer.property_id == property_id)
    
    offers = query.all()
    
    total_offers = len(offers)
    confirmed_offers = sum(1 for o in offers if o.state == "sale")
    pending_offers = sum(1 for o in offers if o.state in ["draft", "sent"])
    cancelled_offers = sum(1 for o in offers if o.state == "cancelled")
    
    total_value = sum(o.amount_total or o.price_total or 0 for o in offers)
    confirmed_value = sum(o.amount_total or o.price_total or 0 for o in offers if o.state == "sale")
    
    average_offer_value = total_value / total_offers if total_offers > 0 else 0
    
    return SalesSummary(
        total_offers=total_offers,
        confirmed_offers=confirmed_offers,
        pending_offers=pending_offers,
        cancelled_offers=cancelled_offers,
        total_value=total_value,
        confirmed_value=confirmed_value,
        average_offer_value=average_offer_value,
    )


@router.get("/sales/by-property", response_model=List[PropertyStats])
def get_sales_by_property(
    user=Depends(require_staff),
    db: Session = Depends(get_db),
):
    """Get sales statistics by property."""
    properties = db.query(Property).filter(Property.active == 1).all()
    
    result = []
    for prop in properties:
        suites = db.query(Suite).filter(Suite.property_id == prop.id).all()
        total_suites = len(suites)
        available_suites = sum(1 for s in suites if s.is_available == 1)
        sold_suites = total_suites - available_suites
        
        # Get offers for this property
        offers = db.query(Offer).filter(
            Offer.property_id == prop.id,
            Offer.state == "sale"
        ).all()
        
        total_value = sum(s.list_price for s in suites)
        sold_value = sum(o.amount_total or o.price_total or 0 for o in offers)
        
        availability_rate = (available_suites / total_suites * 100) if total_suites > 0 else 0
        
        result.append(PropertyStats(
            property_id=prop.id,
            property_name=prop.name,
            total_suites=total_suites,
            available_suites=available_suites,
            sold_suites=sold_suites,
            availability_rate=availability_rate,
            total_value=total_value,
            sold_value=sold_value,
        ))
    
    return result


@router.get("/sales/by-suite-type")
def get_sales_by_suite_type(
    user=Depends(require_staff),
    db: Session = Depends(get_db),
):
    """Get sales statistics by suite type."""
    suite_types = db.query(Suite.suite_type, func.count(Suite.id), func.sum(Suite.list_price)).group_by(Suite.suite_type).all()
    
    result = []
    for suite_type, count, total_price in suite_types:
        available = db.query(Suite).filter(
            Suite.suite_type == suite_type,
            Suite.is_available == 1
        ).count()
        
        result.append({
            "suite_type": suite_type or "Unknown",
            "total": count,
            "available": available,
            "sold": count - available,
            "total_value": float(total_price or 0),
        })
    
    return result


# ============ Payment Reports ============

@router.get("/payments/summary", response_model=PaymentStats)
def get_payment_summary(
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    user=Depends(require_staff),
    db: Session = Depends(get_db),
):
    """Get payment summary statistics."""
    query = db.query(Payment).filter(Payment.state == "posted")
    
    if from_date:
        query = query.filter(Payment.date >= from_date)
    if to_date:
        query = query.filter(Payment.date <= to_date)
    
    payments = query.all()
    
    total_payments = len(payments)
    total_amount = sum(p.amount for p in payments)
    
    # Payment schedules
    today = date.today()
    pending_schedules = db.query(PaymentSchedule).filter(
        PaymentSchedule.status == "pending"
    ).count()
    
    overdue_schedules = db.query(PaymentSchedule).filter(
        PaymentSchedule.status == "overdue"
    ).count()
    
    pending_amount = db.query(func.sum(PaymentSchedule.outstanding_amount)).filter(
        PaymentSchedule.status == "pending"
    ).scalar() or 0
    
    overdue_amount = db.query(func.sum(PaymentSchedule.outstanding_amount)).filter(
        PaymentSchedule.status == "overdue"
    ).scalar() or 0
    
    # Collection rate
    total_scheduled = db.query(func.sum(PaymentSchedule.amount)).filter(
        PaymentSchedule.due_date <= today
    ).scalar() or 0
    
    collected = db.query(func.sum(PaymentSchedule.paid_amount)).filter(
        PaymentSchedule.due_date <= today
    ).scalar() or 0
    
    collection_rate = (collected / total_scheduled * 100) if total_scheduled > 0 else 0
    
    return PaymentStats(
        total_payments=total_payments,
        total_amount=total_amount,
        pending_schedules=pending_schedules,
        overdue_schedules=overdue_schedules,
        pending_amount=float(pending_amount),
        overdue_amount=float(overdue_amount),
        collection_rate=collection_rate,
    )


@router.get("/payments/overdue")
def get_overdue_payments(
    limit: int = 50,
    user=Depends(require_staff),
    db: Session = Depends(get_db),
):
    """Get overdue payment schedules."""
    today = date.today()
    
    schedules = db.query(PaymentSchedule).join(Offer).join(Partner).filter(
        or_(
            PaymentSchedule.status == "overdue",
            and_(PaymentSchedule.status == "pending", PaymentSchedule.due_date < today)
        )
    ).order_by(PaymentSchedule.due_date).limit(limit).all()
    
    return {
        "records": [
            {
                "id": s.id,
                "offer_id": s.offer_id,
                "customer_name": s.offer.partner.name if s.offer and s.offer.partner else None,
                "due_date": str(s.due_date),
                "amount": s.amount,
                "outstanding": s.outstanding_amount,
                "days_overdue": (today - s.due_date).days if s.due_date else 0,
            }
            for s in schedules
        ]
    }


@router.get("/payments/upcoming")
def get_upcoming_payments(
    days: int = 30,
    limit: int = 50,
    user=Depends(require_staff),
    db: Session = Depends(get_db),
):
    """Get upcoming payment schedules."""
    today = date.today()
    end_date = today + timedelta(days=days)
    
    schedules = db.query(PaymentSchedule).join(Offer).join(Partner).filter(
        PaymentSchedule.status.in_(["pending", "partial"]),
        PaymentSchedule.due_date >= today,
        PaymentSchedule.due_date <= end_date
    ).order_by(PaymentSchedule.due_date).limit(limit).all()
    
    return {
        "records": [
            {
                "id": s.id,
                "offer_id": s.offer_id,
                "customer_name": s.offer.partner.name if s.offer and s.offer.partner else None,
                "due_date": str(s.due_date),
                "amount": s.amount,
                "outstanding": s.outstanding_amount,
            }
            for s in schedules
        ]
    }


# ============ Customer Reports ============

@router.get("/customers/summary", response_model=CustomerStats)
def get_customer_summary(
    user=Depends(require_staff),
    db: Session = Depends(get_db),
):
    """Get customer summary statistics."""
    total_customers = db.query(Partner).count()
    
    customers_with_offers = db.query(Offer.partner_id).filter(
        Offer.is_offer == 1
    ).distinct().count()
    
    customers_with_payments = db.query(Payment.partner_id).filter(
        Payment.state == "posted"
    ).distinct().count()
    
    # Top customers by total payments
    top_customers_query = db.query(
        Partner.id,
        Partner.name,
        func.sum(Payment.amount).label("total_paid")
    ).join(Payment).filter(
        Payment.state == "posted"
    ).group_by(Partner.id).order_by(func.sum(Payment.amount).desc()).limit(10).all()
    
    top_customers = [
        {
            "id": c.id,
            "name": c.name,
            "total_paid": float(c.total_paid),
        }
        for c in top_customers_query
    ]
    
    return CustomerStats(
        total_customers=total_customers,
        customers_with_offers=customers_with_offers,
        customers_with_payments=customers_with_payments,
        top_customers=top_customers,
    )


# ============ Trend Reports ============

@router.get("/trends/monthly", response_model=List[MonthlyTrend])
def get_monthly_trends(
    months: int = 12,
    user=Depends(require_staff),
    db: Session = Depends(get_db),
):
    """Get monthly sales and payment trends."""
    result = []
    today = date.today()
    
    for i in range(months - 1, -1, -1):
        month_start = today.replace(day=1) - timedelta(days=i * 30)
        month_start = month_start.replace(day=1)
        
        # Approximate month end
        if month_start.month == 12:
            month_end = month_start.replace(year=month_start.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            month_end = month_start.replace(month=month_start.month + 1, day=1) - timedelta(days=1)
        
        # Offers in month
        offers = db.query(Offer).filter(
            Offer.is_offer == 1,
            Offer.date_order >= month_start,
            Offer.date_order <= month_end
        ).all()
        
        offer_count = len(offers)
        offer_value = sum(o.amount_total or o.price_total or 0 for o in offers if o.state == "sale")
        
        # Payments in month
        payments = db.query(Payment).filter(
            Payment.state == "posted",
            Payment.date >= month_start,
            Payment.date <= month_end
        ).all()
        
        payment_total = sum(p.amount for p in payments)
        
        result.append(MonthlyTrend(
            month=month_start.strftime("%Y-%m"),
            offers=offer_count,
            value=offer_value,
            payments=payment_total,
        ))
    
    return result


# ============ Dashboard Data ============

@router.get("/dashboard")
def get_dashboard_data(
    user=Depends(require_staff),
    db: Session = Depends(get_db),
):
    """Get consolidated dashboard data."""
    today = date.today()
    month_start = today.replace(day=1)
    
    # Sales this month
    monthly_offers = db.query(Offer).filter(
        Offer.is_offer == 1,
        Offer.date_order >= month_start,
        Offer.state == "sale"
    ).all()
    
    monthly_sales = sum(o.amount_total or o.price_total or 0 for o in monthly_offers)
    
    # Payments this month
    monthly_payments = db.query(func.sum(Payment.amount)).filter(
        Payment.state == "posted",
        Payment.date >= month_start
    ).scalar() or 0
    
    # Overdue payments
    overdue_count = db.query(PaymentSchedule).filter(
        PaymentSchedule.status == "overdue"
    ).count()
    
    overdue_amount = db.query(func.sum(PaymentSchedule.outstanding_amount)).filter(
        PaymentSchedule.status == "overdue"
    ).scalar() or 0
    
    # Available suites
    total_suites = db.query(Suite).count()
    available_suites = db.query(Suite).filter(Suite.is_available == 1).count()
    
    # Recent offers
    recent_offers = db.query(Offer).filter(
        Offer.is_offer == 1
    ).order_by(Offer.id.desc()).limit(5).all()
    
    return {
        "monthly_sales": monthly_sales,
        "monthly_payments": float(monthly_payments),
        "overdue_count": overdue_count,
        "overdue_amount": float(overdue_amount),
        "total_suites": total_suites,
        "available_suites": available_suites,
        "occupancy_rate": ((total_suites - available_suites) / total_suites * 100) if total_suites > 0 else 0,
        "recent_offers": [
            {
                "id": o.id,
                "code": o.code,
                "customer": o.partner.name if o.partner else None,
                "amount": o.amount_total or o.price_total,
                "state": o.state,
            }
            for o in recent_offers
        ],
    }


# ============ Export Endpoints ============

@router.get("/export/offers")
def export_offers(
    state: Optional[str] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    format: str = "json",
    user=Depends(require_staff),
    db: Session = Depends(get_db),
):
    """Export offers data."""
    query = db.query(Offer).filter(Offer.is_offer == 1)
    
    if state:
        query = query.filter(Offer.state == state)
    if from_date:
        query = query.filter(Offer.date_order >= from_date)
    if to_date:
        query = query.filter(Offer.date_order <= to_date)
    
    offers = query.order_by(Offer.id.desc()).limit(1000).all()
    
    data = [
        {
            "id": o.id,
            "code": o.code,
            "customer": o.partner.name if o.partner else None,
            "email": o.partner.email if o.partner else None,
            "suite": o.suite_name,
            "property": o.property.name if o.property_id and o.property else None,
            "amount": o.amount_total or o.price_total,
            "state": o.state,
            "date": str(o.date_order) if o.date_order else None,
            "validity_date": str(o.validity_date) if o.validity_date else None,
        }
        for o in offers
    ]
    
    return {"data": data, "count": len(data), "format": format}


@router.get("/export/payments")
def export_payments(
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    format: str = "json",
    user=Depends(require_staff),
    db: Session = Depends(get_db),
):
    """Export payments data."""
    query = db.query(Payment).filter(Payment.state == "posted")
    
    if from_date:
        query = query.filter(Payment.date >= from_date)
    if to_date:
        query = query.filter(Payment.date <= to_date)
    
    payments = query.order_by(Payment.id.desc()).limit(1000).all()
    
    data = [
        {
            "id": p.id,
            "customer": p.partner.name if p.partner else None,
            "amount": p.amount,
            "currency": p.currency,
            "date": str(p.date),
            "state": p.state,
        }
        for p in payments
    ]
    
    return {"data": data, "count": len(data), "format": format}
