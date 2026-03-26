# Deployment Guide - Hommes Estates Website

## Prerequisites

Before deploying, ensure you have:
- Completed Odoo backend setup with required API endpoints
- Configured environment variables
- Tested the application locally
- Prepared production domain

## Option 1: Deploy to Vercel (Recommended)

### Step 1: Prepare Repository
```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit"

# Push to GitHub
git remote add origin <your-repo-url>
git push -u origin main
```

### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Import Project"
3. Import your GitHub repository
4. Configure build settings:
   - Framework Preset: **Next.js**
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

### Step 3: Add Environment Variables
In Vercel dashboard, add these environment variables:
```
NEXT_PUBLIC_ODOO_API_URL=https://your-odoo-domain.com
NEXT_PUBLIC_ODOO_DB=your_database_name
ODOO_API_KEY=your_api_key_here
NEXT_PUBLIC_SITE_URL=https://hommesestates.com
NEXT_PUBLIC_SITE_NAME=Hommes Estates & Facilities Management
```

### Step 4: Deploy
- Click "Deploy"
- Wait for build to complete
- Your site will be live at: `your-project.vercel.app`

### Step 5: Custom Domain
1. Go to Project Settings → Domains
2. Add your custom domain: `hommesestates.com`
3. Follow DNS configuration instructions
4. Wait for DNS propagation (up to 48 hours)

## Option 2: Deploy to Netlify

### Step 1: Build Configuration
Create `netlify.toml` in project root:
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[redirects]]
  from = "/api/*"
  to = "https://your-odoo-domain.com/:splat"
  status = 200
  force = true

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
```

### Step 2: Deploy via Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Initialize site
netlify init

# Deploy
netlify deploy --prod
```

### Step 3: Environment Variables
In Netlify dashboard:
- Go to Site Settings → Build & Deploy → Environment
- Add all environment variables from `.env.local`

## Option 3: Deploy to Your Own Server

### Requirements
- Ubuntu 20.04+ or similar Linux distribution
- Node.js 18+
- Nginx
- PM2 for process management
- SSL certificate (Let's Encrypt recommended)

### Step 1: Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

### Step 2: Deploy Application
```bash
# Clone repository
git clone <your-repo-url> /var/www/hommesestates
cd /var/www/hommesestates

# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local
nano .env.local  # Add your variables

# Build application
npm run build

# Start with PM2
pm2 start npm --name "hommesestates" -- start
pm2 save
pm2 startup
```

### Step 3: Configure Nginx
Create `/etc/nginx/sites-available/hommesestates`:
```nginx
server {
    listen 80;
    server_name hommesestates.com www.hommesestates.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/hommesestates /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 4: SSL Certificate
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d hommesestates.com -d www.hommesestates.com

# Auto-renewal is configured automatically
```

## Post-Deployment Checklist

### 1. Verify Deployment
- [ ] Homepage loads correctly
- [ ] All pages are accessible
- [ ] Forms submit successfully
- [ ] API integration works
- [ ] Dark/light mode toggles properly
- [ ] Images load correctly
- [ ] Mobile responsive design works

### 2. Test Performance
```bash
# Run Lighthouse audit
npx lighthouse https://hommesestates.com --view

# Target scores:
# Performance: ≥ 90
# Accessibility: ≥ 90
# Best Practices: ≥ 90
# SEO: ≥ 90
```

### 3. Configure Analytics (Optional)
Add Google Analytics ID to environment:
```
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### 4. Set Up Monitoring
- Configure uptime monitoring (UptimeRobot, Pingdom)
- Set up error tracking (Sentry)
- Monitor API response times
- Set up log aggregation

### 5. Security Measures
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] API keys secured (not exposed to client)
- [ ] Rate limiting implemented
- [ ] CORS properly configured
- [ ] Content Security Policy set

## Odoo Backend Configuration

### Required API Endpoints
Ensure these endpoints are accessible:

1. **Properties API** (`/api/real.estate.property`)
   ```python
   @http.route('/api/real.estate.property', type='json', auth='public', methods=['GET'])
   def get_properties(self, **kwargs):
       # Implementation
   ```

2. **Leads API** (`/api/crm.lead`)
   ```python
   @http.route('/api/crm.lead', type='json', auth='public', methods=['POST'])
   def create_lead(self, **kwargs):
       # Implementation
   ```

### CORS Configuration
Add to Odoo configuration:
```ini
[options]
proxy_mode = True

; Add your frontend domain
; This allows API requests from your website
```

Update Odoo controller:
```python
def _set_cors_headers(self):
    headers = {
        'Access-Control-Allow-Origin': 'https://hommesestates.com',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
    return headers
```

## Troubleshooting

### Build Fails
```bash
# Clear Next.js cache
rm -rf .next

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Try building again
npm run build
```

### API Connection Issues
1. Verify Odoo API URL is correct
2. Check API key is valid
3. Ensure CORS is properly configured
4. Test API endpoints with Postman
5. Check Odoo logs for errors

### Performance Issues
1. Enable production mode
2. Compress images (use WebP)
3. Enable Nginx gzip compression
4. Use CDN for static assets
5. Enable Next.js image optimization

### SSL Certificate Issues
```bash
# Renew certificate manually
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

## Maintenance

### Regular Updates
```bash
# Update dependencies monthly
npm update

# Check for security vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

### Backup Strategy
1. **Code**: Keep repository up to date
2. **Environment**: Backup `.env.local` securely
3. **Database**: Regular Odoo database backups
4. **Media**: Backup uploaded images/documents

### Monitoring Checklist
- [ ] Check uptime daily
- [ ] Review error logs weekly
- [ ] Test forms monthly
- [ ] Update dependencies monthly
- [ ] Review security patches weekly
- [ ] Test backup restoration quarterly

## Support

For deployment assistance:
- Email: tech@hommesestates.com
- Documentation: [Next.js Deployment](https://nextjs.org/docs/deployment)
- Vercel Support: [vercel.com/support](https://vercel.com/support)

---

**Last Updated**: January 2025
