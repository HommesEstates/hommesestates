"""
Odoo Integration Configuration for Real Estate Module
=====================================================

This module provides optional integration with Odoo's real estate module.
When ODOO_ENABLED is set to true, the system will fetch data from Odoo instead of FastAPI.

Required Environment Variables for Odoo Integration:
--------------------------------------------------

# Core Odoo Connection Settings
ODOO_ENABLED=true                    # Enable Odoo integration (default: false)
ODOO_URL=https://odoo.hommesestates.com  # Odoo instance URL
ODOO_DATABASE=hommesestates_prod      # Odoo database name
ODOO_API_KEY=your_api_key_here       # Odoo API key for authentication

# Optional: Username/Password auth (alternative to API key)
ODOO_USERNAME=admin@hommesestates.com
ODOO_PASSWORD=your_password_here

# Optional: Session-based auth (for development)
ODOO_SESSION_ID=your_session_id

# Sync Configuration
ODOO_SYNC_INTERVAL=300               # Sync interval in seconds (default: 300 = 5 min)
ODOO_SYNC_ON_STARTUP=true            # Sync data on startup (default: true)
ODOO_CACHE_TTL=3600                  # Cache TTL for Odoo data in seconds (default: 3600)

# Feature Toggles (which modules to use from Odoo)
ODOO_USE_PROPERTIES=true             # Use Odoo for properties (default: true)
ODOO_USE_SUITES=true                 # Use Odoo for suites (default: true)
ODOO_USE_OFFERS=true                 # Use Odoo for offers (default: true)
ODOO_USE_INVOICES=true               # Use Odoo for invoices (default: true)
ODOO_USE_PAYMENTS=true               # Use Odoo for payments (default: true)
ODOO_USE_DOCUMENTS=true              # Use Odoo for documents (default: true)
ODOO_USE_CUSTOMERS=true              # Use Odoo for customer management (default: true)

# Odoo Model Mappings (customize if your Odoo uses different model names)
ODOO_MODEL_PROPERTY=real_estate.property
ODOO_MODEL_SUITE=product.template
ODOO_MODEL_BLOCK=real_estate.block
ODOO_MODEL_FLOOR=real_estate.floor
ODOO_MODEL_OFFER=sale.order
ODOO_MODEL_INVOICE=account.move
ODOO_MODEL_PAYMENT=real_estate.payment
ODOO_MODEL_DOCUMENT=real_estate.document
ODOO_MODEL_PARTNER=res.partner
ODOO_MODEL_COMPANY=res.company
ODOO_MODEL_CRM_LEAD=crm.lead

# API Configuration
ODOO_TIMEOUT=30                      # Request timeout in seconds (default: 30)
ODOO_MAX_RETRIES=3                   # Max retry attempts (default: 3)
ODOO_RETRY_DELAY=1.0                 # Delay between retries in seconds (default: 1.0)

# Webhook Configuration (for real-time sync from Odoo)
ODOO_WEBHOOK_SECRET=your_webhook_secret
ODOO_WEBHOOK_PATH=/webhooks/odoo

# VPS Configuration (for self-hosted Odoo)
ODOO_VPS_HOST=vps.hommesestates.com
ODOO_VPS_SSH_KEY_PATH=/path/to/ssh/key
ODOO_VPS_DB_PORT=5432              # PostgreSQL port on VPS
ODOO_VPS_ODOO_PORT=8069            # Odoo port on VPS
"""

from typing import Optional, List
from pydantic import Field
from ..config import settings as base_settings


