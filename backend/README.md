# Real Estate Backend (Standalone)

Standalone backend service for Hommes Estates real estate features originally implemented in Odoo. Provides REST APIs for partners, offers, invoices, payments, and document storage (including Payment Acknowledgement PDFs).

## Quickstart

1. Create and activate a virtual environment (Windows PowerShell):
   - `py -3 -m venv .venv`
   - `.venv\\Scripts\\Activate.ps1`
2. Install dependencies:
   - `pip install -r requirements.txt`
3. Configure (optional): copy `.env.example` to `.env` and adjust values
4. Run the API:
   - `uvicorn app.main:app --reload`
5. Open docs: http://localhost:8000/docs

## Default configuration
- DB: SQLite file `dev.db` in project root
- DMS storage: `storage/` subfolder
- CORS: http://localhost:3000 and http://127.0.0.1:3000

## Endpoints (initial set)
- `GET /health` — health check
- `POST /payments` — create payment
- `GET /payments/{id}` — get payment
- `POST /payments/{id}/ack` — generate Payment Acknowledgement PDF and attach as a Document
- `GET /documents/{id}/download` — download stored document

## Next.js integration
- Point your frontend requests to `http://localhost:8000`
- Example: `POST /payments/{id}/ack` to generate and retrieve an attachment URL

## Notes
- This is an initial scaffold. Further phases will add: full domain models (blocks/floors/suites, offers, invoices, schedules), business rules, dashboards, and data migration tools.
