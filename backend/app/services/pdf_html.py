from datetime import date
from jinja2 import Environment, BaseLoader, select_autoescape
import os
from ..config import settings
from playwright.sync_api import sync_playwright


BASE_CSS_TEMPLATE = """
  <style>
    @page { size: A4; margin: 20mm; }
    body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #111827; }
    h1 { font-size: 20px; text-align: center; margin: 0 0 16px; }
    .muted { color: #6b7280; }
    .row { margin: 6px 0; }
    .label { font-weight: 600; width: 140px; display: inline-block; }
    .section { margin: 14px 0; }
    .signatures { display: flex; justify-content: space-between; margin-top: 36px; }
    .sig { width: 45%; height: 120px; border-top: 1px solid #e5e7eb; position: relative; }
    .sig img { position: absolute; bottom: 24px; max-height: 80px; max-width: 100%; object-fit: contain; }
    .sig .caption { position: absolute; bottom: -18px; font-size: 12px; color: #6b7280; }
    .footer { position: fixed; bottom: 10mm; left: 0; right: 0; text-align: center; font-size: 11px; color: #6b7280; }
    .brand-primary { color: %(primary_color)s; }
    .letterhead { display:flex; align-items:center; justify-content:space-between; margin-bottom: 12px; }
    .letterhead .logo { height: 40px; }
    .letterhead .addr { text-align:right; font-size: 11px; color:#4b5563; max-width: 55%; }
    .watermark { position: fixed; top: 40%; left: 10%; right: 10%; text-align:center; opacity: 0.07; font-size: 64px; transform: rotate(-20deg); pointer-events:none; }
  </style>
"""


def _render_pdf(html: str) -> bytes:
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        # Ensure background prints for branding
        page.set_content(html, wait_until="networkidle")
        pdf_bytes = page.pdf(format="A4", print_background=True)
        browser.close()
        return pdf_bytes


def _brand_image_data_url() -> str | None:
    path = settings.brand_logo_path
    if not path:
        return None
    try:
        abspath = os.path.abspath(path)
        with open(abspath, "rb") as f:
            import base64
            b64 = base64.b64encode(f.read()).decode("ascii")
            # try to guess type
            ext = os.path.splitext(abspath)[1].lower()
            mime = "image/png" if ext in (".png", ".apng") else "image/jpeg"
            return f"data:{mime};base64,{b64}"
    except Exception:
        return None


def _base_context():
    return {
        "brand_logo_src": _brand_image_data_url(),
        "brand_address": settings.brand_address,
        "brand_watermark": settings.brand_watermark_text,
        "primary_color": settings.brand_primary_color or "#111827",
    }


def build_payment_ack_pdf(
    payment_id: int,
    amount: float,
    currency: str,
    pay_date: date,
    partner_name: str,
    company_name: str,
    suite_name: str | None = None,
    suite_number: str | None = None,
    schedule_summary: str | None = None,
    have_customer_signature: bool = False,
    have_company_signature: bool = False,
    customer_signature: bytes | None = None,
    company_signature: bytes | None = None,
) -> bytes:
    ctx = _base_context()
    # Convert signatures to data URLs if present
    def _img_src(b: bytes | None):
        if not b:
            return None
        import base64
        return f"data:image/png;base64,{base64.b64encode(b).decode('ascii')}"

    base_css = BASE_CSS_TEMPLATE % {"primary_color": ctx["primary_color"]}
    tmpl = Environment(
        loader=BaseLoader(),
        autoescape=select_autoescape()
    ).from_string(
        base_css
        + """
        {% if brand_watermark %}<div class="watermark">{{ brand_watermark }}</div>{% endif %}
        <div class="letterhead">
          <div>
            {% if brand_logo_src %}<img class="logo" src="{{ brand_logo_src }}" />{% endif %}
          </div>
          <div class="addr">{{ brand_address or '' }}</div>
        </div>
        <h1>Payment Acknowledgement</h1>
        <div class="row muted">{{ company_name }}</div>

        <div class="section">
          <div class="row"><span class="label">Payment ID:</span> {{ payment_id }}</div>
          <div class="row"><span class="label">Date:</span> {{ pay_date }}</div>
          <div class="row"><span class="label">Customer:</span> {{ partner_name }}</div>
          <div class="row"><span class="label">Amount:</span> {{ amount | round(2) }} {{ currency }}</div>
          {% if suite_name %}
          <div class="row"><span class="label">Suite:</span> {{ suite_name }}{% if suite_number %} ({{ suite_number }}){% endif %}</div>
          {% endif %}
          {% if schedule_summary %}
          <div class="row"><span class="label">Summary:</span> {{ schedule_summary }}</div>
          {% endif %}
        </div>

        <div class="section muted">
          We acknowledge receipt of the payment stated above. This document confirms funds received for the specified transaction.
        </div>

        <div class="signatures">
          <div class="sig">
            {% if customer_signature_src %}
              <img src="{{ customer_signature_src }}" alt="Customer Signature" />
            {% elif have_customer_signature %}
              <div class="muted" style="position:absolute; bottom: 40px;">Customer signature on file</div>
            {% endif %}
            <div class="caption">Customer Signature</div>
          </div>
          <div class="sig">
            {% if company_signature_src %}
              <img src="{{ company_signature_src }}" alt="Company Signature" />
            {% elif have_company_signature %}
              <div class="muted" style="position:absolute; bottom: 40px;">Company signature on file</div>
            {% endif %}
            <div class="caption">Company Signature</div>
          </div>
        </div>

        <div class="footer">Generated by Real Estate Backend</div>
        """
    )

    html = tmpl.render(
        **ctx,
        payment_id=payment_id,
        amount=amount,
        currency=currency,
        pay_date=pay_date.strftime("%Y-%m-%d"),
        partner_name=partner_name,
        company_name=company_name,
        suite_name=suite_name,
        suite_number=suite_number,
        schedule_summary=schedule_summary,
        have_customer_signature=have_customer_signature,
        have_company_signature=have_company_signature,
        customer_signature_src=_img_src(customer_signature),
        company_signature_src=_img_src(company_signature),
    )
    return _render_pdf(html)


