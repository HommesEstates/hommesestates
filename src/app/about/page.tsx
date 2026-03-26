import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { PartnerMarquee } from '@/components/home/PartnerMarquee'
import { CTABanner } from '@/components/home/CTABanner'
import { Shield, Award, Users, TrendingUp } from 'lucide-react'
import { Breadcrumbs } from '@/components/common/Breadcrumbs'
import { AboutHeroEditable } from '@/components/about/HeroEditable'
import { TextBlockEditable } from '@/components/about/TextBlockEditable'
import { StoryEditable } from '@/components/about/StoryEditable'

export const metadata = {
  title: 'About Us | Hommes Estates',
  description:
    'Hommes Estates delivers premium executive suites and strategic property investments with world-class facility management, driven by excellence and trust.',
}

const values = [
  {
    icon: Shield,
    title: 'Integrity & Trust',
    desc:
      'We uphold the highest standards of transparency and ethics across every engagement and transaction.',
  },
  {
    icon: Award,
    title: 'Excellence in Delivery',
    desc:
      'We obsess over quality, ensuring every property and service reflects our commitment to precision.',
  },
  {
    icon: Users,
    title: 'Client-Centred',
    desc:
      'Your goals drive our strategy — from acquisition to management and profitable exit.',
  },
  {
    icon: TrendingUp,
    title: 'Long-Term Value',
    desc:
      'We build resilient portfolios that compound value through rental yield and appreciation.',
  },
]

const team = [
  { name: 'Amaka Okoye', role: 'Chief Executive Officer' },
  { name: 'Tunde Adedayo', role: 'Head of Investments' },
  { name: 'Fatima Bello', role: 'Facility Manager' },
  { name: "Chinedu Nwosu", role: 'Client Relations Lead' },
]

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-20">
        {/* Hero */}
        <section className="text-text dark:text-white py-20 bg-surface relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="mb-4">
                <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'About' }]} />
              </div>
              <AboutHeroEditable />
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="section-container">
          <StoryEditable />
        </section>

        {/* Mission & Vision */}
        <section className="section-container">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-8 bg-surface rounded-2xl shadow-lg border border-neutral-200 dark:border-neutral-700">
              <TextBlockEditable
                slug="about"
                keyName="mission"
                defaults={{ title: 'Our Mission', text: 'Deliver exceptional spaces and superior investment outcomes through disciplined execution, rigorous due diligence, and uncompromising service standards.' }}
              />
            </div>
            <div className="p-8 bg-surface rounded-2xl shadow-lg border border-neutral-200 dark:border-neutral-700">
              <TextBlockEditable
                slug="about"
                keyName="vision"
                defaults={{ title: 'Our Vision', text: 'Build Africa’s most trusted real estate platform for premium ownership and strategic investment.' }}
              />
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="section-container">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-3">Leadership Team</h2>
            <p className="text-text/70 dark:text-white/70">Experienced professionals focused on your success</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member) => (
              <div
                key={member.name}
                className="p-6 bg-surface rounded-2xl shadow-md text-center"
              >
                <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-copper-gradient" />
                <h3 className="font-heading font-semibold">{member.name}</h3>
                <p className="text-sm text-text/60 dark:text-white/60">{member.role}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Values */}
        <section className="section-container bg-surface">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-3">Our Values</h2>
            <p className="text-text/70 dark:text-white/70">Principles that guide every decision we make</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <div key={v.title} className="p-6 bg-surface rounded-2xl shadow-md">
                <div className="inline-flex p-3 bg-accent/10 rounded-xl mb-4">
                  <v.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-heading font-semibold mb-2">{v.title}</h3>
                <p className="text-sm text-text/70 dark:text-white/70 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Clients */}
        <PartnerMarquee />

        {/* CTA */}
        <CTABanner />
      </main>
      <Footer />
    </>
  )
}
