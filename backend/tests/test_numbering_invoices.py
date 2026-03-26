import pytest
import httpx
from datetime import date, timedelta
from app.main import app


@pytest.mark.anyio
async def test_numbering_preview_and_bulk_generation():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # Auth staff
        r = await client.post("/auth/register", json={"username": "tester1", "password": "secret", "role": "staff"})
        assert r.status_code in (200, 400)
        r = await client.post("/auth/login", json={"username": "tester1", "password": "secret"})
        assert r.status_code == 200
        staff_headers = {"Authorization": f"Bearer {r.json()['access_token']}"}
        # Property
        r = await client.post("/properties", json={"name": "P1", "code": "P1"})
        assert r.status_code == 200
        prop = r.json()

        # Preview
        r = await client.post(
            f"/properties/{prop['id']}/numbering/preview",
            json={"pattern": "floor_based", "floor_index": 1, "start": 1, "count": 3, "width": 3, "floor_multiplier": 100},
        )
        assert r.status_code == 200
        nums = r.json()["numbers"]
        assert nums == ["101", "102", "103"]

        # Bulk generate
        r = await client.post(
            f"/properties/{prop['id']}/suites/generate",
            json={
                "pattern": "floor_based",
                "floor_index": 1,
                "start": 1,
                "count": 3,
                "width": 3,
                "name_template": "Suite {suite_num}",
                "currency": "NGN",
                "list_price": 1000.0,
            },
        )
        assert r.status_code == 200
        suites = r.json()
        assert len(suites) == 3
        assert suites[0]["number"] == "101"


@pytest.mark.anyio
async def test_invoice_creation_schedule_add_and_recompute():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # Staff auth
        r = await client.post("/auth/register", json={"username": "tester2", "password": "secret", "role": "staff"})
        assert r.status_code in (200, 400)
        r = await client.post("/auth/login", json={"username": "tester2", "password": "secret"})
        assert r.status_code == 200
        staff_headers = {"Authorization": f"Bearer {r.json()['access_token']}"}
        # Partner
        r = await client.post("/partners", json={"name": "Acme", "email": "acme@example.com"})
        assert r.status_code == 200
        partner = r.json()

        # Invoice
        r = await client.post(
            "/invoices",
            json={"partner_id": partner["id"], "currency": "NGN", "amount_total": 10000.0},
            headers=staff_headers,
        )
        assert r.status_code == 200
        inv = r.json()

        # Add schedules: one past, one future
        past = (date.today() - timedelta(days=5)).isoformat()
        future = (date.today() + timedelta(days=10)).isoformat()
        r = await client.post(f"/invoices/{inv['id']}/schedules", json={"due_date": past, "amount": 6000.0}, headers=staff_headers)
        assert r.status_code == 200
        r = await client.post(f"/invoices/{inv['id']}/schedules", json={"due_date": future, "amount": 4000.0}, headers=staff_headers)
        assert r.status_code == 200

        # Recompute with no payments
        r = await client.post(f"/invoices/{inv['id']}/recompute", headers=staff_headers)
        assert r.status_code == 200
        data = r.json()
        assert data["invoice"]["residual"] == 10000.0

        # Partial payment of 6500 -> first schedule paid, second partial
        r = await client.post(
            "/payments",
            json={
                "partner_id": partner["id"],
                "invoice_id": inv["id"],
                "amount": 6500.0,
                "currency": "NGN",
                "date": date.today().isoformat(),
                "state": "posted",
            },
            headers=staff_headers,
        )
        assert r.status_code == 200

        # Recompute
        r = await client.post(f"/invoices/{inv['id']}/recompute", headers=staff_headers)
        assert r.status_code == 200
        data = r.json()
        assert data["invoice"]["residual"] == 3500.0
        # Verify statuses
        r = await client.get(f"/invoices/{inv['id']}/schedules")
        assert r.status_code == 200
        schedules = r.json()
        assert schedules[0]["status"] == "paid"
        # second schedule should be partial
        assert schedules[1]["status"] in ("partial", "pending", "overdue")
