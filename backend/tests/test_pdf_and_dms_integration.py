from datetime import date
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db
from app.models import Partner, Company, Property, Suite, Offer, Invoice, Payment
from app.routers import offers as offers_router
from app.routers import payments as payments_router
from app.services.dms import DmsService


class StubUser:
    def __init__(self, role: str = "staff", partner_id: int | None = None):
        self.role = role
        self.partner_id = partner_id


def override_db(tmpdb_url: str):
    engine = create_engine(tmpdb_url, connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def _get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    return _get_db, engine


def test_pdf_generation_and_download(tmp_path):
    # Isolated DB
    db_path = tmp_path / "test.db"
    url = f"sqlite:///{db_path}"
    get_db_override, engine = override_db(url)
    app.dependency_overrides[get_db] = get_db_override

    # Override auth to act as staff
    from app.deps import get_current_user
    app.dependency_overrides[get_current_user] = lambda: StubUser("staff")

    # Point DMS to temp dir by monkeypatching router-level DMS services
    storage_dir = tmp_path / "storage"
    storage_dir.mkdir(parents=True, exist_ok=True)
    offers_router.dms = DmsService(str(storage_dir))
    payments_router.dms = DmsService(str(storage_dir))

    client = TestClient(app)

    # Seed data
    SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    with SessionLocal() as db:
        company = Company(name="Hommes Estates")
        partner = Partner(name="Jane Smith", email="jane@example.com")
        prop = Property(name="Test Property")
        suite = Suite(property=prop, name="A1", number="A1", is_available=1, currency="NGN", list_price=10000.0, area_sqm=50.0)
        offer = Offer(partner=partner, suite=suite, suite_name="A1", suite_number="A1", price_total=10000.0, state="draft")
        inv = Invoice(partner=partner, offer=offer, amount_total=10000.0, residual=10000.0, currency="NGN")
        pay = Payment(partner=partner, invoice=inv, amount=2000.0, currency="NGN", date=date(2024, 1, 1), state="posted")
        db.add_all([company, partner, prop, suite, offer, inv, pay])
        db.commit()

    # Offer letter
    r1 = client.post(f"/offers/{1}/documents/offer_letter", headers={"Authorization": "Bearer test"})
    assert r1.status_code == 200
    doc1 = r1.json()["document"]; assert doc1["download_url"].startswith("/documents/")

    # Payment summary
    r2 = client.post(f"/offers/{1}/documents/payment_summary", headers={"Authorization": "Bearer test"})
    assert r2.status_code == 200
    doc2 = r2.json()["document"]; assert doc2["download_url"].startswith("/documents/")

    # Allocation letter
    r3 = client.post(f"/offers/{1}/documents/allocation", headers={"Authorization": "Bearer test"})
    assert r3.status_code == 200
    doc3 = r3.json()["document"]; assert doc3["download_url"].startswith("/documents/")

    # Payment acknowledgement
    r4 = client.post(f"/payments/{1}/ack", headers={"Authorization": "Bearer test"})
    assert r4.status_code == 200
    doc4 = r4.json()["document"]; assert doc4["download_url"].startswith("/documents/")

    # Download should require auth and return a PDF
    for d in (doc1, doc2, doc3, doc4):
        dl = client.get(d["download_url"], headers={"Authorization": "Bearer test"})
        assert dl.status_code == 200
        assert dl.headers.get("content-type", "").startswith("application/pdf")
        content = dl.content
        assert isinstance(content, (bytes, bytearray)) and len(content) > 100
