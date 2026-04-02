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
      <main className="min-h-screen pt-24">
        {/* Hero */}
        <section className="text-text dark:text-white py-20 bg-surface relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface z-0" />
          <div className="absolute -top-64 -right-64 w-[40rem] h-[40rem] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="max-w-[90rem] mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
            <div className="text-center max-w-4xl mx-auto">
              <div className="mb-6 flex justify-center">
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
        <section className="section-container bg-surface relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            <div className="p-10 lg:p-14 bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-2xl group transition-all duration-500 hover:bg-white/10 dark:hover:bg-black/30">
              <TextBlockEditable
                slug="about"
                keyName="mission"
                defaults={{ title: 'Our Mission', text: 'Deliver exceptional spaces and superior investment outcomes through disciplined execution, rigorous due diligence, and uncompromising service standards.' }}
              />
            </div>
            <div className="p-10 lg:p-14 bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-2xl group transition-all duration-500 hover:bg-white/10 dark:hover:bg-black/30">
              <TextBlockEditable
                slug="about"
                keyName="vision"
                defaults={{ title: 'Our Vision', text: 'Build Africa\'s most trusted real estate platform for premium ownership and strategic investment.' }}
              />
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="section-container">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-4 block">Our People</span>
            <h2 className="text-4xl md:text-5xl font-heading font-light mb-6 tracking-tight">Leadership Team</h2>
            <p className="text-lg text-text/70 dark:text-white/70 font-light max-w-2xl mx-auto">Experienced professionals focused on your success and delivering exceptional value.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member) => (
              <div
                key={member.name}
                className="p-8 bg-surface rounded-2xl text-center group transition-all duration-500 hover:bg-white/5 dark:hover:bg-black/10"
              >
                <div className="mx-auto mb-6 w-24 h-24 rounded-full bg-copper-gradient opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
                <h3 className="font-heading font-semibold text-lg tracking-wide mb-1">{member.name}</h3>
                <p className="text-xs text-text/50 dark:text-white/50 uppercase tracking-[0.15em] font-medium">{member.role}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Values */}
        <section className="section-container bg-surface relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
          <div className="text-center mb-16 relative z-10">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-4 block">Our Core</span>
            <h2 className="text-4xl md:text-5xl font-heading font-light mb-6 tracking-tight">Our Values</h2>
            <p className="text-lg text-text/70 dark:text-white/70 font-light max-w-2xl mx-auto">Principles that guide every decision we make and every relationship we build.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {values.map((v, i) => (
              <div key={v.title} className="p-8 bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-2xl group transition-all duration-500 hover:bg-white/10 dark:hover:bg-black/30">
                <div className="inline-flex p-4 bg-accent/5 rounded-xl mb-6">
                  <v.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-heading font-semibold text-lg tracking-wide mb-4">{v.title}</h3>
                <p className="text-sm text-text/60 dark:text-white/60 font-light leading-relaxed">{v.desc}</p>
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
