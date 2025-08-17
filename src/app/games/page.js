'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthForm from '@/components/auth/AuthForm'
import GuessGame from '@/components/game/GuessGame'
import PuzzleGame from '@/components/game/PuzzleGame'
import Link from 'next/link'

// Configuration objects for dynamic content
const GAMES_CONFIG = {
  title: 'Choose Your Game',
  subtitle: 'Select a game to start playing and competing!',
  loadingSpinner: {
    size: 'h-32 w-32',
    color: 'border-purple-600'
  }
}

const NAVIGATION_CONFIG = {
  backToHome: '← Back to Home',
  backToGamesHome: '← Back to Games Home',
  adminDashboard: 'Admin Dashboard',
  signOut: 'Sign Out',
  welcome: {
    title: 'Welcome to Games',
    subtitle: 'Sign in or create an account to start playing'
  }
}

const HOMEPAGE_CONFIG = {
  logo: {
    text: 'UP',
    companyName: 'Unprofessional Players'
  },
  navigation: [
    { href: '#home', label: 'Home' },
    { href: '#about', label: 'About' },
    { href: '#games', label: 'Games' },
    { href: '#festivals', label: 'Festivals' },
    { href: '#contact', label: 'Contact' }
  ],
  hero: {
    title: 'Welcome to',
    companyName: 'Unprofessional Players',
    subtitle: 'Experience the thrill of festival gaming with our interactive challenges. Test your skills, compete with friends, and discover amazing prizes!',
    cta: 'Start Playing Now',
    learnMore: 'Learn More'
  },
  stats: [
    { value: '1000+', label: 'Active Players' },
    { value: '50+', label: 'Festivals' },
    { value: '₹1M+', label: 'Prizes Won' }
  ],
  featuredGames: {
    title: 'Featured Games',
    subtitle: 'Challenge yourself with our exciting collection of festival games',
    games: [
      {
        id: 'guess',
        emoji: '🎭',
        title: 'Idol Guess Game',
        description: 'Test your knowledge about idols with our interactive guessing challenges',
        cta: 'Play Now'
      },
      {
        id: 'puzzle',
        emoji: '🧩',
        title: 'Puzzle Challenge',
        description: 'Solve the puzzle within time limit and test your problem-solving skills',
        cta: 'Play Now'
      }
    ]
  }
}

const GAME_TABS = [
  { id: 'guess', label: '🎭 Guess Game', component: GuessGame },
  { id: 'puzzle', label: '🧩 Puzzle Game', component: PuzzleGame }
]

// Custom hook for authentication
const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const checkUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
      }
    } catch (error) {
      console.error('Error checking user session:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkUser()
  }, [checkUser])

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }, [])

  return { user, loading, signOut }
}

// Custom hook for mobile menu
const useMobileMenu = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => !prev)
  }, [])

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false)
  }, [])

  return { mobileMenuOpen, toggleMobileMenu, closeMobileMenu }
}

// Custom hook for game tabs
const useGameTabs = () => {
  const [activeTab, setActiveTab] = useState('guess')

  const switchTab = useCallback((tabId) => {
    setActiveTab(tabId)
  }, [])

  const activeTabConfig = useMemo(() => {
    return GAME_TABS.find(tab => tab.id === activeTab)
  }, [activeTab])

  return { activeTab, switchTab, activeTabConfig }
}

// Custom hook for homepage state
const useHomepageState = () => {
  const [showGames, setShowGames] = useState(false)

  const goToGames = useCallback(() => {
    setShowGames(true)
  }, [])

  const goToHomepage = useCallback(() => {
    setShowGames(false)
  }, [])

  return { showGames, goToGames, goToHomepage }
}

// Reusable components
const LoadingSpinner = ({ size = 'h-32 w-32', color = 'border-purple-600' }) => (
  <div className="min-h-screen flex items-center justify-center">
    <div className={`animate-spin rounded-full ${size} border-b-2 ${color}`}></div>
  </div>
)

