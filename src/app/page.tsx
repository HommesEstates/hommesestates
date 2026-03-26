import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { HeroSection } from '@/components/home/HeroSection'
import { DualValueProposition } from '@/components/home/DualValueProposition'
import { FeaturedProperties } from '@/components/home/FeaturedProperties'
import { PartnerMarquee } from '@/components/home/PartnerMarquee'
import { ProjectSpotlight } from '@/components/home/ProjectSpotlight'
import { InvestmentCalculator } from '@/components/home/InvestmentCalculator'
import { InvestmentAnalytics } from '@/components/home/InvestmentAnalytics'
import { ServicesOverview } from '@/components/home/ServicesOverview'
import { TestimonialsSection } from '@/components/home/TestimonialsSection'
import { CTABanner } from '@/components/home/CTABanner'

export const metadata = {
  title: 'Hommes Estates - Premium Executive Suites & Strategic Property Investments',
  description: 'Elevate Your Business. Amplify Your Investment. Premium office suites and high-yield property investments in Abuja.',
}

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <DualValueProposition />
        <FeaturedProperties />
        <PartnerMarquee />
        <ProjectSpotlight status="selling" />
        <InvestmentCalculator />
        <InvestmentAnalytics />
        <ProjectSpotlight status="sold" />
        <ServicesOverview />
        <TestimonialsSection />
        <CTABanner />
      </main>
      <Footer />
    </>
  )
}
