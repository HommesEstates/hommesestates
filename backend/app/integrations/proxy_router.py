"""
Odoo Backend Proxy Layer
========================

This module provides a proxy layer that routes incoming FastAPI requests
to Odoo when ODOO_ENABLED is true. This allows the frontend to continue
using the same API endpoints while the backend switches data sources.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from typing import Optional, List, Dict, Any
import httpx
import json

from ..integrations.odoo_config import odoo_settings, is_odoo_enabled
from ..integrations.unified_client import get_unified_client
from ..deps import require_role, get_current_user
from ..database import get_db
from sqlalchemy.orm import Session

router = APIRouter(prefix="/proxy", tags=["odoo-proxy"])

# Odoo session cache
_odooclient = None


def get_odoo_client():
    """Get or create Odoo client instance."""
    global _odooclient
    if _odooclient is None and is_odoo_enabled():
        from ..integrations.unified_client import OdooAPIClient
        _odooclient = OdooAPIClient()
    return _odooclient


async def proxy_to_odoo(
    method: str,
    endpoint: str,
    params: Optional[Dict] = None,
    json_data: Optional[Dict] = None,
    headers: Optional[Dict] = None
) -> Dict[str, Any]:
    """Proxy a request to Odoo backend."""
    client = get_odoo_client()
    if not client:
        raise HTTPException(status_code=503, detail="Odoo integration not available")
    
    return await client._make_request(method, endpoint, params, json_data, headers)


# ============ Auth Proxy Endpoints ============

@router.post("/auth/token")
async def proxy_auth_token(request: Request):
    """Proxy authentication request to Odoo."""
    if not is_odoo_enabled():
        raise HTTPException(status_code=404, detail="Odoo integration not enabled")
    
    data = await request.json()
    result = await proxy_to_odoo("POST", "/api/auth/token", json_data=data)
    
    if result.get("ok"):
        return {
            "access_token": result.get("session_id", ""),
            "refresh_token": "",
            "token_type": "bearer",
            "user": {
                "id": result.get("uid"),
                "name": result.get("name"),
                "email": data.get("login"),
                "role": result.get("role", "customer"),
                "partner_id": result.get("partner_id"),
            }
        }
    else:
        raise HTTPException(status_code=401, detail=result.get("error", "Authentication failed"))


@router.post("/auth/signup")
async def proxy_auth_signup(request: Request):
    """Proxy signup request to Odoo."""
    if not is_odoo_enabled():
        raise HTTPException(status_code=404, detail="Odoo integration not enabled")
    
    data = await request.json()
    result = await proxy_to_odoo("POST", "/api/auth/signup", json_data=data)
    
    if result.get("ok"):
        return {"id": result.get("partner_id"), "success": True}
    else:
        raise HTTPException(status_code=400, detail=result.get("error", "Signup failed"))


# ============ Properties Proxy Endpoints ============

@router.get("/properties")
async def proxy_properties(
    search: Optional[str] = None,
    city: Optional[str] = None,
    page: int = 1,
    limit: int = 20
):
    """Proxy properties list to Odoo."""
    if not is_odoo_enabled():
        raise HTTPException(status_code=404, detail="Odoo integration not enabled")
    
    params = {
        "page": page,
        "limit": limit,
        "db": odoo_settings.database
    }
    if search:
        params["search"] = search
    if city:
        params["city"] = city
    
    result = await proxy_to_odoo("GET", "/api/properties", params=params)
    
    # Transform Odoo response to FastAPI format
    properties = []
    for record in result.get("records", []):
        properties.append({
            "id": record.get("id"),
            "name": record.get("name"),
            "code": record.get("code", ""),
            "property_type": "residential",
            "address": record.get("city", ""),
            "city": record.get("city", ""),
            "description": "",
            "image_url": record.get("main_image_url"),
            "published": 1,
            "website_url": record.get("website_url"),
            "block_count": record.get("block_count", 0),
            "available_suites": record.get("available_suites", 0),
        })
    
    return {"records": properties, "total": result.get("total", len(properties))}


@router.get("/properties/{property_id}")
async def proxy_property_detail(property_id: int):
    """Proxy property detail to Odoo."""
    if not is_odoo_enabled():
        raise HTTPException(status_code=404, detail="Odoo integration not enabled")
    
    result = await proxy_to_odoo("GET", f"/api/properties/{property_id}")
    
    if result.get("error"):
        raise HTTPException(status_code=404, detail="Property not found")
    
    return {
        "id": result.get("id"),
        "name": result.get("name"),
        "code": "",
        "property_type": "residential",
        "address": result.get("city", ""),
        "city": result.get("city", ""),
        "state": result.get("state", ""),
        "description": result.get("description", ""),
        "image_url": result.get("main_image_url"),
        "images": result.get("images", []),
        "published": 1,
        "website_url": result.get("website_url"),
    }


# ============ Suites Proxy Endpoints ============

@router.get("/suites")
async def proxy_suites(property_id: Optional[int] = None):
    """Proxy suites list to Odoo."""
    if not is_odoo_enabled():
        raise HTTPException(status_code=404, detail="Odoo integration not enabled")
    
    params = {"db": odoo_settings.database}
    if property_id:
        params["property_id"] = property_id
    
    result = await proxy_to_odoo("GET", "/api/suites", params=params)
    
    suites = []
    for record in result.get("records", []):
        suites.append({
            "id": record.get("id"),
            "property_id": property_id,
            "name": record.get("name"),
            "number": record.get("suite_number", ""),
            "list_price": record.get("list_price", 0),
            "currency": record.get("currency", "NGN"),
            "is_available": record.get("is_available", True),
            "image_url": record.get("image_url"),
            "published": 1,
        })
    
    return {"records": suites, "total": len(suites)}


@router.get("/suites/{suite_id}")
async def proxy_suite_detail(suite_id: int):
    """Proxy suite detail to Odoo."""
    if not is_odoo_enabled():
        raise HTTPException(status_code=404, detail="Odoo integration not enabled")
    
    result = await proxy_to_odoo("GET", f"/api/suites/{suite_id}")
    
    if result.get("error"):
        raise HTTPException(status_code=404, detail="Suite not found")
    
    return {
        "id": result.get("id"),
        "name": result.get("name"),
        "list_price": result.get("list_price", 0),
        "currency": result.get("currency", "NGN"),
        "is_available": result.get("is_available", True),
        "image_url": result.get("image_url"),
    }


@router.get("/properties/{property_id}/suites")
async def proxy_property_suites(property_id: int):
    """Proxy property suites to Odoo."""
    return await proxy_suites(property_id)


# ============ Offers Proxy Endpoints ============

@router.get("/portal/offers")
async def proxy_my_offers(current_user: dict = Depends(get_current_user)):
    """Proxy my offers to Odoo."""
    if not is_odoo_enabled():
        raise HTTPException(status_code=404, detail="Odoo integration not enabled")
    
    result = await proxy_to_odoo("GET", "/api/offers")
    
    offers = []
    for record in result.get("records", []):
        offers.append({
            "id": record.get("id"),
            "name": record.get("name"),
            "partner_id": current_user.get("partner_id"),
            "property_id": record.get("property", {}).get("id") if record.get("property") else None,
            "suite_id": record.get("suite", {}).get("id") if record.get("suite") else None,
            "property_name": record.get("property", {}).get("name") if record.get("property") else None,
            "suite_name": record.get("suite", {}).get("name") if record.get("suite") else None,
            "suite_number": record.get("suite", {}).get("suite_number") if record.get("suite") else None,
            "state": record.get("state", "draft"),
            "price_total": record.get("amount_total", 0),
            "currency": "NGN",
            "validity_date": record.get("validity_date"),
        })
    
    return offers


@router.get("/portal/offers/{offer_id}")
async def proxy_my_offer(offer_id: int, current_user: dict = Depends(get_current_user)):
    """Proxy my offer detail to Odoo."""
    if not is_odoo_enabled():
        raise HTTPException(status_code=404, detail="Odoo integration not enabled")
    
    result = await proxy_to_odoo("GET", f"/api/offers/{offer_id}")
    
    if result.get("error"):
        raise HTTPException(status_code=404, detail="Offer not found")
    
    return {
        "id": result.get("id"),
        "name": result.get("name"),
        "partner_id": current_user.get("partner_id"),
        "state": result.get("state"),
        "price_total": result.get("amount_total", 0),
        "currency": result.get("currency", "NGN"),
        "payment_term": result.get("payment_term", ""),
    }


@router.post("/portal/offers/{offer_id}/sign")
async def proxy_sign_offer(
    offer_id: int,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Proxy offer signing to Odoo."""
    if not is_odoo_enabled():
        raise HTTPException(status_code=404, detail="Odoo integration not enabled")
    
    data = await request.json()
    signature = data.get("signature")
    
    result = await proxy_to_odoo(
        "POST",
        f"/api/offers/sign/{offer_id}",
        json_data={"signature": signature, "signed_by": current_user.get("name")}
    )
    
    return {"ok": result.get("ok", False), "success": result.get("ok", False)}


