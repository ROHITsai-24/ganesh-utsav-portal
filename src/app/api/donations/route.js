import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  DONATION_ERROR_MESSAGES_EN,
  DONATION_OPTIONS,
  DONATION_STORAGE_BUCKET,
  DONATION_TABLE,
  normalizePhone,
  validateDonation,
  validateScreenshot
} from '@/lib/donation'
import { appendDonationToSheet } from '@/lib/google-sheets'

// Public endpoint: receives a donation from the Hero Donation section, stores
// it in Supabase (source of truth) and mirrors it into the Google Sheet.

const DONATIONS_CONFIG = {
  errors: {
    invalidSubmission: 'Please correct the highlighted fields.',
    failedToUpload: 'Could not upload the payment screenshot. Please try again.',
    failedToSave: 'Could not save your donation. Please try again.',
    internalError: 'Something went wrong. Please try again.'
  },
  success: {
    saved: 'Thank you! Your donation details have been recorded.'
  },
  status: {
    badRequest: 400,
    internalError: 500
  }
}

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/** Maps validation error keys to English text for the API response. */
const toMessages = (errors) =>
  Object.fromEntries(
    Object.entries(errors).map(([field, key]) => [field, DONATION_ERROR_MESSAGES_EN[key] || key])
  )

const uploadScreenshot = async (file, donationOption) => {
  if (!file || typeof file.arrayBuffer !== 'function' || file.size === 0) {
    return { url: null }
  }

  // Only an Already Paid donation can carry proof of a completed payment.
  if (donationOption !== DONATION_OPTIONS.alreadyPaid) {
    return { url: null }
  }

  const extension = (file.name?.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
  const objectPath = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extension || 'jpg'}`
  const bytes = new Uint8Array(await file.arrayBuffer())

  const { error } = await supabase.storage
    .from(DONATION_STORAGE_BUCKET)
    .upload(objectPath, bytes, {
      contentType: file.type || 'image/jpeg',
      upsert: false
    })

  if (error) {
    console.error('Donation screenshot upload error:', error)
    return { error }
  }

  const { data } = supabase.storage.from(DONATION_STORAGE_BUCKET).getPublicUrl(objectPath)
  return { url: data?.publicUrl || null }
}

export async function POST(request) {
  try {
    const formData = await request.formData()

    const values = {
      donationOption: formData.get('donationOption'),
      name: formData.get('name'),
      phone: formData.get('phone'),
      amount: formData.get('amount'),
      paymentDate: formData.get('paymentDate')
    }

    // graceDays: 1 because the server clock may sit in a different timezone
    // than the donor, and a legitimate "today" must not be rejected.
    const { valid, errors } = validateDonation(values, { graceDays: 1 })

    const screenshot = formData.get('screenshot')
    const screenshotError = validateScreenshot(
      screenshot && typeof screenshot.arrayBuffer === 'function' && screenshot.size > 0 ? screenshot : null
    )
    if (screenshotError) {
      errors.screenshot = screenshotError
    }

    if (!valid || screenshotError) {
      return NextResponse.json(
        { error: DONATIONS_CONFIG.errors.invalidSubmission, fieldErrors: toMessages(errors) },
        { status: DONATIONS_CONFIG.status.badRequest }
      )
    }

    const upload = await uploadScreenshot(screenshot, values.donationOption)
    if (upload.error) {
      return NextResponse.json(
        { error: DONATIONS_CONFIG.errors.failedToUpload },
        { status: DONATIONS_CONFIG.status.internalError }
      )
    }

    const { data: donation, error: insertError } = await supabase
      .from(DONATION_TABLE)
      .insert([
        {
          status: values.donationOption,
          name: String(values.name).trim(),
          phone: normalizePhone(values.phone),
          amount: Number(values.amount),
          payment_date: values.paymentDate,
          screenshot_url: upload.url
        }
      ])
      .select()
      .single()

    if (insertError) {
      console.error('Donation insert error:', insertError)
      return NextResponse.json(
        { error: DONATIONS_CONFIG.errors.failedToSave },
        { status: DONATIONS_CONFIG.status.internalError }
      )
    }

    // Mirror into the Google Sheet. A failure here is recorded on the row so
    // the Admin can see it, but the donation itself is already safe.
    const sheetResult = await appendDonationToSheet(donation)
    if (sheetResult.synced) {
      await supabase
        .from(DONATION_TABLE)
        .update({ synced_to_sheet: true })
        .eq('id', donation.id)
    } else {
      console.error('Google Sheet sync failed:', sheetResult.error)
    }

    return NextResponse.json({
      success: true,
      message: DONATIONS_CONFIG.success.saved,
      donation: {
        id: donation.id,
        status: donation.status,
        name: donation.name,
        amount: donation.amount,
        paymentDate: donation.payment_date
      },
      sheetSynced: sheetResult.synced
    })
  } catch (error) {
    console.error('Donation submission error:', error)
    return NextResponse.json(
      { error: DONATIONS_CONFIG.errors.internalError },
      { status: DONATIONS_CONFIG.status.internalError }
    )
  }
}
