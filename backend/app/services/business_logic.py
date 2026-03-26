"""Business logic services for HommesEstates backend - matching Odoo functionality."""
from datetime import date, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from ..models import (
    Offer, Suite, Partner, PaymentSchedule, PaymentTerm, PaymentTermLine,
    Property, Block, Floor, Document, DocumentFolder, Invoice, Payment,
    PropertyImage, PropertyPlan, ProgressUpdate, AuditLog
)
from ..config import settings


class OfferService:
    """Service for handling offer business logic and workflows."""
    
    @staticmethod
    def create_offer(
        db: Session,
        partner_id: int,
        suite_id: int,
        payment_term_id: Optional[int] = None,
        validity_days: int = 3,
        note: Optional[str] = None,
    ) -> Offer:
        """Create a new offer with automatic suite handling and payment schedule generation."""
        
        # Validate suite availability
        suite = db.query(Suite).filter(Suite.id == suite_id).first()
        if not suite:
            raise ValueError("Suite not found")
        if not suite.is_available:
            raise ValueError("Suite is not available for offers")
        
        # Get property relationships from suite
        property_id = suite.property_id
        block_id = suite.block_id
        floor_id = suite.floor_id
        
        # Generate offer code
        code = f"OFF-{date.today().strftime('%Y%m%d')}-{partner_id:04d}"
        
        # Calculate validity date
        validity_date = date.today() + timedelta(days=validity_days)
        
        # Create offer
        offer = Offer(
            code=code,
            partner_id=partner_id,
            suite_id=suite_id,
            suite_name=suite.name,
            suite_number=suite.number,
            property_id=property_id,
            block_id=block_id,
            floor_id=floor_id,
            is_offer=1,
            state="draft",
            validity_date=validity_date,
            price_total=suite.list_price,
            amount_total=suite.list_price,
            currency=suite.currency,
            payment_term_id=payment_term_id,
            note=note,
        )
        db.add(offer)
        db.flush()
        
        # Mark suite as unavailable
        suite.is_available = 0
        suite.website_published = 0
        db.add(suite)
        
        # Generate payment schedule if payment term provided
        if payment_term_id:
            PaymentScheduleService.create_from_payment_term(db, offer)
        
        # Create document folder for offer
        OfferService._create_document_folder(db, offer)
        
        db.commit()
        db.refresh(offer)
        
        return offer
    
    @staticmethod
    def create_public_offer(
        db: Session,
        name: str,
        email: str,
        suite_id: int,
        phone: Optional[str] = None,
        street: Optional[str] = None,
        city: Optional[str] = None,
        state_id: Optional[int] = None,
        country_id: Optional[int] = None,
        payment_term_id: Optional[int] = None,
        validity_days: int = 3,
        note: Optional[str] = None,
    ) -> Offer:
        """Create an offer for an unauthenticated visitor."""
        
        # Find or create partner
        partner = db.query(Partner).filter(Partner.email == email).first()
        if not partner:
            partner = Partner(
                name=name,
                email=email,
                phone=phone,
                street=street,
                city=city,
                state_id=state_id,
                country_id=country_id,
                is_property_owner=0,
            )
            db.add(partner)
            db.flush()
        
        return OfferService.create_offer(
            db=db,
            partner_id=partner.id,
            suite_id=suite_id,
            payment_term_id=payment_term_id,
            validity_days=validity_days,
            note=note,
        )
    
    @staticmethod
    def confirm_offer(db: Session, offer_id: int) -> Offer:
        """Confirm an offer - mark as sale and handle suite."""
        offer = db.query(Offer).filter(Offer.id == offer_id).first()
        if not offer:
            raise ValueError("Offer not found")
        
        if offer.state not in ["draft", "sent"]:
            raise ValueError(f"Cannot confirm offer in state: {offer.state}")
        
        # Update state
        offer.state = "sale"
        offer.confirmation_date = date.today()
        
        # Ensure suite is marked unavailable
        if offer.suite_id:
            suite = db.query(Suite).filter(Suite.id == offer.suite_id).first()
            if suite:
                suite.is_available = 0
                db.add(suite)
        
        db.add(offer)
        db.commit()
        db.refresh(offer)
        
        return offer
    
    @staticmethod
    def cancel_offer(db: Session, offer_id: int, free_suite: bool = True) -> Offer:
        """Cancel an offer and optionally free the suite."""
        offer = db.query(Offer).filter(Offer.id == offer_id).first()
        if not offer:
            raise ValueError("Offer not found")
        
        if offer.state == "cancelled":
            raise ValueError("Offer is already cancelled")
        
        # Update state
        offer.state = "cancelled"
        
        # Free suite if requested
        if free_suite and offer.suite_id:
            suite = db.query(Suite).filter(Suite.id == offer.suite_id).first()
            if suite:
                suite.is_available = 1
                suite.website_published = 1
                db.add(suite)
        
        db.add(offer)
        db.commit()
        db.refresh(offer)
        
        return offer
    
    @staticmethod
    def send_offer(db: Session, offer_id: int) -> Offer:
        """Mark offer as sent to customer."""
        offer = db.query(Offer).filter(Offer.id == offer_id).first()
        if not offer:
            raise ValueError("Offer not found")
        
        if offer.state != "draft":
            raise ValueError(f"Cannot send offer in state: {offer.state}")
        
        offer.state = "sent"
        db.add(offer)
        db.commit()
        db.refresh(offer)
        
        return offer
    
    @staticmethod
    def check_expiry(db: Session) -> List[Offer]:
        """Check and mark expired offers."""
        today = date.today()
        expired_offers = db.query(Offer).filter(
            Offer.state.in_(["draft", "sent"]),
            Offer.validity_date < today,
            Offer.is_expired == 0
        ).all()
        
        for offer in expired_offers:
            offer.is_expired = 1
            db.add(offer)
        
        db.commit()
        return expired_offers
    
    @staticmethod
    def _create_document_folder(db: Session, offer: Offer) -> DocumentFolder:
        """Create document folder hierarchy for offer."""
        # Create parent folders if needed
        if offer.property_id and not offer.property.document_folder_id:
            PropertyService.create_document_folder(db, offer.property_id)
        
        if offer.suite_id:
            suite = db.query(Suite).filter(Suite.id == offer.suite_id).first()
            if suite and not suite.document_folder_id:
                SuiteService.create_document_folder(db, suite.id)
        
        # Create offer folder
        folder_name = f"Offer {offer.code or offer.id}"
        folder = DocumentFolder(
            name=folder_name,
            parent_id=offer.suite.document_folder_id if offer.suite_id else None,
        )
        db.add(folder)
        db.flush()
        
        offer.document_folder_id = folder.id
        db.add(offer)
        
        return folder
    
    @staticmethod
    def compute_payment_status(db: Session, offer_id: int) -> dict:
        """Compute payment status for an offer."""
        offer = db.query(Offer).filter(Offer.id == offer_id).first()
        if not offer:
            raise ValueError("Offer not found")
        
        schedules = db.query(PaymentSchedule).filter(
            PaymentSchedule.offer_id == offer_id
        ).all()
        
        if not schedules:
            return {"status": "pending", "percentage": 0.0}
        
        total_amount = sum(s.amount for s in schedules)
        paid_amount = sum(s.paid_amount for s in schedules)
        
        percentage = (paid_amount / total_amount * 100) if total_amount > 0 else 0.0
        
        if paid_amount >= total_amount:
            status = "paid"
        elif paid_amount > 0:
            status = "partial"
        else:
            status = "pending"
        
        # Update offer
        offer.payment_status = status
        offer.payment_percentage = percentage
        db.add(offer)
        db.commit()
        
        return {"status": status, "percentage": percentage}


