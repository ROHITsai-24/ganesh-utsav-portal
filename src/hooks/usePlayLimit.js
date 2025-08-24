import { useState, useEffect, useCallback } from 'react'

export const usePlayLimit = (user, gameKey) => {
  const [playCount, setPlayCount] = useState(0)
  const [playLimit, setPlayLimit] = useState(1)
  const [canPlay, setCanPlay] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const checkPlayLimit = useCallback(async () => {
    if (!user?.id || !gameKey) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Use the new enhanced API endpoint
      const response = await fetch('/api/check-play-limit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          gameKey: gameKey
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 403) {
          // Game disabled or limit reached
          if (errorData.action === 'rejected_disabled') {
            setCanPlay(false)
            setError('Game is currently disabled')
          } else if (errorData.action === 'rejected_limit') {
            setCanPlay(false)
            setPlayCount(errorData.playCount || 0)
            setPlayLimit(errorData.playLimit || 1)
          }
        } else {
          throw new Error(errorData.error || 'Failed to check play limit')
        }
      } else {
        const data = await response.json()
        setPlayCount(data.playCount)
        setPlayLimit(data.playLimit)
        setCanPlay(data.canPlay)
        setError(null)
      }
      
    } catch (err) {
      setError(err.message)
      // Default to allowing play if there's an error (fallback behavior)
      setCanPlay(true)
    } finally {
      setLoading(false)
    }
  }, [user?.id, gameKey])

  // Check on initial load
  useEffect(() => {
    checkPlayLimit()
  }, [checkPlayLimit])

  // Real-time checking - poll every 2 minutes when user is active
  useEffect(() => {
    if (!user || !gameKey) return

    const interval = setInterval(() => {
      // Only check if user is on the page and not idle
      if (!document.hidden) {
        checkPlayLimit()
      }
    }, 120000) // 2 minutes instead of 60 seconds

    return () => clearInterval(interval)
  }, [user, gameKey, checkPlayLimit])

  return {
    playCount,
    playLimit,
    canPlay,
    remainingPlays: Math.max(0, playLimit - playCount),
    loading,
    error,
    checkPlayLimit
  }
}
