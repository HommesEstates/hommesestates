from datetime import datetime, date
from typing import Optional
from sqlalchemy import (
    Column,
    Integer,
    String,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Text,
    LargeBinary,
    Boolean,
    Numeric,
)
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declared_attr

from .database import Base


class TimestampMixin:
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class Company(Base, TimestampMixin):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, default="Hommes Estates")

    # Signatories (mirrors Odoo params usage)
    ops_manager_name = Column(String(255), nullable=True)
    ops_manager_title = Column(String(255), nullable=True)
    ops_manager_signature = Column(LargeBinary, nullable=True)

    director_name = Column(String(255), nullable=True)
    director_title = Column(String(255), nullable=True)
    director_signature = Column(LargeBinary, nullable=True)

    payments = relationship("Payment", back_populates="company")


class Partner(Base, TimestampMixin):
    __tablename__ = "partners"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True, index=True)
    phone = Column(String(64), nullable=True)
    street = Column(String(255), nullable=True)
    city = Column(String(128), nullable=True)
    state_id = Column(Integer, ForeignKey("states.id"), nullable=True)
    country_id = Column(Integer, ForeignKey("countries.id"), nullable=True)
    zip_code = Column(String(16), nullable=True)
    is_property_owner = Column(Integer, default=0)
    is_company = Column(Integer, default=0)
    signature = Column(LargeBinary, nullable=True)
    
    # MOA fields (Memorandum of Acceptance)
    acceptance_name = Column(String(255), nullable=True)
    acceptance_address = Column(String(255), nullable=True)
    acceptance_designation = Column(String(255), nullable=True)
    acceptance_country_id = Column(Integer, ForeignKey("countries.id"), nullable=True)
    acceptance_state_id = Column(Integer, ForeignKey("states.id"), nullable=True)
    acceptance_city = Column(String(128), nullable=True)
    acceptance_street = Column(String(255), nullable=True)

    payments = relationship("Payment", back_populates="partner")
    offers = relationship("Offer", back_populates="partner")
    properties = relationship("Property", back_populates="owner")


class Offer(Base, TimestampMixin):
    __tablename__ = "offers"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(64), unique=True, nullable=True, index=True)
    name = Column(String(255), nullable=True)  # Offer reference number
    
    partner_id = Column(Integer, ForeignKey("partners.id"), nullable=False)
    suite_id = Column(Integer, ForeignKey("suites.id"), nullable=True)
    suite_name = Column(String(255), nullable=True)
    suite_number = Column(String(64), nullable=True)
    
    # Property relationships (computed from suite)
    floor_id = Column(Integer, ForeignKey("floors.id"), nullable=True)
    block_id = Column(Integer, ForeignKey("blocks.id"), nullable=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=True)
    
    is_offer = Column(Integer, default=1)
    state = Column(String(32), default="draft", index=True)  # draft|sent|sale|cancelled
    
    # Dates
    date_order = Column(DateTime, default=datetime.utcnow)
    validity_date = Column(Date, nullable=True)
    confirmation_date = Column(DateTime, nullable=True)
    
    # Pricing
    currency = Column(String(8), default="NGN")
    price_total = Column(Float, default=0.0)
    amount_total = Column(Float, default=0.0)
    amount_untaxed = Column(Float, default=0.0)
    amount_tax = Column(Float, default=0.0)
    
    # Payment
    payment_term_id = Column(Integer, ForeignKey("payment_terms.id"), nullable=True)
    payment_status = Column(String(16), default="pending")  # pending|partial|paid|overdue
    payment_percentage = Column(Float, default=0.0)
    
    # Document templates
    offer_template_id = Column(Integer, ForeignKey("document_templates.id"), nullable=True)
    payment_ack_template_id = Column(Integer, ForeignKey("document_templates.id"), nullable=True)
    allocation_template_id = Column(Integer, ForeignKey("document_templates.id"), nullable=True)
    
    # Document tracking
    offer_document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    allocation_document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    
    # Document folder
    document_folder_id = Column(Integer, ForeignKey("document_folders.id"), nullable=True)
    
    # Notes
    note = Column(Text, nullable=True)
    
    # Expiry tracking
    is_expired = Column(Integer, default=0)
    
    partner = relationship("Partner", back_populates="offers")
    suite = relationship("Suite", back_populates="offers")
    payment_schedules = relationship("PaymentSchedule", back_populates="offer", cascade="all, delete-orphan")
    payment_acks = relationship("PaymentAcknowledgement", back_populates="offer")