def build_offer_letter_pdf(
    offer_id: int,
    partner_name: str,
    suite_name: str,
    suite_number: str | None,
    price_total: float,
    validity_date: date | None,
    company_name: str,
    customer_signature: bytes | None = None,
    company_signature: bytes | None = None,
) -> bytes:
    ctx = _base_context()
    def _img_src(b: bytes | None):
        if not b:
            return None
        import base64
        return f"data:image/png;base64,{base64.b64encode(b).decode('ascii')}"

    base_css = BASE_CSS_TEMPLATE % {"primary_color": ctx["primary_color"]}
    tmpl = Environment(loader=BaseLoader(), autoescape=select_autoescape()).from_string(
        base_css
        + """
        {% if brand_watermark %}<div class="watermark">{{ brand_watermark }}</div>{% endif %}
        <div class="letterhead">
          <div>{% if brand_logo_src %}<img class="logo" src="{{ brand_logo_src }}" />{% endif %}</div>
          <div class="addr">{{ brand_address or '' }}</div>
        </div>
        <h1>Offer Letter</h1>
        <div class="row muted">{{ company_name }}</div>
        <div class="section">
          <div class="row"><span class="label">Offer ID:</span> {{ offer_id }}</div>
          <div class="row"><span class="label">Customer:</span> {{ partner_name }}</div>
          <div class="row"><span class="label">Suite:</span> {{ suite_name }}{% if suite_number %} ({{ suite_number }}){% endif %}</div>
          <div class="row"><span class="label">Price:</span> {{ price_total | round(2) }}</div>
          {% if validity_date %}
          <div class="row"><span class="label">Valid Until:</span> {{ validity_date }}</div>
          {% endif %}
        </div>
        <div class="signatures">
          <div class="sig">
            {% if customer_signature_src %}<img src="{{ customer_signature_src }}" />{% endif %}
            <div class="caption">Customer Signature</div>
          </div>
          <div class="sig">
            {% if company_signature_src %}<img src="{{ company_signature_src }}" />{% endif %}
            <div class="caption">Company Signature</div>
          </div>
        </div>
        <div class="footer">Generated by Real Estate Backend</div>
        """
    )
    html = tmpl.render(
        **ctx,
        offer_id=offer_id,
        partner_name=partner_name,
        suite_name=suite_name,
        suite_number=suite_number,
        price_total=price_total,
        validity_date=(validity_date.strftime('%Y-%m-%d') if validity_date else None),
        company_name=company_name,
        customer_signature_src=_img_src(customer_signature),
        company_signature_src=_img_src(company_signature),
    )
    return _render_pdf(html)


