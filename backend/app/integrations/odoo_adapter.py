"""
Odoo Model Adapter Service
==========================

Transforms data between Odoo real estate module models and FastAPI models.

Odoo Models:
------------
- real_estate.property -> Property
- product.template (is_suite=True) -> Suite
- real_estate.block -> Block
- real_estate.floor -> Floor
- sale.order (is_offer=True) -> Offer
- account.move -> Invoice
- real_estate.payment -> Payment
- real_estate.document -> Document
- res.partner -> Partner
- crm.lead -> Lead
"""

from typing import Dict, Any, Optional, List
from datetime import datetime

from ..models import Property, Suite, Offer, Invoice, Payment, Partner, Document
from ..integrations.odoo_config import odoo_settings


class OdooModelAdapter:
    """Adapter for transforming Odoo models to/from FastAPI models."""
    
    @staticmethod
    def property_from_odoo(odoo_data: Dict[str, Any]) -> Property:
        """Convert Odoo real_estate.property to FastAPI Property model."""
        return Property(
            id=odoo_data.get("id", 0),
            name=odoo_data.get("name", ""),
            code=odoo_data.get("code", ""),
            property_type=odoo_data.get("property_type", "residential"),
            address=odoo_data.get("address") or odoo_data.get("city", ""),
            city=odoo_data.get("city", ""),
            state=odoo_data.get("state_id", {}).get("name") if isinstance(odoo_data.get("state_id"), dict) else "",
            zip_code=odoo_data.get("zip", ""),
            country=odoo_data.get("country_id", {}).get("name") if isinstance(odoo_data.get("country_id"), dict) else "",
            description=odoo_data.get("description", ""),
            image_url=odoo_data.get("main_image_url") or (f"/web/image?model=real_estate.property&id={odoo_data.get('id')}&field=image" if odoo_data.get("image") else None),
            published=1 if odoo_data.get("website_published", False) else 0,
            development_start_date=odoo_data.get("development_start_date"),
            development_end_date=odoo_data.get("development_end_date"),
            development_progress=odoo_data.get("development_progress", 0.0),
            total_floors=odoo_data.get("total_floors", 0),
            total_suites=odoo_data.get("total_suites", 0),
            available_suites=odoo_data.get("available_suites", 0),
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
    
    @staticmethod
    def property_to_odoo(property_data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert FastAPI Property to Odoo real_estate.property format."""
        return {
            "name": property_data.get("name"),
            "code": property_data.get("code"),
            "property_type": property_data.get("property_type", "residential"),
            "address": property_data.get("address"),
            "city": property_data.get("city"),
            "state_id": property_data.get("state_id"),
            "zip": property_data.get("zip_code"),
            "country_id": property_data.get("country_id"),
            "description": property_data.get("description"),
            "website_published": property_data.get("published", 0) == 1,
        }
    
    @staticmethod
    def suite_from_odoo(odoo_data: Dict[str, Any], property_id: Optional[int] = None) -> Suite:
        """Convert Odoo product.template (is_suite=True) to FastAPI Suite model."""
        # Extract floor and block info if available
        floor_data = odoo_data.get("floor_id", {})
        if isinstance(floor_data, dict):
            block_data = floor_data.get("block_id", {})
            if isinstance(block_data, dict):
                prop_data = block_data.get("property_id", {})
                if isinstance(prop_data, dict):
                    property_id = prop_data.get("id", property_id or 0)
        
        return Suite(
            id=odoo_data.get("id", 0),
            property_id=property_id or 0,
            floor_id=floor_data.get("id") if isinstance(floor_data, dict) else None,
            block_id=None,  # Extract from floor
            name=odoo_data.get("name", ""),
            number=odoo_data.get("suite_number", ""),
            currency="NGN",  # Default, could come from company
            list_price=odoo_data.get("list_price", 0.0),
            area_sqm=odoo_data.get("suite_size", 0.0),
            is_available=odoo_data.get("is_available", True),
            suite_type=odoo_data.get("suite_type", "other"),
            published=1 if odoo_data.get("website_published", False) else 0,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
    
    @staticmethod
    def suite_to_odoo(suite_data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert FastAPI Suite to Odoo product.template format."""
        return {
            "name": suite_data.get("name"),
            "suite_number": suite_data.get("number"),
            "list_price": suite_data.get("list_price"),
            "suite_size": suite_data.get("area_sqm"),
            "is_suite": True,
            "type": "suite",
            "website_published": suite_data.get("published", 0) == 1,
            "floor_id": suite_data.get("floor_id"),
        }
    
    @staticmethod
    def offer_from_odoo(odoo_data: Dict[str, Any]) -> Offer:
        """Convert Odoo sale.order (is_offer=True) to FastAPI Offer model."""
        # Extract related data
        suite_data = odoo_data.get("suite_id", {})
        if isinstance(suite_data, int):
            suite_id = suite_data
            suite_name = ""
        else:
            suite_id = suite_data.get("id", 0) if isinstance(suite_data, dict) else 0
            suite_name = suite_data.get("name", "") if isinstance(suite_data, dict) else ""
        
        # Get property from suite
        property_id = 0
        property_name = ""
        if isinstance(suite_data, dict):
            floor_data = suite_data.get("floor_id", {})
            if isinstance(floor_data, dict):
                block_data = floor_data.get("block_id", {})
                if isinstance(block_data, dict):
                    prop_data = block_data.get("property_id", {})
                    if isinstance(prop_data, dict):
                        property_id = prop_data.get("id", 0)
                        property_name = prop_data.get("name", "")
        
        return Offer(
            id=odoo_data.get("id", 0),
            name=odoo_data.get("name", ""),
            partner_id=odoo_data.get("partner_id", {}).get("id") if isinstance(odoo_data.get("partner_id"), dict) else odoo_data.get("partner_id", 0),
            property_id=property_id,
            suite_id=suite_id,
            property_name=property_name,
            suite_name=suite_name,
            suite_number=suite_data.get("suite_number", "") if isinstance(suite_data, dict) else "",
            state=odoo_data.get("state", "draft"),
            price_total=odoo_data.get("amount_total", 0.0),
            currency=odoo_data.get("currency_id", {}).get("symbol", "NGN") if isinstance(odoo_data.get("currency_id"), dict) else "NGN",
            validity_date=odoo_data.get("validity_date"),
            signed_on=odoo_data.get("signed_on"),
            signature=odoo_data.get("signature"),
            is_offer=True,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
    
    @staticmethod
    def offer_to_odoo(offer_data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert FastAPI Offer to Odoo sale.order format."""
        return {
            "partner_id": offer_data.get("partner_id"),
            "suite_id": offer_data.get("suite_id"),
            "validity_date": offer_data.get("validity_date"),
            "note": offer_data.get("note"),
            "is_offer": True,
        }
    
    @staticmethod
    def invoice_from_odoo(odoo_data: Dict[str, Any]) -> Invoice:
        """Convert Odoo account.move to FastAPI Invoice model."""
        return Invoice(
            id=odoo_data.get("id", 0),
            partner_id=odoo_data.get("partner_id", {}).get("id") if isinstance(odoo_data.get("partner_id"), dict) else odoo_data.get("partner_id", 0),
            offer_id=None,  # Link from invoice lines if available
            number=odoo_data.get("name", ""),
            date=odoo_data.get("invoice_date", datetime.now().date()),
            due_date=odoo_data.get("invoice_date_due"),
            amount_total=odoo_data.get("amount_total", 0.0),
            amount_tax=odoo_data.get("amount_tax", 0.0),
            amount_residual=odoo_data.get("amount_residual", 0.0),
            currency=odoo_data.get("currency_id", {}).get("symbol", "NGN") if isinstance(odoo_data.get("currency_id"), dict) else "NGN",
            state=odoo_data.get("state", "draft"),
            payment_state=odoo_data.get("payment_state", "not_paid"),
            is_posted=odoo_data.get("state") == "posted",
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
    
    @staticmethod
    def payment_from_odoo(odoo_data: Dict[str, Any]) -> Payment:
        """Convert Odoo real_estate.payment to FastAPI Payment model."""
        return Payment(
            id=odoo_data.get("id", 0),
            partner_id=odoo_data.get("partner_id", {}).get("id") if isinstance(odoo_data.get("partner_id"), dict) else odoo_data.get("partner_id", 0),
            invoice_id=odoo_data.get("invoice_id", {}).get("id") if isinstance(odoo_data.get("invoice_id"), dict) else odoo_data.get("invoice_id"),
            offer_id=odoo_data.get("offer_id", {}).get("id") if isinstance(odoo_data.get("offer_id"), dict) else odoo_data.get("offer_id"),
            amount=odoo_data.get("amount", 0.0),
            currency=odoo_data.get("currency_id", {}).get("symbol", "NGN") if isinstance(odoo_data.get("currency_id"), dict) else "NGN",
            reference=odoo_data.get("reference", ""),
            state=odoo_data.get("state", "draft"),
            payment_date=odoo_data.get("payment_date"),
            payment_method=odoo_data.get("payment_method", ""),
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
    
    @staticmethod
    def partner_from_odoo(odoo_data: Dict[str, Any]) -> Partner:
        """Convert Odoo res.partner to FastAPI Partner model."""
        return Partner(
            id=odoo_data.get("id", 0),
            name=odoo_data.get("name", ""),
            email=odoo_data.get("email", ""),
            phone=odoo_data.get("phone", ""),
            mobile=odoo_data.get("mobile", ""),
            company_name=odoo_data.get("company_name", ""),
            address=odoo_data.get("street", ""),
            city=odoo_data.get("city", ""),
            state=odoo_data.get("state_id", {}).get("name") if isinstance(odoo_data.get("state_id"), dict) else "",
            country=odoo_data.get("country_id", {}).get("name") if isinstance(odoo_data.get("country_id"), dict) else "",
            zip_code=odoo_data.get("zip", ""),
            is_company=odoo_data.get("is_company", False),
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
    
    @staticmethod
    def partner_to_odoo(partner_data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert FastAPI Partner to Odoo res.partner format."""
        return {
            "name": partner_data.get("name"),
            "email": partner_data.get("email"),
            "phone": partner_data.get("phone"),
            "mobile": partner_data.get("mobile"),
            "company_name": partner_data.get("company_name"),
            "street": partner_data.get("address"),
            "city": partner_data.get("city"),
            "state_id": partner_data.get("state_id"),
            "country_id": partner_data.get("country_id"),
            "zip": partner_data.get("zip_code"),
            "is_company": partner_data.get("is_company", False),
        }
    
    @staticmethod
    def document_from_odoo(odoo_data: Dict[str, Any]) -> Document:
        """Convert Odoo real_estate.document to FastAPI Document model."""
        return Document(
            id=odoo_data.get("id", 0),
            name=odoo_data.get("name", ""),
            folder_id=odoo_data.get("folder_id", {}).get("id") if isinstance(odoo_data.get("folder_id"), dict) else odoo_data.get("folder_id"),
            property_id=odoo_data.get("property_id", {}).get("id") if isinstance(odoo_data.get("property_id"), dict) else odoo_data.get("property_id"),
            suite_id=odoo_data.get("suite_id", {}).get("id") if isinstance(odoo_data.get("suite_id"), dict) else odoo_data.get("suite_id"),
            partner_id=odoo_data.get("partner_id", {}).get("id") if isinstance(odoo_data.get("partner_id"), dict) else odoo_data.get("partner_id"),
            type=odoo_data.get("type", "document"),
            file_url=odoo_data.get("file_url") or f"/web/content/{odoo_data.get('attachment_id')}" if odoo_data.get("attachment_id") else None,
            version=odoo_data.get("version_number", 1),
            is_latest=odoo_data.get("is_latest", True),
            created_by=odoo_data.get("create_uid", {}).get("name") if isinstance(odoo_data.get("create_uid"), dict) else "",
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
    
    # Batch transformation methods
    @classmethod
    def properties_from_odoo(cls, odoo_records: List[Dict[str, Any]]) -> List[Property]:
        """Transform multiple Odoo properties."""
        return [cls.property_from_odoo(r) for r in odoo_records]
    
    @classmethod
    def suites_from_odoo(cls, odoo_records: List[Dict[str, Any]], property_id: Optional[int] = None) -> List[Suite]:
        """Transform multiple Odoo suites."""
        return [cls.suite_from_odoo(r, property_id) for r in odoo_records]
    
    @classmethod
    def offers_from_odoo(cls, odoo_records: List[Dict[str, Any]]) -> List[Offer]:
        """Transform multiple Odoo offers."""
        return [cls.offer_from_odoo(r) for r in odoo_records]
    
    @classmethod
    def invoices_from_odoo(cls, odoo_records: List[Dict[str, Any]]) -> List[Invoice]:
        """Transform multiple Odoo invoices."""
        return [cls.invoice_from_odoo(r) for r in odoo_records]
    
    @classmethod
    def payments_from_odoo(cls, odoo_records: List[Dict[str, Any]]) -> List[Payment]:
        """Transform multiple Odoo payments."""
        return [cls.payment_from_odoo(r) for r in odoo_records]
    
    @classmethod
    def documents_from_odoo(cls, odoo_records: List[Dict[str, Any]]) -> List[Document]:
        """Transform multiple Odoo documents."""
        return [cls.document_from_odoo(r) for r in odoo_records]


# Global adapter instance
odoo_adapter = OdooModelAdapter()


def get_odoo_adapter() -> OdooModelAdapter:
    """Get the Odoo model adapter instance."""
    return odoo_adapter
