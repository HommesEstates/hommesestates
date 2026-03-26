# Hommes Estates & Facilities Management Website

A premium, high-conversion website for Hommes Estates built with Next.js 14, TailwindCSS, and Framer Motion, integrated with Odoo backend.

## 🚀 Features

- **Modern Tech Stack**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS
- **Premium Animations**: Framer Motion for smooth, professional animations
- **Dual Audience Targeting**: Separate flows for luxury owners and investors
- **Dark/Light Mode**: Seamless theme switching with system preference detection
- **SEO Optimized**: Meta tags, structured data, sitemap generation
- **Performance Focused**: Lazy loading, image optimization, Google Lighthouse ≥ 90
- **Odoo Integration**: RESTful API integration for properties, leads, and CRM
- **Responsive Design**: Mobile-first, fully responsive across all devices
- **CMS Dashboard**: Content management system for non-technical users

## 📦 Installation

### Prerequisites

- Node.js 18+ and npm/yarn
- Odoo 18 instance with real estate module
- Git

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hommesestates
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Odoo API Configuration
   NEXT_PUBLIC_ODOO_API_URL=http://your-odoo-domain.com:8069
   NEXT_PUBLIC_ODOO_DB=your_database_name
   ODOO_API_KEY=your_api_key_here

   # Site Configuration
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   NEXT_PUBLIC_SITE_NAME=Hommes Estates & Facilities Management

   # Analytics (Optional)
   NEXT_PUBLIC_GA_ID=your_google_analytics_id
   ```

4. **Run development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Build for production**
   ```bash
   npm run build
   npm start
   # or
   yarn build
   yarn start
   ```

## 🏗️ Project Structure

```
hommesestates/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Homepage
│   │   ├── properties/        # Properties listing and detail
│   │   ├── services/          # Services page
│   │   ├── about/             # About page
│   │   ├── contact/           # Contact page
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── layout/           # Header, Footer, etc.
│   │   ├── home/             # Homepage sections
│   │   └── providers/        # Context providers
│   ├── lib/                  # Utility functions
│   │   ├── api.ts           # Odoo API client
│   │   └── utils.ts         # Helper functions
│   └── types/               # TypeScript type definitions
│       └── index.ts
├── public/                  # Static assets
├── .env.local              # Environment variables
├── next.config.js          # Next.js configuration
├── tailwind.config.ts      # TailwindCSS configuration
└── package.json           # Dependencies

```

## 🎨 Design System

### Brand Colors
- **Primary**: `#000000` (Jet Black)
- **Accent**: `#CC5500` (Copper Bronze)
- **Neutrals**: `#FFFFFF`, `#F8F8F8`, `#1A1A1A`, `#0A0A0A`

### Typography
- **Headings**: Playfair Display
- **Body**: Inter

### Components
- Buttons with copper gradient and metallic sheen
- Property cards with hover animations
- Investment badges for investor-ready properties
- Statistics cards with animated counters

## 🔌 Odoo Integration

### Required API Endpoints

Create the following endpoints in your Odoo instance:

1. **Properties API** (`/api/real.estate.property`)
   - GET: List all properties with filters
   - GET `/:id`: Get single property details

2. **Leads API** (`/api/crm.lead`)
   - POST: Create new lead from contact forms

3. **Offers API** (`/api/real.estate.offer`)
   - POST: Submit property offer

4. **CMS API** (`/api/website.cms.config`)
   - GET: Fetch CMS content
   - PUT: Update CMS content

5. **Testimonials API** (`/api/website.testimonial`)
   - GET: Fetch testimonials with type filter

6. **Statistics API** (`/api/website.statistics`)
   - GET: Fetch site statistics

### Authentication

API requests use Bearer token authentication. Set `ODOO_API_KEY` in your environment variables.

## 📱 Pages

### Public Pages
- **Homepage**: Hero, value propositions, featured properties, services, testimonials
- **Properties**: Filterable grid/list view with search
- **Property Detail**: Gallery, specifications, investment details, contact form
- **Services**: Service offerings for owners and investors
- **About**: Company info, team, timeline, why invest
- **Contact**: Contact form, map, business info

### Protected Pages
- **CMS Dashboard**: Content management for admins

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

```bash
vercel --prod
```

### Netlify

1. Build the project: `npm run build`
2. Deploy the `.next` directory
3. Set environment variables in Netlify dashboard
4. Configure rewrites for API proxy

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔧 Configuration

### API Proxy

The `next.config.js` includes API rewrites to avoid CORS issues:

```javascript
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: process.env.NEXT_PUBLIC_ODOO_API_URL + '/:path*',
    },
  ]
}
```

### Image Optimization

Add your Odoo domain to `next.config.js`:

```javascript
images: {
  domains: ['your-odoo-domain.com'],
  formats: ['image/webp', 'image/avif'],
}
```

## 🧪 Performance Optimization

- **Lazy Loading**: Images and components load on demand
- **Code Splitting**: Automatic with Next.js App Router
- **Font Optimization**: Next.js Font with `display: swap`
- **Image Optimization**: WebP/AVIF with responsive srcsets
- **Caching**: Aggressive caching strategies

### Lighthouse Targets
- Performance: ≥ 90
- Accessibility: ≥ 90
- Best Practices: ≥ 90
- SEO: ≥ 90

## 📊 SEO Features

- **Meta Tags**: Dynamic per page
- **Structured Data**: Schema.org markup for properties
- **Sitemap**: Auto-generated
- **Robots.txt**: Crawling configuration
- **Open Graph**: Social media previews
- **Canonical URLs**: Duplicate content prevention

## 🎯 Target Audiences

### Luxury Owners
- High-net-worth individuals
- Seeking premium office suites and estates
- Value: prestige, quality, turnkey solutions

### Real Estate Investors
- Investment-focused buyers
- Seeking yield-generating properties
- Value: ROI, rental income, appreciation

## 📝 License

Proprietary - Hommes Estates & Facilities Management Limited

## 🤝 Support

For issues or questions, contact:
- Email: info@hommesestates.com
- Phone: +234 123 456 7890

---

Built with ❤️ by the Hommes Estates Development Team
