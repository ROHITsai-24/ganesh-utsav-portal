'use client'

import { createContext, useContext, useState, useCallback, useMemo } from 'react'

// Language Context
const LanguageContext = createContext()

// Comprehensive translations object
const TRANSLATIONS = {
  en: {
    // Site Configuration
    title: 'Unprofessional Players',
    tagline: 'Celebrate Ganesh Chaturthi with Joy and Devotion!',
    description: "We've created this space to honor Lord Ganesha and bring the vibrant energy of the festival right to your screen. Join us in celebrating with a joyful heart and a blessed spirit!",
    ctaText: 'Guess the Ganesha Idol',
    heroImageAlt: 'Lord Ganesha - Watercolor illustration with mandala backdrop',
    
    // Navigation
    about: 'About',
    games: 'Games',
    donation: 'Donation',
    dailyUpdates: 'Daily Updates',
    
    // Game Configuration
    gameTitle: 'Ganpati Games',
    gameSubtitle: 'Play, Learn, and Win Rewards',
    gameDescription: 'Get ready for some divine fun! Our Ganpati Games section is packed with challenges designed to entertain and enlighten.',
    gameTag: 'Game 01',
    gameCardTitle: 'Guess My Ganesha',
    gameCardDescription: 'A fun festive quiz to test your eye for Bappa\'s idol, price, and height. Play, guess and see who knows Ganesha best!',
    playNow: 'Play Now',
    
    // Journey Configuration
    journeyTitle: 'Our 5-Year Devotional Journey',
    journeyDescription: 'A heartfelt collection of photos and stories chronicling a five-year journey of celebrating Ganesh Chaturthi, sharing the spirit and cherished memories of the festival.',
    ourStory: 'Our Story',
    viewAll: 'View All',
    noMemoriesYet: 'No Memories Yet',
    memoriesForYear: 'Memories for {year} will be added soon!',
    loadingMemories: 'Loading memories...',
    
    // Memory Titles and Descriptions
    memories: {
      2020: {
        title1: 'First Ganesha Idol',
        desc1: 'Our inaugural celebration',
        title2: 'Family Gathering',
        desc2: 'Loved ones coming together',
        title3: 'Prayer Ceremony',
        desc3: 'Sacred moments of devotion',
        title4: 'Festival Decorations',
        desc4: 'Beautiful traditional setup',
        title5: 'Community Celebration',
        desc5: 'Sharing joy with neighbors'
      },
      2021: {
        title1: 'Enhanced Decorations',
        desc1: 'More elaborate festival setup',
        title2: 'Cultural Programs',
        desc2: 'Music and dance performances',
        title3: 'Youth Participation',
        desc3: 'Younger generation involvement',
        title4: 'Traditional Recipes',
        desc4: 'Festival delicacies preparation',
        title5: 'Spiritual Learning',
        desc5: 'Understanding festival significance'
      },
      2022: {
        title1: 'Virtual Celebrations',
        desc1: 'Online festival participation',
        title2: 'Social Media Sharing',
        desc2: 'Connecting with global devotees',
        title3: 'Online Pujas',
        desc3: 'Digital prayer ceremonies',
        title4: 'E-Learning Sessions',
        desc4: 'Digital cultural education',
        title5: 'Global Community',
        desc5: 'International festival connections'
      },
      2023: {
        title1: 'Reunion Celebrations',
        desc1: 'Physical gatherings resume',
        title2: 'Cultural Revival',
        desc2: 'Traditional arts and crafts',
        title3: 'Community Bonding',
        desc3: 'Strengthening neighborhood ties',
        title4: 'Traditional Games',
        desc4: 'Festival entertainment activities',
        title5: 'Spiritual Growth',
        desc5: 'Deepening devotional practices'
      },
      2024: {
        title1: 'Smart Celebrations',
        desc1: 'Technology-enhanced festivals',
        title2: 'Eco-Friendly Practices',
        desc2: 'Sustainable festival approach',
        title3: 'Digital Documentation',
        desc3: 'Preserving memories digitally',
        title4: 'Global Outreach',
        desc4: 'Connecting with worldwide devotees',
        title5: 'Future Vision',
        desc5: 'Planning next year celebrations'
      }
    },
    
    // Footer
    allRightsReserved: 'All Rights Reserved.',
    
    // Loading
    loading: 'Loading...',
    
    // Language
    language: 'English',
    
    // Section Tags
    ganeshChaturthi: 'Ganesh Chaturthi 2025'
  },
  te: {
    // Site Configuration
    title: 'అన్‌ప్రొఫెషనల్ ప్లేయర్స్',
    tagline: 'గణేష్ చతుర్థిని ఆనందం మరియు భక్తితో జరుపుకోండి!',
    description: 'మేము ఈ స్థలాన్ని భగవాన్ గణేషుని గౌరవించడానికి మరియు పండుగ యొక్క శక్తివంతమైన శక్తిని మీ స్క్రీన్ వద్దకు తీసుకురావడానికి సృష్టించాము. ఆనందమైన హృదయంతో మరియు ఆశీర్వదించబడిన ఆత్మతో జరుపుకోవడానికి మమ్మలో చేరండి!',
    ctaText: 'గణేష్ విగ్రహాన్ని ఊహించండి',
    heroImageAlt: 'భగవాన్ గణేష - మండలా నేపథ్యంతో నీటి రంగుల చిత్రం',
    
    // Navigation
    about: 'మా గురించి',
    games: 'ఆటలు',
    donation: 'దానం',
    dailyUpdates: 'రోజువారీ నవీకరణలు',
    
    // Game Configuration
    gameTitle: 'గణపతి ఆటలు',
    gameSubtitle: 'ఆడండి, నేర్చుకోండి మరియు బహుమతులు గెలవండి',
    gameDescription: 'కొంత దైవిక వినోదానికి సిద్ధంగా ఉండండి! మా గణపతి ఆటల విభాగం వినోదించడానికి మరియు ప్రకాశవంతంగా చేయడానికి రూపొందించబడిన సవాళ్లతో నిండి ఉంది.',
    gameTag: 'ఆట 01',
    gameCardTitle: 'నా గణేషుని ఊహించండి',
    gameCardDescription: 'బప్పా విగ్రహం, ధర మరియు ఎత్తు కోసం మీ కంటి పరీక్ష చేయడానికి ఒక సరదా పండుగ క్విజ్. ఆడండి, ఊహించండి మరియు గణేషుని ఎవరు బాగా తెలుసుకున్నారో చూడండి!',
    playNow: 'ఇప్పుడు ఆడండి',
    
    // Journey Configuration
    journeyTitle: 'మా 5-సంవత్సరాల భక్తి ప్రయాణం',
    journeyDescription: 'గణేష్ చతుర్థిని జరుపుకోవడం, పండుగ యొక్క ఆత్మ మరియు ప్రియమైన జ్ఞాపకాలను పంచుకోవడం యొక్క ఐదు సంవత్సరాల ప్రయాణాన్ని వర్ణించే ఫోటోలు మరియు కథల యొక్క హృదయపూర్వకమైన సేకరణ.',
    ourStory: 'మా కథ',
    viewAll: 'అన్నీ చూడండి',
    noMemoriesYet: 'ఇంకా జ్ఞాపకాలు లేవు',
    memoriesForYear: '{year} కోసం జ్ఞాపకాలు త్వరలో జోడించబడతాయి!',
    loadingMemories: 'జ్ఞాపకాలు లోడ్ అవుతున్నాయి...',
    
    // Memory Titles and Descriptions
    memories: {
      2020: {
        title1: 'మొదటి గణేష విగ్రహం',
        desc1: 'మా ప్రారంభ వేడుక',
        title2: 'కుటుంబ సమావేశం',
        desc2: 'ప్రియమైనవారు కలిసి రావడం',
        title3: 'ప్రార్థనా వేడుక',
        desc3: 'భక్తి యొక్క పవిత్రమైన క్షణాలు',
        title4: 'పండుగ అలంకారాలు',
        desc4: 'అందమైన సాంప్రదాయ ఏర్పాటు',
        title5: 'సమాజ వేడుక',
        desc5: 'పొరుగువారితో ఆనందాన్ని పంచుకోవడం'
      },
      2021: {
        title1: 'మెరుగైన అలంకారాలు',
        desc1: 'మరింత వివరణాత్మకమైన పండుగ ఏర్పాటు',
        title2: 'సాంస్కృతిక కార్యక్రమాలు',
        desc2: 'సంగీతం మరియు నృత్య ప్రదర్శనలు',
        title3: 'యువత పాల్గొనడం',
        desc3: 'కొత్త తరం పాల్గొనడం',
        title4: 'సాంప్రదాయ వంటకాలు',
        desc4: 'పండుగ రుచికరమైన వంటకాల తయారీ',
        title5: 'ఆధ్యాత్మిక అభ్యాసం',
        desc5: 'పండుగ యొక్క ప్రాముఖ్యతను అర్థం చేసుకోవడం'
      },
      2022: {
        title1: 'వర్చువల్ వేడుకలు',
        desc1: 'ఆన్లైన్ పండుగ పాల్గొనడం',
        title2: 'సామాజిక మాధ్యమ షేరింగ్',
        desc2: 'ప్రపంచ భక్తులతో కనెక్ట్ అవ్వడం',
        title3: 'ఆన్లైన్ పూజలు',
        desc3: 'డిజిటల్ ప్రార్థనా వేడుకలు',
        title4: 'ఇ-లెర్నింగ్ సెషన్లు',
        desc4: 'డిజిటల్ సాంస్కృతిక విద్య',
        title5: 'ప్రపంచ సమాజం',
        desc5: 'అంతర్జాతీయ పండుగ కనెక్షన్లు'
      },
      2023: {
        title1: 'మళ్లీ కలుసుకోవడం వేడుకలు',
        desc1: 'భౌతిక సమావేశాలు మళ్లీ ప్రారంభం',
        title2: 'సాంస్కృతిక పునరుజ్జీవం',
        desc2: 'సాంప్రదాయ కళలు మరియు చేతి వృత్తులు',
        title3: 'సమాజ బంధం',
        desc3: 'పొరుగు సంబంధాలను బలపరచడం',
        title4: 'సాంప్రదాయ ఆటలు',
        desc4: 'పండుగ వినోద కార్యక్రమాలు',
        title5: 'ఆధ్యాత్మిక పెరుగుదల',
        desc5: 'భక్తి పద్ధతులను లోతు చేయడం'
      },
      2024: {
        title1: 'స్మార్ట్ వేడుకలు',
        desc1: 'టెక్నాలజీ-అధిగమించిన పండుగలు',
        title2: 'పర్యావరణ స్నేహపూర్వక పద్ధతులు',
        desc2: 'స్థిరమైన పండుగ విధానం',
        title3: 'డిజిటల్ డాక్యుమెంటేషన్',
        desc3: 'జ్ఞాపకాలను డిజిటల్గా పరిరక్షించడం',
        title4: 'ప్రపంచ పరిధి',
        desc4: 'ప్రపంచవ్యాప్త భక్తులతో కనెక్ట్ అవ్వడం',
        title5: 'భవిష్యత్ దృష్టి',
        desc5: 'తదుపరి సంవత్సర వేడుకలను ప్లాన్ చేయడం'
      }
    },
    
    // Footer
    allRightsReserved: 'అన్ని హక్కులు రక్షించబడ్డాయి.',
    
    // Loading
    loading: 'లోడ్ అవుతోంది...',
    
    // Language
    language: 'తెలుగు',
    
    // Section Tags
    ganeshChaturthi: 'గణేష్ చతుర్థి 2025'
  }
}

// Language Provider Component
export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en')
  
  const toggleLanguage = useCallback(() => {
    setLanguage(prev => prev === 'en' ? 'te' : 'en')
  }, [])
  
  const value = useMemo(() => ({
    language,
    toggleLanguage,
    translations: TRANSLATIONS[language]
  }), [language, toggleLanguage])
  
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

// Hook to use language context
export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}

// Export translations for direct access if needed
export { TRANSLATIONS }
