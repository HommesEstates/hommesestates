from datetime import date
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ..database import get_db
from .. import schemas
from ..models import Invoice, Partner, Offer, Payment, PaymentSchedule, Company, Document, InvoiceLine
from ..deps import require_role
from ..services.invoice_service import InvoiceService, get_invoice_service
try:
    from ..services.pdf_html import build_invoice_pdf  # type: ignore
except Exception:  # pragma: no cover - fallback if Playwright not installed
    from ..services.pdf import build_invoice_pdf
from ..services.dms import DmsService
from ..config import settings

router = APIRouter(prefix="/invoices", tags=["invoices"])

dms = DmsService(settings.dms_storage_path)


# Pydantic schemas for invoice endpoints
class InvoiceCreate(BaseModel):
    partner_id: int
    offer_id: int = None
    invoice_date: date = None
    due_date: date = None
    currency: str = "NGN"
    tax_rate: float = 0.0


class InvoiceLineCreate(BaseModel):
    name: str
    description: str = None
    quantity: float = 1.0
    price_unit: float = 0.0
    discount: float = 0.0
    tax_rate: float = 0.0
    line_type: str = "product"


class InvoiceLineUpdate(BaseModel):
    name: str = None
    description: str = None
    quantity: float = None
    price_unit: float = None
    discount: float = None
    tax_rate: float = None


class InvoiceFromOffer(BaseModel):
    offer_id: int
    tax_rate: float = 7.5


def _recompute_invoice(db: Session, invoice: Invoice):
    payments = (
        db.query(Payment)
        .filter(Payment.invoice_id == invoice.id, Payment.state == "posted")
        .all()
    )
    total_paid = sum(p.amount for p in payments)

    invoice.residual = max(0.0, (invoice.amount_total or 0.0) - total_paid)
    db.add(invoice)

    # Allocate paid amounts to schedules by due_date order
    schedules = (
        db.query(PaymentSchedule)
        .filter(PaymentSchedule.invoice_id == invoice.id)
        .order_by(PaymentSchedule.due_date.asc(), PaymentSchedule.id.asc())
        .all()
    )
    remaining = total_paid
    today = date.today()
    for sch in schedules:
        paid = min(sch.amount, max(0.0, remaining))
        sch.paid_amount = paid
        sch.outstanding_amount = max(0.0, sch.amount - sch.paid_amount)
        if sch.outstanding_amount <= 1e-6:
            sch.status = "paid"
        else:
            if today > sch.due_date:
                sch.status = "overdue"
            elif sch.paid_amount > 0:
                sch.status = "partial"
            else:
                sch.status = "pending"
        remaining -= paid
        db.add(sch)

    db.flush()
    return total_paid, len(schedules)


@router.post("", response_model=schemas.InvoiceRead, dependencies=[Depends(require_role("staff"))])
def create_invoice(payload: schemas.InvoiceCreate, db: Session = Depends(get_db)):
    partner = db.query(Partner).filter(Partner.id == payload.partner_id).first()
    if not partner:
        raise HTTPException(status_code=400, detail="Invalid partner_id")
    inv = Invoice(
        partner_id=payload.partner_id,
        offer_id=payload.offer_id,
        currency=payload.currency,
        amount_total=payload.amount_total,
        residual=payload.amount_total,
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)
    return inv


@router.get("", response_model=list[schemas.InvoiceRead])
def list_invoices(db: Session = Depends(get_db)):
    items = db.query(Invoice).order_by(Invoice.id.desc()).all()
    return items


