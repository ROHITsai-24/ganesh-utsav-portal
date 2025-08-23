'use client'

import { createContext, useContext, useState, useEffect } from 'react'

const UpdatesContext = createContext()

export const useUpdates = () => {
  const context = useContext(UpdatesContext)
  if (!context) {
    throw new Error('useUpdates must be used within UpdatesProvider')
  }
  return context
}

export const UpdatesProvider = ({ children }) => {
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)
  const [hasUpdates, setHasUpdates] = useState(false)

  const fetchUpdates = async () => {
    try {
      const response = await fetch('/api/updates')
      if (response.ok) {
        const data = await response.json()
        const updatesArray = data.updates || data
        setUpdates(updatesArray || [])
        setHasUpdates(updatesArray && Array.isArray(updatesArray) && updatesArray.length > 0)
      }
    } catch (error) {
      console.error('Error fetching updates:', error)
      setUpdates([])
      setHasUpdates(false)
    } finally {
      setLoading(false)
    }
  }

  // Smart polling: only when updates exist
  useEffect(() => {
    let interval

    const startPolling = () => {
      interval = setInterval(async () => {
        const response = await fetch('/api/updates')
        if (response.ok) {
          const data = await response.json()
          const updatesArray = data.updates || data
          const newHasUpdates = updatesArray && Array.isArray(updatesArray) && updatesArray.length > 0
          
          if (newHasUpdates !== hasUpdates) {
            setUpdates(updatesArray || [])
            setHasUpdates(newHasUpdates)
          }
          
          // 🎯 SMART: Stop polling if no updates exist
          if (!newHasUpdates) {
            clearInterval(interval)
            console.log('No updates, stopped polling')
          }
        }
      }, 5000)
    }

    // Initial fetch
    fetchUpdates()

    // Start polling only if updates exist
    if (hasUpdates) {
      startPolling()
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [hasUpdates])

  // Restart polling when updates are added (e.g., after admin adds update)
  const restartPolling = () => {
    fetchUpdates()
  }

  const value = {
    updates,
    hasUpdates,
    loading,
    fetchUpdates,
    restartPolling
  }

  return (
    <UpdatesContext.Provider value={value}>
      {children}
    </UpdatesContext.Provider>
  )
}
