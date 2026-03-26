import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ServicesHero } from '@/components/services/ServicesHero'
import { ServicesList } from '@/components/services/ServicesList'
import { ProcessSection } from '@/components/services/ProcessSection'
import { CTABanner } from '@/components/home/CTABanner'

export const metadata = {
  title: 'Our Services | Hommes Estates',
  description: 'Comprehensive real estate services for luxury owners and strategic investors - from acquisition to management and exit.',
}

export default function ServicesPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-20">
        <ServicesHero />
        <ServicesList />
        <ProcessSection />
        <CTABanner />
      </main>
      <Footer />
    </>
  )
}
