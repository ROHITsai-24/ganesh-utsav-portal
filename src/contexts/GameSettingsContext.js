'use client'

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

const GameSettingsContext = createContext()

export const useGameSettings = () => {
  const context = useContext(GameSettingsContext)
  if (!context) {
    throw new Error('useGameSettings must be used within a GameSettingsProvider')
  }
  return context
}

export const GameSettingsProvider = ({ children }) => {
  const [gameSettings, setGameSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadGameSettings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/game-settings', {
        cache: 'no-store'
      })
      if (!response.ok) {
        throw new Error('Failed to load game settings')
      }
      
      const data = await response.json()
      const newSettings = data.gameSettings || {}
      setGameSettings(newSettings)
      
    } catch (err) {
      setError(err.message)
      // Default to all games enabled if loading fails
      setGameSettings({ puzzle: { is_enabled: true, play_limit: 1 }, guess: { is_enabled: true, play_limit: 1 } })
    } finally {
      setLoading(false)
    }
  }, [])

  const isGameEnabled = useCallback((gameKey) => {
    return gameSettings[gameKey]?.is_enabled === true
  }, [gameSettings])

  const getGamePlayLimit = useCallback((gameKey) => {
    return gameSettings[gameKey]?.play_limit || 1
  }, [gameSettings])

  const hasEnabledGames = useMemo(() => {
    return Object.values(gameSettings).some(game => game.is_enabled);
  }, [gameSettings]);

  useEffect(() => {
    loadGameSettings() // Only load once on mount
  }, [loadGameSettings])

  // Smart polling - only when enabled games exist and no game is in progress
  useEffect(() => {
    if (!hasEnabledGames) return

    const interval = setInterval(() => {
      // Only refresh if user is on the page AND no game is in progress
      if (!document.hidden) {
        // Check multiple indicators to prevent refreshes during active gameplay
        const isInActiveGameplay = document.querySelector('[data-game-playing="true"]')
        const isGameInProgress = window.gameInProgress === true
        
        // Only refresh if NO game is in progress
        if (!isInActiveGameplay && !isGameInProgress) {
          loadGameSettings()
        }
      }
    }, 60000) // 1 minute for faster real-time updates

    return () => clearInterval(interval)
  }, [hasEnabledGames, loadGameSettings])

  const value = {
    gameSettings,
    loading,
    error,
    isGameEnabled,
    getGamePlayLimit,
    refreshSettings: loadGameSettings
  }

  return (
    <GameSettingsContext.Provider value={value}>
      {children}
    </GameSettingsContext.Provider>
  )
}
