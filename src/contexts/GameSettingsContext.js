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
  const [pollingInterval, setPollingInterval] = useState(null)

  const loadGameSettings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/game-settings', {
        cache: 'no-store' // Force fresh data every time
      })
      if (!response.ok) {
        throw new Error('Failed to load game settings')
      }
      
      const data = await response.json()
      const newSettings = data.gameSettings || {}
      setGameSettings(newSettings)
      
      // Smart polling: only poll if any game is disabled
      const hasDisabledGames = Object.values(newSettings).some(enabled => !enabled)
      
      if (hasDisabledGames && !pollingInterval) {
        // Start polling if any game is disabled
        const interval = setInterval(() => {
          loadGameSettings()
        }, 5000) // Check every 5 seconds when disabled
        setPollingInterval(interval)
      } else if (!hasDisabledGames && pollingInterval) {
        // Stop polling if all games are enabled
        clearInterval(pollingInterval)
        setPollingInterval(null)
      }
      
    } catch (err) {
      setError(err.message)
      // Default to all games enabled if loading fails
      setGameSettings({ puzzle: true, guess: true })
    } finally {
      setLoading(false)
    }
  }, [pollingInterval])

  const isGameEnabled = useCallback((gameKey) => {
    return gameSettings[gameKey] === true
  }, [gameSettings])

  useEffect(() => {
    loadGameSettings()
    
    // Cleanup polling on unmount
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [loadGameSettings])

  const value = {
    gameSettings,
    loading,
    error,
    isGameEnabled,
    reloadSettings: loadGameSettings,
    isPolling: !!pollingInterval
  }

  return (
    <GameSettingsContext.Provider value={value}>
      {children}
    </GameSettingsContext.Provider>
  )
}