class Invoice(Base, TimestampMixin):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    number = Column(String(64), unique=True, nullable=True, index=True)
    partner_id = Column(Integer, ForeignKey("partners.id"), nullable=False)
    offer_id = Column(Integer, ForeignKey("offers.id"), nullable=True)
    
    # Invoice state
    state = Column(String(32), default="draft")  # draft|posted|paid|cancelled
    
    # Dates
    invoice_date = Column(Date, default=date.today, nullable=False)
    due_date = Column(Date, nullable=True)
    
    # Currency and amounts
    currency = Column(String(8), default="NGN")
    amount_untaxed = Column(Float, default=0.0)
    amount_tax = Column(Float, default=0.0)
    amount_total = Column(Float, default=0.0)
    residual = Column(Float, default=0.0)
    
    # Tax configuration
    tax_rate = Column(Float, default=0.0)  # Overall tax rate percentage
    
    partner = relationship("Partner")
    offer = relationship("Offer")
    lines = relationship("InvoiceLine", back_populates="invoice", cascade="all, delete-orphan")


class InvoiceLine(Base, TimestampMixin):
    __tablename__ = "invoice_lines"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    
    # Line details
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Quantities and prices
    quantity = Column(Float, default=1.0)
    price_unit = Column(Float, default=0.0)
    discount = Column(Float, default=0.0)  # Discount percentage
    
    # Tax
    tax_rate = Column(Float, default=0.0)  # Tax rate percentage for this line
    amount_tax = Column(Float, default=0.0)
    
    # Calculated fields
    price_subtotal = Column(Float, default=0.0)  # quantity * price_unit - discount
    price_total = Column(Float, default=0.0)     # price_subtotal + amount_tax
    
    # Line type
    line_type = Column(String(32), default="product")  # product|service|tax|discount
    
    invoice = relationship("Invoice", back_populates="lines")


class Payment(Base, TimestampMixin):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    partner_id = Column(Integer, ForeignKey("partners.id"), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=True)

    amount = Column(Float, nullable=False)
    currency = Column(String(8), default="NGN")
    date = Column(Date, default=date.today, nullable=False)
    state = Column(String(32), default="posted")  # 'draft' | 'posted' | 'cancelled'

    partner = relationship("Partner", back_populates="payments")
    company = relationship("Company", back_populates="payments")
    invoice = relationship("Invoice")

    documents = relationship("Document", back_populates="payment")


class Document(Base, TimestampMixin):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    content_type = Column(String(255), nullable=False, default="application/pdf")
    doc_type = Column(String(64), nullable=False, default="other")
    size = Column(Integer, nullable=False, default=0)
    file_path = Column(Text, nullable=False)  # relative path under storage
    folder_id = Column(Integer, ForeignKey("document_folders.id"), nullable=True)

    payment_id = Column(Integer, ForeignKey("payments.id"), nullable=True)
    partner_id = Column(Integer, ForeignKey("partners.id"), nullable=True)
    offer_id = Column(Integer, ForeignKey("offers.id"), nullable=True)

    # Relationships
    payment = relationship("Payment", back_populates="documents")

class DocumentShare(Base, TimestampMixin):
    __tablename__ = "document_shares"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    access_token = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=True)
    expires_at = Column(DateTime, nullable=True)


class DocumentAccessLog(Base, TimestampMixin):
    __tablename__ = "document_access_logs"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    share_id = Column(Integer, ForeignKey("document_shares.id"), nullable=True)
    ip_address = Column(String(64), nullable=True)
    user_agent = Column(Text, nullable=True)
    status_code = Column(Integer, nullable=False, default=200)


# ========== Real Estate Core Domain ==========

class DocumentWorkspace(Base, TimestampMixin):
    __tablename__ = "document_workspaces"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)


class DocumentFolder(Base, TimestampMixin):
    __tablename__ = "document_folders"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    parent_id = Column(Integer, ForeignKey("document_folders.id"), nullable=True)
    workspace_id = Column(Integer, ForeignKey("document_workspaces.id"), nullable=True)


class DocumentTag(Base, TimestampMixin):
    __tablename__ = "document_tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(64), unique=True, nullable=False)


class DocumentTagLink(Base, TimestampMixin):
    __tablename__ = "document_tag_links"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    tag_id = Column(Integer, ForeignKey("document_tags.id"), nullable=False)


