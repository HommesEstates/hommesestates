'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DollarSign, TrendingUp, Download, Calendar } from 'lucide-react'

export function InvestmentCalculator() {
  const [purchasePrice, setPurchasePrice] = useState(50000000) // ₦50M
  const [rentalPrice, setRentalPrice] = useState(500000) // ₦500K/month
  const [occupancyRate, setOccupancyRate] = useState(90) // 90%

  const calculations = useMemo(() => {
    const annualRent = rentalPrice * 12 * (occupancyRate / 100)
    const grossYield = (annualRent / purchasePrice) * 100
    const managementFee = annualRent * 0.05 // 5% management
    const netIncome = annualRent - managementFee
    const netYield = (netIncome / purchasePrice) * 100
    
    // Projected values (5-year)
    const appreciation = 0.08 // 8% per year
    const futureValue = purchasePrice * Math.pow(1 + appreciation, 5)
    const totalRentalIncome = netIncome * 5
    const totalReturn = futureValue - purchasePrice + totalRentalIncome
    const roi = (totalReturn / purchasePrice) * 100

    return {
      annualRent,
      grossYield,
      netYield,
      netIncome,
      futureValue,
      totalReturn,
      roi,
    }
  }, [purchasePrice, rentalPrice, occupancyRate])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const [showDownload, setShowDownload] = useState(false)

  const handleDownloadPack = () => {
    setShowDownload(true)
    setTimeout(() => setShowDownload(false), 3000)
    // In production, trigger actual PDF download
  }

  return (
    <section className="py-24 bg-surface">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-h1 font-heading font-bold mb-4"
          >
            Investment <span className="text-accent">Simulator</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-text/70 max-w-2xl mx-auto"
          >
            Calculate your potential returns. Adjust parameters to see live yield and projected profits.
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-surface rounded-3xl p-8 shadow-xl"
          >
            <h3 className="text-2xl font-heading font-semibold mb-8">Investment Parameters</h3>

            <div className="space-y-8">
              {/* Purchase Price */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-medium text-text/80">Purchase Price</label>
                  <span className="text-lg font-semibold text-accent">
                    {formatCurrency(purchasePrice)}
                  </span>
                </div>
                <input
                  type="range"
                  min="10000000"
                  max="500000000"
                  step="5000000"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(Number(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-accent"
                />
                <div className="flex justify-between text-xs text-text/50 mt-1">
                  <span>₦10M</span>
                  <span>₦500M</span>
                </div>
              </div>

              {/* Monthly Rent */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-medium text-text/80">Monthly Rental Income</label>
                  <span className="text-lg font-semibold text-accent">
                    {formatCurrency(rentalPrice)}
                  </span>
                </div>
                <input
                  type="range"
                  min="100000"
                  max="5000000"
                  step="50000"
                  value={rentalPrice}
                  onChange={(e) => setRentalPrice(Number(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-accent"
                />
                <div className="flex justify-between text-xs text-text/50 mt-1">
                  <span>₦100K</span>
                  <span>₦5M</span>
                </div>
              </div>

              {/* Occupancy Rate */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-medium text-text/80">Occupancy Rate</label>
                  <span className="text-lg font-semibold text-accent">{occupancyRate}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="5"
                  value={occupancyRate}
                  onChange={(e) => setOccupancyRate(Number(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-accent"
                />
                <div className="flex justify-between text-xs text-text/50 mt-1">
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Results */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            {/* Yield Metrics */}
            <div className="grid grid-cols-2 gap-6">
              <MetricCard
                icon={<TrendingUp />}
                label="Gross Yield"
                value={`${calculations.grossYield.toFixed(2)}%`}
                subtitle="Annual"
              />
              <MetricCard
                icon={<DollarSign />}
                label="Net Yield"
                value={`${calculations.netYield.toFixed(2)}%`}
                subtitle="After 5% Management"
              />
            </div>

            {/* 5-Year Projection */}
            <div className="bg-copper-gradient p-[2px] rounded-3xl">
              <div className="bg-surface rounded-3xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Calendar className="w-6 h-6 text-accent" />
                  <h4 className="text-xl font-heading font-semibold">5-Year Projection</h4>
                </div>

                <div className="space-y-4">
                  <ProjectionRow
                    label="Property Value"
                    value={formatCurrency(calculations.futureValue)}
                    change={`+${((calculations.futureValue / purchasePrice - 1) * 100).toFixed(1)}%`}
                  />
                  <ProjectionRow
                    label="Total Rental Income"
                    value={formatCurrency(calculations.netIncome * 5)}
                  />
                  <div className="border-t border-border pt-4">
                    <ProjectionRow
                      label="Total Return"
                      value={formatCurrency(calculations.totalReturn)}
                      change={`${calculations.roi.toFixed(1)}% ROI`}
                      highlight
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={handleDownloadPack}
              className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-copper-gradient text-white rounded-xl font-accent font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >
              <Download className="w-5 h-5" />
              Download Investment Pack
            </button>

            <AnimatePresence>
              {showDownload && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-center text-sm text-accent font-medium"
                >
                  ✓ Your personalized investment pack is being prepared...
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function MetricCard({ icon, label, value, subtitle }: any) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="bg-white dark:bg-charcoal rounded-2xl p-6 shadow-lg"
    >
      <div className="text-accent mb-3">{icon}</div>
      <p className="text-sm text-text/60 mb-1">{label}</p>
      <p className="text-2xl font-heading font-bold text-accent mb-1">{value}</p>
      {subtitle && <p className="text-xs text-text/50">{subtitle}</p>}
    </motion.div>
  )
}

function ProjectionRow({ label, value, change, highlight }: any) {
  return (
    <div className="flex justify-between items-center">
      <span className={`${highlight ? 'font-semibold' : 'text-text/70'}`}>{label}</span>
      <div className="text-right">
        <p className={`${highlight ? 'text-xl font-bold text-accent' : 'font-semibold'}`}>
          {value}
        </p>
        {change && <p className="text-xs text-green-600">{change}</p>}
      </div>
    </div>
  )
}
