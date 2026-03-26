"""Payment gateway integrations for multiple payment providers."""
import json
import hashlib
import hmac
import uuid
from typing import Dict, Optional, Any, List
from datetime import datetime, timedelta
from abc import ABC, abstractmethod
from pydantic import BaseModel
import requests
from sqlalchemy.orm import Session

from ..models import Payment, Invoice, Partner
from ..config import settings


class PaymentRequest(BaseModel):
    """Payment request model."""
    amount: float
    currency: str = "NGN"
    email: str
    reference: Optional[str] = None
    callback_url: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = {}


class PaymentResponse(BaseModel):
    """Payment response model."""
    success: bool
    reference: str
    authorization_url: Optional[str] = None
    status: str
    message: str
    data: Optional[Dict[str, Any]] = None


class PaymentVerification(BaseModel):
    """Payment verification model."""
    success: bool
    status: str
    amount: float
    currency: str
    reference: str
    metadata: Optional[Dict[str, Any]] = None


class PaymentGateway(ABC):
    """Abstract base class for payment gateways."""
    
    @abstractmethod
    async def initialize_payment(self, request: PaymentRequest) -> PaymentResponse:
        """Initialize a payment transaction."""
        pass
    
    @abstractmethod
    async def verify_payment(self, reference: str) -> PaymentVerification:
        """Verify a payment transaction."""
        pass
    
    @abstractmethod
    async def get_transaction(self, reference: str) -> Dict[str, Any]:
        """Get transaction details."""
        pass


class PaystackGateway(PaymentGateway):
    """Paystack payment gateway implementation."""
    
    def __init__(self, secret_key: str, base_url: str = "https://api.paystack.co"):
        self.secret_key = secret_key
        self.base_url = base_url
        self.headers = {
            "Authorization": f"Bearer {secret_key}",
            "Content-Type": "application/json"
        }
    
    def _generate_reference(self) -> str:
        """Generate unique transaction reference."""
        return f"HS_{datetime.now().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:8]}"
    
    async def initialize_payment(self, request: PaymentRequest) -> PaymentResponse:
        """Initialize payment with Paystack."""
        if not request.reference:
            request.reference = self._generate_reference()
        
        payload = {
            "amount": int(request.amount * 100),  # Convert to kobo
            "email": request.email,
            "reference": request.reference,
            "callback_url": request.callback_url or f"{settings.backend_url}/payments/callback"
        }
        
        if request.metadata:
            payload["metadata"] = request.metadata
        
        try:
            response = requests.post(
                f"{self.base_url}/transaction/initialize",
                json=payload,
                headers=self.headers,
                timeout=30
            )
            response.raise_for_status()
            data = response.json()
            
            if data.get("status"):
                return PaymentResponse(
                    success=True,
                    reference=data["data"]["reference"],
                    authorization_url=data["data"]["authorization_url"],
                    status="pending",
                    message="Payment initialized successfully",
                    data=data["data"]
                )
            else:
                return PaymentResponse(
                    success=False,
                    reference=request.reference,
                    status="failed",
                    message=data.get("message", "Payment initialization failed"),
                    data=data
                )
        
        except requests.RequestException as e:
            return PaymentResponse(
                success=False,
                reference=request.reference,
                status="error",
                message=f"Network error: {str(e)}"
            )
    
    async def verify_payment(self, reference: str) -> PaymentVerification:
        """Verify payment with Paystack."""
        try:
            response = requests.get(
                f"{self.base_url}/transaction/verify/{reference}",
                headers=self.headers,
                timeout=30
            )
            response.raise_for_status()
            data = response.json()
            
            if data.get("status") and data["data"]["status"] == "success":
                return PaymentVerification(
                    success=True,
                    status=data["data"]["status"],
                    amount=data["data"]["amount"] / 100,  # Convert from kobo
                    currency=data["data"]["currency"],
                    reference=data["data"]["reference"],
                    metadata=data["data"].get("metadata")
                )
            else:
                return PaymentVerification(
                    success=False,
                    status=data["data"]["status"] if data.get("data") else "failed",
                    amount=0.0,
                    currency="NGN",
                    reference=reference
                )
        
        except requests.RequestException:
            return PaymentVerification(
                success=False,
                status="error",
                amount=0.0,
                currency="NGN",
                reference=reference
            )
    
    async def get_transaction(self, reference: str) -> Dict[str, Any]:
        """Get transaction details from Paystack."""
        try:
            response = requests.get(
                f"{self.base_url}/transaction/verify/{reference}",
                headers=self.headers,
                timeout=30
            )
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            return {"error": str(e)}