class DocumentVersion(Base, TimestampMixin):
    __tablename__ = "document_versions"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    version_no = Column(Integer, nullable=False, default=1)
    version_number = Column(Integer, nullable=False, default=1)  # Alias for version_no
    file_path = Column(Text, nullable=True)
    file_content = Column(LargeBinary, nullable=True)
    size = Column(Integer, default=0)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)


class DocumentComment(Base, TimestampMixin):
    __tablename__ = "document_comments"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    partner_id = Column(Integer, ForeignKey("partners.id"), nullable=True)
    body = Column(Text, nullable=False)


class Property(Base, TimestampMixin):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    code = Column(String(64), unique=True, nullable=True, index=True)
    property_type = Column(String(32), default="residential")  # residential|commercial|industrial|other
    state = Column(String(32), default="draft")  # draft|confirmed|closed
    active = Column(Integer, default=1)
    
    # Location
    address = Column(Text, nullable=True)
    city = Column(String(128), nullable=True)
    state_id = Column(Integer, ForeignKey("states.id"), nullable=True)
    zip_code = Column(String(16), nullable=True)
    country_id = Column(Integer, ForeignKey("countries.id"), nullable=True)
    
    # Media
    image = Column(LargeBinary, nullable=True)
    video_url = Column(String(512), nullable=True)
    
    # Ownership
    is_company_owned = Column(Integer, default=1)
    owner_id = Column(Integer, ForeignKey("partners.id"), nullable=True)
    
    # Publishing
    published = Column(Integer, default=1)
    website_published = Column(Integer, default=0)
    
    # Development
    development_start_date = Column(Date, nullable=True)
    development_end_date = Column(Date, nullable=True)
    development_progress = Column(Float, default=0.0)
    
    # Description
    description = Column(Text, nullable=True)
    
    # Document folder
    document_folder_id = Column(Integer, ForeignKey("document_folders.id"), nullable=True)

    blocks = relationship("Block", back_populates="property", cascade="all, delete-orphan")
    suites = relationship("Suite", back_populates="property")
    owner = relationship("Partner", back_populates="properties")
    images = relationship("PropertyImage", back_populates="property", cascade="all, delete-orphan")
    plans = relationship("PropertyPlan", back_populates="property", cascade="all, delete-orphan")
    progress_updates = relationship("ProgressUpdate", back_populates="property", cascade="all, delete-orphan")
    subscribers = relationship("PropertySubscriber", back_populates="property", cascade="all, delete-orphan")


class Block(Base, TimestampMixin):
    __tablename__ = "blocks"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    name = Column(String(255), nullable=False)
    sequence = Column(Integer, default=10)

    property = relationship("Property", back_populates="blocks")
    floors = relationship("Floor", back_populates="block", cascade="all, delete-orphan")
    suites = relationship("Suite", back_populates="block")


class Floor(Base, TimestampMixin):
    __tablename__ = "floors"

    id = Column(Integer, primary_key=True, index=True)
    block_id = Column(Integer, ForeignKey("blocks.id"), nullable=False)
    name = Column(String(255), nullable=False)
    level_index = Column(Integer, default=0)
    sequence = Column(Integer, default=10)

    block = relationship("Block", back_populates="floors")
    suites = relationship("Suite", back_populates="floor")


class Suite(Base, TimestampMixin):
    __tablename__ = "suites"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    block_id = Column(Integer, ForeignKey("blocks.id"), nullable=True)
    floor_id = Column(Integer, ForeignKey("floors.id"), nullable=True)

    name = Column(String(255), nullable=False)
    number = Column(String(64), nullable=True, index=True)
    suite_type = Column(String(32), nullable=True)  # studio|apartment|apartment_2br|apartment_3br|penthouse|office|shop|warehouse|other
    suite_size = Column(Float, default=0.0)  # in sqm
    
    # Availability
    is_available = Column(Integer, default=1)
    is_storable = Column(Integer, default=1)
    published = Column(Integer, default=1)
    website_published = Column(Integer, default=1)
    
    # Pricing
    currency = Column(String(8), default="NGN")
    list_price = Column(Float, default=0.0)
    area_sqm = Column(Float, default=0.0)
    
    # Document folder
    document_folder_id = Column(Integer, ForeignKey("document_folders.id"), nullable=True)

    property = relationship("Property", back_populates="suites")
    block = relationship("Block", back_populates="suites")
    floor = relationship("Floor", back_populates="suites")
    offers = relationship("Offer", back_populates="suite")
    images = relationship("PropertyImage", back_populates="suite")
    plans = relationship("PropertyPlan", back_populates="suite")


