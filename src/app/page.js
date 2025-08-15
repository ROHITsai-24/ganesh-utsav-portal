'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

// Configuration objects for dynamic content
const SITE_CONFIG = {
  title: 'Unprofessional Players',
  tagline: 'Celebrate Ganesh Chaturthi with Joy and Devotion!',
  description: "We've created this space to honor Lord Ganesha and bring the vibrant energy of the festival right to your screen. Join us in celebrating with a joyful heart and a blessed spirit!",
  ctaText: 'Guess the Ganesha Idol',
  heroImage: '/ganesha.png',
  heroImageAlt: 'Lord Ganesha - Watercolor illustration with mandala backdrop'
}

const NAVIGATION_ITEMS = [
  { href: '#about', label: 'About' },
  { href: '#games', label: 'Games' },
  { href: '#donation', label: 'Donation' },
  { href: '#lucky-draw', label: 'Lucky-draw' }
]

const GAME_CONFIG = {
  title: 'Ganpati Games',
  subtitle: 'Play, Learn, and Win Rewards',
  description: 'Get ready for some divine fun! Our Ganpati Games section is packed with challenges designed to entertain and enlighten.',
  game: {
    tag: 'Game 01',
    title: 'Guess My Ganesha',
    description: 'A fun festive quiz to test your eye for Bappa\'s idol, price, and height. Play, guess and see who knows Ganesha best!'
  }
}

const JOURNEY_CONFIG = {
  title: 'Our 5-Year Devotional Journey',
  description: 'A heartfelt collection of photos and stories chronicling a five-year journey of celebrating Ganesh Chaturthi, sharing the spirit and cherished memories of the festival.',
  years: [2020, 2021, 2022, 2023, 2024],
  defaultYear: 2020
}

const PHOTO_GRID_CONFIG = {
  row1: [
    { width: 'w-96', height: 'h-56', gradient: 'from-orange-100 to-pink-100', border: 'border-orange-200', iconColor: 'text-orange-400', label: 'Festival Memory 1' },
    { width: 'w-56', height: 'h-56', gradient: 'from-yellow-100 to-orange-100', border: 'border-yellow-200', iconColor: 'text-yellow-400', label: 'Celebration 2' },
    { width: 'w-96', height: 'h-56', gradient: 'from-pink-100 to-red-100', border: 'border-pink-200', iconColor: 'text-pink-400', label: 'Memory 3' },
    { width: 'w-56', height: 'h-56', gradient: 'from-green-100 to-blue-100', border: 'border-green-200', iconColor: 'text-green-400', label: 'Joy 4' },
    { width: 'w-96', height: 'h-56', gradient: 'from-purple-100 to-indigo-100', border: 'border-purple-200', iconColor: 'text-purple-400', label: 'Festival 5' }
  ],
  row2: [
    { width: 'w-56', height: 'h-56', gradient: 'from-blue-100 to-cyan-100', border: 'border-blue-200', iconColor: 'text-blue-400', label: 'Devotion 6' },
    { width: 'w-96', height: 'h-56', gradient: 'from-indigo-100 to-purple-100', border: 'border-indigo-200', iconColor: 'text-indigo-400', label: 'Spirit 7' },
    { width: 'w-56', height: 'h-56', gradient: 'from-teal-100 to-green-100', border: 'border-teal-200', iconColor: 'text-teal-400', label: 'Unity 8' },
    { width: 'w-96', height: 'h-56', gradient: 'from-red-100 to-pink-100', border: 'border-red-200', iconColor: 'text-red-400', label: 'Tradition 9' },
    { width: 'w-56', height: 'h-56', gradient: 'from-amber-100 to-yellow-100', border: 'border-amber-200', iconColor: 'text-amber-400', label: 'Blessing 10' }
  ]
}

// Custom hook for Supabase authentication
const useSupabaseAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables')
      setLoading(false)
      return
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user || null)
      } catch (error) {
        console.error('Error getting session:', error)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}

// Reusable components
const NavigationItem = ({ href, label, className = '' }) => (
  <a 
    href={href} 
    className={`text-gray-700 hover:text-[#8B4513] transition-colors ${className}`}
  >
    {label}
  </a>
)

const LanguageSelector = ({ className = '' }) => (
  <div className={`flex items-center space-x-2 text-gray-700 ${className}`}>
    <span>English</span>
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  </div>
)

const CTAButton = ({ children, className = '', ...props }) => (
  <Button 
    className={`bg-[#8B4513] hover:bg-[#A0522D] text-white px-6 py-3 rounded-full ${className}`}
    {...props}
  >
    {children}
  </Button>
)

const SectionTag = ({ children, className = '' }) => (
  <div className={`inline-block bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-medium ${className}`}>
    {children}
  </div>
)

const GradientHeading = ({ children, className = '' }) => (
  <span className={`bg-gradient-to-r from-[#782A0F] to-[#DE4E1C] bg-clip-text text-transparent ${className}`}>
    {children}
  </span>
)

const PhotoGridItem = ({ config, className = '' }) => (
  <div className={`flex-shrink-0 ${config.width} ${config.height} bg-gradient-to-br ${config.gradient} rounded-2xl border ${config.border} flex items-center justify-center shadow-lg ${className}`}>
    <div className="text-center text-gray-600">
      <svg className={`w-16 h-16 mx-auto mb-3 ${config.iconColor}`} fill="currentColor" viewBox="0 0 24 24">
        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
      </svg>
      <p className="text-sm font-medium">{config.label}</p>
    </div>
  </div>
)

