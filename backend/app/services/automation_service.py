"""Automation services - email notifications, cron jobs, workflow triggers, audit logging."""
import json
import logging
from datetime import date, datetime, timedelta
from typing import Optional, List, Dict, Any, Callable
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
import asyncio
from functools import wraps

from ..models import (
    Offer, Payment, PaymentSchedule, Document, Partner, Property,
    ProgressUpdate, AuditLog, User
)
from ..config import settings
from .payment_service import PaymentReminderService

logger = logging.getLogger(__name__)


class AuditLogService:
    """Service for comprehensive audit logging."""
    
    @staticmethod
    def log(
        db: Session,
        action: str,
        model_name: str,
        record_id: int,
        old_values: Optional[dict] = None,
        new_values: Optional[dict] = None,
        user_id: Optional[int] = None,
        partner_id: Optional[int] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> AuditLog:
        """Create an audit log entry."""
        log = AuditLog(
            user_id=user_id,
            partner_id=partner_id,
            model_name=model_name,
            record_id=record_id,
            action=action,
            old_values=json.dumps(old_values) if old_values else None,
            new_values=json.dumps(new_values) if new_values else None,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        db.add(log)
        db.commit()
        return log
    
    @staticmethod
    def log_offer_action(
        db: Session,
        offer: Offer,
        action: str,
        user_id: Optional[int] = None,
        old_values: Optional[dict] = None,
        new_values: Optional[dict] = None,
    ) -> AuditLog:
        """Log offer-related action."""
        return AuditLogService.log(
            db=db,
            action=action,
            model_name="Offer",
            record_id=offer.id,
            old_values=old_values,
            new_values=new_values,
            user_id=user_id,
            partner_id=offer.partner_id,
        )
    
    @staticmethod
    def log_payment_action(
        db: Session,
        payment: Payment,
        action: str,
        user_id: Optional[int] = None,
    ) -> AuditLog:
        """Log payment-related action."""
        return AuditLogService.log(
            db=db,
            action=action,
            model_name="Payment",
            record_id=payment.id,
            new_values={
                "amount": payment.amount,
                "currency": payment.currency,
                "partner_id": payment.partner_id,
            },
            user_id=user_id,
            partner_id=payment.partner_id,
        )
    
    @staticmethod
    def get_model_history(
        db: Session,
        model_name: str,
        record_id: int,
        limit: int = 50,
    ) -> List[dict]:
        """Get audit history for a specific record."""
        logs = db.query(AuditLog).filter(
            AuditLog.model_name == model_name,
            AuditLog.record_id == record_id
        ).order_by(AuditLog.created_at.desc()).limit(limit).all()
        
        return [
            {
                "id": log.id,
                "action": log.action,
                "user_id": log.user_id,
                "old_values": json.loads(log.old_values) if log.old_values else None,
                "new_values": json.loads(log.new_values) if log.new_values else None,
                "ip_address": log.ip_address,
                "created_at": str(log.created_at),
            }
            for log in logs
        ]


class EmailService:
    """Service for email notifications (placeholder for integration)."""
    
    @staticmethod
    def send_email(
        to: str,
        subject: str,
        body: str,
        html_body: Optional[str] = None,
        attachments: Optional[List[dict]] = None,
    ) -> bool:
        """Send email (placeholder for actual implementation)."""
        # In production, integrate with SMTP or email service (SendGrid, Mailgun, etc.)
        logger.info(f"Sending email to {to}: {subject}")
        
        # Check if SMTP is configured
        if not settings.smtp_host:
            logger.warning("SMTP not configured, email not sent")
            return False
        
        # Placeholder - in production, implement actual email sending
        return True
    
    @staticmethod
    def send_offer_confirmation_email(offer: Offer, partner: Partner) -> bool:
        """Send offer confirmation email to customer."""
        if not partner.email:
            return False
        
        subject = f"Offer Confirmation - {offer.code or offer.id}"
        body = f"""
Dear {partner.name},

Your offer has been confirmed.

Offer Details:
- Reference: {offer.code or offer.id}
- Suite: {offer.suite_name or 'N/A'}
- Amount: {offer.currency or 'NGN'} {offer.amount_total or offer.price_total:,.2f}
- Valid Until: {offer.validity_date or 'N/A'}

Thank you for choosing Hommes Estates.

Best regards,
Hommes Estates Team
        """
        
        return EmailService.send_email(
            to=partner.email,
            subject=subject,
            body=body,
        )
    
    @staticmethod
    def send_payment_reminder_email(
        partner: Partner,
        schedule: PaymentSchedule,
        reminder_type: str = "due",
    ) -> bool:
        """Send payment reminder email."""
        if not partner.email:
            return False
        
        if reminder_type == "overdue":
            subject = f"OVERDUE: Payment Reminder - Schedule {schedule.id}"
            urgency = "This payment is OVERDUE. Please make payment immediately."
        else:
            subject = f"Payment Reminder - Due {schedule.due_date}"
            urgency = f"This payment is due on {schedule.due_date}."
        
        body = f"""
Dear {partner.name},

{urgency}

Payment Details:
- Amount: {schedule.amount:,.2f}
- Outstanding: {schedule.outstanding_amount:,.2f}
- Due Date: {schedule.due_date}

Please make payment to avoid any inconvenience.

Best regards,
Hommes Estates Team
        """
        
        return EmailService.send_email(
            to=partner.email,
            subject=subject,
            body=body,
        )
    
    @staticmethod
    def send_payment_confirmation_email(
        payment: Payment,
        partner: Partner,
    ) -> bool:
        """Send payment confirmation email."""
        if not partner.email:
            return False
        
        subject = f"Payment Confirmation - {payment.id}"
        body = f"""
Dear {partner.name},

We have received your payment.

Payment Details:
- Amount: {payment.currency} {payment.amount:,.2f}
- Date: {payment.date}
- Reference: PAY-{payment.id}

Thank you for your payment.

Best regards,
Hommes Estates Team
        """
        
        return EmailService.send_email(
            to=partner.email,
            subject=subject,
            body=body,
        )
    
    @staticmethod
    def send_progress_update_email(
        partner: Partner,
        update: ProgressUpdate,
        property_obj: Property,
    ) -> bool:
        """Send progress update notification to subscribers."""
        if not partner.email:
            return False
        
        subject = f"Progress Update - {property_obj.name}"
        body = f"""
Dear {partner.name},

There is a new progress update for {property_obj.name}.

Update Details:
- Title: {update.title}
- Date: {update.date}
- Completion: {update.completion_percentage}%

{update.description or ''}

Best regards,
Hommes Estates Team
        """
        
        return EmailService.send_email(
            to=partner.email,
            subject=subject,
            body=body,
        )


class CronService:
    """Service for scheduled tasks and cron jobs."""
    
    @staticmethod
    def check_offer_expiry(db: Session) -> Dict[str, int]:
        """Check and mark expired offers."""
        today = date.today()
        
        expired_offers = db.query(Offer).filter(
            Offer.state.in_(["draft", "sent"]),
            Offer.validity_date < today,
            Offer.is_expired == 0
        ).all()
        
        count = 0
        for offer in expired_offers:
            offer.is_expired = 1
            db.add(offer)
            
            # Log the action
            AuditLogService.log_offer_action(
                db=db,
                offer=offer,
                action="expired",
                new_values={"is_expired": True, "validity_date": str(offer.validity_date)},
            )
            
            count += 1
        
        db.commit()
        
        logger.info(f"Marked {count} offers as expired")
        return {"expired": count}
    
    @staticmethod
    def check_payment_overdue(db: Session) -> Dict[str, int]:
        """Check and mark overdue payment schedules."""
        today = date.today()
        
        overdue_schedules = db.query(PaymentSchedule).filter(
            PaymentSchedule.status == "pending",
            PaymentSchedule.due_date < today
        ).all()
        
        count = 0
        for schedule in overdue_schedules:
            schedule.status = "overdue"
            db.add(schedule)
            count += 1
        
        db.commit()
        
        logger.info(f"Marked {count} payment schedules as overdue")
        return {"overdue": count}
    
    @staticmethod
    def send_payment_reminders(db: Session) -> Dict[str, int]:
        """Send payment reminder emails."""
        results = PaymentReminderService.process_automatic_reminders(db)
        
        logger.info(f"Payment reminders processed: {results}")
        return results
    
    @staticmethod
    def run_daily_tasks(db: Session) -> Dict[str, Any]:
        """Run all daily scheduled tasks."""
        results = {
            "offer_expiry": CronService.check_offer_expiry(db),
            "payment_overdue": CronService.check_payment_overdue(db),
            "payment_reminders": CronService.send_payment_reminders(db),
            "timestamp": str(datetime.utcnow()),
        }
        
        logger.info(f"Daily tasks completed: {results}")
        return results


class WorkflowTrigger:
    """Service for workflow triggers and automation rules."""
    
    @staticmethod
    def on_offer_created(db: Session, offer: Offer) -> List[dict]:
        """Trigger actions when an offer is created."""
        actions = []
        
        # Create document folder
        actions.append({
            "action": "create_folder",
            "status": "triggered",
            "details": f"Document folder for offer {offer.id}",
        })
        
        # Generate payment schedules if payment term exists
        if offer.payment_term_id:
            from .business_logic import PaymentScheduleService
            PaymentScheduleService.create_from_payment_term(db, offer)
            actions.append({
                "action": "generate_schedules",
                "status": "completed",
                "details": f"Payment schedules generated for offer {offer.id}",
            })
        
        # Log the creation
        AuditLogService.log_offer_action(
            db=db,
            offer=offer,
            action="created",
            new_values={
                "partner_id": offer.partner_id,
                "suite_id": offer.suite_id,
                "amount": offer.amount_total or offer.price_total,
            },
        )
        
        actions.append({"action": "audit_log", "status": "completed"})
        
        return actions
    
    @staticmethod
    def on_offer_confirmed(db: Session, offer: Offer) -> List[dict]:
        """Trigger actions when an offer is confirmed."""
        actions = []
        
        # Update suite availability
        if offer.suite_id:
            from .business_logic import SuiteService
            suite = db.query(Suite).filter(Suite.id == offer.suite_id).first()
            if suite:
                suite.is_available = 0
                db.add(suite)
                actions.append({
                    "action": "update_suite",
                    "status": "completed",
                    "details": f"Suite {suite.id} marked as unavailable",
                })
        
        # Send confirmation email
        partner = db.query(Partner).filter(Partner.id == offer.partner_id).first()
        if partner:
            EmailService.send_offer_confirmation_email(offer, partner)
            actions.append({
                "action": "send_email",
                "status": "completed",
                "details": f"Confirmation email sent to {partner.email}",
            })
        
        # Log the confirmation
        AuditLogService.log_offer_action(
            db=db,
            offer=offer,
            action="confirmed",
            new_values={"state": "sale", "confirmation_date": str(date.today())},
        )
        
        return actions
    
    @staticmethod
    def on_payment_received(db: Session, payment: Payment) -> List[dict]:
        """Trigger actions when a payment is received."""
        actions = []
        
        # Update payment schedules
        if payment.offer_id:
            from .payment_service import PaymentService
            PaymentService._allocate_to_schedules(
                db, payment.offer_id, payment.amount, payment.id
            )
            actions.append({
                "action": "allocate_payment",
                "status": "completed",
                "details": f"Payment allocated to schedules for offer {payment.offer_id}",
            })
        
        # Send confirmation email
        partner = db.query(Partner).filter(Partner.id == payment.partner_id).first()
        if partner:
            EmailService.send_payment_confirmation_email(payment, partner)
            actions.append({
                "action": "send_email",
                "status": "completed",
                "details": f"Payment confirmation sent to {partner.email}",
            })
        
        # Generate payment acknowledgement document
        from .document_service import PDFService
        doc = PDFService.generate_payment_acknowledgement(db, payment)
        actions.append({
            "action": "generate_document",
            "status": "completed",
            "details": f"Payment acknowledgement generated: {doc.id}",
        })
        
        # Log the payment
        AuditLogService.log_payment_action(
            db=db,
            payment=payment,
            action="received",
        )
        
        return actions
    
    @staticmethod
    def on_progress_update(db: Session, update: ProgressUpdate) -> List[dict]:
        """Trigger actions when a progress update is created."""
        actions = []
        
        # Update property progress
        if update.property_id:
            from .business_logic import PropertyService
            PropertyService.update_development_progress(db, update.property_id)
            actions.append({
                "action": "update_property_progress",
                "status": "completed",
            })
        
        # Notify subscribers (partners with offers on this property)
        if update.property_id:
            offers = db.query(Offer).filter(
                Offer.property_id == update.property_id,
                Offer.state == "sale"
            ).all()
            
            property_obj = db.query(Property).filter(
                Property.id == update.property_id
            ).first()
            
            for offer in offers:
                partner = db.query(Partner).filter(Partner.id == offer.partner_id).first()
                if partner and partner.email:
                    EmailService.send_progress_update_email(
                        partner, update, property_obj
                    )
            
            actions.append({
                "action": "notify_subscribers",
                "status": "completed",
                "details": f"Notified {len(offers)} subscribers",
            })
        
        return actions


# Decorator for automatic audit logging
def audit_action(action: str, model_name: str):
    """Decorator to automatically audit log function calls."""
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Extract db and record info from args/kwargs
            db = kwargs.get('db') or (args[0] if args else None)
            
            result = func(*args, **kwargs)
            
            # Log after successful execution
            if db and hasattr(result, 'id'):
                AuditLogService.log(
                    db=db,
                    action=action,
                    model_name=model_name,
                    record_id=result.id,
                )
            
            return result
        return wrapper
    return decorator
