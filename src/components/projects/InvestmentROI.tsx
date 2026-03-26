'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, DollarSign, Percent, Calendar } from 'lucide-react'

interface InvestmentROIProps {
  projectId: string
}

export function InvestmentROI({ projectId }: InvestmentROIProps) {
  const [purchasePrice, setPurchasePrice] = useState(45000000) // ₦45M
  const [monthlyRent, setMonthlyRent] = useState(500000) // ₦500K
  const [occupancyRate, setOccupancyRate] = useState(95) // 95%

  const calculations = useMemo(() => {
    const annualRent = monthlyRent * 12 * (occupancyRate / 100)
    const managementFee = annualRent * 0.05
    const netAnnualIncome = annualRent - managementFee
    const grossYield = (annualRent / purchasePrice) * 100
    const netYield = (netAnnualIncome / purchasePrice) * 100
    
    // 5-year projection (8% annual appreciation)
    const futureValue = purchasePrice * Math.pow(1.08, 5)
    const totalRentalIncome = netAnnualIncome * 5
    const totalReturn = (futureValue - purchasePrice) + totalRentalIncome
    const roi = (totalReturn / purchasePrice) * 100

    return {
      annualRent,
      netAnnualIncome,
      grossYield,
      netYield,
      futureValue,
      totalRentalIncome,
      totalReturn,
      roi
    }
  }, [purchasePrice, monthlyRent, occupancyRate])

  return (
    <div className="bg-white dark:bg-charcoal rounded-3xl shadow-2xl overflow-hidden">
      <div className="p-8 bg-copper-gradient text-white">
        <h2 className="text-h2 font-heading font-bold mb-2">
          Investment ROI Calculator
        </h2>
        <p className="text-white/90">
          Adjust the parameters below to see your potential returns
        </p>
      </div>

      <div className="p-8">
        {/* Sliders */}
        <div className="space-y-8 mb-8">
          {/* Purchase Price */}
          <div>
            <label className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-text/70">Purchase Price</span>
              <span className="text-lg font-bold text-accent">
                ₦{(purchasePrice / 1000000).toFixed(1)}M
              </span>
            </label>
            <input
              type="range"
              min="10000000"
              max="200000000"
              step="5000000"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(Number(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-accent"
            />
            <div className="flex justify-between text-xs text-text/50 mt-1">
              <span>₦10M</span>
              <span>₦200M</span>
            </div>
          </div>

          {/* Monthly Rent */}
          <div>
            <label className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-text/70">Monthly Rental Income</span>
              <span className="text-lg font-bold text-accent">
                ₦{(monthlyRent / 1000).toFixed(0)}K
              </span>
            </label>
            <input
              type="range"
              min="100000"
              max="5000000"
              step="50000"
              value={monthlyRent}
              onChange={(e) => setMonthlyRent(Number(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-accent"
            />
            <div className="flex justify-between text-xs text-text/50 mt-1">
              <span>₦100K</span>
              <span>₦5M</span>
            </div>
          </div>

          {/* Occupancy Rate */}
          <div>
            <label className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-text/70">Occupancy Rate</span>
              <span className="text-lg font-bold text-accent">
                {occupancyRate}%
              </span>
            </label>
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

        {/* Results Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <MetricCard
            icon={<Percent />}
            label="Gross Yield"
            value={`${calculations.grossYield.toFixed(2)}%`}
            subtitle="Annual return before expenses"
          />
          <MetricCard
            icon={<TrendingUp />}
            label="Net Yield"
            value={`${calculations.netYield.toFixed(2)}%`}
            subtitle="After 5% management fee"
          />
          <MetricCard
            icon={<DollarSign />}
            label="Annual Net Income"
            value={`₦${(calculations.netAnnualIncome / 1000000).toFixed(2)}M`}
            subtitle="Per year after expenses"
          />
          <MetricCard
            icon={<Calendar />}
            label="5-Year ROI"
            value={`${calculations.roi.toFixed(1)}%`}
            subtitle="Total return on investment"
            highlight
          />
        </div>

        {/* 5-Year Projection */}
        <div className="p-6 bg-accent/10 rounded-xl border-l-4 border-accent">
          <h3 className="font-heading font-semibold mb-4">5-Year Projection</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-text/70">Property Value (8% appreciation)</span>
              <span className="font-semibold">₦{(calculations.futureValue / 1000000).toFixed(1)}M</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text/70">Total Rental Income</span>
              <span className="font-semibold">₦{(calculations.totalRentalIncome / 1000000).toFixed(1)}M</span>
            </div>
            <div className="h-px bg-border my-2" />
            <div className="flex justify-between text-lg">
              <span className="font-semibold text-accent">Total Return</span>
              <span className="font-bold text-accent">₦{(calculations.totalReturn / 1000000).toFixed(1)}M</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <button className="px-8 py-4 bg-copper-gradient text-white rounded-xl font-accent font-semibold hover:shadow-2xl hover:scale-105 transition-all">
            Download Full Investment Pack
          </button>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ icon, label, value, subtitle, highlight = false }: any) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`p-6 rounded-xl ${
        highlight
          ? 'bg-copper-gradient text-white'
          : 'bg-surface'
      }`}
    >
      <div className={`${highlight ? 'text-white' : 'text-accent'} mb-3`}>
        {icon}
      </div>
      <div className={`text-3xl font-heading font-bold mb-1 ${highlight ? 'text-white' : 'text-text'}`}>
        {value}
      </div>
      <div className={`text-sm font-medium mb-1 ${highlight ? 'text-white' : 'text-text/70'}`}>
        {label}
      </div>
      <div className={`text-xs ${highlight ? 'text-white/80' : 'text-text/50'}`}>
        {subtitle}
      </div>
    </motion.div>
  )
}
