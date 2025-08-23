'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import UpdatesSection from '@/components/updates/UpdatesSection'
import { UpdatesProvider, useUpdates } from '@/contexts/UpdatesContext'

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
  { href: '#daily-updates', label: 'Daily Updates', conditional: true }
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
  defaultYear: 2020,
  // Year-specific content for the carousel
  yearContent: {
    2020: {
      memories: [
        { id: 1, title: 'First Ganesha Idol', description: 'Our inaugural celebration', image: '/memories/2020-1.jpg', gradient: 'from-orange-100 to-pink-100', border: 'border-orange-200', iconColor: 'text-orange-400' },
        { id: 2, title: 'Family Gathering', description: 'Loved ones coming together', image: '/memories/2020-2.jpg', gradient: 'from-yellow-100 to-orange-100', border: 'border-yellow-200', iconColor: 'text-yellow-400' },
        { id: 3, title: 'Prayer Ceremony', description: 'Sacred moments of devotion', image: '/memories/2020-3.jpg', gradient: 'from-pink-100 to-red-100', border: 'border-pink-200', iconColor: 'text-pink-400' },
        { id: 4, title: 'Festival Decorations', description: 'Beautiful traditional setup', image: '/memories/2020-4.jpg', gradient: 'from-green-100 to-blue-100', border: 'border-green-200', iconColor: 'text-green-400' },
        { id: 5, title: 'Community Celebration', description: 'Sharing joy with neighbors', image: '/memories/2020-5.jpg', gradient: 'from-purple-100 to-indigo-100', border: 'border-purple-200', iconColor: 'text-purple-400' }
      ]
    },
    2021: {
      memories: [
        { id: 1, title: 'Enhanced Decorations', description: 'More elaborate festival setup', image: '/memories/2021-1.jpg', gradient: 'from-blue-100 to-cyan-100', border: 'border-blue-200', iconColor: 'text-blue-400' },
        { id: 2, title: 'Cultural Programs', description: 'Music and dance performances', image: '/memories/2021-2.jpg', gradient: 'from-indigo-100 to-purple-100', border: 'border-indigo-200', iconColor: 'text-indigo-400' },
        { id: 3, title: 'Youth Participation', description: 'Younger generation involvement', image: '/memories/2021-3.jpg', gradient: 'from-teal-100 to-green-100', border: 'border-teal-200', iconColor: 'text-teal-400' },
        { id: 4, title: 'Traditional Recipes', description: 'Festival delicacies preparation', image: '/memories/2021-4.jpg', gradient: 'from-red-100 to-pink-100', border: 'border-red-200', iconColor: 'text-red-400' },
        { id: 5, title: 'Spiritual Learning', description: 'Understanding festival significance', image: '/memories/2021-5.jpg', gradient: 'from-amber-100 to-yellow-100', border: 'border-amber-200', iconColor: 'text-amber-400' }
      ]
    },
    2022: {
      memories: [
        { id: 1, title: 'Virtual Celebrations', description: 'Online festival participation', image: '/memories/2022-1.jpg', gradient: 'from-emerald-100 to-teal-100', border: 'border-emerald-200', iconColor: 'text-emerald-400' },
        { id: 2, title: 'Social Media Sharing', description: 'Connecting with global devotees', image: '/memories/2022-2.jpg', gradient: 'from-violet-100 to-purple-100', border: 'border-violet-200', iconColor: 'text-violet-400' },
        { id: 3, title: 'Online Pujas', description: 'Digital prayer ceremonies', image: '/memories/2022-3.jpg', gradient: 'from-rose-100 to-pink-100', border: 'border-rose-200', iconColor: 'text-rose-400' },
        { id: 4, title: 'E-Learning Sessions', description: 'Digital cultural education', image: '/memories/2022-4.jpg', gradient: 'from-sky-100 to-blue-100', border: 'border-sky-200', iconColor: 'text-sky-400' },
        { id: 5, title: 'Global Community', description: 'International festival connections', image: '/memories/2022-5.jpg', gradient: 'from-lime-100 to-green-100', border: 'border-lime-200', iconColor: 'text-lime-400' }
      ]
    },
    2023: {
      memories: [
        { id: 1, title: 'Reunion Celebrations', description: 'Physical gatherings resume', image: '/memories/2023-1.jpg', gradient: 'from-orange-100 to-amber-100', border: 'border-orange-200', iconColor: 'text-orange-400' },
        { id: 2, title: 'Cultural Revival', description: 'Traditional arts and crafts', image: '/memories/2023-2.jpg', gradient: 'from-pink-100 to-rose-100', border: 'border-pink-200', iconColor: 'text-pink-400' },
        { id: 3, title: 'Community Bonding', description: 'Strengthening neighborhood ties', image: '/memories/2023-3.jpg', gradient: 'from-blue-100 to-indigo-100', border: 'border-blue-200', iconColor: 'text-blue-400' },
        { id: 4, title: 'Traditional Games', description: 'Festival entertainment activities', image: '/memories/2023-4.jpg', gradient: 'from-green-100 to-emerald-100', border: 'border-green-200', iconColor: 'text-green-400' },
        { id: 5, title: 'Spiritual Growth', description: 'Deepening devotional practices', image: '/memories/2023-5.jpg', gradient: 'from-purple-100 to-violet-100', border: 'border-purple-200', iconColor: 'text-purple-400' }
      ]
    },
    2024: {
      memories: [
        { id: 1, title: 'Smart Celebrations', description: 'Technology-enhanced festivals', image: '/memories/2024-1.jpg', gradient: 'from-cyan-100 to-blue-100', border: 'border-cyan-200', iconColor: 'text-cyan-400' },
        { id: 2, title: 'Eco-Friendly Practices', description: 'Sustainable festival approach', image: '/memories/2024-2.jpg', gradient: 'from-emerald-100 to-green-100', border: 'border-emerald-200', iconColor: 'text-emerald-400' },
        { id: 3, title: 'Digital Documentation', description: 'Preserving memories digitally', image: '/memories/2024-3.jpg', gradient: 'from-violet-100 to-purple-100', border: 'border-violet-200', iconColor: 'text-violet-400' },
        { id: 4, title: 'Global Outreach', description: 'Connecting with worldwide devotees', image: '/memories/2024-4.jpg', gradient: 'from-rose-100 to-pink-100', border: 'border-rose-200', iconColor: 'text-rose-400' },
        { id: 5, title: 'Future Vision', description: 'Planning next year celebrations', image: '/memories/2024-5.jpg', gradient: 'from-amber-100 to-orange-100', border: 'border-amber-200', iconColor: 'text-amber-400' }
      ]
    }
  }
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
const NavigationItem = ({ href, label, className = '' }) => {
  const handleClick = (e) => {
    if (href.startsWith('#')) {
      e.preventDefault()
      const element = document.querySelector(href)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  return (
    <a 
      href={href} 
      className={`text-gray-700 hover:text-[#8B4513] transition-colors cursor-pointer ${className}`}
      onClick={handleClick}
    >
      {label}
    </a>
  )
}

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

const PhotoGridItem = ({ config, className = '', index = 0 }) => {
  // Determine width based on index for alternating pattern
  const isWide = index % 2 === 0
  const widthClass = isWide ? 'w-96' : 'w-56'

  return (
    <div 
      className={`flex-shrink-0 ${widthClass} h-56 bg-gradient-to-br ${config.gradient} rounded-2xl border ${config.border} flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl ${className}`}
    >
      <div className="text-center text-gray-600">
        <svg className={`w-16 h-16 mx-auto mb-3 ${config.iconColor}`} fill="currentColor" viewBox="0 0 24 24">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
        </svg>
      </div>
    </div>
  )
}



// Optimized game card component
const GameCard = ({ game, className = '' }) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      <div className="bg-[#CD5C5C] rounded-3xl p-6 md:p-12 shadow-2xl relative overflow-hidden">
        {/* Game Tag */}
        <div className="inline-block bg-white text-black px-4 py-2 rounded-full text-sm font-medium mb-4 md:mb-8 border border-black">
          {game.tag}
        </div>

        {/* Desktop Layout: Image Left, Content Right */}
        <div className="md:flex md:items-center md:gap-12">
          {/* Left Side - Illustration Section */}
          <div className="md:w-1/2 relative mb-4 md:mb-0">
            {/* Light blob background */}
            <div className="w-48 md:w-64 h-32 md:h-40 mx-auto md:mx-0 md:ml-8 bg-white/20 rounded-full blur-sm mb-3 md:mb-4"></div>
            
            {/* Main illustration with figures */}
            <div className="relative z-10">
              {!imageLoaded && !imageError && (
                <div className="w-48 md:w-80 h-32 md:h-52 mx-auto md:mx-0 bg-white/20 rounded-2xl flex items-center justify-center image-loading">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}
              
              {!imageError ? (
                <img 
                  src="/object.svg" 
                  alt="Guess My Ganesha Game Illustration" 
                  className={`w-48 md:w-80 h-32 md:h-52 mx-auto md:mx-0 object-contain transition-opacity duration-300 ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-48 md:w-80 h-32 md:h-52 mx-auto md:mx-0 bg-white/20 rounded-2xl flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="text-4xl mb-2">🎮</div>
                    <p className="text-sm">Game Illustration</p>
                  </div>
                </div>
              )}
            </div>

            {/* Floating question marks - restored to original inline positioning */}
            <div className="absolute top-0 left-8 md:left-20 text-3xl md:text-4xl text-orange-300 animate-bounce">?</div>
            <div className="absolute top-4 right-12 md:right-24 text-2xl md:text-3xl text-orange-200 animate-bounce-delay-1">?</div>
            <div className="absolute bottom-8 left-16 md:left-28 text-xl md:text-2xl text-orange-100 animate-bounce-delay-2">?</div>
          </div>

          {/* Right Side - Content */}
          <div className="md:w-1/2 md:text-left text-center">
            {/* Game Title */}
            <h3 className="text-2xl md:text-4xl font-bold text-white mb-3 md:mb-6">
              {game.title}
            </h3>

            {/* Game Description */}
            <p className="text-white/90 mb-6 md:mb-10 text-sm md:text-base leading-relaxed max-w-sm md:max-w-lg mx-auto md:mx-0">
              {game.description}
            </p>

            {/* Play Now Button */}
            <Link href="/games?showGames=true">
              <Button className="bg-black hover:bg-gray-800 text-white px-8 md:px-12 py-4 md:py-5 rounded-full text-lg md:text-xl font-semibold w-full md:w-auto transition-all duration-300 hover:scale-105 shadow-lg">
                Play Now
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function HomeContent() {
  const { user, loading } = useSupabaseAuth()
  const { hasUpdates } = useUpdates()
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

  // Get current year content
  const currentYearContent = useMemo(() => {
    return JOURNEY_CONFIG.yearContent[selectedYear] || JOURNEY_CONFIG.yearContent[JOURNEY_CONFIG.defaultYear]
  }, [selectedYear])

  // Filter navigation items based on conditions (e.g., updates availability)
  const filteredNavigationItems = useMemo(() => {
    return NAVIGATION_ITEMS.filter(item => {
      if (item.conditional) {
        return hasUpdates
      }
      return true
    })
  }, [hasUpdates])

  // Split memories into two rows for alternating animation
  const { row1Memories, row2Memories } = useMemo(() => {
    const memories = currentYearContent?.memories || []
    const midPoint = Math.ceil(memories.length / 2)
    return {
      row1Memories: memories.slice(0, midPoint),
      row2Memories: memories.slice(midPoint)
    }
  }, [currentYearContent])

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
            {filteredNavigationItems.map((item) => (
              <NavigationItem key={item.href} {...item} />
            ))}
            
            <LanguageSelector />
            <Link href="/games">
              <CTAButton>{SITE_CONFIG.ctaText}</CTAButton>
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
                <NavigationItem key={item.href} {...item} className="block py-2" />
              ))}
              
                              <div className="pt-4 border-t border-gray-100">
                  <LanguageSelector className="mb-4" />
                  <Link href="/games">
                    <CTAButton className="w-full">{SITE_CONFIG.ctaText}</CTAButton>
                  </Link>
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

              {/* Mobile: Ganesh Image below heading */}
              <div className="lg:hidden flex justify-center mb-6">
                <div className="relative">
                  <img 
                    src={SITE_CONFIG.heroImage} 
                    alt={SITE_CONFIG.heroImageAlt} 
                    className="w-80 h-80 object-contain"
                  />
                </div>
              </div>

              <p className="text-lg text-gray-600 leading-relaxed max-w-lg">
                {SITE_CONFIG.description}
              </p>

              <Link href="/games">
                <CTAButton className="px-8 py-4 text-lg font-semibold">
                  {SITE_CONFIG.ctaText}
                </CTAButton>
              </Link>
            </div>

            {/* Desktop: Right Image */}
            <div className="hidden lg:flex justify-end">
              <div className="relative">
                <img 
                  src={SITE_CONFIG.heroImage} 
                  alt={SITE_CONFIG.heroImageAlt} 
                  className="w-[500px] h-[500px] object-contain"
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

          {/* Game Card - Updated Design */}
          <GameCard game={GAME_CONFIG.game} />
        </div>
      </section>

      {/* 5-Year Journey Section */}
      <section id="about" className="px-4 py-16 md:py-24 md:px-8 lg:px-16 bg-white">
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
            {/* Loading state */}
            {!currentYearContent && (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B4513] mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading memories...</p>
                </div>
              </div>
            )}

            {/* Empty state */}
            {currentYearContent && (!row1Memories.length && !row2Memories.length) && (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📸</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Memories Yet</h3>
                <p className="text-gray-600">Memories for {selectedYear} will be added soon!</p>
              </div>
            )}

            {/* Carousel content */}
            {currentYearContent && row1Memories.length > 0 && (
              <>
                {/* First Row - Moving Left with Duplicated Content */}
                <div className="flex gap-4 mb-6 animate-move-left">
                  {/* Original content */}
                  {row1Memories.map((memory, index) => (
                    <PhotoGridItem key={`row1-orig-${memory.id}`} config={memory} index={index} />
                  ))}
                  {/* Duplicated content for seamless loop */}
                  {row1Memories.map((memory, index) => (
                    <PhotoGridItem key={`row1-dupe-${memory.id}`} config={memory} index={index} />
                  ))}
                </div>
                
                {/* Second Row - Moving Right with Duplicated Content */}
                {row2Memories.length > 0 && (
                  <div className="flex gap-4 justify-end animate-move-right">
                    {/* Original content */}
                    {row2Memories.map((memory, index) => (
                      <PhotoGridItem key={`row2-orig-${memory.id}`} config={memory} index={index} />
                    ))}
                    {/* Duplicated content for seamless loop */}
                    {row2Memories.map((memory, index) => (
                      <PhotoGridItem key={`row2-dupe-${memory.id}`} config={memory} index={index} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* View All Button */}
          <div className="text-center">
            <Button className="bg-black hover:bg-gray-800 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-300">
              View All
            </Button>
          </div>
        </div>
      </section>

      {/* Updates Section */}
      <section id="daily-updates">
        <UpdatesSection />
      </section>

      {/* Footer */}
      <footer className="relative bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 text-gray-800 px-4 py-12 md:px-8 lg:px-16 overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-32 h-32 bg-amber-200 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-orange-200 rounded-full blur-3xl"></div>
        </div>
        
        {/* Subtle dot pattern overlay */}
        <div className="absolute inset-0 opacity-8">
          <div className="w-full h-full" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(245, 101, 101, 0.08) 1px, transparent 0)`,
            backgroundSize: '30px 30px'
          }}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left - Logo and Copyright */}
            <div className="space-y-4">
              <div className="text-2xl font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 bg-clip-text text-transparent">
                {SITE_CONFIG.title}
              </div>
              <p className="text-gray-600">
                © 2025 {SITE_CONFIG.title} - All Rights Reserved.
              </p>
            </div>

            {/* Right - Navigation */}
            <div className="flex flex-wrap gap-6 md:justify-end">
              {NAVIGATION_ITEMS.map((item) => (
                <a 
                  key={item.href} 
                  href={item.href} 
                  className="text-gray-600 hover:text-amber-600 transition-colors duration-300"
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

export default function Home() {
  return (
    <UpdatesProvider>
      <HomeContent />
    </UpdatesProvider>
  )
}
