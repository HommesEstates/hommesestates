# Hommes Estates CMS Setup Guide

## 📋 Overview

This CMS provides a complete content management system for the Hommes Estates website, built with:
- **Next.js 15** (React)
- **Prisma** with PostgreSQL
- **Supabase** for auth & storage
- **TailwindCSS** + **Framer Motion**
- **Odoo REST API** integration

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/hommesestates_cms"
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
JWT_SECRET="generate-a-strong-secret-key-min-32-chars"
ODOO_API_URL="http://your-odoo-server:8069"
ODOO_API_KEY="your-odoo-api-key"
```

### 3. Set Up PostgreSQL Database

#### Option A: Local PostgreSQL
```bash
# Install PostgreSQL (if not already installed)
# Create database
createdb hommesestates_cms
```

#### Option B: Supabase PostgreSQL
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create new project
3. Copy connection string from Settings > Database
4. Update `DATABASE_URL` in `.env`

### 4. Run Prisma Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Open Prisma Studio (optional - to view database)
npx prisma studio
```

### 5. Seed Initial Admin User

```bash
npx ts-node prisma/seed.ts
```

**Default Admin Credentials:**
- Email: `admin@hommesestates.com`
- Password: `Admin@123456`

⚠️ **IMPORTANT:** Change these credentials immediately after first login!

### 6. Start Development Server

```bash
npm run dev
```

Access the CMS at: **http://localhost:3000/admin**

---

## 📁 Project Structure

```
hommesestates/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Seed data
├── src/
│   ├── app/
│   │   ├── admin/             # CMS routes
│   │   │   ├── login/         # Login page
│   │   │   ├── pages/         # Pages manager
│   │   │   ├── media/         # Media library
│   │   │   ├── properties/    # Properties from Odoo
│   │   │   ├── seo/           # SEO settings
│   │   │   └── ...
│   │   └── api/
│   │       └── admin/         # CMS API routes
│   ├── components/
│   │   └── admin/             # CMS components
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client
│   │   ├── auth.ts            # Auth utilities
│   │   └── ...
│   └── middleware.ts          # Route protection
└── package.json
```

---

## 🔐 User Roles & Permissions

### Admin
- Full access to all CMS features
- User management
- Settings & configuration

### Editor
- Manage pages, media, SEO
- Cannot access user management

### Property Manager
- Edit property content only
- View-only for other sections

### Viewer
- Read-only access
- Preview mode only

---

## 🧩 CMS Modules

### 1. Dashboard
- Overview stats (pages, media, properties, users)
- Recent activity
- Performance metrics

### 2. Pages Manager
- Create/edit/delete pages
- Modular section builder
- Drag-and-drop ordering
- WYSIWYG editor
- Draft/publish workflow

### 3. Media Library
- Upload images, videos, 3D files
- Automatic optimization
- Tagging & categorization
- Thumbnail generation

### 4. Properties (Odoo Sync)
- Fetch properties from Odoo API
- Local cache for editing
- Media gallery management
- 3D floor plans & virtual tours

### 5. SEO & Metadata
- Meta titles & descriptions
- Open Graph tags
- Structured data (JSON-LD)
- Sitemap generation

### 6. Testimonials & Partners
- Manage testimonials
- Partner logos carousel
- Ratings & quotes

### 7. Theme Settings
- Color customization
- Typography
- Layout preferences

### 8. Users & Audit
- User management
- Role assignment
- Activity logs

---

## 🔗 Odoo Integration

### Setup Odoo REST API

1. Install Odoo REST API module
2. Configure API access in Odoo settings
3. Generate API key
4. Update `.env` with Odoo credentials

### Sync Properties

```typescript
// API endpoint to sync properties
POST /api/admin/properties/sync

// Fetches latest properties from Odoo and caches locally
```

---

## 📦 Database Migrations

### Create Migration
```bash
npx prisma migrate dev --name your_migration_name
```

### Reset Database
```bash
npx prisma migrate reset
```

### Update Prisma Client
```bash
npx prisma generate
```

---

## 🎨 Customization

### Theme Colors
Edit in `src/app/admin/theme/page.tsx` or update CSS variables in `globals.css`

### Add New Section Type
1. Update `SectionType` enum in `prisma/schema.prisma`
2. Create component in `src/components/sections/`
3. Add to section renderer

---

## 🚢 Deployment

### Environment Variables (Production)
```env
NODE_ENV=production
DATABASE_URL="your-production-db-url"
JWT_SECRET="strong-production-secret"
# ... other production configs
```

### Build
```bash
npm run build
npm start
```

### Docker (Optional)
```dockerfile
# Dockerfile included in project root
docker build -t hommesestates-cms .
docker run -p 3000:3000 hommesestates-cms
```

---

## 🔧 Troubleshooting

### Prisma Client Not Found
```bash
npx prisma generate
```

### Migration Issues
```bash
npx prisma migrate reset
npx prisma migrate dev
```

### Session/Auth Issues
- Check `JWT_SECRET` is set
- Clear browser cookies
- Verify database connection

---

## 📚 API Documentation

### Authentication
```typescript
POST /api/admin/auth/login
POST /api/admin/auth/logout
GET  /api/admin/auth/me
```

### Pages
```typescript
GET    /api/admin/pages
POST   /api/admin/pages
PUT    /api/admin/pages/[id]
DELETE /api/admin/pages/[id]
```

### Media
```typescript
GET    /api/admin/media
POST   /api/admin/media/upload
DELETE /api/admin/media/[id]
```

### Properties
```typescript
GET  /api/admin/properties
POST /api/admin/properties/sync
```

---

## 🤝 Support

For issues or questions:
1. Check documentation
2. Review Prisma schema
3. Contact development team

---

## 📝 License

Proprietary - Hommes Estates & Facilities Management Limited

---

**Version:** 1.0.0  
**Last Updated:** November 2024
