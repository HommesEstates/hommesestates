"""Payment processing services - reconciliation, reminders, multi-currency, refunds."""
from datetime import date, datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
import logging

from ..models import (
    Payment, Invoice, PaymentSchedule, Offer, Partner, Document
)
from ..services.document_service import PDFService
from ..config import settings

logger = logging.getLogger(__name__)


class PaymentService:
    """Service for payment processing operations."""
    
    @staticmethod
    def create_payment(
        db: Session,
        partner_id: int,
        amount: float,
        currency: str = "NGN",
        payment_date: Optional[date] = None,
        payment_method: Optional[str] = None,
        reference: Optional[str] = None,
        invoice_id: Optional[int] = None,
        offer_id: Optional[int] = None,
        company_id: Optional[int] = None,
    ) -> Payment:
        """Create a new payment record."""
        payment = Payment(
            partner_id=partner_id,
            amount=amount,
            currency=currency,
            date=payment_date or date.today(),
            state="posted",
            invoice_id=invoice_id,
            offer_id=offer_id,
            company_id=company_id,
        )
        db.add(payment)
        db.flush()
        
        # Update invoice residual if linked
        if invoice_id:
            PaymentService._update_invoice_residual(db, invoice_id)
        
        # Update payment schedule if linked to offer
        if offer_id:
            PaymentService._allocate_to_schedules(db, offer_id, amount, payment.id)
        
        db.commit()
        db.refresh(payment)
        
        return payment
    
    @staticmethod
    def _update_invoice_residual(db: Session, invoice_id: int):
        """Update invoice residual amount after payment."""
        invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
        if not invoice:
            return
        
        total_payments = db.query(Payment).filter(
            Payment.invoice_id == invoice_id,
            Payment.state == "posted"
        ).all()
        
        paid_amount = sum(p.amount for p in total_payments)
        invoice.residual = invoice.amount_total - paid_amount
        
        if invoice.residual <= 0:
            invoice.residual = 0
            invoice.state = "paid"
        
        db.add(invoice)
    
    @staticmethod
    def _allocate_to_schedules(
        db: Session,
        offer_id: int,
        amount: float,
        payment_id: int,
    ):
        """Allocate payment amount to payment schedules."""
        schedules = db.query(PaymentSchedule).filter(
            PaymentSchedule.offer_id == offer_id
        ).order_by(PaymentSchedule.due_date).all()
        
        remaining = amount
        
        for schedule in schedules:
            if remaining <= 0:
                break
            
            outstanding = schedule.outstanding_amount or schedule.amount
            
            if outstanding > 0:
                allocation = min(remaining, outstanding)
                
                schedule.paid_amount = (schedule.paid_amount or 0) + allocation
                schedule.outstanding_amount = outstanding - allocation
                schedule.payment_id = payment_id
                
                # Update status
                if schedule.paid_amount >= schedule.amount:
                    schedule.status = "paid"
                elif schedule.paid_amount > 0:
                    schedule.status = "partial"
                
                db.add(schedule)
                remaining -= allocation
        
        # Update offer payment status
        PaymentService._update_offer_payment_status(db, offer_id)
    
    @staticmethod
    def _update_offer_payment_status(db: Session, offer_id: int):
        """Update offer payment status based on schedules."""
        schedules = db.query(PaymentSchedule).filter(
            PaymentSchedule.offer_id == offer_id
        ).all()
        
        if not schedules:
            return
        
        total_amount = sum(s.amount for s in schedules)
        paid_amount = sum(s.paid_amount or 0 for s in schedules)
        
        percentage = (paid_amount / total_amount * 100) if total_amount > 0 else 0
        
        offer = db.query(Offer).filter(Offer.id == offer_id).first()
        if offer:
            offer.payment_percentage = percentage
            
            if paid_amount >= total_amount:
                offer.payment_status = "paid"
            elif paid_amount > 0:
                offer.payment_status = "partial"
            else:
                offer.payment_status = "pending"
            
            db.add(offer)
    
    @staticmethod
    def reconcile_payment(
        db: Session,
        payment_id: int,
        schedule_ids: List[int],
        amounts: List[float],
    ):
        """Manually reconcile a payment to specific schedules."""
        payment = db.query(Payment).filter(Payment.id == payment_id).first()
        if not payment:
            raise ValueError("Payment not found")
        
        for schedule_id, amount in zip(schedule_ids, amounts):
            schedule = db.query(PaymentSchedule).filter(
                PaymentSchedule.id == schedule_id
            ).first()
            
            if schedule and amount > 0:
                schedule.paid_amount = (schedule.paid_amount or 0) + amount
                schedule.outstanding_amount = schedule.amount - schedule.paid_amount
                schedule.payment_id = payment_id
                
                if schedule.paid_amount >= schedule.amount:
                    schedule.status = "paid"
                elif schedule.paid_amount > 0:
                    schedule.status = "partial"
                
                db.add(schedule)
        
        if payment.offer_id:
            PaymentService._update_offer_payment_status(db, payment.offer_id)
        
        db.commit()
    
    @staticmethod
    def void_payment(db: Session, payment_id: int):
        """Void a payment and reverse allocations."""
        payment = db.query(Payment).filter(Payment.id == payment_id).first()
        if not payment:
            raise ValueError("Payment not found")
        
        if payment.state == "cancelled":
            raise ValueError("Payment is already cancelled")
        
        # Reverse schedule allocations
        schedules = db.query(PaymentSchedule).filter(
            PaymentSchedule.payment_id == payment_id
        ).all()
        
        for schedule in schedules:
            schedule.paid_amount = (schedule.paid_amount or 0) - payment.amount
            schedule.outstanding_amount = schedule.amount - (schedule.paid_amount or 0)
            schedule.payment_id = None
            
            if schedule.paid_amount <= 0:
                schedule.status = "pending"
                schedule.paid_amount = 0
            else:
                schedule.status = "partial"
            
            db.add(schedule)
        
        # Update invoice residual
        if payment.invoice_id:
            PaymentService._update_invoice_residual(db, payment.invoice_id)
        
        # Update offer payment status
        if payment.offer_id:
            PaymentService._update_offer_payment_status(db, payment.offer_id)
        
        payment.state = "cancelled"
        db.add(payment)
        db.commit()
    
    @staticmethod
    def refund_payment(
        db: Session,
        payment_id: int,
        amount: Optional[float] = None,
        reason: Optional[str] = None,
    ):
        """Process a refund for a payment."""
        payment = db.query(Payment).filter(Payment.id == payment_id).first()
        if not payment:
            raise ValueError("Payment not found")
        
        refund_amount = amount or payment.amount
        
        if refund_amount > payment.amount:
            raise ValueError("Refund amount cannot exceed payment amount")
        
        # Create negative payment for refund
        refund = Payment(
            partner_id=payment.partner_id,
            amount=-refund_amount,
            currency=payment.currency,
            date=date.today(),
            state="posted",
            invoice_id=payment.invoice_id,
            offer_id=payment.offer_id,
            company_id=payment.company_id,
        )
        db.add(refund)
        
        # Update original payment
        if refund_amount == payment.amount:
            payment.state = "refunded"
        else:
            # Partial refund - adjust amount
            pass  # In production, track partial refunds
        
        db.add(payment)
        
        # Update related records
        if payment.offer_id:
            PaymentService._update_offer_payment_status(db, payment.offer_id)
        
        db.commit()
        
        return refund