@router.get("/portal/offers/{offer_id}/schedules")
async def proxy_offer_schedules(
    offer_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Proxy offer payment schedules to Odoo."""
    if not is_odoo_enabled():
        raise HTTPException(status_code=404, detail="Odoo integration not enabled")
    
    # Get offer to extract payment term info
    offer = await proxy_to_odoo("GET", f"/api/offers/{offer_id}")
    
    if offer.get("error"):
        return []
    
    # Return basic schedule based on offer data
    # Odoo handles payment schedules differently
    return [{
        "id": 1,
        "offer_id": offer_id,
        "description": "Total Amount",
        "due_date": offer.get("validity_date"),
        "amount": offer.get("amount_total", 0),
        "paid_amount": 0,
        "outstanding_amount": offer.get("amount_total", 0),
        "status": "pending" if offer.get("state") != "sale" else "paid"
    }]


# ============ Invoices Proxy Endpoints ============

@router.get("/portal/invoices")
async def proxy_my_invoices(current_user: dict = Depends(get_current_user)):
    """Proxy my invoices to Odoo."""
    if not is_odoo_enabled():
        raise HTTPException(status_code=404, detail="Odoo integration not enabled")
    
    partner_id = current_user.get("partner_id")
    result = await proxy_to_odoo("GET", f"/api/customers/{partner_id}/invoices")
    
    invoices = []
    for record in result.get("records", []):
        invoices.append({
            "id": record.get("id"),
            "name": record.get("name"),
            "amount_total": record.get("amount_total", 0),
            "amount_residual": record.get("amount_residual", 0),
            "currency": record.get("currency", "NGN"),
            "invoice_date": record.get("invoice_date"),
            "payment_state": record.get("payment_state", "not_paid"),
            "state": record.get("state", "draft"),
            "portal_url": record.get("portal_url"),
        })
    
    return invoices


# ============ Payments Proxy Endpoints ============

@router.get("/portal/payments")
async def proxy_my_payments(current_user: dict = Depends(get_current_user)):
    """Proxy my payments to Odoo."""
    if not is_odoo_enabled():
        raise HTTPException(status_code=404, detail="Odoo integration not enabled")
    
    partner_id = current_user.get("partner_id")
    result = await proxy_to_odoo("GET", f"/api/customers/{partner_id}/payments")
    
    payments = []
    for record in result.get("records", []):
        payments.append({
            "id": record.get("id"),
            "partner_id": partner_id,
            "invoice_id": record.get("invoice_id"),
            "amount": record.get("amount", 0),
            "currency": record.get("currency", "NGN"),
            "state": record.get("state", "draft"),
            "payment_date": record.get("payment_date"),
        })
    
    return payments


# ============ Documents Proxy Endpoints ============

@router.get("/portal/documents")
async def proxy_my_documents(current_user: dict = Depends(get_current_user)):
    """Proxy my documents to Odoo."""
    if not is_odoo_enabled():
        raise HTTPException(status_code=404, detail="Odoo integration not enabled")
    
    partner_id = current_user.get("partner_id")
    result = await proxy_to_odoo("GET", f"/api/customers/{partner_id}/documents")
    
    documents = []
    for record in result.get("records", []):
        documents.append({
            "id": record.get("id"),
            "name": record.get("name"),
            "type": record.get("type", "document"),
            "url": record.get("url"),
            "created_at": record.get("create_date"),
        })
    
    return documents


@router.get("/portal/documents/{document_id}/download")
async def proxy_download_document(document_id: int):
    """Proxy document download to Odoo."""
    if not is_odoo_enabled():
        raise HTTPException(status_code=404, detail="Odoo integration not enabled")
    
    # Documents are served from Odoo directly
    odoo_base = odoo_settings.url.rstrip('/')
    return {"url": f"{odoo_base}/web/content/{document_id}?download=1"}
