'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { ChevronsUpDown, Check } from 'lucide-react'
import UpdatesManager from './UpdatesManager'
import GameSettingsManager from './GameSettingsManager'
import { isPhoneEmail, extractPhoneFromEmail } from '@/components/auth/AuthForm'
import { cn } from '@/lib/utils'

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
    description: 'All users by score, then by time (faster is better)'
  },
  puzzle: {
    key: 'puzzle',
    title: 'Puzzle Game Leaderboard',
    description: 'All users by score'
  }
}

const TABLE_CONFIG = {
  users: {
    headers: ['#', 'User ID', 'Email/Phone', 'Username', 'Games Played (All)', 'Total Points (All)', 'Last Played', 'Actions'],
    emptyMessage: 'No users found'
  },
  leaderboard: {
    headers: ['#', 'User ID', 'User', 'Score', 'Moves / Time', 'When', 'Actions'],
    emptyMessage: 'No scores yet'
  }
}

// Custom hook for debouncing
const useDebounce = (value, delay) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

// Search Combobox Component
const FilterCombobox = ({ value, onChange, options, placeholder = "Select option", className = "" }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const filteredOptions = useMemo(() => {
    if (!debouncedSearch) return options;
    return options.filter(option =>
      String(option).toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [options, debouncedSearch]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {value
            ? options.find((option) => option === value) || value
            : placeholder}
          <ChevronsUpDown className="opacity-50 ml-2 h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder={`Search ${placeholder.toLowerCase()}...`}
            className="h-9"
          />
          <CommandList>
            {filteredOptions.length === 0 ? (
              <CommandEmpty>No options found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option}
                    value={option}
                    onSelect={(currentValue) => {
                      onChange(currentValue === value ? "" : currentValue);
                      setOpen(false);
                    }}
                  >
                    {option}
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        value === option ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

// Custom hook for admin data
const useAdminData = () => {
  const [adminEmail, setAdminEmail] = useState('')
  const [rows, setRows] = useState([])
  const [rawScores, setRawScores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Search states
  const [userSearch, setUserSearch] = useState('')
  const [guessSearch, setGuessSearch] = useState('')
  const [puzzleSearch, setPuzzleSearch] = useState('')

  // Debounced search values
  const debouncedUserSearch = useDebounce(userSearch, 300)
  const debouncedGuessSearch = useDebounce(guessSearch, 300)
  const debouncedPuzzleSearch = useDebounce(puzzleSearch, 300)

  // Filtered data based on search
  const filteredUsers = useMemo(() => {
    if (!debouncedUserSearch) return rows.filter(user => user.email && user.userId);
    return rows.filter(user => 
      user.email && 
      user.userId && 
      (user.username?.toLowerCase().includes(debouncedUserSearch.toLowerCase()) ||
       user.email?.toLowerCase().includes(debouncedUserSearch.toLowerCase()) ||
       user.readableId?.toString().includes(debouncedUserSearch))
    );
  }, [rows, debouncedUserSearch]);

  const filteredGuessScores = useMemo(() => {
    if (!debouncedGuessSearch) return rawScores.filter(s => s.game_key === 'guess' && s.user_id);
    return rawScores.filter(s => 
      s.game_key === 'guess' && 
      s.user_id &&
      (s.user_email?.toLowerCase().includes(debouncedGuessSearch.toLowerCase()) ||
       s.user_username?.toLowerCase().includes(debouncedGuessSearch.toLowerCase()) ||
       s.user_readable_id?.toString().includes(debouncedGuessSearch))
    );
  }, [rawScores, debouncedGuessSearch]);

  const filteredPuzzleScores = useMemo(() => {
    if (!debouncedPuzzleSearch) return rawScores.filter(s => s.game_key === 'puzzle' && s.user_id);
    return rawScores.filter(s => 
      s.game_key === 'puzzle' && 
      s.user_id &&
      (s.user_email?.toLowerCase().includes(debouncedPuzzleSearch.toLowerCase()) ||
       s.user_username?.toLowerCase().includes(debouncedPuzzleSearch.toLowerCase()) ||
       s.user_readable_id?.toString().includes(debouncedPuzzleSearch))
    );
  }, [rawScores, debouncedPuzzleSearch]);

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
    deleteAllUsers,
    userSearch,
    setUserSearch,
    guessSearch,
    setGuessSearch,
    puzzleSearch,
    setPuzzleSearch,
    filteredUsers,
    filteredGuessScores,
    filteredPuzzleScores
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
    <div className="min-w-full">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b">
            {headers.map((header, index) => {
              // Set specific column widths for better layout - mobile responsive
              let colClass = "py-2 pr-2 md:pr-4 font-medium text-gray-700"
              if (index === 0) colClass += " w-8 md:w-12" // Serial number column
              else if (index === 1) colClass += " w-16 md:w-20" // User ID column - wider on mobile
              else if (index === 2) colClass += " w-32 md:w-40" // Email/Phone column - much wider on mobile
              else if (index === 3) colClass += " w-24 md:w-32" // Username column - wider on mobile
              else if (index === 4) colClass += " w-20 md:w-24" // Games Played column
              else if (index === 5) colClass += " w-20 md:w-24" // Total Points column
              else if (index === 6) colClass += " w-32 md:w-40" // Last Played column - wider on mobile
              else if (index === 7) colClass += " w-20 md:w-20" // Actions column
              
              return (
                <th key={index} className={colClass}>{header}</th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {children}
        </tbody>
      </table>
    </div>
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

  return rows.map((r, idx) => {
    const userDisplay = r.email ? (
      isPhoneEmail(r.email) ? (
        `📱 +${extractPhoneFromEmail(r.email)}`
      ) : r.email
    ) : 'Unknown User'

    return (
      <tr key={r.userId} className="border-b hover:bg-gray-50">
        <td className="py-2 pr-2 md:pr-4 w-8 md:w-12 font-semibold text-gray-600">
          {idx + 1}
        </td>
        <td className="py-2 pr-2 md:pr-4 w-16 md:w-20">
          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
            {r.readableId ? `#${r.readableId}` : '-'}
          </span>
        </td>
        <td className="py-2 pr-2 md:pr-4 w-32 md:w-40 break-words min-w-0">
          <div className="truncate" title={userDisplay}>
            {userDisplay}
          </div>
        </td>
        <td className="py-2 pr-2 md:pr-4 w-24 md:w-32 break-words min-w-0">
          <div className="truncate" title={r.username || '-'}>
            {r.username || '-'}
          </div>
        </td>
        <td className="py-2 pr-2 md:pr-4 w-20 md:w-24">{r.gamesPlayed}</td>
        <td className="py-2 pr-2 md:pr-4 w-20 md:w-24">{r.totalScore}</td>
        <td className="py-2 pr-2 md:pr-4 w-32 md:w-40 text-xs">
          {r.lastPlayed ? new Date(r.lastPlayed).toLocaleString() : '-'}
        </td>
        <td className="py-2 pr-2 md:pr-4 w-20">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDelete(r.userId, userDisplay)}
            className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1"
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

  return leaderboard.map((row, idx) => {
    const userDisplay = row.user_username || (row.user_email ? (
      isPhoneEmail(row.user_email) ? (
        `📱 +${extractPhoneFromEmail(row.user_email)}`
      ) : row.user_email
    ) : 'Unknown User')

    // Get user ID from the user data - now using the correct field from API
    const userId = row.user_readable_id || '-'

    return (
      <tr key={row.id || idx} className="border-b hover:bg-gray-50">
        <td className="py-2 pr-4 w-12">{idx + 1}</td>
        <td className="py-2 pr-4 w-20">
          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
            {userId !== '-' ? `#${userId}` : '-'}
          </span>
        </td>
        <td className="py-2 pr-4 w-32 break-words min-w-0">
          <div className="truncate" title={userDisplay}>
            {userDisplay}
          </div>
        </td>
        <td className="py-2 pr-4 w-16 font-semibold">{row.score}</td>
        {showMovesTime && (
          <td className="py-2 pr-4 w-24">
            <span className="font-mono text-sm">
              {row.moves ?? '-'} / {row.time_taken_seconds ?? '-'}s
            </span>
          </td>
        )}
        {showTime && (
          <td className="py-2 pr-4 w-24">
            <span className="font-mono text-sm">
              {row.time_taken_seconds ? `${row.time_taken_seconds}s` : '-'}
            </span>
          </td>
        )}
        <td className="py-2 pr-4 w-32 text-xs">
          {row.created_at ? new Date(row.created_at).toLocaleString() : '-'}
        </td>
        <td className="py-2 pr-4 w-20">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDelete(row.id, userDisplay)}
            className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1"
          >
            🗑️ Delete
          </Button>
        </td>
      </tr>
    )
  })
}

const GameLeaderboard = ({ gameKey, rawScores, onDelete, onDeleteAll, searchValue, onSearchChange, searchPlaceholder }) => {
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
        // Removed .slice(0, 20) to show ALL users
    } else {
      // For puzzle game: sort by score first, then by moves (fewer is better), then by time (faster is better)
      return filteredScores
        .sort((a, b) => {
          if (b.score !== a.score) {
            return b.score - a.score // Higher score first
          }
          // If scores are equal, sort by moves (fewer moves first)
          const movesA = a.moves || 0
          const movesB = b.moves || 0
          if (movesA !== movesB) {
            return movesA - movesB // Fewer moves first
          }
          // If moves are also equal, sort by time (faster time first)
          const timeA = a.time_taken_seconds || 0
          const timeB = b.time_taken_seconds || 0
          return timeA - timeB // Faster time first
        })
        // Removed .slice(0, 20) to show ALL users
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
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <CardTitle className="text-lg sm:text-xl">{gameConfig.title}</CardTitle>
            <CardDescription className="text-sm">{gameConfig.description}</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchValue && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteAll}
              className="bg-red-700 hover:bg-red-800 text-white border-red-800 text-xs px-3 py-1"
              title={`Delete all ${gameKey} game results`}
            >
              🗑️ Delete All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          {searchValue && (
            <div className="mb-3 text-sm text-gray-600">
              Found {leaderboard.length} result{leaderboard.length !== 1 ? 's' : ''} matching "{searchValue}"
            </div>
          )}
          <div className="max-h-96 overflow-y-auto admin-table-scrollbar border border-gray-200 rounded-lg p-1 shadow-sm">
            <DataTable 
              headers={
                showMovesTime 
                  ? TABLE_CONFIG.leaderboard.headers 
                  : showTime 
                    ? ['#', 'User ID', 'User', 'Score', 'Time', 'When', 'Actions']
                    : ['#', 'User ID', 'User', 'Score', 'When', 'Actions']
              }
            >
              <LeaderboardTable gameKey={gameKey} leaderboard={leaderboard} onDelete={onDelete} showMovesTime={showMovesTime} showTime={showTime} />
            </DataTable>
          </div>
        </div>
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
    deleteAllUsers,
    userSearch,
    setUserSearch,
    guessSearch,
    setGuessSearch,
    puzzleSearch,
    setPuzzleSearch,
    filteredUsers,
    filteredGuessScores,
    filteredPuzzleScores
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">{DASHBOARD_CONFIG.title}</h1>
              <p className="text-sm sm:text-base text-gray-600">Signed in as: {adminEmail}</p>
            </div>
            <Button 
              variant="outline" 
              onClick={signOut}
              className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 text-sm px-4 py-2"
            >
              {DASHBOARD_CONFIG.signOut}
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && <ErrorMessage message={error} onRetry={reload} />}

        {/* Users Overview */}
        <Card className="mb-6 sm:mb-8">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <CardTitle className="text-lg sm:text-xl">Users Overview</CardTitle>
                <CardDescription className="text-sm">All users with games played and total points</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Search users by name, email, or ID..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {userSearch && (
                    <button
                      onClick={() => setUserSearch('')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete ALL users? This will also delete all their game results. This action cannot be undone.`)) {
                      deleteAllUsers()
                    }
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-2 w-full sm:w-auto"
                >
                  🗑️ Delete All Users
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              {userSearch && (
                <div className="mb-3 text-sm text-gray-600">
                  Found {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} matching "{userSearch}"
                </div>
              )}
              <div className="max-h-96 overflow-y-auto admin-table-scrollbar border border-gray-200 rounded-lg p-1 shadow-sm">
                <div className="min-w-[800px] md:min-w-0">
                  <DataTable headers={TABLE_CONFIG.users.headers}>
                    <UsersTable rows={filteredUsers} onDelete={deleteUser} />
                  </DataTable>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Game Settings */}
        <div className="mb-6 sm:mb-8">
          <GameSettingsManager />
        </div>

        {/* Per-game leaderboards */}
        <div className="grid grid-cols-1 gap-6 mb-6 sm:mb-8">
          <GameLeaderboard 
            key="guess"
            gameKey="guess" 
            rawScores={filteredGuessScores} 
            onDelete={deleteGameResult}
            onDeleteAll={deleteAllGameResults}
            searchValue={guessSearch}
            onSearchChange={setGuessSearch}
            searchPlaceholder="Search guess game results..."
          />
          <GameLeaderboard 
            key="puzzle"
            gameKey="puzzle" 
            rawScores={filteredPuzzleScores} 
            onDelete={deleteGameResult}
            onDeleteAll={deleteAllGameResults}
            searchValue={puzzleSearch}
            onSearchChange={setPuzzleSearch}
            searchPlaceholder="Search puzzle game results..."
          />
        </div>

        {/* Updates Manager */}
        <Card className="mb-6 sm:mb-8">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Daily Updates Management</CardTitle>
            <CardDescription className="text-sm">Send and manage devotional messages for all users</CardDescription>
          </CardHeader>
          <CardContent>
            <UpdatesManager adminEmail={adminEmail} />
          </CardContent>
        </Card>

        {/* Simple Refresh Button */}
        <div className="text-center sm:text-right">
          <Button variant="outline" onClick={reload} className="text-sm px-4 py-2">
            {DASHBOARD_CONFIG.refresh}
          </Button>
        </div>
      </div>
    </div>
  )
} 