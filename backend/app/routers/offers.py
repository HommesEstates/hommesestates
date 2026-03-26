from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date

from ..database import get_db
from .. import schemas
from ..models import Offer, Partner, Suite, Document, Invoice, Payment, PaymentSchedule, Company
try:
    from ..services.pdf_html import (
        build_offer_letter_pdf,
        build_payment_summary_letter_pdf,
        build_allocation_letter_pdf,
    )  # type: ignore
except Exception:  # pragma: no cover - fallback if Playwright not installed
    from ..services.pdf import (
        build_offer_letter_pdf,
        build_payment_summary_letter_pdf,
        build_allocation_letter_pdf,
    )
from ..services.dms import DmsService
from ..config import settings
from ..deps import require_role

router = APIRouter(prefix="/offers", tags=["offers"])

dms = DmsService(settings.dms_storage_path)


@router.post("", response_model=schemas.OfferRead, dependencies=[Depends(require_role("staff"))])
def create_offer(payload: schemas.OfferCreate, db: Session = Depends(get_db)):
    partner = db.query(Partner).filter(Partner.id == payload.partner_id).first()
    if not partner:
        raise HTTPException(status_code=400, detail="Invalid partner_id")
    suite = db.query(Suite).filter(Suite.id == payload.suite_id).first()
    if not suite:
        raise HTTPException(status_code=400, detail="Invalid suite_id")

    offer = Offer(
        partner_id=payload.partner_id,
        suite_id=payload.suite_id,
        suite_name=suite.name,
        suite_number=suite.number,
        price_total=payload.price_total,
        validity_date=payload.validity_date,
        code=payload.code,
        state="draft",
    )
    db.add(offer)
    db.commit()
    db.refresh(offer)
    return offer


@router.get("/{offer_id}", response_model=schemas.OfferRead)
def get_offer(offer_id: int, db: Session = Depends(get_db)):
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    return offer


@router.post("/{offer_id}/confirm", response_model=schemas.OfferRead, dependencies=[Depends(require_role("staff"))])
def confirm_offer(offer_id: int, db: Session = Depends(get_db)):
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    offer.state = "sale"
    # mark suite unavailable
    if offer.suite_id:
        suite = db.query(Suite).filter(Suite.id == offer.suite_id).first()
        if suite:
            suite.is_available = 0
            db.add(suite)
    db.add(offer)
    db.commit()
    db.refresh(offer)
    return offer


@router.post("/{offer_id}/cancel", response_model=schemas.OfferRead, dependencies=[Depends(require_role("staff"))])
def cancel_offer(offer_id: int, db: Session = Depends(get_db)):
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    offer.state = "cancelled"
    # optionally free suite
    if offer.suite_id:
        suite = db.query(Suite).filter(Suite.id == offer.suite_id).first()
        if suite:
            suite.is_available = 1
            db.add(suite)
    db.add(offer)
    db.commit()
    db.refresh(offer)
    return offer


