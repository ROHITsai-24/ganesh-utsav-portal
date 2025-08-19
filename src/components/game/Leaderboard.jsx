'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Configuration object for hardcoded values
const LEADERBOARD_CONFIG = {
  limit: 20,
  loadingText: 'Loading leaderboard...',
  emptyText: 'No scores yet. Be the first to play!',
  title: '🏆 Leaderboard',
  description: 'Top players by total score',
  // Medal colors and styles
  medals: {
    0: { bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-400' },
    1: { bg: 'bg-gray-50', border: 'border-gray-200', badge: 'bg-gray-400' },
    2: { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-400' },
    default: { bg: 'bg-white', border: 'border-gray-100', badge: 'bg-blue-100 text-blue-800' }
  }
}

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)

  // Memoized function to test database connection
  const testConnection = useCallback(async () => {
    try {
      console.log('Testing database connection...')
      const { data, error } = await supabase
        .from('game_results')
        .select('count')
        .limit(1)
      
      if (error) {
        console.error('Database connection test failed:', error)
      } else {
        console.log('Database connection successful')
        fetchLeaderboard()
      }
    } catch (error) {
      console.error('Connection test error:', error)
    }
  }, [])

  // Memoized function to fetch leaderboard data
  const fetchLeaderboard = useCallback(async () => {
    try {
      console.log('Fetching leaderboard data...')
      
      const { data, error } = await supabase
        .from('game_results')
        .select(`
          *,
          games!inner (name, key)
        `)
        .order('created_at', { ascending: false })
        .limit(LEADERBOARD_CONFIG.limit)

      if (error) {
        console.error('Supabase query error:', error)
        throw error
      }

      console.log('Raw data from database:', data)

      // If no data, show empty state
      if (!data || data.length === 0) {
        console.log('No results found in database')
        setLeaderboard([])
        return
      }

      // Group by user and calculate total scores
      const userScores = {}
      data.forEach(record => {
        const userId = record.user_id || 'Anonymous'
        if (!userScores[userId]) {
          userScores[userId] = {
            totalScore: 0,
            gamesPlayed: 0,
            lastPlayed: record.created_at
          }
        }
        userScores[userId].totalScore += record.score
        userScores[userId].gamesPlayed += 1
      })

      // Convert to array and sort by total score
      const sortedLeaderboard = Object.entries(userScores)
        .map(([user, stats]) => ({
          user,
          ...stats
        }))
        .sort((a, b) => b.totalScore - a.totalScore)

      console.log('Processed leaderboard:', sortedLeaderboard)
      setLeaderboard(sortedLeaderboard)
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      // Show user-friendly message if table doesn't exist
      if (error.message && error.message.includes('relation "game_results" does not exist')) {
        console.log('Database table not set up yet. Please run the SQL setup.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Memoized function to get medal styling
  const getMedalStyle = useCallback((index) => {
    const medal = LEADERBOARD_CONFIG.medals[index] || LEADERBOARD_CONFIG.medals.default
    return {
      container: `${medal.bg} border ${medal.border}`,
      badge: medal.badge
    }
  }, [])

  // Memoized function to format games played text
  const formatGamesPlayed = useCallback((count) => {
    return `${count} game${count !== 1 ? 's' : ''} played`
  }, [])

  useEffect(() => {
    testConnection()
  }, [testConnection])

  // Memoized loading component
  const LoadingComponent = useMemo(() => (
    <Card>
      <CardContent className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">{LEADERBOARD_CONFIG.loadingText}</p>
        </div>
      </CardContent>
    </Card>
  ), [])

  // Memoized empty state component
  const EmptyStateComponent = useMemo(() => (
    <p className="text-center text-gray-500">{LEADERBOARD_CONFIG.emptyText}</p>
  ), [])

  if (loading) {
    return LoadingComponent
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{LEADERBOARD_CONFIG.title}</CardTitle>
        <CardDescription>{LEADERBOARD_CONFIG.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {leaderboard.length === 0 ? (
          EmptyStateComponent
        ) : (
          <div className="space-y-3">
            {leaderboard.map((player, index) => {
              const medalStyle = getMedalStyle(index)
              return (
                <div
                  key={player.user}
                  className={`flex items-center justify-between p-3 rounded-lg ${medalStyle.container}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${medalStyle.badge}`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold">{player.user}</p>
                      <p className="text-sm text-gray-500">
                        {formatGamesPlayed(player.gamesPlayed)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{player.totalScore} pts</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 