const BackButton = ({ href, onClick, children, className = '' }) => {
  if (href) {
    return (
      <Link href={href} className={`inline-flex items-center space-x-2 text-white/80 hover:text-white transition-colors ${className}`}>
        <span>{children}</span>
      </Link>
    )
  }
  
  return (
    <button onClick={onClick || (() => {})} className={`inline-flex items-center space-x-2 text-white/80 hover:text-white transition-colors ${className}`}>
      <span>{children}</span>
    </button>
  )
}

const Logo = ({ text = 'UP', companyName = 'Company' }) => (
  <div className="flex items-center space-x-2">
    <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
      <span className="text-white font-bold text-xl">{text}</span>
    </div>
    <span className="text-white font-bold text-xl md:text-2xl">{companyName}</span>
  </div>
)

const NavigationLinks = ({ links = [], className = '' }) => {
  if (!links || links.length === 0) {
    return null
  }
  
  return (
    <div className={`hidden md:flex items-center space-x-8 ${className}`}>
      {links.map((link) => (
        <a key={link.href} href={link.href} className="text-white/80 hover:text-white transition-colors">
          {link.label}
        </a>
      ))}
    </div>
  )
}

const MobileMenuButton = ({ onClick, className = '' }) => (
  <button className={`md:hidden text-white p-2 ${className}`} onClick={onClick || (() => {})}>
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  </button>
)

