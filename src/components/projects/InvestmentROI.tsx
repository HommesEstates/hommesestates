'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, DollarSign, Percent, Calendar } from 'lucide-react'

interface InvestmentROIProps {
  projectId: string
}

export function InvestmentROI({ projectId }: InvestmentROIProps) {
  const [purchasePrice, setPurchasePrice] = useState(45000000) // ₦45M
  const [annualRent, setAnnualRent] = useState(6000000) // ₦6M annual

  // Smart currency formatter - shows K for thousands, M for millions
  const formatSmartCurrency = (amount: number): string => {
    if (amount >= 1000000000) {
      return `₦${(amount / 1000000000).toFixed(1)}B`
    } else if (amount >= 1000000) {
      return `₦${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `₦${(amount / 1000).toFixed(0)}K`
    }
    return `₦${amount}`
  }

  const calculations = useMemo(() => {
    // Annual rental income (no occupancy adjustment - single unit, single occupant)
    const annualRentIncome = annualRent
    const managementFee = annualRentIncome * 0.05
    const netAnnualIncome = annualRentIncome - managementFee
    const grossYield = (annualRentIncome / purchasePrice) * 100
    const netYield = (netAnnualIncome / purchasePrice) * 100
    
    // 5-year projection (8% annual appreciation)
    const futureValue = purchasePrice * Math.pow(1.08, 5)
    const totalRentalIncome = netAnnualIncome * 5
    const totalReturn = (futureValue - purchasePrice) + totalRentalIncome
    const roi = (totalReturn / purchasePrice) * 100

    return {
      annualRentIncome,
      netAnnualIncome,
      grossYield,
      netYield,
      futureValue,
      totalRentalIncome,
      totalReturn,
      roi
    }
  }, [purchasePrice, annualRent])

  return (
    <div className="bg-white/80 dark:bg-[#030712]/50 backdrop-blur-2xl border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden transition-colors duration-500">
      <div className="p-8 bg-copper-gradient text-white border-b border-gray-200 dark:border-white/10">
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
              <span className="text-sm font-medium text-text/70 dark:text-white/70">Purchase Price</span>
              <span className="text-lg font-bold text-accent">
                {formatSmartCurrency(purchasePrice)}
              </span>
            </label>
            <input
              type="range"
              min="10000000"
              max="200000000"
              step="5000000"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent"
            />
            <div className="flex justify-between text-xs text-text/50 dark:text-white/50 mt-1 font-light">
              <span>₦10M</span>
              <span>₦200M</span>
            </div>
          </div>

          {/* Annual Rent */}
          <div>
            <label className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-text/70 dark:text-white/70">Annual Rental Income</span>
              <span className="text-lg font-bold text-accent">
                {formatSmartCurrency(annualRent)}
              </span>
            </label>
            <input
              type="range"
              min="1000000"
              max="50000000"
              step="500000"
              value={annualRent}
              onChange={(e) => setAnnualRent(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent"
            />
            <div className="flex justify-between text-xs text-text/50 dark:text-white/50 mt-1 font-light">
              <span>₦1M</span>
              <span>₦50M</span>
            </div>
          </div>

          {/* Note about occupancy */}
          <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
            <p className="text-xs text-text/60 dark:text-white/60">
              <strong className="text-text/80 dark:text-white/80">Note:</strong> Calculations assume 100% occupancy for a single unit. Management fee of 5% is deducted from annual rental income.
            </p>
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
            value={formatSmartCurrency(calculations.netAnnualIncome)}
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
        <div className="p-6 bg-accent/5 dark:bg-white/5 rounded-2xl border border-accent/20 dark:border-white/10 backdrop-blur-md">
          <h3 className="font-heading font-semibold mb-4 text-gray-900 dark:text-white">5-Year Projection</h3>
          <div className="space-y-3 font-light text-sm">
            <div className="flex justify-between">
              <span className="text-text/70 dark:text-white/70">Property Value (8% appreciation)</span>
              <span className="font-semibold text-gray-900 dark:text-white">{formatSmartCurrency(calculations.futureValue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text/70 dark:text-white/70">Total Rental Income</span>
              <span className="font-semibold text-gray-900 dark:text-white">{formatSmartCurrency(calculations.totalRentalIncome)}</span>
            </div>
            <div className="h-px bg-gray-200 dark:bg-white/10 my-2" />
            <div className="flex justify-between text-lg mt-4">
              <span className="font-semibold text-accent dark:text-orange-400">Total Return</span>
              <span className="font-bold text-accent dark:text-orange-400">{formatSmartCurrency(calculations.totalReturn)}</span>
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
      className={`p-6 rounded-2xl border transition-colors duration-500 ${
        highlight
          ? 'bg-copper-gradient text-white border-transparent'
          : 'bg-white/50 dark:bg-white/5 border-gray-200 dark:border-white/10'
      }`}
    >
      <div className={`${highlight ? 'text-white' : 'text-accent dark:text-orange-400'} mb-3`}>
        {icon}
      </div>
      <div className={`text-3xl font-heading font-bold mb-1 ${highlight ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
        {value}
      </div>
      <div className={`text-sm font-medium mb-1 ${highlight ? 'text-white' : 'text-text/70 dark:text-white/70'}`}>
        {label}
      </div>
      <div className={`text-xs font-light ${highlight ? 'text-white/80' : 'text-text/50 dark:text-white/50'}`}>
        {subtitle}
      </div>
    </motion.div>
  )
}
