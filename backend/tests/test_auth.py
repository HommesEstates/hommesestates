"""Test authentication endpoints."""
import pytest
from fastapi.testclient import TestClient


@pytest.mark.auth
class TestAuthEndpoints:
    """Test authentication API endpoints."""

    def test_register_user(self, client: TestClient):
        """Test user registration."""
        user_data = {
            "username": "newuser",
            "password": "newpass123",
            "role": "staff"
        }
        response = client.post("/auth/register", json=user_data)
        assert response.status_code == 201
        data = response.json()
        assert data["username"] == "newuser"
        assert data["role"] == "staff"
        assert "id" in data

    def test_register_duplicate_username(self, client: TestClient):
        """Test registration with duplicate username."""
        user_data = {
            "username": "testuser",
            "password": "testpass123",
            "role": "staff"
        }
        # First registration should succeed
        response = client.post("/auth/register", json=user_data)
        assert response.status_code == 201
        
        # Second registration should fail
        response = client.post("/auth/register", json=user_data)
        assert response.status_code == 400

    def test_login_success(self, client: TestClient):
        """Test successful login."""
        # Register user first
        user_data = {
            "username": "loginuser",
            "password": "loginpass123",
            "role": "staff"
        }
        client.post("/auth/register", json=user_data)
        
        # Login
        login_data = {
            "username": "loginuser",
            "password": "loginpass123"
        }
        response = client.post("/auth/login", json=login_data)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    def test_login_invalid_credentials(self, client: TestClient):
        """Test login with invalid credentials."""
        login_data = {
            "username": "nonexistent",
            "password": "wrongpass"
        }
        response = client.post("/auth/login", json=login_data)
        assert response.status_code == 401

    def test_get_current_user(self, client: TestClient, auth_headers: dict):
        """Test getting current user info."""
        response = client.get("/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "testuser"
        assert "role" in data

    def test_get_current_user_no_token(self, client: TestClient):
        """Test getting current user without token."""
        response = client.get("/auth/me")
        assert response.status_code == 401

    def test_logout(self, client: TestClient, auth_headers: dict):
        """Test logout endpoint."""
        response = client.post("/auth/logout", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["ok"] is True

    def test_change_password(self, client: TestClient, auth_headers: dict):
        """Test password change."""
        password_data = {
            "old_password": "testpass123",
            "new_password": "newpass456"
        }
        response = client.post("/auth/change-password", json=password_data, headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["ok"] is True

    def test_change_password_wrong_old(self, client: TestClient, auth_headers: dict):
        """Test password change with wrong old password."""
        password_data = {
            "old_password": "wrongpass",
            "new_password": "newpass456"
        }
        response = client.post("/auth/change-password", json=password_data, headers=auth_headers)
        assert response.status_code == 400

    def test_signup_customer(self, client: TestClient):
        """Test customer signup (public endpoint)."""
        signup_data = {
            "name": "John Doe",
            "email": "john@example.com",
            "password": "customerpass123",
            "phone": "1234567890"
        }
        response = client.post("/auth/signup", json=signup_data)
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert "partner_id" in data


@pytest.mark.unit
class TestAuthDependencies:
    """Test authentication dependencies and utilities."""

    def test_jwt_token_creation(self):
        """Test JWT token creation."""
        from app.security import create_access_token, decode_access_token
        
        data = {"sub": 1, "username": "testuser", "role": "staff"}
        token = create_access_token(data)
        assert isinstance(token, str)
        
        decoded = decode_access_token(token)
        assert decoded is not None
        assert decoded["sub"] == 1

    def test_password_hashing(self):
        """Test password hashing and verification."""
        from app.security import get_password_hash, verify_password
        
        password = "testpass123"
        hashed = get_password_hash(password)
        assert hashed != password
        assert verify_password(password, hashed) is True
        assert verify_password("wrongpass", hashed) is False
