'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Configuration for the updates manager
const UPDATES_MANAGER_CONFIG = {
  title: 'Daily Updates Manager',
  description: 'Create and manage devotional messages and announcements for all users',
  form: {
    titlePlaceholder: 'Update title (optional)',
    messagePlaceholder: 'Enter your devotional message or announcement...',
    submitText: 'Send Update',
    sendingText: 'Sending...'
  },
  messages: {
    success: 'Update sent successfully!',
    error: 'Failed to send update. Please try again.',
    deleteSuccess: 'Update deleted successfully!',
    deleteError: 'Failed to delete update. Please try again.',
    confirmDelete: 'Are you sure you want to delete this update?',
    messageRequired: 'Message is required',
    failedToFetch: 'Failed to load updates',
    failedToSend: 'Failed to send update',
    failedToDelete: 'Failed to delete update',
    tableNotCreated: 'Updates system not set up yet. Please create the database table first.'
  },
  // API endpoints
  api: {
    updates: '/api/updates',
    adminUpdates: '/api/admin/updates'
  },
  // Timing configuration
  timing: {
    alertTimeout: 3000, // 3 seconds
    dateFormat: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
  },
  // Styling classes
  styles: {
    alert: {
      success: 'border-green-500 bg-green-50',
      error: 'border-red-500 bg-red-50',
      info: 'border-blue-500 bg-blue-50'
    },
    alertText: {
      success: 'text-green-800',
      error: 'text-red-800',
      info: 'text-blue-800'
    },
    button: {
      submit: 'w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white',
      delete: 'ml-4 bg-red-600 hover:bg-red-700 text-white border-red-700'
    }
  }
}

export default function UpdatesManager({ adminEmail }) {
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    message: ''
  })
  const [alert, setAlert] = useState(null)

  // Memoized function to fetch updates
  const fetchUpdates = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(UPDATES_MANAGER_CONFIG.api.updates)
      
      if (!response.ok) {
        throw new Error(UPDATES_MANAGER_CONFIG.messages.failedToFetch)
      }
      
      const data = await response.json()
      
      if (data.message && data.message.includes('table not created')) {
        console.log('Updates table not created yet:', data.message)
        setUpdates([])
        setAlert({ 
          type: 'info', 
          message: UPDATES_MANAGER_CONFIG.messages.tableNotCreated 
        })
      } else {
        setUpdates(data.updates || [])
        setAlert(null) // Clear any existing alerts
      }
    } catch (error) {
      console.error('Error fetching updates:', error)
      setAlert({ 
        type: 'error', 
        message: UPDATES_MANAGER_CONFIG.messages.failedToFetch 
      })
    } finally {
      setLoading(false)
    }
  }, [])

  // Memoized function to handle input changes
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  // Memoized function to handle form submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    
    if (!formData.message.trim()) {
      setAlert({ 
        type: 'error', 
        message: UPDATES_MANAGER_CONFIG.messages.messageRequired 
      })
      return
    }

    try {
      setSending(true)
      const response = await fetch(UPDATES_MANAGER_CONFIG.api.adminUpdates, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': adminEmail
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error(UPDATES_MANAGER_CONFIG.messages.failedToSend)
      }

      const data = await response.json()
      
      // Clear form and show success message
      setFormData({ title: '', message: '' })
      setAlert({ 
        type: 'success', 
        message: UPDATES_MANAGER_CONFIG.messages.success 
      })
      
      // Refresh updates list
      fetchUpdates()
      
      // Clear alert after configured timeout
      setTimeout(() => setAlert(null), UPDATES_MANAGER_CONFIG.timing.alertTimeout)
      
    } catch (error) {
      console.error('Error sending update:', error)
      setAlert({ 
        type: 'error', 
        message: UPDATES_MANAGER_CONFIG.messages.error 
      })
    } finally {
      setSending(false)
    }
  }, [formData, adminEmail, fetchUpdates])

  // Memoized function to handle delete
  const handleDelete = useCallback(async (updateId) => {
    if (!confirm(UPDATES_MANAGER_CONFIG.messages.confirmDelete)) {
      return
    }

    try {
      const response = await fetch(UPDATES_MANAGER_CONFIG.api.adminUpdates, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': adminEmail
        },
        body: JSON.stringify({ id: updateId })
      })

      if (!response.ok) {
        throw new Error(UPDATES_MANAGER_CONFIG.messages.failedToDelete)
      }

      setAlert({ 
        type: 'success', 
        message: UPDATES_MANAGER_CONFIG.messages.deleteSuccess 
      })
      
      // Refresh updates list
      fetchUpdates()
      
      // Clear alert after configured timeout
      setTimeout(() => setAlert(null), UPDATES_MANAGER_CONFIG.timing.alertTimeout)
      
    } catch (error) {
      console.error('Error deleting update:', error)
      setAlert({ 
        type: 'error', 
        message: UPDATES_MANAGER_CONFIG.messages.deleteError 
      })
    }
  }, [adminEmail, fetchUpdates])

  // Memoized function to format date
  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', UPDATES_MANAGER_CONFIG.timing.dateFormat)
  }, [])

  // Memoized function to clear alert
  const clearAlert = useCallback(() => {
    setAlert(null)
  }, [])

  // Effect to fetch updates on component mount
  useEffect(() => {
    fetchUpdates()
  }, [fetchUpdates])

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
          {UPDATES_MANAGER_CONFIG.title}
        </h2>
        <p className="text-sm sm:text-base text-gray-600">
          {UPDATES_MANAGER_CONFIG.description}
        </p>
      </div>

      {/* Alert Messages */}
      {alert && (
        <Alert className={UPDATES_MANAGER_CONFIG.styles.alert[alert.type]}>
          <AlertDescription className={UPDATES_MANAGER_CONFIG.styles.alertText[alert.type]}>
            {alert.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Create Update Form */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-800 text-lg sm:text-xl">Send New Update</CardTitle>
          <CardDescription className="text-gray-600 text-sm">
            Create a new devotional message or announcement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder={UPDATES_MANAGER_CONFIG.form.titlePlaceholder}
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 text-sm sm:text-base"
              />
            </div>
            
            <div>
              <Textarea
                placeholder={UPDATES_MANAGER_CONFIG.form.messagePlaceholder}
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                rows={4}
                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 resize-none text-sm sm:text-base"
                required
              />
            </div>
           
            <Button
              type="submit"
              disabled={sending || !formData.message.trim()}
              className={UPDATES_MANAGER_CONFIG.styles.button.submit}
            >
              {sending ? UPDATES_MANAGER_CONFIG.form.sendingText : UPDATES_MANAGER_CONFIG.form.submitText}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Existing Updates */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-800 text-lg sm:text-xl">Recent Updates</CardTitle>
          <CardDescription className="text-gray-600 text-sm">
            Manage your sent messages
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
              <p className="text-gray-600 mt-4 text-sm">Loading updates...</p>
            </div>
          ) : updates.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📢</div>
              <p className="text-gray-600 text-sm">No updates sent yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {updates.map((update) => (
                <div
                  key={update.id}
                  className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200"
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {update.title && (
                        <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">
                          {update.title}
                        </h4>
                      )}
                      <p className="text-gray-600 text-xs mb-2">
                        {formatDate(update.created_at)}
                      </p>
                      <p className="text-gray-800 whitespace-pre-wrap text-sm sm:text-base">
                        {update.message}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(update.id)}
                      className={UPDATES_MANAGER_CONFIG.styles.button.delete + " text-xs px-3 py-1"}
                    >
                      🗑️
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
