# Odoo Real Estate Integration - Environment Configuration

## Overview

This document describes the environment variables required to integrate HommesEstates with an Odoo real estate module instance. When these variables are configured, the system will automatically fetch data from Odoo instead of the local FastAPI backend.

## Quick Start

### Minimum Required Configuration

```bash
# Backend (.env)
ODOO_ENABLED=true
ODOO_URL=https://your-odoo-instance.com
ODOO_DATABASE=your_database_name
ODOO_API_KEY=your_api_key

# Frontend (.env.local)
NEXT_PUBLIC_BACKEND_MODE=odoo
NEXT_PUBLIC_ODOO_URL=https://your-odoo-instance.com/odoo
NEXT_PUBLIC_ODOO_DB=your_database_name
```

## Complete Environment Variables

### Backend Environment Variables

#### Core Connection Settings (Required)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `ODOO_ENABLED` | Enable Odoo integration | `true` | Yes |
| `ODOO_URL` | Odoo instance base URL | `https://odoo.hommesestates.com` | Yes |
| `ODOO_DATABASE` | Odoo database name | `hommesestates_prod` | Yes |
| `ODOO_API_KEY` | API key for authentication | `your_api_key_here` | Alternative* |
| `ODOO_USERNAME` | Odoo username (if not using API key) | `admin@hommesestates.com` | Alternative* |
| `ODOO_PASSWORD` | Odoo password (if not using API key) | `your_password` | Alternative* |

*Either API_KEY or USERNAME/PASSWORD must be provided

#### Authentication Settings

```bash
# Option 1: API Key Authentication (Recommended for production)
ODOO_API_KEY=your_api_key_here

# Option 2: Username/Password Authentication
ODOO_USERNAME=admin@hommesestates.com
ODOO_PASSWORD=your_secure_password

# Option 3: Session-based (for development)
ODOO_SESSION_ID=your_session_id
```

#### Sync Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `ODOO_SYNC_INTERVAL` | Data sync interval in seconds | `300` (5 min) | No |
| `ODOO_SYNC_ON_STARTUP` | Sync data on startup | `true` | No |
| `ODOO_CACHE_TTL` | Cache TTL in seconds | `3600` (1 hour) | No |

#### Feature Toggles (Optional)

```bash
# Control which modules use Odoo vs FastAPI
ODOO_USE_PROPERTIES=true      # Use Odoo for properties
ODOO_USE_SUITES=true          # Use Odoo for suites
ODOO_USE_OFFERS=true          # Use Odoo for offers
ODOO_USE_INVOICES=true        # Use Odoo for invoices
ODOO_USE_PAYMENTS=true        # Use Odoo for payments
ODOO_USE_DOCUMENTS=true       # Use Odoo for documents
ODOO_USE_CUSTOMERS=true       # Use Odoo for customer management
```

#### Model Mappings (Optional)

Customize if your Odoo uses different model names:

```bash
ODOO_MODEL_PROPERTY=real_estate.property
ODOO_MODEL_SUITE=product.template
ODOO_MODEL_BLOCK=real_estate.block
ODOO_MODEL_FLOOR=real_estate.floor
ODOO_MODEL_OFFER=sale.order
ODOO_MODEL_INVOICE=account.move
ODOO_MODEL_PAYMENT=real_estate.payment
ODOO_MODEL_DOCUMENT=real_estate.document
ODOO_MODEL_PARTNER=res.partner
ODOO_MODEL_COMPANY=res.company
ODOO_MODEL_CRM_LEAD=crm.lead
```

#### API Configuration (Optional)

```bash
ODOO_TIMEOUT=30              # Request timeout in seconds
ODOO_MAX_RETRIES=3           # Max retry attempts
ODOO_RETRY_DELAY=1.0         # Delay between retries in seconds
```

#### Webhook Configuration (Optional)

```bash
ODOO_WEBHOOK_SECRET=your_webhook_secret
ODOO_WEBHOOK_PATH=/webhooks/odoo
```

#### VPS Configuration (Optional - for self-hosted Odoo)

```bash
ODOO_VPS_HOST=vps.hommesestates.com
ODOO_VPS_SSH_KEY_PATH=/path/to/ssh/key
ODOO_VPS_DB_PORT=5432
ODOO_VPS_ODOO_PORT=8069
```

### Frontend Environment Variables

```bash
# Switch between FastAPI and Odoo
NEXT_PUBLIC_BACKEND_MODE=odoo        # Options: 'fastapi' | 'odoo'

# FastAPI URL (used when mode is 'fastapi')
NEXT_PUBLIC_FASTAPI_URL=http://localhost:8000

# Odoo Configuration (used when mode is 'odoo')
NEXT_PUBLIC_ODOO_URL=https://your-odoo-instance.com/odoo
NEXT_PUBLIC_ODOO_DB=your_database_name
```

## Odoo Real Estate Module Models

The integration targets the following Odoo real estate models:

### Core Models

