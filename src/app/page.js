'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import UpdatesSection from '@/components/updates/UpdatesSection'
import { UpdatesProvider, useUpdates } from '@/contexts/UpdatesContext'
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext'



// Configuration objects for dynamic content - Now using translations
const SITE_CONFIG = {
  heroImage: '/ganesha.png'
}

const NAVIGATION_ITEMS = [
  { href: '#about', labelKey: 'about' },
  { href: '#games', labelKey: 'games' },
  { href: '#donation', labelKey: 'donation' },
  { href: '#daily-updates', labelKey: 'dailyUpdates', conditional: true }
]

const GAME_CONFIG = {
  game: {
    tag: 'gameTag',
    title: 'gameCardTitle',
    description: 'gameCardDescription'
  }
}

const JOURNEY_CONFIG = {
  years: [2020, 2021, 2022, 2023, 2024],
  defaultYear: 2020,
  // Year-specific content with carousel and gallery images
  yearContent: {
    2020: {
      // Carousel images (5 selected from year photos)
      memories: [
        { id: 1, titleKey: 'ganeshChaturthi2020', descriptionKey: 'desc1', image: '/2020/IMG_20200822_205348.jpg', gradient: 'from-orange-100 to-pink-100', border: 'border-orange-200', iconColor: 'text-orange-400' },
        { id: 2, titleKey: 'celebration2020', descriptionKey: 'desc2', image: '/2020/IMG_20200822_165021.jpg', gradient: 'from-yellow-100 to-orange-100', border: 'border-yellow-200', iconColor: 'text-yellow-400' },
        { id: 3, titleKey: 'devotion2020', descriptionKey: 'desc3', image: '/2020/IMG-20220823-WA0010.jpg', gradient: 'from-pink-100 to-red-100', border: 'border-pink-200', iconColor: 'text-pink-400' },
        { id: 4, titleKey: 'festival2020', descriptionKey: 'desc4', image: '/2020/IMG-20200823-WA0182.jpg', gradient: 'from-green-100 to-blue-100', border: 'border-green-200', iconColor: 'text-green-400' },
        { id: 5, titleKey: 'memories2020', descriptionKey: 'desc5', image: '/2020/IMG-20200823-WA0174.jpg', gradient: 'from-purple-100 to-indigo-100', border: 'border-purple-200', iconColor: 'text-purple-400' }
      ],
      // All gallery images for the year (from your year folders)
      gallery: [
        { id: 1, titleKey: 'ganeshChaturthi2020', image: '/2020/IMG_20200822_205348.jpg' },
        { id: 2, titleKey: 'celebration2020', image: '/2020/IMG_20200822_165021.jpg' },
        { id: 3, titleKey: 'devotion2020', image: '/2020/IMG-20220823-WA0010.jpg' },
        { id: 4, titleKey: 'festival2020', image: '/2020/IMG-20200823-WA0182.jpg' },
        { id: 5, titleKey: 'memories2020', image: '/2020/IMG-20200823-WA0174.jpg' },
        { id: 6, titleKey: 'memories2020', image: '/2020/IMG-20200823-WA0145.jpg' },
        { id: 7, titleKey: 'memories2020', image: '/2020/IMG-20200823-WA0101.jpg' },
        { id: 8, titleKey: 'memories2020', image: '/2020/IMG-20200823-WA0073.jpg' },
        { id: 9, titleKey: 'memories2020', image: '/2020/IMG-20200823-WA0024.jpg' },
        { id: 10, titleKey: 'memories2020', image: '/2020/IMG-20200823-WA0019.jpg' },
        { id: 11, titleKey: 'memories2020', image: '/2020/IMG-20200823-WA0001.jpg' },
        { id: 12, titleKey: 'memories2020', image: '/2020/IMG-20200822-WA0133.jpg' },
        { id: 13, titleKey: 'memories2020', image: '/2020/IMG-20200822-WA0120.jpg' },
        { id: 14, titleKey: 'memories2020', image: '/2020/IMG-20200822-WA0100.jpg' },
        { id: 15, titleKey: 'memories2020', image: '/2020/IMG-20200822-WA0074.jpg' },
        { id: 16, titleKey: 'memories2020', image: '/2020/IMG-20200822-WA0073.jpg' },
        { id: 17, titleKey: 'memories2020', image: '/2020/IMG-20200822-WA0045.jpg' },
        { id: 18, titleKey: 'memories2020', image: '/2020/IMG-20200822-WA0033.jpg' },
        { id: 19, titleKey: 'memories2020', image: '/2020/IMG-20200822-WA0026.jpg' }
      ]
    },
    2021: {
      // Carousel images (5 selected from year photos)
      memories: [
        { id: 1, titleKey: 'ganeshChaturthi2021', descriptionKey: 'desc1', image: '/2021/IMG_1422.jpg', gradient: 'from-blue-100 to-cyan-100', border: 'border-blue-200', iconColor: 'text-blue-400' },
        { id: 2, titleKey: 'celebration2021', descriptionKey: 'desc2', image: '/2021/IMG_1389.jpg', gradient: 'from-indigo-100 to-purple-100', border: 'border-indigo-200', iconColor: 'text-indigo-400' },
        { id: 3, titleKey: 'devotion2021', descriptionKey: 'desc3', image: '/2021/IMG_1386.jpg', gradient: 'from-teal-100 to-green-100', border: 'border-teal-200', iconColor: 'text-teal-400' },
        { id: 4, titleKey: 'festival2021', descriptionKey: 'desc4', image: '/2021/IMG_1379.jpg', gradient: 'from-red-100 to-pink-100', border: 'border-red-200', iconColor: 'text-red-400' },
        { id: 5, titleKey: 'memories2021', descriptionKey: 'desc5', image: '/2021/IMG_1375.jpg', gradient: 'from-amber-100 to-yellow-100', border: 'border-amber-200', iconColor: 'text-amber-400' }
      ],
      // All gallery images for the year (from your year folders)
      gallery: [
        { id: 1, titleKey: 'ganeshChaturthi2021', image: '/2021/IMG_1422.jpg' },
        { id: 2, titleKey: 'celebration2021', image: '/2021/IMG_1389.jpg' },
        { id: 3, titleKey: 'devotion2021', image: '/2021/IMG_1386.jpg' },
        { id: 4, titleKey: 'festival2021', image: '/2021/IMG_1379.jpg' },
        { id: 5, titleKey: 'memories2021', image: '/2021/IMG_1375.jpg' },
        { id: 6, titleKey: 'memories2021', image: '/2021/IMG_1362.jpg' },
        { id: 7, titleKey: 'memories2021', image: '/2021/IMG_1334.jpg' },
        { id: 8, titleKey: 'memories2021', image: '/2021/IMG_1303.jpg' },
        { id: 9, titleKey: 'memories2021', image: '/2021/IMG_1248.jpg' },
        { id: 10, titleKey: 'memories2021', image: '/2021/1631500195748-01.jpeg' },
        { id: 11, titleKey: 'memories2021', image: '/2021/IMG20210910093324.jpg' },
        { id: 12, titleKey: 'memories2021', image: '/2021/IMG_20210912_202041.jpg' },
        { id: 13, titleKey: 'memories2021', image: '/2021/IMG_20210912_201202.jpg' },
        { id: 14, titleKey: 'memories2021', image: '/2021/IMG_20210912_174000.jpg' },
        { id: 15, titleKey: 'memories2021', image: '/2021/IMG_20210911_202135.jpg' },
        { id: 16, titleKey: 'memories2021', image: '/2021/IMG_20210911_200703.jpg' },
        { id: 17, titleKey: 'memories2021', image: '/2021/IMG_20210911_200611.jpg' },
        { id: 18, titleKey: 'memories2021', image: '/2021/IMG_20210910_123641.jpg' },
        { id: 19, titleKey: 'memories2021', image: '/2021/IMG_20210910_112657.jpg' },
        { id: 20, titleKey: 'memories2021', image: '/2021/IMG_1565.jpg' },
        { id: 21, titleKey: 'memories2021', image: '/2021/IMG_1542.jpg' },
        { id: 22, titleKey: 'memories2021', image: '/2021/IMG_1518.jpg' },
        { id: 23, titleKey: 'memories2021', image: '/2021/IMG_1512.jpg' },
        { id: 24, titleKey: 'memories2021', image: '/2021/IMG_1509.jpg' },
        { id: 25, titleKey: 'memories2021', image: '/2021/IMG_1498.jpg' },
        { id: 26, titleKey: 'memories2021', image: '/2021/IMG_1482.jpg' }
      ]
    },
    2022: {
      // Carousel images (5 selected from year photos)
      memories: [
        { id: 1, titleKey: 'ganeshChaturthi2022', descriptionKey: 'desc1', image: '/2022/IMG20220904220638.jpg', gradient: 'from-emerald-100 to-teal-100', border: 'border-emerald-200', iconColor: 'text-emerald-400' },
        { id: 2, titleKey: 'celebration2022', descriptionKey: 'desc2', image: '/2022/IMG20220904181723.jpg', gradient: 'from-violet-100 to-purple-100', border: 'border-violet-200', iconColor: 'text-violet-400' },
        { id: 3, titleKey: 'devotion2022', descriptionKey: 'desc3', image: '/2022/IMG20220904181657.jpg', gradient: 'from-rose-100 to-pink-100', border: 'border-rose-200', iconColor: 'text-rose-400' },
        { id: 4, titleKey: 'festival2022', descriptionKey: 'desc4', image: '/2022/IMG20220903225511.jpg', gradient: 'from-sky-100 to-blue-100', border: 'border-sky-200', iconColor: 'text-sky-400' },
        { id: 5, titleKey: 'memories2022', descriptionKey: 'desc5', image: '/2022/IMG20220903225241.jpg', gradient: 'from-lime-100 to-green-100', border: 'border-lime-200', iconColor: 'text-lime-400' }
      ],
      // All gallery images for the year (from your year folders)
      gallery: [
        { id: 1, titleKey: 'ganeshChaturthi2022', image: '/2022/IMG20220904220638.jpg' },
        { id: 2, titleKey: 'celebration2022', image: '/2022/IMG20220904181723.jpg' },
        { id: 3, titleKey: 'devotion2022', image: '/2022/IMG20220904181657.jpg' },
        { id: 4, titleKey: 'festival2022', image: '/2022/IMG20220903225511.jpg' },
        { id: 5, titleKey: 'memories2022', image: '/2022/IMG20220903225241.jpg' },
        { id: 6, titleKey: 'memories2022', image: '/2022/IMG20220901192119.jpg' },
        { id: 7, titleKey: 'memories2022', image: '/2022/IMG20220901183853.jpg' },
        { id: 8, titleKey: 'memories2022', image: '/2022/IMG20220901183138.jpg' },
        { id: 9, titleKey: 'memories2022', image: '/2022/IMG20220901182716.jpg' },
        { id: 10, titleKey: 'memories2022', image: '/2022/IMG20220901182104.jpg' },
        { id: 11, titleKey: 'memories2022', image: '/2022/IMG20220901181517.jpg' },
        { id: 12, titleKey: 'memories2022', image: '/2022/IMG20220901172152.jpg' },
        { id: 13, titleKey: 'memories2022', image: '/2022/IMG20220901172125.jpg' },
        { id: 14, titleKey: 'memories2022', image: '/2022/IMG20220831133559.jpg' },
        { id: 15, titleKey: 'memories2022', image: '/2022/IMG20220831123108.jpg' },
        { id: 16, titleKey: 'memories2022', image: '/2022/IMG20220831114330.jpg' },
        { id: 17, titleKey: 'memories2022', image: '/2022/IMG20220831113519.jpg' },
        { id: 18, titleKey: 'memories2022', image: '/2022/IMG20220830232648.jpg' },
        { id: 19, titleKey: 'memories2022', image: '/2022/IMG-20220907-WA0006.jpg' },
        { id: 20, titleKey: 'memories2022', image: '/2022/IMG-20220901-WA0013.jpg' },
        { id: 21, titleKey: 'memories2022', image: '/2022/IMG-20220828-WA0014.jpg' },
        { id: 22, titleKey: 'memories2022', image: '/2022/1662141078872.jpg' }
      ]
    },
    2023: {
      // Carousel images (5 selected from year photos)
      memories: [
        { id: 1, titleKey: 'ganeshChaturthi2023', descriptionKey: 'desc1', image: '/2023/SAVE_20230919_095020.jpg', gradient: 'from-orange-100 to-amber-100', border: 'border-orange-200', iconColor: 'text-orange-400' },
        { id: 2, titleKey: 'celebration2023', descriptionKey: 'desc2', image: '/2023/IMG_20230922_215750.jpg', gradient: 'from-pink-100 to-rose-100', border: 'border-pink-200', iconColor: 'text-pink-400' },
        { id: 3, titleKey: 'devotion2023', descriptionKey: 'desc3', image: '/2023/IMG_20230922_215130.jpg', gradient: 'from-blue-100 to-indigo-100', border: 'border-blue-200', iconColor: 'text-blue-400' },
        { id: 4, titleKey: 'festival2023', descriptionKey: 'desc4', image: '/2023/IMG_20230922_204556.jpg', gradient: 'from-green-100 to-emerald-100', border: 'border-green-200', iconColor: 'text-green-400' },
        { id: 5, titleKey: 'memories2023', descriptionKey: 'desc5', image: '/2023/IMG_9961.jpg', gradient: 'from-purple-100 to-violet-100', border: 'border-purple-200', iconColor: 'text-purple-400' }
      ],
      // All gallery images for the year (from your year folders)
      gallery: [
        { id: 1, titleKey: 'ganeshChaturthi2023', image: '/2023/SAVE_20230919_095020.jpg' },
        { id: 2, titleKey: 'celebration2023', image: '/2023/IMG_20230922_215750.jpg' },
        { id: 3, titleKey: 'devotion2023', image: '/2023/IMG_20230922_215130.jpg' },
        { id: 4, titleKey: 'festival2023', image: '/2023/IMG_20230922_204556.jpg' },
        { id: 5, titleKey: 'memories2023', image: '/2023/IMG_9961.jpg' },
        { id: 6, titleKey: 'memories2023', image: '/2023/IMG_9902.jpg' },
        { id: 7, titleKey: 'memories2023', image: '/2023/IMG_9849.jpg' },
        { id: 8, titleKey: 'memories2023', image: '/2023/IMG_9846.jpg' },
        { id: 9, titleKey: 'memories2023', image: '/2023/IMG_9833.jpg' },
        { id: 10, titleKey: 'memories2023', image: '/2023/IMG_9784.jpg' },
        { id: 11, titleKey: 'memories2023', image: '/2023/IMG_0156.jpg' },
        { id: 12, titleKey: 'memories2023', image: '/2023/IMG_0146.jpg' },
        { id: 13, titleKey: 'memories2023', image: '/2023/IMG_0097.jpg' },
        { id: 14, titleKey: 'memories2023', image: '/2023/IMG_0075.jpg' },
        { id: 15, titleKey: 'memories2023', image: '/2023/IMG_0061.jpg' },
        { id: 16, titleKey: 'memories2023', image: '/2023/IMG_0054.jpg' },
        { id: 17, titleKey: 'memories2023', image: '/2023/IMG_0030.jpg' },
        { id: 18, titleKey: 'memories2023', image: '/2023/20230924_165011.jpg' },
        { id: 19, titleKey: 'memories2023', image: '/2023/IMG-20230918-WA0112.jpg' },
        { id: 20, titleKey: 'memories2023', image: '/2023/IMG-20230918-WA0055.jpg' },
        { id: 21, titleKey: 'memories2023', image: '/2023/51df652f55bb41139329ae634b8b0d33.jpg' }
      ]
    },
    2024: {
      // Carousel images (5 selected from year photos)
      memories: [
        { id: 1, titleKey: 'ganeshChaturthi2024', descriptionKey: 'desc1', image: '/2024/IMG-20240921-WA0075.jpg', gradient: 'from-cyan-100 to-blue-100', border: 'border-cyan-200', iconColor: 'text-cyan-400' },
        { id: 2, titleKey: 'celebration2024', descriptionKey: 'desc2', image: '/2024/IMG_6852.jpg', gradient: 'from-emerald-100 to-green-100', border: 'border-emerald-200', iconColor: 'text-emerald-400' },
        { id: 3, titleKey: 'devotion2024', descriptionKey: 'desc3', image: '/2024/IMG_6844.jpg', gradient: 'from-violet-100 to-purple-100', border: 'border-violet-200', iconColor: 'text-violet-400' },
        { id: 4, titleKey: 'festival2024', descriptionKey: 'desc4', image: '/2024/IMG_7083.jpg', gradient: 'from-rose-100 to-pink-100', border: 'border-rose-200', iconColor: 'text-rose-400' },
        { id: 5, titleKey: 'memories2024', descriptionKey: 'desc5', image: '/2024/IMG_7058.jpg', gradient: 'from-amber-100 to-orange-100', border: 'border-amber-200', iconColor: 'text-amber-400' }
      ],
      // All gallery images for the year (from your year folders)
      gallery: [
        { id: 1, titleKey: 'ganeshChaturthi2024', image: '/2024/IMG-20240921-WA0075.jpg' },
        { id: 2, titleKey: 'celebration2024', image: '/2024/IMG_6852.jpg' },
        { id: 3, titleKey: 'devotion2024', image: '/2024/IMG_6844.jpg' },
        { id: 4, titleKey: 'festival2024', image: '/2024/IMG_7083.jpg' },
        { id: 5, titleKey: 'memories2024', image: '/2024/IMG_7058.jpg' },
        { id: 6, titleKey: 'memories2024', image: '/2024/IMG_6997.jpg' },
        { id: 7, titleKey: 'memories2024', image: '/2024/IMG_6974.jpg' },
        { id: 8, titleKey: 'memories2024', image: '/2024/IMG_6953.jpg' },
        { id: 9, titleKey: 'memories2024', image: '/2024/IMG_6902.jpg' },
        { id: 10, titleKey: 'memories2024', image: '/2024/IMG_6736.jpg' },
        { id: 11, titleKey: 'memories2024', image: '/2024/IMG_6718.jpg' },
        { id: 12, titleKey: 'memories2024', image: '/2024/IMG_6717.jpg' },
        { id: 13, titleKey: 'memories2024', image: '/2024/IMG_6706.jpg' },
        { id: 14, titleKey: 'memories2024', image: '/2024/IMG_6647.jpg' },
        { id: 15, titleKey: 'memories2024', image: '/2024/IMG_6626.jpg' },
        { id: 16, titleKey: 'memories2024', image: '/2024/IMG_6593.jpg' },
        { id: 17, titleKey: 'memories2024', image: '/2024/IMG_6580.jpg' },
        { id: 18, titleKey: 'memories2024', image: '/2024/IMG_6571.jpg' },
        { id: 19, titleKey: 'memories2024', image: '/2024/IMG_6562.jpg' },
        { id: 20, titleKey: 'memories2024', image: '/2024/IMG_6561.jpg' },
        { id: 21, titleKey: 'memories2024', image: '/2024/IMG_6557.jpg' },
        { id: 22, titleKey: 'memories2024', image: '/2024/IMG_6524.jpg' },
        { id: 23, titleKey: 'memories2024', image: '/2024/IMG_6514.jpg' },
        { id: 24, titleKey: 'memories2024', image: '/2024/IMG_6423.jpg' },
        { id: 25, titleKey: 'memories2024', image: '/2024/IMG_6422.jpg' },
        { id: 26, titleKey: 'memories2024', image: '/2024/IMG_6394.jpg' },
        { id: 27, titleKey: 'memories2024', image: '/2024/IMG_6384.jpg' },
        { id: 28, titleKey: 'memories2024', image: '/2024/IMG_6379.jpg' },
        { id: 29, titleKey: 'memories2024', image: '/2024/IMG20240914173225.jpg' },
        { id: 30, titleKey: 'memories2024', image: '/2024/IMG20240913222500.jpg' },
        { id: 31, titleKey: 'memories2024', image: '/2024/IMG20240913222127.jpg' },
        { id: 32, titleKey: 'memories2024', image: '/2024/IMG_7092.jpg' },
        { id: 33, titleKey: 'memories2024', image: '/2024/IMG_6996.jpg' },
        { id: 34, titleKey: 'memories2024', image: '/2024/IMG_6888.jpg' },
        { id: 35, titleKey: 'memories2024', image: '/2024/IMG_6776.jpg' },
        { id: 36, titleKey: 'memories2024', image: '/2024/IMG_6766.jpg' },
        { id: 37, titleKey: 'memories2024', image: '/2024/IMG_6758.jpg' },
        { id: 38, titleKey: 'memories2024', image: '/2024/IMG_6651.jpg' },
        { id: 39, titleKey: 'memories2024', image: '/2024/IMG_6511.jpg' },
        { id: 40, titleKey: 'memories2024', image: '/2024/IMG_6386.jpg' },
        { id: 41, titleKey: 'memories2024', image: '/2024/IMG_7073.JPG' },
        { id: 42, titleKey: 'memories2024', image: '/2024/IMG-20240909-WA0016.jpg' },
        { id: 43, titleKey: 'memories2024', image: '/2024/257610f7-50ae-428a-8e2a-f78983c73a8f.JPG' }
      ]
    }
  }
}



