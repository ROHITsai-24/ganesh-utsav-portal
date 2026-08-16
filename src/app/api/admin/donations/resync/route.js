import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { DONATION_TABLE } from '@/lib/donation'
import { appendDonationToSheet } from '@/lib/google-sheets'

// Re-sends donations that never reached the Google Sheet.
//
// The Sheet mirror runs in the background after a donation is saved, so a
// failure - a wrong shared secret, a Google outage, a missing env var - is
// invisible to the donor and only shows as a warning in the Admin panel. This
// endpoint retries those rows once the cause is fixed.

// Apps Script takes a second or two per row and serialises on its own lock,
// so rows go one at a time and in capped batches rather than all at once.
const BATCH_SIZE = 20

export const maxDuration = 60

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const authResult = verifyAdminAuth(request)
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { data: pending, error: fetchError } = await supabase
      .from(DONATION_TABLE)
      .select('*')
      .eq('synced_to_sheet', false)
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE)

    if (fetchError) {
      console.error('Donation resync fetch error:', fetchError)
      return NextResponse.json({ error: 'Failed to load donations to resync' }, { status: 500 })
    }

    if (!pending || pending.length === 0) {
      return NextResponse.json({
        success: true,
        synced: 0,
        failed: 0,
        remaining: 0,
        message: 'Every donation is already in the Google Sheet'
      })
    }

    let synced = 0
    const failures = []

    for (const donation of pending) {
      const result = await appendDonationToSheet(donation)

      if (result.synced) {
        await supabase.from(DONATION_TABLE).update({ synced_to_sheet: true }).eq('id', donation.id)
        synced += 1
      } else {
        failures.push(result.error)
      }
    }

    // Anything still unsynced after this batch, so the admin knows whether to
    // run it again rather than assuming it finished.
    const { count } = await supabase
      .from(DONATION_TABLE)
      .select('id', { count: 'exact', head: true })
      .eq('synced_to_sheet', false)

    const failed = failures.length
    if (failed > 0) {
      console.error('Donation resync failures:', failures.slice(0, 5))
    }

    return NextResponse.json({
      success: true,
      synced,
      failed,
      remaining: count ?? 0,
      // Surfaced to the admin: a repeated failure is almost always a config
      // problem, and the reason names it.
      reason: failed > 0 ? failures[0] : null,
      message: `Synced ${synced} donation${synced === 1 ? '' : 's'}` +
        (failed > 0 ? `, ${failed} still failing` : '')
    })
  } catch (error) {
    console.error('Donation resync error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
