'use client'

import { useCallback, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { DONATION_PAYMENT_INFO, formatPhone } from '@/lib/donation'
import DonationForm from './DonationForm'

// QR resolution order:
//   'file'      → public/donation-qr.png, the QR exported from your payment app
//   'generated' → /api/donation/qr, built from NEXT_PUBLIC_DONATION_UPI_ID
//   'none'      → neither is available; show the donation number instead
const QR_SOURCES = { file: 'file', generated: 'generated', none: 'none' }

/** A copyable payment detail row (UPI ID / Donation Number). */
const CopyableDetail = ({ label, value, copyValue }) => {
  const { translations } = useLanguage()
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(copyValue ?? value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      // Clipboard access needs a secure context; the value stays selectable.
      console.error('Copy failed:', error)
    }
  }, [copyValue, value])

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-white/70">{label}</p>
        <p className="truncate text-base font-semibold text-white sm:text-lg">{value}</p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="flex flex-shrink-0 items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/30"
        aria-label={`${translations.donationCopy} ${label}`}
      >
        {copied ? (
          <>
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {translations.donationCopied}
          </>
        ) : (
          <>
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2v-2M8 5a2 2 0 002 2h4a2 2 0 002-2M8 5a2 2 0 012-2h4a2 2 0 012 2m2 5h2a2 2 0 012 2v2"
              />
            </svg>
            {translations.donationCopy}
          </>
        )}
      </button>
    </div>
  )
}

const DonationStep = ({ number, children }) => (
  <li className="flex items-start gap-3">
    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
      {number}
    </span>
    <span className="text-sm leading-relaxed text-white/90">{children}</span>
  </li>
)

export default function DonationSection() {
  const { translations } = useLanguage()
  const [qrSource, setQrSource] = useState(QR_SOURCES.file)

  const { upiId, phone } = DONATION_PAYMENT_INFO
  const hasPaymentDetails = Boolean(upiId || phone)

  // Fall back one step at a time as each QR source fails to load.
  const handleQrError = useCallback(() => {
    setQrSource((current) =>
      current === QR_SOURCES.file && upiId ? QR_SOURCES.generated : QR_SOURCES.none
    )
  }, [upiId])

  const qrImageSrc =
    qrSource === QR_SOURCES.file
      ? DONATION_PAYMENT_INFO.qrImagePath
      : qrSource === QR_SOURCES.generated
        ? '/api/donation/qr'
        : null

  return (
    <section id="donation" className="bg-gradient-to-b from-[#FDFCFA] to-orange-50/40 px-4 py-16 md:px-8 md:py-24 lg:px-12">
      <div className="mx-auto max-w-[85rem]">
        {/* Section heading */}
        <div className="mb-10 text-center md:mb-14">
          <div className="mb-5 inline-block rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700">
            {translations.donationTag}
          </div>
          <h2 className="mb-4 text-3xl font-bold md:text-4xl lg:text-5xl">
            <span className="bg-gradient-to-r from-[#782A0F] to-[#DE4E1C] bg-clip-text text-transparent">
              {translations.donationTitle}
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-gray-600 md:text-lg">
            {translations.donationDescription}
          </p>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-10">
          {/* Payment Information */}
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#8B4513] via-[#A0522D] to-[#CD5C5C] p-6 shadow-xl md:p-8">
            <h3 className="mb-5 text-xl font-bold text-white md:text-2xl">
              {translations.donationPaymentInfoTitle}
            </h3>

            {/* QR code */}
            <div className="mb-6 flex flex-col items-center">
              {qrImageSrc ? (
                <>
                  <div className="rounded-2xl bg-white p-3 shadow-lg">
                    <img
                      key={qrImageSrc}
                      src={qrImageSrc}
                      alt={translations.donationScanInstruction}
                      onError={handleQrError}
                      className="h-48 w-48 object-contain sm:h-56 sm:w-56"
                    />
                  </div>
                  <p className="mt-3 text-center text-sm text-white/80">
                    {translations.donationScanInstruction}
                  </p>
                </>
              ) : (
                <div className="flex h-48 w-48 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/40 bg-white/10 p-4 text-center sm:h-56 sm:w-56">
                  <span className="mb-2 text-4xl" aria-hidden="true">📱</span>
                  <p className="text-xs leading-relaxed text-white/90">
                    {translations.donationQrUnavailable}
                  </p>
                </div>
              )}
            </div>

            {/* UPI ID and Donation Number */}
            {hasPaymentDetails ? (
              <div className="space-y-3">
                {upiId && <CopyableDetail label={translations.donationUpiIdLabel} value={upiId} />}
                {phone && (
                  <CopyableDetail
                    label={translations.donationNumberLabel}
                    value={formatPhone(phone)}
                    copyValue={phone}
                  />
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white/90">
                {translations.donationDetailsUnavailable}
              </div>
            )}

            {/* Instructions */}
            <div className="mt-7 border-t border-white/20 pt-6">
              <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-white/80">
                {translations.donationStepsTitle}
              </h4>
              <ol className="space-y-2.5">
                <DonationStep number="1">{translations.donationStep1}</DonationStep>
                <DonationStep number="2">{translations.donationStep2}</DonationStep>
                <DonationStep number="3">{translations.donationStep3}</DonationStep>
              </ol>
            </div>
          </div>

          {/* Donation form */}
          <DonationForm />
        </div>
      </div>
    </section>
  )
}
