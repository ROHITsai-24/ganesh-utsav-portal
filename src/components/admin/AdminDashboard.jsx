'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import UpdatesManager from './UpdatesManager'
import GameSettingsManager from './GameSettingsManager'
import { isPhoneEmail, extractPhoneFromEmail } from '@/components/auth/AuthForm'

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
    description: 'Top 20 by score, then by time (faster is better)'
  },
  puzzle: {
    key: 'puzzle',
    title: 'Puzzle Game Leaderboard',
    description: 'Top 20 by score'
  }
}

const TABLE_CONFIG = {
  users: {
    headers: ['Email/Phone', 'Username', 'Games Played (All)', 'Total Points (All)', 'Last Played', 'Actions'],
    emptyMessage: 'No users found'
  },
  leaderboard: {
    headers: ['#', 'User', 'Score', 'Moves / Time', 'When', 'Actions'],
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

  const deleteGameResult = useCallback(async (gameResultId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const email = session?.user?.email || ''
      
      const res = await fetch(`/api/admin/delete-game-result`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': email || ''
        },
        body: JSON.stringify({ gameResultId })
      })
      
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || `Delete failed: ${res.status}`)
      }
      
      // Reload data after successful deletion
      await loadData()
    } catch (e) {
      console.error('Delete game result error:', e)
      setError(e?.message || 'Failed to delete game result')
    }
  }, [loadData])

  const deleteAllGameResults = useCallback(async (gameKey) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const email = session?.user?.email || ''
      
      const res = await fetch(`/api/admin/delete-all-game-results`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': email || ''
        },
        body: JSON.stringify({ gameKey })
      })
      
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        console.error('Delete all API error:', { status: res.status, body })
        throw new Error(body?.error || `Delete all failed: ${res.status}`)
      }
      
      const result = await res.json()
      console.log('Delete all success:', result)
      
      // Reload data after successful deletion
      await loadData()
    } catch (e) {
      console.error('Delete all game results error:', e)
      setError(e?.message || 'Failed to delete all game results')
    }
  }, [loadData])

  useEffect(() => {
    loadData()
  }, [loadData])

  const deleteUser = useCallback(async (userId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const email = session?.user?.email || ''
      
      const res = await fetch(`/api/admin/delete-user`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': email || ''
        },
        body: JSON.stringify({ userId })
      })
      
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || `Delete failed: ${res.status}`)
      }
      
      // Reload data after successful deletion
      await loadData()
    } catch (e) {
      console.error('Delete user error:', e)
      setError(e?.message || 'Failed to delete user')
    }
  }, [loadData])

  const deleteAllUsers = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const email = session?.user?.email || ''
      
      const res = await fetch(`/api/admin/delete-all-users`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': email || ''
        }
      })
      
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || `Delete all failed: ${res.status}`)
      }
      
      // Reload data after successful deletion
      await loadData()
    } catch (e) {
      console.error('Delete all users error:', e)
      setError(e?.message || 'Failed to delete all users')
    }
  }, [loadData])

  return { 
    adminEmail, 
    rows, 
    rawScores, 
    loading, 
    error, 
    reload: loadData, 
    deleteGameResult, 
    deleteAllGameResults,
    deleteUser,
    deleteAllUsers
  }
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

const UsersTable = ({ rows, onDelete }) => {
  const handleDelete = (userId, userDisplay) => {
    if (window.confirm(`Are you sure you want to delete user ${userDisplay}? This will also delete all their game results. This action cannot be undone.`)) {
      onDelete(userId)
    }
  }

  if (rows.length === 0) {
    return (
      <tr>
        <td colSpan={TABLE_CONFIG.users.headers.length} className="py-4 text-center text-gray-500">
          {TABLE_CONFIG.users.emptyMessage}
        </td>
      </tr>
    )
  }

  return rows.map((r) => {
    const userDisplay = r.email ? (
      isPhoneEmail(r.email) ? (
        `📱 +${extractPhoneFromEmail(r.email)}`
      ) : r.email
    ) : r.username || 'Unknown User'

    return (
      <tr key={r.userId} className="border-b hover:bg-gray-50">
        <td className="py-2 pr-4">
          {userDisplay}
        </td>
        <td className="py-2 pr-4">{r.username || '-'}</td>
        <td className="py-2 pr-4">{r.gamesPlayed}</td>
        <td className="py-2 pr-4">{r.totalScore}</td>
        <td className="py-2 pr-4">
          {r.lastPlayed ? new Date(r.lastPlayed).toLocaleString() : '-'}
        </td>
        <td className="py-2 pr-4">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDelete(r.userId, userDisplay)}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            🗑️ Delete
          </Button>
        </td>
      </tr>
    )
  })
}

