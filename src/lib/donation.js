// Shared donation configuration, validation and formatting.
// Used by both the Hero Donation section (client) and the donation API routes
// (server) so a submission is validated the same way in both places.

// The two donation options offered in the Hero Donation section
export const DONATION_OPTIONS = {
  alreadyPaid: 'already_paid',
  planningToPay: 'planning_to_pay'
}

export const DONATION_OPTION_VALUES = [
  DONATION_OPTIONS.alreadyPaid,
  DONATION_OPTIONS.planningToPay
]

// English labels for the two options (used by the Admin panel, CSV and Sheet)
export const DONATION_OPTION_LABELS = {
  [DONATION_OPTIONS.alreadyPaid]: 'Already Paid',
  [DONATION_OPTIONS.planningToPay]: 'Planning to Pay'
}

export const DONATION_LIMITS = {
  nameMin: 2,
  nameMax: 80,
  amountMin: 1,
  amountMax: 1000000
}

// Payment details shown next to the QR code. NEXT_PUBLIC_ so the Hero section
// can render them without an extra round trip.
export const DONATION_PAYMENT_INFO = {
  upiId: process.env.NEXT_PUBLIC_DONATION_UPI_ID || '',
  payeeName: process.env.NEXT_PUBLIC_DONATION_PAYEE_NAME || 'Unprofessional Players',
  transactionNote:
    process.env.NEXT_PUBLIC_DONATION_PAYMENT_NOTE || 'Ganesh Utsav Donation - Unprofessional Players',
  phone: process.env.NEXT_PUBLIC_DONATION_PHONE || '',
  // Preferred: a QR exported from your own payment app. The Donation section
  // falls back to a generated QR (/api/donation/qr) when this file is absent.
  qrImagePath: '/donation-qr.png'
}

export const DONATION_TABLE = 'donations'

// Error keys are resolved to Telugu/English in the UI via the language context,
// and to English on the server via DONATION_ERROR_MESSAGES_EN below.
export const DONATION_ERROR_MESSAGES_EN = {
  donationOptionRequired: 'Please choose a donation option.',
  nameRequired: 'Please enter your name.',
  nameTooShort: 'Name must be at least 2 characters.',
  nameTooLong: 'Name must be 80 characters or less.',
  phoneRequired: 'Please enter your phone number.',
  phoneInvalid: 'Enter a valid 10-digit mobile number.',
  amountRequired: 'Please enter the donation amount.',
  amountInvalid: 'Enter a valid amount greater than 0.',
  amountTooLarge: 'Amount looks too large. Please check and try again.',
  paymentDateRequired: 'Please select the payment date.',
  paymentDateFuture: 'Payment date cannot be in the future.',
  plannedDateRequired: 'Please select the planned payment date.',
  plannedDatePast: 'Planned payment date cannot be in the past.'
}

/**
 * Reduces any user-entered phone number to a bare 10-digit Indian mobile
 * number: "+91 98765 43210", "098765 43210" and "9876543210" all normalize
 * to "9876543210".
 */
export const normalizePhone = (raw) =>
  String(raw ?? '')
    .replace(/\D/g, '')
    .replace(/^0+/, '')
    .replace(/^91(?=\d{10}$)/, '')

export const isValidPhone = (raw) => /^[6-9]\d{9}$/.test(normalizePhone(raw))