def build_payment_summary_letter_pdf(
    offer_id: int,
    partner_name: str,
    suite_name: str,
    suite_number: str | None,
    price_total: float,
    total_paid: float,
    balance: float,
    company_name: str,
    schedule_rows: list[dict] | None = None,
    customer_signature: bytes | None = None,
    company_signature: bytes | None = None,
) -> bytes:
    ctx = _base_context()
    def _img_src(b: bytes | None):
        if not b:
            return None
        import base64
        return f"data:image/png;base64,{base64.b64encode(b).decode('ascii')}"

    base_css = BASE_CSS_TEMPLATE % {"primary_color": ctx["primary_color"]}
    tmpl = Environment(loader=BaseLoader(), autoescape=select_autoescape()).from_string(
        base_css
        + """
        {% if brand_watermark %}<div class="watermark">{{ brand_watermark }}</div>{% endif %}
        <div class="letterhead">
          <div>{% if brand_logo_src %}<img class="logo" src="{{ brand_logo_src }}" />{% endif %}</div>
          <div class="addr">{{ brand_address or '' }}</div>
        </div>
        <h1>Payment Summary Letter</h1>
        <div class="row muted">{{ company_name }}</div>
        <div class="section">
          <div class="row"><span class="label">Offer ID:</span> {{ offer_id }}</div>
          <div class="row"><span class="label">Customer:</span> {{ partner_name }}</div>
          <div class="row"><span class="label">Suite:</span> {{ suite_name }}{% if suite_number %} ({{ suite_number }}){% endif %}</div>
          <div class="row"><span class="label">Total Price:</span> {{ price_total | round(2) }}</div>
          <div class="row"><span class="label">Total Paid:</span> {{ total_paid | round(2) }}</div>
          <div class="row"><span class="label">Balance:</span> {{ balance | round(2) }}</div>
        </div>
        {% if schedule_rows and schedule_rows|length %}
        <div class="section">
          <div class="row" style="font-weight:600; margin-bottom:8px;">Schedule Breakdown</div>
          <table style="width:100%; border-collapse:collapse; font-size:12px;">
            <thead>
              <tr>
                <th style="text-align:left; border-bottom:1px solid #e5e7eb; padding:6px;">Due Date</th>
                <th style="text-align:right; border-bottom:1px solid #e5e7eb; padding:6px;">Amount</th>
                <th style="text-align:right; border-bottom:1px solid #e5e7eb; padding:6px;">Paid</th>
                <th style="text-align:right; border-bottom:1px solid #e5e7eb; padding:6px;">Outstanding</th>
                <th style="text-align:left; border-bottom:1px solid #e5e7eb; padding:6px;">Status</th>
              </tr>
            </thead>
            <tbody>
              {% for r in schedule_rows[:50] %}
              <tr>
                <td style="padding:6px;">{{ r.due_date }}</td>
                <td style="padding:6px; text-align:right;">{{ r.amount | round(2) }}</td>
                <td style="padding:6px; text-align:right;">{{ r.paid_amount | round(2) }}</td>
                <td style="padding:6px; text-align:right;">{{ r.outstanding_amount | round(2) }}</td>
                <td style="padding:6px;">{{ r.status }}</td>
              </tr>
              {% endfor %}
            </tbody>
          </table>
        </div>
        {% endif %}
        <div class="signatures">
          <div class="sig">
            {% if customer_signature_src %}<img src="{{ customer_signature_src }}" />{% endif %}
            <div class="caption">Customer Signature</div>
          </div>
          <div class="sig">
            {% if company_signature_src %}<img src="{{ company_signature_src }}" />{% endif %}
            <div class="caption">Company Signature</div>
          </div>
        </div>
        <div class="footer">Generated by Real Estate Backend</div>
        """
    )
    html = tmpl.render(
        **ctx,
        offer_id=offer_id,
        partner_name=partner_name,
        suite_name=suite_name,
        suite_number=suite_number,
        price_total=price_total,
        total_paid=total_paid,
        balance=balance,
        company_name=company_name,
        schedule_rows=schedule_rows or [],
        customer_signature_src=_img_src(customer_signature),
        company_signature_src=_img_src(company_signature),
    )
    return _render_pdf(html)


def build_allocation_letter_pdf(
    offer_id: int,
    partner_name: str,
    suite_name: str,
    suite_number: str | None,
    allocation_date: date,
    company_name: str,
    customer_signature: bytes | None = None,
    company_signature: bytes | None = None,
) -> bytes:
    ctx = _base_context()
    def _img_src(b: bytes | None):
        if not b:
            return None
        import base64
        return f"data:image/png;base64,{base64.b64encode(b).decode('ascii')}"

    base_css = BASE_CSS_TEMPLATE % {"primary_color": ctx["primary_color"]}
    tmpl = Environment(loader=BaseLoader(), autoescape=select_autoescape()).from_string(
        base_css
        + """
        {% if brand_watermark %}<div class="watermark">{{ brand_watermark }}</div>{% endif %}
        <div class="letterhead">
          <div>{% if brand_logo_src %}<img class="logo" src="{{ brand_logo_src }}" />{% endif %}</div>
          <div class="addr">{{ brand_address or '' }}</div>
        </div>
        <h1>Final Letter of Allocation</h1>
        <div class="row muted">{{ company_name }}</div>
        <div class="section">
          <div class="row"><span class="label">Offer ID:</span> {{ offer_id }}</div>
          <div class="row"><span class="label">Customer:</span> {{ partner_name }}</div>
          <div class="row"><span class="label">Suite:</span> {{ suite_name }}{% if suite_number %} ({{ suite_number }}){% endif %}</div>
          <div class="row"><span class="label">Allocation Date:</span> {{ allocation_date }}</div>
        </div>
        <div class="signatures">
          <div class="sig">
            {% if customer_signature_src %}<img src="{{ customer_signature_src }}" />{% endif %}
            <div class="caption">Customer Signature</div>
          </div>
          <div class="sig">
            {% if company_signature_src %}<img src="{{ company_signature_src }}" />{% endif %}
            <div class="caption">Company Signature</div>
          </div>
        </div>
        <div class="footer">Generated by Real Estate Backend</div>
        """
    )
    html = tmpl.render(
        **ctx,
        offer_id=offer_id,
        partner_name=partner_name,
        suite_name=suite_name,
        suite_number=suite_number,
        allocation_date=allocation_date.strftime('%Y-%m-%d'),
        company_name=company_name,
        customer_signature_src=_img_src(customer_signature),
        company_signature_src=_img_src(company_signature),
    )
    return _render_pdf(html)


