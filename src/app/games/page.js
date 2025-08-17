'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthForm from '@/components/auth/AuthForm'
import GuessGame from '@/components/game/GuessGame'
import PuzzleGame from '@/components/game/PuzzleGame'
import Link from 'next/link'

export default function GamesPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('guess')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showGames, setShowGames] = useState(false) // New state to toggle between game home and actual games
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
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
    }
    checkUser()
  }, [router])

  const handleAuthSuccess = (user) => { setUser(user) }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="px-4 py-6 md:px-8 lg:px-16">
          <div className="flex items-center justify-between">
            <Link href="/" className="inline-flex items-center space-x-2 text-white/80 hover:text-white transition-colors">
              <span>←</span>
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
        
        <div className="max-w-md mx-auto px-4 py-16">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome to Games</h1>
            <p className="text-white/80">Sign in or create an account to start playing</p>
          </div>
          <AuthForm onAuthSuccess={handleAuthSuccess} />
        </div>
      </div>
    )
  }

  // Show the game-themed homepage first
  if (!showGames) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 overflow-x-hidden" style={{ border: 'none', outline: 'none' }}>
        {/* Navigation */}
        <nav className="relative z-50 px-4 py-4 md:px-8 lg:px-16" style={{ border: 'none' }}>
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">UP</span>
              </div>
              <span className="text-white font-bold text-xl md:text-2xl">Unprofessional Players</span>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#home" className="text-white/80 hover:text-white transition-colors">Home</a>
              <a href="#about" className="text-white/80 hover:text-white transition-colors">About</a>
              <a href="#games" className="text-white/80 hover:text-white transition-colors">Games</a>
              <a href="#festivals" className="text-white/80 hover:text-white transition-colors">Festivals</a>
              <a href="#contact" className="text-white/80 hover:text-white transition-colors">Contact</a>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-white p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Auth Buttons - Hidden on Mobile */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowGames(true)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl"
                >
                  Play Games
                </button>
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm">
            <div className="fixed top-0 right-0 w-64 h-full bg-gradient-to-b from-purple-900 to-blue-900 shadow-2xl">
              <div className="flex justify-end p-4">
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white p-2 hover:bg-white/10 rounded-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <nav className="px-6 py-8">
                <div className="space-y-6">
                  <a href="#home" className="block text-white/80 hover:text-white transition-colors text-lg py-2" onClick={() => setMobileMenuOpen(false)}>Home</a>
                  <a href="#about" className="block text-white/80 hover:text-white transition-colors text-lg py-2" onClick={() => setMobileMenuOpen(false)}>About</a>
                  <a href="#games" className="block text-white/80 hover:text-white transition-colors text-lg py-2" onClick={() => setMobileMenuOpen(false)}>Games</a>
                  <a href="#festivals" className="block text-white/80 hover:text-white transition-colors text-lg py-2" onClick={() => setMobileMenuOpen(false)}>Festivals</a>
                  <a href="#contact" className="block text-white/80 hover:text-white transition-colors text-lg py-2" onClick={() => setMobileMenuOpen(false)}>Contact</a>

                  {/* Mobile-specific action buttons */}
                  <div className="pt-6 border-t border-white/20">
                    <button
                      onClick={() => {
                        setShowGames(true)
                        setMobileMenuOpen(false)
                      }}
                      className="block w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all text-center mb-3"
                    >
                      Play Games
                    </button>
                    <button
                      onClick={() => {
                        supabase.auth.signOut()
                        setMobileMenuOpen(false)
                      }}
                      className="block w-full bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg transition-colors text-center"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </nav>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <section id="home" className="relative px-4 py-16 md:py-24 lg:py-32 md:px-8 lg:px-16 w-full">
          <div className="max-w-7xl mx-auto w-full">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center w-full">
              {/* Left Content */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                    Welcome to{' '}
                    <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent">
                      Unprofessional Players
                    </span>
                  </h1>
                  <p className="text-xl md:text-2xl text-white/80 leading-relaxed">
                    Experience the thrill of festival gaming with our interactive challenges.
                    Test your skills, compete with friends, and discover amazing prizes!
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => setShowGames(true)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 text-center"
                  >
                    Start Playing Now
                  </button>
                  <button className="bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white/20 transition-all border border-white/20 text-center">
                    Learn More
                  </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-6 pt-8">
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-white">1000+</div>
                    <div className="text-white/60 text-sm md:text-base">Active Players</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-white">50+</div>
                    <div className="text-white/60 text-sm md:text-base">Festivals</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-white">₹1M+</div>
                    <div className="text-white/60 text-sm md:text-base">Prizes Won</div>
                  </div>
                </div>
              </div>

              {/* Right Content - Hero Image/Animation */}
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
                <div className="absolute -top-3 -left-3 sm:-top-6 sm:-left-6 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 animate-float">
                  <div className="p-2 sm:p-4 text-center">
                    <div className="text-lg sm:text-2xl mb-1 sm:mb-2">🏆</div>
                    <div className="text-white text-xs sm:text-sm font-semibold">Win Prizes</div>
                  </div>
                </div>

                <div className="absolute -bottom-3 -right-3 sm:-bottom-6 sm:-right-6 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 animate-float" style={{animationDelay: '1s'}}>
                  <div className="p-2 sm:p-4 text-center">
                    <div className="text-lg sm:text-2xl mb-2">🎯</div>
                    <div className="text-white text-xs sm:text-sm font-semibold">Test Skills</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Background Elements */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[800px] max-h-[800px] bg-blue-500/10 rounded-full blur-3xl"></div>
          </div>
        </section>

        {/* Quick Games Preview */}
        <section className="px-4 py-16 md:px-8 lg:px-16 w-full">
          <div className="max-w-7xl mx-auto w-full">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Featured Games
              </h2>
              <p className="text-xl text-white/80 max-w-2xl mx-auto">
                Challenge yourself with our exciting collection of festival games
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto w-full">
              {/* Guess Game Card */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all group">
                <div className="text-center space-y-4">
                  <div className="text-6xl mb-4">🎭</div>
                  <h3 className="text-2xl font-bold text-white">Idol Guess Game</h3>
                  <p className="text-white/80">
                    Test your knowledge about idols with our interactive guessing challenges
                  </p>
                  <button
                    onClick={() => setShowGames(true)}
                    className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all"
                  >
                    Play Now
                  </button>
                </div>
              </div>

              {/* Puzzle Game Card */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all group">
                <div className="text-center space-y-4">
                  <div className="text-6xl mb-4">🧩</div>
                  <h3 className="text-2xl font-bold text-white">Puzzle Challenge</h3>
                  <p className="text-white/80">
                    Solve the puzzle within time limit and test your problem-solving skills
                  </p>
                  <button
                    onClick={() => setShowGames(true)}
                    className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all"
                  >
                    Play Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  }

  // Show the actual games when user clicks to play
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 overflow-x-hidden" style={{ border: 'none', outline: 'none' }}>
      {/* Header */}
      <div className="px-4 py-6 md:px-8 lg:px-16" style={{ border: 'none' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowGames(false)}
              className="inline-flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
            >
              <span>←</span>
              <span>Back to Games Home</span>
            </button>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/admin"
              className="bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-all border border-white/20"
            >
              Admin Dashboard
            </Link>
            <button
              onClick={() => supabase.auth.signOut()}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm">
          <div className="fixed top-0 right-0 w-64 h-full bg-gradient-to-b from-purple-900 to-blue-900 shadow-2xl">
            <div className="flex justify-end p-4">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-white p-2 hover:bg-white/10 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="px-6 py-8">
              <div className="space-y-6">
                <button onClick={() => { setShowGames(false); setMobileMenuOpen(false); }} className="block w-full text-left text-white/80 hover:text-white transition-colors text-lg py-2">← Back to Games Home</button>
                <Link href="/admin" className="block text-white/80 hover:text-white transition-colors text-lg py-2" onClick={() => setMobileMenuOpen(false)}>Admin Dashboard</Link>
                <button
                  onClick={() => {
                    supabase.auth.signOut()
                    setMobileMenuOpen(false)
                  }}
                  className="block w-full text-left text-red-400 hover:text-red-300 transition-colors text-lg py-2"
                >
                  Sign Out
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Game Selection */}
      <div className="px-4 py-8 md:px-8 lg:px-16 w-full">
        <div className="max-w-4xl mx-auto w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">Choose Your Game</h1>
            <p className="text-xl text-white/80">Select a game to start playing and competing!</p>
          </div>

          {/* Game Tabs */}
          <div className="flex gap-2 justify-center p-3 mb-8 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
            <button
              className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all ${
                tab === 'guess'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'bg-white/20 text-white/80 hover:bg-white/30'
              }`}
              onClick={() => setTab('guess')}
            >
              🎭 Guess Game
            </button>
            <button
              className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all ${
                tab === 'puzzle'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'bg-white/20 text-white/80 hover:bg-white/30'
              }`}
              onClick={() => setTab('puzzle')}
            >
              🧩 Puzzle Game
            </button>
          </div>

          {/* Game Content */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
            {tab === 'guess' ? (
              <GuessGame user={user} />
            ) : (
              <PuzzleGame user={user} imageSrc="/puzzle.jpg" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
