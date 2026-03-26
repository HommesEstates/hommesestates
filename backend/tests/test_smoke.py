import pytest
import httpx
from app.main import app


@pytest.mark.anyio
async def test_health():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.get("/health")
        assert r.status_code == 200
        assert r.json().get("status") == "ok"


@pytest.mark.anyio
async def test_end_to_end_documents_and_payment_ack():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # Auth: create staff user and login for protected downloads
        r = await client.post("/auth/register", json={"username": "tester", "password": "secret", "role": "staff"})
        assert r.status_code in (200, 400)  # 400 if already exists
        r = await client.post("/auth/login", json={"username": "tester", "password": "secret"})
        assert r.status_code == 200, r.text
        token = r.json()["access_token"]
        auth_headers = {"Authorization": f"Bearer {token}"}
        # Create partner
        r = await client.post("/partners", json={"name": "Jane Test", "email": "jane@example.com"})
        assert r.status_code == 200, r.text
        partner = r.json()

        # Create property
        r = await client.post(
            "/properties",
            json={"name": "Test Property", "code": "TP", "property_type": "residential"},
        )
        assert r.status_code == 200, r.text
        prop = r.json()

        # Create suite
        r = await client.post(
            f"/properties/{prop['id']}/suites",
            json={
                "property_id": prop["id"],
                "name": "Suite A101",
                "number": "A101",
                "currency": "NGN",
                "list_price": 15000000,
                "area_sqm": 80,
            },
        )
        assert r.status_code == 200, r.text
        suite = r.json()

        # Create offer (staff)
        r = await client.post(
            "/offers",
            json={
                "partner_id": partner["id"],
                "suite_id": suite["id"],
                "price_total": 15000000,
                "code": "OFF-TEST-001",
            },
            headers=auth_headers,
        )
        assert r.status_code == 200, r.text
        offer = r.json()

        # Generate Offer Letter
        r = await client.post(f"/offers/{offer['id']}/documents/offer_letter", headers=auth_headers)
        assert r.status_code == 200, r.text
        doc_offer = r.json()["document"]
        assert doc_offer["size"] > 500
        # Download
        r = await client.get(doc_offer["download_url"], headers=auth_headers)
        assert r.status_code == 200
        assert r.headers.get("content-type", "").startswith("application/pdf")

        # Payment Summary Letter
        r = await client.post(f"/offers/{offer['id']}/documents/payment_summary", headers=auth_headers)
        assert r.status_code == 200, r.text
        doc_sum = r.json()["document"]
        assert doc_sum["size"] > 500

        # Allocation Letter
        r = await client.post(f"/offers/{offer['id']}/documents/allocation", headers=auth_headers)
        assert r.status_code == 200, r.text
        doc_alloc = r.json()["document"]
        assert doc_alloc["size"] > 500

        # Create payment
        r = await client.post(
            "/payments",
            json={
                "partner_id": partner["id"],
                "amount": 5000000,
                "currency": "NGN",
                "date": "2025-01-01",
                "state": "posted",
            },
            headers=auth_headers,
        )
        assert r.status_code == 200, r.text
        payment = r.json()

        # Generate Payment Acknowledgement
        r = await client.post(f"/payments/{payment['id']}/ack", headers=auth_headers)
        assert r.status_code == 200, r.text
        ack = r.json()["document"]
        assert ack["size"] > 500
        r = await client.get(ack["download_url"], headers=auth_headers)
        assert r.status_code == 200
        assert r.headers.get("content-type", "").startswith("application/pdf")