/** Formats a normalized phone number for display: "+91 98765 43210" */
export const formatPhone = (raw) => {
  const digits = normalizePhone(raw)
  if (digits.length !== 10) return String(raw ?? '')
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`
}

/** Today as a YYYY-MM-DD string in the viewer's own timezone. */
export const todayISODate = () => {
  const now = new Date()
  const offsetMs = now.getTimezoneOffset() * 60 * 1000
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10)
}

const isISODate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ''))

/**
 * Validates a donation submission.
 *
 * @param {object} values         - { donationOption, name, phone, amount, paymentDate }
 * @param {object} [options]
 * @param {number} [options.graceDays=0] - Days of slack allowed on the date
 *   bounds. The server passes 1 because it may run in a different timezone
 *   than the donor, and a legitimate "today" must not be rejected as
 *   past/future.
 * @returns {{ valid: boolean, errors: Record<string, string> }} errors are
 *   keyed by field name and hold an error key from DONATION_ERROR_MESSAGES_EN.
 */
export const validateDonation = (values, options = {}) => {
  const { graceDays = 0 } = options
  const errors = {}

  const donationOption = values?.donationOption
  if (!DONATION_OPTION_VALUES.includes(donationOption)) {
    errors.donationOption = 'donationOptionRequired'
  }

  const name = String(values?.name ?? '').trim()
  if (!name) {
    errors.name = 'nameRequired'
  } else if (name.length < DONATION_LIMITS.nameMin) {
    errors.name = 'nameTooShort'
  } else if (name.length > DONATION_LIMITS.nameMax) {
    errors.name = 'nameTooLong'
  }

  const phone = String(values?.phone ?? '').trim()
  if (!phone) {
    errors.phone = 'phoneRequired'
  } else if (!isValidPhone(phone)) {
    errors.phone = 'phoneInvalid'
  }

  const rawAmount = String(values?.amount ?? '').trim()
  const amount = Number(rawAmount)
  if (!rawAmount) {
    errors.amount = 'amountRequired'
  } else if (!Number.isFinite(amount) || amount <= 0) {
    errors.amount = 'amountInvalid'
  } else if (amount > DONATION_LIMITS.amountMax) {
    errors.amount = 'amountTooLarge'
  }

  const paymentDate = String(values?.paymentDate ?? '').trim()
  const isAlreadyPaid = donationOption === DONATION_OPTIONS.alreadyPaid

  if (!isISODate(paymentDate)) {
    errors.paymentDate = isAlreadyPaid ? 'paymentDateRequired' : 'plannedDateRequired'
  } else {
    const today = todayISODate()
    const shift = (isoDate, days) => {
      const shifted = new Date(`${isoDate}T00:00:00Z`)
      shifted.setUTCDate(shifted.getUTCDate() + days)
      return shifted.toISOString().slice(0, 10)
    }

    if (isAlreadyPaid && paymentDate > shift(today, graceDays)) {
      // An Already Paid donation cannot have been paid in the future.
      errors.paymentDate = 'paymentDateFuture'
    } else if (!isAlreadyPaid && paymentDate < shift(today, -graceDays)) {
      // A Planning to Pay donation cannot be scheduled in the past.
      errors.paymentDate = 'plannedDatePast'
    }
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

/** Builds the `upi://` payload used by the donation QR code and Android UPI intent. */
export const buildUpiPaymentUri = ({ upiId, payeeName, transactionNote }) => {
  if (!upiId) return null

  // Built by hand rather than with URLSearchParams: `@` is a legal query
  // character and several UPI apps fail to decode a percent-encoded VPA, while
  // URLSearchParams would also encode spaces in the payee name as `+`, which
  // some apps render verbatim. encodeURIComponent gives %20 instead.
  const params = [`pa=${String(upiId).trim()}`, 'cu=INR']
  if (payeeName) params.push(`pn=${encodeURIComponent(String(payeeName).trim())}`)
  if (transactionNote) params.push(`tn=${encodeURIComponent(String(transactionNote).trim())}`)

  return `upi://pay?${params.join('&')}`
}

/**
 * Renders a YYYY-MM-DD date as "15 August 2026".
 *
 * A native date input shows mm/dd/yyyy or dd/mm/yyyy depending on the
 * browser's locale, which is genuinely ambiguous, so the form echoes the
 * chosen date in words underneath the field.
 */
export const formatLongDate = (isoDate) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(isoDate ?? ''))) return ''

  // Parsed as UTC and formatted in UTC so the displayed day always matches the
  // string the user picked, whatever their timezone.
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  })
}

export const formatAmount = (amount) => {
  const value = Number(amount)
  if (!Number.isFinite(value)) return '-'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(value)
}
