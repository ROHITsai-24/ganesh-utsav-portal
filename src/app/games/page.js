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

const GAME_TABS = [
  {
    id: 'guess',
    label: '🎭 Guess Game',
    component: GuessGame
  },
  {
    id: 'puzzle',
    label: '🧩 Puzzle Game',
    component: PuzzleGame
  }
]

const NAVIGATION_CONFIG = {
  backToHome: '← Back to Home',
  adminDashboard: 'Admin Dashboard',
  signOut: 'Sign Out',
  welcome: {
    title: 'Welcome to Games',
    subtitle: 'Sign in or create an account to start playing'
  }
}

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
        // Check if user is admin and redirect
        if (session.user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
          router.push('/admin')
        }
      }
    } catch (error) {
      console.error('Error checking user session:', error)
    } finally {
      setLoading(false)
    }
  }, [router])

  const handleAuthChange = useCallback(async (event, session) => {
    if (session?.user) {
      setUser(session.user)
      // Check if user is admin and redirect
      if (session.user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
        router.push('/admin')
      }
    } else {
      setUser(null)
    }
    setLoading(false)
  }, [router])

  useEffect(() => {
    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange)
    return () => subscription.unsubscribe()
  }, [checkUser, handleAuthChange])

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

// Reusable components
const LoadingSpinner = ({ size = 'h-32 w-32', color = 'border-purple-600' }) => (
  <div className="min-h-screen flex items-center justify-center">
    <div className={`animate-spin rounded-full ${size} border-b-2 ${color}`}></div>
  </div>
)

const BackButton = ({ href, className = '' }) => (
  <Link 
    href={href}
    className={`inline-flex items-center space-x-2 text-white/80 hover:text-white transition-colors ${className}`}
  >
    <span>←</span>
    <span>{NAVIGATION_CONFIG.backToHome}</span>
  </Link>
)

const Header = ({ user, onSignOut, onToggleMobileMenu }) => (
  <div className="px-4 py-6 md:px-8 lg:px-16">
    <div className="flex items-center justify-between">
      <BackButton href="/" />
      
      {user && (
        <div className="hidden md:flex items-center space-x-4">
          <Link 
            href="/admin"
            className="bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-all border border-white/20"
          >
            {NAVIGATION_CONFIG.adminDashboard}
          </Link>
          <button
            onClick={onSignOut}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {NAVIGATION_CONFIG.signOut}
          </button>
        </div>
      )}

      {/* Mobile Menu Button */}
      {user && (
        <button 
          className="md:hidden text-white p-2"
          onClick={onToggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
    </div>
  </div>
)

const MobileMenu = ({ isOpen, onClose, onSignOut }) => {
  if (!isOpen) return null

  return (
    <div className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm">
      <div className="fixed top-0 right-0 w-64 h-full bg-gradient-to-b from-purple-900 to-blue-900 shadow-2xl">
        <div className="flex justify-end p-4">
          <button 
            onClick={onClose}
            className="text-white p-2 hover:bg-white/10 rounded-lg"
            aria-label="Close mobile menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="px-6 py-8">
          <div className="space-y-6">
            <Link 
              href="/" 
              className="block text-white/80 hover:text-white transition-colors text-lg py-2" 
              onClick={onClose}
            >
              {NAVIGATION_CONFIG.backToHome}
            </Link>
            <Link 
              href="/admin" 
              className="block text-white/80 hover:text-white transition-colors text-lg py-2" 
              onClick={onClose}
            >
              {NAVIGATION_CONFIG.adminDashboard}
            </Link>
            <button 
              onClick={() => {
                onSignOut()
                onClose()
              }}
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

const GameTabs = ({ activeTab, onTabChange }) => (
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

const AuthSection = ({ onAuthSuccess }) => (
  <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
    <Header />
    
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">{NAVIGATION_CONFIG.welcome.title}</h1>
        <p className="text-white/80">{NAVIGATION_CONFIG.welcome.subtitle}</p>
      </div>
      <AuthForm onAuthSuccess={onAuthSuccess} />
    </div>
  </div>
)

const GamesSection = ({ user, onSignOut, onToggleMobileMenu, onCloseMobileMenu, mobileMenuOpen }) => {
  const { activeTab, switchTab, activeTabConfig } = useGameTabs()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <Header 
        user={user} 
        onSignOut={onSignOut} 
        onToggleMobileMenu={onToggleMobileMenu} 
      />

      <MobileMenu 
        isOpen={mobileMenuOpen} 
        onClose={onCloseMobileMenu} 
        onSignOut={onSignOut} 
      />

      {/* Game Selection */}
      <div className="px-4 py-8 md:px-8 lg:px-16">
        <div className="max-w-4xl mx-auto">
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

export default function GamesPage() {
  const { user, loading, signOut } = useAuth()
  const { mobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useMobileMenu()

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

  return (
    <GamesSection 
      user={user}
      onSignOut={signOut}
      onToggleMobileMenu={toggleMobileMenu}
      onCloseMobileMenu={closeMobileMenu}
      mobileMenuOpen={mobileMenuOpen}
    />
  )
}