// Custom hook for Supabase authentication
const useSupabaseAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables')
      setLoading(false)
      return
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user || null)
      } catch (error) {
        console.error('Error getting session:', error)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}

// Reusable components
const NavigationItem = ({ href, labelKey, className = '' }) => {
  const { translations } = useLanguage()
  
  const handleClick = (e) => {
    if (href.startsWith('#')) {
      e.preventDefault()
      const element = document.querySelector(href)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  return (
    <a 
      href={href} 
      className={`text-gray-700 hover:text-[#8B4513] transition-colors cursor-pointer ${className}`}
      onClick={handleClick}
    >
      {translations[labelKey]}
    </a>
  )
}

const LanguageSelector = ({ className = '' }) => {
  const { language, toggleLanguage, translations } = useLanguage()
  
  return (
    <button 
      onClick={toggleLanguage}
      className={`flex items-center space-x-2 font-bold cursor-pointer ${className}`}
    >
      <span className={language === 'en' ? 'text-[#8B4513]' : 'text-[#8B4513]/50'}>
        English
      </span>
      <span className="text-gray-700">|</span>
      <span className={language === 'te' ? 'text-[#8B4513]' : 'text-[#8B4513]/50'}>
        తెలుగు
      </span>
    </button>
  )
}

const CTAButton = ({ children, className = '', ...props }) => (
  <Button 
    className={`bg-[#8B4513] hover:bg-[#A0522D] text-white px-6 py-3 rounded-full ${className}`}
    {...props}
  >
    {children}
  </Button>
)

const SectionTag = ({ children, className = '' }) => (
  <div className={`inline-block bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-medium ${className}`}>
    {children}
  </div>
)

const GradientHeading = ({ children, className = '' }) => (
  <span className={`bg-gradient-to-r from-[#782A0F] to-[#DE4E1C] bg-clip-text text-transparent ${className}`}>
    {children}
  </span>
)

// Carousel Row Component for optimized carousel rendering
const CarouselRow = ({ memories, direction, rowId, onImageClick }) => {
  const animationClass = direction === 'left' ? 'animate-move-left' : 'animate-move-right'
  const justifyClass = direction === 'right' ? 'justify-end' : ''
  
  return (
    <div className={`flex gap-4 ${justifyClass} ${animationClass} ${rowId === 'row1' ? 'mb-6' : ''}`}>
      {/* Original content */}
      {memories.map((memory, index) => (
        <PhotoGridItem 
          key={`${rowId}-orig-${memory.id}`} 
          config={memory} 
          index={index} 
          onClick={onImageClick}
        />
      ))}
      {/* Duplicated content for seamless loop */}
      {memories.map((memory, index) => (
        <PhotoGridItem 
          key={`${rowId}-dupe-${memory.id}`} 
          config={memory} 
          index={index} 
          onClick={onImageClick}
        />
      ))}
    </div>
  )
}

// Photo Grid Item Component with Enhanced Lazy Loading (Original Design)
const PhotoGridItem = ({ config, className = '', index = 0, onClick }) => {
  const { translations } = useLanguage()
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const imageRef = useRef(null)

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    )

    if (imageRef.current) {
      observer.observe(imageRef.current)
    }

    return () => {
      if (imageRef.current) {
        observer.unobserve(imageRef.current)
      }
    }
  }, [])

  // Optimized width calculation based on index pattern (Original)
  const getWidthClass = (index) => {
    const widthPatterns = ['w-96', 'w-56', 'w-80', 'w-64', 'w-72']
    return widthPatterns[index % widthPatterns.length]
  }

  const widthClass = getWidthClass(index)

  return (
    <div 
      ref={imageRef}
      className={`flex-shrink-0 ${widthClass} h-56 bg-gradient-to-br ${config.gradient} rounded-2xl border ${config.border} overflow-hidden shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer ${className}`}
      onClick={onClick}
      // Mobile touch optimizations
      onTouchStart={(e) => {
        e.currentTarget.style.transform = 'scale(0.98)'
      }}
      onTouchEnd={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
      }}
      onTouchCancel={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
      }}
    >
      {/* Image Container */}
      <div className="relative w-full h-full">
        {/* Loading State */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gradient-to-br ${config.gradient} flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
          </div>
        )}
        
        {/* Error State */}
        {imageError && (
          <div className="absolute inset-0 bg-gradient-to-br ${config.gradient} flex items-center justify-center">
            <div className="text-center text-gray-600">
              <svg className={`w-16 h-16 mx-auto mb-3 ${config.iconColor}`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
              </svg>
              <p className="text-sm">{translations.imageLoadError}</p>
            </div>
          </div>
        )}
        
        {/* Actual Image with Lazy Loading */}
        {isInView && !imageError && (
          <img 
            src={config.image} 
            alt={translations[config.titleKey] || 'Memory'}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            loading="lazy"
            // Prevent zoom on double-tap for mobile
            style={{ touchAction: 'manipulation' }}
          />
        )}
        
        {/* Overlay with title */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4">
          <h3 className="text-white font-semibold text-sm md:text-base truncate">
            {translations[config.titleKey]}
          </h3>
        </div>
      </div>
    </div>
  )
}

