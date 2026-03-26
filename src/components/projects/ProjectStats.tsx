'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'

interface Stat {
  label: string
  value: number
  suffix?: string
  prefix?: string
}

interface ProjectStatsProps {
  stats: Stat[]
}

export function ProjectStats({ stats }: ProjectStatsProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  return (
    <section ref={ref} className="py-12 bg-surface border-y border-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className="text-center"
            >
              <AnimatedCounter
                value={stat.value}
                prefix={stat.prefix}
                suffix={stat.suffix}
                isInView={isInView}
              />
              <p className="text-sm text-text/60 mt-2">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function AnimatedCounter({ value, prefix = '', suffix = '', isInView }: any) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isInView) return

    let start = 0
    const end = value
    const duration = 2000
    const increment = end / (duration / 16)

    const timer = setInterval(() => {
      start += increment
      if (start >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)

    return () => clearInterval(timer)
  }, [isInView, value])

  return (
    <div className="text-4xl font-heading font-bold text-accent">
      {prefix}{count.toLocaleString()}{suffix}
    </div>
  )
}