class PaymentScheduleService:
    """Service for handling payment schedule generation and management."""
    
    @staticmethod
    def create_from_payment_term(db: Session, offer: Offer) -> List[PaymentSchedule]:
        """Generate payment schedule from payment term."""
        if not offer.payment_term_id:
            return []
        
        # Delete existing schedules
        db.query(PaymentSchedule).filter(PaymentSchedule.offer_id == offer.id).delete()
        
        # Get payment term lines
        term_lines = db.query(PaymentTermLine).filter(
            PaymentTermLine.payment_term_id == offer.payment_term_id
        ).order_by(PaymentTermLine.days).all()
        
        if not term_lines:
            return []
        
        schedules = []
        total_amount = offer.amount_total or offer.price_total or 0
        
        for line in term_lines:
            # Calculate installment amount
            if line.value:  # Percentage
                amount = total_amount * (line.value / 100)
            elif line.value_amount:  # Fixed amount
                amount = line.value_amount
            else:
                continue
            
            # Calculate due date
            due_date = date.today() + timedelta(days=line.days or 0)
            
            # Calculate percentage
            percentage = (amount / total_amount) if total_amount > 0 else 0
            
            schedule = PaymentSchedule(
                offer_id=offer.id,
                payment_term_id=offer.payment_term_id,
                description=f"Installment {len(schedules) + 1}",
                due_date=due_date,
                amount=amount,
                paid_amount=0.0,
                outstanding_amount=amount,
                percentage=percentage,
                status="pending",
            )
            db.add(schedule)
            schedules.append(schedule)
        
        db.flush()
        return schedules
    
    @staticmethod
    def update_payment_status(db: Session, schedule_id: int) -> PaymentSchedule:
        """Update payment schedule status based on payments."""
        schedule = db.query(PaymentSchedule).filter(PaymentSchedule.id == schedule_id).first()
        if not schedule:
            raise ValueError("Payment schedule not found")
        
        # Calculate paid amount from related payments
        # This would integrate with actual payment records
        # For now, just check outstanding amount
        
        if schedule.paid_amount >= schedule.amount:
            schedule.status = "paid"
        elif schedule.paid_amount > 0:
            schedule.status = "partial"
        elif schedule.due_date < date.today():
            schedule.status = "overdue"
        else:
            schedule.status = "pending"
        
        db.add(schedule)
        db.commit()
        db.refresh(schedule)
        
        return schedule
    
    @staticmethod
    def check_overdue(db: Session) -> List[PaymentSchedule]:
        """Check and mark overdue payment schedules."""
        today = date.today()
        overdue_schedules = db.query(PaymentSchedule).filter(
            PaymentSchedule.status == "pending",
            PaymentSchedule.due_date < today
        ).all()
        
        for schedule in overdue_schedules:
            schedule.status = "overdue"
            db.add(schedule)
        
        db.commit()
        return overdue_schedules


