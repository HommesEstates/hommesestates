"""Invoice service for managing invoices and tax calculations."""
from datetime import datetime, date, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from fastapi import Depends

from ..models import Invoice, InvoiceLine, Partner, Offer, Payment
from ..database import get_db


class InvoiceService:
    """Service for invoice management and tax calculations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_invoice(
        self,
        partner_id: int,
        offer_id: Optional[int] = None,
        invoice_date: Optional[date] = None,
        due_date: Optional[date] = None,
        currency: str = "NGN",
        tax_rate: float = 0.0
    ) -> Invoice:
        """Create a new invoice."""
        invoice = Invoice(
            number=self._generate_invoice_number(),
            partner_id=partner_id,
            offer_id=offer_id,
            invoice_date=invoice_date or date.today(),
            due_date=due_date or (date.today() + timedelta(days=30)),
            currency=currency,
            tax_rate=tax_rate,
            state="draft"
        )
        
        self.db.add(invoice)
        self.db.commit()
        self.db.refresh(invoice)
        
        return invoice
    
    def add_invoice_line(
        self,
        invoice_id: int,
        name: str,
        quantity: float = 1.0,
        price_unit: float = 0.0,
        discount: float = 0.0,
        tax_rate: float = 0.0,
        description: Optional[str] = None,
        line_type: str = "product"
    ) -> InvoiceLine:
        """Add a line to an invoice with automatic tax calculations."""
        
        # Calculate subtotal
        price_subtotal = quantity * price_unit
        discount_amount = price_subtotal * (discount / 100)
        price_subtotal_after_discount = price_subtotal - discount_amount
        
        # Calculate tax
        amount_tax = price_subtotal_after_discount * (tax_rate / 100)
        price_total = price_subtotal_after_discount + amount_tax
        
        line = InvoiceLine(
            invoice_id=invoice_id,
            name=name,
            description=description,
            quantity=quantity,
            price_unit=price_unit,
            discount=discount,
            tax_rate=tax_rate,
            amount_tax=amount_tax,
            price_subtotal=price_subtotal_after_discount,
            price_total=price_total,
            line_type=line_type
        )
        
        self.db.add(line)
        self.db.commit()
        self.db.refresh(line)
        
        # Update invoice totals
        self._update_invoice_totals(invoice_id)
        
        return line
    
    def update_invoice_line(
        self,
        line_id: int,
        quantity: Optional[float] = None,
        price_unit: Optional[float] = None,
        discount: Optional[float] = None,
        tax_rate: Optional[float] = None,
        name: Optional[str] = None,
        description: Optional[str] = None
    ) -> InvoiceLine:
        """Update an invoice line with automatic recalculation."""
        
        line = self.db.query(InvoiceLine).filter(InvoiceLine.id == line_id).first()
        if not line:
            raise ValueError(f"Invoice line {line_id} not found")
        
        # Update fields if provided
        if quantity is not None:
            line.quantity = quantity
        if price_unit is not None:
            line.price_unit = price_unit
        if discount is not None:
            line.discount = discount
        if tax_rate is not None:
            line.tax_rate = tax_rate
        if name is not None:
            line.name = name
        if description is not None:
            line.description = description
        
        # Recalculate amounts
        price_subtotal = line.quantity * line.price_unit
        discount_amount = price_subtotal * (line.discount / 100)
        price_subtotal_after_discount = price_subtotal - discount_amount
        amount_tax = price_subtotal_after_discount * (line.tax_rate / 100)
        price_total = price_subtotal_after_discount + amount_tax
        
        line.price_subtotal = price_subtotal_after_discount
        line.amount_tax = amount_tax
        line.price_total = price_total
        
        self.db.commit()
        self.db.refresh(line)
        
        # Update invoice totals
        self._update_invoice_totals(line.invoice_id)
        
        return line
    
    def delete_invoice_line(self, line_id: int) -> bool:
        """Delete an invoice line and update totals."""
        line = self.db.query(InvoiceLine).filter(InvoiceLine.id == line_id).first()
        if not line:
            return False
        
        invoice_id = line.invoice_id
        self.db.delete(line)
        self.db.commit()
        
        # Update invoice totals
        self._update_invoice_totals(invoice_id)
        
        return True
    
    def post_invoice(self, invoice_id: int) -> Invoice:
        """Post an invoice (change state from draft to posted)."""
        invoice = self.db.query(Invoice).filter(Invoice.id == invoice_id).first()
        if not invoice:
            raise ValueError(f"Invoice {invoice_id} not found")
        
        if invoice.state != "draft":
            raise ValueError(f"Invoice {invoice_id} is not in draft state")
        
        # Ensure invoice has lines
        if not invoice.lines:
            raise ValueError(f"Invoice {invoice_id} has no lines")
        
        invoice.state = "posted"
        self.db.commit()
        self.db.refresh(invoice)
        
        return invoice
    
    def cancel_invoice(self, invoice_id: int) -> Invoice:
        """Cancel an invoice."""
        invoice = self.db.query(Invoice).filter(Invoice.id == invoice_id).first()
        if not invoice:
            raise ValueError(f"Invoice {invoice_id} not found")
        
        if invoice.state == "paid":
            raise ValueError(f"Invoice {invoice_id} is already paid")
        
        invoice.state = "cancelled"
        self.db.commit()
        self.db.refresh(invoice)
        
        return invoice
    
    def pay_invoice(self, invoice_id: int, payment_amount: float) -> Invoice:
        """Mark an invoice as paid and update residual."""
        invoice = self.db.query(Invoice).filter(Invoice.id == invoice_id).first()
        if not invoice:
            raise ValueError(f"Invoice {invoice_id} not found")
        
        if invoice.state != "posted":
            raise ValueError(f"Invoice {invoice_id} must be posted before payment")
        
        # Update residual
        invoice.residual = max(0, invoice.residual - payment_amount)
        
        # Mark as paid if fully paid
        if invoice.residual <= 0:
            invoice.state = "paid"
        
        self.db.commit()
        self.db.refresh(invoice)
        
        return invoice
    
    def get_invoice_summary(self, invoice_id: int) -> dict:
        """Get a detailed summary of an invoice."""
        invoice = self.db.query(Invoice).filter(Invoice.id == invoice_id).first()
        if not invoice:
            raise ValueError(f"Invoice {invoice_id} not found")
        
        lines = self.db.query(InvoiceLine).filter(InvoiceLine.invoice_id == invoice_id).all()
        
        return {
            "invoice": {
                "id": invoice.id,
                "number": invoice.number,
                "partner_id": invoice.partner_id,
                "partner_name": invoice.partner.name if invoice.partner else None,
                "state": invoice.state,
                "invoice_date": invoice.invoice_date.isoformat(),
                "due_date": invoice.due_date.isoformat() if invoice.due_date else None,
                "currency": invoice.currency,
                "amount_untaxed": invoice.amount_untaxed,
                "amount_tax": invoice.amount_tax,
                "amount_total": invoice.amount_total,
                "residual": invoice.residual,
                "tax_rate": invoice.tax_rate
            },
            "lines": [
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
        }
    
    def create_invoice_from_offer(self, offer_id: int, tax_rate: float = 7.5) -> Invoice:
        """Create an invoice from an offer."""
        offer = self.db.query(Offer).filter(Offer.id == offer_id).first()
        if not offer:
            raise ValueError(f"Offer {offer_id} not found")
        
        # Create invoice
        invoice = self.create_invoice(
            partner_id=offer.partner_id,
            offer_id=offer_id,
            tax_rate=tax_rate
        )
        
        # Add suite line
        if offer.suite:
            suite_price = offer.suite.list_price or 0
            self.add_invoice_line(
                invoice_id=invoice.id,
                name=f"Suite {offer.suite.name}",
                description=f"Property: {offer.suite.property.name if offer.suite.property else 'N/A'}",
                quantity=1,
                price_unit=suite_price,
                tax_rate=tax_rate,
                line_type="product"
            )
        
        # Add payment schedule lines if applicable
        for schedule in offer.payment_schedules:
            if schedule.amount > 0:
                self.add_invoice_line(
                    invoice_id=invoice.id,
                    name=f"Payment Schedule - {schedule.description or 'Installment'}",
                    description=f"Due: {schedule.due_date.isoformat() if schedule.due_date else 'N/A'}",
                    quantity=1,
                    price_unit=schedule.amount,
                    tax_rate=0,  # Payment schedules usually don't have tax
                    line_type="service"
                )
        
        return invoice
    
    def _generate_invoice_number(self) -> str:
        """Generate a unique invoice number."""
        today = date.today()
        year = today.year
        month = today.month
        
        # Find the last invoice for this month
        last_invoice = self.db.query(Invoice).filter(
            and_(
                func.extract('year', Invoice.invoice_date) == year,
                func.extract('month', Invoice.invoice_date) == month
            )
        ).order_by(Invoice.number.desc()).first()
        
        if last_invoice and last_invoice.number:
            # Extract sequence number from last invoice
            try:
                parts = last_invoice.number.split('/')
                if len(parts) >= 3:
                    seq = int(parts[-1]) + 1
                else:
                    seq = 1
            except (ValueError, IndexError):
                seq = 1
        else:
            seq = 1
        
        return f"INV/{year:04d}/{month:02d}/{seq:04d}"
    
    def _update_invoice_totals(self, invoice_id: int) -> None:
        """Update invoice totals based on lines."""
        invoice = self.db.query(Invoice).filter(Invoice.id == invoice_id).first()
        if not invoice:
            return
        
        lines = self.db.query(InvoiceLine).filter(InvoiceLine.invoice_id == invoice_id).all()
        
        amount_untaxed = sum(line.price_subtotal for line in lines)
        amount_tax = sum(line.amount_tax for line in lines)
        amount_total = sum(line.price_total for line in lines)
        
        invoice.amount_untaxed = amount_untaxed
        invoice.amount_tax = amount_tax
        invoice.amount_total = amount_total
        invoice.residual = amount_total if invoice.state != "paid" else 0.0
        
        self.db.commit()


def get_invoice_service(db: Session = Depends(get_db)) -> InvoiceService:
    """Dependency to get invoice service."""
    return InvoiceService(db)
