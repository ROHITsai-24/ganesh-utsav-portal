'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Test database connection first
    const testConnection = async () => {
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
    }
    
    testConnection()
  }, [])

  const fetchLeaderboard = async () => {
    try {
      console.log('Fetching leaderboard data...')
      
      // Query the new unified game_results table
      console.log('Attempting to fetch game results...')
      
      const { data, error } = await supabase
        .from('game_results')
        .select(`
          *,
          games!inner (name, key)
        `)
        .order('created_at', { ascending: false })
        .limit(20)

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
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading leaderboard...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>🏆 Leaderboard</CardTitle>
        <CardDescription>Top players by total score</CardDescription>
      </CardHeader>
      <CardContent>
        {leaderboard.length === 0 ? (
          <p className="text-center text-gray-500">No scores yet. Be the first to play!</p>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((player, index) => (
              <div
                key={player.user}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  index === 0 ? 'bg-yellow-50 border border-yellow-200' :
                  index === 1 ? 'bg-gray-50 border border-gray-200' :
                  index === 2 ? 'bg-orange-50 border border-orange-200' :
                  'bg-white border border-gray-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-400 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    index === 2 ? 'bg-orange-400 text-white' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold">{player.user}</p>
                    <p className="text-sm text-gray-500">
                      {player.gamesPlayed} game{player.gamesPlayed !== 1 ? 's' : ''} played
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{player.totalScore} pts</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 