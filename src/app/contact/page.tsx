'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react'
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
      <main className="min-h-screen pt-20">
        {/* Hero */}
        <section className="text-text dark:text-white py-16 bg-surface">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="mb-4">
                <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Contact' }]} />
              </div>
              <EditableText
                sectionId={hero.section?.id || 'pending'}
                path="title"
                value={hero.content?.title || ''}
                as="h1"
                className="text-4xl md:text-5xl font-heading font-bold mb-4"
              />
              <EditableText
                sectionId={hero.section?.id || 'pending'}
                path="subtitle"
                value={hero.content?.subtitle || ''}
                as="p"
                className="text-xl text-text/80 dark:text-white/80"
              />
            </motion.div>
          </div>
        </section>

        {/* Contact Form & Info */}
        <section className="section-container">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="order-2 lg:order-1"
            >
              <div className="bg-surface rounded-2xl shadow-xl p-8">
                <h2 className="text-3xl font-heading font-bold mb-6">Send Us a Message</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Email *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                        placeholder="john@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">Phone *</label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                        placeholder="+234 123 456 7890"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">I'm Interested In *</label>
                    <select
                      value={formData.purpose}
                      onChange={(e) => setFormData({ ...formData, purpose: e.target.value as any })}
                      className="w-full px-4 py-3 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="buy">Buying a Property</option>
                      <option value="invest">Investment Opportunities</option>
                      <option value="manage">Property Management</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Message *</label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                      placeholder="Tell us about your requirements..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-copper-gradient text-white rounded-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Send Message'}
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="order-1 lg:order-2 space-y-6"
            >
              <div>
                <h2 className="text-3xl font-heading font-bold mb-6">Contact Information</h2>
                <p className="text-text/70 dark:text-white/70 mb-8">
                  Reach out to us directly through any of these channels. Our team is ready to assist you.
                </p>
              </div>

              <div className="space-y-6">
                <ContactInfo
                  icon={<MapPin className="w-6 h-6" />}
                  title="Office Address"
                  content="123 Victoria Island, Lagos, Nigeria"
                />

                <ContactInfo
                  icon={<Phone className="w-6 h-6" />}
                  title="Phone Numbers"
                  content={
                    <>
                      <p>+234 123 456 7890</p>
                      <p>+234 098 765 4321</p>
                    </>
                  }
                />

                <ContactInfo
                  icon={<Mail className="w-6 h-6" />}
                  title="Email Addresses"
                  content={
                    <>
                      <p>info@hommesestates.com</p>
                      <p>invest@hommesestates.com</p>
                    </>
                  }
                />

                <ContactInfo
                  icon={<Clock className="w-6 h-6" />}
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

              <div className="pt-6">
                <div className="p-6 bg-copper-gradient rounded-2xl text-white">
                  <h3 className="text-xl font-heading font-bold mb-3">Schedule a Consultation</h3>
                  <p className="text-white/90 mb-4">
                    Book a free consultation with our real estate experts to discuss your goals.
                  </p>
                  <button className="px-6 py-3 bg-white text-accent rounded-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold">
                    Book Now
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Map Section */}
        <section className="h-96 bg-neutral-200 dark:bg-neutral-800">
          <div className="w-full h-full flex items-center justify-center text-text/40 dark:text-white/40">
            {/* Placeholder for Google Maps integration */}
            <div className="text-center">
              <MapPin className="w-16 h-16 mx-auto mb-4" />
              <p className="text-lg">Map Integration Goes Here</p>
              <p className="text-sm">Add Google Maps API key to display interactive map</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

function ContactInfo({ icon, title, content }: { icon: React.ReactNode; title: string; content: React.ReactNode }) {
  return (
    <div className="flex gap-4 p-6 bg-white dark:bg-neutral-800 rounded-xl shadow-md">
      <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-accent/10 rounded-lg text-accent">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <div className="text-text/70 dark:text-white/70 text-sm space-y-1">
          {content}
        </div>
      </div>
    </div>
  )
}