class PaymentReminderService:
    """Service for payment reminders and notifications."""
    
    @staticmethod
    def get_due_reminders(db: Session, days_ahead: int = 7) -> List[Dict[str, Any]]:
        """Get payment schedules due within specified days."""
        today = date.today()
        end_date = today + timedelta(days=days_ahead)
        
        schedules = db.query(PaymentSchedule).join(Offer).join(Partner).filter(
            PaymentSchedule.status.in_(["pending", "partial"]),
            PaymentSchedule.due_date >= today,
            PaymentSchedule.due_date <= end_date
        ).order_by(PaymentSchedule.due_date).all()
        
        return [
            {
                "schedule_id": s.id,
                "offer_id": s.offer_id,
                "partner_id": s.offer.partner_id if s.offer else None,
                "partner_name": s.offer.partner.name if s.offer and s.offer.partner else None,
                "partner_email": s.offer.partner.email if s.offer and s.offer.partner else None,
                "due_date": s.due_date,
                "amount": s.amount,
                "outstanding": s.outstanding_amount,
                "days_until_due": (s.due_date - today).days,
            }
            for s in schedules
        ]
    
    @staticmethod
    def get_overdue_reminders(db: Session) -> List[Dict[str, Any]]:
        """Get overdue payment schedules."""
        today = date.today()
        
        schedules = db.query(PaymentSchedule).join(Offer).join(Partner).filter(
            or_(
                PaymentSchedule.status == "overdue",
                and_(
                    PaymentSchedule.status.in_(["pending", "partial"]),
                    PaymentSchedule.due_date < today
                )
            )
        ).order_by(PaymentSchedule.due_date).all()
        
        return [
            {
                "schedule_id": s.id,
                "offer_id": s.offer_id,
                "partner_id": s.offer.partner_id if s.offer else None,
                "partner_name": s.offer.partner.name if s.offer and s.offer.partner else None,
                "partner_email": s.offer.partner.email if s.offer and s.offer.partner else None,
                "due_date": s.due_date,
                "amount": s.amount,
                "outstanding": s.outstanding_amount,
                "days_overdue": (today - s.due_date).days,
            }
            for s in schedules
        ]
    
    @staticmethod
    def send_reminder_email(
        db: Session,
        schedule_id: int,
        template_type: str = "due_reminder",
    ) -> bool:
        """Send payment reminder email (placeholder for email integration)."""
        schedule = db.query(PaymentSchedule).filter(
            PaymentSchedule.id == schedule_id
        ).first()
        
        if not schedule or not schedule.offer:
            return False
        
        partner = schedule.offer.partner
        if not partner or not partner.email:
            return False
        
        # In production, integrate with email service
        # For now, just log
        logger.info(f"Sending {template_type} email to {partner.email} for schedule {schedule_id}")
        
        return True
    
    @staticmethod
    def process_automatic_reminders(db: Session) -> Dict[str, int]:
        """Process automatic payment reminders."""
        results = {
            "due_soon": 0,
            "overdue": 0,
            "sent": 0,
            "failed": 0,
        }
        
        # Due soon reminders (7 days ahead)
        due_soon = PaymentReminderService.get_due_reminders(db, days_ahead=7)
        results["due_soon"] = len(due_soon)
        
        for reminder in due_soon:
            if PaymentReminderService.send_reminder_email(
                db, reminder["schedule_id"], "due_reminder"
            ):
                results["sent"] += 1
            else:
                results["failed"] += 1
        
        # Overdue reminders
        overdue = PaymentReminderService.get_overdue_reminders(db)
        results["overdue"] = len(overdue)
        
        for reminder in overdue:
            if PaymentReminderService.send_reminder_email(
                db, reminder["schedule_id"], "overdue_reminder"
            ):
                results["sent"] += 1
            else:
                results["failed"] += 1
        
        return results


