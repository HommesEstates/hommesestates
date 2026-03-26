import os
from functools import lru_cache

class Settings:
    APP_NAME: str = os.getenv("CMS_APP_NAME", "cms-service")
    ENV: str = os.getenv("ENV", "dev")
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"
    DATABASE_URL: str = os.getenv("CMS_DATABASE_URL", "sqlite:///./cms.db")
    ALLOW_ORIGINS: str = os.getenv("CMS_CORS_ORIGINS", "*")
    JWT_PUBLIC_KEY: str | None = os.getenv("AUTH_JWT_PUBLIC_KEY")
    JWT_ALG: str = os.getenv("AUTH_JWT_ALG", "HS256")
    MEDIA_STORAGE_PATH: str = os.getenv("CMS_MEDIA_STORAGE_PATH", "cms_storage")

@lru_cache
def get_settings() -> Settings:
    return Settings()
