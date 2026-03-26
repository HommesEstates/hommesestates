import pytest
import httpx
from app.main import app


@pytest.mark.anyio
async def test_public_share_password_protection():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # Staff auth
        r = await client.post("/auth/register", json={"username": "share_staff", "password": "secret", "role": "staff"})
        assert r.status_code in (200, 400)
        r = await client.post("/auth/login", json={"username": "share_staff", "password": "secret"})
        assert r.status_code == 200
        staff_headers = {"Authorization": f"Bearer {r.json()['access_token']}"}

        # Upload doc
        files = {"file": ("secret.txt", b"Top Secret", "text/plain")}
        r = await client.post("/dms/documents/upload", files=files, headers=staff_headers)
        assert r.status_code == 200
        doc = r.json()

        # Create password-protected share
        r = await client.post(f"/documents/{doc['id']}/share", params={"password": "p@ss"}, headers=staff_headers)
        assert r.status_code == 200
        share = r.json()

        # Try public download without password -> 401
        r = await client.get(share["download_url"])  # no password
        assert r.status_code == 401
        # Wrong password -> 401
        r = await client.get(share["download_url"], params={"password": "wrong"})
        assert r.status_code == 401
        # Correct password -> 200
        r = await client.get(share["download_url"], params={"password": "p@ss"})
        assert r.status_code == 200
        assert r.headers.get("content-type", "").startswith("text/plain")