// Gallery Grid Component (Google Photos Style) with Mobile Touch Support and Smooth Transitions
const GalleryGrid = ({ isOpen, onClose, images, onImageClick, currentYear, onYearChange }) => {
  const { translations } = useLanguage()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [displayImages, setDisplayImages] = useState(images)
  
  // Add CSS keyframes for smooth animations
  useEffect(() => {
    if (!document.getElementById('gallery-animations')) {
      const style = document.createElement('style')
      style.id = 'gallery-animations'
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeOut {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(-20px); }
        }
      `
      document.head.appendChild(style)
    }
  }, [])
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Smooth transition when images change
  useEffect(() => {
    if (images.length > 0) {
      setIsTransitioning(true)
      const timer = setTimeout(() => {
        setDisplayImages(images)
        setIsTransitioning(false)
      }, 150) // Quick fade transition
      return () => clearTimeout(timer)
    }
  }, [images])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-white">
      {/* Header with Year Navigation */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{translations.galleryTitle}</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 transition-colors p-2"
            aria-label={translations.closeGallery}
            // Mobile touch optimization
            onTouchStart={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)'
            }}
            onTouchEnd={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Year Navigation with Smooth Transitions */}
        <div className="flex items-center space-x-2">
          {JOURNEY_CONFIG.years.map((year) => (
            <button
              key={year}
              onClick={() => {
                // Add smooth transition effect when changing years
                setIsTransitioning(true)
                onYearChange(year)
              }}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                year === currentYear
                  ? 'bg-[#8B4513] text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
              }`}
              // Mobile touch optimization
              onTouchStart={(e) => {
                e.currentTarget.style.transform = 'scale(0.95)'
              }}
              onTouchEnd={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      {/* Asymmetrical Gallery Grid (Google Photos Style) with Smooth Transitions */}
      <div className="p-4 overflow-y-auto h-[calc(100vh-120px)]">
        <div 
          className={`columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4 transition-all duration-300 ${
            isTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
          }`} 
          style={{
            columnGap: '1rem',
            columnFill: 'balance'
          }}
        >
          {displayImages.map((image, index) => (
            <div
              key={`${image.id}-${currentYear}`}
              className="break-inside-avoid mb-4 overflow-hidden rounded-lg cursor-pointer hover:opacity-80 transition-all duration-500 ease-out hover:scale-[1.02] group"
              style={{
                animation: isTransitioning ? 'none' : 'fadeIn 0.5s ease-out'
              }}
              onClick={() => onImageClick(index)}
              // Mobile touch optimizations
              onTouchStart={(e) => {
                e.currentTarget.style.transform = 'scale(0.98)'
              }}
              onTouchEnd={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
              onTouchCancel={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <div className="relative">
                <img
                  src={image.image}
                  alt={translations[image.titleKey] || 'Gallery Image'}
                  className="w-full h-auto object-cover rounded-lg"
                  loading="lazy"
                  onLoad={(e) => {
                    // Add natural aspect ratio class based on image dimensions
                    const img = e.target
                    const aspectRatio = img.naturalWidth / img.naturalHeight
                    if (aspectRatio > 1.5) {
                      img.classList.add('landscape-wide')
                    } else if (aspectRatio < 0.7) {
                      img.classList.add('portrait-tall')
                    }
                  }}
                  // Prevent zoom on double-tap for mobile
                  style={{ touchAction: 'manipulation' }}
                />
                {/* Hover overlay with image info */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 rounded-lg flex items-end">
                  <div className="w-full p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-white text-sm font-medium truncate">
                      {translations[image.titleKey] || 'Memory'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Single Image Modal Component with Mobile Touch Support
const SingleImageModal = ({ isOpen, onClose, image, currentIndex, totalImages, onNavigate }) => {
  const { translations } = useLanguage()
  
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'ArrowLeft') onNavigate('prev')
    if (e.key === 'ArrowRight') onNavigate('next')
  }, [onClose, onNavigate])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen || !image) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors p-2"
        aria-label={translations.closeGallery}
        // Mobile touch optimization
        onTouchStart={(e) => {
          e.currentTarget.style.transform = 'scale(0.95)'
        }}
        onTouchEnd={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
        }}
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Navigation buttons */}
      <button
        onClick={() => onNavigate('prev')}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:text-gray-300 transition-colors p-2"
        aria-label={translations.previousPhoto}
        // Mobile touch optimization
        onTouchStart={(e) => {
          e.currentTarget.style.transform = 'scale(0.95)'
        }}
        onTouchEnd={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
        }}
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={() => onNavigate('next')}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:text-gray-300 transition-colors p-2"
        aria-label={translations.nextPhoto}
        // Mobile touch optimization
        onTouchStart={(e) => {
          e.currentTarget.style.transform = 'scale(0.95)'
        }}
        onTouchEnd={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
        }}
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Image container */}
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <div className="max-w-4xl max-h-full">
          <img
            src={image.image}
            alt={translations[image.titleKey] || 'Gallery Image'}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            // Prevent zoom on double-tap for mobile
            style={{ touchAction: 'manipulation' }}
          />
        </div>
      </div>

      {/* Image info */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full backdrop-blur-sm">
        <p className="text-sm font-medium">
          {translations.photoOf.replace('{current}', currentIndex + 1).replace('{total}', totalImages)}
        </p>
        <p className="text-xs opacity-80">
          {translations[image.titleKey]}
        </p>
      </div>
    </div>
  )
}



// Optimized game card component
const GameCard = ({ game, className = '' }) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const { translations } = useLanguage()

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      <div className="bg-[#CD5C5C] rounded-3xl p-6 md:p-12 shadow-2xl relative overflow-hidden">
        {/* Game Tag */}
        <div className="inline-block bg-white text-black px-4 py-2 rounded-full text-sm font-medium mb-4 md:mb-8 border border-black">
          {translations[game.tag]}
        </div>

        {/* Desktop Layout: Image Left, Content Right */}
        <div className="md:flex md:items-center md:gap-12">
          {/* Left Side - Illustration Section */}
          <div className="md:w-1/2 relative mb-4 md:mb-0">
            {/* Light blob background */}
            <div className="w-48 md:w-64 h-32 md:h-40 mx-auto md:mx-0 md:ml-8 bg-white/20 rounded-full blur-sm mb-3 md:mb-4"></div>
            
            {/* Main illustration with figures */}
            <div className="relative z-10">
              {!imageLoaded && !imageError && (
                <div className="w-48 md:w-80 h-32 md:h-52 mx-auto md:mx-0 bg-white/20 rounded-2xl flex items-center justify-center image-loading">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}
              
              {!imageError ? (
                <img 
                  src="/OBJECT.svg" 
                  alt="Guess My Ganesha Game Illustration" 
                  className={`w-48 md:w-80 h-32 md:h-52 mx-auto md:mx-0 object-contain transition-opacity duration-300 ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                  loading="lazy"
                />
              ) : (
                <div className="w-48 md:w-80 h-32 md:h-52 mx-auto md:mx-0 bg-white/20 rounded-2xl flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="text-4xl mb-2">🎮</div>
                    <p className="text-sm">Game Illustration</p>
                  </div>
                </div>
              )}
            </div>

            {/* Floating question marks - restored to original inline positioning */}
            <div className="absolute top-0 left-8 md:left-20 text-3xl md:text-4xl text-orange-300 animate-bounce">?</div>
            <div className="absolute top-4 right-12 md:right-24 text-2xl md:text-3xl text-orange-200 animate-bounce-delay-1">?</div>
            <div className="absolute bottom-8 left-16 md:left-28 text-xl md:text-2xl text-orange-100 animate-bounce-delay-2">?</div>
          </div>

          {/* Right Side - Content */}
          <div className="md:w-1/2 md:text-left text-center">
            {/* Game Title */}
            <h3 className="text-2xl md:text-4xl font-bold text-white mb-3 md:mb-6">
              {translations[game.title]}
            </h3>

            {/* Game Description */}
            <p className="text-white/90 mb-6 md:mb-10 text-sm md:text-base leading-relaxed max-w-sm md:max-w-lg mx-auto md:mx-0">
              {translations[game.description]}
            </p>

            {/* Play Now Button */}
            <Link href="/games?showGames=true">
              <Button className="bg-black hover:bg-gray-800 text-white px-8 md:px-12 py-4 md:py-5 rounded-full text-lg md:text-xl font-semibold w-full md:w-auto transition-all duration-300 hover:scale-105 shadow-lg">
                {translations.playNow}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function HomeContent() {
  const { user, loading } = useSupabaseAuth()
  const { hasUpdates } = useUpdates()
  const { translations } = useLanguage()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [selectedYear, setSelectedYear] = useState(JOURNEY_CONFIG.defaultYear)
  const [galleryImages, setGalleryImages] = useState([])
  const [isGalleryGridOpen, setIsGalleryGridOpen] = useState(false)
  const [isSingleImageOpen, setIsSingleImageOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Memoized handlers
  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => !prev)
  }, [])

  const handleYearSelect = useCallback((year) => {
    setSelectedYear(year)
  }, [])

  const openGalleryGrid = useCallback((year) => {
    const yearContent = JOURNEY_CONFIG.yearContent[year]
    if (yearContent && yearContent.gallery) {
      setGalleryImages(yearContent.gallery)
      setSelectedYear(year) // Update the selected year state
      setIsGalleryGridOpen(true)
    }
  }, [])

  const closeGalleryGrid = useCallback(() => {
    setIsGalleryGridOpen(false)
  }, [])

  const openSingleImage = useCallback((index) => {
    setCurrentImageIndex(index)
    setIsSingleImageOpen(true)
  }, [])

  const closeSingleImage = useCallback(() => {
    setIsSingleImageOpen(false)
  }, [])

  const navigateSingleImage = useCallback((direction) => {
    setCurrentImageIndex(prev => {
      if (direction === 'next') {
        return (prev + 1) % galleryImages.length
      } else {
        return (prev - 1 + galleryImages.length) % galleryImages.length
      }
    })
  }, [galleryImages])

  // Memoized computed values
  const isYearSelected = useCallback((year) => year === selectedYear, [selectedYear])

  const yearButtonClasses = useCallback((year) => {
    const baseClasses = 'px-3 py-2 md:px-6 md:py-3 rounded-full font-medium transition-all duration-300 text-sm md:text-base'
    return isYearSelected(year)
      ? `${baseClasses} bg-black text-white`
      : `${baseClasses} bg-white text-gray-700 border border-gray-200 hover:border-gray-300`
  }, [isYearSelected])

  // Get current year content
  const currentYearContent = useMemo(() => {
    return JOURNEY_CONFIG.yearContent[selectedYear] || JOURNEY_CONFIG.yearContent[JOURNEY_CONFIG.defaultYear]
  }, [selectedYear])

  // Filter navigation items based on conditions (e.g., updates availability)
  const filteredNavigationItems = useMemo(() => {
    return NAVIGATION_ITEMS.filter(item => {
      if (item.conditional) {
        return hasUpdates
      }
      return true
    })
  }, [hasUpdates])

  // Split memories into two rows for alternating animation
  const { row1Memories, row2Memories } = useMemo(() => {
    const memories = currentYearContent?.memories || []
    const midPoint = Math.ceil(memories.length / 2)
    return {
      row1Memories: memories.slice(0, midPoint),
      row2Memories: memories.slice(midPoint)
    }
  }, [currentYearContent])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFCFA] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B4513] mx-auto mb-4"></div>
          <p className="text-gray-600">{translations.loading}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDFCFA]">
      {/* Header/Navigation */}
      <header className="relative z-50 px-4 py-3 md:py-6 md:px-8 lg:px-16 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <nav className="max-w-[85rem] mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="text-2xl font-bold text-[#8B4513]">
            {translations.title}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {filteredNavigationItems.map((item) => (
              <NavigationItem key={item.href} {...item} />
            ))}
            
            <LanguageSelector />
            
            <Link href="/games">
              <CTAButton>{translations.ctaText}</CTAButton>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-100 shadow-lg">
            <div className="px-4 py-6 space-y-4">
              {filteredNavigationItems.map((item) => (
                <NavigationItem key={item.href} {...item} className="block py-2" />
              ))}
              
              <div className="pt-4 border-t border-gray-100">
                <LanguageSelector className="mb-4" />
                
                <Link href="/games">
                  <CTAButton className="w-full">{translations.ctaText}</CTAButton>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="px-4 py-16 md:py-24 lg:py-32 md:px-8 lg:px-12">
        <div className="max-w-[85rem] mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <SectionTag>{translations.ganeshChaturthi}</SectionTag>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight max-w-2xl md:max-w-3xl lg:max-w-4xl">
                <GradientHeading>{translations.tagline}</GradientHeading>
              </h1>

              {/* Mobile: Ganesh Image below heading */}
              <div className="lg:hidden flex justify-center mb-6">
                <div className="relative">
                  <img 
                    src={SITE_CONFIG.heroImage} 
                    alt={translations.heroImageAlt} 
                    className="w-80 h-80 object-contain"
                  />
                </div>
              </div>

              <p className="text-lg text-gray-600 leading-relaxed max-w-lg">
                {translations.description}
              </p>

              <div className="flex items-center space-x-4">
                <Link href="/games">
                  <CTAButton className="px-8 py-4 text-lg font-semibold">
                    {translations.ctaText}
                  </CTAButton>
                </Link>
              </div>
            </div>

            {/* Desktop: Right Image */}
            <div className="hidden lg:flex justify-end">
              <div className="relative">
                <img 
                  src={SITE_CONFIG.heroImage} 
                  alt={translations.heroImageAlt} 
                  className="w-[500px] h-[500px] object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ganpati Games Section */}
      <section id="games" className="px-4 py-16 md:py-24 md:px-8 lg:px-16 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <SectionTag className="mb-6">{translations.gameTitle}</SectionTag>

          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <GradientHeading>{translations.gameTitle}</GradientHeading>
          </h2>
          <p className="text-3xl md:text-4xl font-bold mb-8">
            <GradientHeading>{translations.gameSubtitle}</GradientHeading>
          </p>

          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
            {translations.gameDescription}
          </p>

          {/* Game Card - Updated Design */}
          <GameCard game={GAME_CONFIG.game} />
        </div>
      </section>

      {/* 5-Year Journey Section */}
      <section id="about" className="px-4 py-16 md:py-24 md:px-8 lg:px-16 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <SectionTag className="mb-6">{translations.ourStory}</SectionTag>

          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <GradientHeading>{translations.journeyTitle}</GradientHeading>
          </h2>
          
          <p className="text-lg text-gray-600 mb-12 max-w-3xl mx-auto">
            {translations.journeyDescription}
          </p>

          {/* Year Navigation */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-12 px-4">
            {JOURNEY_CONFIG.years.map((year) => (
              <button
                key={year}
                className={yearButtonClasses(year)}
                onClick={() => handleYearSelect(year)}
              >
                {year}
              </button>
            ))}
          </div>

          {/* Asymmetric Photo Grid - Full Width Breaking Container */}
          <div className="relative w-screen left-1/2 -ml-[50vw] overflow-hidden mb-12">
            {/* Loading state */}
            {!currentYearContent && (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B4513] mx-auto mb-4"></div>
                  <p className="text-gray-600">{translations.loadingMemories}</p>
                </div>
              </div>
            )}

            {/* Empty state */}
            {currentYearContent && (!row1Memories.length && !row2Memories.length) && (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📸</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">{translations.noMemoriesYet}</h3>
                <p className="text-gray-600">{translations.memoriesForYear.replace('{year}', selectedYear)}</p>
              </div>
            )}

            {/* Carousel content */}
            {currentYearContent && row1Memories.length > 0 && (
              <>
                {/* First Row - Moving Left with Duplicated Content */}
                <CarouselRow 
                  memories={row1Memories}
                  direction="left"
                  rowId="row1"
                  onImageClick={() => openGalleryGrid(selectedYear)}
                />
                
                {/* Second Row - Moving Right with Duplicated Content */}
                {row2Memories.length > 0 && (
                  <CarouselRow 
                    memories={row2Memories}
                    direction="right"
                    rowId="row2"
                    onImageClick={() => openGalleryGrid(selectedYear)}
                  />
                )}
              </>
            )}
          </div>

          {/* View All Button */}
          <div className="text-center">
            <Button 
              className="bg-black hover:bg-gray-800 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-300"
              onClick={() => openGalleryGrid(selectedYear)}
            >
              {translations.viewAll}
            </Button>
          </div>
        </div>
      </section>

      {/* Updates Section */}
      <section id="daily-updates">
        <UpdatesSection />
      </section>

      {/* Footer */}
              <footer className="relative bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 text-gray-800 px-4 py-6 md:py-12 md:px-8 lg:px-16 overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-32 h-32 bg-amber-200 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-orange-200 rounded-full blur-3xl"></div>
        </div>
        
        {/* Subtle dot pattern overlay */}
        <div className="absolute inset-0 opacity-8">
          <div className="w-full h-full" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(245, 101, 101, 0.08) 1px, transparent 0)`,
            backgroundSize: '30px 30px'
          }}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left - Logo and Copyright */}
            <div className="space-y-4">
              <div className="text-2xl font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 bg-clip-text text-transparent">
                {translations.title}
              </div>
              <p className="text-gray-600">
                © 2025 {translations.title} - {translations.allRightsReserved}
              </p>
            </div>

            {/* Right - Navigation */}
            <div className="flex flex-wrap gap-6 md:justify-end">
              {NAVIGATION_ITEMS.map((item) => {
                // Skip conditional items if they shouldn't be shown
                if (item.conditional && item.labelKey === 'dailyUpdates' && !hasUpdates) {
                  return null
                }
                
                return (
                  <a 
                    key={item.href} 
                    href={item.href} 
                    className="text-gray-600 hover:text-amber-600 transition-colors duration-300"
                  >
                    {translations[item.labelKey]}
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      </footer>

      <GalleryGrid
        isOpen={isGalleryGridOpen}
        onClose={closeGalleryGrid}
        images={galleryImages}
        onImageClick={openSingleImage}
        currentYear={selectedYear}
        onYearChange={openGalleryGrid}
      />

      <SingleImageModal
        isOpen={isSingleImageOpen}
        onClose={closeSingleImage}
        image={galleryImages[currentImageIndex]}
        currentIndex={currentImageIndex}
        totalImages={galleryImages.length}
        onNavigate={navigateSingleImage}
      />


    </div>
  )
}



export default function Home() {
  return (
    <UpdatesProvider>
      <LanguageProvider>
        <HomeContent />
      </LanguageProvider>
    </UpdatesProvider>
  )
}
