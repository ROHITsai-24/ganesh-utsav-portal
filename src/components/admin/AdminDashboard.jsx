'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Configuration objects for dynamic content
const DASHBOARD_CONFIG = {
  title: 'Admin Dashboard',
  signOut: 'Sign Out',
  refresh: 'Refresh',
  loadingText: 'Loading admin dashboard...',
  loadingSpinner: {
    size: 'h-12 w-12',
    color: 'border-blue-600'
  }
}

const GAME_CONFIG = {
  guess: {
    key: 'guess',
    title: 'Guess Game Leaderboard',
    description: 'Top 20 by score'
  },
  puzzle: {
    key: 'puzzle',
    title: 'Puzzle Game Leaderboard',
    description: 'Top 20 by score'
  }
}

const TABLE_CONFIG = {
  users: {
    headers: ['Email', 'Username', 'Games Played (All)', 'Total Points (All)', 'Last Played'],
    emptyMessage: 'No users found'
  },
  leaderboard: {
    headers: ['#', 'User', 'Score', 'Moves / Time', 'When'],
    emptyMessage: 'No scores yet'
  }
}

// Custom hook for admin data
const useAdminData = () => {
  const [adminEmail, setAdminEmail] = useState('')
  const [rows, setRows] = useState([])
  const [rawScores, setRawScores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const { data: { session } } = await supabase.auth.getSession()
      const email = session?.user?.email || ''
      setAdminEmail(email)

      const res = await fetch('/api/admin/overview', {
        headers: {
          'x-admin-email': email || ''
        }
      })
      
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || `Request failed: ${res.status}`)
      }
      
      const payload = await res.json()
      setRows(payload.users || [])
      setRawScores(payload.scores || [])
    } catch (e) {
      console.error('Admin data load error:', e)
      setError(e?.message || 'Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  return { adminEmail, rows, rawScores, loading, error, reload: loadData }
}

// Custom hook for authentication
const useAuth = () => {
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }, [])

  return { signOut }
}

// Reusable components
const LoadingSpinner = ({ size = 'h-12 w-12', color = 'border-blue-600', text = 'Loading...' }) => (
  <div className="text-center">
    <div className={`animate-spin rounded-full ${size} border-b-2 ${color} mx-auto`}></div>
    <p className="mt-4 text-gray-600">{text}</p>
  </div>
)

const ErrorMessage = ({ message, onRetry }) => (
  <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 border border-red-200">
    <div className="flex items-center justify-between">
      <span>{message}</span>
      {onRetry && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRetry}
          className="ml-2 bg-red-100 hover:bg-red-200 border-red-300"
        >
          Retry
        </Button>
      )}
    </div>
  </div>
)

const DataTable = ({ headers, children, emptyMessage, className = '' }) => (
  <div className={`overflow-x-auto ${className}`}>
    <table className="min-w-full text-left text-sm">
      <thead>
        <tr className="border-b">
          {headers.map((header, index) => (
            <th key={index} className="py-2 pr-4">{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {children}
      </tbody>
    </table>
  </div>
)

const UsersTable = ({ rows }) => {
  if (rows.length === 0) {
    return (
      <tr>
        <td colSpan={TABLE_CONFIG.users.headers.length} className="py-4 text-center text-gray-500">
          {TABLE_CONFIG.users.emptyMessage}
        </td>
      </tr>
    )
  }

  return rows.map((r) => (
    <tr key={r.userId} className="border-b hover:bg-gray-50">
      <td className="py-2 pr-4">{r.email || '-'}</td>
      <td className="py-2 pr-4">{r.username || '-'}</td>
      <td className="py-2 pr-4">{r.gamesPlayed}</td>
      <td className="py-2 pr-4">{r.totalScore}</td>
      <td className="py-2 pr-4">
        {r.lastPlayed ? new Date(r.lastPlayed).toLocaleString() : '-'}
      </td>
    </tr>
  ))
}

const LeaderboardTable = ({ gameKey, leaderboard }) => {
  if (leaderboard.length === 0) {
    return (
      <tr>
        <td colSpan={TABLE_CONFIG.leaderboard.headers.length} className="py-4 text-center text-gray-500">
          {TABLE_CONFIG.leaderboard.emptyMessage}
        </td>
      </tr>
    )
  }

  return leaderboard.map((row, idx) => (
    <tr key={row.id || idx} className="border-b">
      <td className="py-2 pr-4">{idx + 1}</td>
      <td className="py-2 pr-4">
        {row.user_username || row.user_email || 'Unknown User'}
      </td>
      <td className="py-2 pr-4">{row.score}</td>
      {gameKey === 'puzzle' && (
        <td className="py-2 pr-4">
          {row.moves ?? '-'} / {row.time_taken_seconds ?? '-'}s
        </td>
      )}
      <td className="py-2 pr-4">
        {row.created_at ? new Date(row.created_at).toLocaleString() : '-'}
      </td>
    </tr>
  ))
}

const GameLeaderboard = ({ gameKey, rawScores }) => {
  const leaderboard = useMemo(() => {
    return [...rawScores.filter(s => (s.game_key || 'guess').toLowerCase() === gameKey)]
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
  }, [rawScores, gameKey])

  const gameConfig = GAME_CONFIG[gameKey]
  const showMovesTime = gameKey === 'puzzle'

  return (
    <Card>
      <CardHeader>
        <CardTitle>{gameConfig.title}</CardTitle>
        <CardDescription>{gameConfig.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable 
          headers={showMovesTime ? TABLE_CONFIG.leaderboard.headers : TABLE_CONFIG.leaderboard.headers.filter(h => h !== 'Moves / Time')}
        >
          <LeaderboardTable gameKey={gameKey} leaderboard={leaderboard} />
        </DataTable>
      </CardContent>
    </Card>
  )
}

export default function AdminDashboard() {
  const { adminEmail, rows, rawScores, loading, error, reload } = useAdminData()
  const { signOut } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="max-w-7xl mx-auto">
          <LoadingSpinner 
            size={DASHBOARD_CONFIG.loadingSpinner.size}
            color={DASHBOARD_CONFIG.loadingSpinner.color}
            text={DASHBOARD_CONFIG.loadingText}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{DASHBOARD_CONFIG.title}</h1>
              <p className="text-gray-600">Signed in as: {adminEmail}</p>
            </div>
            <Button 
              variant="outline" 
              onClick={signOut}
              className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
            >
              {DASHBOARD_CONFIG.signOut}
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && <ErrorMessage message={error} onRetry={reload} />}

        {/* Users Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Users Overview</CardTitle>
            <CardDescription>All users with games played and total points</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable headers={TABLE_CONFIG.users.headers}>
              <UsersTable rows={rows} />
            </DataTable>
          </CardContent>
        </Card>

        {/* Per-game leaderboards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {Object.values(GAME_CONFIG).map((gameConfig) => (
            <GameLeaderboard 
              key={gameConfig.key} 
              gameKey={gameConfig.key} 
              rawScores={rawScores} 
            />
          ))}
        </div>

        {/* Simple Refresh Button */}
        <div className="mt-6 text-right">
          <Button variant="outline" onClick={reload}>
            {DASHBOARD_CONFIG.refresh}
          </Button>
        </div>
      </div>
    </div>
  )
} 