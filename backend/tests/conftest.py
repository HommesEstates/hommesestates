"""Test configuration and fixtures."""
import os
import pytest
from pathlib import Path
from typing import Generator, AsyncGenerator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db

# Ensure a fresh test database for each test run
TEST_DB = Path(__file__).resolve().parent.parent / "test.db"
os.environ["APP_DATABASE_URL"] = f"sqlite:///{TEST_DB.as_posix()}"
try:
    if TEST_DB.exists():
        TEST_DB.unlink()
except Exception:
    pass

# Test database URL (in-memory SQLite for faster tests)
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

# Create test engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    import asyncio
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
def db_session() -> Generator:
    """Create a fresh database session for each test."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session) -> Generator[TestClient, None, None]:
    """Create a test client with database dependency override."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers(client: TestClient) -> dict:
    """Create authentication headers for a test user."""
    # Create test user
    user_data = {
        "username": "testuser",
        "password": "testpass123",
        "role": "staff"
    }
    response = client.post("/auth/register", json=user_data)
    assert response.status_code == 201
    
    # Login to get token
    login_data = {
        "username": "testuser",
        "password": "testpass123"
    }
    response = client.post("/auth/login", json=login_data)
    assert response.status_code == 200
    token = response.json()["access_token"]
    
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def sample_property(db_session):
    """Create a sample property for testing."""
    from app.models import Property, Partner
    
    # Create owner partner
    owner = Partner(
        name="Test Owner",
        email="owner@test.com",
        phone="1234567890"
    )
    db_session.add(owner)
    db_session.commit()
    
    # Create property
    property = Property(
        name="Test Property",
        code="PROP001",
        property_type="residential",
        address="123 Test St",
        city="Test City",
        owner_id=owner.id,
        published=1
    )
    db_session.add(property)
    db_session.commit()
    db_session.refresh(property)
    
    return property


@pytest.fixture
def sample_suite(db_session, sample_property):
    """Create a sample suite for testing."""
    from app.models import Suite
    
    suite = Suite(
        name="Test Suite",
        number="A101",
        property_id=sample_property.id,
        suite_type="apartment",
        list_price=100000.0,
        area_sqm=50.0,
        is_available=1,
        published=1
    )
    db_session.add(suite)
    db_session.commit()
    db_session.refresh(suite)
    
    return suite
