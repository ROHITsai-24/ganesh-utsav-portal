import DonationPageContent from '@/components/donation/DonationPageContent'

// Server component so the page can carry its own share metadata: the donation
// link is meant to be shared directly, and should preview as the donation page
// rather than inheriting the site-wide title.
export const metadata = {
  title: 'Donation - Unprofessional Players',
  description:
    'Support our Ganesh Utsav. Pay with the QR code or donation number, then share your donation details with us.',
  openGraph: {
    title: 'Donation - Unprofessional Players',
    description:
      'Support our Ganesh Utsav. Pay with the QR code or donation number, then share your donation details with us.',
    type: 'website',
    siteName: 'Unprofessional Players - Ganesh Chaturthi',
    images: [
      {
        url: '/ganesha.png',
        width: 1200,
        height: 630,
        alt: 'Support our Ganesh Utsav'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Donation - Unprofessional Players',
    description:
      'Support our Ganesh Utsav. Pay with the QR code or donation number, then share your donation details with us.',
    images: ['/ganesha.png']
  }
}

export default function DonationPage() {
  return <DonationPageContent />
}
