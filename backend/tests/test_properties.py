"""Test property management endpoints."""
import pytest
from fastapi.testclient import TestClient


@pytest.mark.api
class TestPropertyEndpoints:
    """Test property API endpoints."""

    def test_get_properties(self, client: TestClient, sample_property):
        """Test getting list of properties."""
        response = client.get("/properties")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert data[0]["name"] == "Test Property"

    def test_get_property_detail(self, client: TestClient, sample_property):
        """Test getting property details."""
        response = client.get(f"/properties/{sample_property.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == sample_property.id
        assert data["name"] == "Test Property"

    def test_get_property_not_found(self, client: TestClient):
        """Test getting non-existent property."""
        response = client.get("/properties/99999")
        assert response.status_code == 404

    def test_create_property(self, client: TestClient, auth_headers: dict):
        """Test creating a new property."""
        property_data = {
            "name": "New Property",
            "code": "PROP002",
            "property_type": "commercial",
            "address": "456 New St",
            "city": "New City",
            "published": 1
        }
        response = client.post("/properties", json=property_data, headers=auth_headers)
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "New Property"
        assert data["code"] == "PROP002"

    def test_update_property(self, client: TestClient, auth_headers: dict, sample_property):
        """Test updating a property."""
        update_data = {
            "name": "Updated Property",
            "city": "Updated City"
        }
        response = client.put(f"/properties/{sample_property.id}", json=update_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Property"

    def test_delete_property(self, client: TestClient, auth_headers: dict):
        """Test deleting a property."""
        # Create property first
        property_data = {
            "name": "Property to Delete",
            "property_type": "residential"
        }
        create_response = client.post("/properties", json=property_data, headers=auth_headers)
        assert create_response.status_code == 201
        property_id = create_response.json()["id"]
        
        # Delete it
        response = client.delete(f"/properties/{property_id}", headers=auth_headers)
        assert response.status_code == 200

    def test_publish_property(self, client: TestClient, auth_headers: dict, sample_property):
        """Test publishing a property."""
        response = client.post(f"/properties/{sample_property.id}/publish", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["published"] == 1

    def test_unpublish_property(self, client: TestClient, auth_headers: dict, sample_property):
        """Test unpublishing a property."""
        response = client.post(f"/properties/{sample_property.id}/unpublish", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["published"] == 0


@pytest.mark.api
class TestSuiteEndpoints:
    """Test suite API endpoints."""

    def test_get_suites(self, client: TestClient, sample_suite):
        """Test getting list of suites."""
        response = client.get("/suites")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    def test_get_suites_by_property(self, client: TestClient, sample_property, sample_suite):
        """Test getting suites for a specific property."""
        response = client.get(f"/properties/{sample_property.id}/suites")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert data[0]["property_id"] == sample_property.id

    def test_create_suite(self, client: TestClient, auth_headers: dict, sample_property):
        """Test creating a new suite."""
        suite_data = {
            "name": "New Suite",
            "number": "B201",
            "property_id": sample_property.id,
            "suite_type": "apartment",
            "list_price": 150000.0,
            "area_sqm": 75.0,
            "is_available": 1,
            "published": 1
        }
        response = client.post("/suites", json=suite_data, headers=auth_headers)
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "New Suite"
        assert data["property_id"] == sample_property.id

    def test_update_suite(self, client: TestClient, auth_headers: dict, sample_suite):
        """Test updating a suite."""
        update_data = {
            "name": "Updated Suite",
            "list_price": 120000.0
        }
        response = client.put(f"/suites/{sample_suite.id}", json=update_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Suite"
        assert data["list_price"] == 120000.0

    def test_publish_suite(self, client: TestClient, auth_headers: dict, sample_suite):
        """Test publishing a suite."""
        response = client.post(f"/suites/{sample_suite.id}/publish", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["published"] == 1

    def test_unpublish_suite(self, client: TestClient, auth_headers: dict, sample_suite):
        """Test unpublishing a suite."""
        response = client.post(f"/suites/{sample_suite.id}/unpublish", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["published"] == 0


@pytest.mark.unit
class TestPropertyModels:
    """Test property-related database models."""

    def test_property_model_creation(self, db_session):
        """Test Property model creation and relationships."""
        from app.models import Property, Partner
        
        # Create owner
        owner = Partner(name="Test Owner", email="owner@test.com")
        db_session.add(owner)
        db_session.commit()
        
        # Create property
        property = Property(
            name="Model Test Property",
            code="MODEL001",
            property_type="residential",
            owner_id=owner.id
        )
        db_session.add(property)
        db_session.commit()
        
        assert property.id is not None
        assert property.name == "Model Test Property"
        assert property.owner.name == "Test Owner"

    def test_suite_model_creation(self, db_session, sample_property):
        """Test Suite model creation and relationships."""
        from app.models import Suite
        
        suite = Suite(
            name="Model Test Suite",
            property_id=sample_property.id,
            suite_type="apartment",
            list_price=200000.0,
            area_sqm=100.0
        )
        db_session.add(suite)
        db_session.commit()
        
        assert suite.id is not None
        assert suite.property.name == "Test Property"
        assert suite.list_price == 200000.0
