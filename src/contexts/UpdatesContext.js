'use client'

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

// Configuration object for updates context
const UPDATES_CONTEXT_CONFIG = {
  // API endpoints
  api: {
    updates: '/api/updates'
  },
  // Polling configuration
  polling: {
    interval: 5000, // 5 seconds
    enabled: true
  },
  // Error messages
  errors: {
    contextError: 'useUpdates must be used within UpdatesProvider',
    fetchError: 'Failed to fetch updates'
  }
}

const UpdatesContext = createContext()

export const useUpdates = () => {
  const context = useContext(UpdatesContext)
  if (!context) {
    throw new Error(UPDATES_CONTEXT_CONFIG.errors.contextError)
  }
  return context
}

export const UpdatesProvider = ({ children }) => {
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)
  const [hasUpdates, setHasUpdates] = useState(false)
  const [error, setError] = useState(null)

  // Memoized function to fetch updates
  const fetchUpdates = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch(UPDATES_CONTEXT_CONFIG.api.updates)
      
      if (response.ok) {
        const data = await response.json()
        const updatesArray = data.updates || data || []
        setUpdates(updatesArray)
        setHasUpdates(updatesArray.length > 0)
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error fetching updates:', error)
      setError(UPDATES_CONTEXT_CONFIG.errors.fetchError)
      setUpdates([])
      setHasUpdates(false)
    } finally {
      setLoading(false)
    }
  }, [])

  // Memoized function to check for updates
  const checkForUpdates = useCallback(async () => {
    try {
      const response = await fetch(UPDATES_CONTEXT_CONFIG.api.updates)
      if (response.ok) {
        const data = await response.json()
        const updatesArray = data.updates || data || []
        const newHasUpdates = updatesArray.length > 0
        
        if (newHasUpdates !== hasUpdates) {
          setUpdates(updatesArray)
          setHasUpdates(newHasUpdates)
        }
        
        return newHasUpdates
      }
      return false
    } catch (error) {
      console.error('Error checking for updates:', error)
      return false
    }
  }, [hasUpdates])

  // Memoized function to start polling
  const startPolling = useCallback(() => {
    if (!UPDATES_CONTEXT_CONFIG.polling.enabled) return null
    
    return setInterval(async () => {
      // Check if any game is in progress before polling
      const isInActiveGameplay = document.querySelector('[data-game-playing="true"]')
      const isGameInProgress = window.gameInProgress === true
      
      // Only poll if NO game is in progress
      if (!isInActiveGameplay && !isGameInProgress) {
        const hasUpdatesResult = await checkForUpdates()
        
        // Stop polling if no updates exist
        if (!hasUpdatesResult) {
          console.log('No updates, stopped polling')
          return null
        }
      }
    }, UPDATES_CONTEXT_CONFIG.polling.interval)
  }, [checkForUpdates])

  // Memoized function to restart polling
  const restartPolling = useCallback(() => {
    fetchUpdates()
  }, [fetchUpdates])

  // Memoized function to clear interval
  const clearPollingInterval = useCallback((interval) => {
    if (interval) {
      clearInterval(interval)
    }
  }, [])

  // Effect for initial fetch and polling setup
  useEffect(() => {
    let interval = null

    // Initial fetch
    fetchUpdates()

    // Start polling only if updates exist and polling is enabled
    if (hasUpdates && UPDATES_CONTEXT_CONFIG.polling.enabled) {
      interval = startPolling()
    }

    return () => {
      clearPollingInterval(interval)
    }
  }, [hasUpdates, fetchUpdates, startPolling, clearPollingInterval])

  // Effect to handle polling when hasUpdates changes
  useEffect(() => {
    let interval = null

    if (hasUpdates && UPDATES_CONTEXT_CONFIG.polling.enabled) {
      interval = startPolling()
    }

    return () => {
      clearPollingInterval(interval)
    }
  }, [hasUpdates, startPolling, clearPollingInterval])

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    updates,
    hasUpdates,
    updatesCount: updates.length,
    loading,
    error,
    fetchUpdates,
    restartPolling
  }), [updates, hasUpdates, loading, error, fetchUpdates, restartPolling])

  return (
    <UpdatesContext.Provider value={contextValue}>
      {children}
    </UpdatesContext.Provider>
  )
}
