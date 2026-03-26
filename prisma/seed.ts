import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin@123456', 12)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@hommesestates.com' },
    update: {},
    create: {
      email: 'admin@hommesestates.com',
      passwordHash: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
      isActive: true,
    },
  })

  console.log('✅ Created admin user:', admin.email)

  // Create homepage
  const homepage = await prisma.page.upsert({
    where: { slug: 'home' },
    update: {},
    create: {
      slug: 'home',
      title: 'Homepage',
      description: 'Hommes Estates Homepage',
      status: 'PUBLISHED',
      isHomepage: true,
      order: 0,
      publishedAt: new Date(),
      authorId: admin.id,
    },
  })

  console.log('✅ Created homepage:', homepage.slug)

  // Create hero section (idempotent)
  const heroExists = await prisma.section.findFirst({ where: { pageId: homepage.id, type: 'HERO' } })
  if (!heroExists) {
    await prisma.section.create({
      data: {
        pageId: homepage.id,
        type: 'HERO',
        title: 'Welcome to Hommes Estates',
        order: 0,
        isVisible: true,
        content: {
          heading: 'Invest in Excellence. Own with Confidence.',
          subheading: 'Premium real estate investments and facility management',
          ctaText: 'Explore Properties',
          ctaLink: '/properties',
          backgroundImage: '/images/hero-bg.jpg',
        },
        authorId: admin.id,
      },
    })
  }

  console.log('✅ Created hero section')

  // Create site settings
  await prisma.siteSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      siteName: 'Hommes Estates',
      tagline: 'Premium Real Estate & Facility Management',
      contactEmail: 'info@hommesestates.com',
      contactPhone: '+234 123 456 7890',
      address: '123 Victoria Island, Lagos, Nigeria',
      socialLinks: {
        facebook: 'https://facebook.com/hommesestates',
        twitter: 'https://twitter.com/hommesestates',
        instagram: 'https://instagram.com/hommesestates',
        linkedin: 'https://linkedin.com/company/hommesestates',
      },
    },
  })

  console.log('✅ Created site settings')

  // Create theme settings (idempotent via unique name)
  await prisma.themeSettings.upsert({
    where: { name: 'Default Theme' },
    update: {
      isActive: true,
      colors: {
        primary: '#CC5500',
        secondary: '#16A34A',
        accent: '#E07A2A',
        charcoal: '#111827',
        ivory: '#FBFAF8',
        warmgray: '#F5F3EF',
      },
      typography: {
        headingFont: 'Manrope',
        bodyFont: 'Inter',
        accentFont: 'Montserrat',
      },
      spacing: {
        containerMaxWidth: '1280px',
        sectionPadding: '4rem',
      },
      borderRadius: {
        small: '0.5rem',
        medium: '1rem',
        large: '1.5rem',
      },
      animations: {
        transitionSpeed: '300ms',
        easing: 'ease-in-out',
      },
      layout: {
        headerHeight: '80px',
        footerHeight: 'auto',
      },
    },
    create: {
      name: 'Default Theme',
      isActive: true,
      colors: {
        primary: '#CC5500',
        secondary: '#16A34A',
        accent: '#E07A2A',
        charcoal: '#111827',
        ivory: '#FBFAF8',
        warmgray: '#F5F3EF',
      },
      typography: {
        headingFont: 'Manrope',
        bodyFont: 'Inter',
        accentFont: 'Montserrat',
      },
      spacing: {
        containerMaxWidth: '1280px',
        sectionPadding: '4rem',
      },
      borderRadius: {
        small: '0.5rem',
        medium: '1rem',
        large: '1.5rem',
      },
      animations: {
        transitionSpeed: '300ms',
        easing: 'ease-in-out',
      },
      layout: {
        headerHeight: '80px',
        footerHeight: 'auto',
      },
    },
  })

  console.log('✅ Created theme settings')

  // Create sample testimonial
  await prisma.testimonial.create({
    data: {
      name: 'Dr. Chukwuma Okafor',
      role: 'Suite Owner',
      company: 'The Fusion Wuye',
      quote: 'The structure design is top-notch... The location sells this place. Best investment decision I made in 2023.',
      rating: 5,
      isActive: true,
      order: 0,
    },
  })

  console.log('✅ Created sample testimonial')

  const partnerCount = await prisma.partner.count()
  if (partnerCount === 0) {
    await prisma.partner.createMany({
      data: [
        { name: 'Federal Capital Territory Administration', logoUrl: '', website: 'https://www.fcta.gov.ng', isActive: true, order: 0 },
        { name: 'Central Bank of Nigeria', logoUrl: '', website: 'https://www.cbn.gov.ng', isActive: true, order: 1 },
        { name: 'Nigeria Investment Promotion Commission', logoUrl: '', website: 'https://www.invest-nigeria.com', isActive: true, order: 2 },
        { name: 'PwC Nigeria', logoUrl: '', website: 'https://www.pwc.com/ng', isActive: true, order: 3 },
        { name: 'Deloitte', logoUrl: '', website: 'https://www2.deloitte.com/ng', isActive: true, order: 4 },
        { name: 'KPMG', logoUrl: '', website: 'https://home.kpmg/ng', isActive: true, order: 5 },
        { name: 'Access Bank', logoUrl: '', website: 'https://www.accessbankplc.com', isActive: true, order: 6 },
        { name: 'GTBank', logoUrl: '', website: 'https://www.gtbank.com', isActive: true, order: 7 },
      ],
    })
    console.log('✅ Seeded partners')
  } else {
    console.log('ℹ️ Partners already exist, skipping seeding')
  }

  const testimonialCount = await prisma.testimonial.count()
  if (testimonialCount < 3) {
    await prisma.testimonial.createMany({
      data: [
        {
          name: 'Nkechi Adeoye',
          role: 'Investor',
          company: 'Private Portfolio',
          quote: 'Hommes Estates provided a seamless investment experience with solid returns.',
          rating: 5,
          isActive: true,
          order: 1,
        },
        {
          name: 'Ibrahim Musa',
          role: 'Facility Owner',
          company: 'Abuja Business District',
          quote: 'Professional facility management that preserves asset value and tenant satisfaction.',
          rating: 5,
          isActive: true,
          order: 2,
        },
      ],
    })
    console.log('✅ Seeded additional testimonials')
  } else {
    console.log('ℹ️ Enough testimonials exist, skipping additional seeding')
  }

  console.log('')
  console.log('🎉 Seeding completed successfully!')
  console.log('')
  console.log('📧 Admin Login:')
  console.log('   Email: admin@hommesestates.com')
  console.log('   Password: Admin@123456')
  console.log('')
  console.log('⚠️  IMPORTANT: Change the admin password after first login!')
  console.log('')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error during seeding:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
