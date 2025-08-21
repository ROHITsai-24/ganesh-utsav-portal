'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// Configuration for the updates section
const UPDATES_CONFIG = {
  title: 'Daily Updates',
  subtitle: 'Stay connected with our latest announcements and devotional messages',
  emptyMessage: 'No updates available at the moment. Check back soon for new messages!',
  loadingText: 'Loading updates...'
}

// Update card component
const UpdateCard = ({ update }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
         <Card className="bg-white/95 backdrop-blur-sm border-white/30 hover:bg-white/100 transition-all duration-300 group shadow-lg">
       <CardContent className="p-6">
         <div className="space-y-4">
           {/* Update header */}
           <div className="flex items-start justify-between">
             <div className="flex-1">
               {update.title && (
                 <h3 className="text-xl font-semibold text-gray-800 mb-2">
                   {update.title}
                 </h3>
               )}
               <p className="text-gray-600 text-sm">
                 {formatDate(update.created_at)}
               </p>
             </div>
             <div className="text-4xl opacity-60 group-hover:opacity-100 transition-opacity">
               📢
             </div>
           </div>
           
           {/* Update message */}
           <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
             <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
               {update.message}
             </p>
           </div>
         </div>
       </CardContent>
     </Card>
  )
}

// Main updates section component
export default function UpdatesSection() {
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
        // Don't show error for table not existing, just return empty array
      } else {
        setUpdates(data.updates || [])
        setError(null)
      }
    } catch (err) {
      console.error('Error fetching updates:', err)
      setError('Failed to load updates')
    } finally {
      setLoading(false)
    }
  }

  // Don't render the section if there are no updates
  if (loading) {
    return (
      <section className="px-4 py-16 md:px-8 lg:px-16">
        <div className="max-w-[85rem] mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B4513] mx-auto"></div>
            <p className="text-white/60 mt-4">{UPDATES_CONFIG.loadingText}</p>
          </div>
        </div>
      </section>
    )
  }

  // Don't render if no updates
  if (!updates || updates.length === 0) {
    return null
  }

  return (
    <section className="px-4 py-16 md:px-8 lg:px-16">
      <div className="max-w-[85rem] mx-auto">
                 {/* Section Header */}
         <div className="text-center mb-12">
           <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
             {UPDATES_CONFIG.title}
           </h2>
           <p className="text-xl text-gray-600 max-w-2xl mx-auto">
             {UPDATES_CONFIG.subtitle}
           </p>
         </div>

        {/* Updates Grid */}
        <div className="grid gap-6 md:gap-8 max-w-4xl mx-auto">
          {updates.map((update) => (
            <UpdateCard key={update.id} update={update} />
          ))}
        </div>

                 {/* Refresh Button */}
         <div className="text-center mt-8">
           <Button
             onClick={fetchUpdates}
             variant="outline"
             className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
           >
             🔄 Refresh Updates
           </Button>
         </div>
      </div>
    </section>
  )
}