@router.post("/{offer_id}/documents/offer_letter", response_model=schemas.DocumentResponse, dependencies=[Depends(require_role("staff"))])
def generate_offer_letter(offer_id: int, db: Session = Depends(get_db)):
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    partner = db.query(Partner).filter(Partner.id == offer.partner_id).first()
    suite = db.query(Suite).filter(Suite.id == offer.suite_id).first() if offer.suite_id else None
    company = db.query(Company).first()

    try:
        pdf_bytes = build_offer_letter_pdf(
            offer_id=offer.id,
            partner_name=partner.name if partner else "",
            suite_name=suite.name if suite else offer.suite_name or "",
            suite_number=suite.number if suite else offer.suite_number,
            price_total=offer.price_total or 0.0,
            validity_date=offer.validity_date,
            company_name=company.name if company else "Hommes Estates",
            customer_signature=partner.signature if partner and partner.signature else None,
            company_signature=(company.ops_manager_signature or company.director_signature) if company else None,
        )
    except Exception:
        from ..services.pdf import build_offer_letter_pdf as _fallback_build
        pdf_bytes = _fallback_build(
            offer_id=offer.id,
            partner_name=partner.name if partner else "",
            suite_name=suite.name if suite else offer.suite_name or "",
            suite_number=suite.number if suite else offer.suite_number,
            price_total=offer.price_total or 0.0,
            validity_date=offer.validity_date,
            company_name=company.name if company else "Hommes Estates",
            customer_signature=partner.signature if partner and partner.signature else None,
            company_signature=(company.ops_manager_signature or company.director_signature) if company else None,
        )
    filename = f"Offer Letter - {offer.id}.pdf"
    stored_rel_path, size = dms.save_bytes(pdf_bytes, filename)

    doc = Document(
        name=filename,
        content_type="application/pdf",
        doc_type="offer_letter",
        size=size,
        file_path=stored_rel_path,
        partner_id=partner.id if partner else None,
        offer_id=offer.id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    download_url = f"/documents/{doc.id}/download"
    return {"document": {"id": doc.id, "name": doc.name, "content_type": doc.content_type, "size": doc.size, "download_url": download_url}}


@router.post("/{offer_id}/documents/payment_summary", response_model=schemas.DocumentResponse, dependencies=[Depends(require_role("staff"))])
def generate_payment_summary(offer_id: int, db: Session = Depends(get_db)):
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    partner = db.query(Partner).filter(Partner.id == offer.partner_id).first()
    suite = db.query(Suite).filter(Suite.id == offer.suite_id).first() if offer.suite_id else None
    company = db.query(Company).first()

    invoices = db.query(Invoice).filter(Invoice.offer_id == offer.id).all()
    invoice_ids = [inv.id for inv in invoices]
    total_paid = 0.0
    if invoice_ids:
        pays = db.query(Payment).filter(Payment.invoice_id.in_(invoice_ids), Payment.state == "posted").all()
        total_paid = sum(p.amount for p in pays)
    balance = (offer.price_total or 0.0) - total_paid
    schedule_rows = []
    if invoice_ids:
        rows = (
            db.query(PaymentSchedule)
            .filter(PaymentSchedule.invoice_id.in_(invoice_ids))
            .order_by(PaymentSchedule.due_date.asc(), PaymentSchedule.id.asc())
            .all()
        )
        for r in rows:
            schedule_rows.append({
                "due_date": r.due_date.isoformat() if r.due_date else "",
                "amount": r.amount or 0.0,
                "paid_amount": r.paid_amount or 0.0,
                "outstanding_amount": r.outstanding_amount or 0.0,
                "status": r.status or "",
            })

    try:
        pdf_bytes = build_payment_summary_letter_pdf(
            offer_id=offer.id,
            partner_name=partner.name if partner else "",
            suite_name=suite.name if suite else offer.suite_name or "",
            suite_number=suite.number if suite else offer.suite_number,
            price_total=offer.price_total or 0.0,
            total_paid=total_paid,
            balance=balance,
            company_name=company.name if company else "Hommes Estates",
            schedule_rows=schedule_rows,
            customer_signature=partner.signature if partner and partner.signature else None,
            company_signature=(company.ops_manager_signature or company.director_signature) if company else None,
        )
    except Exception:
        from ..services.pdf import build_payment_summary_letter_pdf as _fallback_build
        pdf_bytes = _fallback_build(
            offer_id=offer.id,
            partner_name=partner.name if partner else "",
            suite_name=suite.name if suite else offer.suite_name or "",
            suite_number=suite.number if suite else offer.suite_number,
            price_total=offer.price_total or 0.0,
            total_paid=total_paid,
            balance=balance,
            company_name=company.name if company else "Hommes Estates",
            schedule_rows=schedule_rows,
            customer_signature=partner.signature if partner and partner.signature else None,
            company_signature=(company.ops_manager_signature or company.director_signature) if company else None,
        )
    filename = f"Payment Summary - {offer.id}.pdf"
    stored_rel_path, size = dms.save_bytes(pdf_bytes, filename)

    doc = Document(
        name=filename,
        content_type="application/pdf",
        doc_type="payment_summary_letter",
        size=size,
        file_path=stored_rel_path,
        partner_id=partner.id if partner else None,
        offer_id=offer.id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    download_url = f"/documents/{doc.id}/download"
    return {"document": {"id": doc.id, "name": doc.name, "content_type": doc.content_type, "size": doc.size, "download_url": download_url}}


@router.post("/{offer_id}/documents/allocation", response_model=schemas.DocumentResponse, dependencies=[Depends(require_role("staff"))])
def generate_allocation_letter(offer_id: int, allocation_date: date | None = None, db: Session = Depends(get_db)):
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    partner = db.query(Partner).filter(Partner.id == offer.partner_id).first()
    suite = db.query(Suite).filter(Suite.id == offer.suite_id).first() if offer.suite_id else None
    company = db.query(Company).first()

    alloc_date = allocation_date or date.today()

    try:
        pdf_bytes = build_allocation_letter_pdf(
            offer_id=offer.id,
            partner_name=partner.name if partner else "",
            suite_name=suite.name if suite else offer.suite_name or "",
            suite_number=suite.number if suite else offer.suite_number,
            allocation_date=alloc_date,
            company_name=company.name if company else "Hommes Estates",
            customer_signature=partner.signature if partner and partner.signature else None,
            company_signature=(company.ops_manager_signature or company.director_signature) if company else None,
        )
    except Exception:
        from ..services.pdf import build_allocation_letter_pdf as _fallback_build
        pdf_bytes = _fallback_build(
            offer_id=offer.id,
            partner_name=partner.name if partner else "",
            suite_name=suite.name if suite else offer.suite_name or "",
            suite_number=suite.number if suite else offer.suite_number,
            allocation_date=alloc_date,
            company_name=company.name if company else "Hommes Estates",
            customer_signature=partner.signature if partner and partner.signature else None,
            company_signature=(company.ops_manager_signature or company.director_signature) if company else None,
        )
    filename = f"Allocation Letter - {offer.id}.pdf"
    stored_rel_path, size = dms.save_bytes(pdf_bytes, filename)

    doc = Document(
        name=filename,
        content_type="application/pdf",
        doc_type="allocation_letter",
        size=size,
        file_path=stored_rel_path,
        partner_id=partner.id if partner else None,
        offer_id=offer.id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    download_url = f"/documents/{doc.id}/download"
    return {"document": {"id": doc.id, "name": doc.name, "content_type": doc.content_type, "size": doc.size, "download_url": download_url}}
