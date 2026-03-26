from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from .database import Base


class TimestampMixin:
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class Site(Base, TimestampMixin):
    __tablename__ = "cms_sites"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    domain = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)

    pages = relationship("Page", back_populates="site", cascade="all, delete-orphan")


class Theme(Base, TimestampMixin):
    __tablename__ = "cms_themes"

    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(Integer, ForeignKey("cms_sites.id"), nullable=False)
    name = Column(String(255), nullable=False)
    tokens = Column(Text, nullable=True)  # JSON string for design tokens


class Template(Base, TimestampMixin):
    __tablename__ = "cms_templates"

    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(Integer, ForeignKey("cms_sites.id"), nullable=False)
    name = Column(String(255), nullable=False)
    content = Column(Text, nullable=True)  # JSON component tree


class Page(Base, TimestampMixin):
    __tablename__ = "cms_pages"

    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(Integer, ForeignKey("cms_sites.id"), nullable=False)
    slug = Column(String(255), nullable=False)
    title = Column(String(255), nullable=True)
    status = Column(String(32), default="draft")  # draft|published
    content = Column(Text, nullable=True)  # JSON component tree
    published_at = Column(DateTime, nullable=True)

    site = relationship("Site", back_populates="pages")


class MediaAsset(Base, TimestampMixin):
    __tablename__ = "cms_media_assets"

    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(Integer, ForeignKey("cms_sites.id"), nullable=False)
    name = Column(String(255), nullable=False)
    mime_type = Column(String(128), nullable=True)
    size = Column(Integer, nullable=True)
    file_path = Column(Text, nullable=False)


class Folder(Base, TimestampMixin):
    __tablename__ = "cms_folders"

    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(Integer, ForeignKey("cms_sites.id"), nullable=False)
    name = Column(String(255), nullable=False)
    parent_id = Column(Integer, ForeignKey("cms_folders.id"), nullable=True)


class Tag(Base, TimestampMixin):
    __tablename__ = "cms_tags"

    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(Integer, ForeignKey("cms_sites.id"), nullable=False)
    name = Column(String(64), nullable=False)


class PreviewToken(Base, TimestampMixin):
    __tablename__ = "cms_preview_tokens"

    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(Integer, ForeignKey("cms_sites.id"), nullable=False)
    page_id = Column(Integer, ForeignKey("cms_pages.id"), nullable=True)
    token = Column(String(255), unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=True)


class PublishJob(Base, TimestampMixin):
    __tablename__ = "cms_publish_jobs"

    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(Integer, ForeignKey("cms_sites.id"), nullable=False)
    page_id = Column(Integer, ForeignKey("cms_pages.id"), nullable=True)
    status = Column(String(32), default="queued")  # queued|running|done|failed
    error = Column(Text, nullable=True)


class Activity(Base, TimestampMixin):
    __tablename__ = "cms_activities"

    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(Integer, ForeignKey("cms_sites.id"), nullable=False)
    user_id = Column(Integer, nullable=True)
    action = Column(String(64), nullable=False)
    details = Column(Text, nullable=True)
