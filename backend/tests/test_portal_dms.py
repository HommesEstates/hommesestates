import pytest
import httpx
from app.main import app


@pytest.mark.anyio
async def test_portal_acl_and_dms_crud_and_dashboard():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # Staff auth
        r = await client.post("/auth/register", json={"username": "staff1", "password": "secret", "role": "staff"})
        assert r.status_code in (200, 400)
        r = await client.post("/auth/login", json={"username": "staff1", "password": "secret"})
        assert r.status_code == 200
        staff_headers = {"Authorization": f"Bearer {r.json()['access_token']}"}

        # Portal partner and user
        r = await client.post("/partners", json={"name": "Portal User", "email": "p@example.com"})
        partner = r.json()
        r = await client.post("/auth/register", json={"username": "portal1", "password": "secret", "role": "portal", "partner_id": partner["id"]})
        assert r.status_code in (200, 400)
        r = await client.post("/auth/login", json={"username": "portal1", "password": "secret"})
        assert r.status_code == 200
        portal_headers = {"Authorization": f"Bearer {r.json()['access_token']}"}

        # Create property/suite/offer and generate a document (offer letter)
        r = await client.post("/properties", json={"name": "PropP", "code": "PRP"})
        prop = r.json()
        r = await client.post(f"/properties/{prop['id']}/suites", json={"property_id": prop["id"], "name": "Suite P1", "number": "P1"})
        suite = r.json()
        r = await client.post("/offers", json={"partner_id": partner["id"], "suite_id": suite["id"], "price_total": 5000.0, "code": "O-PORT-1"}, headers=staff_headers)
        offer = r.json()
        r = await client.post(f"/offers/{offer['id']}/documents/offer_letter", headers=staff_headers)
        assert r.status_code == 200
        doc = r.json()["document"]

        # Portal me endpoints show own docs
        r = await client.get("/portal/me/documents", headers=portal_headers)
        assert r.status_code == 200
        docs = r.json()["documents"]
        assert any(d["id"] == doc["id"] for d in docs)

        # Portal can download own document
        r = await client.get(doc["download_url"], headers=portal_headers)
        assert r.status_code == 200
        assert r.headers.get("content-type", "").startswith("application/pdf")

        # Another portal user cannot access the doc
        r = await client.post("/partners", json={"name": "Portal Two", "email": "p2@example.com"})
        partner2 = r.json()
        r = await client.post("/auth/register", json={"username": "portal2", "password": "secret", "role": "portal", "partner_id": partner2["id"]})
        assert r.status_code in (200, 400)
        r = await client.post("/auth/login", json={"username": "portal2", "password": "secret"})
        portal2_headers = {"Authorization": f"Bearer {r.json()['access_token']}"}
        r = await client.get(doc["download_url"], headers=portal2_headers)
        assert r.status_code == 403

        # DMS: workspace and folder
        r = await client.post("/dms/workspaces", params={"name": "Main"}, headers=staff_headers)
        assert r.status_code == 200
        ws = r.json()
        r = await client.post("/dms/folders", params={"name": "Root", "workspace_id": ws["id"]}, headers=staff_headers)
        assert r.status_code == 200
        folder = r.json()

        # DMS: tags and tagging
        r = await client.post("/dms/tags", params={"name": "vip"}, headers=staff_headers)
        assert r.status_code == 200
        tag = r.json()
        r = await client.post(f"/dms/documents/{doc['id']}/tags", params={"tag_id": tag["id"]}, headers=staff_headers)
        assert r.status_code == 200
        r = await client.get(f"/dms/documents/{doc['id']}/tags", headers=staff_headers)
        assert r.status_code == 200
        tags = r.json()
        assert any(t["name"] == "vip" for t in tags)
        r = await client.delete(f"/dms/documents/{doc['id']}/tags/{tag['id']}", headers=staff_headers)
        assert r.status_code == 200

        # DMS: comments (portal & staff)
        r = await client.post(f"/dms/documents/{doc['id']}/comments", params={"body": "Looks good"}, headers=portal_headers)
        assert r.status_code == 200
        r = await client.post(f"/dms/documents/{doc['id']}/comments", params={"body": "Approved"}, headers=staff_headers)
        assert r.status_code == 200
        r = await client.get(f"/dms/documents/{doc['id']}/comments", headers=staff_headers)
        comments = r.json()
        assert len(comments) >= 2

        # DMS: versions add and restore
        files = {"file": ("v2.txt", b"V2 content", "text/plain")}
        r = await client.post(f"/dms/documents/{doc['id']}/versions", files=files, headers=staff_headers)
        assert r.status_code == 200
        v = r.json()
        r = await client.get(f"/dms/documents/{doc['id']}/versions", headers=staff_headers)
        assert r.status_code == 200
        versions = r.json()
        assert any(x["version_no"] == v["version_no"] for x in versions)
        r = await client.post(f"/dms/documents/{doc['id']}/versions/{v['id']}/restore", headers=staff_headers)
        assert r.status_code == 200

        # DMS: share list & revoke
        r = await client.post(f"/documents/{doc['id']}/share", headers=staff_headers)
        assert r.status_code == 200
        share = r.json()
        r = await client.get(share["download_url"])  # public
        assert r.status_code == 200
        r = await client.get(f"/dms/documents/{doc['id']}/shares", headers=staff_headers)
        assert r.status_code == 200
        shares = r.json()
        assert len(shares) >= 1
        first_share_id = shares[0]["id"]
        r = await client.delete(f"/dms/shares/{first_share_id}", headers=staff_headers)
        assert r.status_code == 200
        # After revoke, previous public link should 404/410
        r = await client.get(share["download_url"])  # may 404/410
        assert r.status_code in (404, 410)

        # Dashboard KPIs with filters
        r = await client.get("/dashboard/kpis", headers=staff_headers)
        assert r.status_code == 200
        data = r.json()
        assert "trends" in data and "offers_per_day" in data["trends"]
        r = await client.get("/dashboard/kpis", params={"days": 7, "property_id": prop["id"]}, headers=staff_headers)
        assert r.status_code == 200
