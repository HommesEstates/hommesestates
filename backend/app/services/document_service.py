"""Document management and generation services."""
import os
import uuid
import json
from datetime import date, datetime
from typing import Optional, List, Dict, Any
from pathlib import Path
from sqlalchemy.orm import Session
from jinja2 import Template
import logging

from ..models import (
    Document, DocumentFolder, DocumentVersion, DocumentTemplate,
    DocumentShare, DocumentAccessLog, Offer, Partner, Company,
    Payment, PaymentSchedule, Property, Suite
)
from ..config import settings

logger = logging.getLogger(__name__)


class DocumentService:
    """Service for document management operations."""
    
    @staticmethod
    def create_document(
        db: Session,
        name: str,
        content_type: str,
        doc_type: str,
        file_path: str,
        size: int,
        folder_id: Optional[int] = None,
        partner_id: Optional[int] = None,
        offer_id: Optional[int] = None,
        payment_id: Optional[int] = None,
        property_id: Optional[int] = None,
        suite_id: Optional[int] = None,
    ) -> Document:
        """Create a new document record."""
        doc = Document(
            name=name,
            content_type=content_type,
            doc_type=doc_type,
            size=size,
            file_path=file_path,
            folder_id=folder_id,
            partner_id=partner_id,
            offer_id=offer_id,
            payment_id=payment_id,
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        return doc
    
    @staticmethod
    def create_version(
        db: Session,
        document_id: int,
        file_path: str,
        size: int,
        file_content: Optional[bytes] = None,
        uploaded_by: Optional[int] = None,
        notes: Optional[str] = None,
    ) -> DocumentVersion:
        """Create a new version of a document."""
        # Get current version count
        existing_versions = db.query(DocumentVersion).filter(
            DocumentVersion.document_id == document_id
        ).count()
        
        version = DocumentVersion(
            document_id=document_id,
            version_number=existing_versions + 1,
            file_path=file_path,
            file_content=file_content,
            size=size,
            uploaded_by=uploaded_by,
            notes=notes,
        )
        db.add(version)
        db.commit()
        db.refresh(version)
        return version
    
    @staticmethod
    def create_folder(
        db: Session,
        name: str,
        parent_id: Optional[int] = None,
        workspace_id: Optional[int] = None,
    ) -> DocumentFolder:
        """Create a document folder."""
        folder = DocumentFolder(
            name=name,
            parent_id=parent_id,
            workspace_id=workspace_id,
        )
        db.add(folder)
        db.commit()
        db.refresh(folder)
        return folder
    
    @staticmethod
    def get_folder_path(db: Session, folder_id: int) -> str:
        """Get full path of a folder."""
        parts = []
        current = db.query(DocumentFolder).filter(DocumentFolder.id == folder_id).first()
        
        while current:
            parts.insert(0, current.name)
            if current.parent_id:
                current = db.query(DocumentFolder).filter(
                    DocumentFolder.id == current.parent_id
                ).first()
            else:
                break
        
        return "/".join(parts)
    
    @staticmethod
    def create_share(
        db: Session,
        document_id: int,
        password: Optional[str] = None,
        expires_days: Optional[int] = 7,
    ) -> DocumentShare:
        """Create a share link for a document."""
        access_token = str(uuid.uuid4())
        
        expires_at = None
        if expires_days:
            expires_at = datetime.utcnow() + timedelta(days=expires_days)
        
        share = DocumentShare(
            document_id=document_id,
            access_token=access_token,
            password_hash=password,  # In production, hash this
            expires_at=expires_at,
        )
        db.add(share)
        db.commit()
        db.refresh(share)
        return share
    
    @staticmethod
    def log_access(
        db: Session,
        document_id: int,
        share_id: Optional[int] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        status_code: int = 200,
    ) -> DocumentAccessLog:
        """Log document access."""
        log = DocumentAccessLog(
            document_id=document_id,
            share_id=share_id,
            ip_address=ip_address,
            user_agent=user_agent,
            status_code=status_code,
        )
        db.add(log)
        db.commit()
        return log
    
    @staticmethod
    def search_documents(
        db: Session,
        query: Optional[str] = None,
        doc_type: Optional[str] = None,
        partner_id: Optional[int] = None,
        folder_id: Optional[int] = None,
        limit: int = 50,
    ) -> List[Document]:
        """Search documents with filters."""
        q = db.query(Document)
        
        if query:
            q = q.filter(Document.name.ilike(f"%{query}%"))
        if doc_type:
            q = q.filter(Document.doc_type == doc_type)
        if partner_id:
            q = q.filter(Document.partner_id == partner_id)
        if folder_id:
            q = q.filter(Document.folder_id == folder_id)
        
        return q.order_by(Document.id.desc()).limit(limit).all()


class TemplateService:
    """Service for document template rendering."""
    
    @staticmethod
    def get_template(db: Session, template_id: int) -> Optional[DocumentTemplate]:
        """Get a document template."""
        return db.query(DocumentTemplate).filter(
            DocumentTemplate.id == template_id,
            DocumentTemplate.active == 1
        ).first()
    
    @staticmethod
    def get_template_by_type(db: Session, document_type: str) -> Optional[DocumentTemplate]:
        """Get template by document type."""
        return db.query(DocumentTemplate).filter(
            DocumentTemplate.document_type == document_type,
            DocumentTemplate.active == 1
        ).first()
    
    @staticmethod
    def render_template(
        template: DocumentTemplate,
        context: Dict[str, Any],
    ) -> str:
        """Render a template with context."""
        jinja_template = Template(template.html_content)
        return jinja_template.render(**context)
    
    @staticmethod
    def get_offer_context(db: Session, offer: Offer) -> Dict[str, Any]:
        """Get template context for an offer."""
        partner = db.query(Partner).filter(Partner.id == offer.partner_id).first()
        suite = db.query(Suite).filter(Suite.id == offer.suite_id).first() if offer.suite_id else None
        property_obj = db.query(Property).filter(Property.id == offer.property_id).first() if offer.property_id else None
        company = db.query(Company).first()
        
        # Get payment schedules
        schedules = db.query(PaymentSchedule).filter(
            PaymentSchedule.offer_id == offer.id
        ).order_by(PaymentSchedule.due_date).all()
        
        return {
            "offer": offer,
            "partner": partner,
            "suite": suite,
            "property": property_obj,
            "company": company,
            "payment_schedules": schedules,
            "current_date": date.today(),
            "currency": offer.currency or "NGN",
            "amount_total": offer.amount_total or offer.price_total or 0,
            "amount_in_words": TemplateService._number_to_words(offer.amount_total or offer.price_total or 0),
        }
    
    @staticmethod
    def get_payment_context(db: Session, payment: Payment) -> Dict[str, Any]:
        """Get template context for a payment."""
        partner = db.query(Partner).filter(Partner.id == payment.partner_id).first()
        offer = db.query(Offer).filter(Offer.id == payment.offer_id).first() if payment.offer_id else None
        company = db.query(Company).first()
        
        return {
            "payment": payment,
            "partner": partner,
            "offer": offer,
            "company": company,
            "current_date": date.today(),
            "currency": payment.currency or "NGN",
            "amount_in_words": TemplateService._number_to_words(payment.amount),
        }
    
    @staticmethod
    def _number_to_words(num: float) -> str:
        """Convert number to words (simplified)."""
        # In production, use num2words library
        ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
        tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
        teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
        
        if num == 0:
            return "Zero"
        
        # For simplicity, just return the number formatted
        # In production, implement full conversion
        return f"{num:,.2f} Naira"


class PDFService:
    """Service for PDF generation."""
    
    @staticmethod
    def generate_offer_letter(db: Session, offer: Offer, template_id: Optional[int] = None) -> Document:
        """Generate offer letter PDF."""
        # Get template
        if template_id:
            template = TemplateService.get_template(db, template_id)
        else:
            template = TemplateService.get_template_by_type(db, "offer")
        
        if not template:
            # Use default template
            html_content = PDFService._get_default_offer_template()
        else:
            context = TemplateService.get_offer_context(db, offer)
            html_content = TemplateService.render_template(template, context)
        
        # In production, convert HTML to PDF using Playwright, WeasyPrint, or ReportLab
        # For now, store the HTML
        file_path = f"offers/{offer.id}/offer_letter_{date.today().strftime('%Y%m%d')}.html"
        
        # Ensure directory exists
        full_path = Path(settings.document_storage_path) / file_path
        full_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(full_path, 'w') as f:
            f.write(html_content)
        
        # Create document record
        doc = DocumentService.create_document(
            db=db,
            name=f"Offer Letter - {offer.code or offer.id}",
            content_type="text/html",  # Would be application/pdf in production
            doc_type="offer_letter",
            file_path=file_path,
            size=len(html_content.encode()),
            partner_id=offer.partner_id,
            offer_id=offer.id,
        )
        
        return doc
    
    @staticmethod
    def generate_payment_acknowledgement(db: Session, payment: Payment, template_id: Optional[int] = None) -> Document:
        """Generate payment acknowledgement PDF."""
        # Get template
        if template_id:
            template = TemplateService.get_template(db, template_id)
        else:
            template = TemplateService.get_template_by_type(db, "payment_ack")
        
        if not template:
            html_content = PDFService._get_default_payment_ack_template()
        else:
            context = TemplateService.get_payment_context(db, payment)
            html_content = TemplateService.render_template(template, context)
        
        # Store file
        file_path = f"payments/{payment.id}/acknowledgement_{date.today().strftime('%Y%m%d')}.html"
        
        full_path = Path(settings.document_storage_path) / file_path
        full_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(full_path, 'w') as f:
            f.write(html_content)
        
        # Create document record
        doc = DocumentService.create_document(
            db=db,
            name=f"Payment Acknowledgement - {payment.id}",
            content_type="text/html",
            doc_type="payment_ack",
            file_path=file_path,
            size=len(html_content.encode()),
            partner_id=payment.partner_id,
            payment_id=payment.id,
        )
        
        return doc
    
    @staticmethod
    def _get_default_offer_template() -> str:
        """Get default offer letter HTML template."""
        return """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Offer Letter</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 40px; }
        .content { line-height: 1.6; }
        .signature { margin-top: 60px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>HOMMES ESTATES</h1>
        <p>Real Estate & Facilities Management</p>
    </div>
    
    <div class="content">
        <h2>OFFER LETTER</h2>
        
        <p>Date: {{ current_date }}</p>
        <p>Reference: {{ offer.code or offer.id }}</p>
        
        <p>Dear {{ partner.name }},</p>
        
        <p>We are pleased to offer you the following property:</p>
        
        <table>
            <tr>
                <th>Property</th>
                <td>{{ property.name if property else '' }}</td>
            </tr>
            <tr>
                <th>Suite</th>
                <td>{{ suite.name if suite else '' }}</td>
            </tr>
            <tr>
                <th>Total Amount</th>
                <td>{{ currency }} {{ "%.2f"|format(amount_total) }}</td>
            </tr>
        </table>
        
        <p><strong>Amount in words:</strong> {{ amount_in_words }}</p>
        
        <p>This offer is valid until {{ offer.validity_date }}.</p>
        
        <div class="signature">
            <p>For: Hommes Estates</p>
            <br><br>
            <p>_________________________<br>Authorized Signatory</p>
        </div>
    </div>
</body>
</html>
        """
    
    @staticmethod
    def _get_default_payment_ack_template() -> str:
        """Get default payment acknowledgement HTML template."""
        return """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Payment Acknowledgement</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 40px; }
        .content { line-height: 1.6; }
        .receipt-box { border: 2px solid #333; padding: 20px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>HOMMES ESTATES</h1>
        <p>Payment Acknowledgement</p>
    </div>
    
    <div class="receipt-box">
        <p><strong>Receipt No:</strong> PAY-{{ payment.id }}</p>
        <p><strong>Date:</strong> {{ payment.date }}</p>
        <p><strong>Received from:</strong> {{ partner.name }}</p>
        <p><strong>Amount:</strong> {{ currency }} {{ "%.2f"|format(payment.amount) }}</p>
        <p><strong>Amount in words:</strong> {{ amount_in_words }}</p>
        <p><strong>Payment Method:</strong> Bank Transfer</p>
    </div>
    
    <p>Thank you for your payment.</p>
</body>
</html>
        """


# Import timedelta for expires_at calculation
from datetime import timedelta
