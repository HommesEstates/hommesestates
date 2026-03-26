from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    database_url: str = "sqlite:///./dev.db"
    dms_storage_path: str = "storage"
    document_storage_path: str = "storage/documents"
    allowed_origins: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ]
    jwt_secret_key: str = "change-me"
    jwt_public_key: str | None = None
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    jwt_expire_hours: int = 24

    # Branding for PDFs
    brand_logo_path: str | None = None
    brand_watermark_text: str | None = None
    brand_address: str | None = None
    brand_primary_color: str = "#111827"
    
    # Email settings (for notifications)
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_user: str | None = None
    smtp_password: str | None = None
    email_from: str | None = None
    
    # Frontend URL for links
    frontend_url: str = "http://localhost:3000"
    backend_url: str = "http://localhost:8000"
    
    # Redis configuration
    redis_url: str = "redis://localhost:6379"
    redis_cache_ttl: int = 3600  # Default cache TTL in seconds
    
    # Rate limiting configuration
    rate_limit_enabled: bool = True
    rate_limit_redis_url: str = "redis://localhost:6379"

    model_config = SettingsConfigDict(env_file=".env", env_prefix="APP_", case_sensitive=False)


settings = Settings()
