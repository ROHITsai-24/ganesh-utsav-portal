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

      const response = await fetch(`/api/user-play-count?userId=${user.id}&gameKey=${gameKey}`)
      
      if (!response.ok) {
        throw new Error('Failed to check play limit')
      }

      const data = await response.json()
      setPlayCount(data.playCount)
      setPlayLimit(data.playLimit)
      setCanPlay(data.canPlay)
      
    } catch (err) {
      setError(err.message)
      // Default to allowing play if there's an error
      setCanPlay(true)
    } finally {
      setLoading(false)
    }
  }, [user?.id, gameKey])

  // Check on initial load
  useEffect(() => {
    checkPlayLimit()
  }, [checkPlayLimit])

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
