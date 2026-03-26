from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date

from ..database import get_db
from .. import schemas
from ..models import Payment, Partner, Company, Document
try:
    # Prefer Playwright HTML generator
    from ..services.pdf_html import build_payment_ack_pdf  # type: ignore
except Exception:  # pragma: no cover - fallback if Playwright not installed
    from ..services.pdf import build_payment_ack_pdf
from ..services.dms import DmsService
from ..config import settings
from ..deps import require_role

router = APIRouter(prefix="/payments", tags=["payments"])

dms = DmsService(settings.dms_storage_path)


@router.post("", response_model=schemas.PaymentRead, dependencies=[Depends(require_role("staff"))])
def create_payment(payload: schemas.PaymentCreate, db: Session = Depends(get_db)):
    partner = db.query(Partner).filter(Partner.id == payload.partner_id).first()
    if not partner:
        raise HTTPException(status_code=400, detail="Invalid partner_id")

    company = None
    if payload.company_id:
        company = db.query(Company).filter(Company.id == payload.company_id).first()
        if not company:
            raise HTTPException(status_code=400, detail="Invalid company_id")

    payment = Payment(
        partner_id=payload.partner_id,
        company_id=payload.company_id,
        invoice_id=payload.invoice_id,
        amount=payload.amount,
        currency=payload.currency,
        date=payload.payment_date or date.today(),
        state=payload.state or "posted",
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


@router.get("/{payment_id}", response_model=schemas.PaymentRead)
def get_payment(payment_id: int, db: Session = Depends(get_db)):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment


@router.post("/{payment_id}/ack", response_model=schemas.PaymentAckResponse, dependencies=[Depends(require_role("staff"))])
def generate_payment_ack(payment_id: int, db: Session = Depends(get_db)):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    partner = payment.partner
    company = payment.company
    inv = payment.invoice
    offer = inv.offer if inv else None
    suite = offer.suite if offer and offer.suite_id else None

    suite_name = None
    suite_number = None
    if suite:
        suite_name = suite.name
        suite_number = suite.number
    elif offer:
        suite_name = offer.suite_name
        suite_number = offer.suite_number

    schedule_summary = None
    if inv:
        # Compute residual from posted payments to avoid relying on stale DB residual
        total_paid = (
            db.query(func.coalesce(func.sum(Payment.amount), 0.0))
            .filter(Payment.invoice_id == inv.id, Payment.state == "posted")
            .scalar()
        )
        residual = max(0.0, (inv.amount_total or 0.0) - (total_paid or 0.0))
        schedule_summary = f"Invoice #{inv.id}: total {inv.amount_total:.2f} {inv.currency}, residual {residual:.2f}"

    try:
        pdf_bytes = build_payment_ack_pdf(
            payment_id=payment.id,
            amount=payment.amount,
            currency=payment.currency,
            pay_date=payment.date,
            partner_name=partner.name if partner else "",
            company_name=company.name if company else "Hommes Estates",
            suite_name=suite_name,
            suite_number=suite_number,
            schedule_summary=schedule_summary,
            have_customer_signature=bool(getattr(partner, "signature", None)),
            have_company_signature=bool(getattr(company, "ops_manager_signature", None) or getattr(company, "director_signature", None)),
            customer_signature=(partner.signature if partner and partner.signature else None),
            company_signature=((company.ops_manager_signature or company.director_signature) if company else None),
        )
    except Exception:
        from ..services.pdf import build_payment_ack_pdf as _fallback_build
        pdf_bytes = _fallback_build(
            payment_id=payment.id,
            amount=payment.amount,
            currency=payment.currency,
            pay_date=payment.date,
            partner_name=partner.name if partner else "",
            company_name=company.name if company else "Hommes Estates",
            suite_name=suite_name,
            suite_number=suite_number,
            schedule_summary=schedule_summary,
            have_customer_signature=bool(getattr(partner, "signature", None)),
            have_company_signature=bool(getattr(company, "ops_manager_signature", None) or getattr(company, "director_signature", None)),
            customer_signature=(partner.signature if partner and partner.signature else None),
            company_signature=((company.ops_manager_signature or company.director_signature) if company else None),
        )

    filename = f"Payment Ack - {payment.id}.pdf"
    stored_rel_path, size = dms.save_bytes(pdf_bytes, filename)

    doc = Document(
        name=filename,
        content_type="application/pdf",
        doc_type="payment_ack",
        size=size,
        file_path=stored_rel_path,
        payment_id=payment.id,
        partner_id=payment.partner_id,
        offer_id=(inv.offer_id if inv else None),
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    download_url = f"/documents/{doc.id}/download"
    return {"document": {"id": doc.id, "name": doc.name, "content_type": doc.content_type, "size": doc.size, "download_url": download_url}}
