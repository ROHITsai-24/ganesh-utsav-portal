'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'

export default function LanguageToggle() {
  const { languageInfo, toggleLanguage } = useLanguage()
  
  return (
    <Button
      onClick={toggleLanguage}
      variant="ghost"
      size="sm"
      className="text-gray-700 hover:text-[#8B4513] hover:bg-gray-100 transition-all duration-200 px-3 py-1 rounded-lg border border-gray-200 bg-white/90 backdrop-blur-sm"
      aria-label={`Switch to ${languageInfo.nextLanguageName}`}
    >
      <span className="text-sm font-medium">
        {languageInfo.nextLanguageName}
      </span>
    </Button>
  )
}
