'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { useUpdates } from '@/contexts/UpdatesContext'
import { NAVIGATION_ITEMS } from '@/lib/navigation'
import BrandLogo from '@/components/common/BrandLogo'

// Shared site footer. Markup is unchanged from the original home page footer,
// extracted so the home page and the donation page stay identical.

export default function SiteFooter() {
  const { translations } = useLanguage()
  const { hasUpdates } = useUpdates()

  return (
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
            <div className="flex items-center gap-3">
              <BrandLogo className="h-10 w-10" />
              <div className="text-2xl font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 bg-clip-text text-transparent">
                {translations.title}
              </div>
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
  )
}
