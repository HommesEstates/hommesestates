import { Metadata } from 'next'
import { InteractiveFloorPlan } from '@/components/projects/InteractiveFloorPlan'
import { PropertyViewer3D } from '@/components/projects/PropertyViewer3D'
import { ProjectHero } from '@/components/projects/ProjectHero'
import { ProjectStats } from '@/components/projects/ProjectStats'
import { InvestmentROI } from '@/components/projects/InvestmentROI'
import { ProjectGallery } from '@/components/projects/ProjectGallery'
import { ProjectAmenities } from '@/components/projects/ProjectAmenities'
import { ScheduleTourModal } from '@/components/projects/ScheduleTourModal'
import { FusionWuseLive } from '@/components/projects/FusionWuseLive'

export const metadata: Metadata = {
  title: 'The Fusion Wuse - Executive Business Suites | Hommes Estates',
  description: 'Premium executive business suites in Wuse, Abuja. 15 floors, 120 units. High-yield investment opportunity with 12-14% annual returns. Schedule a tour today.',
  openGraph: {
    title: 'The Fusion Wuse - Executive Business Suites',
    description: 'Premium executive business suites in Wuse, Abuja. High-yield investment opportunity.',
    images: ['/images/projects/fusion-wuse-hero.jpg'],
  },
}

export default function FusionWusePage() {
  return (
    <main className="min-h-screen bg-bg">
      {/* Hero Section */}
      <ProjectHero
        projectName="The Fusion Wuse"
        tagline="Where Business Meets Excellence"
        location="Wuse Zone 5, Abuja"
        status="Currently Selling"
        heroImage="/images/projects/fusion-wuse-hero.jpg"
        ctaPrimary="Download Brochure"
        ctaSecondary="Schedule Floor Tour"
      />

      {/* Live Odoo-backed Explorer, Stats and 3D */}
      <FusionWuseLive propertyName="The Fusion Wuse" />

      {/* Investment ROI Calculator */}
      <section className="section-container">
        <InvestmentROI projectId="fusion-wuse" />
      </section>

      {/* Gallery */}
      <section className="section-container bg-surface">
        <ProjectGallery
          images={[
            { src: '/images/projects/fusion-wuse-1.jpg', alt: 'Exterior view' },
            { src: '/images/projects/fusion-wuse-2.jpg', alt: 'Lobby' },
            { src: '/images/projects/fusion-wuse-3.jpg', alt: 'Executive suite' },
            { src: '/images/projects/fusion-wuse-4.jpg', alt: 'Boardroom' },
            { src: '/images/projects/fusion-wuse-5.jpg', alt: 'Amenities' },
            { src: '/images/projects/fusion-wuse-6.jpg', alt: 'Night view' },
          ]}
        />
      </section>

      {/* Amenities */}
      <section className="section-container">
        <ProjectAmenities />
      </section>

      {/* Final CTA */}
      <section className="section-container bg-copper-gradient text-white text-center">
        <h2 className="text-h2 font-heading font-bold mb-4">
          Ready to Invest in Your Future?
        </h2>
        <p className="text-lg mb-8 max-w-2xl mx-auto">
          Schedule a private tour or download our comprehensive investment brochure to learn more about The Fusion Wuse.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="px-8 py-4 bg-white text-accent rounded-xl font-accent font-semibold hover:shadow-2xl hover:scale-105 transition-all">
            Download Brochure
          </button>
          <button className="px-8 py-4 border-2 border-white text-white rounded-xl font-accent font-semibold hover:bg-white hover:text-accent transition-all">
            Schedule Tour
          </button>
        </div>
      </section>
    </main>
  )
}