@router.get("/{invoice_id}", response_model=schemas.InvoiceRead)
def get_invoice(invoice_id: int, db: Session = Depends(get_db)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return inv


@router.post("/{invoice_id}/schedules", response_model=schemas.ScheduleRead, dependencies=[Depends(require_role("staff"))])
def add_schedule(invoice_id: int, payload: schemas.ScheduleCreate, db: Session = Depends(get_db)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    sch = PaymentSchedule(
        invoice_id=invoice_id,
        due_date=payload.due_date,
        amount=payload.amount,
        paid_amount=0.0,
        outstanding_amount=payload.amount,
        status="pending",
    )
    db.add(sch)
    db.commit()
    db.refresh(sch)
    return sch


@router.get("/{invoice_id}/schedules", response_model=list[schemas.ScheduleRead])
def list_schedules(invoice_id: int, db: Session = Depends(get_db)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    items = (
        db.query(PaymentSchedule)
        .filter(PaymentSchedule.invoice_id == invoice_id)
        .order_by(PaymentSchedule.due_date.asc(), PaymentSchedule.id.asc())
        .all()
    )
    return items


@router.post("/{invoice_id}/recompute", response_model=schemas.InvoiceRecomputeResponse, dependencies=[Depends(require_role("staff"))])
def recompute_invoice(invoice_id: int, db: Session = Depends(get_db)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    total_paid, count = _recompute_invoice(db, inv)
    db.commit()
    db.refresh(inv)
    return {"invoice": inv, "total_paid": total_paid, "schedule_count": count}


@router.get("/{invoice_id}/payments/snapshots", response_model=list[schemas.PaymentSnapshotRead])
def get_payment_snapshots(invoice_id: int, db: Session = Depends(get_db)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    total = float(inv.amount_total or 0.0)
    payments = (
        db.query(Payment)
        .filter(Payment.invoice_id == invoice_id, Payment.state == "posted")
        .order_by(Payment.date.asc(), Payment.id.asc())
        .all()
    )
    snaps: list[schemas.PaymentSnapshotRead] = []
    cumulative = 0.0
    for p in payments:
        amt = float(p.amount or 0.0)
        cumulative += amt
        remaining = max(0.0, total - cumulative)
        snaps.append(
            schemas.PaymentSnapshotRead(
                payment_id=p.id,
                date=p.date,
                amount=amt,
                cumulative_amount=cumulative,
                remaining_amount=remaining,
            )
        )
    return snaps


# ========== Enhanced Invoice Management Endpoints ==========

@router.post("/", response_model=dict, dependencies=[Depends(require_role("staff"))])
def create_invoice(
    invoice_data: InvoiceCreate,
    invoice_service: InvoiceService = Depends(get_invoice_service)
):
    """Create a new invoice."""
    invoice = invoice_service.create_invoice(
        partner_id=invoice_data.partner_id,
        offer_id=invoice_data.offer_id,
        invoice_date=invoice_data.invoice_date,
        due_date=invoice_data.due_date,
        currency=invoice_data.currency,
        tax_rate=invoice_data.tax_rate
    )
    return {"id": invoice.id, "number": invoice.number, "state": invoice.state}


@router.post("/{invoice_id}/lines", response_model=dict, dependencies=[Depends(require_role("staff"))])
def add_invoice_line(
    invoice_id: int,
    line_data: InvoiceLineCreate,
    invoice_service: InvoiceService = Depends(get_invoice_service)
):
    """Add a line to an invoice."""
    line = invoice_service.add_invoice_line(
        invoice_id=invoice_id,
        name=line_data.name,
        quantity=line_data.quantity,
        price_unit=line_data.price_unit,
        discount=line_data.discount,
        tax_rate=line_data.tax_rate,
        description=line_data.description,
        line_type=line_data.line_type
    )
    return {"id": line.id, "price_total": line.price_total}


@router.put("/lines/{line_id}", response_model=dict, dependencies=[Depends(require_role("staff"))])
def update_invoice_line(
    line_id: int,
    line_data: InvoiceLineUpdate,
    invoice_service: InvoiceService = Depends(get_invoice_service)
):
    """Update an invoice line."""
    line = invoice_service.update_invoice_line(
        line_id=line_id,
        quantity=line_data.quantity,
        price_unit=line_data.price_unit,
        discount=line_data.discount,
        tax_rate=line_data.tax_rate,
        name=line_data.name,
        description=line_data.description
    )
    return {"id": line.id, "price_total": line.price_total}


@router.delete("/lines/{line_id}", dependencies=[Depends(require_role("staff"))])
def delete_invoice_line(
    line_id: int,
    invoice_service: InvoiceService = Depends(get_invoice_service)
):
    """Delete an invoice line."""
    success = invoice_service.delete_invoice_line(line_id)
    if not success:
        raise HTTPException(status_code=404, detail="Invoice line not found")
    return {"ok": True}


@router.post("/{invoice_id}/post", response_model=dict, dependencies=[Depends(require_role("staff"))])
def post_invoice(
    invoice_id: int,
    invoice_service: InvoiceService = Depends(get_invoice_service)
):
    """Post an invoice (change from draft to posted)."""
    invoice = invoice_service.post_invoice(invoice_id)
    return {"id": invoice.id, "state": invoice.state}


@router.post("/{invoice_id}/cancel", response_model=dict, dependencies=[Depends(require_role("staff"))])
def cancel_invoice(
    invoice_id: int,
    invoice_service: InvoiceService = Depends(get_invoice_service)
):
    """Cancel an invoice."""
    invoice = invoice_service.cancel_invoice(invoice_id)
    return {"id": invoice.id, "state": invoice.state}


@router.post("/{invoice_id}/pay", response_model=dict, dependencies=[Depends(require_role("staff"))])
def pay_invoice(
    invoice_id: int,
    payment_amount: float,
    invoice_service: InvoiceService = Depends(get_invoice_service)
):
    """Record a payment for an invoice."""
    invoice = invoice_service.pay_invoice(invoice_id, payment_amount)
    return {"id": invoice.id, "state": invoice.state, "residual": invoice.residual}


@router.get("/{invoice_id}/summary", response_model=dict)
def get_invoice_summary(
    invoice_id: int,
    invoice_service: InvoiceService = Depends(get_invoice_service)
):
    """Get a detailed summary of an invoice."""
    try:
        summary = invoice_service.get_invoice_summary(invoice_id)
        return summary
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/from-offer", response_model=dict, dependencies=[Depends(require_role("staff"))])
def create_invoice_from_offer(
    offer_data: InvoiceFromOffer,
    invoice_service: InvoiceService = Depends(get_invoice_service)
):
    """Create an invoice from an offer."""
    invoice = invoice_service.create_invoice_from_offer(
        offer_id=offer_data.offer_id,
        tax_rate=offer_data.tax_rate
    )
    return {"id": invoice.id, "number": invoice.number, "state": invoice.state}


@router.get("/{invoice_id}/lines", response_model=List[dict])
def get_invoice_lines(invoice_id: int, db: Session = Depends(get_db)):
    """Get all lines for an invoice."""
    lines = db.query(InvoiceLine).filter(InvoiceLine.invoice_id == invoice_id).all()
    return [
        {
            "id": line.id,
            "name": line.name,
            "description": line.description,
            "quantity": line.quantity,
            "price_unit": line.price_unit,
            "discount": line.discount,
            "tax_rate": line.tax_rate,
            "price_subtotal": line.price_subtotal,
            "amount_tax": line.amount_tax,
            "price_total": line.price_total,
            "line_type": line.line_type
        }
        for line in lines
    ]


@router.post("/{invoice_id}/documents/invoice", response_model=schemas.DocumentResponse, dependencies=[Depends(require_role("staff"))])
def generate_invoice_pdf(invoice_id: int, db: Session = Depends(get_db)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    partner = db.query(Partner).filter(Partner.id == inv.partner_id).first()
    company = db.query(Company).first()

    # Prepare schedule and payments
    rows = (
        db.query(PaymentSchedule)
        .filter(PaymentSchedule.invoice_id == invoice_id)
        .order_by(PaymentSchedule.due_date.asc(), PaymentSchedule.id.asc())
        .all()
    )
    schedule_rows = [
        {
            "due_date": (r.due_date.isoformat() if r.due_date else ""),
            "amount": r.amount or 0.0,
            "paid_amount": r.paid_amount or 0.0,
            "outstanding_amount": r.outstanding_amount or 0.0,
            "status": r.status or "",
        }
        for r in rows
    ]

    pays = (
        db.query(Payment)
        .filter(Payment.invoice_id == invoice_id, Payment.state == "posted")
        .order_by(Payment.date.asc(), Payment.id.asc())
        .all()
    )
    payments = [
        {"date": (p.date.isoformat() if p.date else ""), "amount": p.amount or 0.0}
        for p in pays
    ]

    try:
        pdf_bytes = build_invoice_pdf(
            invoice_id=inv.id,
            partner_name=partner.name if partner else "",
            currency=inv.currency,
            amount_total=inv.amount_total or 0.0,
            residual=inv.residual or 0.0,
            company_name=company.name if company else "Hommes Estates",
            schedule_rows=schedule_rows,
            payments=payments,
        )
    except Exception:
        from ..services.pdf import build_invoice_pdf as _fallback_build
        pdf_bytes = _fallback_build(
            invoice_id=inv.id,
            partner_name=partner.name if partner else "",
            currency=inv.currency,
            amount_total=inv.amount_total or 0.0,
            residual=inv.residual or 0.0,
            company_name=company.name if company else "Hommes Estates",
            schedule_rows=schedule_rows,
            payments=payments,
        )

    filename = f"Invoice - {inv.id}.pdf"
    stored_rel_path, size = dms.save_bytes(pdf_bytes, filename)

    doc = Document(
        name=filename,
        content_type="application/pdf",
        doc_type="invoice_pdf",
        size=size,
        file_path=stored_rel_path,
        partner_id=partner.id if partner else None,
        offer_id=inv.offer_id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    download_url = f"/documents/{doc.id}/download"
    return {"document": {"id": doc.id, "name": doc.name, "content_type": doc.content_type, "size": doc.size, "download_url": download_url}}
