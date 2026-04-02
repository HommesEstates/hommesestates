'use client'

import { motion } from 'framer-motion'
import { Wifi, Car, Shield, Zap, Wind, Coffee, Dumbbell, Users, Building2, Clock, Droplet, Sun } from 'lucide-react'

const amenities = [
  { icon: <Wifi />, name: 'High-Speed Internet', description: 'Fiber optic connectivity' },
  { icon: <Car />, name: 'Ample Parking', description: '2 spaces per unit' },
  { icon: <Shield />, name: '24/7 Security', description: 'CCTV & armed guards' },
  { icon: <Zap />, name: 'Backup Power', description: '100% uptime guarantee' },
  { icon: <Wind />, name: 'Central AC', description: 'Climate controlled' },
  { icon: <Coffee />, name: 'Business Lounge', description: 'Co-working spaces' },
  { icon: <Dumbbell />, name: 'Fitness Center', description: 'Fully equipped gym' },
  { icon: <Users />, name: 'Conference Rooms', description: 'Meeting facilities' },
  { icon: <Building2 />, name: 'Elevator Access', description: 'High-speed lifts' },
  { icon: <Clock />, name: 'Concierge Service', description: '24/7 assistance' },
  { icon: <Droplet />, name: 'Water Supply', description: 'Uninterrupted supply' },
  { icon: <Sun />, name: 'Natural Lighting', description: 'Floor-to-ceiling windows' },
]

export function ProjectAmenities() {
  return (
    <div>
      <div className="text-center mb-12">
        <h2 className="text-h2 font-heading font-bold mb-4">
          World-Class Amenities
        </h2>
        <p className="text-lg text-text/70 dark:text-white/70 max-w-2xl mx-auto">
          Every detail designed for comfort, productivity, and peace of mind.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {amenities.map((amenity, index) => (
          <motion.div
            key={amenity.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="p-6 bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl shadow-lg hover:shadow-2xl hover:border-orange-500/50 dark:hover:border-orange-500/50 transition-all cursor-pointer group"
          >
            <div className="text-accent mb-4 group-hover:scale-110 transition-transform duration-300">
              {amenity.icon}
            </div>
            <h3 className="font-heading font-semibold mb-2 text-gray-900 dark:text-white">
              {amenity.name}
            </h3>
            <p className="text-sm text-text/60 dark:text-white/60 font-light">
              {amenity.description}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