class SuiteService:
    """Service for handling suite management."""
    
    @staticmethod
    def create_suite(
        db: Session,
        property_id: int,
        name: str,
        number: str,
        block_id: Optional[int] = None,
        floor_id: Optional[int] = None,
        list_price: float = 0.0,
        area_sqm: float = 0.0,
        suite_type: Optional[str] = None,
    ) -> Suite:
        """Create a new suite with automatic naming."""
        
        # Generate full name if needed
        if not name:
            property_obj = db.query(Property).filter(Property.id == property_id).first()
            block = db.query(Block).filter(Block.id == block_id).first() if block_id else None
            
            if block and number:
                if not number.startswith(block.name):
                    name = f"{property_obj.name} - Suite {block.name}{number}"
                else:
                    name = f"{property_obj.name} - Suite {number}"
            else:
                name = f"Suite {number}"
        
        suite = Suite(
            property_id=property_id,
            block_id=block_id,
            floor_id=floor_id,
            name=name,
            number=number,
            suite_type=suite_type,
            list_price=list_price,
            area_sqm=area_sqm,
            is_available=1,
            published=1,
            website_published=1,
        )
        db.add(suite)
        db.commit()
        db.refresh(suite)
        
        return suite
    
    @staticmethod
    def check_availability(db: Session, suite_id: int) -> bool:
        """Check if suite is available for offers."""
        suite = db.query(Suite).filter(Suite.id == suite_id).first()
        if not suite:
            return False
        
        # Check for active offers
        today = date.today()
        active_offers = db.query(Offer).filter(
            Offer.suite_id == suite_id,
            Offer.state.in_(["draft", "sent", "sale"]),
            or_(Offer.validity_date == None, Offer.validity_date >= today)
        ).count()
        
        return active_offers == 0 and suite.is_available == 1
    
    @staticmethod
    def create_document_folder(db: Session, suite_id: int) -> DocumentFolder:
        """Create document folder for suite."""
        suite = db.query(Suite).filter(Suite.id == suite_id).first()
        if not suite:
            raise ValueError("Suite not found")
        
        # Get parent folder from block or property
        parent_id = None
        if suite.block_id and suite.block.document_folder_id:
            parent_id = suite.block.document_folder_id
        elif suite.property_id and suite.property.document_folder_id:
            parent_id = suite.property.document_folder_id
        
        folder = DocumentFolder(
            name=f"Suite {suite.number or suite.name}",
            parent_id=parent_id,
        )
        db.add(folder)
        db.flush()
        
        suite.document_folder_id = folder.id
        db.add(suite)
        db.commit()
        
        return folder


