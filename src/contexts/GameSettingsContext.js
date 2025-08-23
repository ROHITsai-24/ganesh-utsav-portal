'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

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

  useEffect(() => {
    loadGameSettings() // Only load once on mount
  }, [loadGameSettings])

  const value = {
    gameSettings,
    loading,
    error,
    isGameEnabled,
    getGamePlayLimit,
    reloadSettings: loadGameSettings,
    // Simple refresh function that can be called when needed
    refreshSettings: () => {
      loadGameSettings()
    }
  }

  return (
    <GameSettingsContext.Provider value={value}>
      {children}
    </GameSettingsContext.Provider>
  )
}
