'use client'

import { YEAR_ALL } from '@/lib/year'

// Year pills for the admin sections that accumulate records every festival.
// Mirrors the year navigation already used on the home page gallery.

export default function YearFilter({ years, value, onChange, className = '' }) {
  const options = [{ key: YEAR_ALL, label: 'All years' }, ...years.map((y) => ({ key: y, label: String(y) }))]

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Year</span>
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          onClick={() => onChange(option.key)}
          className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
            value === option.key
              ? 'bg-[#8B4513] text-white'
              : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