class CurrencyService:
    """Service for multi-currency support."""
    
    # Default exchange rates (in production, fetch from API)
    DEFAULT_RATES = {
        "NGN": 1.0,
        "USD": 1500.0,  # 1 USD = 1500 NGN
        "EUR": 1650.0,  # 1 EUR = 1650 NGN
        "GBP": 1900.0,  # 1 GBP = 1900 NGN
    }
    
    @staticmethod
    def get_exchange_rate(from_currency: str, to_currency: str = "NGN") -> float:
        """Get exchange rate between currencies."""
        # In production, fetch from external API
        rates = CurrencyService.DEFAULT_RATES
        
        if from_currency == to_currency:
            return 1.0
        
        from_rate = rates.get(from_currency, 1.0)
        to_rate = rates.get(to_currency, 1.0)
        
        return to_rate / from_rate
    
    @staticmethod
    def convert_amount(
        amount: float,
        from_currency: str,
        to_currency: str = "NGN",
    ) -> float:
        """Convert amount between currencies."""
        rate = CurrencyService.get_exchange_rate(from_currency, to_currency)
        return amount * rate
    
    @staticmethod
    def format_currency(amount: float, currency: str = "NGN") -> str:
        """Format amount with currency symbol."""
        symbols = {
            "NGN": "₦",
            "USD": "$",
            "EUR": "€",
            "GBP": "£",
        }
        
        symbol = symbols.get(currency, currency)
        return f"{symbol}{amount:,.2f}"