class FlutterwaveGateway(PaymentGateway):
    """Flutterwave payment gateway implementation."""
    
    def __init__(self, secret_key: str, base_url: str = "https://api.flutterwave.com/v3"):
        self.secret_key = secret_key
        self.base_url = base_url
        self.headers = {
            "Authorization": f"Bearer {secret_key}",
            "Content-Type": "application/json"
        }
    
    def _generate_reference(self) -> str:
        """Generate unique transaction reference."""
        return f"HS_FW_{datetime.now().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:8]}"
    
    async def initialize_payment(self, request: PaymentRequest) -> PaymentResponse:
        """Initialize payment with Flutterwave."""
        if not request.reference:
            request.reference = self._generate_reference()
        
        payload = {
            "tx_ref": request.reference,
            "amount": request.amount,
            "currency": request.currency,
            "payment_options": "card, banktransfer, ussd",
            "redirect_url": request.callback_url or f"{settings.backend_url}/payments/flutterwave/callback",
            "customer": {
                "email": request.email
            },
            "customizations": {
                "title": "HommesEstates Payment",
                "description": "Payment for real estate services"
            }
        }
        
        if request.metadata:
            payload["meta"] = request.metadata
        
        try:
            response = requests.post(
                f"{self.base_url}/payments",
                json=payload,
                headers=self.headers,
                timeout=30
            )
            response.raise_for_status()
            data = response.json()
            
            if data.get("status") == "success":
                return PaymentResponse(
                    success=True,
                    reference=data["data"]["tx_ref"],
                    authorization_url=data["data"]["link"],
                    status="pending",
                    message="Payment initialized successfully",
                    data=data["data"]
                )
            else:
                return PaymentResponse(
                    success=False,
                    reference=request.reference,
                    status="failed",
                    message=data.get("message", "Payment initialization failed"),
                    data=data
                )
        
        except requests.RequestException as e:
            return PaymentResponse(
                success=False,
                reference=request.reference,
                status="error",
                message=f"Network error: {str(e)}"
            )
    
    async def verify_payment(self, reference: str) -> PaymentVerification:
        """Verify payment with Flutterwave."""
        try:
            response = requests.get(
                f"{self.base_url}/transactions/{reference}/verify",
                headers=self.headers,
                timeout=30
            )
            response.raise_for_status()
            data = response.json()
            
            if data.get("status") == "success" and data["data"]["status"] == "successful":
                return PaymentVerification(
                    success=True,
                    status=data["data"]["status"],
                    amount=data["data"]["amount"],
                    currency=data["data"]["currency"],
                    reference=data["data"]["tx_ref"],
                    metadata=data["data"].get("meta")
                )
            else:
                return PaymentVerification(
                    success=False,
                    status=data["data"]["status"] if data.get("data") else "failed",
                    amount=0.0,
                    currency=request.currency,
                    reference=reference
                )
        
        except requests.RequestException:
            return PaymentVerification(
                success=False,
                status="error",
                amount=0.0,
                currency="NGN",
                reference=reference
            )
    
    async def get_transaction(self, reference: str) -> Dict[str, Any]:
        """Get transaction details from Flutterwave."""
        try:
            response = requests.get(
                f"{self.base_url}/transactions/{reference}/verify",
                headers=self.headers,
                timeout=30
            )
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            return {"error": str(e)}


class PaymentGatewayService:
    """Service for managing multiple payment gateways."""
    
    def __init__(self):
        self.gateways: Dict[str, PaymentGateway] = {}
        self._initialize_gateways()
    
    def _initialize_gateways(self):
        """Initialize available payment gateways."""
        # Initialize Paystack if credentials are available
        paystack_secret = getattr(settings, 'paystack_secret_key', None)
        if paystack_secret:
            self.gateways["paystack"] = PaystackGateway(paystack_secret)
        
        # Initialize Flutterwave if credentials are available
        flutterwave_secret = getattr(settings, 'flutterwave_secret_key', None)
        if flutterwave_secret:
            self.gateways["flutterwave"] = FlutterwaveGateway(flutterwave_secret)
    
    def get_gateway(self, gateway_name: str) -> Optional[PaymentGateway]:
        """Get a specific payment gateway."""
        return self.gateways.get(gateway_name)
    
    def get_available_gateways(self) -> List[str]:
        """Get list of available gateway names."""
        return list(self.gateways.keys())
    
    async def initialize_payment(
        self, 
        gateway_name: str, 
        request: PaymentRequest
    ) -> PaymentResponse:
        """Initialize payment through a specific gateway."""
        gateway = self.get_gateway(gateway_name)
        if not gateway:
            return PaymentResponse(
                success=False,
                reference=request.reference or "",
                status="error",
                message=f"Gateway '{gateway_name}' not available"
            )
        
        return await gateway.initialize_payment(request)
    
    async def verify_payment(self, gateway_name: str, reference: str) -> PaymentVerification:
        """Verify payment through a specific gateway."""
        gateway = self.get_gateway(gateway_name)
        if not gateway:
            return PaymentVerification(
                success=False,
                status="error",
                amount=0.0,
                currency="NGN",
                reference=reference
            )
        
        return await gateway.verify_payment(reference)
    
    async def process_payment_callback(
        self, 
        gateway_name: str, 
        callback_data: Dict[str, Any],
        db: Session
    ) -> Dict[str, Any]:
        """Process payment callback from gateway."""
        gateway = self.get_gateway(gateway_name)
        if not gateway:
            return {"success": False, "message": "Gateway not available"}
        
        # Extract reference from callback data
        reference = None
        if gateway_name == "paystack":
            reference = callback_data.get("reference")
        elif gateway_name == "flutterwave":
            reference = callback_data.get("tx_ref")
        
        if not reference:
            return {"success": False, "message": "No reference found"}
        
        # Verify payment
        verification = await gateway.verify_payment(reference)
        
        if verification.success:
            # Find and update payment record
            payment = db.query(Payment).filter(
                Payment.reference == reference
            ).first()
            
            if payment:
                payment.state = "posted"
                payment.amount = verification.amount
                db.commit()
                
                return {
                    "success": True,
                    "message": "Payment processed successfully",
                    "payment_id": payment.id
                }
            else:
                return {"success": False, "message": "Payment record not found"}
        else:
            return {
                "success": False,
                "message": f"Payment verification failed: {verification.status}"
            }


# Global payment gateway service
payment_gateway_service = PaymentGatewayService()


def get_payment_gateway_service() -> PaymentGatewayService:
    """Dependency to get payment gateway service."""
    return payment_gateway_service
