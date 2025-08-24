'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Displays the user's unique readable ID
 * @param {Object} props
 * @param {Object} props.user - Current user object
 * @param {string} props.className - Additional CSS classes
 */
export default function UserIdDisplay({ user, className = '' }) {
  const [readableId, setReadableId] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user?.id) {
      setReadableId(null)
      return
    }

    const fetchUserId = async () => {
      setLoading(true)
      try {
        // Get user metadata from Supabase
        const { data: { user: currentUser }, error } = await supabase.auth.getUser()
        
        if (error) {
          console.error('Error fetching user:', error)
          return
        }

        const userId = currentUser?.user_metadata?.readable_id
        setReadableId(userId)
      } catch (error) {
        console.error('Error fetching user ID:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserId()
  }, [user?.id])

  if (!user || loading) {
    return null
  }

  if (!readableId) {
    return null
  }

  return (
    <div className={`flex items-center space-x-2 px-3 py-2 bg-blue-100 rounded-full ${className}`}>
      <div className="w-4 h-4 bg-blue-400 rounded-full flex items-center justify-center">
        <span className="text-blue-800 text-xs font-bold">#</span>
      </div>
      <span className="text-blue-800 text-sm font-bold font-mono">
        {readableId}
      </span>
    </div>
  )
}
