from datetime import date, datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct

from ..database import get_db
from ..models import Property, Block, Floor, Suite, Offer, Invoice, Payment, PaymentSchedule
from ..deps import require_role

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/kpis")
def get_kpis(
    days: int = 30,
    property_id: int | None = None,
    user=Depends(require_role("staff")),
    db: Session = Depends(get_db),
):
    # Basic counts
    props = db.query(func.count(Property.id)).scalar() or 0
    blocks = db.query(func.count(Block.id)).scalar() or 0
    floors = db.query(func.count(Floor.id)).scalar() or 0
    suites_q = db.query(func.count(Suite.id))
    if property_id:
        suites_q = suites_q.filter(Suite.property_id == property_id)
    suites = suites_q.scalar() or 0

    sa_q = db.query(func.count(Suite.id)).filter(Suite.is_available == 1)
    su_q = db.query(func.count(Suite.id)).filter(Suite.is_available == 0)
    if property_id:
        sa_q = sa_q.filter(Suite.property_id == property_id)
        su_q = su_q.filter(Suite.property_id == property_id)
    suites_available = sa_q.scalar() or 0
    suites_unavailable = su_q.scalar() or 0

    # Offers by state
    offer_counts = {s: 0 for s in ("draft", "sent", "sale", "cancelled")}
    offer_base = db.query(Offer)
    if property_id:
        # limit offers to those linked to suites under the property
        offer_base = offer_base.join(Suite, Suite.id == Offer.suite_id).filter(Suite.property_id == property_id)
    for state, cnt in offer_base.with_entities(Offer.state, func.count(Offer.id)).group_by(Offer.state).all():
        offer_counts[state or "draft"] = cnt

    # Payments and Invoices status
    schedules_counts = {s: 0 for s in ("pending", "partial", "overdue", "paid")}
    for st, cnt in (
        db.query(PaymentSchedule.status, func.count(PaymentSchedule.id))
        .group_by(PaymentSchedule.status)
        .all()
    ):
        schedules_counts[st or "pending"] = cnt

    invoices_paid = db.query(func.count(Invoice.id)).filter((Invoice.residual <= 1e-6)).scalar() or 0
    invoices_unpaid = (
        db.query(func.count(Invoice.id))
        .filter(Invoice.residual >= (Invoice.amount_total - 1e-6))
        .scalar()
        or 0
    )
    invoices_partial = (
        db.query(func.count(Invoice.id))
        .filter(Invoice.residual > 1e-6, Invoice.residual < (Invoice.amount_total - 1e-6))
        .scalar()
        or 0
    )
    # Overdue invoices: any outstanding schedule overdue
    today = date.today()
    overdue_invoice_ids = (
        db.query(distinct(PaymentSchedule.invoice_id))
        .filter(
            PaymentSchedule.invoice_id.isnot(None),
            PaymentSchedule.due_date < today,
            PaymentSchedule.outstanding_amount > 1e-6,
        )
        .all()
    )
    invoices_overdue = len(overdue_invoice_ids)

    payments_q = db.query(func.count(Payment.id)).filter(Payment.state == "posted")
    if property_id:
        # Only count payments linked to invoices->offers->suites under property
        payments_q = (
            payments_q.join(Invoice, Invoice.id == Payment.invoice_id)
            .join(Offer, Offer.id == Invoice.offer_id)
            .join(Suite, Suite.id == Offer.suite_id)
            .filter(Suite.property_id == property_id)
        )
    payments_posted = payments_q.scalar() or 0

    # Trends (daily) for last N days
    start_dt = datetime.combine(date.today() - timedelta(days=max(0, days - 1)), datetime.min.time())
    # Offers per day
    offers_trend_q = db.query(func.date(Offer.created_at), func.count(Offer.id))
    if property_id:
        offers_trend_q = offers_trend_q.join(Suite, Suite.id == Offer.suite_id).filter(Suite.property_id == property_id)
    offers_trend_q = offers_trend_q.filter(Offer.created_at >= start_dt).group_by(func.date(Offer.created_at)).order_by(func.date(Offer.created_at).asc())
    offers_per_day = [{"date": d, "count": c} for d, c in offers_trend_q.all()]

    # Payments per day (using Payment.date)
    payments_trend_q = db.query(Payment.date, func.count(Payment.id)).filter(Payment.state == "posted")
    if property_id:
        payments_trend_q = (
            payments_trend_q.join(Invoice, Invoice.id == Payment.invoice_id)
            .join(Offer, Offer.id == Invoice.offer_id)
            .join(Suite, Suite.id == Offer.suite_id)
            .filter(Suite.property_id == property_id)
        )
    payments_trend_q = payments_trend_q.filter(Payment.date >= start_dt.date()).group_by(Payment.date).order_by(Payment.date.asc())
    payments_per_day = [{"date": d.isoformat() if hasattr(d, 'isoformat') else str(d), "count": c} for d, c in payments_trend_q.all()]

    return {
        "properties": props,
        "blocks": blocks,
        "floors": floors,
        "suites": suites,
        "suites_available": suites_available,
        "suites_unavailable": suites_unavailable,
        "offers_by_state": offer_counts,
        "schedules_by_status": schedules_counts,
        "invoices": {
            "paid": invoices_paid,
            "unpaid": invoices_unpaid,
            "partial": invoices_partial,
            "overdue": invoices_overdue,
        },
        "payments_posted": payments_posted,
        "trends": {
            "offers_per_day": offers_per_day,
            "payments_per_day": payments_per_day,
        },
    }