const CTAButton = ({ onClick, children, variant = 'primary', className = '' }) => {
  const baseClasses = 'px-6 py-2 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl'
  const variantClasses = {
    primary: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600',
    secondary: 'bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border border-white/20',
    danger: 'bg-red-500 hover:bg-red-600 text-white'
  }

  return (
    <button
      onClick={onClick || (() => {})}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

const StatsSection = ({ stats = [] }) => {
  if (!stats || stats.length === 0) {
    return null
  }
  
  return (
    <div className="grid grid-cols-3 gap-6 pt-8">
      {stats.map((stat, index) => (
        <div key={index} className="text-center">
          <div className="text-3xl md:text-4xl font-bold text-white">{stat.value}</div>
          <div className="text-white/60 text-sm md:text-base">{stat.label}</div>
        </div>
      ))}
    </div>
  )
}

const HeroSection = ({ config = {}, onStartPlaying }) => {
  if (!config || !config.title) {
    return null
  }
  
  return (
    <section id="home" className="relative px-4 py-16 md:py-24 lg:py-32 md:px-8 lg:px-16 w-full">
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center w-full">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                {config.title}{' '}
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent">
                  {config.companyName}
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-white/80 leading-relaxed">
                {config.subtitle}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <CTAButton onClick={onStartPlaying} variant="primary" className="px-8 py-4 text-lg transform hover:scale-105 text-center">
                {config.cta}
              </CTAButton>
              <CTAButton variant="secondary" className="px-8 py-4 text-lg text-center">
                {config.learnMore}
              </CTAButton>
            </div>

            <StatsSection stats={config.stats} />
          </div>

          {/* Right Content - Hero Image/Animation */}
          <HeroVisual />
        </div>

        {/* Background Elements */}
        <BackgroundElements />
      </div>
    </section>
  )
}

const HeroVisual = () => (
  <div className="relative w-full">
    <div className="relative w-full h-80 sm:h-96 md:h-[500px] bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-2xl backdrop-blur-sm border border-white/20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-pink-500/30"></div>

      {/* Floating Elements */}
      <div className="absolute top-4 left-4 sm:top-10 sm:left-10 w-12 h-12 sm:w-20 sm:h-20 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-bounce"></div>
      <div className="absolute top-8 right-4 sm:top-20 sm:right-16 w-10 h-10 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse"></div>
      <div className="absolute bottom-8 left-4 sm:bottom-20 sm:left-16 w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-r from-green-400 to-teal-400 rounded-full animate-bounce" style={{animationDelay: '0.5s'}}></div>

      {/* Central Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-4xl sm:text-6xl md:text-8xl mb-4">🎮</div>
          <div className="text-lg sm:text-2xl md:text-3xl font-bold">Gaming Festival</div>
          <div className="text-sm sm:text-lg md:text-xl opacity-80">Join the Adventure!</div>
        </div>
      </div>
    </div>

    {/* Floating Cards */}
    <FloatingCard position="top-left" emoji="🏆" text="Win Prizes" />
    <FloatingCard position="bottom-right" emoji="🎯" text="Test Skills" delay="1s" />
  </div>
)

const FloatingCard = ({ position, emoji, text, delay = '0s' }) => {
  const positionClasses = {
    'top-left': '-top-3 -left-3 sm:-top-6 sm:-left-6',
    'bottom-right': '-bottom-3 -right-3 sm:-bottom-6 sm:-right-6'
  }

  return (
    <div className={`absolute ${positionClasses[position]} w-24 h-24 sm:w-32 sm:h-32 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 animate-float`} style={{animationDelay: delay}}>
      <div className="p-2 sm:p-4 text-center">
        <div className="text-lg sm:text-2xl mb-1 sm:mb-2">{emoji}</div>
        <div className="text-white text-xs sm:text-sm font-semibold">{text}</div>
      </div>
    </div>
  )
}

const BackgroundElements = () => (
  <div className="absolute inset-0 -z-10 overflow-hidden">
    <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl"></div>
    <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl"></div>
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[800px] max-h-[800px] bg-blue-500/10 rounded-full blur-3xl"></div>
  </div>
)

const FeaturedGamesSection = ({ config = {}, onStartPlaying }) => {
  if (!config || !config.games || config.games.length === 0) {
    return null
  }
  
  return (
    <section className="px-4 py-16 md:px-8 lg:px-16 w-full">
      <div className="max-w-7xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {config.title}
          </h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            {config.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto w-full">
          {config.games.map((game) => (
            <GameCard key={game.id} game={game} onPlay={onStartPlaying} />
          ))}
        </div>
      </div>
    </section>
  )
}

const GameCard = ({ game = {}, onPlay }) => {
  if (!game || !game.id) {
    return null
  }
  
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all group">
      <div className="text-center space-y-4">
        <div className="text-6xl mb-4">{game.emoji}</div>
        <h3 className="text-2xl font-bold text-white">{game.title}</h3>
        <p className="text-white/80">
          {game.description}
        </p>
        <CTAButton onClick={onPlay} variant="primary">
          {game.cta}
        </CTAButton>
      </div>
    </div>
  )
}

const HomepageNavigation = ({ onToggleMobileMenu, onStartPlaying, onSignOut }) => (
  <nav className="relative z-50 px-4 py-4 md:px-8 lg:px-16" style={{ border: 'none' }}>
    <div className="flex items-center justify-between">
      <Logo text={HOMEPAGE_CONFIG?.logo?.text} companyName={HOMEPAGE_CONFIG?.logo?.companyName} />
      <NavigationLinks links={HOMEPAGE_CONFIG?.navigation} />
      <MobileMenuButton onClick={onToggleMobileMenu} />

      {/* Auth Buttons - Hidden on Mobile */}
      <div className="hidden md:flex items-center space-x-4">
        <div className="flex items-center space-x-4">
          <CTAButton onClick={onStartPlaying} variant="primary">
            Play Games
          </CTAButton>
          <CTAButton onClick={onSignOut} variant="danger">
            Sign Out
          </CTAButton>
        </div>
      </div>
    </div>
  </nav>
)

const HomepageMobileMenu = ({ isOpen, onClose, onStartPlaying, onSignOut }) => {
  if (!isOpen) return null

  return (
    <div className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm">
      <div className="fixed top-0 right-0 w-64 h-full bg-gradient-to-b from-purple-900 to-blue-900 shadow-2xl">
        <div className="flex justify-end p-4">
          <button
            onClick={onClose}
            className="text-white p-2 hover:bg-white/10 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="px-6 py-8">
          <div className="space-y-6">
            {HOMEPAGE_CONFIG?.navigation?.map((link) => (
              <a 
                key={link.href} 
                href={link.href} 
                className="block text-white/80 hover:text-white transition-colors text-lg py-2" 
                onClick={onClose}
              >
                {link.label}
              </a>
            ))}

            {/* Mobile-specific action buttons */}
            <div className="pt-6 border-t border-white/20">
              <CTAButton 
                onClick={() => { onStartPlaying(); onClose(); }} 
                variant="primary" 
                className="w-full mb-3"
              >
                Play Games
              </CTAButton>
              <CTAButton 
                onClick={() => { onSignOut(); onClose(); }} 
                variant="danger" 
                className="w-full"
              >
                Sign Out
              </CTAButton>
            </div>
          </div>
        </nav>
      </div>
    </div>
  )
}

const GamesHeader = ({ onBackToHomepage, onSignOut, onToggleMobileMenu }) => (
  <div className="px-4 py-6 md:px-8 lg:px-16" style={{ border: 'none' }}>
    <div className="flex items-center justify-between">
      <BackButton onClick={onBackToHomepage}>
        {NAVIGATION_CONFIG.backToGamesHome}
      </BackButton>

      <div className="hidden md:flex items-center space-x-4">
        <Link
          href="/admin"
          className="bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-all border border-white/20"
        >
          {NAVIGATION_CONFIG.adminDashboard}
        </Link>
        <CTAButton onClick={onSignOut} variant="danger">
          {NAVIGATION_CONFIG.signOut}
        </CTAButton>
      </div>

      <MobileMenuButton onClick={onToggleMobileMenu} />
    </div>
  </div>
)

const GamesMobileMenu = ({ isOpen, onClose, onBackToHomepage, onSignOut }) => {
  if (!isOpen) return null

  return (
    <div className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm">
      <div className="fixed top-0 right-0 w-64 h-full bg-gradient-to-b from-purple-900 to-blue-900 shadow-2xl">
        <div className="flex justify-end p-4">
          <button
            onClick={onClose}
            className="text-white p-2 hover:bg-white/10 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="px-6 py-8">
          <div className="space-y-6">
            <button 
              onClick={() => { onBackToHomepage(); onClose(); }} 
              className="block w-full text-left text-white/80 hover:text-white transition-colors text-lg py-2"
            >
              {NAVIGATION_CONFIG.backToGamesHome}
            </button>
            <Link 
              href="/admin" 
              className="block text-white/80 hover:text-white transition-colors text-lg py-2" 
              onClick={onClose}
            >
              {NAVIGATION_CONFIG.adminDashboard}
            </Link>
            <button
              onClick={() => { onSignOut(); onClose(); }}
              className="block w-full text-left text-red-400 hover:text-red-300 transition-colors text-lg py-2"
            >
              {NAVIGATION_CONFIG.signOut}
            </button>
          </div>
        </nav>
      </div>
    </div>
  )
}

const GameTabs = ({ activeTab, onTabChange }) => {
  if (!GAME_TABS || GAME_TABS.length === 0) {
    return null
  }
  
  return (
    <div className="flex gap-2 justify-center p-3 mb-8 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
      {GAME_TABS.map((tab) => (
        <button
          key={tab.id}
          className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all ${
            activeTab === tab.id 
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
              : 'bg-white/20 text-white/80 hover:bg-white/30'
          }`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

const GameContent = ({ activeTabConfig, user }) => {
  if (!activeTabConfig) return null

  const GameComponent = activeTabConfig.component

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
      {activeTabConfig.id === 'puzzle' ? (
        <GameComponent user={user} imageSrc="/puzzle.jpg" />
      ) : (
        <GameComponent user={user} />
      )}
    </div>
  )
}

const Homepage = ({ onStartPlaying, onSignOut, mobileMenuOpen, onToggleMobileMenu, onCloseMobileMenu }) => (
  <div className="min-h-screen w-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 overflow-x-hidden" style={{ border: 'none', outline: 'none' }}>
    <HomepageNavigation 
      onToggleMobileMenu={onToggleMobileMenu}
      onStartPlaying={onStartPlaying}
      onSignOut={onSignOut}
    />

    <HomepageMobileMenu 
      isOpen={mobileMenuOpen}
      onClose={onCloseMobileMenu}
      onStartPlaying={onStartPlaying}
      onSignOut={onSignOut}
    />

    <HeroSection config={HOMEPAGE_CONFIG?.hero} onStartPlaying={onStartPlaying} />
    <FeaturedGamesSection config={HOMEPAGE_CONFIG?.featuredGames} onStartPlaying={onStartPlaying} />
  </div>
)

const GamesSection = ({ user, onSignOut, onToggleMobileMenu, onCloseMobileMenu, onBackToHomepage, mobileMenuOpen }) => {
  const { activeTab, switchTab, activeTabConfig } = useGameTabs()

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 overflow-x-hidden" style={{ border: 'none', outline: 'none' }}>
      <GamesHeader 
        onBackToHomepage={onBackToHomepage}
        onSignOut={onSignOut}
        onToggleMobileMenu={onToggleMobileMenu}
      />

            <GamesMobileMenu 
        isOpen={mobileMenuOpen} 
        onClose={onCloseMobileMenu} 
        onBackToHomepage={onBackToHomepage} 
        onSignOut={onSignOut} 
      />

      {/* Game Selection */}
      <div className="px-4 py-8 md:px-8 lg:px-16 w-full">
        <div className="max-w-4xl mx-auto w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">{GAMES_CONFIG.title}</h1>
            <p className="text-xl text-white/80">{GAMES_CONFIG.subtitle}</p>
          </div>

          <GameTabs activeTab={activeTab} onTabChange={switchTab} />
          <GameContent activeTabConfig={activeTabConfig} user={user} />
        </div>
      </div>
    </div>
  )
}

const AuthSection = ({ onAuthSuccess }) => (
  <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
    <div className="px-4 py-6 md:px-8 lg:px-16">
      <div className="flex items-center justify-between">
        <BackButton href="/">
          {NAVIGATION_CONFIG.backToHome}
        </BackButton>
      </div>
    </div>
    
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">{NAVIGATION_CONFIG.welcome.title}</h1>
        <p className="text-white/80">{NAVIGATION_CONFIG.welcome.subtitle}</p>
      </div>
      <AuthForm onAuthSuccess={onAuthSuccess} />
    </div>
  </div>
)

export default function GamesPage() {
  const { user, loading, signOut } = useAuth()
  const { mobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useMobileMenu()
  const { showGames, goToGames, goToHomepage } = useHomepageState()

  const handleAuthSuccess = useCallback((user) => {
    // This will be handled by the useAuth hook
  }, [])

  if (loading) {
    return <LoadingSpinner 
      size={GAMES_CONFIG.loadingSpinner.size}
      color={GAMES_CONFIG.loadingSpinner.color}
    />
  }

  if (!user) {
    return <AuthSection onAuthSuccess={handleAuthSuccess} />
  }

  if (!showGames) {
    return (
      <Homepage 
        onStartPlaying={goToGames}
        onSignOut={signOut}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={toggleMobileMenu}
        onCloseMobileMenu={closeMobileMenu}
      />
    )
  }

  return (
    <GamesSection 
      user={user}
      onSignOut={signOut}
      onToggleMobileMenu={toggleMobileMenu}
      onCloseMobileMenu={closeMobileMenu}
      onBackToHomepage={goToHomepage}
      mobileMenuOpen={mobileMenuOpen}
    />
  )
}
