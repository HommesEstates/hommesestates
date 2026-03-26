"""Test public API endpoints."""
import pytest
from fastapi.testclient import TestClient


@pytest.mark.api
class TestPublicEndpoints:
    """Test public (unauthenticated) API endpoints."""

    def test_public_properties(self, client: TestClient, sample_property):
        """Test public properties endpoint."""
        response = client.get("/public/properties")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should only return published properties
        for prop in data:
            assert prop["published"] == 1

    def test_public_property_detail(self, client: TestClient, sample_property):
        """Test public property detail endpoint."""
        response = client.get(f"/public/properties/{sample_property.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == sample_property.id
        assert data["published"] == 1

    def test_public_unpublished_property(self, client: TestClient, db_session):
        """Test that unpublished properties are not accessible publicly."""
        from app.models import Property, Partner
        
        # Create unpublished property
        owner = Partner(name="Owner", email="owner@test.com")
        db_session.add(owner)
        db_session.commit()
        
        property = Property(
            name="Unpublished Property",
            code="UNPUB001",
            property_type="residential",
            owner_id=owner.id,
            published=0  # Unpublished
        )
        db_session.add(property)
        db_session.commit()
        
        response = client.get(f"/public/properties/{property.id}")
        assert response.status_code == 404

    def test_public_suites(self, client: TestClient, sample_suite):
        """Test public suites endpoint."""
        response = client.get("/public/suites")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should only return published, available suites
        for suite in data:
            assert suite["published"] == 1
            assert suite["is_available"] == 1

    def test_public_suites_by_property(self, client: TestClient, sample_property, sample_suite):
        """Test public suites for a specific property."""
        response = client.get(f"/public/properties/{sample_property.id}/suites")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for suite in data:
            assert suite["property_id"] == sample_property.id
            assert suite["published"] == 1
            assert suite["is_available"] == 1

    def test_public_countries(self, client: TestClient):
        """Test public countries endpoint."""
        response = client.get("/public/countries")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_public_states(self, client: TestClient):
        """Test public states endpoint."""
        response = client.get("/public/states")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_public_states_by_country(self, client: TestClient, db_session):
        """Test states filtered by country."""
        from app.models import Country, State
        
        # Create test country and state
        country = Country(name="Test Country", code="TC")
        db_session.add(country)
        db_session.commit()
        
        state = State(name="Test State", code="TS", country_id=country.id)
        db_session.add(state)
        db_session.commit()
        
        response = client.get(f"/public/countries/{country.id}/states")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert data[0]["country_id"] == country.id

    def test_public_offer_creation_form(self, client: TestClient):
        """Test public offer creation form data."""
        response = client.get("/public/offers/create")
        assert response.status_code == 200
        data = response.json()
        assert "property_types" in data
        assert "countries" in data
        assert "states" in data

    def test_create_public_offer(self, client: TestClient, sample_suite, db_session):
        """Test creating a public offer."""
        from app.models import Partner
        
        # Create customer partner
        customer = Partner(
            name="Test Customer",
            email="customer@test.com",
            phone="1234567890"
        )
        db_session.add(customer)
        db_session.commit()
        
        offer_data = {
            "partner_id": customer.id,
            "suite_id": sample_suite.id,
            "name": "Test Offer",
            "price": 95000.0,
            "terms": "Test terms and conditions"
        }
        
        response = client.post("/public/offers/create", json=offer_data)
        assert response.status_code == 201
        data = response.json()
        assert data["partner_id"] == customer.id
        assert data["suite_id"] == sample_suite.id
        assert "id" in data


@pytest.mark.integration
class TestPublicOfferFlow:
    """Test complete public offer creation flow."""

    def test_full_offer_flow(self, client: TestClient, sample_property, sample_suite, db_session):
        """Test the complete flow from property browsing to offer creation."""
        from app.models import Partner
        
        # 1. Browse properties
        response = client.get("/public/properties")
        assert response.status_code == 200
        properties = response.json()
        assert len(properties) >= 1
        
        # 2. View property details
        response = client.get(f"/public/properties/{sample_property.id}")
        assert response.status_code == 200
        property_detail = response.json()
        assert property_detail["id"] == sample_property.id
        
        # 3. View available suites
        response = client.get(f"/public/properties/{sample_property.id}/suites")
        assert response.status_code == 200
        suites = response.json()
        assert len(suites) >= 1
        
        # 4. Get offer creation form
        response = client.get("/public/offers/create")
        assert response.status_code == 200
        form_data = response.json()
        assert "property_types" in form_data
        
        # 5. Create customer
        customer = Partner(
            name="Flow Test Customer",
            email="flow@test.com",
            phone="9876543210"
        )
        db_session.add(customer)
        db_session.commit()
        
        # 6. Create offer
        offer_data = {
            "partner_id": customer.id,
            "suite_id": sample_suite.id,
            "name": "Flow Test Offer",
            "price": 90000.0,
            "terms": "Test offer terms"
        }
        
        response = client.post("/public/offers/create", json=offer_data)
        assert response.status_code == 201
        offer = response.json()
        assert offer["partner_id"] == customer.id
        assert offer["suite_id"] == sample_suite.id
        assert offer["state"] == "draft"
