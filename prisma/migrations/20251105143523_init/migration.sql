-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'EDITOR', 'PROPERTY_MANAGER', 'VIEWER');

-- CreateEnum
CREATE TYPE "PageStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SectionType" AS ENUM ('HERO', 'TEXT_BLOCK', 'IMAGE_GALLERY', 'VIDEO', 'CAROUSEL', 'TESTIMONIALS', 'PARTNERS', 'CTA', 'FEATURES', 'STATS', 'CONTACT_FORM', 'MAP', 'PROPERTIES_GRID', 'CUSTOM');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT', 'RENDER_3D', 'MODEL_3D');

-- CreateEnum
CREATE TYPE "MediaCategory" AS ENUM ('BANNER', 'PROPERTY', 'TEAM', 'LOGO', 'ICON', 'RENDER', 'FLOOR_PLAN', 'TESTIMONIAL', 'PARTNER', 'OTHER');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'PUBLISH', 'UNPUBLISH', 'LOGIN', 'LOGOUT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
    "avatar" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Page" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "PageStatus" NOT NULL DEFAULT 'DRAFT',
    "isHomepage" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Section" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "type" "SectionType" NOT NULL,
    "title" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "content" JSONB NOT NULL,
    "styles" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "type" "MediaType" NOT NULL,
    "category" "MediaCategory" NOT NULL DEFAULT 'OTHER',
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "alt" TEXT,
    "caption" TEXT,
    "tags" TEXT[],
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "odooId" INTEGER,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "propertyType" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "address" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "area" DOUBLE PRECISION NOT NULL,
    "areaUnit" TEXT NOT NULL DEFAULT 'sqm',
    "status" TEXT NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "investmentReady" BOOLEAN NOT NULL DEFAULT false,
    "amenities" TEXT[],
    "highlights" TEXT[],
    "virtualTourUrl" TEXT,
    "floorPlanUrl" TEXT,
    "model3dUrl" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyMedia" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestmentDetails" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "projectedRentalYield" DOUBLE PRECISION,
    "appreciationRate" DOUBLE PRECISION,
    "minimumInvestment" DOUBLE PRECISION,
    "expectedROI" DOUBLE PRECISION,
    "investmentHorizon" TEXT,
    "paymentPlan" JSONB,
    "riskLevel" TEXT,
    "completionDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestmentDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "company" TEXT,
    "quote" TEXT NOT NULL,
    "rating" INTEGER DEFAULT 5,
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL,
    "website" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoSettings" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "metaTitle" TEXT NOT NULL,
    "metaDescription" TEXT NOT NULL,
    "keywords" TEXT[],
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "ogImage" TEXT,
    "twitterCard" TEXT,
    "canonicalUrl" TEXT,
    "noindex" BOOLEAN NOT NULL DEFAULT false,
    "nofollow" BOOLEAN NOT NULL DEFAULT false,
    "structuredData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "SeoSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThemeSettings" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "colors" JSONB NOT NULL,
    "typography" JSONB NOT NULL,
    "spacing" JSONB NOT NULL,
    "borderRadius" JSONB NOT NULL,
    "animations" JSONB NOT NULL,
    "layout" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThemeSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL,
    "siteName" TEXT NOT NULL DEFAULT 'Hommes Estates',
    "tagline" TEXT,
    "logo" TEXT,
    "favicon" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "address" TEXT,
    "socialLinks" JSONB,
    "googleAnalyticsId" TEXT,
    "googleMapsApiKey" TEXT,
    "odooApiUrl" TEXT,
    "odooApiKey" TEXT,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "changes" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceMetric" (
    "id" TEXT NOT NULL,
    "pageUrl" TEXT NOT NULL,
    "performanceScore" INTEGER,
    "accessibilityScore" INTEGER,
    "bestPracticesScore" INTEGER,
    "seoScore" INTEGER,
    "firstContentfulPaint" INTEGER,
    "largestContentfulPaint" INTEGER,
    "cumulativeLayoutShift" DOUBLE PRECISION,
    "totalBlockingTime" INTEGER,
    "speedIndex" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformanceMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Page_slug_key" ON "Page"("slug");

-- CreateIndex
CREATE INDEX "Page_slug_idx" ON "Page"("slug");

-- CreateIndex
CREATE INDEX "Page_status_idx" ON "Page"("status");

-- CreateIndex
CREATE INDEX "Section_pageId_idx" ON "Section"("pageId");

-- CreateIndex
CREATE INDEX "Section_type_idx" ON "Section"("type");

-- CreateIndex
CREATE INDEX "Media_type_idx" ON "Media"("type");

-- CreateIndex
CREATE INDEX "Media_category_idx" ON "Media"("category");

-- CreateIndex
CREATE INDEX "Media_uploadedById_idx" ON "Media"("uploadedById");

-- CreateIndex
CREATE UNIQUE INDEX "Property_odooId_key" ON "Property"("odooId");

-- CreateIndex
CREATE UNIQUE INDEX "Property_slug_key" ON "Property"("slug");

-- CreateIndex
CREATE INDEX "Property_odooId_idx" ON "Property"("odooId");

-- CreateIndex
CREATE INDEX "Property_slug_idx" ON "Property"("slug");

-- CreateIndex
CREATE INDEX "Property_status_idx" ON "Property"("status");

-- CreateIndex
CREATE INDEX "Property_featured_idx" ON "Property"("featured");

-- CreateIndex
CREATE INDEX "PropertyMedia_propertyId_idx" ON "PropertyMedia"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyMedia_mediaId_idx" ON "PropertyMedia"("mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "InvestmentDetails_propertyId_key" ON "InvestmentDetails"("propertyId");

-- CreateIndex
CREATE INDEX "Testimonial_isActive_idx" ON "Testimonial"("isActive");

-- CreateIndex
CREATE INDEX "Partner_isActive_idx" ON "Partner"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "SeoSettings_pageId_key" ON "SeoSettings"("pageId");

-- CreateIndex
CREATE INDEX "SeoSettings_pageId_idx" ON "SeoSettings"("pageId");

-- CreateIndex
CREATE UNIQUE INDEX "ThemeSettings_name_key" ON "ThemeSettings"("name");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "PerformanceMetric_pageUrl_idx" ON "PerformanceMetric"("pageUrl");

-- CreateIndex
CREATE INDEX "PerformanceMetric_createdAt_idx" ON "PerformanceMetric"("createdAt");

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyMedia" ADD CONSTRAINT "PropertyMedia_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyMedia" ADD CONSTRAINT "PropertyMedia_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentDetails" ADD CONSTRAINT "InvestmentDetails_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeoSettings" ADD CONSTRAINT "SeoSettings_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeoSettings" ADD CONSTRAINT "SeoSettings_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
