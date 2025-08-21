'use client'

import { useState, useEffect } from 'react'
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
    confirmDelete: 'Are you sure you want to delete this update?'
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

  useEffect(() => {
    fetchUpdates()
  }, [])

  const fetchUpdates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/updates')
      
      if (!response.ok) {
        throw new Error('Failed to fetch updates')
      }
      
      const data = await response.json()
      
             if (data.message && data.message.includes('table not created')) {
         console.log('Updates table not created yet:', data.message)
         setUpdates([])
         setAlert({ type: 'info', message: 'Updates system not set up yet. Please create the database table first.' })
       } else {
         setUpdates(data.updates || [])
         setAlert(null) // Clear any existing alerts
       }
    } catch (error) {
      console.error('Error fetching updates:', error)
      setAlert({ type: 'error', message: 'Failed to load updates' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.message.trim()) {
      setAlert({ type: 'error', message: 'Message is required' })
      return
    }

    try {
      setSending(true)
      const response = await fetch('/api/admin/updates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': adminEmail
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Failed to send update')
      }

      const data = await response.json()
      
      // Clear form and show success message
      setFormData({ title: '', message: '' })
      setAlert({ type: 'success', message: UPDATES_MANAGER_CONFIG.messages.success })
      
      // Refresh updates list
      fetchUpdates()
      
      // Clear alert after 3 seconds
      setTimeout(() => setAlert(null), 3000)
      
    } catch (error) {
      console.error('Error sending update:', error)
      setAlert({ type: 'error', message: UPDATES_MANAGER_CONFIG.messages.error })
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async (updateId) => {
    if (!confirm(UPDATES_MANAGER_CONFIG.messages.confirmDelete)) {
      return
    }

    try {
      const response = await fetch('/api/admin/updates', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': adminEmail
        },
        body: JSON.stringify({ id: updateId })
      })

      if (!response.ok) {
        throw new Error('Failed to delete update')
      }

      setAlert({ type: 'success', message: UPDATES_MANAGER_CONFIG.messages.deleteSuccess })
      
      // Refresh updates list
      fetchUpdates()
      
      // Clear alert after 3 seconds
      setTimeout(() => setAlert(null), 3000)
      
    } catch (error) {
      console.error('Error deleting update:', error)
      setAlert({ type: 'error', message: UPDATES_MANAGER_CONFIG.messages.deleteError })
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
             {/* Header */}
       <div className="text-center">
         <h2 className="text-2xl font-bold text-gray-800 mb-2">
           {UPDATES_MANAGER_CONFIG.title}
         </h2>
         <p className="text-gray-600">
           {UPDATES_MANAGER_CONFIG.description}
         </p>
       </div>

      {/* Alert Messages */}
      {alert && (
        <Alert className={alert.type === 'success' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
          <AlertDescription className={alert.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {alert.message}
          </AlertDescription>
        </Alert>
      )}

             {/* Create Update Form */}
       <Card className="bg-white border border-gray-200 shadow-sm">
         <CardHeader>
           <CardTitle className="text-gray-800">Send New Update</CardTitle>
           <CardDescription className="text-gray-600">
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
                 className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
               />
             </div>
             
             <div>
               <Textarea
                 placeholder={UPDATES_MANAGER_CONFIG.form.messagePlaceholder}
                 value={formData.message}
                 onChange={(e) => handleInputChange('message', e.target.value)}
                 rows={4}
                 className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 resize-none"
                 required
               />
             </div>
            
            <Button
              type="submit"
              disabled={sending || !formData.message.trim()}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              {sending ? UPDATES_MANAGER_CONFIG.form.sendingText : UPDATES_MANAGER_CONFIG.form.submitText}
            </Button>
          </form>
        </CardContent>
      </Card>

             {/* Existing Updates */}
       <Card className="bg-white border border-gray-200 shadow-sm">
         <CardHeader>
           <CardTitle className="text-gray-800">Recent Updates</CardTitle>
           <CardDescription className="text-gray-600">
             Manage your sent messages
           </CardDescription>
         </CardHeader>
         <CardContent>
           {loading ? (
             <div className="text-center py-8">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
               <p className="text-gray-600 mt-4">Loading updates...</p>
             </div>
           ) : updates.length === 0 ? (
             <div className="text-center py-8">
               <div className="text-4xl mb-4">📢</div>
               <p className="text-gray-600">No updates sent yet</p>
             </div>
           ) : (
             <div className="space-y-4">
               {updates.map((update) => (
                 <div
                   key={update.id}
                   className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                 >
                   <div className="flex items-start justify-between">
                     <div className="flex-1">
                       {update.title && (
                         <h4 className="font-semibold text-gray-800 mb-2">
                           {update.title}
                         </h4>
                       )}
                       <p className="text-gray-600 text-sm mb-2">
                         {formatDate(update.created_at)}
                       </p>
                       <p className="text-gray-800 whitespace-pre-wrap">
                         {update.message}
                       </p>
                     </div>
                     <Button
                       variant="destructive"
                       size="sm"
                       onClick={() => handleDelete(update.id)}
                       className="ml-4 bg-red-600 hover:bg-red-700 text-white border-red-700"
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
