import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | string, currency: string = 'NGN', locale: string = 'en-NG'): string {
  const num = typeof value === 'string' ? Number(value) : value
  if (!isFinite(Number(num))) return `${currency} ${value}`
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(num))
  } catch {
    // Fallback: simple formatting with thousands separators
    const rounded = Math.round(Number(num))
    return `${currency} ${rounded.toLocaleString()}`
  }
}
