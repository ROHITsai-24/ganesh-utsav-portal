'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import AdminDashboard from '@/components/admin/AdminDashboard'

// Configuration for admin page
const ADMIN_CONFIG = {
  loadingText: 'Loading admin...',
  accessDenied: {
    title: 'Access denied',
    message: 'You do not have permission to view this page.'
  },
  loadingSpinner: {
    size: 'h-12 w-12',
    color: 'border-blue-600'
  }
}

// Custom hook for admin authorization
const useAdminAuth = () => {
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const verifyAdmin = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      const currentEmail = session?.user?.email || ''
      
      if (!currentEmail) {
        setIsAuthorized(false)
        return
      }

      // Ask the server if this user is authorized (does not rely on NEXT_PUBLIC_ env)
      const res = await fetch('/api/admin/check', {
        headers: { 'x-admin-email': currentEmail }
      })
      
      if (!res.ok) {
        throw new Error(`Authorization failed: ${res.status}`)
      }
      
      setIsAuthorized(true)
    } catch (err) {
      console.error('Admin authorization error:', err)
      setError(err.message)
      setIsAuthorized(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    verifyAdmin()
  }, [verifyAdmin])

  return { isAuthorized, loading, error, retry: verifyAdmin }
}

// Loading component
const AdminLoading = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
    <div className="text-center">
      <div className={`animate-spin rounded-full ${ADMIN_CONFIG.loadingSpinner.size} border-b-2 ${ADMIN_CONFIG.loadingSpinner.color} mx-auto`}></div>
      <p className="mt-4 text-gray-600">{ADMIN_CONFIG.loadingText}</p>
    </div>
  </div>
)

// Access denied component
const AdminAccessDenied = ({ error, onRetry }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
    <div className="text-center max-w-md mx-auto px-4">
      <div className="mb-6">
        <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">{ADMIN_CONFIG.accessDenied.title}</h1>
        <p className="text-gray-600 mb-4">{ADMIN_CONFIG.accessDenied.message}</p>
        {error && (
          <p className="text-sm text-red-600 mb-4 bg-red-50 p-3 rounded-md border border-red-200">
            Error: {error}
          </p>
        )}
      </div>
      
      <div className="space-y-3">
        <button
          onClick={onRetry}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
        >
          Try Again
        </button>
        <button
          onClick={() => window.location.href = '/'}
          className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
        >
          Go Home
        </button>
      </div>
    </div>
  </div>
)

export default function AdminPage() {
  const { isAuthorized, loading, error, retry } = useAdminAuth()

  if (loading) {
    return <AdminLoading />
  }

  if (!isAuthorized) {
    return <AdminAccessDenied error={error} onRetry={retry} />
  }

  return <AdminDashboard />
}