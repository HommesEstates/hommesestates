from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.middleware import SlowAPIMiddleware
from slowapi.errors import RateLimitExceeded

from .config import settings
from .database import Base, engine
from .middleware.rate_limiting import (
    limiter, 
    rate_limit_middleware,
    rate_limit_exceeded_handler,
    rate_limit_monitor
)
from .routers.health import router as health_router
from .routers.payments import router as payments_router
from .routers.documents import router as documents_router
from .routers.partners import router as partners_router
from .routers.properties import router as properties_router
from .routers.offers import router as offers_router
from .routers.blocks import router as blocks_router
from .routers.floors import router as floors_router
from .routers.invoices import router as invoices_router
from .routers.company import router as company_router
from .routers.auth import router as auth_router
from .routers.dashboard import router as dashboard_router
from .routers.portal import router as portal_router
from .routers.dms import router as dms_router
from .routers.admin_properties import router as admin_properties_router
from .routers.public import router as public_router
from .routers.offers_admin import router as offers_admin_router
from .routers.documents_admin import router as documents_admin_router
from .routers.reports import router as reports_router
from .routers.websocket import router as websocket_router
from .routers.payment_gateways import router as payment_gateways_router
from .integrations.proxy_router import router as proxy_router

# Create tables and ensure new columns for dev sqlite
Base.metadata.create_all(bind=engine)

def _ensure_sqlite_columns():
    try:
        if engine.url.get_backend_name() != "sqlite":
            return
        with engine.connect() as conn:
            def has_column(table: str, col: str) -> bool:
                res = conn.exec_driver_sql(f"PRAGMA table_info({table})").all()
                return any(r[1] == col for r in res)

            # Add published to properties
            if not has_column("properties", "published"):
                conn.exec_driver_sql("ALTER TABLE properties ADD COLUMN published INTEGER DEFAULT 1")
            # Add published to suites
            if not has_column("suites", "published"):
                conn.exec_driver_sql("ALTER TABLE suites ADD COLUMN published INTEGER DEFAULT 1")
    except Exception:
        # Best-effort only in dev
        pass

_ensure_sqlite_columns()

app = FastAPI(title="Real Estate Backend", version="0.1.0")

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(health_router)
app.include_router(payments_router)
app.include_router(documents_router)
app.include_router(partners_router)
app.include_router(properties_router)
app.include_router(offers_router)
app.include_router(blocks_router)
app.include_router(floors_router)
app.include_router(invoices_router)
app.include_router(company_router)
app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(portal_router)
app.include_router(dms_router)
app.include_router(admin_properties_router)
app.include_router(public_router)
app.include_router(offers_admin_router)
app.include_router(documents_admin_router)
app.include_router(reports_router)
app.include_router(websocket_router)
app.include_router(payment_gateways_router)
app.include_router(proxy_router)


@app.get("/")
def root():
    return {"name": "real-estate-backend", "status": "ok"}
