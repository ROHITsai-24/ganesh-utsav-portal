'use client'

import { createContext, useContext, useState, useCallback, useMemo } from 'react'

const LanguageContext = createContext()

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}

// Translation data - all text in both languages
const TRANSLATIONS = {
  en: {
    // Navigation
    nav: {
      home: 'Home',
      about: 'About',
      donation: 'Donation',
      dailyUpdates: 'Daily Updates',
      games: 'Games'
    },
    
    // Hero Section
    hero: {
      celebrate: 'Celebrate',
      ganeshChaturthi: 'Ganesh Chaturthi',
      remaining: 'with devotion and joy',
      subtitle: 'Join us in celebrating the festival of Lord Ganesha with traditional rituals, cultural programs, and spiritual activities.',
      playNow: 'Play Now'
    },
    
    // Ganpati Games Section
    games: {
      title: 'Ganpati Games',
      subtitle: 'Play, Learn and Win',
      description: 'Experience the joy of gaming while learning about our rich cultural heritage. Challenge yourself with our specially designed games.',
      guessGame: 'Guess the Ganesha Idol',
      guessDescription: 'Test your knowledge about Ganesha idols and win exciting prizes.',
      puzzleGame: 'Puzzle Challenge',
      puzzleDescription: 'Solve the puzzle and reveal the beautiful Ganesha image.',
      playNow: 'Play Now',
      playNowButton: 'Play Now'
    },
    
    // 5 Year Journey Section
    journey: {
      title: 'Our 5-Year Journey',
      description: 'A heartfelt collection of photos and stories chronicling a five-year journey of celebrating Ganesh Chaturthi, sharing the spirit and cherished memories of the festival.',
      ourStory: 'Our Story',
      years: {
        2020: '2020',
        2021: '2021',
        2022: '2022',
        2023: '2023',
        2024: '2024'
      }
    },
    
    // Daily Updates Section
    updates: {
      title: 'Daily Updates',
      subtitle: 'Stay connected with the latest news and announcements',
      noUpdates: 'No updates available at the moment.',
      refresh: 'Refresh',
      loading: 'Loading updates...'
    },
    
    // Footer
    footer: {
      title: 'Ganesh Chaturthi Celebration',
      description: 'Celebrating the festival of wisdom, prosperity, and good fortune.',
      copyright: '© 2024 Ganesh Chaturthi. All rights reserved.',
      viewAll: 'View All'
    },
    
    // Common texts
    common: {
      loading: 'Loading...',
      loadingMemories: 'Loading memories...',
      noMemoriesYet: 'No Memories Yet',
      memoriesForYear: 'Memories for {year} will be added soon!'
    }
  },
  
  te: {
    // Navigation
    nav: {
      home: 'హోమ్',
      about: 'మా గురించి',
      donation: 'దానం',
      dailyUpdates: 'రోజువారీ నవీకరణలు',
      games: 'ఆటలు'
    },
    
    // Hero Section
    hero: {
      celebrate: 'ఆచరించండి',
      ganeshChaturthi: 'గణేష్ చతుర్థి',
      remaining: 'భక్తితో మరియు ఆనందంతో',
      subtitle: 'సాంప్రదాయ ఆచారాలు, సాంస్కృతిక కార్యక్రమాలు మరియు ఆధ్యాత్మిక కార్యక్రమాలతో లార్డ్ గణేష్ పండుగను ఆచరించడంలో మాతో చేరండి.',
      playNow: 'ఇప్పుడు ఆడండి'
    },
    
    // Ganpati Games Section
    games: {
      title: 'గణపతి ఆటలు',
      subtitle: 'ఆడండి, నేర్చుకోండి మరియు గెలవండి',
      description: 'మా సంపన్న సాంస్కృతిక వారసత్వం గురించి తెలుసుకోవడంతో ఆటల ఆనందాన్ని అనుభవించండి. మా ప్రత్యేకంగా రూపొందించిన ఆటలతో మీరేమైనా సవాలు చేయండి.',
      guessGame: 'గణేష్ విగ్రహాన్ని ఊహించండి',
      guessDescription: 'గణేష్ విగ్రహాల గురించి మీ జ్ఞానాన్ని పరీక్షించండి మరియు ఉత్తేజకరమైన బహుమతులను గెలవండి.',
      puzzleGame: 'పజిల్ సవాలు',
      puzzleDescription: 'పజిల్ని పరిష్కరించండి మరియు అందమైన గణేష్ చిత్రాన్ని వెల్లడించండి.',
      playNow: 'ఇప్పుడు ఆడండి',
      playNowButton: 'ఇప్పుడు ఆడండి'
    },
    
    // 5 Year Journey Section
    journey: {
      title: 'మా 5 సంవత్సరాల ప్రయాణం',
      description: 'గణేష్ చతుర్థిని ఆచరించే ఐదు సంవత్సరాల ప్రయాణంలో ఫోటోలు మరియు కథల సంపన్నమైన సేకరణ, పండుగ యొక్క ఆత్మ మరియు ప్రియమైన జ్ఞాపకాలను పంచుకోవడం.',
      ourStory: 'మా కథ',
      years: {
        2020: '2020',
        2021: '2021',
        2022: '2022',
        2023: '2023',
        2024: '2024'
      }
    },
    
    // Daily Updates Section
    updates: {
      title: 'రోజువారీ నవీకరణలు',
      subtitle: 'తాజా వార్తలు మరియు ప్రకటనలతో కనెక్ట్‌గా ఉండండి',
      noUpdates: 'ప్రస్తుతం నవీకరణలు అందుబాటులో లేవు.',
      refresh: 'రిఫ్రెష్',
      loading: 'నవీకరణలు లోడ్ అవుతున్నాయి...'
    },
    
    // Footer
    footer: {
      title: 'గణేష్ చతుర్థి వేడుక',
      description: 'జ్ఞానం, సంపద మరియు మంచి అదృష్టం యొక్క పండుగను ఆచరించడం.',
      copyright: '© 2024 గణేష్ చతుర్థి. అన్ని హక్కులు రక్షించబడ్డాయి.',
      viewAll: 'అన్నీ చూడండి'
    },
    
    // Common texts
    common: {
      loading: 'లోడ్ అవుతున్నది...',
      loadingMemories: 'జ్ఞాపకాలు లోడ్ అవుతున్నాయి...',
      noMemoriesYet: 'ఇంకా జ్ఞాపకాలు లేవు',
      memoriesForYear: '{year} సంవత్సరానికి జ్ఞాపకాలు త్వరలో జోడించబడతాయి!'
    }
  }
}

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en')
  
  // Toggle between languages
  const toggleLanguage = useCallback(() => {
    setCurrentLanguage(prev => prev === 'en' ? 'te' : 'en')
  }, [])
  
  // Get translation for a specific key path
  const t = useCallback((keyPath) => {
    const keys = keyPath.split('.')
    let value = TRANSLATIONS[currentLanguage]
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key]
      } else {
        console.warn(`Translation key not found: ${keyPath} for language: ${currentLanguage}`)
        return keyPath // Fallback to key path if translation not found
      }
    }
    
    return value || keyPath
  }, [currentLanguage])
  
  // Get current language info
  const languageInfo = useMemo(() => ({
    current: currentLanguage,
    isEnglish: currentLanguage === 'en',
    isTelugu: currentLanguage === 'te',
    nextLanguage: currentLanguage === 'en' ? 'te' : 'en',
    nextLanguageName: currentLanguage === 'en' ? 'తెలుగు' : 'English'
  }), [currentLanguage])
  
  const value = {
    currentLanguage,
    languageInfo,
    t,
    toggleLanguage,
    setLanguage: setCurrentLanguage
  }
  
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}