| Odoo Model | Description | FastAPI Equivalent |
|------------|-------------|-------------------|
| `real_estate.property` | Properties/Projects | `Property` |
| `product.template` (is_suite=True) | Suites/Units | `Suite` |
| `real_estate.block` | Property Blocks | `Block` |
| `real_estate.floor` | Building Floors | `Floor` |
| `sale.order` (is_offer=True) | Offers | `Offer` |
| `account.move` | Invoices | `Invoice` |
| `real_estate.payment` | Payments | `Payment` |
| `real_estate.document` | Documents | `Document` |
| `res.partner` | Customers/Partners | `Partner` |
| `crm.lead` | Leads/Inquiries | `Lead` |

### Model Relationships

```
real_estate.property
├── real_estate.block
│   └── real_estate.floor
│       └── product.template (is_suite=True)
│           └── sale.order (is_offer=True)
│               ├── account.move (invoices)
│               └── real_estate.payment
└── real_estate.document
```

## API Endpoints Mapping

### Odoo Public API Endpoints

| Endpoint | Description | FastAPI Equivalent |
|----------|-------------|-------------------|
| `POST /api/auth/token` | Authenticate user | `/auth/token` |
| `POST /api/auth/signup` | Register user | `/auth/signup` |
| `GET /api/properties` | List properties | `/properties` |
| `GET /api/properties/<id>` | Property detail | `/properties/{id}` |
| `GET /api/suites` | List suites | `/properties/{id}/suites` |
| `GET /api/suites/<id>` | Suite detail | - |
| `GET /api/offers` | List my offers | `/portal/offers` |
| `GET /api/offers/<id>` | Offer detail | `/portal/offers/{id}` |
| `POST /api/offers/create` | Create offer | - |
| `POST /api/offers/sign/<id>` | Sign offer | `/portal/offers/{id}/sign` |
| `GET /api/customers/<id>/invoices` | Customer invoices | `/portal/invoices` |
| `GET /api/customers/<id>/payments` | Customer payments | `/portal/payments` |
| `GET /api/customers/<id>/documents` | Customer documents | `/portal/documents` |

## Example Configurations

### Development (FastAPI Only)

```bash
# Backend .env
ODOO_ENABLED=false
DATABASE_URL=sqlite:///./dev.db

# Frontend .env.local
NEXT_PUBLIC_BACKEND_MODE=fastapi
NEXT_PUBLIC_FASTAPI_URL=http://localhost:8000
```

### Production (Odoo Integration)

```bash
# Backend .env
ODOO_ENABLED=true
ODOO_URL=https://odoo.hommesestates.com
ODOO_DATABASE=hommesestates_prod
ODOO_API_KEY=live_api_key_here
ODOO_SYNC_INTERVAL=300
ODOO_CACHE_TTL=3600

# Feature toggles
ODOO_USE_PROPERTIES=true
ODOO_USE_SUITES=true
ODOO_USE_OFFERS=true
ODOO_USE_INVOICES=true
ODOO_USE_PAYMENTS=true
ODOO_USE_DOCUMENTS=true

# Frontend .env.local
NEXT_PUBLIC_BACKEND_MODE=odoo
NEXT_PUBLIC_ODOO_URL=https://odoo.hommesestates.com/odoo
NEXT_PUBLIC_ODOO_DB=hommesestates_prod
```

### Hybrid Mode (Some Features in Odoo, Some in FastAPI)

```bash
# Backend .env
ODOO_ENABLED=true
ODOO_URL=https://odoo.hommesestates.com
ODOO_DATABASE=hommesestates_prod
ODOO_API_KEY=api_key_here

# Use Odoo for core real estate data
ODOO_USE_PROPERTIES=true
ODOO_USE_SUITES=true
ODOO_USE_OFFERS=true

# Use FastAPI for payments and documents
ODOO_USE_PAYMENTS=false
ODOO_USE_DOCUMENTS=false

# Frontend - still uses FastAPI backend which proxies to Odoo
NEXT_PUBLIC_BACKEND_MODE=fastapi
NEXT_PUBLIC_FASTAPI_URL=http://localhost:8000
```

## Security Considerations

1. **API Keys**: Store API keys securely, never commit to version control
2. **HTTPS**: Always use HTTPS in production
3. **CORS**: Configure Odoo CORS settings to allow your frontend domain
4. **Rate Limiting**: Enable rate limiting on both Odoo and FastAPI
5. **Session Management**: Use secure session cookies

## Troubleshooting

### Common Issues

1. **Connection refused**: Check Odoo URL and port
2. **Authentication failed**: Verify API key or credentials
3. **Database not found**: Check database name spelling
4. **CORS errors**: Configure allowed origins in Odoo
5. **Model not found**: Verify model names match your Odoo instance

### Debug Mode

Enable debug logging:

```bash
LOG_LEVEL=debug
ODOO_DEBUG=true
```

## VPS Deployment (Self-Hosted Odoo)

For Odoo hosted on a VPS:

1. Ensure firewall allows traffic on port 8069
2. Configure reverse proxy (nginx) with SSL
3. Set up PostgreSQL database access
4. Configure SSH key authentication if needed

```bash
# Example VPS configuration
ODOO_URL=https://odoo.yourdomain.com
ODOO_DATABASE=your_database
ODOO_API_KEY=your_api_key
ODOO_VPS_HOST=vps.yourdomain.com
ODOO_VPS_DB_PORT=5432
ODOO_VPS_ODOO_PORT=8069
```
