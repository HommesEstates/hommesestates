# Setup Instructions - Hommes Estates Website

Complete guide to set up the Hommes Estates website locally and prepare for deployment.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your Odoo API credentials

# 3. Run development server
npm run dev

# 4. Open browser
# Navigate to http://localhost:3000
```

## Detailed Setup

### 1. Install Dependencies

The project requires Node.js 18 or higher. Install all dependencies:

```bash
npm install
```

This will install:
- **Next.js 14**: React framework
- **TailwindCSS**: Utility-first CSS framework
- **Framer Motion**: Animation library
- **Lucide React**: Icon library
- **React Hook Form**: Form management
- **Axios**: HTTP client
- **Zustand**: State management
- **Next Themes**: Dark mode support

### 2. Environment Configuration

Create `.env.local` file in the root directory:

```env
# Odoo API Configuration (REQUIRED)
NEXT_PUBLIC_ODOO_API_URL=http://localhost:8069
NEXT_PUBLIC_ODOO_DB=your_database_name
ODOO_API_KEY=your_api_key_here

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=Hommes Estates & Facilities Management

# Optional: Analytics
NEXT_PUBLIC_GA_ID=
```

**Important**: 
- Never commit `.env.local` to version control
- `NEXT_PUBLIC_*` variables are exposed to the browser
- `ODOO_API_KEY` without `NEXT_PUBLIC_` prefix is server-only

### 3. Odoo Backend Setup

#### Required Odoo Modules
Install these modules in your Odoo instance:
- `real_estate` - Property management
- `crm` - Customer relationship management
- `website` - Website builder (optional for CMS)

#### Create API Endpoints

Add a new Python file in your Odoo custom module:

**`controllers/api.py`**:
```python
from odoo import http
from odoo.http import request
import json

class RealEstateAPI(http.Controller):
    
    @http.route('/api/real.estate.property', type='http', auth='public', methods=['GET'], csrf=False)
    def get_properties(self, **kwargs):
        properties = request.env['real.estate.property'].sudo().search([])
        data = []
        for prop in properties:
            data.append({
                'id': prop.id,
                'name': prop.name,
                'description': prop.description,
                'property_type': prop.property_type,
                'location': prop.location,
                'price': prop.price,
                'currency': prop.currency_id.name,
                'bedrooms': prop.bedrooms,
                'bathrooms': prop.bathrooms,
                'area': prop.area,
                'status': prop.state,
                'featured': prop.featured,
                'investment_ready': prop.investment_ready,
                'images': [img.url for img in prop.image_ids],
            })
        
        return request.make_response(
            json.dumps(data),
            headers=[
                ('Content-Type', 'application/json'),
                ('Access-Control-Allow-Origin', '*'),
            ]
        )
    
    @http.route('/api/crm.lead', type='json', auth='public', methods=['POST'], csrf=False)
    def create_lead(self, **kwargs):
        Lead = request.env['crm.lead'].sudo()
        lead = Lead.create({
            'name': kwargs.get('name'),
            'email_from': kwargs.get('email'),
            'phone': kwargs.get('phone'),
            'description': kwargs.get('message'),
            'tag_ids': [(6, 0, [request.env.ref('your_module.tag_website').id])],
        })
        return {'id': lead.id, 'success': True}
```

#### Enable CORS in Odoo

Edit `odoo.conf`:
```ini
[options]
proxy_mode = True
```

Or add CORS headers in your controller (shown above).

### 4. Database Seed Data (Optional)

For development, you can create sample data in Odoo:

```xml
<!-- data/demo_properties.xml -->
<odoo>
    <data noupdate="1">
        <record id="property_luxury_suite_1" model="real.estate.property">
            <field name="name">Executive Suite - Victoria Island</field>
            <field name="description">Premium office suite with ocean view</field>
            <field name="property_type">office</field>
            <field name="location">Victoria Island, Lagos</field>
            <field name="price">150000000</field>
            <field name="bedrooms">0</field>
            <field name="bathrooms">2</field>
            <field name="area">250</field>
            <field name="area_unit">sqm</field>
            <field name="state">available</field>
            <field name="featured">True</field>
            <field name="investment_ready">False</field>
        </record>
        
        <record id="property_investment_1" model="real.estate.property">
            <field name="name">Grade-A Office Complex - Lekki</field>
            <field name="description">Investment opportunity with 12% annual yield</field>
            <field name="property_type">commercial</field>
            <field name="location">Lekki Phase 1, Lagos</field>
            <field name="price">500000000</field>
            <field name="bedrooms">0</field>
            <field name="bathrooms">10</field>
            <field name="area">1200</field>
            <field name="area_unit">sqm</field>
            <field name="state">available</field>
            <field name="featured">True</field>
            <field name="investment_ready">True</field>
        </record>
    </data>
