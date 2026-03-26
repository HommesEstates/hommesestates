import pytest
import httpx
from datetime import date, timedelta
import base64
from app.main import app


# 1x1 PNG
PNG_1x1_BASE64 = (
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
)
PNG_BYTES = base64.b64decode(PNG_1x1_BASE64)


@pytest.mark.anyio
async def test_numbering_edge_patterns_and_block_floor_assignment():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # Staff auth
        r = await client.post("/auth/register", json={"username": "adv_staff", "password": "secret", "role": "staff"})
        assert r.status_code in (200, 400)
        r = await client.post("/auth/login", json={"username": "adv_staff", "password": "secret"})
        assert r.status_code == 200
        staff_headers = {"Authorization": f"Bearer {r.json()['access_token']}"}
        # Create property
        r = await client.post("/properties", json={"name": "PropX", "code": "PX"})
        assert r.status_code == 200, r.text
        prop = r.json()

        # Create block and floor
        r = await client.post("/blocks", json={"property_id": prop["id"], "name": "Block A", "sequence": 1})
        assert r.status_code == 200, r.text
        block = r.json()
        r = await client.post("/floors", json={"block_id": block["id"], "name": "First", "level_index": 1, "sequence": 1})
        assert r.status_code == 200, r.text
        floor = r.json()

        # simple pattern
        r = await client.post(
            f"/properties/{prop['id']}/numbering/preview",
            json={"pattern": "simple", "start": 1, "count": 3, "width": 3},
        )
        assert r.status_code == 200, r.text
        assert r.json()["numbers"] == ["001", "002", "003"]

        # alphanumeric pattern
        r = await client.post(
            f"/properties/{prop['id']}/numbering/preview",
            json={"pattern": "alphanumeric", "floor_index": 2, "count": 3, "alpha_start": "A"},
        )
        assert r.status_code == 200, r.text
        assert r.json()["numbers"] == ["2A", "2B", "2C"]

        # bulk generate with block/floor assignment
        r = await client.post(
            f"/properties/{prop['id']}/suites/generate",
            json={
                "pattern": "floor_based",
                "floor_index": 1,
                "start": 1,
                "count": 2,
                "width": 3,
                "name_template": "Suite {suite_num}",
                "currency": "NGN",
                "list_price": 2000.0,
                "block_id": block["id"],
                "floor_id": floor["id"],
            },
        )
        assert r.status_code == 200, r.text
        suites = r.json()
        assert len(suites) == 2
        assert suites[0]["block_id"] == block["id"]
        assert suites[0]["floor_id"] == floor["id"]


@pytest.mark.anyio
async def test_invoice_recompute_matrix_partial_across_lines():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # Staff auth
        r = await client.post("/auth/register", json={"username": "adv_staff2", "password": "secret", "role": "staff"})
        assert r.status_code in (200, 400)
        r = await client.post("/auth/login", json={"username": "adv_staff2", "password": "secret"})
        assert r.status_code == 200
        staff_headers = {"Authorization": f"Bearer {r.json()['access_token']}"}
        # Partner
        r = await client.post("/partners", json={"name": "Matrix Corp", "email": "m@corp.com"})
        assert r.status_code == 200
        partner = r.json()

        # Invoice total 10000 split 3000(past), 4000(past), 3000(future)
        r = await client.post(
            "/invoices",
            json={"partner_id": partner["id"], "currency": "NGN", "amount_total": 10000.0},
            headers=staff_headers,
        )
        assert r.status_code == 200
        inv = r.json()

        past1 = (date.today() - timedelta(days=10)).isoformat()
        past2 = (date.today() - timedelta(days=5)).isoformat()
        future = (date.today() + timedelta(days=7)).isoformat()

        for due, amt in [(past1, 3000.0), (past2, 4000.0), (future, 3000.0)]:
            r = await client.post(f"/invoices/{inv['id']}/schedules", json={"due_date": due, "amount": amt}, headers=staff_headers)
            assert r.status_code == 200

        # No payments -> recompute
        r = await client.post(f"/invoices/{inv['id']}/recompute", headers=staff_headers)
        assert r.status_code == 200
        data = r.json()
        assert data["invoice"]["residual"] == 10000.0

        # Pay 2000 -> first schedule partial, others unchanged
        r = await client.post(
            "/payments",
            json={
                "partner_id": partner["id"],
                "invoice_id": inv["id"],
                "amount": 2000.0,
                "currency": "NGN",
                "date": date.today().isoformat(),
                "state": "posted",
            },
            headers=staff_headers,
        )
        assert r.status_code == 200
        r = await client.post(f"/invoices/{inv['id']}/recompute", headers=staff_headers)
        assert r.status_code == 200
        r = await client.get(f"/invoices/{inv['id']}/schedules")
        sched = r.json()
        assert sched[0]["status"] in ("partial", "overdue")
        assert sched[1]["status"] in ("pending", "overdue")
        assert sched[2]["status"] == "pending"

        # Pay 1500 more -> first paid (3500>=3000), second partial (500 paid of 4000)
        r = await client.post(
            "/payments",
            json={
                "partner_id": partner["id"],
                "invoice_id": inv["id"],
                "amount": 1500.0,
                "currency": "NGN",
                "date": date.today().isoformat(),
                "state": "posted",
            },
            headers=staff_headers,
        )
        assert r.status_code == 200
        r = await client.post(f"/invoices/{inv['id']}/recompute", headers=staff_headers)
        assert r.status_code == 200
        r = await client.get(f"/invoices/{inv['id']}/schedules")
        sched = r.json()
        assert sched[0]["status"] == "paid"
        assert sched[1]["status"] in ("partial", "overdue")
        assert sched[2]["status"] == "pending"


