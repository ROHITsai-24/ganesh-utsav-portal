import { NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { DONATION_PAYMENT_INFO, buildUpiPaymentUri } from '@/lib/donation'

// Fallback donation QR code.
//
// The Donation section prefers the QR exported from your own payment app at
// public/donation-qr.png. When that file is absent, the section loads this
// route, which renders a UPI QR from NEXT_PUBLIC_DONATION_UPI_ID. Generation
// is local (no external service, no network call).

const QR_OPTIONS = {
  type: 'png',
  width: 640,
  margin: 2,
  errorCorrectionLevel: 'M',
  color: { dark: '#782A0F', light: '#FFFFFF' }
}

export async function GET() {
  const upiUri = buildUpiPaymentUri({
    upiId: DONATION_PAYMENT_INFO.upiId,
    payeeName: DONATION_PAYMENT_INFO.payeeName
  })

  if (!upiUri) {
    return NextResponse.json(
      { error: 'No donation QR available. Add public/donation-qr.png or set NEXT_PUBLIC_DONATION_UPI_ID.' },
      { status: 404 }
    )
  }

  try {
    const png = await QRCode.toBuffer(upiUri, QR_OPTIONS)

    return new NextResponse(png, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400'
      }
    })
  } catch (error) {
    console.error('Donation QR generation error:', error)
    return NextResponse.json({ error: 'Could not generate the donation QR code.' }, { status: 500 })
  }
}