</odoo>
```

### 5. Run Development Server

Start the development server:

```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Odoo API: http://localhost:8069

### 6. Test the Application

#### Test Pages
- Homepage: http://localhost:3000
- Properties: http://localhost:3000/properties
- Services: http://localhost:3000/services
- Contact: http://localhost:3000/contact

#### Test API Integration
Open browser console and check for:
1. Properties loading on homepage
2. Contact form submission
3. No CORS errors
4. Dark/light mode toggle

### 7. Build for Production

Test production build locally:

```bash
# Create production build
npm run build

# Start production server
npm start
```

## Project Structure Reference

```
hommesestates/
├── src/
│   ├── app/                    # Next.js pages (App Router)
│   │   ├── page.tsx           # Homepage
│   │   ├── layout.tsx         # Root layout
│   │   ├── globals.css        # Global styles
│   │   ├── properties/        # Properties pages
│   │   ├── services/          # Services page
│   │   ├── about/            # About page
│   │   └── contact/          # Contact page
│   ├── components/            # React components
│   │   ├── layout/           # Layout components
│   │   ├── home/             # Homepage sections
│   │   ├── services/         # Services components
│   │   └── providers/        # Context providers
│   ├── lib/                  # Utilities
│   │   ├── api.ts           # Odoo API client
│   │   └── utils.ts         # Helper functions
│   └── types/               # TypeScript types
│       └── index.ts
├── public/                  # Static files
├── .env.local              # Environment variables (create this)
├── next.config.js          # Next.js config
├── tailwind.config.ts      # Tailwind config
├── tsconfig.json           # TypeScript config
├── package.json            # Dependencies
└── README.md              # Documentation
```

## Common Issues & Solutions

### Issue: "Cannot find module" errors
**Solution**: 
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: API connection failed
**Solution**:
1. Verify Odoo is running: `http://localhost:8069`
2. Check `.env.local` has correct `NEXT_PUBLIC_ODOO_API_URL`
3. Test API endpoint directly in browser
4. Check Odoo logs for errors

### Issue: Styles not loading
**Solution**:
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

### Issue: Dark mode not working
**Solution**:
- Check browser console for errors
- Verify `next-themes` is installed
- Clear browser cache

### Issue: Forms not submitting
**Solution**:
1. Check browser console for errors
2. Verify API endpoint returns 200 status
3. Check Odoo logs
4. Ensure CSRF is disabled for API routes

## Development Tips

### Hot Reload
Next.js automatically reloads when you save files. If it doesn't:
```bash
# Restart dev server
Ctrl+C
npm run dev
```

### TypeScript Errors
```bash
# Check for type errors
npm run build

# Or use TypeScript compiler
npx tsc --noEmit
```

### Code Formatting
```bash
# Install Prettier (optional)
npm install --save-dev prettier

# Format code
npx prettier --write "src/**/*.{ts,tsx}"
```

### Performance Profiling
```bash
# Analyze bundle size
npm run build
npm run analyze
```

## Next Steps

1. **Customize Content**: Update text, images, and branding
2. **Configure Odoo**: Set up real property data
3. **Test Forms**: Submit test leads and verify in Odoo
4. **Optimize Images**: Convert to WebP format
5. **Review SEO**: Check meta tags and structured data
6. **Deploy**: Follow DEPLOYMENT.md guide

## Getting Help

- **Documentation**: See README.md
- **Deployment**: See DEPLOYMENT.md
- **Next.js Docs**: https://nextjs.org/docs
- **TailwindCSS**: https://tailwindcss.com/docs
- **Framer Motion**: https://www.framer.com/motion

---

**Ready to deploy?** See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment instructions.