@pytest.mark.anyio
async def test_signature_uploads_and_pdf_embedding_basic():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # Staff auth
        r = await client.post("/auth/register", json={"username": "adv_staff3", "password": "secret", "role": "staff"})
        assert r.status_code in (200, 400)
        r = await client.post("/auth/login", json={"username": "adv_staff3", "password": "secret"})
        assert r.status_code == 200
        staff_headers = {"Authorization": f"Bearer {r.json()['access_token']}"}
        # Partner and property/suite/offer
        r = await client.post("/partners", json={"name": "Sig User", "email": "sig@example.com"})
        assert r.status_code == 200
        partner = r.json()

        r = await client.post("/properties", json={"name": "PropS", "code": "PS"})
        prop = r.json()

        r = await client.post(f"/properties/{prop['id']}/suites", json={"property_id": prop["id"], "name": "Suite S1", "number": "S1"})
        suite = r.json()

        r = await client.post(
            "/offers",
            json={"partner_id": partner["id"], "suite_id": suite["id"], "price_total": 12345.0, "code": "OFF-SIG-1"},
            headers=staff_headers,
        )
        offer = r.json()

        # Upload signatures
        files = {"file": ("sig.png", PNG_BYTES, "image/png")}
        r = await client.post(f"/partners/{partner['id']}/signature", files=files)
        assert r.status_code == 200

        files = {
            "ops_manager_signature": ("ops.png", PNG_BYTES, "image/png"),
            "director_signature": ("dir.png", PNG_BYTES, "image/png"),
        }
        data = {
            "name": "Hommes Estates",
            "ops_manager_name": "Ops Manager",
            "ops_manager_title": "Operations Manager",
            "director_name": "Director",
            "director_title": "Director",
        }
        r = await client.post("/company/signatures", data=data, files=files)
        assert r.status_code == 200

        # Offer Letter with signatures
        r = await client.post(f"/offers/{offer['id']}/documents/offer_letter", headers=staff_headers)
        assert r.status_code == 200
        doc = r.json()["document"]
        assert doc["size"] > 500

        # Create invoice, schedule, payment summary letter
        r = await client.post("/invoices", json={"partner_id": partner["id"], "offer_id": offer["id"], "currency": "NGN", "amount_total": 12345.0}, headers=staff_headers)
        invoice = r.json()
        due = date.today().isoformat()
        r = await client.post(f"/invoices/{invoice['id']}/schedules", json={"due_date": due, "amount": 12345.0}, headers=staff_headers)
        assert r.status_code == 200
        r = await client.post(f"/offers/{offer['id']}/documents/payment_summary", headers=staff_headers)
        assert r.status_code == 200
        doc = r.json()["document"]
        assert doc["size"] > 500

        # Allocation letter
        r = await client.post(f"/offers/{offer['id']}/documents/allocation", headers=staff_headers)
        assert r.status_code == 200
        doc = r.json()["document"]
        assert doc["size"] > 500

        # Payment ack with signatures
        r = await client.post(
            "/payments",
            json={"partner_id": partner["id"], "invoice_id": invoice["id"], "amount": 1000.0, "currency": "NGN", "date": date.today().isoformat(), "state": "posted"},
            headers=staff_headers,
        )
        payment = r.json()
        r = await client.post(f"/payments/{payment['id']}/ack", headers=staff_headers)
        assert r.status_code == 200
        doc = r.json()["document"]
        assert doc["size"] > 500