class PropertyService:
    """Service for handling property management."""
    
    @staticmethod
    def create_document_folder(db: Session, property_id: int) -> DocumentFolder:
        """Create document folder for property."""
        property_obj = db.query(Property).filter(Property.id == property_id).first()
        if not property_obj:
            raise ValueError("Property not found")
        
        folder = DocumentFolder(
            name=property_obj.name,
        )
        db.add(folder)
        db.flush()
        
        property_obj.document_folder_id = folder.id
        db.add(property_obj)
        db.commit()
        
        return folder
    
    @staticmethod
    def compute_stats(db: Session, property_id: int) -> dict:
        """Compute property statistics."""
        property_obj = db.query(Property).filter(Property.id == property_id).first()
        if not property_obj:
            raise ValueError("Property not found")
        
        # Count blocks, floors, suites
        blocks = db.query(Block).filter(Block.property_id == property_id).count()
        
        floors = db.query(Floor).join(Block).filter(
            Block.property_id == property_id
        ).count()
        
        suites = db.query(Suite).filter(Suite.property_id == property_id).all()
        total_suites = len(suites)
        available_suites = sum(1 for s in suites if s.is_available == 1)
        
        return {
            "blocks": blocks,
            "floors": floors,
            "total_suites": total_suites,
            "available_suites": available_suites,
            "unavailable_suites": total_suites - available_suites,
        }
    
    @staticmethod
    def update_development_progress(db: Session, property_id: int) -> Property:
        """Update development progress from latest progress update."""
        property_obj = db.query(Property).filter(Property.id == property_id).first()
        if not property_obj:
            raise ValueError("Property not found")
        
        # Get latest progress update with percentage
        latest_update = db.query(ProgressUpdate).filter(
            ProgressUpdate.property_id == property_id,
            ProgressUpdate.completion_percentage > 0
        ).order_by(ProgressUpdate.date.desc()).first()
        
        if latest_update:
            property_obj.development_progress = latest_update.completion_percentage
        else:
            property_obj.development_progress = 0.0
        
        db.add(property_obj)
        db.commit()
        db.refresh(property_obj)
        
        return property_obj


class AuditService:
    """Service for audit logging."""
    
    @staticmethod
    def log_action(
        db: Session,
        model_name: str,
        record_id: int,
        action: str,
        old_values: Optional[dict] = None,
        new_values: Optional[dict] = None,
        user_id: Optional[int] = None,
        partner_id: Optional[int] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AuditLog:
        """Create an audit log entry."""
        import json
        
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
