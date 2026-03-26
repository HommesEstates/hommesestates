import os
from datetime import date
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db
from app.models import Partner, Invoice, Payment
from app.config import settings


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


def test_payment_snapshots(tmp_path):
    db_path = tmp_path / "test.db"
    url = f"sqlite:///{db_path}"
    get_db_override, engine = override_db(url)
    app.dependency_overrides[get_db] = get_db_override

    client = TestClient(app)

    # Seed data
    SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    with SessionLocal() as db:
        partner = Partner(name="John Doe", email="john@example.com")
        db.add(partner)
        db.flush()
        inv = Invoice(partner_id=partner.id, amount_total=10000.0, currency="NGN", residual=10000.0)
        db.add(inv)
        db.flush()
        p1 = Payment(partner_id=partner.id, invoice_id=inv.id, amount=2000.0, currency="NGN", date=date(2024,1,1), state="posted")
        p2 = Payment(partner_id=partner.id, invoice_id=inv.id, amount=3000.0, currency="NGN", date=date(2024,2,1), state="posted")
        db.add_all([p1, p2])
        db.commit()

    r = client.get(f"/invoices/{1}/payments/snapshots")
    assert r.status_code == 200
    snaps = r.json()
    assert len(snaps) == 2
    assert snaps[0]["cumulative_amount"] == 2000.0
    assert snaps[0]["remaining_amount"] == 8000.0
    assert snaps[1]["cumulative_amount"] == 5000.0
    assert snaps[1]["remaining_amount"] == 5000.0