class OdooSettings:
    """Odoo integration settings loaded from environment variables."""
    
    # Core settings
    enabled: bool = Field(default=False, alias="ODOO_ENABLED")
    url: str = Field(default="", alias="ODOO_URL")
    database: str = Field(default="", alias="ODOO_DATABASE")
    api_key: str = Field(default="", alias="ODOO_API_KEY")
    
    # Auth alternatives
    username: str = Field(default="", alias="ODOO_USERNAME")
    password: str = Field(default="", alias="ODOO_PASSWORD")
    session_id: str = Field(default="", alias="ODOO_SESSION_ID")
    
    # Sync configuration
    sync_interval: int = Field(default=300, alias="ODOO_SYNC_INTERVAL")
    sync_on_startup: bool = Field(default=True, alias="ODOO_SYNC_ON_STARTUP")
    cache_ttl: int = Field(default=3600, alias="ODOO_CACHE_TTL")
    
    # Feature toggles
    use_properties: bool = Field(default=True, alias="ODOO_USE_PROPERTIES")
    use_suites: bool = Field(default=True, alias="ODOO_USE_SUITES")
    use_offers: bool = Field(default=True, alias="ODOO_USE_OFFERS")
    use_invoices: bool = Field(default=True, alias="ODOO_USE_INVOICES")
    use_payments: bool = Field(default=True, alias="ODOO_USE_PAYMENTS")
    use_documents: bool = Field(default=True, alias="ODOO_USE_DOCUMENTS")
    use_customers: bool = Field(default=True, alias="ODOO_USE_CUSTOMERS")
    
    # Model mappings
    model_property: str = Field(default="real_estate.property", alias="ODOO_MODEL_PROPERTY")
    model_suite: str = Field(default="product.template", alias="ODOO_MODEL_SUITE")
    model_block: str = Field(default="real_estate.block", alias="ODOO_MODEL_BLOCK")
    model_floor: str = Field(default="real_estate.floor", alias="ODOO_MODEL_FLOOR")
    model_offer: str = Field(default="sale.order", alias="ODOO_MODEL_OFFER")
    model_invoice: str = Field(default="account.move", alias="ODOO_MODEL_INVOICE")
    model_payment: str = Field(default="real_estate.payment", alias="ODOO_MODEL_PAYMENT")
    model_document: str = Field(default="real_estate.document", alias="ODOO_MODEL_DOCUMENT")
    model_partner: str = Field(default="res.partner", alias="ODOO_MODEL_PARTNER")
    model_company: str = Field(default="res.company", alias="ODOO_MODEL_COMPANY")
    model_crm_lead: str = Field(default="crm.lead", alias="ODOO_MODEL_CRM_LEAD")
    
    # API configuration
    timeout: int = Field(default=30, alias="ODOO_TIMEOUT")
    max_retries: int = Field(default=3, alias="ODOO_MAX_RETRIES")
    retry_delay: float = Field(default=1.0, alias="ODOO_RETRY_DELAY")
    
    # Webhook configuration
    webhook_secret: str = Field(default="", alias="ODOO_WEBHOOK_SECRET")
    webhook_path: str = Field(default="/webhooks/odoo", alias="ODOO_WEBHOOK_PATH")
    
    # VPS configuration
    vps_host: str = Field(default="", alias="ODOO_VPS_HOST")
    vps_ssh_key_path: str = Field(default="", alias="ODOO_VPS_SSH_KEY_PATH")
    vps_db_port: int = Field(default=5432, alias="ODOO_VPS_DB_PORT")
    vps_odoo_port: int = Field(default=8069, alias="ODOO_VPS_ODOO_PORT")
    
    @property
    def is_configured(self) -> bool:
        """Check if Odoo is properly configured."""
        return self.enabled and bool(self.url) and bool(self.database) and (bool(self.api_key) or bool(self.username))
    
    @property
    def api_base_url(self) -> str:
        """Get the base URL for Odoo API calls."""
        base = self.url.rstrip('/')
        return f"{base}/odoo"
    
    @property
    def jsonrpc_url(self) -> str:
        """Get the JSON-RPC endpoint URL."""
        base = self.url.rstrip('/')
        return f"{base}/jsonrpc"


# Global settings instance
odoo_settings = OdooSettings()


def get_odoo_settings() -> OdooSettings:
    """Get Odoo settings instance."""
    return odoo_settings


def is_odoo_enabled() -> bool:
    """Check if Odoo integration is enabled and configured."""
    return odoo_settings.is_configured