export default function Home() {
  const { user, loading } = useSupabaseAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [selectedYear, setSelectedYear] = useState(JOURNEY_CONFIG.defaultYear)

  // Memoized handlers
  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => !prev)
  }, [])

  const handleYearSelect = useCallback((year) => {
    setSelectedYear(year)
  }, [])

  // Memoized computed values
  const isYearSelected = useCallback((year) => year === selectedYear, [selectedYear])

  const yearButtonClasses = useCallback((year) => {
    const baseClasses = 'px-3 py-2 md:px-6 md:py-3 rounded-full font-medium transition-all duration-300 text-sm md:text-base'
    return isYearSelected(year)
      ? `${baseClasses} bg-black text-white`
      : `${baseClasses} bg-white text-gray-700 border border-gray-200 hover:border-gray-300`
  }, [isYearSelected])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFCFA] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B4513] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDFCFA]">
      {/* Header/Navigation */}
      <header className="relative z-50 px-4 py-6 md:px-8 lg:px-16 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <nav className="max-w-[85rem] mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="text-2xl font-bold text-[#8B4513]">
            {SITE_CONFIG.title}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {NAVIGATION_ITEMS.map((item) => (
              <NavigationItem key={item.href} {...item} />
            ))}
            
            <LanguageSelector />
            <CTAButton>{SITE_CONFIG.ctaText}</CTAButton>
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
              {NAVIGATION_ITEMS.map((item) => (
                <NavigationItem key={item.href} {...item} className="block py-2" />
              ))}
              
              <div className="pt-4 border-t border-gray-100">
                <LanguageSelector className="mb-4" />
                <CTAButton className="w-full">{SITE_CONFIG.ctaText}</CTAButton>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="px-4 py-16 md:py-24 lg:py-32 md:px-8 lg:px-12">
        <div className="max-w-[85rem] mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <SectionTag>Ganesh Chaturthi 2025</SectionTag>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight max-w-2xl md:max-w-3xl lg:max-w-4xl">
                <GradientHeading>{SITE_CONFIG.tagline}</GradientHeading>
              </h1>

              <p className="text-lg text-gray-600 leading-relaxed max-w-lg">
                {SITE_CONFIG.description}
              </p>

              <CTAButton className="px-8 py-4 text-lg font-semibold">
                {SITE_CONFIG.ctaText}
              </CTAButton>
            </div>

            {/* Right Image */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                <img 
                  src={SITE_CONFIG.heroImage} 
                  alt={SITE_CONFIG.heroImageAlt} 
                  className="w-96 h-96 md:w-[500px] md:h-[500px] object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ganpati Games Section */}
      <section id="games" className="px-4 py-16 md:py-24 md:px-8 lg:px-16 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <SectionTag className="mb-6">{GAME_CONFIG.title}</SectionTag>

          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <GradientHeading>{GAME_CONFIG.title}</GradientHeading>
          </h2>
          <p className="text-3xl md:text-4xl font-bold mb-8">
            <GradientHeading>{GAME_CONFIG.subtitle}</GradientHeading>
          </p>

          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
            {GAME_CONFIG.description}
          </p>

          {/* Game Card */}
          <Card className="bg-gradient-to-br from-pink-50 to-orange-50 border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <SectionTag className="mb-6">{GAME_CONFIG.game.tag}</SectionTag>

              <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
                {GAME_CONFIG.game.title}
              </h3>

              <p className="text-gray-600 mb-8 max-w-lg mx-auto">
                {GAME_CONFIG.game.description}
              </p>

              <Link href="/games">
                <Button className="bg-black hover:bg-gray-800 text-white px-8 py-3 rounded-full text-lg font-semibold">
                  Play Now
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 5-Year Journey Section */}
      <section className="px-4 py-16 md:py-24 md:px-8 lg:px-16 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <SectionTag className="mb-6">Our Story</SectionTag>

          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <GradientHeading>{JOURNEY_CONFIG.title}</GradientHeading>
          </h2>
          
          <p className="text-lg text-gray-600 mb-12 max-w-3xl mx-auto">
            {JOURNEY_CONFIG.description}
          </p>

          {/* Year Navigation */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-12 px-4">
            {JOURNEY_CONFIG.years.map((year) => (
              <button
                key={year}
                className={yearButtonClasses(year)}
                onClick={() => handleYearSelect(year)}
              >
                {year}
              </button>
            ))}
          </div>

          {/* Asymmetric Photo Grid - Full Width Breaking Container */}
          <div className="relative w-screen left-1/2 -ml-[50vw] overflow-hidden mb-12">
            {/* First Row - Moving Left with Alternating Rectangle/Square */}
            <div className="flex gap-4 mb-6 animate-move-left">
              {PHOTO_GRID_CONFIG.row1.map((config, index) => (
                <PhotoGridItem key={`row1-${index}`} config={config} />
              ))}
            </div>
            
            {/* Second Row - Moving Right with Alternating Rectangle/Square */}
            <div className="flex gap-4 justify-end animate-move-right">
              {PHOTO_GRID_CONFIG.row2.map((config, index) => (
                <PhotoGridItem key={`row2-${index}`} config={config} />
              ))}
            </div>
          </div>

          {/* View All Button */}
          <div className="text-center">
            <Button className="bg-black hover:bg-gray-800 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-300">
              View All
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white px-4 py-12 md:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left - Logo and Copyright */}
            <div className="space-y-4">
              <div className="text-2xl font-bold text-[#8B4513]">
                {SITE_CONFIG.title}
              </div>
              <p className="text-gray-400">
                @2025 {SITE_CONFIG.title} - All Rights Reserved.
              </p>
            </div>

            {/* Right - Navigation */}
            <div className="flex flex-wrap gap-6 md:justify-end">
              {NAVIGATION_ITEMS.map((item) => (
                <a 
                  key={item.href} 
                  href={item.href} 
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
