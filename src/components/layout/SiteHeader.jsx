'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { useUpdates } from '@/contexts/UpdatesContext'
import { NAVIGATION_ITEMS } from '@/lib/navigation'
import CTAButton from '@/components/common/CTAButton'
import BrandLogo from '@/components/common/BrandLogo'

// Shared site header. Markup is unchanged from the original home page header,
// extracted so the home page and the donation page stay identical.

const NavigationItem = ({ href, labelKey, className = '', updatesCount = 0 }) => {
  const { translations } = useLanguage()

  const handleClick = (e) => {
    // Only same-page section links are intercepted for smooth scrolling. From
    // any other page the link navigates home and the browser jumps to the hash.
    if (!href.startsWith('/#')) return
    if (typeof window === 'undefined' || window.location.pathname !== '/') return

    e.preventDefault()
    const element = document.querySelector(href.slice(1))
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const isDailyUpdates = labelKey === 'dailyUpdates'
  const showBadge = isDailyUpdates && updatesCount > 0

  return (
    <div className="relative flex items-center">
      <Link
        href={href}
        className={`text-gray-700 hover:text-[#8B4513] transition-colors cursor-pointer ${className}`}
        onClick={handleClick}
      >
        {translations[labelKey]}
      </Link>
      {showBadge && (
        <div className="ml-2 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
          {updatesCount}
        </div>
      )}
    </div>
  )
}

const LanguageSelector = ({ className = '' }) => {
  const { language, toggleLanguage } = useLanguage()

  return (
    <button
      onClick={toggleLanguage}
      className={`flex items-center space-x-2 font-bold cursor-pointer ${className}`}
    >
      <span className={language === 'en' ? 'text-[#8B4513]' : 'text-[#8B4513]/50'}>
        English
      </span>
      <span className="text-gray-700">|</span>
      <span className={language === 'te' ? 'text-[#8B4513]' : 'text-[#8B4513]/50'}>
        తెలుగు
      </span>
    </button>
  )
}

export default function SiteHeader() {
  const { translations } = useLanguage()
  const { hasUpdates, updatesCount } = useUpdates()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev)
  }, [])

  const filteredNavigationItems = useMemo(
    () => NAVIGATION_ITEMS.filter((item) => (item.conditional ? hasUpdates : true)),
    [hasUpdates]
  )

  return (
    <header className="relative z-50 px-4 py-3 md:py-6 md:px-8 lg:px-16 bg-white/80 backdrop-blur-sm border-b border-gray-100">
      <nav className="max-w-[85rem] mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 md:gap-3 min-w-0">
          <BrandLogo className="h-8 w-8 md:h-10 md:w-10" />
          {/* Slightly smaller on mobile so the mark and the name fit together
              on narrow phones without wrapping. */}
          <span className="text-xl md:text-2xl font-bold text-[#8B4513] truncate">
            {translations.title}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          {filteredNavigationItems.map((item) => (
            <NavigationItem
              key={item.href}
              {...item}
              updatesCount={item.labelKey === 'dailyUpdates' ? updatesCount : 0}
            />
          ))}

          <LanguageSelector />

          <Link href="/games">
            <CTAButton>{translations.ctaText}</CTAButton>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-100 shadow-lg">
          <div className="px-4 py-6 space-y-4">
            {filteredNavigationItems.map((item) => (
              <NavigationItem
                key={item.href}
                {...item}
                className="block py-2"
                updatesCount={item.labelKey === 'dailyUpdates' ? updatesCount : 0}
              />
            ))}

            <div className="pt-4 border-t border-gray-100">
              <LanguageSelector className="mb-4" />

              <Link href="/games">
                <CTAButton className="w-full">{translations.ctaText}</CTAButton>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
