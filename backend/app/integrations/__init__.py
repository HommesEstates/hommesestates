# Odoo Integration Package
from .odoo_config import odoo_settings, is_odoo_enabled, get_odoo_settings
from .odoo_adapter import odoo_adapter, get_odoo_adapter, OdooModelAdapter
from .unified_client import unified_client, get_unified_client, UnifiedAPIClient

__all__ = [
    'odoo_settings',
    'is_odoo_enabled',
    'get_odoo_settings',
    'odoo_adapter',
    'get_odoo_adapter',
    'OdooModelAdapter',
    'unified_client',
    'get_unified_client',
    'UnifiedAPIClient',
]
