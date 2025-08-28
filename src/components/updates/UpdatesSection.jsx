'use client'

import { useCallback, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useUpdates } from '@/contexts/UpdatesContext'

// Configuration for the updates section
const UPDATES_CONFIG = {
  title: 'Daily Updates',
  subtitle: 'Stay connected with our latest announcements and devotional messages',
  emptyMessage: 'No updates available at the moment. Check back soon for new messages!',
  loadingText: 'Loading updates...',
  refreshButton: '🔄 Refresh Updates',
  // Date formatting options
  dateFormat: {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  },
  // Styling classes
  styles: {
    section: 'px-4 py-16 md:px-8 lg:px-16',
    container: 'max-w-[85rem] mx-auto',
    header: 'text-center mb-12',
    title: 'text-3xl md:text-4xl font-bold mb-4',
    titleGradient: 'bg-gradient-to-r from-[#782A0F] to-[#DE4E1C] bg-clip-text text-transparent',
    subtitle: 'text-xl text-gray-600 max-w-2xl mx-auto',
    grid: 'grid gap-6 md:gap-8 max-w-4xl mx-auto',
    refreshButton: 'text-center mt-8',
    loading: 'animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B4513] mx-auto',
    loadingText: 'text-white/60 mt-4'
  }
}

// Update card component - memoized for performance
const UpdateCard = ({ update }) => {
  // Memoized date formatting function
  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', UPDATES_CONFIG.dateFormat)
  }, [])

  // Memoized formatted date
  const formattedDate = useMemo(() => formatDate(update.created_at), [update.created_at, formatDate])

  // Share functionality
  const handleShare = useCallback(async () => {
    // Ensure proper URL formatting for sharing
    const baseUrl = window.location.origin + window.location.pathname
    const shareUrl = `${baseUrl}#daily-updates`
    
    // Create a more engaging share text
    const shareText = update.title 
      ? `📢 ${update.title}\n\n${update.message}`
      : `📢 ${update.message}`
    
    // Update Open Graph meta tags for better sharing preview
    const updateOpenGraph = () => {
      // Update title
      const titleMeta = document.querySelector('meta[property="og:title"]')
      if (titleMeta) {
        titleMeta.setAttribute('content', `Daily Updates - ${update.title || 'Latest Announcements'}`)
      }
      
      // Update description
      const descMeta = document.querySelector('meta[property="og:description"]')
      if (descMeta) {
        const shortMessage = update.message.length > 150 
          ? update.message.substring(0, 150) + '...' 
          : update.message
        descMeta.setAttribute('content', shortMessage)
      }
      
      // Update image to daily updates specific image
      const imageMeta = document.querySelector('meta[property="og:image"]')
      if (imageMeta) {
        imageMeta.setAttribute('content', `${window.location.origin}/dailyupdate.png`)
      }
      
      // Update Twitter image too
      const twitterImageMeta = document.querySelector('meta[name="twitter:image"]')
      if (twitterImageMeta) {
        twitterImageMeta.setAttribute('content', `${window.location.origin}/dailyupdate.png`)
      }
    }
    
    // Update meta tags for better sharing
    updateOpenGraph()
    
    const shareData = {
      title: 'Daily Updates - Unprofessional Players',
      text: shareText,
      url: shareUrl
    }

    try {
      // Try native Web Share API first (works best on mobile)
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData)
      } else {
        // Fallback to clipboard copy for desktop
        const fullShareText = `${shareText}\n\n${shareUrl}`
        await navigator.clipboard.writeText(fullShareText)
        
        // Show success message with better visual feedback
        const shareButton = document.querySelector(`[data-share-id="${update.id}"]`)
        if (shareButton) {
          const originalHTML = shareButton.innerHTML
          shareButton.innerHTML = `
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          `
          shareButton.classList.add('bg-green-50', 'text-green-600')
          setTimeout(() => {
            shareButton.innerHTML = originalHTML
            shareButton.classList.remove('bg-green-50', 'text-green-600')
          }, 2000)
        }
      }
    } catch (error) {
      console.error('Error sharing:', error)
      // Fallback for older browsers or when Web Share API fails
      try {
        const fullShareText = `${shareText}\n\n${shareUrl}`
        await navigator.clipboard.writeText(fullShareText)
        
        const shareButton = document.querySelector(`[data-share-id="${update.id}"]`)
        if (shareButton) {
          const originalHTML = shareButton.innerHTML
          shareButton.innerHTML = `
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          `
          shareButton.classList.add('bg-green-50', 'text-green-600')
          setTimeout(() => {
            shareButton.innerHTML = originalHTML
            shareButton.classList.remove('bg-green-50', 'text-green-600')
          }, 2000)
        }
      } catch (clipboardError) {
        console.error('Clipboard fallback failed:', clipboardError)
        // Last resort: show alert
        alert('Link copied to clipboard!')
      }
    }
  }, [update.title, update.message, update.id])

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
                {formattedDate}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-4xl opacity-60 group-hover:opacity-100 transition-opacity">
                📢
              </div>
              <button
                onClick={handleShare}
                data-share-id={update.id}
                className="p-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-all duration-200 opacity-60 group-hover:opacity-100"
                title="Share this update"
                aria-label="Share this update"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              </button>
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
  const { updates, loading, hasUpdates, restartPolling, error } = useUpdates()

  // Memoized loading component
  const LoadingComponent = useMemo(() => (
    <section className={UPDATES_CONFIG.styles.section}>
      <div className={UPDATES_CONFIG.styles.container}>
        <div className="text-center">
          <div className={UPDATES_CONFIG.styles.loading}></div>
          <p className={UPDATES_CONFIG.styles.loadingText}>{UPDATES_CONFIG.loadingText}</p>
        </div>
      </div>
    </section>
  ), [])

  // Memoized section header
  const SectionHeader = useMemo(() => (
    <div className={UPDATES_CONFIG.styles.header}>
      <h2 className={UPDATES_CONFIG.styles.title}>
        <span className={UPDATES_CONFIG.styles.titleGradient}>
          {UPDATES_CONFIG.title}
        </span>
      </h2>
      <p className={UPDATES_CONFIG.styles.subtitle}>
        {UPDATES_CONFIG.subtitle}
      </p>
    </div>
  ), [])

  // Memoized updates grid
  const UpdatesGrid = useMemo(() => (
    <div className={UPDATES_CONFIG.styles.grid}>
      {updates?.map((update) => (
        <UpdateCard key={update.id} update={update} />
      ))}
    </div>
  ), [updates])

  // Memoized refresh button
  const RefreshButton = useMemo(() => (
    <div className={UPDATES_CONFIG.styles.refreshButton}>
      <Button
        onClick={restartPolling}
        variant="outline"
        className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
      >
        {UPDATES_CONFIG.refreshButton}
      </Button>
    </div>
  ), [restartPolling])

  // Don't render if no updates (AFTER all hooks are called)
  if (!hasUpdates) {
    return null
  }

  // Don't render the section if there are no updates
  if (loading) {
    return LoadingComponent
  }

  return (
    <section className={UPDATES_CONFIG.styles.section}>
      <div className={UPDATES_CONFIG.styles.container}>
        {/* Section Header */}
        {SectionHeader}

        {/* Updates Grid */}
        {UpdatesGrid}

        {/* Refresh Button */}
        {RefreshButton}
      </div>
    </section>
  )
}
