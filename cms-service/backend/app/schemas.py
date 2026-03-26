from datetime import datetime
from pydantic import BaseModel


class SiteCreate(BaseModel):
    name: str
    domain: str | None = None


class SiteRead(BaseModel):
    id: int
    name: str
    domain: str | None
    is_active: bool

    class Config:
        from_attributes = True


class PageCreate(BaseModel):
    site_id: int
    slug: str
    title: str | None = None
    content: str | None = None


class PageRead(BaseModel):
    id: int
    site_id: int
    slug: str
    title: str | None
    status: str
    content: str | None
    published_at: datetime | None

    class Config:
        from_attributes = True


class TemplateCreate(BaseModel):
    site_id: int
    name: str
    content: str | None = None


class TemplateRead(BaseModel):
    id: int
    site_id: int
    name: str
    content: str | None

    class Config:
        from_attributes = True


class MediaAssetRead(BaseModel):
    id: int
    site_id: int
    name: str
    mime_type: str | None
    size: int | None
    file_path: str

    class Config:
        from_attributes = True
