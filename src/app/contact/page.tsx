'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { MapPin, Phone, Mail, Clock, Send, ArrowRight } from 'lucide-react'
import { odooAPI } from '@/lib/api'
import { Breadcrumbs } from '@/components/common/Breadcrumbs'
import toast from 'react-hot-toast'
import { useEnsureSection } from '@/components/editable/useEnsureSection'
import EditableText from '@/components/editable/EditableText'

export default function ContactPage() {
  const hero = useEnsureSection({
    slug: 'contact',
    key: 'hero',
    type: 'HERO',
    defaults: {
      title: 'Get In Touch',
      subtitle: "Let's discuss your real estate goals and how we can help you achieve them",
    },
  })
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    purpose: 'buy' as 'buy' | 'invest' | 'manage',
    message: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const lead = await odooAPI.createLead({
      ...formData,
      source: 'website-contact',
    })

    setLoading(false)

    if (lead) {
      toast.success('Thank you! We will contact you soon.')
      setFormData({ name: '', email: '', phone: '', purpose: 'buy', message: '' })
    } else {
      toast.error('Something went wrong. Please try again.')
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 bg-surface">
        {/* Hero */}
        <section className="text-text dark:text-white py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface z-0" />
          <div className="absolute -top-64 -right-64 w-[40rem] h-[40rem] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="max-w-[90rem] mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center max-w-4xl mx-auto"
            >
              <div className="mb-6 flex justify-center">
                <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Contact' }]} />
              </div>
              <EditableText
                sectionId={hero.section?.id || 'pending'}
                path="title"
                value={hero.content?.title || ''}
                as="h1"
                className="text-5xl md:text-6xl lg:text-[4rem] font-heading font-light mb-6 tracking-tight"
              />
              <EditableText
                sectionId={hero.section?.id || 'pending'}
                path="subtitle"
                value={hero.content?.subtitle || ''}
                as="p"
                className="text-xl text-text/70 dark:text-white/70 font-light leading-relaxed max-w-2xl mx-auto"
              />
            </motion.div>
          </div>
        </section>

        {/* Contact Form & Info */}
        <section className="section-container relative z-10 pb-20">
          <div className="grid lg:grid-cols-5 gap-12 lg:gap-20">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
              className="lg:col-span-2 space-y-12"
            >
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-4 block">Connect</span>
                <h2 className="text-3xl lg:text-4xl font-heading font-light mb-6 tracking-tight">Contact Information</h2>
                <p className="text-text/70 dark:text-white/70 font-light leading-relaxed">
                  Reach out to us directly through any of these channels. Our dedicated team is ready to assist you with your premium real estate needs.
                </p>
              </div>

              <div className="space-y-8">
                <ContactInfo
                  icon={<MapPin className="w-5 h-5" />}
                  title="Office Address"
                  content="123 Victoria Island, Lagos, Nigeria"
                />

                <ContactInfo
                  icon={<Phone className="w-5 h-5" />}
                  title="Phone Numbers"
                  content={
                    <>
                      <p>+234 123 456 7890</p>
                      <p>+234 098 765 4321</p>
                    </>
                  }
                />

                <ContactInfo
                  icon={<Mail className="w-5 h-5" />}
                  title="Email Addresses"
                  content={
                    <>
                      <p>info@hommesestates.com</p>
                      <p>invest@hommesestates.com</p>
                    </>
                  }
                />

                <ContactInfo
                  icon={<Clock className="w-5 h-5" />}
                  title="Business Hours"
                  content={
                    <>
                      <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
                      <p>Saturday: 10:00 AM - 4:00 PM</p>
                      <p>Sunday: Closed</p>
                    </>
                  }
                />
              </div>

              <div className="pt-8">
                <div className="p-8 bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-accent/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                  <div className="relative z-10">
                    <h3 className="text-xl font-heading font-semibold mb-3 tracking-wide">Schedule a Consultation</h3>
                    <p className="text-text/70 dark:text-white/70 mb-8 font-light text-sm">
                      Book a private consultation with our real estate experts to discuss your investment goals.
                    </p>
                    <button className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-text dark:bg-white text-white dark:text-black hover:bg-accent dark:hover:bg-accent hover:text-white transition-colors duration-500 font-semibold text-xs uppercase tracking-[0.15em] rounded-sm w-full">
                      Book Now
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
              className="lg:col-span-3"
            >
              <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-2xl p-8 lg:p-12">
                <h2 className="text-3xl font-heading font-light mb-8 tracking-tight">Send Us a Message</h2>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold text-text/60 dark:text-white/60 mb-3">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-5 py-4 bg-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all font-light text-sm"
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold text-text/60 dark:text-white/60 mb-3">Email *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-5 py-4 bg-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all font-light text-sm"
                        placeholder="john@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold text-text/60 dark:text-white/60 mb-3">Phone *</label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-5 py-4 bg-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all font-light text-sm"
                        placeholder="+234 123 456 7890"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold text-text/60 dark:text-white/60 mb-3">I'm Interested In *</label>
                    <select
                      value={formData.purpose}
                      onChange={(e) => setFormData({ ...formData, purpose: e.target.value as any })}
                      className="w-full px-5 py-4 bg-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all font-light text-sm appearance-none"
                    >
                      <option value="buy">Buying a Property</option>
                      <option value="invest">Investment Opportunities</option>
                      <option value="manage">Property Management</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold text-text/60 dark:text-white/60 mb-3">Message *</label>
                    <textarea
                      required
                      rows={6}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-5 py-4 bg-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all font-light text-sm resize-none"
                      placeholder="Tell us about your requirements..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-transparent text-accent hover:bg-accent hover:text-white transition-all duration-500 font-semibold text-xs uppercase tracking-[0.15em] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ boxShadow: 'inset 0 0 0 1px rgba(204, 85, 0, 0.3)' }}
                  >
                    {loading ? 'Sending...' : 'Send Message'}
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Map Section */}
        <section className="h-[500px] w-full relative grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-1000">
          <div className="absolute inset-0 bg-surface/20 pointer-events-none z-10 mix-blend-overlay" />
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1m3!1d3964.7088924907954!2d3.4180424147702484!3d6.431411595346513!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x103b8b2ae68280c1%3A0xdc9e87a367c3d9cb!2sVictoria%20Island%2C%20Lagos%2C%20Nigeria!5e0!3m2!1sen!2sus!4v1650000000000!5m2!1sen!2sus" 
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
            allowFullScreen 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-full"
          ></iframe>
        </section>
      </main>
      <Footer />
    </>
  )
}

function ContactInfo({ icon, title, content }: { icon: React.ReactNode; title: string; content: React.ReactNode }) {
  return (
    <div className="flex gap-5 group">
      <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl text-text/50 dark:text-white/50 group-hover:text-accent transition-colors duration-500" style={{ boxShadow: 'inset 0 0 0 1px rgba(16, 24, 40, 0.08)' }}>
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-sm tracking-wide mb-1 uppercase text-text/80 dark:text-white/80">{title}</h3>
        <div className="text-text/60 dark:text-white/60 font-light text-sm space-y-1">
          {content}
        </div>
      </div>
    </div>
  )
}