class PaymentTerm(Base, TimestampMixin):
    __tablename__ = "payment_terms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    active = Column(Integer, default=1)
    
    # Term lines
    term_lines = relationship("PaymentTermLine", back_populates="payment_term", cascade="all, delete-orphan")


class PaymentTermLine(Base, TimestampMixin):
    __tablename__ = "payment_term_lines"

    id = Column(Integer, primary_key=True, index=True)
    payment_term_id = Column(Integer, ForeignKey("payment_terms.id"), nullable=False)
    value = Column(Float, nullable=False)  # percentage or fixed amount
    value_amount = Column(Float, default=0.0)
    days = Column(Integer, default=0)
    day_of_month = Column(Integer, default=0)
    end_of_month = Column(Integer, default=0)
    
    payment_term = relationship("PaymentTerm", back_populates="term_lines")


class PaymentSchedule(Base, TimestampMixin):
    __tablename__ = "payment_schedules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=True)
    offer_id = Column(Integer, ForeignKey("offers.id"), nullable=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=True)
    payment_term_id = Column(Integer, ForeignKey("payment_terms.id"), nullable=True)
    
    description = Column(String(255), nullable=True)
    due_date = Column(Date, nullable=False, index=True)
    amount = Column(Float, nullable=False, default=0.0)
    paid_amount = Column(Float, nullable=False, default=0.0)
    outstanding_amount = Column(Float, nullable=False, default=0.0)
    percentage = Column(Float, default=0.0)  # 0-1 ratio
    
    status = Column(String(16), default="pending")  # pending|partial|paid|overdue
    reminder_sent = Column(Integer, default=0)
    reminder_date = Column(Date, nullable=True)
    next_reminder_date = Column(Date, nullable=True)
    
    payment_ack_id = Column(Integer, ForeignKey("payment_acknowledgements.id"), nullable=True)
    
    offer = relationship("Offer", back_populates="payment_schedules")


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(32), nullable=False, default="staff")  # staff | portal
    partner_id = Column(Integer, ForeignKey("partners.id"), nullable=True)


class CmsSite(Base, TimestampMixin):
    __tablename__ = "cms_sites"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    domain = Column(String(255), nullable=True)
    status = Column(String(32), default="dev")


class CmsPage(Base, TimestampMixin):
    __tablename__ = "cms_pages"

    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(Integer, ForeignKey("cms_sites.id"), nullable=False)
    path = Column(String(255), nullable=False)
    title = Column(String(255), nullable=True)
    status = Column(String(32), default="draft")  # draft|preview|published|scheduled
    content = Column(Text, nullable=True)


class CmsPageVersion(Base, TimestampMixin):
    __tablename__ = "cms_page_versions"

    id = Column(Integer, primary_key=True, index=True)
    page_id = Column(Integer, ForeignKey("cms_pages.id"), nullable=False)
    version_no = Column(Integer, nullable=False, default=1)
    content = Column(Text, nullable=True)


class CmsThemeToken(Base, TimestampMixin):
    __tablename__ = "cms_theme_tokens"

    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(Integer, ForeignKey("cms_sites.id"), nullable=False)
    key = Column(String(128), nullable=False)
    value = Column(Text, nullable=True)


class CmsPublishJob(Base, TimestampMixin):
    __tablename__ = "cms_publish_jobs"

    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(Integer, ForeignKey("cms_sites.id"), nullable=False)
    page_id = Column(Integer, ForeignKey("cms_pages.id"), nullable=True)
    action = Column(String(32), nullable=False, default="publish")  # publish|unpublish
    scheduled_for = Column(DateTime, nullable=True)
    status = Column(String(32), default="pending")  # pending|running|success|failed
    message = Column(Text, nullable=True)


# ========== Additional Models from Odoo ==========

class Country(Base, TimestampMixin):
    __tablename__ = "countries"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    code = Column(String(4), unique=True, nullable=False)
    
    states = relationship("State", back_populates="country")


class State(Base, TimestampMixin):
    __tablename__ = "states"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    code = Column(String(16), nullable=True)
    country_id = Column(Integer, ForeignKey("countries.id"), nullable=False)
    
    country = relationship("Country", back_populates="states")


