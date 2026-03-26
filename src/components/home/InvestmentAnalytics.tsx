'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { TrendingUp, PieChart, BarChart3, DollarSign } from 'lucide-react'
import { useState, useEffect } from 'react'

export function InvestmentAnalytics() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.2,
  })

  const metrics = [
    {
      icon: TrendingUp,
      label: 'Average Annual Yield',
      value: '12-15%',
      description: 'Consistent rental income from premium tenants',
      color: 'from-green-500 to-emerald-600',
    },
    {
      icon: BarChart3,
      label: 'Capital Appreciation',
      value: '8-10%',
      description: 'Year-over-year property value growth',
      color: 'from-blue-500 to-cyan-600',
    },
    {
      icon: PieChart,
      label: 'Resale Premium',
      value: '40-50%',
      description: 'Average profit on 5-7 year hold period',
      color: 'from-purple-500 to-pink-600',
    },
    {
      icon: DollarSign,
      label: 'Total Portfolio Value',
      value: '₦15B+',
      description: 'Assets under management',
      color: 'from-orange-500 to-red-600',
    },
  ]

  const performanceData = [
    { year: '2019', value: 100 },
    { year: '2020', value: 108 },
    { year: '2021', value: 118 },
    { year: '2022', value: 130 },
    { year: '2023', value: 145 },
    { year: '2024', value: 162 },
  ]

  return (
    <section ref={ref} className="section-container bg-surface">
      <div className="text-center mb-16">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-4xl md:text-5xl font-heading font-bold mb-4"
        >
          Investment Performance & <span className="gradient-text">Resale Potential</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1 }}
          className="text-lg text-text/70 dark:text-white/70 max-w-3xl mx-auto"
        >
          Acquire now, lease or resell within 5-7 years at premium. Track everything in your investor dashboard.
        </motion.p>
      </div>

      {/* Metrics Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {metrics.map((metric, index) => (
          <AnalyticsCard
            key={index}
            metric={metric}
            index={index}
            inView={inView}
          />
        ))}
      </div>

      {/* Performance Chart */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.6 }}
        className="bg-surface rounded-2xl shadow-xl p-8"
      >
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-heading font-bold">
            Portfolio Growth Index (2019-2024)
          </h3>
          <span className="text-sm text-text/60 dark:text-white/60">
            Base Year 2019 = 100
          </span>
        </div>

        <PerformanceChart data={performanceData} inView={inView} />

        <div className="mt-8 p-6 bg-accent/10 border-l-4 border-accent rounded-lg">
          <p className="text-text/80 dark:text-white/80">
            <strong>Investment Strategy:</strong> Our properties have consistently outperformed 
            traditional savings and fixed deposits, delivering superior returns through rental income 
            and capital appreciation. With prime locations and professional management, your investment 
            is positioned for long-term success.
          </p>
        </div>
      </motion.div>
    </section>
  )
}

function AnalyticsCard({ metric, index, inView }: { metric: any; index: number; inView: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ delay: index * 0.1 + 0.2 }}
      className="relative p-6 bg-surface rounded-2xl shadow-lg overflow-hidden group hover:shadow-2xl transition-all duration-300"
    >
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${metric.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

      <div className="relative z-10">
        <div className={`inline-flex p-3 bg-gradient-to-br ${metric.color} rounded-xl mb-4`}>
          <metric.icon className="w-6 h-6 text-white" />
        </div>

        <p className="text-sm text-text/60 dark:text-white/60 mb-2">
          {metric.label}
        </p>

        <p className="text-3xl font-heading font-bold mb-2 gradient-text">
          {metric.value}
        </p>

        <p className="text-sm text-text/70 dark:text-white/70">
          {metric.description}
        </p>
      </div>
    </motion.div>
  )
}

function PerformanceChart({ data, inView }: { data: any[]; inView: boolean }) {
  const maxValue = Math.max(...data.map(d => d.value))
  
  return (
    <div className="relative h-64">
      {/* Y-Axis Labels */}
      <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-sm text-text/60 dark:text-white/60 pr-4">
        <span>{maxValue}</span>
        <span>{Math.round(maxValue * 0.75)}</span>
        <span>{Math.round(maxValue * 0.5)}</span>
        <span>{Math.round(maxValue * 0.25)}</span>
        <span>0</span>
      </div>

      {/* Chart Area */}
      <div className="ml-12 h-full flex items-end justify-around gap-4">
        {data.map((item, index) => {
          const height = (item.value / maxValue) * 100
          
          return (
            <div key={item.year} className="flex-1 flex flex-col items-center gap-2">
              <motion.div
                initial={{ height: 0 }}
                animate={inView ? { height: `${height}%` } : {}}
                transition={{ delay: index * 0.1 + 0.8, duration: 0.8, ease: 'easeOut' }}
                className="w-full bg-copper-gradient rounded-t-lg relative group/bar"
              >
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-sm font-semibold opacity-0 group-hover/bar:opacity-100 transition-opacity">
                  {item.value}
                </span>
              </motion.div>
              <span className="text-sm text-text/60 dark:text-white/60">
                {item.year}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