def build_invoice_pdf(
    invoice_id: int,
    partner_name: str,
    currency: str,
    amount_total: float,
    residual: float | None,
    company_name: str,
    schedule_rows: list[dict] | None = None,
    payments: list[dict] | None = None,
) -> bytes:
    ctx = _base_context()
    base_css = BASE_CSS_TEMPLATE % {"primary_color": ctx["primary_color"]}
    tmpl = Environment(loader=BaseLoader(), autoescape=select_autoescape()).from_string(
        base_css
        + """
        {% if brand_watermark %}<div class="watermark">{{ brand_watermark }}</div>{% endif %}
        <div class="letterhead">
          <div>{% if brand_logo_src %}<img class="logo" src="{{ brand_logo_src }}" />{% endif %}</div>
          <div class="addr">{{ brand_address or '' }}</div>
        </div>
        <h1>Invoice</h1>
        <div class="row"><span class="label">Invoice ID:</span> {{ invoice_id }}</div>
        <div class="row"><span class="label">Customer:</span> {{ partner_name }}</div>
        <div class="row"><span class="label">Amount Total:</span> {{ amount_total | round(2) }} {{ currency }}</div>
        <div class="row"><span class="label">Residual:</span> {{ (residual or 0) | round(2) }} {{ currency }}</div>
        {% if schedule_rows and schedule_rows|length %}
        <div class="section">
          <div class="row" style="font-weight:600; margin-bottom:8px;">Payment Schedule</div>
          <table style="width:100%; border-collapse:collapse; font-size:12px;">
            <thead>
              <tr>
                <th style="text-align:left; border-bottom:1px solid #e5e7eb; padding:6px;">Due Date</th>
                <th style="text-align:right; border-bottom:1px solid #e5e7eb; padding:6px;">Amount</th>
                <th style="text-align:right; border-bottom:1px solid #e5e7eb; padding:6px;">Paid</th>
                <th style="text-align:right; border-bottom:1px solid #e5e7eb; padding:6px;">Outstanding</th>
                <th style="text-align:left; border-bottom:1px solid #e5e7eb; padding:6px;">Status</th>
              </tr>
            </thead>
            <tbody>
              {% for r in schedule_rows[:80] %}
              <tr>
                <td style="padding:6px;">{{ r.due_date }}</td>
                <td style="padding:6px; text-align:right;">{{ r.amount | round(2) }}</td>
                <td style="padding:6px; text-align:right;">{{ r.paid_amount | round(2) }}</td>
                <td style="padding:6px; text-align:right;">{{ r.outstanding_amount | round(2) }}</td>
                <td style="padding:6px;">{{ r.status }}</td>
              </tr>
              {% endfor %}
            </tbody>
          </table>
        </div>
        {% endif %}
        {% if payments and payments|length %}
        <div class="section">
          <div class="row" style="font-weight:600; margin-bottom:8px;">Payments</div>
          <table style="width:100%; border-collapse:collapse; font-size:12px;">
            <thead>
              <tr>
                <th style="text-align:left; border-bottom:1px solid #e5e7eb; padding:6px;">Date</th>
                <th style="text-align:right; border-bottom:1px solid #e5e7eb; padding:6px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              {% for p in payments[:80] %}
              <tr>
                <td style="padding:6px;">{{ p.date }}</td>
                <td style="padding:6px; text-align:right;">{{ p.amount | round(2) }}</td>
              </tr>
              {% endfor %}
            </tbody>
          </table>
        </div>
        {% endif %}
        <div class="footer">Generated by Real Estate Backend</div>
        """
    )
    html = tmpl.render(
        **ctx,
        invoice_id=invoice_id,
        partner_name=partner_name,
        currency=currency,
        amount_total=amount_total,
        residual=residual or 0.0,
        schedule_rows=schedule_rows or [],
        payments=payments or [],
    )
    return _render_pdf(html)