class PropertyImage(Base, TimestampMixin):
    __tablename__ = "property_images"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    sequence = Column(Integer, default=10)
    
    image = Column(LargeBinary, nullable=False)
    image_medium = Column(LargeBinary, nullable=True)
    image_small = Column(LargeBinary, nullable=True)
    
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=True)
    block_id = Column(Integer, ForeignKey("blocks.id", ondelete="CASCADE"), nullable=True)
    floor_id = Column(Integer, ForeignKey("floors.id", ondelete="CASCADE"), nullable=True)
    suite_id = Column(Integer, ForeignKey("suites.id", ondelete="CASCADE"), nullable=True)
    
    property = relationship("Property", back_populates="images")
    suite = relationship("Suite", back_populates="images")


class PropertyPlan(Base, TimestampMixin):
    __tablename__ = "property_plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    sequence = Column(Integer, default=10)
    
    plan_type = Column(String(32), default="floor_plan")  # floor_plan|master_plan|location_plan|site_plan|svg|other
    plan_file = Column(LargeBinary, nullable=False)
    file_name = Column(String(255), nullable=True)
    plan_url = Column(String(512), nullable=True)
    
    # SVG content for interactive plans
    svg_content = Column(Text, nullable=True)
    is_interactive = Column(Integer, default=0)
    
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=True)
    block_id = Column(Integer, ForeignKey("blocks.id", ondelete="CASCADE"), nullable=True)
    floor_id = Column(Integer, ForeignKey("floors.id", ondelete="CASCADE"), nullable=True)
    suite_id = Column(Integer, ForeignKey("suites.id", ondelete="CASCADE"), nullable=True)
    
    property = relationship("Property", back_populates="plans")
    suite = relationship("Suite", back_populates="plans")


class ProgressUpdate(Base, TimestampMixin):
    __tablename__ = "progress_updates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    date = Column(Date, nullable=False, default=date.today)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    block_id = Column(Integer, ForeignKey("blocks.id", ondelete="CASCADE"), nullable=True)
    
    update_type = Column(String(32), default="construction")  # construction|milestone|announcement|document|image|video|other
    description = Column(Text, nullable=True)
    completion_percentage = Column(Float, default=0.0)  # 0-100
    
    # Media
    document_file = Column(LargeBinary, nullable=True)
    document_filename = Column(String(255), nullable=True)
    video_url = Column(String(512), nullable=True)
    
    # Blog integration
    is_blog_post = Column(Integer, default=0)
    notify_subscribers = Column(Integer, default=1)
    
    property = relationship("Property", back_populates="progress_updates")


class PropertySubscriber(Base, TimestampMixin):
    __tablename__ = "property_subscribers"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    partner_id = Column(Integer, ForeignKey("partners.id"), nullable=False)
    
    property = relationship("Property", back_populates="subscribers")


class PaymentAcknowledgement(Base, TimestampMixin):
    __tablename__ = "payment_acknowledgements"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=True)
    offer_id = Column(Integer, ForeignKey("offers.id"), nullable=True)
    partner_id = Column(Integer, ForeignKey("partners.id"), nullable=True)
    payment_id = Column(Integer, ForeignKey("payments.id"), nullable=True)
    
    amount = Column(Float, nullable=False, default=0.0)
    payment_date = Column(Date, nullable=False, default=date.today)
    currency = Column(String(8), default="NGN")
    
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    
    offer = relationship("Offer", back_populates="payment_acks")
    payment = relationship("Payment")


class DocumentTemplate(Base, TimestampMixin):
    __tablename__ = "document_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    document_type = Column(String(32), nullable=False)  # offer|payment_ack|allocation|other
    active = Column(Integer, default=1)
    
    html_content = Column(Text, nullable=False)
    css_style = Column(Text, nullable=True)
    requires_signature = Column(Integer, default=1)






class AuditLog(Base, TimestampMixin):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    partner_id = Column(Integer, ForeignKey("partners.id"), nullable=True)
    model_name = Column(String(64), nullable=False)
    record_id = Column(Integer, nullable=False)
    action = Column(String(32), nullable=False)  # create|read|update|delete
    old_values = Column(Text, nullable=True)
    new_values = Column(Text, nullable=True)
    ip_address = Column(String(64), nullable=True)
    user_agent = Column(Text, nullable=True)
