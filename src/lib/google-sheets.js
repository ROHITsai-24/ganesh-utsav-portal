// Mirrors every donation into the configured Google Sheet.
//
// The Sheet is written through a Google Apps Script Web App (see
// docs/DONATION_SETUP.md) so no Google API client library or service-account
// key is needed. Supabase remains the source of truth; the Sheet is a live
// backup, so a sync failure is logged and reported but never fails the
// donor's submission.

import { DONATION_OPTION_LABELS, formatPhone } from '@/lib/donation'

const SHEET_SYNC_TIMEOUT_MS = 10000

/** Column order must match the header row created by the Apps Script. */
export const buildSheetRow = (donation) => ({
  submittedAt: donation.created_at || new Date().toISOString(),
  donationOption: DONATION_OPTION_LABELS[donation.status] || donation.status,
  name: donation.name,
  phone: formatPhone(donation.phone),
  // Sent as a number, not the string Supabase returns for a numeric column, so
  // the amount column in the Sheet can be summed and sorted.
  amount: Number(donation.amount),
  paymentDate: donation.payment_date,
  recordId: donation.id
})

/**
 * Appends a donation to the Google Sheet.
 * @returns {Promise<{ synced: boolean, error?: string }>} never throws.
 */
export const appendDonationToSheet = async (donation) => {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL
  const sharedSecret = process.env.GOOGLE_SHEETS_SHARED_SECRET || ''

  if (!webhookUrl) {
    return { synced: false, error: 'GOOGLE_SHEETS_WEBHOOK_URL is not configured' }
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      // Apps Script rejects preflighted content types; text/plain keeps the
      // request simple while e.postData.contents still carries our JSON.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ secret: sharedSecret, donation: buildSheetRow(donation) }),
      signal: AbortSignal.timeout(SHEET_SYNC_TIMEOUT_MS),
      redirect: 'follow'
    })

    const rawBody = await response.text()

    if (!response.ok) {
      return { synced: false, error: `Sheet responded ${response.status}: ${rawBody.slice(0, 200)}` }
    }

    // The Apps Script replies with JSON; anything else means the deployment is
    // misconfigured (most often a Google sign-in page because the Web App is
    // not shared with "Anyone").
    let payload
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return { synced: false, error: 'Sheet returned a non-JSON response. Check the Web App access setting.' }
    }

    if (!payload?.success) {
      return { synced: false, error: payload?.error || 'Sheet rejected the row' }
    }

    return { synced: true }
  } catch (error) {
    const reason = error?.name === 'TimeoutError'
      ? `Sheet did not respond within ${SHEET_SYNC_TIMEOUT_MS}ms`
      : error?.message || 'Unknown Google Sheets error'
    return { synced: false, error: reason }
  }
}