const LeaderboardTable = ({ gameKey, leaderboard, onDelete, showMovesTime, showTime }) => {
  const handleDelete = (gameResultId, username) => {
    if (window.confirm(`Are you sure you want to delete this game result for ${username}? This action cannot be undone.`)) {
      onDelete(gameResultId)
    }
  }

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
        {row.user_username || (row.user_email ? (
          isPhoneEmail(row.user_email) ? (
            // Extract phone number from generated email
            `📱 +${extractPhoneFromEmail(row.user_email)}`
          ) : row.user_email
        ) : 'Unknown User')}
      </td>
      <td className="py-2 pr-4">{row.score}</td>
      {showMovesTime && (
        <td className="py-2 pr-4">
          {row.moves ?? '-'} / {row.time_taken_seconds ?? '-'}s
        </td>
      )}
      {showTime && (
        <td className="py-2 pr-4">
          {row.time_taken_seconds ? `${row.time_taken_seconds}s` : '-'}
        </td>
      )}
      <td className="py-2 pr-4">
        {row.created_at ? new Date(row.created_at).toLocaleString() : '-'}
      </td>
      <td className="py-2 pr-4">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => handleDelete(row.id, row.user_username || (row.user_email ? (
            isPhoneEmail(row.user_email) ? (
              // Extract phone number from generated email
              `📱 +${extractPhoneFromEmail(row.user_email)}`
            ) : row.user_email
          ) : 'Unknown User'))}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          🗑️ Delete
        </Button>
      </td>
    </tr>
  ))
}

const GameLeaderboard = ({ gameKey, rawScores, onDelete, onDeleteAll }) => {
  const leaderboard = useMemo(() => {
    const filteredScores = rawScores.filter(s => s.game_key === gameKey)
    
    // Sort based on game type
    if (gameKey === 'guess') {
      // For guess game: sort by score first, then by time taken (faster is better)
      return filteredScores
        .sort((a, b) => {
          if (b.score !== a.score) {
            return b.score - a.score // Higher score first
          }
          // If scores are equal, sort by time taken (faster time first)
          const timeA = a.time_taken_seconds || 0
          const timeB = b.time_taken_seconds || 0
          return timeA - timeB
        })
        .slice(0, 20)
    } else {
      // For puzzle game: sort by score only
      return filteredScores
        .sort((a, b) => b.score - a.score)
        .slice(0, 20)
    }
  }, [rawScores, gameKey])

  const gameConfig = GAME_CONFIG[gameKey]
  const showMovesTime = gameKey === 'puzzle'
  const showTime = gameKey === 'guess'

  const handleDeleteAll = () => {
    const gameName = gameConfig.title
    const resultCount = rawScores.filter(s => s.game_key === gameKey).length
    
    if (window.confirm(`⚠️ DANGER: Are you sure you want to delete ALL ${resultCount} game results for ${gameName}?\n\nThis will permanently remove ALL scores, moves, and time data for this game. This action CANNOT be undone!\n\nType "delete" to confirm.`)) {
      const confirmation = prompt(`Type "delete" to confirm deletion of all ${gameName} results:`)
      if (confirmation === "delete") {
        onDeleteAll(gameKey)
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{gameConfig.title}</CardTitle>
            <CardDescription>{gameConfig.description}</CardDescription>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteAll}
            className="bg-red-700 hover:bg-red-800 text-white border-red-800"
            title={`Delete all ${gameKey} game results`}
          >
            🗑️ Delete All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable 
          headers={
            showMovesTime 
              ? TABLE_CONFIG.leaderboard.headers 
              : showTime 
                ? ['#', 'User', 'Score', 'Time', 'When', 'Actions']
                : TABLE_CONFIG.leaderboard.headers.filter(h => h !== 'Moves / Time')
          }
        >
          <LeaderboardTable gameKey={gameKey} leaderboard={leaderboard} onDelete={onDelete} showMovesTime={showMovesTime} showTime={showTime} />
        </DataTable>
      </CardContent>
    </Card>
  )
}

export default function AdminDashboard() {
  const { 
    adminEmail, 
    rows, 
    rawScores, 
    loading, 
    error, 
    reload, 
    deleteGameResult, 
    deleteAllGameResults,
    deleteUser,
    deleteAllUsers
  } = useAdminData()
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
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Users Overview</CardTitle>
                <CardDescription>All users with games played and total points</CardDescription>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete ALL users? This will also delete all their game results. This action cannot be undone.`)) {
                    deleteAllUsers()
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                🗑️ Delete All Users
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable headers={TABLE_CONFIG.users.headers}>
              <UsersTable rows={rows} onDelete={deleteUser} />
            </DataTable>
          </CardContent>
        </Card>

        {/* Game Settings */}
        <div className="mt-8">
          <GameSettingsManager />
        </div>

        {/* Per-game leaderboards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {Object.values(GAME_CONFIG).map((gameConfig) => (
            <GameLeaderboard 
              key={gameConfig.key} 
              gameKey={gameConfig.key} 
              rawScores={rawScores} 
              onDelete={deleteGameResult}
              onDeleteAll={deleteAllGameResults}
            />
          ))}
        </div>

        {/* Updates Manager */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Daily Updates Management</CardTitle>
            <CardDescription>Send and manage devotional messages for all users</CardDescription>
          </CardHeader>
          <CardContent>
            <UpdatesManager adminEmail={adminEmail} />
          </CardContent>
        </Card>

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