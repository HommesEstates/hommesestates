import pytest
import httpx
from app.main import app


@pytest.mark.anyio
async def test_dms_upload_move_and_pagination():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # Staff auth
        r = await client.post("/auth/register", json={"username": "dms_staff", "password": "secret", "role": "staff"})
        assert r.status_code in (200, 400)
        r = await client.post("/auth/login", json={"username": "dms_staff", "password": "secret"})
        staff_headers = {"Authorization": f"Bearer {r.json()['access_token']}"}

        # Portal user and partner
        r = await client.post("/partners", json={"name": "Paginate User", "email": "p1@example.com"})
        partner = r.json()
        r = await client.post("/auth/register", json={"username": "port_u", "password": "secret", "role": "portal", "partner_id": partner["id"]})
        assert r.status_code in (200, 400)
        r = await client.post("/auth/login", json={"username": "port_u", "password": "secret"})
        portal_headers = {"Authorization": f"Bearer {r.json()['access_token']}"}

        # Folder
        r = await client.post("/dms/workspaces", params={"name": "WS"}, headers=staff_headers)
        assert r.status_code == 200
        ws = r.json()
        r = await client.post("/dms/folders", params={"name": "Docs", "workspace_id": ws["id"]}, headers=staff_headers)
        assert r.status_code == 200
        folder = r.json()

        # Upload a file for partner
        files = {"file": ("hello.txt", b"Hello world", "text/plain")}
        r = await client.post("/dms/documents/upload", files=files, params={"name": "Hello.txt", "partner_id": partner["id"], "doc_type": "other"}, headers=staff_headers)
        assert r.status_code == 200, r.text
        doc = r.json()

        # Download as staff
        r = await client.get(doc["download_url"], headers=staff_headers)
        assert r.status_code == 200
        assert r.headers.get("content-type", "").startswith("text/plain")

        # Move to folder
        r = await client.post(f"/dms/documents/{doc['id']}/move", params={"folder_id": folder["id"]}, headers=staff_headers)
        assert r.status_code == 200

        # Add comments (3) mixed portal/staff
        r = await client.post(f"/dms/documents/{doc['id']}/comments", params={"body": "c1"}, headers=portal_headers)
        assert r.status_code == 200
        r = await client.post(f"/dms/documents/{doc['id']}/comments", params={"body": "c2"}, headers=staff_headers)
        assert r.status_code == 200
        r = await client.post(f"/dms/documents/{doc['id']}/comments", params={"body": "c3"}, headers=portal_headers)
        assert r.status_code == 200

        # Paginate comments: skip first, get next 2
        r = await client.get(f"/dms/documents/{doc['id']}/comments", params={"limit": 2, "offset": 1}, headers=portal_headers)
        assert r.status_code == 200
        comments = r.json()
        assert len(comments) == 2

        # Create payments for portal user to test pagination
        for i in range(3):
            r = await client.post("/payments", json={"partner_id": partner["id"], "amount": 1000 + i, "currency": "NGN", "date": "2025-01-0{}".format(i+1), "state": "posted"}, headers=staff_headers)
            assert r.status_code == 200
        r = await client.get("/portal/me/payments", params={"limit": 2, "offset": 1}, headers=portal_headers)
        assert r.status_code == 200
        items = r.json()
        assert len(items) == 2
