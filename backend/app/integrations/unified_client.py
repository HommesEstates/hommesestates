"""
Unified API Client for HommesEstates
=====================================

This client automatically switches between FastAPI and Odoo backends
based on environment configuration.

Usage:
    from ..integrations.unified_client import unified_client
    
    # Get properties - automatically uses Odoo or FastAPI
    properties = await unified_client.get_properties()
    
    # Get property detail
    property = await unified_client.get_property(1)
"""

from typing import Optional, List, Dict, Any, Union
from datetime import datetime
import httpx
import json
from fastapi import HTTPException

from .odoo_config import odoo_settings, is_odoo_enabled
from ..services.cache_service import cache
from ..lib.fastapi import fastAPI, Offer, Payment, Property, Suite
import logging

logger = logging.getLogger(__name__)


class OdooAPIClient:
    """Client for interacting with Odoo's REST API endpoints."""
    
    def __init__(self):
        self.base_url = odoo_settings.api_base_url
        self.database = odoo_settings.database
        self.timeout = odoo_settings.timeout
        self.max_retries = odoo_settings.max_retries
        self._session = None
        self._auth_cookie = None
    
    async def _get_session(self) -> httpx.AsyncClient:
        """Get or create HTTP session."""
        if self._session is None:
            self._session = httpx.AsyncClient(
                timeout=self.timeout,
                follow_redirects=True
            )
        return self._session
    
    async def _make_request(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict] = None,
        json_data: Optional[Dict] = None,
        headers: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Make HTTP request to Odoo with retry logic."""
        url = f"{self.base_url}{endpoint}"
        default_headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        
        # Add auth headers if available
        if odoo_settings.api_key:
            default_headers["X-Api-Key"] = odoo_settings.api_key
        if self._auth_cookie:
            default_headers["Cookie"] = f"session_id={self._auth_cookie}"
        
        if headers:
            default_headers.update(headers)
        
        # Add database param to all requests
        if params is None:
            params = {}
        params["db"] = self.database
        
        session = await self._get_session()
        
        for attempt in range(self.max_retries):
            try:
                if method.upper() == "GET":
                    response = await session.get(url, params=params, headers=default_headers)
                elif method.upper() == "POST":
                    response = await session.post(url, params=params, json=json_data, headers=default_headers)
                elif method.upper() == "PUT":
                    response = await session.put(url, params=params, json=json_data, headers=default_headers)
                elif method.upper() == "DELETE":
                    response = await session.delete(url, params=params, headers=default_headers)
                else:
                    raise ValueError(f"Unsupported HTTP method: {method}")
                
                response.raise_for_status()
                
                # Store session cookie if present
                if "session_id" in response.cookies:
                    self._auth_cookie = response.cookies["session_id"]
                
                return response.json()
                
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 401:
                    # Try to re-authenticate
                    await self._authenticate()
                    if attempt < self.max_retries - 1:
                        continue
                logger.error(f"HTTP error in Odoo request: {e}")
                raise
            except Exception as e:
                logger.error(f"Error in Odoo request (attempt {attempt + 1}): {e}")
                if attempt < self.max_retries - 1:
                    import asyncio
                    await asyncio.sleep(odoo_settings.retry_delay * (attempt + 1))
                    continue
                raise
        
        raise HTTPException(status_code=500, detail="Failed to communicate with Odoo")
    
    async def _authenticate(self) -> bool:
        """Authenticate with Odoo using username/password or API key."""
        if not (odoo_settings.username and odoo_settings.password):
            return False
        
        try:
            auth_data = {
                "login": odoo_settings.username,
                "password": odoo_settings.password,
                "db": self.database
            }
            
            result = await self._make_request("POST", "/api/auth/token", json_data=auth_data)
            
            if result.get("ok"):
                logger.info("Successfully authenticated with Odoo")
                return True
            else:
                logger.error(f"Odoo authentication failed: {result.get('error')}")
                return False
                
        except Exception as e:
            logger.error(f"Error authenticating with Odoo: {e}")
            return False
    
    # ============ Properties ============
    
    async def get_properties(
        self,
        search: Optional[str] = None,
        city: Optional[str] = None,
        sort: Optional[str] = None,
        page: int = 1,
        limit: int = 20
    ) -> List[Property]:
        """Get list of properties from Odoo."""
        cache_key = f"odoo:properties:{search}:{city}:{sort}:{page}:{limit}"
        cached = cache.get(cache_key)
        if cached:
            return cached
        
        params = {
            "page": page,
            "limit": limit,
            "db": self.database
        }
        if search:
            params["search"] = search
        if city:
            params["city"] = city
        if sort:
            params["sort"] = sort
        
        result = await self._make_request("GET", "/api/properties", params=params)
        
        # Transform Odoo response to Property models
        properties = []
        for record in result.get("records", []):
            prop = Property(
                id=record.get("id", 0),
                name=record.get("name", ""),
                code=record.get("code", ""),
                property_type=record.get("property_type", "residential"),
                address=record.get("address", "") or record.get("city", ""),
                description=record.get("description", ""),
                image_url=record.get("main_image_url", ""),
                published=1,
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            properties.append(prop)
        
        cache.set(cache_key, properties, odoo_settings.cache_ttl)
        return properties
    
    async def get_property(self, property_id: int) -> Optional[Property]:
        """Get property detail from Odoo."""
        cache_key = f"odoo:property:{property_id}"
        cached = cache.get(cache_key)
        if cached:
            return cached
        
        result = await self._make_request("GET", f"/api/properties/{property_id}")
        
        if result.get("error"):
            return None
        
        property_data = Property(
            id=result.get("id", 0),
            name=result.get("name", ""),
            code=result.get("code", ""),
            property_type="residential",
            address=result.get("address", "") or result.get("city", ""),
            description=result.get("description", ""),
            image_url=result.get("main_image_url", ""),
            published=1,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        cache.set(cache_key, property_data, odoo_settings.cache_ttl)
        return property_data
    
    # ============ Suites ============
    
    async def get_suites(
        self,
        property_id: Optional[int] = None,
        available_only: bool = True
    ) -> List[Suite]:
        """Get list of suites from Odoo."""
        cache_key = f"odoo:suites:{property_id}:{available_only}"
        cached = cache.get(cache_key)
        if cached:
            return cached
        
        params = {"db": self.database}
        if property_id:
            params["property_id"] = property_id
        
        result = await self._make_request("GET", "/api/suites", params=params)
        
        suites = []
        for record in result.get("records", []):
            suite = Suite(
                id=record.get("id", 0),
                property_id=property_id or 0,
                name=record.get("name", ""),
                number=record.get("suite_number", ""),
                list_price=record.get("list_price", 0.0),
                currency="NGN",
                area_sqm=record.get("size", 0.0),
                is_available=record.get("is_available", True),
                published=1,
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            suites.append(suite)
        
        cache.set(cache_key, suites, odoo_settings.cache_ttl)
        return suites
    
    async def get_suite(self, suite_id: int) -> Optional[Suite]:
        """Get suite detail from Odoo."""
        cache_key = f"odoo:suite:{suite_id}"
        cached = cache.get(cache_key)
        if cached:
            return cached
        
        result = await self._make_request("GET", f"/api/suites/{suite_id}")
        
        if result.get("error"):
            return None
        
        suite = Suite(
            id=result.get("id", 0),
            property_id=0,  # Will be populated from related data
            name=result.get("name", ""),
            number="",
            list_price=result.get("list_price", 0.0),
            currency="NGN",
            area_sqm=0.0,
            is_available=result.get("is_available", True),
            published=1,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        cache.set(cache_key, suite, odoo_settings.cache_ttl)
        return suite
    
    # ============ Offers ============
    
    async def get_my_offers(self) -> List[Offer]:
        """Get current user's offers from Odoo."""
        result = await self._make_request("GET", "/api/offers")
        
        offers = []
        for record in result.get("records", []):
            offer = Offer(
                id=record.get("id", 0),
                name=record.get("name", ""),
                partner_id=0,
                property_id=record.get("property", {}).get("id", 0) if record.get("property") else 0,
                suite_id=record.get("suite", {}).get("id", 0) if record.get("suite") else 0,
                state=record.get("state", "draft"),
                price_total=record.get("amount_total", 0.0),
                currency="NGN",
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            offers.append(offer)
        
        return offers
    
    async def get_my_offer(self, offer_id: int) -> Optional[Offer]:
        """Get offer detail from Odoo."""
        result = await self._make_request("GET", f"/api/offers/{offer_id}")
        
        if result.get("error"):
            return None
        
        return Offer(
            id=result.get("id", 0),
            name=result.get("name", ""),
            partner_id=0,
            property_id=0,
            suite_id=0,
            state=result.get("state", "draft"),
            price_total=result.get("amount_total", 0.0),
            currency=result.get("currency", "NGN"),
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
    
    async def create_offer(self, suite_id: int, payment_term_id: Optional[int] = None, note: str = "") -> Optional[Offer]:
        """Create a new offer in Odoo."""
        data = {
            "suite_id": suite_id,
            "payment_term_id": payment_term_id,
            "note": note
        }
        
        result = await self._make_request("POST", "/api/offers/create", json_data=data)
        
        if result.get("ok"):
            return await self.get_my_offer(result.get("id"))
        return None
    
    async def sign_offer(self, offer_id: int, signature: str) -> bool:
        """Sign an offer in Odoo."""
        data = {"signature": signature}
        
        result = await self._make_request("POST", f"/api/offers/sign/{offer_id}", json_data=data)
        
        return result.get("ok", False)
    
    async def get_offer_payment_schedules(self, offer_id: int) -> List[Dict[str, Any]]:
        """Get payment schedules for an offer from Odoo."""
        # Odoo stores payment schedules on the offer record
        offer = await self.get_my_offer(offer_id)
        if not offer:
            return []
        
        # Return mock schedule based on offer data
        return [{
            "id": 1,
            "offer_id": offer_id,
            "description": "Payment Schedule",
            "due_date": datetime.now().isoformat(),
            "amount": offer.price_total,
            "paid_amount": 0.0,
            "outstanding_amount": offer.price_total,
            "status": "pending"
        }]
    
    # ============ Invoices ============
    
    async def get_my_invoices(self) -> List[Dict[str, Any]]:
        """Get current user's invoices from Odoo."""
        # Need to get partner_id from current user
        # For now, use a default endpoint
        result = await self._make_request("GET", "/api/customers/0/invoices")
        return result.get("records", [])
    
    # ============ Payments ============
    
    async def get_my_payments(self) -> List[Payment]:
        """Get current user's payments from Odoo."""
        # Map Odoo payments to Payment models
        result = await self._make_request("GET", "/api/customers/0/payments")
        
        payments = []
        for record in result.get("records", []):
            payment = Payment(
                id=record.get("id", 0),
                partner_id=record.get("partner_id", 0),
                invoice_id=record.get("invoice_id"),
                amount=record.get("amount", 0.0),
                currency=record.get("currency", "NGN"),
                state=record.get("state", "draft"),
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            payments.append(payment)
        
        return payments
    
    # ============ Authentication ============
    
    async def login(self, email: str, password: str) -> Optional[Dict[str, Any]]:
        """Login to Odoo."""
        data = {
            "login": email,
            "password": password,
            "db": self.database
        }
        
        result = await self._make_request("POST", "/api/auth/token", json_data=data)
        
        if result.get("ok"):
            return {
                "access_token": result.get("session_id", ""),
                "refresh_token": "",
                "user": {
                    "id": result.get("uid", 0),
                    "name": result.get("name", ""),
                    "email": email,
                    "role": result.get("role", "customer"),
                    "partner_id": result.get("partner_id", 0)
                }
            }
        return None
    
    async def signup(self, name: str, email: str, phone: str, password: str) -> Optional[Dict[str, Any]]:
        """Sign up in Odoo."""
        data = {
            "name": name,
            "email": email,
            "phone": phone,
            "password": password
        }
        
        result = await self._make_request("POST", "/api/auth/signup", json_data=data)
        
        if result.get("ok"):
            return {"id": result.get("partner_id", 0)}
        return None


class UnifiedAPIClient:
    """
    Unified API client that automatically switches between FastAPI and Odoo
    based on environment configuration.
    """
    
    def __init__(self):
        self.odoo_client = OdooAPIClient()
        self._use_odoo = is_odoo_enabled()
    
    def _should_use_odoo(self, feature: str) -> bool:
        """Check if we should use Odoo for a specific feature."""
        if not self._use_odoo:
            return False
        
        feature_map = {
            "properties": odoo_settings.use_properties,
            "suites": odoo_settings.use_suites,
            "offers": odoo_settings.use_offers,
            "invoices": odoo_settings.use_invoices,
            "payments": odoo_settings.use_payments,
            "documents": odoo_settings.use_documents,
            "customers": odoo_settings.use_customers,
        }
        
        return feature_map.get(feature, False)
    
    # ============ Properties ============
    
    async def get_properties(self, **kwargs) -> List[Property]:
        """Get properties from Odoo or FastAPI."""
        if self._should_use_odoo("properties"):
            return await self.odoo_client.get_properties(**kwargs)
        return await fastAPI.getProperties(**kwargs)
    
    async def get_property(self, property_id: int) -> Optional[Property]:
        """Get property from Odoo or FastAPI."""
        if self._should_use_odoo("properties"):
            return await self.odoo_client.get_property(property_id)
        return await fastAPI.getProperty(property_id)
    
    # ============ Suites ============
    
    async def get_suites(self, property_id: Optional[int] = None) -> List[Suite]:
        """Get suites from Odoo or FastAPI."""
        if self._should_use_odoo("suites"):
            return await self.odoo_client.get_suites(property_id)
        return await fastAPI.getPropertySuites(property_id)
    
    async def get_suite(self, suite_id: int) -> Optional[Suite]:
        """Get suite from Odoo or FastAPI."""
        if self._should_use_odoo("suites"):
            return await self.odoo_client.get_suite(suite_id)
        # FastAPI doesn't have a direct get_suite method, implement if needed
        return None
    
    # ============ Offers ============
    
    async def get_my_offers(self) -> List[Offer]:
        """Get my offers from Odoo or FastAPI."""
        if self._should_use_odoo("offers"):
            return await self.odoo_client.get_my_offers()
        return await fastAPI.getMyOffers()
    
    async def get_my_offer(self, offer_id: int) -> Optional[Offer]:
        """Get my offer from Odoo or FastAPI."""
        if self._should_use_odoo("offers"):
            return await self.odoo_client.get_my_offer(offer_id)
        return await fastAPI.getMyOffer(offer_id)
    
    async def create_offer(self, suite_id: int, **kwargs) -> Optional[Offer]:
        """Create offer in Odoo or FastAPI."""
        if self._should_use_odoo("offers"):
            return await self.odoo_client.create_offer(suite_id, **kwargs)
        # FastAPI implementation would go here
        return None
    
    async def sign_offer(self, offer_id: int, signature: str) -> bool:
        """Sign offer in Odoo or FastAPI."""
        if self._should_use_odoo("offers"):
            return await self.odoo_client.sign_offer(offer_id, signature)
        return await fastAPI.signOffer(offer_id, signature)
    
    async def get_offer_payment_schedules(self, offer_id: int) -> List[Dict[str, Any]]:
        """Get payment schedules from Odoo or FastAPI."""
        if self._should_use_odoo("offers"):
            return await self.odoo_client.get_offer_payment_schedules(offer_id)
        return await fastAPI.getOfferPaymentSchedules(offer_id)
    
    # ============ Invoices ============
    
    async def get_my_invoices(self) -> List[Dict[str, Any]]:
        """Get my invoices from Odoo or FastAPI."""
        if self._should_use_odoo("invoices"):
            return await self.odoo_client.get_my_invoices()
        return await fastAPI.getMyInvoices()
    
    # ============ Payments ============
    
    async def get_my_payments(self) -> List[Payment]:
        """Get my payments from Odoo or FastAPI."""
        if self._should_use_odoo("payments"):
            return await self.odoo_client.get_my_payments()
        return await fastAPI.getMyPayments()
    
    # ============ Authentication ============
    
    async def login(self, email: str, password: str) -> Optional[Dict[str, Any]]:
        """Login via Odoo or FastAPI."""
        # Auth can come from either system
        # Try Odoo first if enabled
        if self._should_use_odoo("customers"):
            result = await self.odoo_client.login(email, password)
            if result:
                return result
        
        return await fastAPI.login(email, password)
    
    async def signup(self, name: str, email: str, phone: str, password: str) -> Optional[Dict[str, Any]]:
        """Sign up via Odoo or FastAPI."""
        if self._should_use_odoo("customers"):
            result = await self.odoo_client.signup(name, email, phone, password)
            if result:
                return result
        
        return await fastAPI.signup(name, email, phone, password)


# Global unified client instance
unified_client = UnifiedAPIClient()


def get_unified_client() -> UnifiedAPIClient:
    """Get the unified API client instance."""
    return unified_client
