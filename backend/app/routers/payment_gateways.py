"""Payment gateway API endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Dict, Any

from ..database import get_db
from ..models import Payment, Invoice, Partner
from ..services.payment_gateway_service import (
    PaymentGatewayService,
    PaymentRequest,
    PaymentResponse,
    get_payment_gateway_service
)
from ..deps import require_role

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/initialize/{gateway_name}")
async def initialize_payment(
    gateway_name: str,
    request: PaymentRequest,
    gateway_service: PaymentGatewayService = Depends(get_payment_gateway_service)
):
    """Initialize a payment through a specific gateway."""
    response = await gateway_service.initialize_payment(gateway_name, request)
    
    if not response.success:
        raise HTTPException(status_code=400, detail=response.message)
    
    return response


@router.get("/verify/{gateway_name}/{reference}")
async def verify_payment(
    gateway_name: str,
    reference: str,
    gateway_service: PaymentGatewayService = Depends(get_payment_gateway_service)
):
    """Verify a payment transaction."""
    verification = await gateway_service.verify_payment(gateway_name, reference)
    
    return verification


@router.post("/callback/{gateway_name}")
async def payment_callback(
    gateway_name: str,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    gateway_service: PaymentGatewayService = Depends(get_payment_gateway_service)
):
    """Handle payment callback from gateway."""
    try:
        # Get callback data
        if gateway_name == "paystack":
            # Paystack sends the data as JSON in the request body
            callback_data = await request.json()
        elif gateway_name == "flutterwave":
            # Flutterwave also sends JSON data
            callback_data = await request.json()
        else:
            raise HTTPException(status_code=400, detail="Unsupported gateway")
        
        # Process payment in background
        background_tasks.add_task(
            process_payment_background,
            gateway_name,
            callback_data,
            db,
            gateway_service
        )
        
        return {"status": "processing"}
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Callback processing failed: {str(e)}")


async def process_payment_background(
    gateway_name: str,
    callback_data: Dict[str, Any],
    db: Session,
    gateway_service: PaymentGatewayService
):
    """Process payment callback in background."""
    try:
        result = await gateway_service.process_payment_callback(
            gateway_name,
            callback_data,
            db
        )
        
        if result["success"]:
            # Send real-time notification
            from ..services.websocket_service import realtime_service
            
            payment_id = result.get("payment_id")
            if payment_id:
                payment = db.query(Payment).filter(Payment.id == payment_id).first()
                if payment:
                    await realtime_service.notify_payment_received(
                        payment_id,
                        payment.amount,
                        payment.partner_id
                    )
    
    except Exception as e:
        # Log error for debugging
        print(f"Error processing payment callback: {e}")


@router.get("/gateways")
async def get_available_gateways(
    gateway_service: PaymentGatewayService = Depends(get_payment_gateway_service)
):
    """Get list of available payment gateways."""
    return {
        "gateways": gateway_service.get_available_gateways(),
        "default_gateway": gateway_service.get_available_gateways()[0] if gateway_service.get_available_gateways() else None
    }


@router.post("/invoice/{invoice_id}/pay/{gateway_name}")
async def pay_invoice(
    invoice_id: int,
    gateway_name: str,
    db: Session = Depends(get_db),
    gateway_service: PaymentGatewayService = Depends(get_payment_gateway_service)
):
    """Initialize payment for an invoice."""
    # Get invoice
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Get partner
    partner = db.query(Partner).filter(Partner.id == invoice.partner_id).first()
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    # Create payment request
    payment_request = PaymentRequest(
        amount=invoice.residual,
        currency=invoice.currency,
        email=partner.email,
        reference=f"INV_{invoice_id}_{invoice.number}",
        metadata={
            "invoice_id": invoice_id,
            "partner_id": invoice.partner_id,
            "type": "invoice_payment"
        }
    )
    
    # Initialize payment
    response = await gateway_service.initialize_payment(gateway_name, payment_request)
    
    if not response.success:
        raise HTTPException(status_code=400, detail=response.message)
    
    # Create payment record
    payment = Payment(
        partner_id=invoice.partner_id,
        invoice_id=invoice.id,
        amount=invoice.residual,
        currency=invoice.currency,
        reference=response.reference,
        state="draft"
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    
    return {
        "payment_id": payment.id,
        "authorization_url": response.authorization_url,
        "reference": response.reference,
        "amount": invoice.residual,
        "currency": invoice.currency
    }


@router.get("/transaction/{gateway_name}/{reference}")
async def get_transaction(
    gateway_name: str,
    reference: str,
    gateway_service: PaymentGatewayService = Depends(get_payment_gateway_service)
):
    """Get transaction details from gateway."""
    gateway = gateway_service.get_gateway(gateway_name)
    if not gateway:
        raise HTTPException(status_code=404, detail="Gateway not found")
    
    transaction = await gateway.get_transaction(reference)
    return transaction


@router.post("/webhook/{gateway_name}")
async def payment_webhook(
    gateway_name: str,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    gateway_service: PaymentGatewayService = Depends(get_payment_gateway_service)
):
    """Handle payment webhook from gateway."""
    try:
        # Get webhook data
        webhook_data = await request.json()
        
        # Verify webhook signature if needed
        if gateway_name == "paystack":
            # Paystack sends x-paystack-signature header
            signature = request.headers.get("x-paystack-signature")
            if not signature:
                raise HTTPException(status_code=400, detail="Missing signature")
            
            # Verify signature (implementation needed)
            # This is a placeholder - implement proper signature verification
            pass
        
        elif gateway_name == "flutterwave":
            # Flutterwave sends flutterwave-signature header
            signature = request.headers.get("flutterwave-signature")
            if not signature:
                raise HTTPException(status_code=400, detail="Missing signature")
            
            # Verify signature (implementation needed)
            # This is a placeholder - implement proper signature verification
            pass
        
        # Process webhook in background
        background_tasks.add_task(
            process_webhook_background,
            gateway_name,
            webhook_data,
            db,
            gateway_service
        )
        
        return {"status": "received"}
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook processing failed: {str(e)}")


async def process_webhook_background(
    gateway_name: str,
    webhook_data: Dict[str, Any],
    db: Session,
    gateway_service: PaymentGatewayService
):
    """Process webhook in background."""
    try:
        # Handle different webhook events
        if gateway_name == "paystack":
            event = webhook_data.get("event")
            data = webhook_data.get("data", {})
            
            if event == "charge.success":
                reference = data.get("reference")
                if reference:
                    verification = await gateway_service.verify_payment(gateway_name, reference)
                    if verification.success:
                        # Update payment record
                        payment = db.query(Payment).filter(
                            Payment.reference == reference
                        ).first()
                        if payment:
                            payment.state = "posted"
                            db.commit()
        
        elif gateway_name == "flutterwave":
            event = webhook_data.get("event")
            data = webhook_data.get("data", {})
            
            if event == "charge.completed":
                reference = data.get("tx_ref")
                if reference:
                    verification = await gateway_service.verify_payment(gateway_name, reference)
                    if verification.success:
                        # Update payment record
                        payment = db.query(Payment).filter(
                            Payment.reference == reference
                        ).first()
                        if payment:
                            payment.state = "posted"
                            db.commit()
    
    except Exception as e:
        print(f"Error processing webhook: {e}")
