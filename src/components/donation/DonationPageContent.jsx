'use client'

import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import DonationSection from './DonationSection'

// The donation page is the Donation section on its own URL, wrapped in the
// same header and footer as the rest of the site. The section itself is
// unchanged, so /donation and the old in-page section look identical.

export default function DonationPageContent() {
  return (
    <div className="min-h-screen bg-[#FDFCFA]">
      <SiteHeader />
      <DonationSection />
      <SiteFooter />
    </div>
  )
}
