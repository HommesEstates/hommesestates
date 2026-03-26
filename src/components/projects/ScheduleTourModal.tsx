'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Clock, User, Mail, Phone } from 'lucide-react'

interface ScheduleTourModalProps {
  isOpen?: boolean
  onClose?: () => void
}

export function ScheduleTourModal({ isOpen = false, onClose }: ScheduleTourModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    message: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Production: POST to Odoo CRM
    try {
      const response = await fetch('/api/crm.lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Tour Request - ${formData.name}`,
          contact_name: formData.name,
          email_from: formData.email,
          phone: formData.phone,
          description: `Tour scheduled for ${formData.date} at ${formData.time}\\n\\n${formData.message}`,
          tag_ids: ['tour_request', 'website'],
          type: 'opportunity'
        })
      })

      if (response.ok) {
        alert('Tour scheduled successfully! We will contact you shortly.')
        onClose?.()
        setFormData({ name: '', email: '', phone: '', date: '', time: '', message: '' })
      }
    } catch (error) {
      console.error('Failed to schedule tour:', error)
      alert('Something went wrong. Please try again or call us directly.')
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-charcoal rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-copper-gradient p-6 text-white flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-heading font-bold mb-2">
                  Schedule a Tour
                </h2>
                <p className="text-white/90">
                  Book a private viewing at your convenience
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Name */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-text/70 mb-2">
                  <User className="w-4 h-4" />
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-surface border-2 border-border rounded-lg focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                  placeholder="John Doe"
                />
              </div>

              {/* Email & Phone */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-text/70 mb-2">
                    <Mail className="w-4 h-4" />
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-surface border-2 border-border rounded-lg focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-text/70 mb-2">
                    <Phone className="w-4 h-4" />
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-surface border-2 border-border rounded-lg focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                    placeholder="+234 800 000 0000"
                  />
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-text/70 mb-2">
                    <Calendar className="w-4 h-4" />
                    Preferred Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 bg-surface border-2 border-border rounded-lg focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-text/70 mb-2">
                    <Clock className="w-4 h-4" />
                    Preferred Time *
                  </label>
                  <select
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-4 py-3 bg-surface border-2 border-border rounded-lg focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                  >
                    <option value="">Select time</option>
                    <option value="09:00">9:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="14:00">2:00 PM</option>
                    <option value="15:00">3:00 PM</option>
                    <option value="16:00">4:00 PM</option>
                    <option value="17:00">5:00 PM</option>
                  </select>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="text-sm font-medium text-text/70 mb-2 block">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-surface border-2 border-border rounded-lg focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all resize-none"
                  placeholder="Any specific requirements or questions?"
                />
              </div>

              {/* Submit */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 px-8 py-4 bg-copper-gradient text-white rounded-xl font-accent font-semibold hover:shadow-2xl hover:scale-105 transition-all"
                >
                  Schedule Tour
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-8 py-4 border-2 border-border text-text rounded-xl font-accent font-semibold hover:bg-muted transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
