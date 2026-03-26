from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


# --- Payment Schemas ---
class PartnerCreate(BaseModel):
    name: str
    email: str | None = None


class PartnerRead(BaseModel):
    id: int
    name: str
    email: str | None = None

    class Config:
        from_attributes = True


# --- CMS Schemas ---
class CmsSiteCreate(BaseModel):
    name: str
    domain: str | None = None
    status: str | None = None


class CmsSiteRead(BaseModel):
    id: int
    name: str
    domain: str | None
    status: str

    class Config:
        from_attributes = True


class CmsPageCreate(BaseModel):
    path: str
    title: str | None = None
    status: str | None = None
    content: str | None = None


class CmsPageUpdate(BaseModel):
    path: str | None = None
    title: str | None = None
    status: str | None = None
    content: str | None = None


class CmsPageRead(BaseModel):
    id: int
    site_id: int
    path: str
    title: str | None
    status: str
    content: str | None

    class Config:
        from_attributes = True


class CmsPageVersionRead(BaseModel):
    id: int
    page_id: int
    version_no: int
    content: str | None

    class Config:
        from_attributes = True


class CmsThemeTokensUpsert(BaseModel):
    tokens: dict[str, str | None] | None = None


class CmsThemeTokensRead(BaseModel):
    tokens: dict[str, str | None]


class CmsPublishJobRead(BaseModel):
    id: int
    site_id: int
    page_id: int | None
    action: str
    scheduled_for: datetime | None
    status: str
    message: str | None

    class Config:
        from_attributes = True


# --- Block Schemas ---
class BlockCreate(BaseModel):
    property_id: int
    name: str
    sequence: int = 10


class BlockRead(BaseModel):
    id: int
    property_id: int
    name: str
    sequence: int

    class Config:
        from_attributes = True


# --- Floor Schemas ---
class FloorCreate(BaseModel):
    block_id: int
    name: str
    level_index: int = 0
    sequence: int = 10


class FloorRead(BaseModel):
    id: int
    block_id: int
    name: str
    level_index: int
    sequence: int

    class Config:
        from_attributes = True


# --- Numbering ---
class NumberingPreviewRequest(BaseModel):
    pattern: str = Field(description="simple | floor_based | alphanumeric")
    start: int = 1
    count: int = 1
    width: int = 3
    floor_multiplier: int = 100
    zero_based_ground: bool = False
    alpha_start: str = "A"
    floor_index: int | None = None


class NumberingPreviewResponse(BaseModel):
    numbers: list[str]


class SuitesGenerateRequest(NumberingPreviewRequest):
    name_template: str = "{suite_num}"
    currency: str = "NGN"
    list_price: float = 0.0
    area_sqm: float = 0.0
    block_id: int | None = None
    floor_id: int | None = None


# --- Invoice & Schedule Schemas ---
class InvoiceCreate(BaseModel):
    partner_id: int
    offer_id: int | None = None
    currency: str = "NGN"
    amount_total: float


class InvoiceRead(BaseModel):
    id: int
    partner_id: int
    offer_id: int | None
    currency: str
    amount_total: float
    residual: float

    class Config:
        from_attributes = True


class ScheduleCreate(BaseModel):
    due_date: date
    amount: float


class ScheduleRead(BaseModel):
    id: int
    invoice_id: int | None
    offer_id: int | None
    due_date: date
    amount: float
    paid_amount: float
    outstanding_amount: float
    status: str

    class Config:
        from_attributes = True


class InvoiceRecomputeResponse(BaseModel):
    invoice: InvoiceRead
    total_paid: float
    schedule_count: int


class PaymentSnapshotRead(BaseModel):
    payment_id: int
    date: date
    amount: float
    cumulative_amount: float
    remaining_amount: float


class PaymentCreate(BaseModel):
    partner_id: int
    amount: float
    currency: str = Field(default="NGN", max_length=8)
    payment_date: date = Field(default_factory=date.today, alias="date")
    state: str = Field(default="posted")
    company_id: int | None = None
    invoice_id: int | None = None
    model_config = ConfigDict(populate_by_name=True)


class PaymentRead(BaseModel):
    id: int
    partner_id: int
    amount: float
    currency: str
    date: date
    state: str

    class Config:
        from_attributes = True


# --- Document Schemas ---
class DocumentRead(BaseModel):
    id: int
    name: str
    content_type: str
    size: int
    download_url: str

    class Config:
        from_attributes = True


class PaymentAckResponse(BaseModel):
    document: DocumentRead


class DocumentResponse(BaseModel):
    document: DocumentRead


# --- Property / Suite Schemas ---
class PropertyCreate(BaseModel):
    name: str
    code: str | None = None
    property_type: str = "residential"
    address: str | None = None
    description: str | None = None


class PropertyRead(BaseModel):
    id: int
    name: str
    code: str | None = None
    property_type: str
    address: str | None = None
    description: str | None = None

    class Config:
        from_attributes = True


class SuiteCreate(BaseModel):
    property_id: int
    block_id: int | None = None
    floor_id: int | None = None
    name: str
    number: str | None = None
    currency: str = "NGN"
    list_price: float = 0.0
    area_sqm: float = 0.0


class SuiteRead(BaseModel):
    id: int
    property_id: int
    block_id: int | None
    floor_id: int | None
    name: str
    number: str | None
    is_available: int
    currency: str
    list_price: float
    area_sqm: float

    class Config:
        from_attributes = True


# --- Offer Schemas ---
class OfferCreate(BaseModel):
    partner_id: int
    suite_id: int
    price_total: float
    validity_date: date | None = None
    code: str | None = None


class OfferRead(BaseModel):
    id: int
    code: str | None
    partner_id: int
    suite_id: int | None
    suite_name: str | None
    suite_number: str | None
    state: str
    validity_date: date | None
    price_total: float

    class Config:
        from_attributes = True
